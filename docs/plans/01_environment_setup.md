# Plan 01: Environment Setup & Hardware Baseline Verification

## 1. Objective
Establish the foundational Python 3.11 virtual environment, Node.js runtime, NVIDIA CUDA 12.2+ acceleration bindings, and operating system configuration to guarantee a stable, air-gapped execution environment within a strict 6.0 GB VRAM ceiling.

## 2. Requirement Mapping
- **SIH26117 Requirement 01:** *SELF-HOSTED & AIR-GAPPED* — The entire AI platform must operate on-premises on the organization's dedicated GPU hardware without any dependency on external cloud services.
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Mid-range GPU workstation (NVIDIA RTX 3050 6GB / RTX 4060 8GB) baseline.

## 3. Detailed Design & Technical Approach

### 3.1. Python Environment Setup
- **Python Version:** Python 3.11.x (64-bit).
- **Environment Isolation:** Use Python `venv` located at `.venv/` within the project root.
- **Offline Environment Flags:** Set permanently in `.env` and backend startup script:
  ```bash
  export DO_NOT_TRACK=1
  export HF_HUB_OFFLINE=1
  export TRANSFORMERS_OFFLINE=1
  export PADDLE_PDX_DISABLE_REPORT=1
  export OLLAMA_NOPRUNE=1
  export TOKENIZERS_PARALLELISM=false
  ```

### 3.2. CUDA & GPU Verification Protocol
- Verify CUDA 12.2+ toolchain and PyTorch GPU capability via Python script:
  ```python
  import torch
  assert torch.cuda.is_available(), "CRITICAL: CUDA is not available on host GPU!"
  gpu_name = torch.cuda.get_device_name(0)
  total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
  print(f"Detected GPU: {gpu_name} with {total_vram_gb:.2f} GB Total VRAM")
  assert total_vram_gb >= 5.5, f"Insufficient VRAM: {total_vram_gb:.2f} GB < 6.0 GB baseline."
  ```

### 3.3. Node.js & Next.js Build Environment
- **Node Version:** Node.js v18.18+ or v20.x LTS.
- **Package Manager:** `npm` (pinned lockfile `package-lock.json`).

## 4. Inputs / Outputs & Contracts
- **Input:** Host hardware environment (NVIDIA GPU, OS Windows 11 / Ubuntu 22.04).
- **Output:** Active `.venv` environment, verified CUDA runtime bindings, verified Node.js toolchain.

## 5. Dependencies on Other Plan Files
- Depends on: None (Root prerequisite).
- Depended on by: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 06](file:///G:/SIH/p/docs/plans/06_docker_sandbox_setup.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **CUDA Version Mismatch:** If PyTorch CUDA version does not match driver version, fallback to PyTorch `cu121` wheel with explicit extra-index-url.
- **VRAM Constraint on Integrated GPU:** If laptop defaults to Intel/AMD iGPU instead of NVIDIA dGPU, force device selection via `CUDA_VISIBLE_DEVICES=0`.

## 7. Acceptance Criteria & Verification
- `python -c "import torch; print(torch.cuda.is_available())"` returns `True`.
- `nvidia-smi` reports driver version $\ge 535$ and CUDA version $\ge 12.2$.
- Next.js build environment returns valid `node -v` ($\ge 18.18.0$) and `npm -v` ($\ge 9.0.0$).

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Standard `venv` is chosen over `poetry` to reduce setup friction in air-gapped enterprise environments where extra package management CLI tools may not be pre-installed.
