# Plan 29: ChromaDB Local Schema & Vector Collection Design

## 1. Objective
Design the persistent, embedded ChromaDB vector database in `backend/rag/vector_store.py`, storing MRPL refinery manuals, safety SOPs, and asset registries locally on disk (`data/chromadb/`) using DuckDB/SQLite storage with zero external network connectivity.

## 2. Requirement Mapping
- **SIH26117 Requirement 11:** *GROUNDED LOCAL KNOWLEDGE BASE* — RAG using local vector embeddings grounded in refinery SOPs and equipment manuals.

## 3. Detailed Design & Technical Approach

### 3.1. Collection Metadata & Schema Layout
The embedded ChromaDB client creates two dedicated collections:
1. **`mrpl_sops`**: Indexes refinery safety standards, operating manuals, and turnaround guidelines.
2. **`equipment_registry`**: Indexes refinery asset specifications, design tolerances, and tag records.

### Metadata Schema per Document Chunk:
```json
{
  "doc_id": "sop_furnace_01_chunk_14",
  "source_document": "SOP-MRPL-FURNACE-01.pdf",
  "document_title": "Standard Operating Procedure: Process Heaters and Furnaces",
  "sop_code": "SOP-MRPL-FURNACE-01",
  "clause_number": "Clause 4.1.2",
  "section_heading": "4.1 Furnace Tube Skin Temperature Limits",
  "page_number": 14,
  "chunk_index": 14,
  "char_count": 485,
  "created_timestamp": 1724544000
}
```

### 3.2. Vector Store Wrapper Implementation (`backend/rag/vector_store.py`)
```python
import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict, Any, Optional

class LocalVectorStore:
    def __init__(self, persist_dir: str = "data/chromadb"):
        self.persist_dir = persist_dir
        os.makedirs(persist_dir, exist_ok=True)
        # Initialize embedded persistent ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False, is_persistent=True)
        )
        self.sops_collection = self.client.get_or_create_collection(
            name="mrpl_sops",
            metadata={"description": "MRPL Standard Operating Procedures and Refinery Manuals"}
        )
        self.equip_collection = self.client.get_or_create_collection(
            name="equipment_registry",
            metadata={"description": "MRPL Refinery Asset and Tag Register"}
        )

    def add_chunks(self, collection_name: str, chunks: List[Dict[str, Any]]):
        col = self.sops_collection if collection_name == "mrpl_sops" else self.equip_collection
        ids = [c["id"] for c in chunks]
        embeddings = [c["embedding"] for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]
        
        col.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    def query(self, collection_name: str, query_embedding: List[float], top_k: int = 3) -> List[Dict[str, Any]]:
        col = self.sops_collection if collection_name == "mrpl_sops" else self.equip_collection
        results = col.query(query_embeddings=[query_embedding], n_results=top_k)
        
        formatted = []
        if results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            dists = results["distances"][0]
            ids = results["ids"][0]
            
            for doc_id, doc, meta, dist in zip(ids, docs, metas, dists):
                formatted.append({
                    "id": doc_id,
                    "text": doc,
                    "metadata": meta,
                    "similarity_score": round(1.0 - dist, 4)
                })
        return formatted
```

## 4. Inputs / Outputs & Contracts
- **Input:** Document text chunks, 384-dimensional embeddings, metadata dictionaries.
- **Output:** Query results list with exact metadata, SOP clauses, and cosine similarity scores.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md).
- Depended on by: [Plan 30](file:///G:/SIH/p/docs/plans/30_document_ingestion_pipeline.md), [Plan 31](file:///G:/SIH/p/docs/plans/31_embedding_generation_bge.md), [Plan 32](file:///G:/SIH/p/docs/plans/32_provenance_citations.md).

## 6. Edge Cases & Failure Modes
- **ChromaDB Database Lock on Sudden Shutdown:** PersistentClient SQLite locks handled cleanly with read retry logic.

## 7. Acceptance Criteria & Verification
- Collections persist on disk across process restarts without data loss.
- `Settings(anonymized_telemetry=False)` strictly verifies 0 network telemetry pings.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Embedded SQLite mode (`PersistentClient`) avoids spawning a separate ChromaDB daemon process, saving RAM and eliminating an extra port listener.
