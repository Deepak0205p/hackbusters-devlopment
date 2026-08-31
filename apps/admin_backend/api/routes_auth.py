import time
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from apps.admin_backend.core.auth_manager import (
    authenticate_user,
    register_user,
    list_all_users,
    delete_user_by_id
)

router = APIRouter(prefix="/api/auth", tags=["On-Premise Sovereign Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "operator"
    full_name: Optional[str] = None
    department: Optional[str] = None

@router.post("/login")
async def api_login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid on-premise credentials.")
    return {
        "status": "SUCCESS",
        "user": user,
        "token": f"sovereign-token-{user['username']}-{int(time.time())}"
    }

@router.post("/register")
async def api_register(req: RegisterRequest):
    try:
        user = register_user(
            username=req.username,
            password=req.password,
            role=req.role or "operator",
            full_name=req.full_name,
            department=req.department
        )
        return {
            "status": "SUCCESS",
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

@router.get("/users")
async def api_list_users():
    users = list_all_users()
    return {
        "status": "SUCCESS",
        "total": len(users),
        "users": users
    }

@router.delete("/users/{user_id}")
async def api_delete_user(user_id: int):
    deleted = delete_user_by_id(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "status": "SUCCESS",
        "message": f"User {user_id} deleted."
    }
