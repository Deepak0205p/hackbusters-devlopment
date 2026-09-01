import time
import json
from fastapi import APIRouter, HTTPException, Header, Request, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from apps.admin_backend.core.auth_manager import (
    auth_manager,
    pki_validator,
    rbac_engine,
    get_current_active_user,
    require_permission,
    require_roles,
    authenticate_user,
    register_user,
    list_all_users,
    delete_user_by_id,
    InvalidCertificateException,
    CertificateRevokedException,
    LDAPAuthFailedException
)
from apps.admin_backend.sovereignty.tamper_log import audit_log

# Router mounting both /api/auth and /api/v1/auth
router = APIRouter(tags=["On-Premise Sovereign Authentication & Industrial RBAC"])

# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================
class LoginRequest(BaseModel):
    username: str = Field(..., description="Corporate/Local username")
    password: str = Field(..., description="Account password")

class LDAPLoginRequest(BaseModel):
    username: str = Field(..., description="Active Directory sAMAccountName or userPrincipalName")
    password: str = Field(..., description="Intranet domain password")

class CertLoginRequest(BaseModel):
    certificate_pem: Optional[str] = Field(None, description="PEM encoded X.509 client certificate")
    pin: Optional[str] = Field(None, description="SmartCard hardware token PIN")

class RevokeCertRequest(BaseModel):
    serial_number: str = Field(..., description="Hex or integer certificate serial number")
    reason: Optional[str] = Field("Security Policy Violation", description="Revocation justification")

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "FIELD_OPERATOR"
    full_name: Optional[str] = None
    department: Optional[str] = None

# ==============================================================================
# 1. HARDWARE SMARTCARD / X.509 PKI mTLS LOGIN
# ==============================================================================
@router.post("/api/v1/auth/cert-login")
@router.post("/api/auth/cert-login")
async def api_cert_login(
    req: Optional[CertLoginRequest] = None,
    request: Request = None,
    x_ssl_client_cert: Optional[str] = Header(None, alias="X-SSL-Client-Cert"),
    ssl_client_cert: Optional[str] = Header(None, alias="SSL_CLIENT_CERT")
):
    """
    Hardware SmartCard / X.509 Client Certificate Authentication.
    Accepts PEM certificate in JSON body or via mTLS header (e.g., from an edge proxy).
    """
    client_ip = request.client.host if request and request.client else "127.0.0.1"
    
    raw_cert = None
    pin = None
    if req and req.certificate_pem:
        raw_cert = req.certificate_pem
        pin = req.pin
    elif x_ssl_client_cert:
        raw_cert = x_ssl_client_cert
    elif ssl_client_cert:
        raw_cert = ssl_client_cert

    if not raw_cert:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client certificate missing. Provide 'certificate_pem' in body or via 'X-SSL-Client-Cert' header."
        )

    return auth_manager.pki_login(raw_cert_data=raw_cert, client_ip=client_ip, pin=pin)

