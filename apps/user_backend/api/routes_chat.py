import time
import json
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from apps.shared.agent.engine import agent_engine
from apps.shared.core.router import IntelligentRouter
from apps.admin_backend.core.auth_manager import (
    create_chat_session,
    get_user_chat_sessions,
    get_chat_session_by_id,
    delete_chat_session_by_id,
    add_chat_message
)

router = APIRouter(tags=["Agent & Public Chat API"])

# In-Memory Rate Limiter for Public Chat API (Prevents DoS on Mobile/GPU Compute)
# Max 15 requests per 60 seconds per client IP
RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX_REQUESTS = 15
_ip_request_timestamps = defaultdict(list)

def _check_rate_limit(client_ip: str) -> bool:
    """Returns True if within rate limits, False if rate limited."""
    now = time.time()
    timestamps = _ip_request_timestamps[client_ip]
    # Prune old timestamps outside the sliding window
    _ip_request_timestamps[client_ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(_ip_request_timestamps[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    _ip_request_timestamps[client_ip].append(now)
    return True

class ChatMessageRequest(BaseModel):
    prompt: str = Field(..., max_length=IntelligentRouter.MAX_PROMPT_LENGTH)
    attachments: Optional[List[Dict[str, Any]]] = []
    session_id: Optional[str] = None
    username: Optional[str] = "operator"
    history: Optional[List[Dict[str, str]]] = []

class CreateSessionRequest(BaseModel):
    username: Optional[str] = "operator"
    title: Optional[str] = "New Chat"

class AppendMessageRequest(BaseModel):
    role: str
    content: str
    username: Optional[str] = "operator"
    model_id: Optional[str] = None
    routed_by: Optional[str] = None
    confidence: Optional[int] = None
    trace_steps: Optional[List[Any]] = None
    deliverable_ids: Optional[List[str]] = None

@router.websocket("/api/chat/stream")
@router.websocket("/chat/api/stream")
async def chat_stream_websocket(websocket: WebSocket):
    """
    Full-duplex streaming WebSocket for Public Chat and Admin ReAct execution.
    Mounted on both /api/chat/stream and /chat/api/stream.
    Streams:
    1. {"event": "routing", "domain": ..., "model_id": ..., "confidence": ...}
    2. {"event": "step", "step_number": ..., "step_type": ..., "content": ...}
    3. {"event": "final_answer", "content": ..., "display_model": ..., "deliverable_ids": [...]}
    """
    await websocket.accept()
    client_ip = websocket.client.host if websocket.client else "127.0.0.1"

    try:
        while True:
            raw_text = await websocket.receive_text()

            # Enforce Rate Limiting
            if not _check_rate_limit(client_ip):
                await websocket.send_json({
                    "event": "final_answer",
                    "content": "Rate limit exceeded (Maximum 15 queries per minute). Please wait a moment before sending another prompt to preserve air-gapped compute availability.",
                    "display_model": "System Rate Limiter",
                    "deliverable_ids": []
                })
                continue

            try:
                data = json.loads(raw_text)
            except Exception:
                data = {"prompt": raw_text, "attachments": []}

            raw_prompt = str(data.get("prompt", "")).strip()
            # Enforce hard length boundary to protect compute backend
            prompt = raw_prompt[:IntelligentRouter.MAX_PROMPT_LENGTH]
            attachments = data.get("attachments", [])
            role = data.get("role")
            force_refresh = bool(data.get("force_refresh", False))
            session_id = data.get("session_id")
            username = data.get("username", "operator")
            history = data.get("history", [])
            if isinstance(history, list):
                # Ensure only last 3 turns
                history = history[-3:]
            else:
                history = []

            if not prompt and not attachments:
                continue

            # Save User Message to XAMPP MySQL if session_id provided
            if session_id:
                try:
                    add_chat_message(
                        session_id=session_id,
                        role="user",
                        content=prompt,
                        username=username
                    )
                except Exception as e:
                    print(f"[CHAT_STREAM] Failed to save user msg to MySQL: {e}")

            try:
                collected_steps = []
                final_answer_frame = None

                # Stream Agent Execution Steps with Conversational History (3-turn window)
                async for event_frame in agent_engine.execute_task(
                    prompt,
                    attachments,
                    role=role,
                    force_refresh=force_refresh,
                    history=history
                ):
                    if event_frame.get("event") == "step":
                        collected_steps.append(event_frame)
                    elif event_frame.get("event") == "final_answer":
                        final_answer_frame = event_frame
                    await websocket.send_json(event_frame)

                # Save Final Agent Response to XAMPP MySQL if session_id provided
                if session_id and final_answer_frame:
                    try:
                        add_chat_message(
                            session_id=session_id,
                            role="agent",
                            content=final_answer_frame.get("content", ""),
                            model_id=final_answer_frame.get("display_model") or final_answer_frame.get("model_id"),
                            routed_by=final_answer_frame.get("routed_by"),
                            confidence=final_answer_frame.get("confidence"),
                            trace_steps=collected_steps,
                            deliverable_ids=final_answer_frame.get("deliverable_ids", []),
                            username=username
                        )
                    except Exception as e:
                        print(f"[CHAT_STREAM] Failed to save agent msg to MySQL: {e}")
            except Exception as e:
                import traceback
                traceback.print_exc()
                # Sanitized user-facing error disclosure (Zero internal path / system leak)
                await websocket.send_json({
                    "event": "final_answer",
                    "content": "An unexpected error occurred during processing. Please refine your query or verify input parameters.",
                    "display_model": "Sovereign Assistant",
                    "deliverable_ids": []
                })

    except (WebSocketDisconnect, ConnectionResetError):
        pass

@router.post("/api/chat")
@router.post("/chat/api/message")
async def execute_chat_rest(request: ChatMessageRequest, req: Request):
    """
    REST fallback endpoint for synchronous agent execution.
    Mounted on both /api/chat and /chat/api/message.
    """
    client_ip = req.client.host if req.client else "127.0.0.1"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Maximum 15 queries per minute allowed."
        )

    # Sanitize prompt length
    clean_prompt = request.prompt[:IntelligentRouter.MAX_PROMPT_LENGTH]
    clean_history = (request.history or [])[-3:]

    events = []
    try:
        async for frame in agent_engine.execute_task(clean_prompt, request.attachments, history=clean_history):
            events.append(frame)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating response."
        )

    final_frame = next((f for f in reversed(events) if f.get("event") == "final_answer"), None)
    return {
        "final_answer": final_frame["content"] if final_frame else "",
        "display_model": final_frame.get("display_model", "Sovereign Assistant") if final_frame else "",
        "deliverable_ids": final_frame.get("deliverable_ids", []) if final_frame else [],
        "trace_steps": [f for f in events if f.get("event") == "step"],
        "routing": next((f for f in events if f.get("event") == "routing"), None)
    }

# ==============================================================================
# XAMPP MYSQL CHAT STORAGE & 16-DIGIT HEX CHAT URL ENDPOINTS
# ==============================================================================

@router.post("/api/chat/sessions")
async def api_create_chat_session(req: CreateSessionRequest):
    """
    Creates a new chat session in XAMPP MySQL with a 16-digit random hex code ID.
    Returns session JSON with 16-digit hex `id`.
    """
    session = create_chat_session(
        username=req.username or "operator",
        title=req.title or "New Chat"
    )
    return {
        "status": "SUCCESS",
        "session": session
    }

@router.get("/api/chat/sessions")
async def api_list_chat_sessions(username: str = "operator"):
    """
    Lists all chat sessions for a user from XAMPP MySQL `chat_sessions` table.
    """
    sessions = get_user_chat_sessions(username=username)
    return {
        "status": "SUCCESS",
        "total": len(sessions),
        "sessions": sessions
    }

@router.get("/api/chat/sessions/{session_id}")
async def api_get_chat_session(session_id: str):
    """
    Fetches a single chat session by its 16-digit hex code ID from XAMPP MySQL.
    """
    session = get_chat_session_by_id(session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Chat session '{session_id}' not found in XAMPP MySQL database.")
    return {
        "status": "SUCCESS",
        "session": session
    }

@router.delete("/api/chat/sessions/{session_id}")
async def api_delete_chat_session(session_id: str):
    """
    Deletes a chat session and all its messages from XAMPP MySQL.
    """
    deleted = delete_chat_session_by_id(session_id=session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Chat session '{session_id}' not found.")
    return {
        "status": "SUCCESS",
        "message": f"Chat session '{session_id}' and all associated messages successfully deleted from XAMPP MySQL."
    }

@router.post("/api/chat/sessions/{session_id}/messages")
async def api_append_chat_message(session_id: str, req: AppendMessageRequest):
    """
    Appends a new message directly to an existing session in XAMPP MySQL.
    """
    session = get_chat_session_by_id(session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Chat session '{session_id}' not found.")

    msg = add_chat_message(
        session_id=session_id,
        role=req.role,
        content=req.content,
        username=req.username or "operator",
        model_id=req.model_id,
        routed_by=req.routed_by,
        confidence=req.confidence,
        trace_steps=req.trace_steps,
        deliverable_ids=req.deliverable_ids
    )

    return {
        "status": "SUCCESS",
        "message": msg
    }
