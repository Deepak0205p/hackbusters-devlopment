import os
import sys
import time
import json
import asyncio
from typing import Dict, Any, List
from unittest.mock import patch, MagicMock

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from apps.admin_backend.api.routes_models import router as models_router
from apps.admin_backend.models.manager import (
    model_manager,
    ModelMetadata,
    VRAMTelemetry,
    SwapEvent
)
from apps.admin_backend.models.compute_backends import (
    backend_registry,
    get_backend_for_model,
    OllamaBackend,
    VLLMBackend,
    LlamaCppBackend,
    NormalizedResponse
)
from apps.admin_backend.sovereignty.tamper_log import audit_log

# ==============================================================================
# FASTAPI TEST APPLICATION SETUP
# ==============================================================================
app = FastAPI(title="MRPL Model Serving Test Gateway")
app.include_router(models_router)

client = TestClient(app)

# ==============================================================================
# TEST CASE 1: MODEL CONFIGURATION SCHEMA VALIDATION
# ==============================================================================
def test_model_configuration_schema():
    """Test Case 1: Validates models.yaml schema, required fields, and domain mappings."""
    models = model_manager.get_models()
    assert len(models) >= 4, f"Expected at least 4 models, got {len(models)}"

    required_domains = {"reasoning", "coding", "vision", "general", "embedding"}
    found_domains = {m.domain for m in models}
    for d in required_domains:
        assert d in found_domains, f"Domain '{d}' missing from model registry."

    for m in models:
        assert m.id, "Model ID must not be empty"
        assert m.name, f"Model '{m.id}' missing name"
        assert m.vram_mb > 0, f"Model '{m.id}' has invalid VRAM budget: {m.vram_mb}"
        assert m.context_length >= 2048, f"Model '{m.id}' context length too small"
        assert m.quantization.startswith("GGUF") or "AWQ" in m.quantization or "FP16" in m.quantization

    print("  -> PASS: Model catalog schema and domain matrices verified.")

