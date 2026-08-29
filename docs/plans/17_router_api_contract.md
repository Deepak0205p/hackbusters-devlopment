# Plan 17: Router API Contract & Internal Module Interface

## 1. Objective
Define the internal Python module interface and REST API contract for the Intelligent Router in `backend/core/router.py`, unifying Stage 1 deterministic rules with Stage 2 semantic fallbacks under a single asynchronous facade.

## 2. Requirement Mapping
- **SIH26117 Requirement 04:** *INTELLIGENT AUTO-SELECTION* — Seamless routing interface between input prompts and model manager.

## 3. Detailed Design & Technical Approach

### 3.1. Unified Intelligent Router Engine (`backend/core/router.py`)
```python
import time
from typing import Dict, Any, Optional, List
from backend.core.stage1_rules import Stage1RuleClassifier
from backend.core.semantic_router import SemanticRouterFallback

class IntelligentRouter:
    def __init__(self, semantic_model_name: str = "BAAI/bge-small-en-v1.5"):
        self.stage1 = Stage1RuleClassifier()
        self.stage2 = None # Lazy-load on first ambiguous query
        self.semantic_model_name = semantic_model_name

    def route(self, prompt: str, attachments: Optional[List[str]] = None) -> Dict[str, Any]:
        start_time = time.perf_counter()
        has_attachments = bool(attachments and len(attachments) > 0)
        
        # 1. Attempt Stage 1 Deterministic Classification
        s1_result = self.stage1.classify(prompt, has_attachments=has_attachments)
        if s1_result:
            s1_result["latency_ms"] = round((time.perf_counter() - start_time) * 1000, 2)
            return s1_result
        
        # 2. Fallback to Stage 2 Dense Semantic Matcher
        if self.stage2 is None:
            self.stage2 = SemanticRouterFallback(model_name=self.semantic_model_name)
            
        s2_result = self.stage2.classify_semantic(prompt)
        s2_result["latency_ms"] = round((time.perf_counter() - start_time) * 1000, 2)
        return s2_result
```

### 3.2. Router Pydantic Schema
```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class RoutingRequest(BaseModel):
    prompt: str
    attachments: Optional[List[str]] = None

class RoutingResponse(BaseModel):
    domain: str = Field(..., description="Target domain: coding, reasoning, vision, general")
    target_model_id: str = Field(..., description="Selected model identifier")
    confidence: float = Field(..., ge=0.0, le=1.0)
    stage: str = Field(..., description="stage1_regex, stage1_attachment_detection, or stage2_semantic_bge")
    latency_ms: float
    all_scores: Optional[Dict[str, float]] = None
```

## 4. Inputs / Outputs & Contracts
- **Input:** `RoutingRequest` with prompt and file paths.
- **Output:** `RoutingResponse` containing domain classification, model selection, confidence, and execution latency.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 14](file:///G:/SIH/p/docs/plans/14_router_stage1_regex.md), [Plan 15](file:///G:/SIH/p/docs/plans/15_router_stage2_semantic.md).
- Depended on by: [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md), [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md).

## 6. Edge Cases & Failure Modes
- **Empty / Whitespace Prompt:** Default to `llama-3.2-3b` (General) with confidence 1.0.

## 7. Acceptance Criteria & Verification
- Stage 1 execution returns in $< 2.0\text{ ms}$.
- Stage 2 execution returns in $< 25.0\text{ ms}$.
- JSON output conforms strictly to `RoutingResponse` Pydantic model.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Lazy-loading the Stage 2 embedding model saves startup memory until an ambiguous prompt is encountered.
