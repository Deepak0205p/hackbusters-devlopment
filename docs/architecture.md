# System Architecture Document
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

---

## 1. High-Level System Architecture

The Sovereign Industrial AI Workbench is an entirely on-premise, air-gapped system designed to execute complex multimodal industrial workflows on a single mid-range GPU workstation (NVIDIA RTX 3050 6GB / RTX 4060 8GB) with scalable headroom for enterprise GPU clusters (80GB A100/H100). All core services bind strictly to `127.0.0.1` (localhost).

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer (Local Host)"]
        UI["React 18 + Tailwind CSS Web UI\n(Dashboard, Chat, Sovereignty Monitor, Model Switcher)"]
    end

    subgraph API_Gateway ["Application Server (FastAPI on Uvicorn)"]
        Router["Intelligent Dynamic Router\n(Config-Driven Stage 1 Regex + Stage 2 Semantic Centroids)"]
        ModelMgr["Model Swapping & Hardware Profile Manager\n(Profile-Driven VRAM Guard / Dynamic Eviction)"]
        AgentEngine["LangChain ReAct Agent Engine\n(Max 10 Iterations, Self-Correction)"]
        SovereigntyDaemon["Sovereignty Daemon\n(psutil + Scapy/Pyshark Packet Auditor)"]
    end

    subgraph Serving_Layer ["Inference & Storage Engine"]
        ComputeRegistry["Compute Backend Registry\n(@register_compute_backend)"]
        Ollama["Local Ollama Daemon (Port 11434)"]
        ClusterBackends["Enterprise Fabrics (vLLM / Ray / TGI)"]
        ChromaStore["ChromaDB Vector Store\n(BAAI/bge-small-en-v1.5 Embeddings)"]
    end

    subgraph Tooling_Layer ["Plugin Tooling Layer"]
        ToolRegistry["Plugin Tool Registry\n(@tool_registry.register)"]
        SandboxBackend["Pluggable Sandbox Backend (SandboxBackend ABC)\n(Docker Container / Hardened Subprocess / Ray)"]
        OCREngine["PaddleOCR / Tesseract Local Engine"]
        OfficeGen["Office File Generators\n(python-docx, openpyxl, python-pptx)"]
    end

    UI <-->|HTTP / WebSocket (127.0.0.1)| API_Gateway
    Router --> ModelMgr
    ModelMgr <--> ComputeRegistry
    ComputeRegistry --> Ollama
    ComputeRegistry -.-> ClusterBackends
    AgentEngine <--> ComputeRegistry
    AgentEngine <--> ChromaStore
    AgentEngine <--> ToolRegistry
    ToolRegistry <--> SandboxBackend
    ToolRegistry <--> OCREngine
    ToolRegistry <--> OfficeGen
    SovereigntyDaemon -.->|Audits Interfaces| API_Gateway
