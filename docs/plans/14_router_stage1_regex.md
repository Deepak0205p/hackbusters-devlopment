# Plan 14: Router Stage 1: Deterministic Regex & Keyword Classifier Design

## 1. Objective
Design the ultra-fast (< 2ms) Stage 1 deterministic regex and keyword rule matcher in `backend/core/router.py` to classify high-confidence industrial intents into Coding, Reasoning, Vision, and General categories.

## 2. Requirement Mapping
- **SIH26117 Requirement 04:** *INTELLIGENT AUTO-SELECTION* — System must automatically classify incoming tasks (coding, reasoning, vision, general) and route them to the optimal specialized model.
- **SIH26117 Requirement 13:** *MODEL AUTO-SELECTION (2+ TASK TYPES)* — Empirical auto-routing across Coding, Deep Reasoning, and Vision tasks.

## 3. Detailed Design & Technical Approach

### 3.1. Intent Rule Specification

```python
import re
from typing import Optional, Dict, Any, List

class Stage1RuleClassifier:
    CODING_PATTERNS = [
        re.compile(r'(?i)\b(def|class|import|return|lambda|function|variable|stdout|stderr|traceback|syntaxerror|exception)\b'),
        re.compile(r'(?i)\b(write|create|generate|fix|debug|run|execute|test)\s+(a\s+)?(python|script|code|program|function|algorithm)\b'),
        re.compile(r'(?i)\b(calculate|compute)\b.*?\b(hydraulic efficiency|brake horsepower|flow rate|reynolds number|head loss|pressure drop)\b'),
        re.compile(r'(?i)\b(pandas|dataframe|numpy|matplotlib|scipy|sympy|docker)\b')
    ]

    REASONING_PATTERNS = [
        re.compile(r'(?i)\b(draft|prepare|generate|write)\s+(an?\s+)?(approval note|executive summary|mopng memo|turnaround plan|sop compliance)\b'),
        re.compile(r'(?i)\b(evaluate|analyze|assess|synthesize)\b.*?\b(policy|safety standard|refinery sop|clause|deviation|root cause)\b'),
        re.compile(r'(?i)\b(plan|break down|step by step|sop-mrpl|refinery manual)\b'),
        re.compile(r'(?i)\b(furnace tube|decoking|corrosion rate|operating window)\b')
    ]

    VISION_PATTERNS = [
        re.compile(r'(?i)\b(ocr|scan|scanned|read|extract|inspect|diagram|schematic|p&id|piping and instrumentation|drawing|photo)\b'),
        re.compile(r'(?i)\b(read the attached|extract text from|identify valves in|transmitters in|read gauge)\b'),
        re.compile(r'(?i)\b(paddleocr|tesseract|tag|valve tag|pump tag)\b')
    ]

    GENERAL_PATTERNS = [
        re.compile(r'(?i)\b(hello|hi|hey|greetings|who are you|what can you do|explain in simple terms|summarize our conversation)\b')
    ]

    def classify(self, prompt: str, has_attachments: bool = False) -> Optional[Dict[str, Any]]:
        # Hard rule: If multimodal attachments present, route immediately to Vision
        if has_attachments:
            return {
                "domain": "vision",
                "target_model_id": "qwen2-vl-2b",
                "confidence": 1.0,
                "stage": "stage1_attachment_detection"
            }

        # Check Coding patterns
        for pattern in self.CODING_PATTERNS:
            if pattern.search(prompt):
                return {
                    "domain": "coding",
                    "target_model_id": "qwen2.5-coder-3b",
                    "confidence": 0.95,
                    "stage": "stage1_regex"
                }

        # Check Reasoning patterns
        for pattern in self.REASONING_PATTERNS:
            if pattern.search(prompt):
                return {
                    "domain": "reasoning",
                    "target_model_id": "qwen3-4b",
                    "confidence": 0.92,
                    "stage": "stage1_regex"
                }

        # Check Vision text patterns
        for pattern in self.VISION_PATTERNS:
            if pattern.search(prompt):
                return {
                    "domain": "vision",
                    "target_model_id": "qwen2-vl-2b",
                    "confidence": 0.90,
                    "stage": "stage1_regex"
                }

        # Check General patterns
        for pattern in self.GENERAL_PATTERNS:
            if pattern.search(prompt):
                return {
                    "domain": "general",
                    "target_model_id": "llama-3.2-3b",
                    "confidence": 0.88,
                    "stage": "stage1_regex"
                }

        # If no deterministic match, return None to trigger Stage 2 Semantic Matcher
        return None
```

## 4. Inputs / Outputs & Contracts
- **Input:** User prompt string, `has_attachments` boolean flag.
- **Output:** Classification dictionary `{domain, target_model_id, confidence, stage}` or `None`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 08](file:///G:/SIH/p/docs/plans/08_models_yaml_schema.md).
- Depended on by: [Plan 15](file:///G:/SIH/p/docs/plans/15_router_stage2_semantic.md), [Plan 16](file:///G:/SIH/p/docs/plans/16_router_accuracy_testing.md), [Plan 17](file:///G:/SIH/p/docs/plans/17_router_api_contract.md).

## 6. Edge Cases & Failure Modes
- **Compound Prompts (e.g. "Calculate pump efficiency and draft approval note"):** Rule order prioritizes Coding if executable code generation is detected, then chains to Reasoning in multi-step agent loop.

## 7. Acceptance Criteria & Verification
- Execution time $< 2.0\text{ ms}$ for prompts up to 2,000 characters.
- Deterministic test suite passes with 100% accuracy on explicit keyword triggers.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Attachment presence directly overrides text rules to ensure multimodal visual schematics never route to text-only models.
