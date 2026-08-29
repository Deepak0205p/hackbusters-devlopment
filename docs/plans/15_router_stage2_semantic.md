# Plan 15: Router Stage 2: Dense Semantic Embedding Fallback Design

## 1. Objective
Design the Stage 2 dense semantic fallback matcher using local `BAAI/bge-small-en-v1.5` embeddings, resolving ambiguous or complex user prompts in under 25ms by computing cosine similarity against pre-computed task domain centroid vectors.

## 2. Requirement Mapping
- **SIH26117 Requirement 04:** *INTELLIGENT AUTO-SELECTION* — Semantic similarity matching against domain-specific embeddings when intent is uncertain.

## 3. Detailed Design & Technical Approach

### 3.1. Domain Centroid Vectors & Embedding Logic (`backend/core/semantic_router.py`)
```python
import numpy as np
from typing import Dict, Any, List
from sentence_transformers import SentenceTransformer

class SemanticRouterFallback:
    DOMAIN_ANCHORS = {
        "coding": [
            "Write a Python script to compute mathematical formulas and data transformations.",
            "Debug this code traceback and fix syntax errors.",
            "Calculate engineering equations, fluid dynamics, flow rates, and efficiencies in python.",
            "Process tabular data using pandas dataframe and numpy arrays."
        ],
        "reasoning": [
            "Draft a formal executive approval note citing refinery standard operating procedures.",
            "Analyze policy compliance, risk assessments, safety standard deviations, and turnaround plans.",
            "Perform root cause analysis on furnace skin temperatures and prepare a management summary.",
            "Synthesize technical findings into an official engineering memo."
        ],
        "vision": [
            "Extract text, labels, and tabular values from scanned PDF inspection reports.",
            "Identify valves, pumps, and transmitters in this piping and instrumentation diagram.",
            "Read handwritten field log notes and equipment gauge photos.",
            "Perform optical character recognition on degraded industrial documents."
        ],
        "general": [
            "General conversational greeting and casual assistant interaction.",
            "Explain this general concept in plain, simple terms.",
            "Help me format and summarize generic notes."
        ]
    }

    DOMAIN_MODEL_MAP = {
        "coding": "qwen2.5-coder-3b",
        "reasoning": "qwen3-4b",
        "vision": "qwen2-vl-2b",
        "general": "llama-3.2-3b"
    }

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        # Load local embedding model in offline mode
        self.encoder = SentenceTransformer(model_name)
        self.domain_centroids = self._compute_centroids()

    def _compute_centroids(self) -> Dict[str, np.ndarray]:
        centroids = {}
        for domain, texts in self.DOMAIN_ANCHORS.items():
            embeddings = self.encoder.encode(texts, normalize_embeddings=True)
            centroid = np.mean(embeddings, axis=0)
            centroids[domain] = centroid / np.linalg.norm(centroid)
        return centroids

    def classify_semantic(self, prompt: str) -> Dict[str, Any]:
        prompt_vec = self.encoder.encode([prompt], normalize_embeddings=True)[0]
        
        scores = {}
        for domain, centroid in self.domain_centroids.items():
            sim = float(np.dot(prompt_vec, centroid))
            scores[domain] = sim
            
        best_domain = max(scores, key=scores.get)
        best_score = scores[best_domain]

        # If similarity is extremely weak (< 0.25), fallback to general assistant
        if best_score < 0.25:
            best_domain = "general"

        return {
            "domain": best_domain,
            "target_model_id": self.DOMAIN_MODEL_MAP[best_domain],
            "confidence": round(best_score, 3),
            "stage": "stage2_semantic_bge",
            "all_scores": {k: round(v, 3) for k, v in scores.items()}
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Raw ambiguous user prompt string.
- **Output:** Classification payload with confidence score, target model ID, and score distribution.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 14](file:///G:/SIH/p/docs/plans/14_router_stage1_regex.md).
- Depended on by: [Plan 16](file:///G:/SIH/p/docs/plans/16_router_accuracy_testing.md), [Plan 17](file:///G:/SIH/p/docs/plans/17_router_api_contract.md), [Plan 18](file:///G:/SIH/p/docs/plans/18_langchain_react_agent.md).

## 6. Edge Cases & Failure Modes
- **Single-Word Ambiguous Input (e.g. "Centrifugal"):** Semantic vector matches `coding` or `reasoning` centroid depending on closest anchor score; if tied, defaults to `qwen3-4b`.

## 7. Acceptance Criteria & Verification
- Execution time $< 25\text{ ms}$ on CPU/GPU.
- Benchmark test of 50 ambiguous test prompts achieves $> 95\%$ domain accuracy.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Pre-computing and normalizing centroid vectors during initialization reduces cosine similarity calculation to a single matrix multiplication vector dot product.
