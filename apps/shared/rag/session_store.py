import os
import time
import math
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from apps.shared.rag.embeddings import get_embedder
from apps.shared.sovereignty.tamper_log import audit_log

try:
    import chromadb
    from chromadb.config import Settings
    _CHROMADB_AVAILABLE = True
except Exception:
    _CHROMADB_AVAILABLE = False

BASE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
SESSION_CHROMA_DIR = os.path.join(BASE_DATA_DIR, "session_chroma_db")

# ==============================================================================
# DATA MODELS
# ==============================================================================
class SessionDocumentChunk(BaseModel):
    id: str
    session_id: str
    file_id: str
    file_name: str
    page_number: int
    section: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    uploaded_by: str = "anonymous"
    upload_timestamp: float = Field(default_factory=time.time)

class SessionRetrievalResult(BaseModel):
    chunk_id: str
    session_id: str
    file_name: str
    page_number: int
    section: str
    matched_text: str
    similarity_score: float
    source_type: str = "SESSION_FILE"
    uploaded_by: str = "anonymous"
    citation: str = ""

# ==============================================================================
# SESSION VECTOR STORE MANAGER (EPHEMERAL TIER 2)
# ==============================================================================
class SessionVectorStoreManager:
    """
    Manages isolated, ephemeral session vector stores for ad-hoc uploaded
    turnaround reports, log sheets, and inspection notes.
    Guarantees strict multi-tenant isolation with zero cross-session data bleeding.
    """
    def __init__(self, persist_dir: str = SESSION_CHROMA_DIR):
        self.persist_dir = os.path.abspath(persist_dir)
        os.makedirs(self.persist_dir, exist_ok=True)
        self.embedder = get_embedder()
        self.chroma_client = None
        
        # In-memory registry of active sessions: session_id -> metadata & chunk registry
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._init_chroma()

    def _init_chroma(self):
        if _CHROMADB_AVAILABLE:
            try:
                settings = Settings(
                    anonymized_telemetry=False,
                    is_persistent=True,
                    persist_directory=self.persist_dir
                )
                self.chroma_client = chromadb.PersistentClient(
                    path=self.persist_dir,
                    settings=settings
                )
            except Exception as e:
                print(f"[SessionVectorStore] ChromaDB Init Warning: {e}")
                self.chroma_client = None

    def get_or_create_session(self, session_id: str, user_id: str = "operator") -> Dict[str, Any]:
        """Initializes or accesses an isolated session vector partition."""
        clean_sid = session_id.strip()
        now = time.time()

        if clean_sid in self._sessions:
            self._sessions[clean_sid]["last_accessed_at"] = now
            return self._sessions[clean_sid]

        collection_name = f"session_{clean_sid.replace('-', '_')[:48]}"
        chroma_col = None
        if self.chroma_client:
            try:
                chroma_col = self.chroma_client.get_or_create_collection(
                    name=collection_name,
                    metadata={"session_id": clean_sid, "created_at": str(now), "user_id": user_id}
                )
            except Exception as e:
                print(f"[SessionVectorStore] Collection create error for {clean_sid}: {e}")

        session_entry = {
            "session_id": clean_sid,
            "user_id": user_id,
            "created_at": now,
            "last_accessed_at": now,
            "files": [],
            "chunks": [],  # In-memory backup chunk store
            "chroma_collection": chroma_col,
            "total_bytes": 0,
            "total_chunks": 0
        }
        self._sessions[clean_sid] = session_entry
        return session_entry

    def ingest_session_chunks(
        self,
        session_id: str,
        user_id: str,
        file_name: str,
        chunks: List[Dict[str, Any]],
        file_size_bytes: int = 0,
        sha256_hash: str = ""
    ) -> Dict[str, Any]:
        """
        Ingests parsed text chunks into the isolated session vector store.
        Applies quota controls and logs cryptographic tamper audit entries.
        """
        session = self.get_or_create_session(session_id, user_id)
        file_id = f"file_{int(time.time() * 1000)}_{hashlib.md5(file_name.encode()).hexdigest()[:6]}"

        # Quota checks: Max 50 MB or 2,000 chunks per session
        if session["total_bytes"] + file_size_bytes > 50 * 1024 * 1024:
            raise ValueError(f"Session '{session_id}' exceeds 50MB storage quota.")
        if session["total_chunks"] + len(chunks) > 2000:
            raise ValueError(f"Session '{session_id}' exceeds 2,000 chunk vector limit.")

        session_chunk_objs: List[SessionDocumentChunk] = []
        texts_to_embed: List[str] = []
        ids_to_upsert: List[str] = []
        metadatas_to_upsert: List[Dict[str, Any]] = []

        t_start = time.time()
        for idx, ch in enumerate(chunks):
            chunk_id = f"{file_id}_ch_{idx+1}"
            text = ch.get("text", "").strip()
            if not text:
                continue

            page_num = ch.get("page_number", 1)
            section = ch.get("section", "General Excerpt")

            chunk_obj = SessionDocumentChunk(
                id=chunk_id,
                session_id=session_id,
                file_id=file_id,
                file_name=file_name,
                page_number=page_num,
                section=section,
                content=text,
                metadata={
                    "session_id": session_id,
                    "file_id": file_id,
                    "file_name": file_name,
                    "page_number": page_num,
                    "section": section,
                    "uploaded_by": user_id
                },
                uploaded_by=user_id,
                upload_timestamp=time.time()
            )

            session_chunk_objs.append(chunk_obj)
            texts_to_embed.append(text)
            ids_to_upsert.append(chunk_id)
            metadatas_to_upsert.append(chunk_obj.metadata)

        # Generate local BGE-M3 embeddings
        embeddings = self.embedder.embed_batch(texts_to_embed)

        # Upsert into ChromaDB session collection if available
        chroma_col = session.get("chroma_collection")
        if chroma_col and ids_to_upsert:
            try:
                chroma_col.upsert(
                    ids=ids_to_upsert,
                    documents=texts_to_embed,
                    embeddings=embeddings,
                    metadatas=metadatas_to_upsert
                )
            except Exception as e:
                print(f"[SessionVectorStore] Chroma upsert warning for session {session_id}: {e}")

        # Store in session memory structure
        session["chunks"].extend(session_chunk_objs)
        session["total_chunks"] += len(session_chunk_objs)
        session["total_bytes"] += file_size_bytes
        session["last_accessed_at"] = time.time()

        file_metadata = {
            "file_id": file_id,
            "file_name": file_name,
            "chunk_count": len(session_chunk_objs),
            "size_bytes": file_size_bytes,
            "sha256": sha256_hash or hashlib.sha256(file_name.encode()).hexdigest(),
            "uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "uploaded_by": user_id
        }
        session["files"].append(file_metadata)

        duration_ms = int((time.time() - t_start) * 1000)

        # Record to SHA-256 Tamper Audit Trail
        audit_log.append_event(
            event_type="SESSION_RAG_INGEST",
            details=f"Ingested '{file_name}' ({len(session_chunk_objs)} chunks) into isolated session '{session_id}' by user '{user_id}' [SHA256: {file_metadata['sha256'][:16]}...] in {duration_ms}ms"
        )

        return {
            "success": True,
            "session_id": session_id,
            "file_id": file_id,
            "file_name": file_name,
            "chunks_indexed": len(session_chunk_objs),
            "total_session_chunks": session["total_chunks"],
            "duration_ms": duration_ms
        }

    def query_session(
        self,
        session_id: str,
        query_text: str,
        top_k: int = 4
    ) -> List[SessionRetrievalResult]:
        """
        Executes semantic vector similarity search strictly within the given session's boundary.
        Guarantees 0% cross-session bleed.
        """
        clean_sid = session_id.strip() if session_id else ""
        if not clean_sid or clean_sid not in self._sessions:
            return []

        session = self._sessions[clean_sid]
        session["last_accessed_at"] = time.time()
        
        if not session["chunks"]:
            return []

        query_vec = self.embedder.embed_text(query_text)
        results: List[SessionRetrievalResult] = []

        # Try ChromaDB query first
        chroma_col = session.get("chroma_collection")
        if chroma_col and chroma_col.count() > 0:
            try:
                chroma_res = chroma_col.query(
                    query_embeddings=[query_vec],
                    n_results=min(top_k, chroma_col.count()),
                    include=["documents", "metadatas", "distances"]
                )

                if chroma_res and chroma_res.get("ids") and len(chroma_res["ids"][0]) > 0:
                    for i in range(len(chroma_res["ids"][0])):
                        doc = chroma_res["documents"][0][i]
                        meta = chroma_res["metadatas"][0][i]
                        dist = chroma_res["distances"][0][i] if chroma_res.get("distances") else 0.1
                        sim = max(0.0, min(1.0, 1.0 - (dist / 2.0)))

                        file_name = meta.get("file_name", "Session_Upload.pdf")
                        page_num = meta.get("page_number", 1)
                        section = meta.get("section", "Section")
                        user_id = meta.get("uploaded_by", session.get("user_id", "operator"))

                        citation = f"[SOURCE: SESSION_FILE | File: {file_name} | Page: {page_num} | Section: {section}]"

                        results.append(SessionRetrievalResult(
                            chunk_id=chroma_res["ids"][0][i],
                            session_id=clean_sid,
                            file_name=file_name,
                            page_number=page_num,
                            section=section,
                            matched_text=doc,
                            similarity_score=round(sim, 3),
                            uploaded_by=user_id,
                            citation=citation
                        ))
                    if results:
                        return results
            except Exception as e:
                print(f"[SessionVectorStore] Query warning for session {clean_sid}: {e}")

        # In-Memory Cosine Similarity Fallback for session chunks
        scored = []
        for chunk in session["chunks"]:
            chunk_vec = self.embedder.embed_text(chunk.content)
            # Cosine similarity dot product
            dot = sum(a * b for a, b in zip(query_vec, chunk_vec))
            norm_q = math.sqrt(sum(a * a for a in query_vec)) or 1.0
            norm_c = math.sqrt(sum(b * b for b in chunk_vec)) or 1.0
            cos_sim = dot / (norm_q * norm_c)
            scored.append((cos_sim, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        for score, chunk in scored[:top_k]:
            citation = f"[SOURCE: SESSION_FILE | File: {chunk.file_name} | Page: {chunk.page_number} | Section: {chunk.section}]"
            results.append(SessionRetrievalResult(
                chunk_id=chunk.id,
                session_id=clean_sid,
                file_name=chunk.file_name,
                page_number=chunk.page_number,
                section=chunk.section,
                matched_text=chunk.content,
                similarity_score=round(max(0.0, min(1.0, score)), 3),
                uploaded_by=chunk.uploaded_by,
                citation=citation
            ))

        return results

    def delete_session(self, session_id: str, user_id: str = "system") -> bool:
        """
        Explicitly wipes an ephemeral session collection from memory and disk.
        """
        clean_sid = session_id.strip() if session_id else ""
        if clean_sid not in self._sessions:
            return False

        session = self._sessions[clean_sid]
        chunk_count = session["total_chunks"]

        # Drop collection in ChromaDB
        collection_name = f"session_{clean_sid.replace('-', '_')[:48]}"
        if self.chroma_client:
            try:
                self.chroma_client.delete_collection(collection_name)
            except Exception:
                pass

        del self._sessions[clean_sid]

        audit_log.append_event(
            event_type="SESSION_RAG_EVICT",
            details=f"Purged isolated session vector store '{clean_sid}' ({chunk_count} chunks deallocated) by user '{user_id}'"
        )
        return True

    def list_session_files(self, session_id: str) -> List[Dict[str, Any]]:
        clean_sid = session_id.strip() if session_id else ""
        if clean_sid not in self._sessions:
            return []
        return self._sessions[clean_sid].get("files", [])

    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        clean_sid = session_id.strip() if session_id else ""
        if clean_sid not in self._sessions:
            return {"active": False, "total_chunks": 0, "total_files": 0, "total_bytes": 0}
        
        s = self._sessions[clean_sid]
        return {
            "active": True,
            "session_id": clean_sid,
            "user_id": s["user_id"],
            "total_chunks": s["total_chunks"],
            "total_files": len(s["files"]),
            "total_bytes": s["total_bytes"],
            "created_at": s["created_at"],
            "last_accessed_at": s["last_accessed_at"]
        }

    def evict_expired_sessions(self, max_idle_minutes: int = 120) -> int:
        """Background cleaner that evicts idle sessions older than TTL."""
        now = time.time()
        cutoff = now - (max_idle_minutes * 60)
        expired_ids = [sid for sid, s in self._sessions.items() if s["last_accessed_at"] < cutoff]

        for sid in expired_ids:
            self.delete_session(sid, user_id="TTL_WATCHDOG")

        return len(expired_ids)

    def get_active_session_count(self) -> int:
        return len(self._sessions)

    def get_total_session_chunks(self) -> int:
        return sum(s["total_chunks"] for s in self._sessions.values())

# Global Singleton
session_store = SessionVectorStoreManager()
