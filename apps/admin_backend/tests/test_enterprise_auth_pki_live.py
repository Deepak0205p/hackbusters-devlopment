import os
import sys
import time
import json
import datetime
from typing import Dict, Any, Tuple
from unittest.mock import patch, MagicMock

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pytest
from fastapi import FastAPI, Depends, Request
from fastapi.testclient import TestClient
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding

from apps.admin_backend.api.routes_auth import router as auth_router
from apps.admin_backend.core.auth_manager import (
    pki_validator,
    auth_manager,
    rbac_engine,
    get_current_active_user,
    require_permission,
    require_roles,
    get_db,
    InvalidCertificateException,
    CertificateRevokedException,
    LDAPAuthFailedException
)
from apps.admin_backend.sovereignty.tamper_log import audit_log

# ==============================================================================
# FASTAPI TEST APPLICATION SETUP
# ==============================================================================
app = FastAPI(title="MRPL Sovereign Auth Test Gateway")
app.include_router(auth_router)

# Protected sample endpoints for RBAC route guard verification
@app.post("/api/v1/test/reindex-global")
async def api_test_reindex(user: Dict[str, Any] = Depends(require_permission("rag:reindex_global"))):
    return {"status": "SUCCESS", "message": "Global RAG index rebuild triggered.", "user": user["username"]}

@app.post("/api/v1/test/export-deliverable")
async def api_test_export(user: Dict[str, Any] = Depends(require_permission("deliverables:export"))):
    return {"status": "SUCCESS", "message": "Engineering deliverable exported.", "user": user["username"]}

client = TestClient(app)

# ==============================================================================
# 1. EPHEMERAL CA & CLIENT CERTIFICATE CRYPTOGRAPHIC FIXTURES
# ==============================================================================
def generate_test_ca(common_name: str = "MRPL Test Root CA") -> Tuple[rsa.RSAPrivateKey, x509.Certificate]:
    """Generates a temporary X.509 Root CA keypair and self-signed certificate in memory."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Karnataka"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Mangalore"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "MRPL"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Plant Cybersecurity & Defense Infrastructure"),
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=365))
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(key, hashes.SHA256())
    )
    return key, cert

def generate_client_cert(
    ca_key: rsa.RSAPrivateKey,
    ca_cert: x509.Certificate,
    common_name: str = "Lead Operator",
    ou: str = "Refinery Operations",
    valid_days: int = 30,
    expired: bool = False
) -> Tuple[rsa.RSAPrivateKey, x509.Certificate, str]:
    """Generates a signed X.509 client certificate."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "MRPL"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, ou),
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])
    now = datetime.datetime.now(datetime.timezone.utc)
    if expired:
        not_before = now - datetime.timedelta(days=60)
        not_after = now - datetime.timedelta(days=1)
    else:
        not_before = now - datetime.timedelta(days=1)
        not_after = now + datetime.timedelta(days=valid_days)

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca_cert.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(not_before)
        .not_valid_after(not_after)
        .add_extension(
            x509.SubjectAlternativeName([
                x509.RFC822Name(f"{common_name.lower().replace(' ', '.')}@mrpl.co.in")
            ]),
            critical=False
        )
        .sign(ca_key, hashes.SHA256())
    )
    pem_str = cert.public_bytes(serialization.Encoding.PEM).decode("utf-8")
    return key, cert, pem_str

# ==============================================================================
# PYTEST INDIVIDUAL TEST CASES
# ==============================================================================
def test_case_1_valid_cert_login():
    """Test Case 1: Valid client certificate login -> Returns 200 OK + valid JWT token."""
    root_key = pki_validator.root_ca_key or rsa.generate_private_key(public_exponent=65537, key_size=2048)
    root_cert = pki_validator.root_ca

    _, valid_cert, valid_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Vikram Seth",
        ou="Executive HSE & Audit",
        valid_days=60
    )

    # 1. Login via JSON body
    res = client.post("/api/v1/auth/cert-login", json={"certificate_pem": valid_pem})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["auth_method"] == "PKI_SMARTCARD"
    assert data["user"]["role"] == "SUPER_ADMIN"
    assert "token" in data
    assert "rag:reindex_global" in data["permissions"]

    # 2. Verify identity via /api/v1/auth/me
    token = data["token"]
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["user"]["username"] == "vikram.seth"
    assert res_me.json()["user"]["role"] == "SUPER_ADMIN"

    # 3. Direct mTLS header login
    res_mtls = client.get("/api/v1/auth/me", headers={"X-SSL-Client-Cert": valid_pem})
    assert res_mtls.status_code == 200
    assert res_mtls.json()["user"]["role"] == "SUPER_ADMIN"

def test_case_2_expired_cert_rejection():
    """Test Case 2: Expired client certificate -> Returns 401 Unauthorized."""
    root_key = pki_validator.root_ca_key or rsa.generate_private_key(public_exponent=65537, key_size=2048)
    root_cert = pki_validator.root_ca

    _, exp_cert, exp_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Retired Operator",
        ou="Refinery Operations",
        expired=True
    )

    res = client.post("/api/v1/auth/cert-login", json={"certificate_pem": exp_pem})
    assert res.status_code == 401
    assert "EXPIRED" in res.json()["detail"].upper()

def test_case_3_untrusted_ca_cert_rejection():
    """Test Case 3: Untrusted certificate (signed by rogue CA) -> Returns 401 Unauthorized."""
    rogue_ca_key, rogue_ca_cert = generate_test_ca(common_name="Rogue Attacker CA")
    _, rogue_cert, rogue_pem = generate_client_cert(
        ca_key=rogue_ca_key,
        ca_cert=rogue_ca_cert,
        common_name="Adversary In Plant",
        ou="Refinery Security"
    )

    res = client.post("/api/v1/auth/cert-login", json={"certificate_pem": rogue_pem})
    assert res.status_code == 401
    assert "VERIFICATION FAILED" in res.json()["detail"].upper() or "UNTRUSTED" in res.json()["detail"].upper()