# ==============================================================================
# 2. INTRANET ACTIVE DIRECTORY / LDAP LOGIN
# ==============================================================================
@router.post("/api/v1/auth/ldap-login")
@router.post("/api/auth/ldap-login")
async def api_ldap_login(req: LDAPLoginRequest, request: Request):
    """
    Corporate Intranet LDAP / Active Directory Credential Binding.
    Extracts memberOf security groups and maps directly to Industrial RBAC roles.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    return auth_manager.ldap_login(username=req.username, password=req.password, client_ip=client_ip)

# ==============================================================================
# 3. LOCAL SOVEREIGN DB LOGIN (WITH LDAP FALLBACK)
# ==============================================================================
@router.post("/api/v1/auth/login")
@router.post("/api/auth/login")
async def api_login(req: LoginRequest, request: Request):
    """
    Sovereign local credentials login with automatic SHA-256 tamper logging and JWT issuance.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Try local database
    user = authenticate_user(req.username, req.password)
    if user:
        token = auth_manager.generate_jwt_token(user, auth_method="LOCAL_DATABASE")
        audit_log.append_event(
            event_type="LOCAL_AUTH_SUCCESS",
            details=json.dumps({
                "user_id": user["username"],
                "role": user["role"],
                "auth_method": "LOCAL_DATABASE",
                "status": "SUCCESS",
                "client_ip": client_ip,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            })
        )
        return {
            "status": "SUCCESS",
            "auth_method": "LOCAL_DATABASE",
            "user": user,
            "token": token,
            "permissions": rbac_engine.get_permissions(user.get("role", "FIELD_OPERATOR"))
        }

    # If local fails, attempt LDAP bind
    try:
        return auth_manager.ldap_login(username=req.username, password=req.password, client_ip=client_ip)
    except HTTPException:
        audit_log.append_event(
            event_type="LOCAL_AUTH_FAILURE",
            details=json.dumps({
                "user_id": req.username,
                "auth_method": "LOCAL_DATABASE",
                "status": "DENIED",
                "client_ip": client_ip,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
            })
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid on-premise credentials.")

# ==============================================================================
# 4. CURRENT IDENTITY & PERMISSIONS OBSERVATORY
# ==============================================================================
@router.get("/api/v1/auth/me")
@router.get("/api/auth/me")
async def api_get_me(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """
    Returns current authenticated identity, assigned Industrial RBAC role, and active permissions.
    """
    role = current_user.get("role", "FIELD_OPERATOR")
    return {
        "status": "SUCCESS",
        "user": {
            "username": current_user.get("username"),
            "full_name": current_user.get("full_name"),
            "department": current_user.get("department"),
            "role": role,
            "auth_method": current_user.get("auth_method", "UNKNOWN"),
            "cert_serial": current_user.get("cert_serial") or current_user.get("serial_number"),
        },
        "permissions": current_user.get("permissions") or rbac_engine.get_permissions(role)
    }

# ==============================================================================
# 5. CRL (CERTIFICATE REVOCATION LIST) STATUS & MANAGEMENT
# ==============================================================================
@router.get("/api/v1/auth/crl/status")
@router.get("/api/auth/crl/status")
async def api_crl_status(current_user: Dict[str, Any] = Depends(require_permission("crl:manage"))):
    """
    Returns local CRL revocation cache status and active revoked certificates.
    Requires 'crl:manage' permission (SUPER_ADMIN or PLANT_SECURITY_OFFICER).
    """
    return {
        "status": "SUCCESS",
        "crl_data": pki_validator.get_crl_status()
    }

@router.post("/api/v1/auth/crl/revoke")
@router.post("/api/auth/crl/revoke")
async def api_crl_revoke(
    req: RevokeCertRequest,
    current_user: Dict[str, Any] = Depends(require_permission("crl:manage"))
):
    """
    Revokes a certificate serial number across the refinery workbench.
    Requires 'crl:manage' permission.
    """
    pki_validator.revoke_certificate(
        serial_hex=req.serial_number,
        reason=req.reason or "Security Policy Violation",
        revoked_by=current_user.get("username", "SUPER_ADMIN")
    )
    return {
        "status": "SUCCESS",
        "message": f"Certificate serial {req.serial_number} successfully revoked and logged to tamper audit."
    }

# ==============================================================================
# 6. SESSION LOGOUT & TOKEN REVOCATION
# ==============================================================================
@router.post("/api/v1/auth/logout")
@router.post("/api/auth/logout")
async def api_logout(request: Request, current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """
    Terminates active session and blacklists token in sovereign revocation database.
    """
    jti = current_user.get("jti")
    username = current_user.get("username", "unknown")
    if jti:
        auth_manager.revoke_token(jti, username)

    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_log.append_event(
        event_type="AUTH_LOGOUT",
        details=json.dumps({
            "user_id": username,
            "auth_method": current_user.get("auth_method"),
            "status": "TERMINATED",
            "client_ip": client_ip,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        })
    )

    return {
        "status": "SUCCESS",
        "message": "Session terminated and token invalidated."
    }

# ==============================================================================
# 7. USER REGISTRATION & USER MANAGEMENT
# ==============================================================================
@router.post("/api/v1/auth/register")
@router.post("/api/auth/register")
async def api_register(req: RegisterRequest):
    """Registers a new local operator account."""
    try:
        user = register_user(
            username=req.username,
            password=req.password,
            role=req.role or "FIELD_OPERATOR",
            full_name=req.full_name,
            department=req.department
        )
        return {
            "status": "SUCCESS",
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.get("/api/v1/auth/users")
@router.get("/api/auth/users")
async def api_list_users(current_user: Dict[str, Any] = Depends(require_permission("users:manage"))):
    """Lists all on-premise accounts. Requires 'users:manage'."""
    users = list_all_users()
    return {
        "status": "SUCCESS",
        "total": len(users),
        "users": users
    }

@router.delete("/api/v1/auth/users/{user_id}")
@router.delete("/api/auth/users/{user_id}")
async def api_delete_user(user_id: int, current_user: Dict[str, Any] = Depends(require_permission("users:manage"))):
    """Deletes an on-premise account. Requires 'users:manage'."""
    deleted = delete_user_by_id(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "status": "SUCCESS",
        "message": f"User {user_id} deleted."
    }
