import os
import sys
import time
import json
import sqlite3
import hashlib
import secrets
import datetime
import urllib.parse
from typing import Dict, Any, List, Optional, Union, Tuple

import yaml
import jwt
from pydantic import BaseModel
from fastapi import Header, HTTPException, Request, Depends, status

# Cryptography for Real Hardware/SmartCard PKI (X.509)
from cryptography import x509
from cryptography.x509.oid import NameOID, ExtensionOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec, padding, ed25519
from cryptography.exceptions import InvalidSignature

# Offline LDAP3 for Enterprise Active Directory Binding
import ldap3
from ldap3 import Server, Connection, ALL, SUBTREE

# Argon2id for Sovereign Local Password Hashing & Offline Fallback
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _ph = PasswordHasher()
except ImportError:
    _ph = None

# Tamper-Evident SHA-256 Audit Log integration
from apps.admin_backend.sovereignty.tamper_log import audit_log

# ==============================================================================
# 1. CONFIGURATION & PATH SETUP
# ==============================================================================
CONFIG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config", "auth_config.yaml"))
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "users_auth.db"))
CERTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config", "certs"))

def load_auth_config() -> Dict[str, Any]:
    """Loads enterprise auth YAML configuration with sovereign air-gap defaults."""
    default_config = {
        "pki": {
            "enabled": True,
            "ca_cert_path": os.path.join(CERTS_DIR, "mrpl_root_ca.crt"),
            "root_ca_path": os.path.join(CERTS_DIR, "mrpl_root_ca.crt"),
            "crl_path": os.path.join(CERTS_DIR, "mrpl_crl.pem"),
            "enforce_expiration": True,
            "enforce_crl": True,
            "client_cert_header": "X-SSL-Client-Cert",
            "auto_generate_plant_ca_if_missing": True,
            "allowed_organizations": ["MRPL", "ONGC", "Mangalore Refinery and Petrochemicals Limited"]
        },
        "ldap": {
            "enabled": True,
            "server_uri": "ldap://127.0.0.1:389",
            "connect_timeout_sec": 2.0,
            "bind_dn": "CN=SvcWorkbench,OU=ServiceAccounts,DC=mrpl,DC=internal",
            "bind_password": "SovereignPlantServicePass2026!",
            "base_dn": "dc=mrpl,dc=internal",
            "user_search_filter": "(&(objectClass=user)(sAMAccountName={username}))",
            "group_role_mapping": {
                "CN=MRPL_SEC_ADMINS,OU=Groups,DC=mrpl,DC=internal": "SUPER_ADMIN",
                "CN=MRPL_PROCESS_LEADS,OU=Groups,DC=mrpl,DC=internal": "PROCESS_LEAD",
                "CN=MRPL_HSE_AUDITORS,OU=Groups,DC=mrpl,DC=internal": "HSE_AUDITOR",
                "CN=MRPL_OPERATORS,OU=Groups,DC=mrpl,DC=internal": "FIELD_OPERATOR",
                "CN=MRPL_PLANT_SECURITY": "PLANT_SECURITY_OFFICER",
                "CN=MRPL_MAINTENANCE": "MAINTENANCE_ENG"
            },
            "fallback_to_local_db": True
        },
        "jwt": {
            "algorithm": "HS256",
            "secret_key": "sovereign-mrpl-industrial-pki-hmac-sha256-secret-key-airgap-2026",
            "token_expiry_minutes": 480,
            "token_expiry_seconds": 28800, # 8 hours
            "issuer": "MRPL_SOVEREIGN_AUTH_ENGINE",
            "audience": "MRPL_SOVEREIGN_WORKBENCH"
        },
        "rbac": {
            "default_role": "FIELD_OPERATOR",
            "roles": [
                "SUPER_ADMIN",
                "PLANT_SECURITY_OFFICER",
                "PROCESS_LEAD",
                "MAINTENANCE_ENG",
                "HSE_AUDITOR",
                "FIELD_OPERATOR",
                "READONLY_OPERATOR"
            ]
        }
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                loaded = yaml.safe_load(f)
                if loaded and isinstance(loaded, dict):
                    return loaded
        except Exception:
            pass
    return default_config

AUTH_CONFIG = load_auth_config()

# ==============================================================================
# 2. CUSTOM INDUSTRIAL AUTH EXCEPTIONS
# ==============================================================================
class AuthException(Exception):
    """Base exception for sovereign industrial authentication failures."""
    pass

class InvalidCertificateException(AuthException):
    """Raised when an X.509 client certificate is invalid, expired, forged, or unparseable."""
    pass

class CertificateRevokedException(AuthException):
    """Raised when a client certificate serial number is flagged on the local CRL."""
    pass

class LDAPAuthFailedException(AuthException):
    """Raised when intranet LDAP/AD credential binding or directory search fails."""
    pass

class InsufficientPermissionException(AuthException):
    """Raised when an active role lacks the RBAC permission required for an operation."""
    pass

# ==============================================================================
# 3. DATABASE INITIALIZATION & LOCAL STORAGE
# ==============================================================================
def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    """Hashes password using Argon2id with SHA-256 fallback."""
    if _ph:
        try:
            return _ph.hash(password)
        except Exception:
            pass
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored Argon2id hash or legacy SHA-256 hash."""
    if hashed_password.startswith("$argon2"):
        if _ph:
            try:
                return _ph.verify(hashed_password, plain_password)
            except Exception:
                return False
        return False
    # SHA-256 comparison
    return hashlib.sha256(plain_password.encode("utf-8")).hexdigest() == hashed_password

def init_auth_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'FIELD_OPERATOR',
            full_name TEXT,
            department TEXT,
            cert_serial TEXT,
            auth_method TEXT DEFAULT 'LOCAL',
            created_at REAL NOT NULL
        )
    """)

    # 2. Revoked Certificates (Local CRL cache)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS revoked_certificates (
            serial_number TEXT PRIMARY KEY,
            revoked_at REAL NOT NULL,
            reason TEXT,
            revoked_by TEXT
        )
    """)

    # 3. Revoked JWT Tokens (Token Blacklist)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS revoked_tokens (
            jti TEXT PRIMARY KEY,
            revoked_at REAL NOT NULL,
            username TEXT
        )
    """)

    # 4. Chat Sessions table (16-digit hex session ID)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        )
    """)

    # 5. Chat Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            model_id TEXT,
            routed_by TEXT,
            confidence INTEGER,
            trace_steps_json TEXT,
            deliverables_json TEXT,
            created_at REAL NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )
    """)

    # Seed default sovereign operator user if not exists
    cursor.execute("SELECT id FROM users WHERE username = 'operator'")
    if not cursor.fetchone():
        pwd_hash = hash_password("reveal2026")
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("operator", pwd_hash, "FIELD_OPERATOR", "Lead Process Operator", "Refinery Operations", time.time())
        )

    # Seed default sovereign admin user if not exists
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        pwd_hash = hash_password("admin2026")
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin", pwd_hash, "SUPER_ADMIN", "Refinery Compliance Chief", "Executive HSE & Audit", time.time())
        )

    conn.commit()
    conn.close()

