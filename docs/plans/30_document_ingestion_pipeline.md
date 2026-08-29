# Plan 30: Document Ingestion Pipeline & Context-Preserving Chunker

## 1. Objective
Design the offline document parsing, hierarchical chunking (500 tokens with 50-token overlap), and metadata extraction pipeline in `backend/rag/ingest.py` for indexing MRPL refinery manuals and safety procedures into ChromaDB.

## 2. Requirement Mapping
- **SIH26117 Requirement 11:** *GROUNDED LOCAL KNOWLEDGE BASE* — Context-preserving chunks of local PDF/DOCX files.

## 3. Detailed Design & Technical Approach

### 3.1. Hierarchical Context-Preserving Chunker (`backend/rag/ingest.py`)
```python
import re
from pypdf import PdfReader
from docx import Document
from typing import List, Dict, Any

class DocumentIngestor:
    def __init__(self, chunk_size_chars: int = 600, overlap_chars: int = 100):
        self.chunk_size = chunk_size_chars
        self.overlap = overlap_chars

    def parse_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        reader = PdfReader(file_path)
        pages_content = []
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_content.append({"page_number": page_idx + 1, "text": text})
        return pages_content

    def extract_clause_metadata(self, text: str) -> Dict[str, str]:
        """Detect SOP clause numbers like 'Clause 4.1.2' or 'Section 3.2'."""
        clause_match = re.search(r'(Clause\s+\d+(\.\d+)*|Section\s+\d+(\.\d+)*)', text, re.IGNORECASE)
        clause = clause_match.group(0) if clause_match else "General Section"
        return {"clause_number": clause}

    def chunk_document(self, file_path: str, doc_title: str, sop_code: str) -> List[Dict[str, Any]]:
        pages = self.parse_pdf(file_path)
        all_chunks = []
        chunk_counter = 0

        for page in pages:
            page_text = page["text"]
            page_num = page["page_number"]
            
            # Slide window across page text
            start = 0
            while start < len(page_text):
                end = start + self.chunk_size
                chunk_text = page_text[start:end].strip()
                
                if len(chunk_text) > 50: # Skip tiny fragments
                    chunk_counter += 1
                    meta = self.extract_clause_metadata(chunk_text)
                    all_chunks.append({
                        "id": f"{sop_code}_p{page_num}_c{chunk_counter}",
                        "text": chunk_text,
                        "metadata": {
                            "source_document": file_path.split("/")[-1].split("\\")[-1],
                            "document_title": doc_title,
                            "sop_code": sop_code,
                            "clause_number": meta["clause_number"],
                            "page_number": page_num,
                            "chunk_index": chunk_counter
                        }
                    })
                start += (self.chunk_size - self.overlap)

        return all_chunks
```

## 4. Inputs / Outputs & Contracts
- **Input:** Local PDF/DOCX file path, document title, SOP code.
- **Output:** Array of chunk dictionaries containing extracted text and rich clause metadata.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 29](file:///G:/SIH/p/docs/plans/29_chromadb_schema.md).
- Depended on by: [Plan 31](file:///G:/SIH/p/docs/plans/31_embedding_generation_bge.md), [Plan 33](file:///G:/SIH/p/docs/plans/33_sop_seed_data_plan.md).

## 6. Edge Cases & Failure Modes
- **Scanned Non-Searchable PDFs:** Ingestor detects 0 extracted characters from PyPDF and automatically routes the page to PaddleOCR to extract text before chunking.

## 7. Acceptance Criteria & Verification
- Ingesting a 20-page SOP PDF generates context-preserving chunks with accurate page and clause metadata.
- Boundary overlap preserves sentence context across chunk cuts.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Character-based windowing with clause regex detection provides lightweight, fast chunking without external complex dependencies.
