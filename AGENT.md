# AGENT.md: Operational & Engineering Guidelines
## Sovereign On-Premise Agentic AI Workbench (SIH26117)

This document establishes the binding engineering rules, constraints, coding conventions, and architectural guardrails for all AI agents and developers working on this codebase.

---

## 1. Fixed & Locked Technology Stack

Only libraries, frameworks, and tools explicitly defined in [docs/tech_stack.md](file:///G:/SIH/p/docs/tech_stack.md) and [docs/architecture.md](file:///G:/SIH/p/docs/architecture.md) may be introduced into the project. **Never install, import, or introduce any unauthorized third-party framework or dependency without user confirmation.**

### Approved Core Stack:
- **Operating System:** Ubuntu 22.04 LTS or Windows 11 (64-bit)
- **GPU Acceleration:** NVIDIA CUDA 12.2+ (Target VRAM Ceiling: 6.0 GB)
- **Local Model Serving:** Ollama (`http://127.0.0.1:11434`)
- **Backend Application Server:** Python 3.11, FastAPI 0.111.0, Uvicorn 0.30.1, Pydantic 2.7.4
- **Agent Orchestration:** LangChain 0.2.11 (ReAct framework, Max 10 Iterations)
- **Vector Database & Embeddings:** ChromaDB 0.5.4 (Local embedded), `BAAI/bge-small-en-v1.5` (`sentence-transformers 3.0.1`)
- **Document Processing & Local OCR:** PaddleOCR 2.8.1 (offline cache), Tesseract 5.3+, pypdf, pdfplumber, Pillow
- **Production Deliverable Generators:** `python-docx 1.1.2`, `openpyxl 3.1.5`, `python-pptx 0.6.23`
- **Code Execution Sandbox:** Docker Engine 24.0+ (`python:3.11-slim` with `--network none`, 2 vCPU, 512MB RAM cap)
- **Network Sovereignty Daemon:** `psutil 6.0.0`, `scapy 2.5.0`
- **Frontend Framework:** Next.js 14.2.5 (App Router, Static Export `output: 'export'`), Tailwind CSS 3.4.4, Zustand 4.5.4, Lucide React 0.395.0

---

## 2. Mandatory Dev-Time `context7` Documentation Lookup Rule

- **Pre-Implementation Verification:** Before writing or generating code for **ANY** library/framework in the tech stack (Next.js App Router, FastAPI, LangChain, ChromaDB, python-docx, openpyxl, python-pptx, Ollama API, Docker SDK, etc.), you **MUST call `context7` first** (`resolve-library-id` then `query-docs`) to fetch the current, correct syntax and API signatures for that library's specific pinned version.
- **Do Not Rely on Memory Alone:** Library APIs change frequently across minor versions. Outdated syntax creates avoidable runtime bugs.
- **Provenance in Code Comments:** Cite the retrieved version/date of the documentation in code comments where non-obvious (e.g., `# Verified via context7 /vercel/next.js v14.2.5 static export configuration`).
- **Dev-Time Only:** This tool call is strictly for development-time code generation. Zero external calls or `context7` dependencies may ever be written into the runtime application code.

---

## 3. Strict Air-Gap & Zero-Cloud Constraint (Local, LAN & Hotspot Modes)

1. **Zero External APIs at Runtime:** NEVER install, configure, import, or call OpenAI, Anthropic, Gemini, Azure, AWS Bedrock, Cohere, or any remote AI cloud API.
2. **Zero Cloud Telemetry:** NEVER add SaaS monitoring/error-tracking SDKs (e.g., Sentry SaaS, PostHog Cloud, Datadog Cloud, Google Analytics, Mixpanel).
3. **Deployment Modes & Binding Policy:**
   - **Primary Mode (Single-Device):** Standard localhost demo (`127.0.0.1`).
   - **Secondary Mode (Multi-Device LAN / Hotspot):** FastAPI binds to `0.0.0.0:8000` to allow other local devices (judges' laptops/tablets) to connect via venue LAN (Option A) or host-created closed Wi-Fi hotspot (Option B, with internet sharing OFF).
   - **Zero External Egress Invariant:** Any future networking change MUST preserve the "zero external/internet egress" invariant across all three modes (Local, LAN, Hotspot). Neither venue LAN traffic nor host hotspot traffic counts as external egress, provided no internet gateway or bridge is active.
4. **Offline Mode Flags:** Explicitly set offline environment variables (`HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, `DO_NOT_TRACK=1`, `PADDLE_PDX_DISABLE_REPORT=1`) across all backend services.
5. **Sandbox Network Isolation:** All Docker container executions must be spawned with `--network none`.
6. **Frontend Static Serving & Two-App Architecture:**
   - Both frontends run in static export mode (`output: 'export'`) and are served directly by FastAPI on port `8000`:
     - **Public Chat Interface:** Served at `/` (from `apps/chat-frontend/out`).
     - **Admin Observatory Dashboard:** Served at `/admin/` (from `apps/admin-frontend/out`).
   - Zero running Node server at runtime; both frontends share the same Python FastAPI intelligence layer on port `8000`.

---

## 4. Ambiguity & Underspecified Requirements Rule

- Before implementing any module, endpoint, or feature, thoroughly inspect the corresponding documentation in [docs/](file:///G:/SIH/p/docs).
- **DO NOT invent, assume, or extrapolate requirements not present in the specification.**
- If any behavior, parameter, or threshold is ambiguous or not explicitly defined in the problem statement, mark the code/doc with:
  ```python
  # TODO: confirm with user - [Specific question or ambiguity]
  ```
  and prompt the user for clarification before proceeding with implementation.

---

## 5. Milestone Tracking & Task Updating Rule

- Every single task in the system is tracked in [docs/tasks.md](file:///G:/SIH/p/docs/tasks.md).
- **Mandatory Action:** Immediately upon completing and verifying any milestone or subtask, update the checkbox (`- [x]`) in [docs/tasks.md](file:///G:/SIH/p/docs/tasks.md) to keep the project state synchronized.

---

## 6. Coding Conventions & Code Quality Standards

### 6.1. Backend (Python 3.11 / FastAPI)
- **Typing:** Strict type hints across all function signatures and return types using Python `typing` and Pydantic models.
- **Async/Await:** Use asynchronous I/O (`async def`) for all FastAPI routes, Ollama HTTP client interactions, and WebSocket broadcasts.
- **Error Handling:** Catch specific exceptions rather than bare `except:`. Tool errors must return structured JSON error payloads with tracebacks rather than crashing the server.
- **Docstrings & Comments:** All modules, classes, and tools must have clean docstrings explaining purpose, inputs, outputs, and safety constraints.

### 6.2. Frontend (Next.js 14 App Router / Tailwind CSS / Zustand)
- **Static Export Friendly:** Use standard React client components (`'use client'`) for interactive widgets, avoiding Node-only server runtime dependencies.
- **State Management:** Clean separation of UI state via **Zustand** stores (`useChatStore`, `useModelStore`, `useSovereigntyStore`, `useDeliverableStore`).
- **Accessibility & Theme:** High-contrast industrial dark slate theme (`#0f172a`), clear status indicators (green/red badges for air-gap status), responsive layout.

---

## 7. Directory Structure Enforcement & Strict Folder Separation

Adhere strictly to the monorepo-style split specified in [docs/file_structure.md](file:///G:/SIH/p/docs/file_structure.md):
- `/backend`: All Python code (FastAPI server, LangChain agent, tools, RAG, OCR, sandbox runner, sovereignty daemon) and its own `requirements.txt`. **No JS/TS files inside /backend.**
- `/frontend`: All Next.js/React/Tailwind/Zustand code and its own `package.json`. **No Python files inside /frontend.**
- `/docs`: All planning, architectural specs, and living guides.
- `/models`: Declarative model configurations (`models.yaml`).
- `/scripts`: Setup, environment checks, and hotspot configuration scripts.
- `/data`: Air-gapped persistent ChromaDB, SOP PDFs, sample inputs, and generated deliverables.

### Strict Folder Rules:
1. **Zero Mixing:** Backend code and frontend code must never be mixed across `/backend` and `/frontend` folders.
2. **Independent Lifecycle:** Each folder has its own dependency file and must be independently runnable and testable (`backend` via `uvicorn`, `frontend` via `next dev` / `next build`) without requiring the other folder present for basic startup.

---

## 8. Future Changes & Modification Protocol (Living Reference: `docs/CHANGE_GUIDE.md`)

- **Mandatory Pre-Change Step:** Whenever the user requests a change to a model, library, or core configuration, you **MUST first read [docs/CHANGE_GUIDE.md](file:///G:/SIH/p/docs/CHANGE_GUIDE.md)**, identify the relevant component section, generate a concise change plan (impacted files checklist + VRAM/air-gap impact + verification steps), and present it to the user for approval **BEFORE editing any code**.
- **No Unplanned Ad-Hoc Edits:** Do not make the change directly on request without this mini-plan step, unless the user explicitly commands: *"just do it without a plan."*
- **UI Approval Gate:** Before any new UI screen or major component is built, check [docs/ui_design.md](file:///G:/SIH/p/docs/ui_design.md) for the approved plan. If the screen/component isn't covered there, stop and propose an addition to the plan first.

---

## 9. Testing & Verification Reporting Rule (Real Hardware vs. Dev-Environment Fallback)

- **Mandatory Reporting Accuracy:** Any report claiming `"100% verified,"` `"PASS,"` or similar success language **must explicitly state whether the underlying test ran against REAL hardware/models/libraries or a DEV-ENVIRONMENT FALLBACK** (mock, simulated, subprocess, hash-based, fast-socket fallback, etc.).
- **Prohibition of Equivalence:** A passing test on a fallback path must **never** be reported using the same success language as a passing test on the real component, without that distinction clearly stated in the same sentence.
- **Example Compliant Phrasing:**
  - *Compliant:* "ARCHITECTURE & INTEGRATION VERIFIED (100%) — running in dev-environment fallback mode (hardened subprocess sandbox, local feature embeddings, Ollama fast-fallback) without physical GPU weights/Docker daemon active."
  - *Non-Compliant:* "Docker Sandbox & 6GB VRAM 100% VERIFIED AND PASSING." (when tested on subprocess fallback).

---

## 10. Zero-Refactor Scaling Principle

**Core Invariant:** *"Configuration-based model registries, hardware tier profiles, and plugin-based tool/compute registries let this architecture scale seamlessly from a single 6GB edge laptop to multi-GPU enterprise data center clusters (80GB A100/H100) without redesigning the software or refactoring a single line of code."*

### Architectural Rules Enforcing Zero-Refactor Scaling:
1. **Dynamic Model & Domain Declaration:** New models and new industrial domains (e.g. `financial_analysis`, `scada_telemetry`) MUST be declared exclusively in `models.yaml`. The `IntelligentRouter` dynamically derives all routing maps, regex patterns, and semantic centroids from the YAML definitions at startup. Zero hardcoded model names or domain lists are permitted in `router.py`.
2. **Config-Driven Hardware Profiles:** Hardware capabilities (VRAM budgets, OS overheads, KV cache allocations, concurrent active model slots, eviction strategies) MUST be defined in `hardware_profiles.yaml` and loaded via the `HARDWARE_PROFILE` environment variable or configuration. No memory constants may ever be hardcoded in Python logic.
3. **Pluggable Compute Backends:** New inference fabrics (Ollama, llama.cpp, vLLM, Ray, TGI) MUST implement the `ComputeBackend(ABC)` interface and register via `@register_compute_backend("name")`. Core engines resolve backends dynamically via `compute_backend_registry`.
4. **Plugin-Based Tool Registry:** New tools (e.g. SCADA Modbus readers, SAP ERP connectors, specialized physical property solvers) MUST register via `@tool_registry.register(name, description, schema)` without modifying the core ReAct agent execution loop in `engine.py`.
5. **Pluggable Sandbox Execution Fabrics:** Sandbox execution must adhere to `SandboxBackend(ABC)`, enabling clean transitions from local Docker/Subprocess isolation to Kubernetes Jobs, Ray clusters, or microVMs.
6. **Code Review Gate:** Any future pull request or code edit that hardcodes a model ID, a domain name, a tool handler, or a VRAM constant into core logic is considered an architectural violation and must be rejected and refactored into declarative YAML configuration or registry plugins.

---

## 11. Concrete Proof Standard for Completed Work

**Core Invariant:** *"Every report claiming a file was created or modified MUST include either (a) the actual tool call output from file modification tools, or (b) a subsequent `view_file` / grep of the real file content as proof. A report describing 'before/after' behavior without one of these two proofs is not acceptable and must not be presented as completed work."*

- **OS-Level Command Output Mandatory:** Any report claiming file creation/modification must be accompanied by at least one OS-level verification command (`dir`/`Get-Item` for existence+timestamp+size, or `Select-String`/`grep` for content matches) with RAW, unedited output shown — not just a `Read()`/`view_file()` of the file content, since that alone has previously been presented inaccurately. Timestamps must be checked against the actual current date to confirm recency.
