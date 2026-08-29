# Plan 16: Router Accuracy Benchmarking & Testing Suite

## 1. Objective
Establish the automated unit testing and validation suite for the two-stage routing engine, verifying $> 99.0\%$ classification accuracy across a curated dataset of industrial refinery prompts.

## 2. Requirement Mapping
- **SIH26117 Requirement 04:** *INTELLIGENT AUTO-SELECTION* — Accurate classification across coding, reasoning, vision, and general domains.
- **SIH26117 Requirement 13:** *MODEL AUTO-SELECTION (2+ TASK TYPES)* — Empirical auto-routing validation.

## 3. Detailed Design & Technical Approach

### 3.1. Benchmark Evaluation Test Suite (`tests/test_router_accuracy.py`)
```python
import pytest
from backend.core.router import IntelligentRouter

BENCHMARK_PROMPTS = [
    # Coding Task Suite -> qwen2.5-coder-3b
    ("Write a python script to calculate centrifugal pump hydraulic power for flow=250, head=45", "coding", "qwen2.5-coder-3b"),
    ("def calculate_reynolds(density, velocity, diameter, viscosity): return (density * velocity * diameter) / viscosity", "coding", "qwen2.5-coder-3b"),
    ("Fix this Python IndexError traceback in the furnace calculation loop", "coding", "qwen2.5-coder-3b"),
    ("Generate a pandas script to aggregate crude oil throughput metrics by shift", "coding", "qwen2.5-coder-3b"),
    
    # Reasoning Task Suite -> qwen3-4b
    ("Draft an urgent executive approval note for furnace F-101 emergency decoking turnaround", "reasoning", "qwen3-4b"),
    ("Evaluate SOP-MRPL-SAFETY-09 clause 4.2 compliance regarding hazardous gas thresholds", "reasoning", "qwen3-4b"),
    ("Perform root cause analysis on high tube skin temperature alarms and synthesize recommendations", "reasoning", "qwen3-4b"),
    ("Prepare formal management memo on turnaround scheduling strategy for Crude Distillation Unit", "reasoning", "qwen3-4b"),
    
    # Vision Task Suite -> qwen2-vl-2b
    ("Extract equipment tags and valve IDs from this scanned P&ID drawing", "vision", "qwen2-vl-2b"),
    ("Run OCR on the attached furnace inspection log sheet and read skin temperatures", "vision", "qwen2-vl-2b"),
    ("Identify transmitter tags and flow control valves in the diagram", "vision", "qwen2-vl-2b"),
    ("Read handwritten operator notes from the field maintenance log", "vision", "qwen2-vl-2b"),
    
    # General Task Suite -> llama-3.2-3b
    ("Hello, what capabilities does the sovereign workbench offer?", "general", "llama-3.2-3b"),
    ("Summarize the key safety points in plain, simple English", "general", "llama-3.2-3b"),
    ("Good morning assistant, please format this bullet list", "general", "llama-3.2-3b")
]

@pytest.mark.parametrize("prompt, expected_domain, expected_model", BENCHMARK_PROMPTS)
def test_router_accuracy(prompt, expected_domain, expected_model):
    router = IntelligentRouter()
    result = router.route(prompt)
    assert result["domain"] == expected_domain, f"Prompt '{prompt}' classified as {result['domain']}, expected {expected_domain}"
    assert result["target_model_id"] == expected_model
```

## 4. Inputs / Outputs & Contracts
- **Input:** 50 benchmark prompt-domain pairs.
- **Output:** Test execution report with precision, recall, and overall accuracy percentage.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 14](file:///G:/SIH/p/docs/plans/14_router_stage1_regex.md), [Plan 15](file:///G:/SIH/p/docs/plans/15_router_stage2_semantic.md).
- Depended on by: [Plan 17](file:///G:/SIH/p/docs/plans/17_router_api_contract.md), [Plan 45](file:///G:/SIH/p/docs/plans/45_backend_testing_plan.md).

## 6. Edge Cases & Failure Modes
- **Boundary Prompts (e.g. "Summarize python code"):** Prioritizes semantic intent (summarize = reasoning/general vs. executable code = coding).

## 7. Acceptance Criteria & Verification
- `pytest tests/test_router_accuracy.py` executes 100% passing.
- Total routing latency for the entire 50-test suite is under 500ms.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Test suite includes both clear regex matches and subtle semantic paraphrases to validate both routing stages.
