# Plan 31: Local Embedding Generation with BAAI/bge-small-en-v1.5

## 1. Objective
Design the local embedding engine in `backend/rag/embeddings.py` using `BAAI/bge-small-en-v1.5`, producing normalized 384-dimensional dense vectors with sub-15ms latency on CPU/GPU in complete offline mode.

## 2. Requirement Mapping
- **SIH26117 Requirement 11:** *GROUNDED LOCAL KNOWLEDGE BASE* — Local embedding models (BAAI/bge-small-en-v1.5) running on CPU/GPU without internet access.

## 3. Detailed Design & Technical Approach

### 3.1. Local Embedding Model Wrapper (`backend/rag/embeddings.py`)
```python
import os
from typing import List
from sentence_transformers import SentenceTransformer

# Enforce offline mode
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

class LocalEmbeddingEngine:
    def __init__(self, model_path: str = "BAAI/bge-small-en-v1.5"):
        self.model_path = model_path
        # SentenceTransformer loads model from local HuggingFace cache or path
        self.model = SentenceTransformer(model_path, device="cpu") # Run on CPU to leave VRAM for LLMs

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(
            texts,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        # BGE models benefit from instruction prefix on queries
        prefixed = f"Represent this sentence for searching relevant passages: {text}"
        embedding = self.model.encode(
            [prefixed],
            show_progress_bar=False,
            normalize_embeddings=True
        )[0]
        return embedding.tolist()
```

## 4. Inputs / Outputs & Contracts
- **Input:** Document text strings or search query.
- **Output:** Normalized 384-element float vectors (`List[float]`).

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 29](file:///G:/SIH/p/docs/plans/29_chromadb_schema.md).
- Depended on by: [Plan 30](file:///G:/SIH/p/docs/plans/30_document_ingestion_pipeline.md), [Plan 32](file:///G:/SIH/p/docs/plans/32_provenance_citations.md), [Plan 33](file:///G:/SIH/p/docs/plans/33_sop_seed_data_plan.md).

## 6. Edge Cases & Failure Modes
- **HuggingFace Cache Missing on Fresh Machine:** Pre-bundle model snapshot inside `data/models/bge-small-en-v1.5` so offline boot never fails.

## 7. Acceptance Criteria & Verification
- Output vector dimension is exactly 384.
- Vector L2 norm is equal to $1.000 \pm 0.001$.
- Batch embedding of 50 chunks executes in $< 200\text{ ms}$ on CPU.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Running BGE embeddings on CPU requires only ~150MB of system RAM and 0 MB of VRAM, preserving maximum GPU memory for 4B LLM generation.