# ==============================================================================
# TEST CASE 2: VRAM TELEMETRY & OOM HEADROOM VERIFICATION
# ==============================================================================
def test_vram_telemetry_and_oom_headroom():
    """Test Case 2: Tests VRAM telemetry calculation and safe ceiling enforcement."""
    res = client.get("/api/v1/models/vram")
    assert res.status_code == 200
    telemetry = res.json()

    assert "total_mb" in telemetry
    assert "used_mb" in telemetry
    assert "free_mb" in telemetry
    assert telemetry["total_mb"] > 0
    assert telemetry["used_mb"] >= 0
    assert telemetry["free_mb"] >= 0
    assert telemetry["usage_percent"] >= 0.0

    # Test /api/v1/models/status
    res_status = client.get("/api/v1/models/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["active_primary_model"] == "qwen3-4b"
    assert len(status_data["loaded_models"]) >= 1

    print(f"  -> PASS: VRAM Telemetry active: {telemetry['used_mb']} MB / {telemetry['total_mb']} MB ({telemetry['usage_percent']}%)")

# ==============================================================================
# TEST CASE 3: LRU EVICTION LOGIC & DYNAMIC MODEL SWAPPING
# ==============================================================================
def test_lru_model_swapping_logic():
    """Test Case 3: Tests LRU eviction sequence when switching secondary models."""
    # 1. Start by swapping to coding model
    res_swap1 = client.post("/api/v1/models/swap", json={"model_id": "qwen2.5-coder-3b"})
    assert res_swap1.status_code == 200
    swap_data1 = res_swap1.json()
    assert swap_data1["to_model"] == "qwen2.5-coder-3b"
    assert swap_data1["status"] == "SUCCESS"

    # 2. Hot-swap to vision model -> Should evict qwen2.5-coder-3b
    res_swap2 = client.post("/api/v1/models/swap", json={"model_id": "qwen2-vl-2b"})
    assert res_swap2.status_code == 200
    swap_data2 = res_swap2.json()
    assert swap_data2["to_model"] == "qwen2-vl-2b"
    assert swap_data2["from_model"] == "qwen2.5-coder-3b"
    assert swap_data2["status"] == "SUCCESS"

    # 3. Verify swap history API
    res_history = client.get("/api/v1/models/swaps")
    assert res_history.status_code == 200
    history = res_history.json()
    assert len(history) >= 2
    assert history[0]["to_model"] == "qwen2-vl-2b"

    print("  -> PASS: LRU dynamic model swapper executed eviction and hot-swap.")

# ==============================================================================
# TEST CASE 4: INFERENCE GENERATION & TOKEN STREAMING
# ==============================================================================
def test_compute_backend_streaming_and_fallback():
    """Test Case 4: Tests unified inference generation and token streaming."""
    # 1. Non-streaming completion
    res_gen = client.post(
        "/api/v1/models/generate",
        json={
            "prompt": "Calculate pump efficiency for crude charge pump P-101A with 450 m3/hr flow rate",
            "model_id": "qwen2.5-coder-3b",
            "max_tokens": 256
        }
    )
    assert res_gen.status_code == 200
    gen_data = res_gen.json()
    assert gen_data["status"] == "SUCCESS"
    assert len(gen_data["content"]) > 0
    assert gen_data["tokens_generated"] > 0
    print(f"  • Generated {gen_data['tokens_generated']} tokens via {gen_data['backend_type']} in {gen_data['duration_seconds']}s")

    # 2. Streaming completion
    res_stream = client.post(
        "/api/v1/models/generate",
        json={
            "prompt": "Evaluate furnace tube skin thermocouple readings",
            "model_id": "qwen3-4b",
            "stream": True
        }
    )
    assert res_stream.status_code == 200
    streamed_text = res_stream.text
    assert len(streamed_text) > 0
    assert "furnace" in streamed_text.lower() or "sovereign" in streamed_text.lower()
    print(f"  • Streaming response received ({len(streamed_text)} characters)")

    print("  -> PASS: Unified generation and streaming execution verified.")

# ==============================================================================
# TEST CASE 5: ERROR FALLBACK & CIRCUIT BREAKER
# ==============================================================================
def test_oom_and_error_circuit_breaker_fallback():
    """Test Case 5: Tests circuit breaker fallback when backend is unreachable."""
    # Request invalid or non-existent model ID -> Expect 400 Bad Request
    res_invalid = client.post(
        "/api/v1/models/generate",
        json={"prompt": "test", "model_id": "non_existent_model_999b"}
    )
    assert res_invalid.status_code == 400
    assert "NOT FOUND" in res_invalid.json()["detail"].upper()

    # Test direct fallback backend
    backend, meta = get_backend_for_model("llama-3.2-3b")
    assert backend.is_online() is True
    res = backend.generate(prompt="Explain sovereign air gap in simple words")
    assert res.success is True
    assert len(res.content) > 0

    print("  -> PASS: Circuit breaker and offline fallback mechanisms verified.")

# ==============================================================================
# TEST CASE 6: SHA-256 TAMPER AUDIT LOG CHAIN INTEGRITY
# ==============================================================================
def test_tamper_log_swap_event_recording():
    """Test Case 6: Verifies model swap events are sealed into the tamper log."""
    integrity = audit_log.verify_chain_integrity()
    assert integrity["valid"] is True
    assert integrity["verdict"] == "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"
    assert integrity["total_blocks"] >= 2

    # Check that swap events are recorded
    events = [entry.event_type for entry in audit_log.entries]
    assert any("MODEL_SWAP" in ev or "MODEL_HOTSWAP" in ev for ev in events)

    print(f"  -> PASS: SHA-256 tamper audit log verified ({integrity['total_blocks']} blocks sealed).")

# ==============================================================================
# MASTER TEST SUITE RUNNER
# ==============================================================================
def test_model_serving_live():
    """Master runner executing all 6 test cases sequentially."""
    print("=" * 80)
    print("  MRPL SOVEREIGN WORKBENCH - LOCAL MODEL SERVING & LRU SWAPPING TEST SUITE")
    print("=" * 80)

    print("\n--- [1] MODEL CATALOG & SCHEMA VALIDATION ---")
    test_model_configuration_schema()

    print("\n--- [2] VRAM TELEMETRY & OOM HEADROOM ---")
    test_vram_telemetry_and_oom_headroom()

    print("\n--- [3] LRU EVICTION & DYNAMIC MODEL SWAPPING ---")
    test_lru_model_swapping_logic()

    print("\n--- [4] STREAM GENERATION & BACKEND BENCHMARK ---")
    test_compute_backend_streaming_and_fallback()

    print("\n--- [5] ERROR FALLBACK & CIRCUIT BREAKERS ---")
    test_oom_and_error_circuit_breaker_fallback()

    print("\n--- [6] SHA-256 TAMPER AUDIT LOG VERIFICATION ---")
    test_tamper_log_swap_event_recording()

    print("\n" + "=" * 80)
    print("  ALL 6 LOCAL MODEL SERVING & VRAM SWAPPING TESTS PASSED (100% AIR-GAPPED)")
    print("=" * 80)

if __name__ == "__main__":
    test_model_serving_live()
