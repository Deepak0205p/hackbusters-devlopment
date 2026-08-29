# Plan 33: Seed SOP & Manual Dataset Creation Plan

## 1. Objective
Establish and generate the seed library of authentic MRPL refinery Standard Operating Procedures (`data/sop_docs/`), providing grounded knowledge for process heaters, centrifugal pumps, and hazardous safety standards to power demo scenarios 1, 2, and 3.

## 2. Requirement Mapping
- **SIH26117 Requirement 11:** *GROUNDED LOCAL KNOWLEDGE BASE* — Stores MRPL refinery manuals, safety SOPs, and historical correspondence in a local ChromaDB vector store.
- **SIH26117 Requirement 14:** *END-TO-END INDUSTRIAL AGENTIC TASK* — Verifies SOP guidance to prepare urgent approval notes.

## 3. Detailed Design & Technical Approach

### 3.1. Seed Document Catalog (`data/sop_docs/`)

#### 1. `SOP-MRPL-FURNACE-01.pdf` (Process Heaters & Decoking SOP)
- **Title:** *Standard Operating Procedure for Crude Distillation Unit Process Heaters and Emergency Decoking Operations*
- **Key Clauses:**
  - `Clause 3.1.1`: Normal furnace tube skin temperature operating window: $520^\circ\text{C} - 580^\circ\text{C}$.
  - `Clause 4.1.2`: Skin Temperature Upper Limit: *When furnace tube skin temperature exceeds $610^\circ\text{C}$ continuously for $> 2\text{ hours}$ or corrosion rate exceeds $0.40\text{ mm/yr}$, emergency decoking turnaround must be scheduled within 7 calendar days.*
  - `Clause 5.2.0`: Approval Authority: *Approval for emergency decoking turnaround must be endorsed by the Chief General Manager (Operations) and Executive Director (Technical Services).*

#### 2. `SOP-MRPL-PUMP-04.pdf` (Centrifugal Pumps SOP)
- **Title:** *Standard Operating Procedure for Rotary Equipment Maintenance & Hydraulic Calculations*
- **Key Clauses:**
  - `Clause 2.4.1`: Hydraulic power equation: $P_{\text{hyd}} = \frac{Q \times \rho \times g \times H}{3600 \times 1000}\text{ kW}$.
  - `Clause 3.2.0`: Efficiency Standard: *Minimum acceptable operational hydraulic efficiency for primary crude booster pumps (P-101A/B) is $70.0\%$. Units operating below $65.0\%$ must be flagged for immediate impeller overhaul.*

#### 3. `SOP-MRPL-SAFETY-09.pdf` (Refinery Safety & Gas Thresholds)
- **Title:** *Mangalore Refinery Safety Standard: Hazardous Gas Monitoring and Work Permit Requirements*
- **Key Clauses:**
  - `Clause 1.2.3`: Mandatory PPE and hot-work permits required for turnaround entry into heater zones.
  - `Clause 4.2.1`: Continuous LEL (Lower Explosive Limit) monitoring mandatory ($< 10\%\text{ LEL}$).

### 3.2. Pre-Seeding Script (`backend/rag/seed_database.py`)
```python
import os
from backend.rag.ingest import DocumentIngestor
from backend.rag.embeddings import LocalEmbeddingEngine
from backend.rag.vector_store import LocalVectorStore

def seed_all_sops():
    ingestor = DocumentIngestor()
    embedder = LocalEmbeddingEngine()
    store = LocalVectorStore()

    sops_meta = [
        ("data/sop_docs/SOP-MRPL-FURNACE-01.pdf", "MRPL Process Heaters & Decoking SOP", "SOP-MRPL-FURNACE-01"),
        ("data/sop_docs/SOP-MRPL-PUMP-04.pdf", "MRPL Rotary Equipment & Pump SOP", "SOP-MRPL-PUMP-04"),
        ("data/sop_docs/SOP-MRPL-SAFETY-09.pdf", "MRPL Refinery Safety Standards", "SOP-MRPL-SAFETY-09")
    ]

    for path, title, code in sops_meta:
        if os.path.exists(path):
            chunks = ingestor.chunk_document(path, title, code)
            texts = [c["text"] for c in chunks]
            embeddings = embedder.embed_documents(texts)
            for chunk, emb in zip(chunks, embeddings):
                chunk["embedding"] = emb
            store.add_chunks("mrpl_sops", chunks)
            print(f"Indexed {len(chunks)} chunks for {code}")
```

## 4. Inputs / Outputs & Contracts
- **Input:** 3 formatted seed PDF documents in `data/sop_docs/`.
- **Output:** Populated local ChromaDB collection `mrpl_sops`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 30](file:///G:/SIH/p/docs/plans/30_document_ingestion_pipeline.md), [Plan 31](file:///G:/SIH/p/docs/plans/31_embedding_generation_bge.md).
- Depended on by: [Plan 32](file:///G:/SIH/p/docs/plans/32_provenance_citations.md), [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **PDF Generation Script on Fresh Host:** Provide a synthetic PDF builder script (`scripts/build_sample_sops.py`) using `fpdf2` or `reportlab` to generate clean sample PDFs during initial setup.

## 7. Acceptance Criteria & Verification
- Querying ChromaDB for *"furnace skin temperature limit"* retrieves `SOP-MRPL-FURNACE-01 Clause 4.1.2` with similarity $> 0.85$.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Crafting authentic refinery engineering clauses with specific temperature ($610^\circ\text{C}$) and efficiency ($70.0\%$) thresholds ensures realistic industrial demonstration for hackathon evaluators.
