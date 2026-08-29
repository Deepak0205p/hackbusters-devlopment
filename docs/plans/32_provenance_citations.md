# Plan 32: Retrieval Grounding & Provenance Citation Engine Design

## 1. Objective
Design the provenance citation formatter in `backend/rag/retrieval_grounding.py` that formats retrieved SOP clauses, manual sections, and page references into verifiable audit citations, eliminating hallucinations in generated executive approval notes.

## 2. Requirement Mapping
- **SIH26117 Requirement 11:** *GROUNDED LOCAL KNOWLEDGE BASE* — Guarantees zero hallucinations by citing exact SOP clause numbers and equipment manuals.

## 3. Detailed Design & Technical Approach

### 3.1. Provenance Citation Pipeline
When the agent queries ChromaDB via `chroma_sop_search`, the retrieved passages are enriched with strict citation metadata tags:

```python
from typing import List, Dict, Any

class ProvenanceCitationEngine:
    @staticmethod
    def format_retrieved_context(retrieval_results: List[Dict[str, Any]]) -> str:
        """Format retrieved chunks into verifiable grounding context for LLM prompt."""
        if not retrieval_results:
            return "No relevant MRPL standard operating procedures found in local database."

        formatted_blocks = []
        for i, res in enumerate(retrieval_results, 1):
            meta = res.get("metadata", {})
            doc = meta.get("source_document", "Unknown SOP")
            clause = meta.get("clause_number", "Unspecified Clause")
            page = meta.get("page_number", "N/A")
            title = meta.get("document_title", doc)
            text = res.get("text", "").strip()
            score = res.get("similarity_score", 0.0)

            block = (
                f"[REFERENCE #{i}]\n"
                f"- Document: {title} ({doc})\n"
                f"- Clause Reference: {clause} (Page {page})\n"
                f"- Confidence Match: {score * 100:.1f}%\n"
                f"- Clause Content: \"{text}\"\n"
            )
            formatted_blocks.append(block)

        grounding_header = (
            "GROUNDED REFINERY CONTEXT (Mandatory: You must cite exact document names, "
            "clause numbers, and pages in your final synthesis):\n\n"
        )
        return grounding_header + "\n".join(formatted_blocks)

    @staticmethod
    def extract_citations_from_response(response_text: str) -> List[str]:
        """Extract referenced clause codes from model output for deliverable headers."""
        import re
        clauses = re.findall(r'(SOP-MRPL-[A-Z]+-\d{2}|Clause\s+\d+(\.\d+)*)', response_text, re.IGNORECASE)
        return list(set([c[0] for c in clauses if isinstance(c, tuple)]))
```

## 4. Inputs / Outputs & Contracts
- **Input:** Raw search results array from `LocalVectorStore.query()`.
- **Output:** Formatted prompt context string with explicit `[REFERENCE #N]` headers and citations.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 29](file:///G:/SIH/p/docs/plans/29_chromadb_schema.md), [Plan 31](file:///G:/SIH/p/docs/plans/31_embedding_generation_bge.md).
- Depended on by: [Plan 37](file:///G:/SIH/p/docs/plans/37_docx_generation.md), [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Conflicting SOP Versions:** Include `created_timestamp` and document title in citation to ensure the model references the latest active procedure.

## 7. Acceptance Criteria & Verification
- Generated approval note `.docx` explicitly contains references such as *"In accordance with SOP-MRPL-FURNACE-01 Clause 4.1.2 (Page 14)..."*.
- Traceability test verifies that every cited fact corresponds to an actual chunk in ChromaDB.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Injecting explicit confidence match percentages in the prompt enables Qwen 3 to weigh multiple retrieved clauses appropriately.
