import os
import re
import time
from typing import List, Dict, Any, Optional
from pypdf import PdfReader

from apps.admin_backend.rag.embeddings import get_embedder

try:
    import chromadb
    from chromadb.config import Settings
    _CHROMADB_AVAILABLE = True
except Exception:
    _CHROMADB_AVAILABLE = False

BASE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
CHROMA_PERSIST_DIR = os.path.join(BASE_DATA_DIR, "chroma_db")
MRPL_DOCS_DIR = os.path.join(BASE_DATA_DIR, "mrpl_documents")
ONGC_POLICIES_DIR = os.path.join(BASE_DATA_DIR, "ongc_policies")

COLLECTION_NAME = "mrpl_ongc_compliance_kb"

class DocumentIngestor:
    """
    Parses and chunks real MRPL SOPs and ONGC compliance policies,
    extracts clause/section metadata, and generates genuine BAAI/bge-small-en-v1.5 embeddings.
    """
    def __init__(self, chunk_size_chars: int = 600, overlap_chars: int = 100):
        self.chunk_size = chunk_size_chars
        self.overlap = overlap_chars
        self.embedder = get_embedder()

    def parse_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        pages_content = []
        try:
            reader = PdfReader(file_path)
            for page_idx, page in enumerate(reader.pages):
                try:
                    text = page.extract_text()
                    if text and text.strip():
                        # Clean excessive whitespaces and non-printable characters
                        cleaned = re.sub(r'[ \t]+', ' ', text)
                        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip()
                        pages_content.append({"page_number": page_idx + 1, "text": cleaned})
                except Exception as e:
                    print(f"  [PDF Page Parse Error] {file_path} p{page_idx+1}: {e}")
        except Exception as e:
            print(f"[PDF Read Error] {file_path}: {e}")
        return pages_content

    def parse_docx(self, file_path: str) -> List[Dict[str, Any]]:
        try:
            from docx import Document
            doc = Document(file_path)
            full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            return [{"page_number": 1, "text": full_text}]
        except Exception as e:
            print(f"[DOCX Read Error] {file_path}: {e}")
            return []

    def parse_txt(self, file_path: str) -> List[Dict[str, Any]]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return [{"page_number": 1, "text": content}]
        except Exception as e:
            print(f"[TXT Read Error] {file_path}: {e}")
            return []

    def parse_document(self, file_path: str) -> List[Dict[str, Any]]:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".pdf":
            return self.parse_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return self.parse_docx(file_path)
        elif ext in [".txt", ".md"]:
            return self.parse_txt(file_path)
        return []

    def extract_clause_metadata(self, text: str) -> str:
        """
        Detects SOP clause, section, rule, or chapter patterns from text excerpt.
        """
        patterns = [
            r'(?:Clause|Section|Article|Rule|Chapter|Item|Paragraph|Para)\s*[\.:]?\s*([0-9]+(?:\.[0-9]+)*)',
            r'([0-9]+\.[0-9]+(?:\.[0-9]+)*)\s+[A-Z][a-zA-Z\s]{3,30}',
            r'([A-Z]\.[0-9]+(?:\.[0-9]+)*)'
        ]
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return "General Section"

    def clean_title_from_filename(self, filename: str) -> str:
        name = os.path.splitext(filename)[0]
        name = re.sub(r'^[0-9]+_', '', name)
        name = name.replace('_', ' ').replace('-', ' ').strip()
        return name

    def chunk_document(self, file_path: str, source_category: str) -> List[Dict[str, Any]]:
        filename = os.path.basename(file_path)
        doc_title = self.clean_title_from_filename(filename)
        pages = self.parse_document(file_path)
        chunks = []
        chunk_counter = 0

        for page in pages:
            page_text = page["text"]
            page_num = page["page_number"]
            start = 0

            while start < len(page_text):
                end = min(start + self.chunk_size, len(page_text))
                # Look for sentence or paragraph end near cut point
                if end < len(page_text):
                    boundary = page_text.rfind('\n', start, end)
                    if boundary != -1 and boundary > start + (self.chunk_size // 2):
                        end = boundary
                    else:
                        sentence_end = max(page_text.rfind('. ', start, end), page_text.rfind('; ', start, end))
                        if sentence_end != -1 and sentence_end > start + (self.chunk_size // 2):
                            end = sentence_end + 1

                chunk_text = page_text[start:end].strip()

                if len(chunk_text) >= 40:
                    chunk_counter += 1
                    clause = self.extract_clause_metadata(chunk_text)
                    doc_id_prefix = re.sub(r'[^a-zA-Z0-9]', '_', filename)[:20]
                    chunk_id = f"{source_category}_{doc_id_prefix}_p{page_num}_c{chunk_counter}"

                    chunks.append({
                        "id": chunk_id,
                        "text": chunk_text,
                        "metadata": {
                            "source_folder": source_category,
                            "filename": filename,
                            "document_title": doc_title,
                            "page_number": page_num,
                            "chunk_index": chunk_counter,
                            "clause": clause,
                            "sop_id": f"{source_category.upper()}-{doc_title.upper()[:15].strip().replace(' ', '-')}"
                        }
                    })

                if end >= len(page_text):
                    break
                start = end - self.overlap

        return chunks

    def ingest_all_folders(self, persist_dir: str = CHROMA_PERSIST_DIR) -> Dict[str, Any]:
        """
        Scans both MRPL documents and ONGC policies, extracts chunks,
        computes BGE dense embeddings, and stores into persistent ChromaDB.
        """
        if not _CHROMADB_AVAILABLE:
            raise RuntimeError("ChromaDB is not installed or available.")

        os.environ["ANONYMIZED_TELEMETRY"] = "False"
        os.environ["CHROMA_TELEMETRY"] = "False"

        settings = Settings(
            anonymized_telemetry=False,
            is_persistent=True,
            persist_directory=persist_dir
        )
        client = chromadb.PersistentClient(path=persist_dir, settings=settings)
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"description": "MRPL and ONGC Compliance, Safety & Operating Procedures"}
        )

        all_chunks = []
        folder_stats = {}

        folders = [
            ("mrpl_documents", MRPL_DOCS_DIR),
            ("ongc_policies", ONGC_POLICIES_DIR)
        ]

        for category, folder_path in folders:
            if not os.path.exists(folder_path):
                print(f"[Ingest] Folder not found: {folder_path}")
                continue
            files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
            folder_stats[category] = {"file_count": len(files), "chunks": 0}
            print(f"[Ingest] Scanning {category}: {len(files)} files found at {folder_path}...")
            
            for fname in sorted(files):
                fpath = os.path.join(folder_path, fname)
                doc_chunks = self.chunk_document(fpath, category)
                folder_stats[category]["chunks"] += len(doc_chunks)
                all_chunks.extend(doc_chunks)

        total_chunks = len(all_chunks)
        print(f"[Ingest] Total extracted chunks: {total_chunks} across {sum(s['file_count'] for s in folder_stats.values())} documents.")

        if total_chunks == 0:
            return {"status": "NO_DOCUMENTS", "total_chunks": 0, "folder_stats": folder_stats}

        # Embed and Upsert in batches of 64
        batch_size = 64
        t0 = time.time()
        for i in range(0, total_chunks, batch_size):
            batch = all_chunks[i:i+batch_size]
            b_ids = [c["id"] for c in batch]
            b_docs = [c["text"] for c in batch]
            b_metas = [c["metadata"] for c in batch]
            b_embeddings = self.embedder.embed_batch(b_docs, batch_size=batch_size)

            collection.upsert(
                ids=b_ids,
                documents=b_docs,
                embeddings=b_embeddings,
                metadatas=b_metas
            )
            if (i // batch_size + 1) % 5 == 0 or (i + batch_size) >= total_chunks:
                print(f"  Ingested batch {i//batch_size + 1}/{(total_chunks + batch_size - 1)//batch_size} ({len(batch)} chunks)...")

        duration_sec = round(time.time() - t0, 2)
        total_in_collection = collection.count()

        return {
            "status": "SUCCESS",
            "total_chunks_indexed": total_chunks,
            "total_in_chromadb": total_in_collection,
            "duration_seconds": duration_sec,
            "folder_stats": folder_stats
        }

if __name__ == "__main__":
    ingestor = DocumentIngestor()
    result = ingestor.ingest_all_folders()
    print("Ingestion Result:", result)
