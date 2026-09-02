import asyncio
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from apps.admin_backend.sovereignty.watchdog import socket_watchdog
from apps.admin_backend.sovereignty.tamper_log import audit_log
from apps.admin_backend.models.manager import model_manager

router = APIRouter(tags=["Sovereignty & Network Watchdog"])

@router.websocket("/api/audit-stream")
async def audit_stream_websocket(websocket: WebSocket):
    """
    Continuous 1000ms WebSocket stream broadcasting 3-tier network sovereignty
    audit telemetry and GPU VRAM budget utilization.
    """
    await websocket.accept()
    try:
        while True:
            # 1. Capture Live Socket Snapshot
            sov_snapshot = socket_watchdog.scan_sockets()

            # 2. Capture Real-Time VRAM Telemetry
            vram_telemetry = model_manager.get_vram_telemetry()

            # 3. Capture Real Cryptographic SHA-256 Audit Log Blocks
            current_audit_blocks = [
                {
                    "sequence": entry.index,
                    "timestamp": entry.timestamp,
                    "event": entry.event_type,
                    "block_hash": entry.current_hash,
                    "prev_hash": entry.previous_hash,
                    "verified": entry.verified,
                    "details": entry.details
                }
                for entry in audit_log.entries[-25:]
            ]

            # 4. Construct Unified Telemetry Frame
            payload = {
                "timestamp": time.time(),
                "deployment_mode": socket_watchdog.current_deployment_mode,
                "host_ip": socket_watchdog.host_ip,
                "port": socket_watchdog.port,
                "vram": vram_telemetry.dict(),
                "sovereignty": {
                    **sov_snapshot.dict(),
                    "audit_logs": current_audit_blocks
                }
            }

            await websocket.send_json(payload)
            await asyncio.sleep(1.0)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass

@router.get("/api/sovereignty/logs")
async def get_audit_logs():
    """
    Returns real-time SHA-256 chained audit logs from tamper-evident ledger.
    """
    return {
        "success": True,
        "logs": [
            {
                "sequence": entry.index,
                "timestamp": entry.timestamp,
                "event": entry.event_type,
                "block_hash": entry.current_hash,
                "prev_hash": entry.previous_hash,
                "verified": entry.verified,
                "details": entry.details
            }
            for entry in audit_log.entries
        ]
    }

@router.get("/api/sovereignty-audit/export")
async def export_audit_certificate():
    """
    Generates and returns the cryptographically signed SHA-256 hash-chained
    air-gap verification certificate.
    """
    certificate = audit_log.export_certificate()
    return JSONResponse(
        content=certificate,
        headers={
            "Content-Disposition": "attachment; filename=sovereignty_audit_certificate.json"
        }
    )

@router.get("/api/network-status")
async def get_network_status():
    """
    Returns the resolved host connectivity configuration, active IP,
    hotspot SSID credentials, and QR connect URL.
    """
    mode = socket_watchdog.current_deployment_mode
    host_ip = socket_watchdog.host_ip
    port = socket_watchdog.port
    connect_url = f"http://{host_ip}:{port}"

    return {
        "status": "SUCCESS",
        "deployment_mode": mode,
        "host_ip": host_ip,
        "port": port,
        "connect_url": connect_url,
        "hotspot_instructions": {
            "ssid": "",
            "password": "",
            "internet_sharing": "OFF (Enforced Air-Gap)"
        },
        "qr_code_payload": connect_url
    }

@router.post("/api/network-status/mode")
async def set_network_deployment_mode(mode: str):
    """
    Switches active deployment mode (HOTSPOT_OPTION_B / LAN_OPTION_A).
    """
    try:
        new_mode = socket_watchdog.set_deployment_mode(mode)
        audit_log.append_event("DEPLOYMENT_MODE_CHANGED", f"Deployment mode changed to {new_mode}")
        return {"status": "SUCCESS", "current_mode": new_mode, "host_ip": socket_watchdog.host_ip}
    except ValueError as e:
        return JSONResponse(status_code=400, content={"status": "ERROR", "detail": str(e)})
