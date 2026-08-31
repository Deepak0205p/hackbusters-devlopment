import os
import sqlite3
import hashlib
import secrets
import time
from typing import Dict, Any, List, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "users_auth.db"))

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'operator',
            full_name TEXT,
            department TEXT,
            created_at REAL NOT NULL
        )
    """)

    # 2. Chat Sessions table (16-digit hex session ID)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL
        )
    """)

    # 3. Chat Messages table
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

    # Seed default operator user if not exists
    cursor.execute("SELECT id FROM users WHERE username = 'operator'")
    if not cursor.fetchone():
        pwd_hash = hashlib.sha256("reveal2026".encode()).hexdigest()
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("operator", pwd_hash, "operator", "Lead Process Operator", "Refinery Operations", time.time())
        )

    # Seed default admin user if not exists
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        pwd_hash = hashlib.sha256("admin2026".encode()).hexdigest()
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            ("admin", pwd_hash, "admin", "Refinery Compliance Chief", "Executive HSE & Audit", time.time())
        )

    conn.commit()
    conn.close()

# Auto-initialize on module load
init_auth_db()

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    pwd_hash = hashlib.sha256(password.encode()).hexdigest()
    cursor.execute("SELECT id, username, role, full_name, department FROM users WHERE username = ? AND password_hash = ?", (username, pwd_hash))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def register_user(username: str, password: str, role: str = "operator", full_name: Optional[str] = None, department: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db()
    cursor = conn.cursor()
    pwd_hash = hashlib.sha256(password.encode()).hexdigest()
    cursor.execute(
        "INSERT INTO users (username, password_hash, role, full_name, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (username, pwd_hash, role, full_name or username.title(), department or "Refinery Operations", time.time())
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
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
        # Fetch latest messages
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

    import json
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

    # Update session updated_at and title if first user message
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
