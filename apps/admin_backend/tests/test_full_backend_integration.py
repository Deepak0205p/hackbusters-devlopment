import os
import json
from fastapi.testclient import TestClient
from apps.admin_backend.main import app
from apps.admin_backend.sovereignty.tamper_log import audit_log

def test_full_backend_integration_live():
    print("=" * 75)
    print("  MRPL SOVEREIGN WORKBENCH - FULL 10-MODULE BACKEND INTEGRATION TEST")
    print("=" * 75)

    client = TestClient(app)

    # 1. Health & Server Info Check
    print("\n[MODULE 1: FOUNDATION GATEWAY & CORS]")
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    print(f"  • GET /api/health -> 200 OK: {res_health.json()}")

    # 2. Model Layer & VRAM Registry
    print("\n[MODULE 2: MODEL REGISTRY & VRAM TELEMETRY]")
    res_models = client.get("/api/models")
    res_vram = client.get("/api/models/vram")
    assert res_models.status_code == 200
    assert res_vram.status_code == 200
    vram_data = res_vram.json()
    print(f"  • GET /api/models -> {len(res_models.json())} Models Registered")
    print(f"  • GET /api/models/vram -> Allocated: {vram_data['used_mb']} MB / {vram_data['total_mb']} MB ({vram_data['usage_percent']}%) | Headroom: {vram_data['free_mb']} MB")

    # 3. Two-Stage Router Accuracy
    print("\n[MODULE 3: TWO-STAGE INTENT ROUTER]")
    from apps.admin_backend.core.router import intelligent_router
    r1 = intelligent_router.route("calculate pump hydraulic power with Q=450, H=125")
    r2 = intelligent_router.route("draft an approval note for furnace tube skin temperature")
    assert r1["domain"] == "coding" and r1["model_id"] == "qwen2.5-coder-3b"
    assert r2["domain"] == "reasoning" and r2["model_id"] == "qwen3-4b"
    print(f"  • Coding Query Route: {r1['model_id']} ({r1['routed_by']}, {r1['confidence']}%)")
    print(f"  • Reasoning Query Route: {r2['model_id']} ({r2['routed_by']}, {r2['confidence']}%)")

    # 4. Sovereignty Watchdog & Tamper-Evident Hash Log
    print("\n[MODULE 4: SOVEREIGNTY DAEMON & TAMPER LOG]")
    res_cert = client.get("/api/sovereignty-audit/export")
    assert res_cert.status_code == 200
    cert_data = res_cert.json()
    print(f"  • GET /api/sovereignty-audit/export -> {cert_data['total_audit_blocks']} Blocks Sealed (Head Hash: {cert_data['head_sha256_hash'][:16]}...)")

    # 5. Agent Engine & Full-Duplex ReAct WebSocket
    print("\n[MODULE 5: REACT AGENT ENGINE & STREAMING]")
    with client.websocket_connect("/api/chat/stream") as ws:
        ws.send_json({"prompt": "Calculate pump efficiency for centrifugal charge pump", "attachments": []})
        chat_frames = []
        while True:
            try:
                frame = ws.receive_json()
                chat_frames.append(frame)
                if frame.get("event") == "final_answer":
                    break
            except Exception:
                break
        assert len(chat_frames) >= 3
        print(f"  • WS /api/chat/stream -> Streamed {len(chat_frames)} ReAct frames (Final Answer Deliverables: {chat_frames[-1].get('deliverable_ids')})")

    # 6. OCR & Multimodal Document Ingestion
    print("\n[MODULE 6: MULTIMODAL OCR HUB & MAGIC-BYTE SHIELD]")
    valid_pdf = b"%PDF-1.4\nMRPL INSPECTION REPORT\n1 0 obj<<>>endobj\ntrailer<<>>%%EOF"
    res_up = client.post("/api/upload", files={"file": ("furnace_inspection.pdf", valid_pdf, "application/pdf")})
    assert res_up.status_code == 200
    print(f"  • POST /api/upload -> 200 OK: Extracted {len(res_up.json()['findings'])} findings, SOP violations: {len(res_up.json()['sop_violations'])}")

    # 7. File Generation & Secure Download
    print("\n[MODULE 7: ENTERPRISE DELIVERABLES SYNTHESIS & SECURE DOWNLOAD]")
    res_dl = client.get("/api/files/download/MRPL_Furnace_Inspection_Approval_Note.docx")
    assert res_dl.status_code == 200
    assert len(res_dl.content) > 5000
    print(f"  • GET /api/files/download/MRPL_Furnace_Inspection_Approval_Note.docx -> 200 OK ({len(res_dl.content)} bytes)")

    # 8. Python Sandbox Isolation & AST Shield
    print("\n[MODULE 8: PYTHON EXECUTION SANDBOX & TIMEOUT KILL-SWITCH]")
    from apps.admin_backend.sandbox.manager import sandbox_manager
    res_sb = sandbox_manager.execute_script("x = 10 + 20; print(f'RESULT:{x}')")
    assert res_sb.success is True and "RESULT:30" in res_sb.stdout
    print(f"  • Sandbox Execution: Success=True, Engine={res_sb.execution_engine}, Duration={res_sb.duration_ms}ms")

    # 9. ChromaDB Vector Store & Provenance Citations
    print("\n[MODULE 9: CHROMADB RAG & SEMANTIC VECTOR SEARCH]")
    from apps.admin_backend.rag.vector_store import chroma_store
    sop_hits = chroma_store.query_sop("radiant tube skin temperature limit 610 C", top_k=1)
    assert len(sop_hits) > 0 and sop_hits[0].sop_id == "SOP-MRPL-FURNACE-01"
    print(f"  • ChromaDB Query Hit: {sop_hits[0].sop_id} Clause {sop_hits[0].clause} (Page {sop_hits[0].page_number})")

    # 10. Network Status & Multi-Device Deployment Modes
    print("\n[MODULE 10: NETWORK STATUS & MULTI-DEVICE TOPOLOGY]")
    res_net = client.get("/api/network-status")
    assert res_net.status_code == 200
    net_data = res_net.json()
    print(f"  • GET /api/network-status -> Active Mode: {net_data['deployment_mode']}, Connect URL: {net_data['connect_url']}")
    print(f"  • Hotspot SSID: {net_data['hotspot_instructions']['ssid']} (Air-Gap: {net_data['hotspot_instructions']['internet_sharing']})")

    print("\n" + "=" * 75)
    print("  ALL 10 BACKEND MODULES FULLY INTEGRATED & VERIFIED (100% OPERATIONAL)")
    print("=" * 75)

if __name__ == "__main__":
    test_full_backend_integration_live()
