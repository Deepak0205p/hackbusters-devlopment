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
from fastapi import FastAPI
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
    get_db,
    InvalidCertificateException,
    CertificateRevokedException,
    LDAPAuthFailedException
)
from apps.admin_backend.sovereignty.tamper_log import audit_log

# Create test app with auth router
app = FastAPI(title="MRPL Sovereign Auth Test Gateway")
app.include_router(auth_router)

# ==============================================================================
# HELPER: IN-MEMORY X.509 CRYPTOGRAPHIC TEST FIXTURES
# ==============================================================================
def generate_test_ca(common_name: str = "MRPL Test Root CA") -> Tuple[rsa.RSAPrivateKey, x509.Certificate]:
    """Generates a test X.509 Root CA keypair and self-signed certificate."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "MRPL"),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Refinery Security CA"),
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
    """Generates an X.509 client certificate signed by the specified CA."""
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
# MAIN TEST SUITE
# ==============================================================================
def test_enterprise_auth_pki_live():
    print("=" * 75)
    print("  MRPL SOVEREIGN WORKBENCH - ENTERPRISE PKI, LDAP & RBAC LIVE TEST SUITE")
    print("=" * 75)

    client = TestClient(app)

    # --------------------------------------------------------------------------
    # 1. TEST VALID SMARTCARD / PKI CLIENT CERTIFICATE AUTHENTICATION
    # --------------------------------------------------------------------------
    print("\n--- [1] HARDWARE SMARTCARD / X.509 PKI VALIDATION & ROLE DEDUCTION ---")
    root_key = pki_validator.root_ca_key or rsa.generate_private_key(public_exponent=65537, key_size=2048)
    root_cert = pki_validator.root_ca

    # Generate valid client certificate for Executive HSE Admin
    _, valid_cert, valid_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Sanjay Kumar",
        ou="Executive HSE & Audit",
        valid_days=90
    )

    # Call /api/v1/auth/cert-login
    res_pki = client.post("/api/v1/auth/cert-login", json={"certificate_pem": valid_pem})
    print(f"POST /api/v1/auth/cert-login Status: {res_pki.status_code}")
    data_pki = res_pki.json()
    print(f"  • Auth Method: {data_pki.get('auth_method')}")
    print(f"  • User: {data_pki.get('user', {}).get('common_name')} ({data_pki.get('user', {}).get('username')})")
    print(f"  • Role Mapped: {data_pki.get('user', {}).get('role')}")
    print(f"  • Cert Serial: {data_pki.get('user', {}).get('serial_number')}")
    print(f"  • Issued JWT Token: {data_pki.get('token', '')[:30]}...")

    assert res_pki.status_code == 200
    assert data_pki["status"] == "SUCCESS"
    assert data_pki["auth_method"] == "PKI_SMARTCARD"
    assert data_pki["user"]["role"] == "SUPER_ADMIN"
    assert "rag:reindex_global" in data_pki["permissions"]
    super_admin_token = data_pki["token"]

    # Test /api/v1/auth/me with the issued JWT
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {super_admin_token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["user"]["role"] == "SUPER_ADMIN"
    print(f"  • Verified /api/v1/auth/me for SUPER_ADMIN -> Active Permissions: {len(me_data['permissions'])}")

    # --------------------------------------------------------------------------
    # 2. TEST DIRECT MTLS HEADER AUTHENTICATION (X-SSL-Client-Cert)
    # --------------------------------------------------------------------------
    print("\n--- [2] DIRECT MTLS REVERSE PROXY HEADER AUTHENTICATION ---")
    _, mtls_cert, mtls_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Rajesh Verma",
        ou="Process Engineering",
        valid_days=60
    )
    res_mtls_me = client.get("/api/v1/auth/me", headers={"X-SSL-Client-Cert": mtls_pem})
    print(f"GET /api/v1/auth/me with X-SSL-Client-Cert: {res_mtls_me.status_code}")
    assert res_mtls_me.status_code == 200
    mtls_data = res_mtls_me.json()
    assert mtls_data["user"]["role"] == "PROCESS_LEAD"
    assert "deliverables:export" in mtls_data["permissions"]
    print(f"  • Direct mTLS identity extracted: {mtls_data['user']['username']} (Role: {mtls_data['user']['role']})")

    # --------------------------------------------------------------------------
    # 3. TEST EXPIRED CERTIFICATE REJECTION
    # --------------------------------------------------------------------------
    print("\n--- [3] EXPIRED CERTIFICATE REJECTION ---")
    _, exp_cert, exp_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Old Operator",
        ou="Refinery Operations",
        expired=True
    )
    res_exp = client.post("/api/v1/auth/cert-login", json={"certificate_pem": exp_pem})
    print(f"POST /api/v1/auth/cert-login (Expired): {res_exp.status_code} -> {res_exp.json()['detail']}")
    assert res_exp.status_code == 401
    assert "EXPIRED" in res_exp.json()["detail"].upper()

    # --------------------------------------------------------------------------
    # 4. TEST UNTRUSTED / FORGED CA CERTIFICATE REJECTION
    # --------------------------------------------------------------------------
    print("\n--- [4] UNTRUSTED / ROGUE CA SIGNATURE REJECTION ---")
    rogue_ca_key, rogue_ca_cert = generate_test_ca(common_name="Attacker Rogue CA")
    _, rogue_cert, rogue_pem = generate_client_cert(
        ca_key=rogue_ca_key,
        ca_cert=rogue_ca_cert,
        common_name="Intruder",
        ou="Refinery Security"
    )
    res_rogue = client.post("/api/v1/auth/cert-login", json={"certificate_pem": rogue_pem})
    print(f"POST /api/v1/auth/cert-login (Rogue CA): {res_rogue.status_code} -> {res_rogue.json()['detail']}")
    assert res_rogue.status_code == 401
    assert "VERIFICATION FAILED" in res_rogue.json()["detail"].upper() or "UNTRUSTED" in res_rogue.json()["detail"].upper()

    # --------------------------------------------------------------------------
    # 5. TEST CERTIFICATE REVOCATION & CRL ENFORCEMENT
    # --------------------------------------------------------------------------
    print("\n--- [5] CERTIFICATE REVOCATION (CRL) & BLACKLIST ENFORCEMENT ---")
    _, rev_cert, rev_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Compromised Badge",
        ou="Refinery Security"
    )
    rev_serial = hex(rev_cert.serial_number)[2:].upper()

    # Verify initially valid
    res_init = client.post("/api/v1/auth/cert-login", json={"certificate_pem": rev_pem})
    assert res_init.status_code == 200
    print(f"  • Pre-revocation login success for serial {rev_serial}")

    # Revoke certificate via Admin CRL API
    res_revoke = client.post(
        "/api/v1/auth/crl/revoke",
        json={"serial_number": rev_serial, "reason": "SmartCard Hardware Lost in Tank Farm Area"},
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert res_revoke.status_code == 200
    print(f"  • Revocation API Response: {res_revoke.json()['message']}")

    # Attempt login again with revoked certificate -> expect 401
    res_post_rev = client.post("/api/v1/auth/cert-login", json={"certificate_pem": rev_pem})
    print(f"POST /api/v1/auth/cert-login (Post-Revocation): {res_post_rev.status_code} -> {res_post_rev.json()['detail']}")
    assert res_post_rev.status_code == 401
    assert "REVOKED" in res_post_rev.json()["detail"].upper()

    # Check CRL Status API
    res_crl_stat = client.get("/api/v1/auth/crl/status", headers={"Authorization": f"Bearer {super_admin_token}"})
    assert res_crl_stat.status_code == 200
    crl_info = res_crl_stat.json()["crl_data"]
    print(f"  • CRL Active Revoked Count: {crl_info['total_revoked_certificates']}")
    assert crl_info["total_revoked_certificates"] >= 1

    # --------------------------------------------------------------------------
    # 6. TEST MOCKED ENTERPRISE LDAP / ACTIVE DIRECTORY BINDING
    # --------------------------------------------------------------------------
    print("\n--- [6] ENTERPRISE INTRANET LDAP / AD BINDING & GROUP MAPPING ---")
    
    # Mock LDAP response to test Active Directory group resolution
    mock_entry = MagicMock()
    mock_entry.entry_dn = "CN=Anita Desai,OU=Process,DC=mrpl,DC=co,DC=in"
    mock_entry.memberOf = ["CN=MRPL_PROCESS_LEADS,OU=Security Groups,DC=mrpl,DC=co,DC=in"]
    mock_entry.displayName = "Anita Desai"
    mock_entry.department = "Process Engineering Division"
    mock_entry.mail = "anita.desai@mrpl.co.in"

    with patch("apps.admin_backend.core.auth_manager.Connection") as mock_conn_cls:
        mock_conn_inst = MagicMock()
        mock_conn_inst.bind.return_value = True
        mock_conn_inst.entries = [mock_entry]
        mock_conn_cls.return_value = mock_conn_inst

        res_ldap = client.post(
            "/api/v1/auth/ldap-login",
            json={"username": "anita.desai", "password": "RefineryProcess2026!"}
        )
        print(f"POST /api/v1/auth/ldap-login Status: {res_ldap.status_code}")
        assert res_ldap.status_code == 200
        ldap_data = res_ldap.json()
        print(f"  • LDAP User: {ldap_data['user']['full_name']}")
        print(f"  • AD Group Resolved Role: {ldap_data['user']['role']}")
        assert ldap_data["user"]["role"] == "PROCESS_LEAD"
        assert "deliverables:export" in ldap_data["permissions"]

    # --------------------------------------------------------------------------
    # 7. TEST INDUSTRIAL RBAC ROUTE PROTECTION & PRIVILEGE ESCALATION BLOCKING
    # --------------------------------------------------------------------------
    print("\n--- [7] INDUSTRIAL RBAC ROUTE GUARDS & PRIVILEGE ESCALATION ---")
    
    # Generate Operator Token (FIELD_OPERATOR)
    _, op_cert, op_pem = generate_client_cert(
        ca_key=root_key,
        ca_cert=root_cert,
        common_name="Field Operator 101",
        ou="Refinery Operations"
    )
    res_op = client.post("/api/v1/auth/cert-login", json={"certificate_pem": op_pem})
    assert res_op.status_code == 200
    op_token = res_op.json()["token"]
    assert res_op.json()["user"]["role"] == "FIELD_OPERATOR"

    # Attempt accessing Admin-only CRL Status with Field Operator Token -> Expect 403 Forbidden
    res_unauth_crl = client.get("/api/v1/auth/crl/status", headers={"Authorization": f"Bearer {op_token}"})
    print(f"GET /api/v1/auth/crl/status (FIELD_OPERATOR): {res_unauth_crl.status_code} -> {res_unauth_crl.json()['detail']}")
    assert res_unauth_crl.status_code == 403
    assert "LACKS REQUIRED INDUSTRIAL PERMISSION" in res_unauth_crl.json()["detail"].upper() or "ACCESS DENIED" in res_unauth_crl.json()["detail"].upper()

    # Attempt accessing Admin Users List with Field Operator Token -> Expect 403 Forbidden
    res_unauth_users = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {op_token}"})
    print(f"GET /api/v1/auth/users (FIELD_OPERATOR): {res_unauth_users.status_code} -> {res_unauth_users.json()['detail']}")
    assert res_unauth_users.status_code == 403

    # Access Admin Users List with Super Admin Token -> Expect 200 OK
    res_auth_users = client.get("/api/v1/auth/users", headers={"Authorization": f"Bearer {super_admin_token}"})
    print(f"GET /api/v1/auth/users (SUPER_ADMIN): {res_auth_users.status_code} -> Total Accounts: {res_auth_users.json()['total']}")
    assert res_auth_users.status_code == 200

    # --------------------------------------------------------------------------
    # 8. TEST SESSION LOGOUT & TOKEN BLACKLISTING
    # --------------------------------------------------------------------------
    print("\n--- [8] SESSION LOGOUT & TOKEN BLACKLISTING ---")
    res_logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {op_token}"})
    assert res_logout.status_code == 200
    print(f"POST /api/v1/auth/logout -> {res_logout.json()['message']}")

    # Attempt using terminated token on /me -> Expect 401 Unauthorized
    res_rev_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {op_token}"})
    print(f"GET /api/v1/auth/me (Post-Logout): {res_rev_me.status_code} -> {res_rev_me.json()['detail']}")
    assert res_rev_me.status_code == 401
    assert "TERMINATED" in res_rev_me.json()["detail"].upper() or "LOGGED OUT" in res_rev_me.json()["detail"].upper()

    # --------------------------------------------------------------------------
    # 9. VERIFY SHA-256 TAMPER-EVIDENT AUDIT TRAIL CHAIN INTEGRITY
    # --------------------------------------------------------------------------
    print("\n--- [9] CRYPTOGRAPHIC SHA-256 TAMPER AUDIT LOG CHAIN INTEGRITY ---")
    integrity = audit_log.verify_chain_integrity()
    print(f"Total Audit Blocks: {integrity['total_blocks']}")
    print(f"Head Block Hash: {integrity['head_hash']}")
    print(f"Integrity Verdict: {integrity['verdict']} (Valid: {integrity['valid']})")
    
    assert integrity["valid"] is True
    assert integrity["verdict"] == "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"
    assert integrity["total_blocks"] >= 5

    # Check recent logged audit events
    print("\nRecent Recorded Security Events:")
    for entry in audit_log.entries[-5:]:
        print(f"  • Block #{entry.index:<3} | {entry.timestamp} | {entry.event_type:<28} | Hash: {entry.current_hash[:16]}...")

    print("\n" + "=" * 75)
    print("  ALL 9 ENTERPRISE PKI, LDAP & INDUSTRIAL RBAC TESTS PASSED WITH 100% AIR-GAP INTEGRITY")
    print("=" * 75)

if __name__ == "__main__":
    test_enterprise_auth_pki_live()
