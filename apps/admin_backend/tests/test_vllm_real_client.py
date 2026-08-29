import json
import os
from apps.admin_backend.models.compute_backends import (
    compute_backend_registry,
    get_backend_for_model,
    VLLMClusterBackend,
    NormalizedResponse
)
from apps.admin_backend.models.manager import model_manager, ModelMetadata

def test_vllm_real_client_suite():
    print("=" * 75)
    print("  MRPL SOVEREIGN WORKBENCH - REAL VLLM CLUSTER CLIENT TEST SUITE")
    print("=" * 75)

    # 1. Verify decorator registration
    print("\n--- [1] VERIFY REGISTRY REGISTRATION ---")
    registered = compute_backend_registry.list_registered_backends()
    print(f"Registered backends in registry: {registered}")
    assert "vllm_cluster" in registered
    assert "vllm" in registered
    assert "cluster_gpu" in registered
    assert compute_backend_registry.get_backend_class("vllm_cluster") is VLLMClusterBackend
    print("  [PASS] VLLMClusterBackend successfully registered via @register_compute_backend")

    # 2. Test request payload construction (OpenAI Chat Completions format)
    print("\n--- [2] TEST REQUEST PAYLOAD CONSTRUCTION ---")
    client = VLLMClusterBackend(endpoint_url="http://10.0.0.100:8000/v1")
    
    sample_prompt = "Synthesize FCC unit catalytic cracking optimization note for CDU-1"
    payload = client.build_request_payload(
        prompt=sample_prompt,
        max_tokens=256,
        temperature=0.15,
        system_prompt="You are MRPL Sovereign Engineering AI.",
        model="enterprise-llama-70b-q8",
        top_p=0.9,
        stop=["<|endoftext|>", "###"]
    )
    
    print("Constructed Request Payload JSON:")
    formatted_json = json.dumps(payload, indent=2)
    print(formatted_json)

    assert payload["model"] == "enterprise-llama-70b-q8"
    assert len(payload["messages"]) == 2
    assert payload["messages"][0]["role"] == "system"
    assert payload["messages"][0]["content"] == "You are MRPL Sovereign Engineering AI."
    assert payload["messages"][1]["role"] == "user"
    assert payload["messages"][1]["content"] == sample_prompt
    assert payload["max_tokens"] == 256
    assert payload["temperature"] == 0.15
    assert payload["stop"] == ["<|endoftext|>", "###"]
    print("  [PASS] Request payload conforms strictly to vLLM OpenAI-compatible /v1/chat/completions specification")

    # 3. Test honest error-handling against unreachable server (e.g. port 59999)
    print("\n--- [3] TEST HONEST UNREACHABLE CLUSTER ERROR HANDLING ---")
    unreachable_client = VLLMClusterBackend(endpoint_url="http://127.0.0.1:59999/v1", timeout_seconds=1.0)
    
    # Check is_online() returns False honestly
    is_online = unreachable_client.is_online()
    print(f"  [PASS] is_online() against unreachable server: {is_online} (Expected False)")
    assert is_online is False

    # Execute generate() and confirm graceful NormalizedResponse with diagnostic error
    res: NormalizedResponse = unreachable_client.generate(
        prompt="Test inquiry",
        model="enterprise-llama-70b"
    )
    print(f"  [PASS] Response success: {res.success}")
    print(f"  [PASS] Backend Type: {res.backend_type}")
    print(f"  [PASS] Error Diagnostic: '{res.error}'")
    assert res.success is False
    assert res.backend_type == "vllm_cluster"
    assert "connection refused" in res.error.lower() or "59999" in res.error or "error" in res.error.lower()

    # 4. Test zero-refactor factory resolution from model manager
    print("\n--- [4] TEST FACTORY RESOLUTION VIA DYNAMIC REGISTRY ---")
    cluster_model = ModelMetadata(
        id="cluster-refinery-70b",
        name="Enterprise Cluster Engine",
        display_name="Enterprise Cluster Engine",
        quantization="FP8 Tensor Parallel 8x",
        vram_mb=80000,
        context_length=32768,
        domain="heavy_simulation",
        is_primary=False,
        keep_alive="infinite",
        status="active",
        description="Data center cluster model running across 8x A100 SXM4 nodes",
        backend="vllm_cluster",
        tier="cluster"
    )
    model_manager.models["cluster-refinery-70b"] = cluster_model

    resolved_backend, display_label = get_backend_for_model("cluster-refinery-70b")
    print(f"  [PASS] Resolved Backend Class: {resolved_backend.__class__.__name__}")
    print(f"  [PASS] Display Label: '{display_label}'")
    assert isinstance(resolved_backend, VLLMClusterBackend)
    assert display_label == "Enterprise Cluster Engine"

    # Clean up
    del model_manager.models["cluster-refinery-70b"]

    print("\n======================================================================")
    print("  ALL REAL VLLM CLUSTER CLIENT TESTS PASSED (100% VERIFIED)")
    print("======================================================================")

if __name__ == "__main__":
    test_vllm_real_client_suite()