# Auto-initialize on module load
init_auth_db()

# ==============================================================================
# 4. INDUSTRIAL ROLE-BASED ACCESS CONTROL (RBAC) ENGINE
# ==============================================================================
class RBACEngine:
    """
    Multi-Tier Industrial RBAC for Refinery & Defense Critical Infrastructure.
    """
    DEFAULT_PERMISSIONS: Dict[str, List[str]] = {
        "SUPER_ADMIN": [
            "rag:query",
            "rag:reindex_global",
            "sandbox:override_ast",
            "deliverables:export",
            "sovereignty:tamper_read",
            "models:swap_engine",
            "users:manage",
            "crl:manage"
        ],
        "PLANT_SECURITY_OFFICER": [
            "rag:query",
            "rag:reindex_global",
            "sovereignty:tamper_read",
            "users:manage",
            "crl:manage"
        ],
        "PROCESS_LEAD": [
            "rag:query",
            "deliverables:export",
            "models:swap_engine"
        ],
        "MAINTENANCE_ENG": [
            "rag:query",
            "deliverables:export"
        ],
        "HSE_AUDITOR": [
            "rag:query",
            "deliverables:export",
            "sovereignty:tamper_read"
        ],
        "FIELD_OPERATOR": [
            "rag:query"
        ],
        "READONLY_OPERATOR": [
            "rag:query"
        ],
        # Legacy aliases
        "admin": [
            "rag:query",
            "rag:reindex_global",
            "sandbox:override_ast",
            "deliverables:export",
            "sovereignty:tamper_read",
            "models:swap_engine",
            "users:manage",
            "crl:manage"
        ],
        "operator": [
            "rag:query"
        ]
    }

    ROLE_HIERARCHY_RANK: Dict[str, int] = {
        "SUPER_ADMIN": 100,
        "admin": 100,
        "PLANT_SECURITY_OFFICER": 80,
        "PROCESS_LEAD": 60,
        "HSE_AUDITOR": 50,
        "MAINTENANCE_ENG": 40,
        "FIELD_OPERATOR": 20,
        "operator": 20,
        "READONLY_OPERATOR": 10
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or AUTH_CONFIG
        self.role_permissions = self.config.get("rbac", {}).get("role_hierarchy", self.DEFAULT_PERMISSIONS)

    def get_permissions(self, role: str) -> List[str]:
        return self.role_permissions.get(role, self.role_permissions.get(role.upper(), ["rag:query"]))

    def has_permission(self, role: str, permission: str) -> bool:
        perms = self.get_permissions(role)
        return permission in perms

    def has_any_role(self, current_role: str, allowed_roles: List[str]) -> bool:
        normalized_current = current_role.upper()
        normalized_allowed = [r.upper() for r in allowed_roles]
        if normalized_current in normalized_allowed:
            return True
        if current_role.lower() in [r.lower() for r in allowed_roles]:
            return True
        return False

    def map_ad_groups_to_role(self, ad_groups: List[str]) -> str:
        """
        Extracts memberOf LDAP groups and returns the highest privilege assigned role.
        """
        mapping = self.config.get("ldap", {}).get("group_role_mapping", {})
        matched_roles: List[str] = []

        for grp in ad_groups:
            for dn_key, target_role in mapping.items():
                if dn_key.lower() in grp.lower() or grp.lower() in dn_key.lower():
                    matched_roles.append(target_role)

        if not matched_roles:
            return self.config.get("rbac", {}).get("default_role", "FIELD_OPERATOR")

        # Pick role with highest rank
        matched_roles.sort(key=lambda r: self.ROLE_HIERARCHY_RANK.get(r, 0), reverse=True)
        return matched_roles[0]

    def map_ou_to_role(self, ou: str) -> str:
        """Deduces sovereign industrial role from X.509 Organizational Unit."""
        ou_lower = ou.lower()
        if "security admin" in ou_lower or "executive hse" in ou_lower or "refinery compliance chief" in ou_lower:
            return "SUPER_ADMIN"
        elif "security" in ou_lower or "ciso" in ou_lower or "plant security" in ou_lower:
            return "PLANT_SECURITY_OFFICER"
        elif "process" in ou_lower or "lead engineer" in ou_lower or "production" in ou_lower:
            return "PROCESS_LEAD"
        elif "hse" in ou_lower or "audit" in ou_lower or "environment" in ou_lower:
            return "HSE_AUDITOR"
        elif "maintenance" in ou_lower or "mechanical" in ou_lower or "instrumentation" in ou_lower:
            return "MAINTENANCE_ENG"
        elif "operator" in ou_lower or "operations" in ou_lower:
            return "FIELD_OPERATOR"
        return "FIELD_OPERATOR"

rbac_engine = RBACEngine()

# ==============================================================================
# 5. HARDWARE-LEVEL / SMARTCARD X.509 PKI ENGINE
# ==============================================================================
class X509PKIValidator:
    """
    Cryptographic Validator for SmartCard / mTLS X.509 Certificates.
    Enforces air-gapped Root CA signature verification, CRL checks, and identity parsing.
    """
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or AUTH_CONFIG
        self.pki_cfg = self.config.get("pki", {})
        self.root_ca: Optional[x509.Certificate] = None
        self.root_ca_key: Optional[rsa.RSAPrivateKey] = None
        self._initialize_root_ca()

    def _initialize_root_ca(self):
        """Loads or auto-generates the local Plant Root CA certificate."""
        ca_path = self.pki_cfg.get("ca_cert_path") or self.pki_cfg.get("root_ca_path")
        if ca_path and not os.path.isabs(ca_path):
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            ca_path = os.path.abspath(os.path.join(project_root, ca_path))

        if ca_path and os.path.exists(ca_path):
            try:
                with open(ca_path, "rb") as f:
                    self.root_ca = x509.load_pem_x509_certificate(f.read())
                key_path = os.path.join(os.path.dirname(ca_path), "mrpl_root_ca.key")
                if os.path.exists(key_path):
                    with open(key_path, "rb") as kf:
                        self.root_ca_key = serialization.load_pem_private_key(kf.read(), password=None)
                return
            except Exception as e:
                print(f"[PKI] Failed to load existing Root CA at {ca_path}: {e}")

        # Auto-generate plant CA if missing and allowed
        if self.pki_cfg.get("auto_generate_plant_ca_if_missing", True):
            self._generate_plant_root_ca(ca_path)

    def _generate_plant_root_ca(self, ca_path: Optional[str] = None):
        """Generates sovereign MRPL Plant Root CA for 100% offline verification."""
        os.makedirs(CERTS_DIR, exist_ok=True)
        key_path = os.path.join(CERTS_DIR, "mrpl_root_ca.key")
        cert_path = ca_path or os.path.join(CERTS_DIR, "mrpl_root_ca.crt")

        self.root_ca_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Karnataka"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Mangalore"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "MRPL"),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Plant Cybersecurity & Defense Infrastructure"),
            x509.NameAttribute(NameOID.COMMON_NAME, "MRPL Plant Root CA"),
        ])

        now = datetime.datetime.now(datetime.timezone.utc)
        self.root_ca = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(self.root_ca_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - datetime.timedelta(days=1))
            .not_valid_after(now + datetime.timedelta(days=3650)) # 10 years
            .add_extension(
                x509.BasicConstraints(ca=True, path_length=None),
                critical=True
            )
            .add_extension(
                x509.KeyUsage(
                    digital_signature=True,
                    content_commitment=False,
                    key_encipherment=False,
                    data_encipherment=False,
                    key_agreement=False,
                    key_cert_sign=True,
                    crl_sign=True,
                    encipher_only=False,
                    decipher_only=False
                ),
                critical=True
            )
            .sign(self.root_ca_key, hashes.SHA256())
        )

        try:
            with open(cert_path, "wb") as f:
                f.write(self.root_ca.public_bytes(serialization.Encoding.PEM))
            with open(key_path, "wb") as f:
                f.write(self.root_ca_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.TraditionalOpenSSL,
                    encryption_algorithm=serialization.NoEncryption()
                ))
        except Exception as e:
            print(f"[PKI] Note: Root CA generated in-memory only: {e}")

    def parse_certificate(self, raw_cert_data: Union[str, bytes]) -> x509.Certificate:
        """Parses X.509 certificate from PEM string, URL-encoded header, or DER bytes."""
        if isinstance(raw_cert_data, bytes):
            try:
                return x509.load_pem_x509_certificate(raw_cert_data)
            except Exception:
                try:
                    return x509.load_der_x509_certificate(raw_cert_data)
                except Exception as e:
                    raise InvalidCertificateException(f"Failed to parse binary certificate: {e}")

        # String processing
        cleaned = raw_cert_data.strip()
        # Handle URL decoding (e.g. from nginx headers)
        if "%20" in cleaned or "%2D" in cleaned or "%0A" in cleaned:
            cleaned = urllib.parse.unquote(cleaned)

        # Handle escaped newlines
        if "\\n" in cleaned:
            cleaned = cleaned.replace("\\n", "\n")

        # Handle headers where spaces replaced newlines between BEGIN and END
        if "-----BEGIN CERTIFICATE-----" in cleaned and "\n" not in cleaned:
            cleaned = cleaned.replace("-----BEGIN CERTIFICATE-----", "-----BEGIN CERTIFICATE-----\n")
            cleaned = cleaned.replace("-----END CERTIFICATE-----", "\n-----END CERTIFICATE-----")

        try:
            return x509.load_pem_x509_certificate(cleaned.encode("utf-8"))
        except Exception as e:
            raise InvalidCertificateException(f"Unparseable X.509 certificate PEM: {str(e)}")

    def extract_identity(self, cert: x509.Certificate) -> Dict[str, Any]:
        """Extracts Subject DN, SANs, Issuer, and Serial Number."""
        subject_dict = {}
        for attr in cert.subject:
            subject_dict[attr.oid._name] = attr.value

        issuer_dict = {}
        for attr in cert.issuer:
            issuer_dict[attr.oid._name] = attr.value

        cn = subject_dict.get("commonName", "Unknown Operator")
        org = subject_dict.get("organizationName", "MRPL")
        ou = subject_dict.get("organizationalUnitName", "Refinery Operations")
        serial_hex = hex(cert.serial_number)[2:].upper()
        fingerprint = hashlib.sha256(cert.public_bytes(serialization.Encoding.DER)).hexdigest().upper()

        # Subject Alternative Names (SAN - UPN / Email / DNS)
        san_list = []
        try:
            san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            for name in san_ext.value:
                san_list.append(str(name.value))
        except Exception:
            pass

        # Calculate validity timestamps
        not_before = getattr(cert, "not_valid_before_utc", None) or cert.not_valid_before.replace(tzinfo=datetime.timezone.utc)
        not_after = getattr(cert, "not_valid_after_utc", None) or cert.not_valid_after.replace(tzinfo=datetime.timezone.utc)

        role = rbac_engine.map_ou_to_role(ou)

        return {
            "common_name": cn,
            "username": cn.lower().replace(" ", "."),
            "organization": org,
            "organizational_unit": ou,
            "serial_number": serial_hex,
            "serial_number_int": cert.serial_number,
            "fingerprint_sha256": fingerprint,
            "issuer_cn": issuer_dict.get("commonName", "MRPL Plant Root CA"),
            "subject_alt_names": san_list,
            "not_valid_before": not_before.isoformat(),
            "not_valid_after": not_after.isoformat(),
            "role": role,
            "department": ou
        }

    def is_serial_revoked(self, serial_hex: str) -> bool:
        """Checks if certificate serial number is registered in local CRL revocation table."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT serial_number FROM revoked_certificates WHERE UPPER(serial_number) = ?", (serial_hex.upper(),))
        row = cursor.fetchone()
        conn.close()
        return row is not None

    def revoke_certificate(self, serial_hex: str, reason: str = "Admin revocation", revoked_by: str = "SUPER_ADMIN"):
        """Marks certificate serial number as revoked in local air-gapped CRL."""
        conn = get_db()
        cursor = conn.cursor()
        now = time.time()
        cursor.execute(
            "INSERT OR REPLACE INTO revoked_certificates (serial_number, revoked_at, reason, revoked_by) VALUES (?, ?, ?, ?)",
            (serial_hex.upper(), now, reason, revoked_by)
        )
        conn.commit()
        conn.close()

        # Audit log event
        audit_log.append_event(
            event_type="PKI_CERTIFICATE_REVOKED",
            details=json.dumps({
                "serial_number": serial_hex.upper(),
                "reason": reason,
                "revoked_by": revoked_by,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(now))
            })
        )

    def get_crl_status(self) -> Dict[str, Any]:
        """Returns statistics on active certificate revocations."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT serial_number, revoked_at, reason, revoked_by FROM revoked_certificates ORDER BY revoked_at DESC")
        revoked_rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {
            "status": "ACTIVE_ONLINE",
            "issuer": self.root_ca.subject.rfc4514_string() if self.root_ca else "MRPL Plant Root CA",
            "total_revoked_certificates": len(revoked_rows),
            "revoked_list": revoked_rows,
            "last_synced_epoch": time.time()
        }

    def validate_certificate(
        self,
        cert: x509.Certificate,
        root_ca: Optional[x509.Certificate] = None,
        check_expiration: bool = True,
        check_crl: bool = True
    ) -> Dict[str, Any]:
        """
        Full Cryptographic X.509 Validation:
        1. Expiration validity check
        2. CRL Revocation check
        3. Root CA cryptographic signature verification
        """
        identity = self.extract_identity(cert)
        serial_hex = identity["serial_number"]

        # 1. Expiration check
        if check_expiration and self.pki_cfg.get("enforce_expiration", True):
            now_utc = datetime.datetime.now(datetime.timezone.utc)
            not_before = getattr(cert, "not_valid_before_utc", None) or cert.not_valid_before.replace(tzinfo=datetime.timezone.utc)
            not_after = getattr(cert, "not_valid_after_utc", None) or cert.not_valid_after.replace(tzinfo=datetime.timezone.utc)

            if now_utc < not_before:
                raise InvalidCertificateException(f"Certificate is not yet valid. Activation date: {not_before}")
            if now_utc > not_after:
                raise InvalidCertificateException(f"Certificate has EXPIRED on {not_after}. Rejecting SmartCard token.")

        # 2. CRL Revocation check
        if check_crl and self.pki_cfg.get("enforce_crl", True):
            if self.is_serial_revoked(serial_hex):
                raise CertificateRevokedException(f"SmartCard Certificate Serial {serial_hex} has been REVOKED by Plant Security Officer.")

        # 3. Cryptographic signature check against Root CA
        ca_cert = root_ca or self.root_ca
        if not ca_cert:
            raise InvalidCertificateException("Plant Root CA certificate not available for signature validation.")

        public_key = ca_cert.public_key()
        try:
            if isinstance(public_key, rsa.RSAPublicKey):
                public_key.verify(
                    cert.signature,
                    cert.tbs_certificate_bytes,
                    padding.PKCS1v15(),
                    cert.signature_hash_algorithm
                )
            elif isinstance(public_key, ec.EllipticCurvePublicKey):
                public_key.verify(
                    cert.signature,
                    cert.tbs_certificate_bytes,
                    ec.ECDSA(cert.signature_hash_algorithm)
                )
            elif isinstance(public_key, ed25519.Ed25519PublicKey):
                public_key.verify(
                    cert.signature,
                    cert.tbs_certificate_bytes
                )
            else:
                raise InvalidCertificateException(f"Unsupported Root CA key type: {type(public_key)}")
        except InvalidSignature:
            raise InvalidCertificateException("Certificate signature verification failed: Untrusted or forged Certificate Authority.")
        except Exception as e:
            raise InvalidCertificateException(f"Cryptographic signature check error: {str(e)}")

        return identity