```

---

## 2. Scalability Architecture & Zero-Refactor Scaling

The entire backend is architected around a binding architectural principle: **"Configuration-based model registries, hardware tier profiles, and plugin-based tool systems let this scale from a single laptop to enterprise-grade GPU clusters without redesigning the software or refactoring a single line of code."**

### How Zero-Refactor Scaling is Implemented Across All 6 Dimensions:

| Subsystem | Zero-Refactor Mechanism | Zero-Code Extension Method |
| :--- | :--- | :--- |
| **1. Model Registry** | Declarative YAML Registry in `models.yaml`. | Add a new model entry to `models.yaml`. `ModelManager` dynamically ingests ID, quantization, VRAM, and context window. |
| **2. Dynamic Router** | Dynamic regex compiler & vocabulary centroid builder in `router.py`. | Declare `domain`, `regex_patterns: [...]`, and `keywords: [...]` inside the model's YAML entry. The router automatically registers and routes to the new domain at startup. |
| **3. Compute Backends** | Open `ComputeBackendRegistry` with `@register_compute_backend("name")` decorator. | Implement `ComputeBackend(ABC)` subclass (e.g. `vLLMBackend`, `RayDistributedBackend`) and decorate. `models.yaml` sets `backend: "vllm"`. |
| **4. Hardware Profiles** | Named compute envelopes defined in `hardware_profiles.yaml`. | Set `HARDWARE_PROFILE=enterprise_cluster_80gb_a100` via environment variable or config. Eviction strategy switches automatically from `lru_swap` to `all_resident`. |
| **5. Tool Registry** | Plugin-based `ToolRegistry` with `@tool_registry.register(name, description, schema)` decorator. | Implement new tool functions (e.g. `scada_modbus_reader`, `sap_connector`) and decorate. The ReAct agent calls them dynamically by name. |
| **6. Execution Sandbox** | Pluggable `SandboxBackend(ABC)` abstraction layer. | Switch or provide custom sandbox backends (Docker Container, Subprocess, Kubernetes Job, Ray Sandbox) behind a single unified interface. |

---

## 3. Hardware Profile Tiers (`hardware_profiles.yaml`)

| Profile Key | Target Hardware | Total VRAM | Safe Ceiling | Active Models | Eviction Strategy | Supported Backends |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `edge_laptop_6gb` | NVIDIA RTX 3050 / 4050 (6GB VRAM) | **6,144 MB** | **6,000 MB** | **2 Concurrent** | `lru_swap` | `laptop_gpu`, `ollama` |
| `workstation_24gb_rtx4090` | NVIDIA RTX 4090 / RTX 6000 Ada | **24,576 MB** | **23,500 MB** | **4 Concurrent** | `lru_swap` | `workstation_gpu`, `ollama`, `vllm` |
| `enterprise_cluster_80gb_a100` | NVIDIA A100 / H100 80GB SXM4 Cluster | **81,920 MB** | **78,000 MB** | **16 Concurrent** | `all_resident` | `cluster_gpu`, `vllm`, `ray_distributed`, `tgi`, `ollama` |
| `cpu_ram_edge` | Ruggedized Industrial Control Node (32GB RAM)| **32,768 MB** | **30,000 MB** | **4 Concurrent** | `lru_swap` | `cpu_llamacpp`, `ollama` |

---

## 4. LangChain ReAct Agent Loop & Self-Correction

The agent layer uses a ReAct (Reason + Act) loop bounded to a maximum of **10 iterations** to prevent infinite loops:

1. **Decomposition:** Breaks complex goals into sequential sub-tasks.
2. **Tool Selection:** Selects appropriate tool from `tool_registry` (`docker_sandbox`, `paddle_ocr`, `chroma_sop_search`, `docx_generator`, `xlsx_generator`, `pptx_generator`).
3. **Execution & Validation:** Executes the tool locally and inspects `stdout`, `stderr`, and return codes.
4. **Self-Correction:**
   - If a Python script fails with an exception or mathematical inconsistency, the error traceback is fed back into the agent prompt.
   - The agent regenerates the script, adjusts variables, and re-executes inside Docker until successful or 10 iterations are reached.

---

## 5. Local RAG & Vector Store Architecture

- **Vector Database:** Embedded ChromaDB running locally on the workstation filesystem.
- **Embedding Model:** `BAAI/bge-small-en-v1.5` running locally via HuggingFace/ONNX runtime (zero external calls).
- **Chunking Strategy:** Context-preserving recursive character splitting with document metadata (source file, section heading, SOP clause, page number).
- **Grounding & Provenance:** Citations with exact clause numbers are mandatory in RAG outputs to prevent hallucinations.

---

## 6. Pluggable Sandbox Isolation Architecture

- **Abstract Backend:** `SandboxBackend(ABC)` with `DockerContainerBackend` and `HardenedSubprocessBackend`.
- **Container Isolation:** Minimal lightweight Python 3.11 image (`python:3.11-slim`) with scientific packages.
- **Network Mode:** `--network none` (strictly disables host and external network access inside the container).
- **Resource Constraints:** Capped CPU (2 cores), Memory (512MB RAM), execution timeout (5s hard kill-switch).
- **Static Shield:** AST static security screener blocks dangerous system modules (`os`, `sys`, `socket`, `subprocess`, dunder escapes) before process creation.

---

## 7. Deployment Modes & Multi-Device Network Architecture

```mermaid
graph TB
    subgraph Primary_Mode ["PRIMARY MODE: Single-Device (Standalone Localhost)"]
        Host1["Host Workstation\n(GPU + Backend + Ollama + Next.js UI)"]
        User1["Local Operator\n(Browser at http://127.0.0.1:8000)"]
        User1 <--> Host1
    end

    subgraph Option_A ["SECONDARY MODE (Option A): Venue LAN / Wi-Fi"]
        Host2["Host Workstation (0.0.0.0:8000)\nLocal IP: 192.168.1.X"]
        Router["Venue Wi-Fi Router\n(Local switch only, No internet gateway required)"]
        JudgeA["Judge Laptop / Tablet\n(Browser at http://192.168.1.X:8000)"]
        JudgeA <--> Router <--> Host2
    end

    subgraph Option_B ["SECONDARY MODE (Option B): Host-Created Wi-Fi Hotspot"]
        Host3["Host Workstation (0.0.0.0:8000)\nHotspot IP: 192.168.137.1\n[Internet Sharing: OFF]"]
        JudgeB["Judge Device (Direct Wi-Fi Link)\n(Browser at http://192.168.137.1:8000)"]
        JudgeB <-->|Direct 802.11 Link (WPA2)| Host3
    end
```

### 7.1. Mode Definitions & Connectivity Options

1. **PRIMARY MODE (Default Standalone - Single Workstation):** Standard localhost demo (`127.0.0.1`).
2. **SECONDARY MODE - Option A (Venue LAN / Wi-Fi):** FastAPI binds to `0.0.0.0:8000` on venue network switch without requiring internet.
3. **SECONDARY MODE - Option B (Host-Created Closed Wi-Fi Hotspot):** Native host hotspot with internet sharing disabled (enforced air-gap).