def test_case_4_revoked_cert_rejection():
    """Test Case 4: Revoked certificate -> Returns 403 Forbidden."""
    root_key = pki_validator.root_ca_key or rsa.generate_private_key(public_exponent=65537, key_size=2048)
    root_cert = pki_validator.root_ca

    _, rev_cert, rev_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Lost SmartCard",
        ou="Refinery Operations"
    )
    rev_serial = hex(rev_cert.serial_number)[2:].upper()

    # Verify initially valid
    res_init = client.post("/api/v1/auth/cert-login", json={"certificate_pem": rev_pem})
    assert res_init.status_code == 200

    # Revoke serial number
    pki_validator.revoke_certificate(serial_hex=rev_serial, reason="Badge lost in Crude Distillation Unit (CDU-1)")

    # Attempt login with revoked certificate
    res_revoked = client.post("/api/v1/auth/cert-login", json={"certificate_pem": rev_pem})
    assert res_revoked.status_code == 403
    assert "REVOKED" in res_revoked.json()["detail"].upper()

def test_case_5_rbac_route_guard_enforcement():
    """Test Case 5: Role-based route guard enforcement (FIELD_OPERATOR denied access to rag:reindex_global)."""
    root_key = pki_validator.root_ca_key or rsa.generate_private_key(public_exponent=65537, key_size=2048)
    root_cert = pki_validator.root_ca

    # 1. Issue token for FIELD_OPERATOR
    _, op_cert, op_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Ramesh Rao",
        ou="Refinery Operations"
    )
    res_op = client.post("/api/v1/auth/cert-login", json={"certificate_pem": op_pem})
    assert res_op.status_code == 200
    op_token = res_op.json()["token"]
    assert res_op.json()["user"]["role"] == "FIELD_OPERATOR"

    # FIELD_OPERATOR attempts accessing rag:reindex_global -> Expect 403 Forbidden
    res_denied = client.post("/api/v1/test/reindex-global", headers={"Authorization": f"Bearer {op_token}"})
    assert res_denied.status_code == 403
    assert "LACKS REQUIRED INDUSTRIAL PERMISSION" in res_denied.json()["detail"].upper() or "ACCESS DENIED" in res_denied.json()["detail"].upper()

    # 2. Issue token for SUPER_ADMIN
    _, admin_cert, admin_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Chief CISO",
        ou="Executive HSE & Audit"
    )
    res_admin = client.post("/api/v1/auth/cert-login", json={"certificate_pem": admin_pem})
    assert res_admin.status_code == 200
    admin_token = res_admin.json()["token"]

    # SUPER_ADMIN accesses rag:reindex_global -> Expect 200 OK
    res_allowed = client.post("/api/v1/test/reindex-global", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_allowed.status_code == 200
    assert res_allowed.json()["status"] == "SUCCESS"

def test_case_6_tamper_log_chain_integrity():
    """Test Case 6: Verify tamper log records auth events with SHA-256 chain integrity."""
    integrity = audit_log.verify_chain_integrity()
    assert integrity["valid"] is True
    assert integrity["verdict"] == "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"
    assert integrity["total_blocks"] >= 4

    # Verify that recent events contain security audit records
    events = [entry.event_type for entry in audit_log.entries]
    assert any("PKI_AUTH" in ev or "PRIVILEGE_ESCALATION" in ev or "REVOKED" in ev for ev in events)

# ==============================================================================
# MASTER RUNNER FUNCTION
# ==============================================================================
def test_enterprise_auth_pki_live():
    """Master suite runner executing all 6 test cases sequentially."""
    print("=" * 75)
    print("  MRPL SOVEREIGN WORKBENCH - ENTERPRISE PKI, LDAP & RBAC LIVE SUITE")
    print("=" * 75)

    print("\n--- [1] VALID CERTIFICATE LOGIN ---")
    test_case_1_valid_cert_login()
    print("  -> PASS: Valid SmartCard mTLS returned 200 OK and valid JWT.")

    print("\n--- [2] EXPIRED CERTIFICATE REJECTION ---")
    test_case_2_expired_cert_rejection()
    print("  -> PASS: Expired certificate rejected with 401 Unauthorized.")

    print("\n--- [3] UNTRUSTED ROGUE CA REJECTION ---")
    test_case_3_untrusted_ca_cert_rejection()
    print("  -> PASS: Rogue CA certificate rejected with 401 Unauthorized.")

    print("\n--- [4] CERTIFICATE REVOCATION (CRL) ---")
    test_case_4_revoked_cert_rejection()
    print("  -> PASS: Revoked certificate rejected with 403 Forbidden.")

    print("\n--- [5] INDUSTRIAL RBAC ROUTE GUARDS ---")
    test_case_5_rbac_route_guard_enforcement()
    print("  -> PASS: FIELD_OPERATOR denied access to reindex (403); SUPER_ADMIN granted access (200).")

    print("\n--- [6] SHA-256 TAMPER AUDIT LOG CHAIN INTEGRITY ---")
    test_case_6_tamper_log_chain_integrity()
    print("  -> PASS: Cryptographic SHA-256 hash chaining integrity mathematically verified.")

    print("\n" + "=" * 75)
    print("  ALL 6 ENTERPRISE PKI, AIR-GAPPED LDAP & RBAC TEST CASES PASSED (100%)")
    print("=" * 75)

if __name__ == "__main__":
    test_enterprise_auth_pki_live()