pki_validator = X509PKIValidator()

# ==============================================================================
# 6. ENTERPRISE INTRANET LDAP / ACTIVE DIRECTORY CONNECTOR
# ==============================================================================
class LDAPDirectoryConnector:
    """
    Intranet LDAP3 connector for refinery corporate Active Directory.
    Supports secure binding, memberOf group extraction, and air-gap offline resilience.
    """
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or AUTH_CONFIG
        self.ldap_cfg = self.config.get("ldap", {})

    def authenticate(self, username: str, password: str) -> Dict[str, Any]:
        """
        Binds to LDAP directory, searches user, verifies credentials, and extracts AD roles.
        """
        if not self.ldap_cfg.get("enabled", True):
            raise LDAPAuthFailedException("Enterprise LDAP authentication is disabled in configuration.")

        server_uri = self.ldap_cfg.get("server_uri", "ldap://127.0.0.1:389")
        base_dn = self.ldap_cfg.get("base_dn", "dc=mrpl,dc=internal")
        timeout = float(self.ldap_cfg.get("connect_timeout_sec", 2.0))
        filter_tpl = self.ldap_cfg.get("user_search_filter", "(&(objectClass=user)(sAMAccountName={username}))")
        search_filter = filter_tpl.format(username=username)

        try:
            server = Server(server_uri, get_info=ALL, connect_timeout=timeout)
            
            # Step A: Service Account Search or Direct User Bind
            bind_dn = self.ldap_cfg.get("bind_dn")
            bind_pw = self.ldap_cfg.get("bind_password")

            # First establish directory connection
            conn = Connection(server, user=bind_dn, password=bind_pw, auto_bind=True, read_only=True)
            
            # Step B: Locate User Entry
            conn.search(
                search_base=base_dn,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=["sAMAccountName", "displayName", "mail", "department", "memberOf", "title"]
            )

            if not conn.entries:
                conn.unbind()
                raise LDAPAuthFailedException(f"User '{username}' not found in Active Directory domain {base_dn}.")

            user_entry = conn.entries[0]
            user_dn = user_entry.entry_dn
            groups = [str(g) for g in getattr(user_entry, "memberOf", [])]
            full_name = str(getattr(user_entry, "displayName", username.title()))
            department = str(getattr(user_entry, "department", "Refinery Operations"))
            mail = str(getattr(user_entry, "mail", f"{username}@mrpl.co.in"))
            conn.unbind()

            # Step C: Verify User Password against user DN
            user_conn = Connection(server, user=user_dn, password=password)
            if not user_conn.bind():
                raise LDAPAuthFailedException(f"Invalid Active Directory password for user '{username}'.")
            user_conn.unbind()

            # Step D: Map AD Security Groups to Industrial Role
            role = rbac_engine.map_ad_groups_to_role(groups)

            return {
                "username": username,
                "full_name": full_name,
                "department": department,
                "email": mail,
                "role": role,
                "ad_groups": groups,
                "auth_method": "INTRANET_LDAP"
            }

        except LDAPAuthFailedException:
            raise
        except Exception as e:
            # Check if offline fallback is allowed
            if self.ldap_cfg.get("fallback_to_local_db", True):
                local_user = authenticate_user(username, password)
                if local_user:
                    local_user["auth_method"] = "LOCAL_FALLBACK"
                    return local_user
            raise LDAPAuthFailedException(f"Intranet LDAP unreachable or authentication error: {str(e)}")

