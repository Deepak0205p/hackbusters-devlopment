import json
from apps.admin_backend.models.compute_backends import (
    compute_backend_registry,
    get_backend_for_model,
    OllamaBackend,
    VLLMClusterBackend,
    NormalizedResponse
)
from apps.admin_backend.models.manager import model_manager, ModelMetadata

def test_hybrid_mesh_suite():
    print("=" * 75)
    print("  MRPL SOVEREIGN WORKBENCH - 1-IP HYBRID MESH & MULTI-LAPTOP TEST SUITE")
    print("=" * 75)

    # 1. Test local node instantiation (127.0.0.1)
    print("\n--- [1] LOCAL WORKSTATION NODE RESOLUTION ---")
    local_model = ModelMetadata(
        id="test-local-reasoner",
        name="Reasoning Engine",
        display_name="Reasoning Engine",
        quantization="GGUF Q4_K_M",
        vram_mb=2600,
        context_length=8192,
        domain="reasoning",
        is_primary=True,
        keep_alive="5m",
        status="active",
        description="Local GPU reasoner",
        backend="laptop_gpu",
        endpoint_url="http://127.0.0.1:11434",
        node_ip="127.0.0.1"
    )
    model_manager.models["test-local-reasoner"] = local_model
    backend, label = get_backend_for_model("test-local-reasoner")
    print(f"  [PASS] Backend type: {type(backend).__name__} | Base URL: {backend.base_url}")
    assert isinstance(backend, OllamaBackend)
    assert backend.base_url == "http://127.0.0.1:11434"

    # 2. Test dedicated second laptop assignment (e.g. 192.168.0.102)
    print("\n--- [2] DEDICATED REMOTE LAPTOP NODE ASSIGNMENT ---")
    remote_laptop_model = ModelMetadata(
        id="test-remote-coder",
        name="Code Engine",
        display_name="Code Engine",
        quantization="GGUF Q4_K_M",
        vram_mb=1900,
        context_length=8192,
        domain="coding",
        is_primary=False,
        keep_alive="5m",
        status="active",
        description="Dedicated Coding Laptop node",
        backend="laptop_gpu",
        endpoint_url="http://192.168.0.102:11434",
        node_ip="192.168.0.102"
    )
    model_manager.models["test-remote-coder"] = remote_laptop_model
    
    # Check is_online on remote address returns False safely when laptop 2 is not yet connected
    remote_backend = OllamaBackend(base_url="http://192.168.0.102:11434")
    remote_online = remote_backend.is_online()
    print(f"  [PASS] Remote node 192.168.0.102 probe status: {remote_online} (Unreachable as expected in dev)")
    assert remote_online is False

    # 3. Test self-healing fallback when remote laptop is unreachable
    print("\n--- [3] SELF-HEALING FALLBACK ON OFFLINE REMOTE NODE ---")
    fallback_backend, display_label = get_backend_for_model("test-remote-coder")
    print(f"  [PASS] Fallback backend base URL: {fallback_backend.base_url} (Safely reverted to local)")
    assert fallback_backend.base_url == "http://127.0.0.1:11434"

    # 4. Clean up test entries
    del model_manager.models["test-local-reasoner"]
    del model_manager.models["test-remote-coder"]

    print("\n======================================================================")
    print("  ALL HYBRID MESH & MULTI-LAPTOP TESTS PASSED (100% VERIFIED)")
    print("======================================================================")

if __name__ == "__main__":
    test_hybrid_mesh_suite()
