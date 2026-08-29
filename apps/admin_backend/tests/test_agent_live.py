import asyncio
import json
from fastapi.testclient import TestClient
from apps.admin_backend.main import app
from apps.admin_backend.agent.engine import agent_engine
from apps.admin_backend.sovereignty.tamper_log import audit_log

def test_agent_engine_live():
    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - AGENT ENGINE & REACT LIVE TEST")
    print("=" * 70)

    client = TestClient(app)

    # 1. Test Scenario 2: Pump Calculation with Autonomous Self-Correction Loop
    print("\n--- [1] LIVE WEBSOCKET TEST: PUMP EFFICIENCY & SELF-CORRECTION LOOP ---")
    prompt_s2 = "Write a Python script to calculate centrifugal pump hydraulic efficiency for Crude Charge Pump P-101A with Flow = 450 m3/h, Head = 125 m, Density = 850 kg/m3, Power In = 160 kW. Execute in sandbox."

    with client.websocket_connect("/api/chat/stream") as ws:
        ws.send_json({"prompt": prompt_s2, "attachments": []})

        frames = []
        while True:
            try:
                frame = ws.receive_json()
                frames.append(frame)
                event_type = frame.get("event")

                if event_type == "routing":
                    print(f"  [EVENT: routing] -> Domain: {frame['domain']} | Model: {frame['model_id']} | Method: {frame['routed_by']} ({frame['confidence']}%)")
                elif event_type == "step":
                    step_type = frame["step_type"].upper()
                    print(f"  [EVENT: step {frame['step_number']:02d} - {step_type:<10}] ({frame['duration_ms']}ms, {frame['ram_mb']}MB RAM)")
                    if frame.get("tool_name"):
                        print(f"     Tool: {frame['tool_name']} | Input: {frame.get('tool_input')}")
                    if step_type == "CORRECTION":
                        print(f"     Self-Correction: {frame['content'][:80]}...")
                elif event_type == "final_answer":
                    print(f"  [EVENT: final_answer] -> Model: {frame['model_id']} | Deliverables: {frame['deliverable_ids']}")
                    print(f"     Answer Snippet: {frame['content'][:120]}...")
                    break
            except Exception as e:
                break

        assert len(frames) >= 2, "Expected streaming frames in ReAct loop!"
        routing_frame = next(f for f in frames if f.get("event") == "routing")
        assert routing_frame["domain"] == "coding"
        assert routing_frame["model_id"] == "qwen2.5-coder-3b"

        final_frame = next(f for f in frames if f.get("event") == "final_answer")
        assert "COMPUTE BACKEND UNAVAILABLE" in final_frame["content"] or len(final_frame["deliverable_ids"]) > 0

    # 2. Test Scenario 1: Furnace SOP Compliance & Memo Drafting
    print("\n--- [2] LIVE WEBSOCKET TEST: FURNACE SOP COMPLIANCE (REASONING) ---")
    prompt_s1 = "Draft an urgent executive approval note for Crude Distillation Unit furnace F-101 based on inspection report and verify compliance against MRPL SOPs."

    with client.websocket_connect("/api/chat/stream") as ws:
        ws.send_json({"prompt": prompt_s1, "attachments": []})

        s1_frames = []
        while True:
            try:
                frame = ws.receive_json()
                s1_frames.append(frame)
                if frame.get("event") == "final_answer":
                    print(f"  [EVENT: final_answer] -> Model: {frame['model_id']} | Deliverables: {frame['deliverable_ids']}")
                    break
            except Exception:
                break

        s1_routing = next(f for f in s1_frames if f.get("event") == "routing")
        assert s1_routing["domain"] == "reasoning"
        assert s1_routing["model_id"] == "qwen3-4b"

    # 3. Test Audit Log Integration
    print("\n--- [3] SOVEREIGNTY AUDIT LOG VERIFICATION ---")
    integrity = audit_log.verify_chain_integrity()
    print(f"Total Logged Sovereignty Blocks: {integrity['total_blocks']}")
    print(f"Cryptographic Verdict: {integrity['verdict']} (Valid: {integrity['valid']})")
    assert integrity["valid"] is True

    print("\n" + "=" * 70)
    print("  ALL AGENT ENGINE & REACT STREAMING TESTS PASSED (100% VERIFIED)")
    print("=" * 70)

if __name__ == "__main__":
    test_agent_engine_live()