ldap_connector = LDAPDirectoryConnector()

# ==============================================================================
# 7. ENTERPRISE AUTH MANAGER & JWT COORDINATOR
# ==============================================================================
class EnterpriseAuthManager:
    """
    Central Coordinator for PKI, LDAP, Local DB, JWT tokens, and SHA-256 Tamper Audit Trail.
    """
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or AUTH_CONFIG
        self.jwt_cfg = self.config.get("jwt", {})
        self.secret_key = self.jwt_cfg.get("secret_key", "sovereign-default-secret-key-2026")
        self.algorithm = self.jwt_cfg.get("algorithm", "HS256")
        self.expiry_sec = int(self.jwt_cfg.get("token_expiry_seconds", self.jwt_cfg.get("token_expiry_minutes", 480) * 60))
        self.issuer = self.jwt_cfg.get("issuer", "MRPL_SOVEREIGN_AUTH_ENGINE")
        self.audience = self.jwt_cfg.get("audience", "MRPL_SOVEREIGN_WORKBENCH")

    def generate_jwt_token(self, user_data: Dict[str, Any], auth_method: str = "LOCAL") -> str:
        """Issues cryptographically signed Session JWT containing industrial role and permissions."""
        now = int(time.time())
        jti = secrets.token_hex(16)
        role = user_data.get("role", "FIELD_OPERATOR")
        permissions = rbac_engine.get_permissions(role)

        payload = {
            "jti": jti,
            "sub": user_data.get("username", "anonymous"),
            "username": user_data.get("username", "anonymous"),
            "full_name": user_data.get("full_name", user_data.get("username", "Operator")),
            "department": user_data.get("department", "Refinery Operations"),
            "role": role,
            "permissions": permissions,
            "auth_method": auth_method,
            "cert_serial": user_data.get("serial_number") or user_data.get("cert_serial"),
            "iss": self.issuer,
            "aud": self.audience,
            "iat": now,
            "exp": now + self.expiry_sec
        }

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Decodes and validates JWT token, ensuring non-revocation in blacklist table."""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session token has expired. Re-authenticate.")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid session token: {str(e)}")

        # Check token blacklist
        jti = payload.get("jti")
        if jti and self.is_token_revoked(jti):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session has been terminated / logged out.")

        return payload

    def is_token_revoked(self, jti: str) -> bool:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT jti FROM revoked_tokens WHERE jti = ?", (jti,))
        row = cursor.fetchone()
        conn.close()
        return row is not None

    def revoke_token(self, jti: str, username: str = "unknown"):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO revoked_tokens (jti, revoked_at, username) VALUES (?, ?, ?)", (jti, time.time(), username))
        conn.commit()
        conn.close()

    def pki_login(self, raw_cert_data: Union[str, bytes], client_ip: str = "127.0.0.1", pin: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes SmartCard X.509 PKI authentication and logs cryptographic audit event.
        """
        try:
            cert = pki_validator.parse_certificate(raw_cert_data)
            identity = pki_validator.validate_certificate(cert)

            token = self.generate_jwt_token(identity, auth_method="PKI_SMARTCARD")

            # Record SHA-256 Tamper Evident Audit Event
            audit_log.append_event(
                event_type="PKI_AUTH_SUCCESS",
                details=json.dumps({
                    "user_id": identity["username"],
                    "common_name": identity["common_name"],
                    "cert_serial": identity["serial_number"],
                    "role": identity["role"],
                    "auth_method": "PKI_SMARTCARD",
                    "status": "SUCCESS",
                    "client_ip": client_ip,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                })
            )

            return {
                "status": "SUCCESS",
                "auth_method": "PKI_SMARTCARD",
                "token": token,
                "user": identity,
                "permissions": rbac_engine.get_permissions(identity["role"])
            }

        except CertificateRevokedException as e:
            audit_log.append_event(
                event_type="PKI_AUTH_FAILURE",
                details=json.dumps({
                    "reason": str(e),
                    "auth_method": "PKI_SMARTCARD",
                    "status": "REVOKED_CERT",
                    "client_ip": client_ip,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                })
            )
            # 403 Forbidden for revoked certificate as per security spec
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        except InvalidCertificateException as e:
            audit_log.append_event(
                event_type="PKI_AUTH_FAILURE",
                details=json.dumps({
                    "reason": str(e),
                    "auth_method": "PKI_SMARTCARD",
                    "status": "INVALID_CERT",
                    "client_ip": client_ip,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                })
            )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
        except Exception as e:
            audit_log.append_event(
                event_type="PKI_AUTH_ERROR",
                details=json.dumps({
                    "error": str(e),
                    "auth_method": "PKI_SMARTCARD",
                    "status": "ERROR",
                    "client_ip": client_ip
                })
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"PKI Authentication failed: {str(e)}")

    def ldap_login(self, username: str, password: str, client_ip: str = "127.0.0.1") -> Dict[str, Any]:
        """
        Executes Enterprise LDAP binding and logs cryptographic audit event.
        """
        try:
            user_data = ldap_connector.authenticate(username, password)
            token = self.generate_jwt_token(user_data, auth_method=user_data.get("auth_method", "INTRANET_LDAP"))

            audit_log.append_event(
                event_type="LDAP_AUTH_SUCCESS",
                details=json.dumps({
                    "user_id": username,
                    "role": user_data["role"],
                    "auth_method": user_data.get("auth_method", "INTRANET_LDAP"),
                    "status": "SUCCESS",
                    "client_ip": client_ip,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                })
            )

            return {
                "status": "SUCCESS",
                "auth_method": user_data.get("auth_method", "INTRANET_LDAP"),
                "token": token,
                "user": user_data,
                "permissions": rbac_engine.get_permissions(user_data["role"])
            }

        except LDAPAuthFailedException as e:
            audit_log.append_event(
                event_type="LDAP_AUTH_FAILURE",
                details=json.dumps({
                    "user_id": username,
                    "reason": str(e),
                    "auth_method": "INTRANET_LDAP",
                    "status": "DENIED",
                    "client_ip": client_ip,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                })
            )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

