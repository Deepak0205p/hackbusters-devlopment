import os
import yaml
from apps.admin_backend.models.compute_backends import (
    compute_backend_registry,
    get_backend_for_model,
    get_compute_backend,
    VLLMClusterBackend,
    OllamaBackend,
    NormalizedResponse
)
from apps.admin_backend.models.manager import ModelManager, ModelMetadata

def test_vllm_cluster_plugin_end_to_end():
    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - COMPUTE BACKEND PLUGIN REGISTRY TEST")
    print("=" * 70)

    # 1. Verify decorator registration in ComputeBackendRegistry
    print("\n--- [1] VERIFY COMPUTE BACKEND REGISTRY REGISTRATION ---")
    registered_backends = compute_backend_registry.list_registered_backends()
    print(f"Registered Backends in Registry: {registered_backends}")
    assert "vllm_cluster" in registered_backends
    assert "vllm" in registered_backends
    assert "ollama" in registered_backends
    assert "laptop_gpu" in registered_backends

    vllm_cls = compute_backend_registry.get_backend_class("vllm_cluster")
    assert vllm_cls is VLLMClusterBackend
    print(f"  [PASS] 'vllm_cluster' resolved to class: {vllm_cls.__name__}")

    # 2. Test direct execution of VLLMClusterBackend interface
    print("\n--- [2] TEST VLLM CLUSTER BACKEND INTERFACE ---")
    backend_inst = vllm_cls()
    assert backend_inst.is_online() is True
    print(f"  [PASS] is_online(): {backend_inst.is_online()}")

    resp: NormalizedResponse = backend_inst.generate(
        prompt="Synthesize FCC unit catalytic cracking optimization note",
        max_tokens=256,
        model="enterprise-llama-70b"
    )
    print(f"  [PASS] Generated response status: {resp.success}")
    print(f"  [PASS] Backend Type: {resp.backend_type}")
    print(f"  [PASS] Tokens/sec: {resp.tokens_per_second}")
    print(f"  [PASS] Response Content Snippet: '{resp.content[:95]}...'")
    assert resp.success is True
    assert resp.backend_type == "vllm_cluster"
    assert "VLLM CLUSTER STUB" in resp.content

    # 3. Test dynamic resolution purely via Model Metadata / YAML config
    print("\n--- [3] TEST FACTORY RESOLUTION VIA CONFIG (ZERO ENGINE/ROUTER EDITS) ---")
    
    # Simulate a model configured with backend: "vllm_cluster" in the model manager
    test_model = ModelMetadata(
        id="cluster-heavy-70b",
        name="Enterprise Cluster Engine",
        display_name="Enterprise Cluster Engine",
        quantization="FP8 Tensor Parallel 4x",
        vram_mb=70000,
        context_length=32768,
        domain="heavy_simulation",
        is_primary=False,
        keep_alive="infinite",
        status="active",
        description="Data center cluster model running across 4x A100 SXM4 nodes",
        backend="vllm_cluster",
        tier="cluster"
    )
    
    from apps.admin_backend.models.manager import model_manager
    model_manager.models["cluster-heavy-70b"] = test_model

    resolved_backend, display_label = get_backend_for_model("cluster-heavy-70b")
    print(f"  [PASS] Model ID: 'cluster-heavy-70b' -> Backend Class: {resolved_backend.__class__.__name__}")
    print(f"  [PASS] Display Label: '{display_label}'")
    assert isinstance(resolved_backend, VLLMClusterBackend)
    assert display_label == "Enterprise Cluster Engine"

    # Execute inference via the factory-resolved backend
    res2 = resolved_backend.generate("Test prompt", model=test_model.name)
    assert res2.success is True
    assert res2.backend_type == "vllm_cluster"
    print(f"  [PASS] Factory backend execution succeeded: {res2.success}")

    # Clean up test model from singleton
    del model_manager.models["cluster-heavy-70b"]

    print("\n======================================================================")
    print("  ALL COMPUTE BACKEND PLUGIN TESTS PASSED (100% VERIFIED)")
    print("======================================================================")

if __name__ == "__main__":
    test_vllm_cluster_plugin_end_to_end()
