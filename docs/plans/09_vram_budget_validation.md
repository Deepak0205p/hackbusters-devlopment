# Plan 09: VRAM Budget Calculation & Byte-Level Validation Plan

## 1. Objective
Establish the exact mathematical VRAM budget allocation formulas, real-time memory probing via `pynvml`, and strict ceiling enforcement to ensure total GPU memory usage never exceeds 5.5 GB on a 6.0 GB hardware workstation.

## 2. Requirement Mapping
- **SIH26117 Requirement 03:** *SIMULTANEOUS MULTI-MODEL SUPPORT* — Exact VRAM allocation (0.5GB OS, 2.8GB primary model, 2.0GB secondary model, 0.7GB KV cache).

## 3. Detailed Design & Technical Approach

### 3.1. Exact Mathematical VRAM Budget Breakdown
$$\text{Total Available VRAM} = 6.0\text{ GB} = 6144\text{ MB}$$

| Segment | Allocated Size (GB) | Allocated Size (MB) | Exact Role |
| :--- | :--- | :--- | :--- |
| **OS & Display Compositor** | **0.50 GB** | **512 MB** | Desktop GUI, X11/DWM display buffers |
| **Primary Model (Qwen 3 4B)** | **2.80 GB** | **2867 MB** | Main reasoning & planning engine |
| **Secondary Model (Coder 3B / VL 2B)** | **2.00 GB** | **2048 MB** | Active code generation or vision task model |
| **KV Cache & Runtime Buffers** | **0.70 GB** | **717 MB** | 8K context KV cache and PyTorch scratchpad |
| **Total Committed GPU Memory** | **5.50 GB** | **5632 MB** | $\le 5632\text{ MB}$ |
| **Safety Headroom Buffer** | **0.50 GB** | **512 MB** | OOM emergency margin |

$$\text{Committed VRAM} = 512 + 2867 + 2048 + 717 = 5632\text{ MB } (91.6\% \text{ of 6144 MB})$$

### 3.2. Real-Time VRAM Probing via `pynvml` (`backend/core/vram_monitor.py`)
```python
import pynvml
from typing import Dict, Any

class VRAMMonitor:
    def __init__(self, device_index: int = 0):
        self.device_index = device_index
        try:
            pynvml.nvmlInit()
            self.handle = pynvml.nvmlDeviceGetHandleByIndex(device_index)
            self.is_available = True
        except Exception:
            self.is_available = False

    def get_vram_status(self) -> Dict[str, Any]:
        if not self.is_available:
            return {
                "available": False,
                "used_mb": 4600.0,
                "total_mb": 6144.0,
                "free_mb": 1544.0,
                "usage_percent": 74.8
            }
        info = pynvml.nvmlDeviceGetMemoryInfo(self.handle)
        used_mb = info.used / (1024 * 1024)
        total_mb = info.total / (1024 * 1024)
        free_mb = info.free / (1024 * 1024)
        return {
            "available": True,
            "used_mb": round(used_mb, 2),
            "total_mb": round(total_mb, 2),
            "free_mb": round(free_mb, 2),
            "usage_percent": round((used_mb / total_mb) * 100, 2)
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** GPU handle index 0.
- **Output:** Current VRAM telemetry dictionary (`used_mb`, `total_mb`, `free_mb`, `usage_percent`).

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 01](file:///G:/SIH/p/docs/plans/01_environment_setup.md), [Plan 08](file:///G:/SIH/p/docs/plans/08_models_yaml_schema.md).
- Depended on by: [Plan 10](file:///G:/SIH/p/docs/plans/10_model_swapping_lru.md), [Plan 44](file:///G:/SIH/p/docs/plans/44_websocket_streaming.md), [Plan 47](file:///G:/SIH/p/docs/plans/47_ui_components.md).

## 6. Edge Cases & Failure Modes
- **Hardware Without NVIDIA GPU (Development Fallback):** `pynvml` initialization failure handled gracefully with synthetic telemetry for CI/dev workstations.
- **VRAM Spike Beyond 5.6 GB:** If active usage exceeds 5632 MB, the LRU swapping manager forces an immediate eviction cycle before accepting new inference tasks.

## 7. Acceptance Criteria & Verification
- `VRAMMonitor().get_vram_status()` returns valid JSON metrics matching `nvidia-smi` reading within $\pm 2\%$.
- Automated test verifies total theoretical model footprint never exceeds 5.5 GB limit.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `pynvml` is chosen over parsing `nvidia-smi` subprocess stdout because direct C-binding calls take $< 1\text{ ms}$ vs $> 80\text{ ms}$ for subprocess spawning.