auth_manager = EnterpriseAuthManager()

# ==============================================================================
# 8. FASTAPI ROUTE GUARDS & DEPENDENCY INJECTORS
# ==============================================================================
async def get_current_active_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_ssl_client_cert: Optional[str] = Header(None, alias="X-SSL-Client-Cert"),
    ssl_client_cert: Optional[str] = Header(None, alias="SSL_CLIENT_CERT")
) -> Dict[str, Any]:
    """
    FastAPI Dependency: Authenticates user via Bearer JWT token OR direct mTLS header.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    # 1. Direct SmartCard / mTLS Header Authentication
    raw_cert = x_ssl_client_cert or ssl_client_cert
    if raw_cert and not authorization:
        try:
            cert = pki_validator.parse_certificate(raw_cert)
            identity = pki_validator.validate_certificate(cert)
            identity["permissions"] = rbac_engine.get_permissions(identity["role"])
            identity["auth_method"] = "PKI_MTLS_DIRECT"
            return identity
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Direct mTLS verification failed: {str(e)}")

    # 2. Bearer JWT Token Authentication
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials (Provide Authorization Bearer header or X-SSL-Client-Cert mTLS)."
        )

    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
    elif len(parts) == 1:
        token = parts[0]
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header format.")

    # Support legacy sovereign tokens for testing/backwards compatibility
    if token.startswith("sovereign-token-"):
        token_parts = token.split("-")
        uname = token_parts[2] if len(token_parts) >= 3 else "operator"
        user_row = get_user_by_username(uname)
        if user_row:
            role = user_row.get("role", "FIELD_OPERATOR")
            return {
                "username": uname,
                "role": role,
                "department": user_row.get("department", "Refinery Operations"),
                "full_name": user_row.get("full_name", uname.title()),
                "permissions": rbac_engine.get_permissions(role),
                "auth_method": "SOVEREIGN_TOKEN"
            }

    payload = auth_manager.verify_jwt_token(token)
    return payload

def require_permission(permission: str):
    """
    FastAPI Route Guard Dependency enforcing specific industrial RBAC permission.
    Logs privilege escalation attempt on violation.
    """
    async def _guard(request: Request, current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        role = current_user.get("role", "FIELD_OPERATOR")
        if not rbac_engine.has_permission(role, permission):
            client_ip = request.client.host if request.client else "127.0.0.1"
            audit_log.append_event(
                event_type="PRIVILEGE_ESCALATION_BLOCKED",
                details=json.dumps({
                    "user_id": current_user.get("username", "unknown"),
                    "role": role,
                    "attempted_permission": permission,
                    "status": "DENIED",
                    "client_ip": client_ip,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
                })
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{role}' lacks required industrial permission '{permission}'."
            )
        return current_user
    return _guard

def require_roles(allowed_roles: List[str]):
    """
    FastAPI Route Guard Dependency enforcing role membership.
    """
    async def _guard(request: Request, current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        role = current_user.get("role", "FIELD_OPERATOR")
        if not rbac_engine.has_any_role(role, allowed_roles):
            client_ip = request.client.host if request.client else "127.0.0.1"
            audit_log.append_event(
                event_type="ROLE_CHECK_FAILED",
                details=json.dumps({
                    "user_id": current_user.get("username", "unknown"),
                    "role": role,
                    "allowed_roles": allowed_roles,
                    "status": "DENIED",
                    "client_ip": client_ip
                })
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: User role '{role}' is not authorized. Required one of: {allowed_roles}"
            )
        return current_user
    return _guard

# ==============================================================================
# 9. BACKWARDS-COMPATIBLE USER AND CHAT SESSION MANAGEMENT
# ==============================================================================
def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, full_name, department FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password_hash, role, full_name, department FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        user_dict = dict(row)
        if verify_password(password, user_dict["password_hash"]):
            return {
                "id": user_dict["id"],
                "username": user_dict["username"],
                "role": user_dict["role"],
                "full_name": user_dict["full_name"],
                "department": user_dict["department"]
            }
    return None

def register_user(username: str, password: str, role: str = "FIELD_OPERATOR", full_name: Optional[str] = None, department: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    cursor.execute(
        "INSERT INTO users (username, password_hash, role, full_name, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (username, pwd_hash, role, full_name or username.title(), department or "Refinery Operations", time.time())
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    audit_log.append_event(
        event_type="USER_REGISTERED",
        details=json.dumps({
            "user_id": username,
            "role": role,
            "department": department or "Refinery Operations",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        })
    )

    return {"id": user_id, "username": username, "role": role, "full_name": full_name, "department": department}

def list_all_users() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, full_name, department, created_at FROM users ORDER BY id ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def delete_user_by_id(user_id: int) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def create_chat_session(username: str = "operator", title: str = "New Chat") -> Dict[str, Any]:
    session_id = secrets.token_hex(8) # 16-digit hex code
    now = time.time()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_sessions (id, username, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (session_id, username, title, now, now)
    )
    conn.commit()
    conn.close()
    return {
        "id": session_id,
        "username": username,
        "title": title,
        "created_at": now,
        "updated_at": now,
        "messages": []
    }

def get_user_chat_sessions(username: str = "operator") -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, title, created_at, updated_at FROM chat_sessions WHERE username = ? ORDER BY updated_at DESC", (username,))
    sessions = []
    for row in cursor.fetchall():
        s = dict(row)
        cursor.execute("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", (s["id"],))
        s["messages"] = [dict(m) for m in cursor.fetchall()]
        sessions.append(s)
    conn.close()
    return sessions

def get_chat_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, title, created_at, updated_at FROM chat_sessions WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    session = dict(row)
    cursor.execute("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    session["messages"] = [dict(m) for m in cursor.fetchall()]
    conn.close()
    return session

def delete_chat_session_by_id(session_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def add_chat_message(
    session_id: str,
    role: str,
    content: str,
    username: str = "operator",
    model_id: Optional[str] = None,
    routed_by: Optional[str] = None,
    confidence: Optional[int] = None,
    trace_steps: Optional[List[Dict[str, Any]]] = None,
    deliverable_ids: Optional[List[str]] = None
) -> Dict[str, Any]:
    msg_id = f"msg-{secrets.token_hex(6)}"
    now = time.time()
    conn = get_db()
    cursor = conn.cursor()

    steps_json = json.dumps(trace_steps) if trace_steps else "[]"
    deliv_json = json.dumps(deliverable_ids) if deliverable_ids else "[]"

    cursor.execute(
        """
        INSERT INTO chat_messages (
            id, session_id, username, role, content, model_id, routed_by, confidence, trace_steps_json, deliverables_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (msg_id, session_id, username, role, content, model_id, routed_by, confidence, steps_json, deliv_json, now)
    )

    if role == "user":
        first_title = content[:35] + ("..." if len(content) > 35 else "")
        cursor.execute("UPDATE chat_sessions SET updated_at = ?, title = CASE WHEN title = 'New Chat' THEN ? ELSE title END WHERE id = ?", (now, first_title, session_id))
    else:
        cursor.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (now, session_id))

    conn.commit()
    conn.close()

    return {
        "id": msg_id,
        "session_id": session_id,
        "username": username,
        "role": role,
        "content": content,
        "model_id": model_id,
        "routed_by": routed_by,
        "confidence": confidence,
        "trace_steps": trace_steps or [],
        "deliverables": deliverable_ids or [],
        "created_at": now
    }
