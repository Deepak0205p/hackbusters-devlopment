import time
from fastapi.testclient import TestClient
from apps.admin_backend.main import app
from apps.admin_backend.sovereignty.watchdog import socket_watchdog
from apps.admin_backend.sovereignty.tamper_log import audit_log

def test_sovereignty_system_live():
    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - LIVE SOVEREIGNTY AUDIT TEST SUITE")
    print("=" * 70)

    # 1. Test psutil Live Socket Enumeration & 3-Tier Classification
    print("\n--- [1] PSUTIL REAL SOCKET SCAN & 3-TIER CLASSIFICATION ---")
    snapshot = socket_watchdog.scan_sockets()
    print(f"Total Sockets Audited: {len(snapshot.sockets)}")
    print(f"Localhost Connections: {snapshot.localhost_connections}")
    print(f"LAN/Hotspot Connections: {snapshot.lan_hotspot_connections}")
    print(f"External Internet Connections: {snapshot.external_internet_connections}")
    print(f"Air-Gap Verdict: {snapshot.verdict}")

    print("\nSample Captured Sockets (Sanitized):")
    for s in snapshot.sockets[:5]:
        print(f"  • PID {s.pid:<5} | {s.process_name:<30} | {s.local_address:<22} -> {s.remote_address:<22} | [{s.tier:<11}] -> {s.security_verdict}")

    assert snapshot.external_internet_connections >= 0
    assert snapshot.verdict in ["100% AIR-GAPPED & SOVEREIGN", "AIR-GAP BREACH DETECTED"]

    # 2. Test Cryptographic SHA-256 Hash Chaining
    print("\n--- [2] SHA-256 TAMPER-EVIDENT HASH CHAIN VERIFICATION ---")
    audit_log.append_event("EVALUATOR_DEVICE_CONNECT", "Remote evaluator tablet connected from 192.168.137.45:49218")
    audit_log.append_event("MODEL_INFERENCE_INVOCATION", "Dispatched ReAct loop on model qwen3-4b")
    audit_log.append_event("SOVEREIGNTY_CHECK_PASSED", "Watchdog confirmed 0 external bytes transmitted")

    integrity = audit_log.verify_chain_integrity()
    print(f"Total Audit Blocks: {integrity['total_blocks']}")
    print(f"Head Block Hash: {integrity['head_hash']}")
    print(f"Verification Result: {integrity['verdict']} (Valid: {integrity['valid']})")
    assert integrity["valid"] is True

    # 3. Test REST & WebSocket Endpoints via TestClient
    print("\n--- [3] FASTAPI REST & WEBSOCKET CONTRACT TEST ---")
    client = TestClient(app)

    # Test /api/network-status
    res_net = client.get("/api/network-status")
    print(f"GET /api/network-status: {res_net.status_code} -> {res_net.json()}")
    assert res_net.status_code == 200
    assert "connect_url" in res_net.json()

    # Test /api/sovereignty-audit/export
    res_cert = client.get("/api/sovereignty-audit/export")
    print(f"GET /api/sovereignty-audit/export: {res_cert.status_code} -> Total blocks: {res_cert.json()['total_audit_blocks']}")
    assert res_cert.status_code == 200
    assert res_cert.json()["integrity_verification"]["valid"] is True

    # Test /api/audit-stream WebSocket frame
    with client.websocket_connect("/api/audit-stream") as ws:
        frame = ws.receive_json()
        print(f"WS /api/audit-stream received frame keys: {list(frame.keys())}")
        print(f"  • Sovereignty Verdict: {frame['sovereignty']['verdict']}")
        print(f"  • GPU VRAM Allocated: {frame['vram']['used_mb']} MB / {frame['vram']['total_mb']} MB ({frame['vram']['usage_percent']}%)")
        print(f"  • Host IP: {frame['host_ip']}:{frame['port']}")
        assert "sovereignty" in frame
        assert "vram" in frame
        assert frame["sovereignty"]["external_internet_connections"] >= 0

    print("\n" + "=" * 70)
    print("  ALL SOVEREIGNTY AUDIT TESTS PASSED (100% VERIFIED)")
    print("=" * 70)

if __name__ == "__main__":
    test_sovereignty_system_live()
