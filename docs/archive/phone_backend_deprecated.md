# Historical Reference: Android USB ADB Phone Compute Backend (Deprecated)

> **Status:** DEPRECATED & REMOVED (2026-08-26)  
> **Superseded By:** Native On-Device Ollama GPU Daemon / Scalable Multi-Tier Compute Registry

---

## 1. Overview of Deprecated Architecture
During initial prototyping and offline resilience testing, an edge disaster-failover path was implemented using an Android smartphone running `llama.cpp` over physical USB ADB port forwarding:
* **Device:** Motorola Edge 60 Pro (12GB Unified RAM)
* **Model:** `DeepSeek-V4-Pro-Qwen3.5-4B-MTP-Q3_K_L.gguf`
* **Transport:** `adb forward tcp:8080 tcp:8080` (Physical USB link, zero wireless packets)
* **Inference Latency:** $\sim 3.0\text{--}4.4\text{ tokens/sec}$ (CPU edge compute)

---

## 2. Rationale for Removal
1. **Performance Disparity:** Real local GPU inference via Ollama runs at $\sim 40\text{ tokens/sec}$, providing superior real-time responsiveness for industrial agentic ReAct workflows.
2. **Simplified Deployment:** Removing ADB daemon dependencies eliminates USB authorization requirements and streamlines judge onboarding to pure on-device GPU execution.
3. **Enterprise Scalability:** Multi-tier GPU clusters (24GB RTX 4090 to 80GB A100/H100) are now fully supported natively via `hardware_profiles.yaml` and `ComputeBackendRegistry`.
