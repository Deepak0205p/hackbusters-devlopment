import time
import json
from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from apps.admin_backend.agent.engine import agent_engine
from apps.admin_backend.core.router import IntelligentRouter

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

            if not prompt and not attachments:
                continue

            try:
                # Stream Agent Execution Steps
                async for event_frame in agent_engine.execute_task(prompt, attachments):
                    await websocket.send_json(event_frame)
            except Exception as e:
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

    events = []
    try:
        async for frame in agent_engine.execute_task(clean_prompt, request.attachments):
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
