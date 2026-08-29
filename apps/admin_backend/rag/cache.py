import os
import re
import time
import json
import sqlite3
import hashlib
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

BASE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
CACHE_DB_PATH = os.path.join(BASE_DATA_DIR, "response_cache.db")
MRPL_DOCS_DIR = os.path.join(BASE_DATA_DIR, "mrpl_documents")
ONGC_POLICIES_DIR = os.path.join(BASE_DATA_DIR, "ongc_policies")

class CachedResponse(BaseModel):
    model_config = {'protected_namespaces': ()}

    query_hash: str
    raw_query: str
    normalized_query: str
    final_answer: str
    citations: List[Dict[str, Any]]
    domain: str
    model_id: str
    display_model: str
    deliverable_ids: List[str]
    source_mtime: float
    created_at: float
    last_accessed_at: float
    hit_count: int
    is_cached: bool = True

class ResponseCacheLayer:
    """
    High-performance local air-gapped Response Caching Layer using SQLite.
    Stores synthesized answers, citations, and metadata keyed by normalized query hashes.
    Features TTL expiration and automated source-document modification invalidation.
    """
    def __init__(self, db_path: str = CACHE_DB_PATH, default_ttl_seconds: int = 86400):
        self.db_path = db_path
        self.default_ttl = default_ttl_seconds
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._conn = sqlite3.connect(self.db_path, timeout=10.0, check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.execute("PRAGMA synchronous=NORMAL;")
        self._conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self):
        with self._conn:
            self._conn.execute("""
                CREATE TABLE IF NOT EXISTS response_cache (
                    query_hash TEXT PRIMARY KEY,
                    raw_query TEXT NOT NULL,
                    normalized_query TEXT NOT NULL,
                    final_answer TEXT NOT NULL,
                    citations_json TEXT NOT NULL,
                    domain TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    display_model TEXT NOT NULL,
                    deliverable_ids_json TEXT NOT NULL,
                    source_mtime REAL NOT NULL,
                    created_at REAL NOT NULL,
                    last_accessed_at REAL NOT NULL,
                    hit_count INTEGER DEFAULT 1
                );
            """)
            self._conn.execute("CREATE INDEX IF NOT EXISTS idx_cache_norm_query ON response_cache(normalized_query);")
            self._conn.execute("CREATE INDEX IF NOT EXISTS idx_cache_created ON response_cache(created_at);")

    def normalize_query(self, query: str) -> str:
        """Normalizes query text: lowercase, trimmed, collapsed whitespace, punctuation-trimmed."""
        q = query.lower().strip()
        q = re.sub(r'[\r\n\t]+', ' ', q)
        q = re.sub(r'\s+', ' ', q)
        q = re.sub(r'[?!.,;]+$', '', q)
        return q.strip()

    def compute_query_hash(self, normalized_query: str) -> str:
        return hashlib.sha256(normalized_query.encode("utf-8")).hexdigest()

    def get_source_documents_max_mtime(self) -> float:
        """
        Calculates the latest modification timestamp across MRPL and ONGC document directories.
        Directly inspects folder timestamps for sub-millisecond execution.
        """
        max_mtime = 0.0
        for folder in [MRPL_DOCS_DIR, ONGC_POLICIES_DIR]:
            if os.path.exists(folder):
                try:
                    mt = os.path.getmtime(folder)
                    if mt > max_mtime:
                        max_mtime = mt
                except OSError:
                    pass
        return max_mtime

    def get(self, raw_query: str, max_age_seconds: Optional[int] = None) -> Optional[CachedResponse]:
        """
        Checks cache for an existing answer.
        Validates both TTL and source-document timestamp.
        """
        norm_query = self.normalize_query(raw_query)
        q_hash = self.compute_query_hash(norm_query)
        ttl = max_age_seconds if max_age_seconds is not None else self.default_ttl

        now = time.time()
        current_source_mtime = self.get_source_documents_max_mtime()

        with self._conn:
            cursor = self._conn.execute("SELECT * FROM response_cache WHERE query_hash = ?", (q_hash,))
            row = cursor.fetchone()
            if not row:
                return None

            # 1. TTL Invalidation Check
            age = now - row["created_at"]
            if age >= ttl:
                self._conn.execute("DELETE FROM response_cache WHERE query_hash = ?", (q_hash,))
                return None

            # 2. Source Document Change Invalidation Check
            if current_source_mtime > row["source_mtime"]:
                self._conn.execute("DELETE FROM response_cache WHERE query_hash = ?", (q_hash,))
                return None

            # Update hit count and last_accessed_at
            self._conn.execute("""
                UPDATE response_cache
                SET hit_count = hit_count + 1, last_accessed_at = ?
                WHERE query_hash = ?
            """, (now, q_hash))

            try:
                citations = json.loads(row["citations_json"])
            except Exception:
                citations = []

            try:
                deliverables = json.loads(row["deliverable_ids_json"])
            except Exception:
                deliverables = []

            return CachedResponse(
                query_hash=row["query_hash"],
                raw_query=row["raw_query"],
                normalized_query=row["normalized_query"],
                final_answer=row["final_answer"],
                citations=citations,
                domain=row["domain"],
                model_id=row["model_id"],
                display_model=row["display_model"],
                deliverable_ids=deliverables,
                source_mtime=row["source_mtime"],
                created_at=row["created_at"],
                last_accessed_at=now,
                hit_count=row["hit_count"] + 1,
                is_cached=True
            )

    def set(
        self,
        raw_query: str,
        final_answer: str,
        citations: Optional[List[Dict[str, Any]]] = None,
        domain: str = "reasoning",
        model_id: str = "qwen2.5-coder-7b",
        display_model: str = "Qwen 2.5 Coder 7B",
        deliverable_ids: Optional[List[str]] = None
    ) -> CachedResponse:
        norm_query = self.normalize_query(raw_query)
        q_hash = self.compute_query_hash(norm_query)
        now = time.time()
        source_mtime = self.get_source_documents_max_mtime()
        cit_json = json.dumps(citations or [])
        deliv_json = json.dumps(deliverable_ids or [])

        with self._conn:
            self._conn.execute("""
                INSERT INTO response_cache (
                    query_hash, raw_query, normalized_query, final_answer,
                    citations_json, domain, model_id, display_model,
                    deliverable_ids_json, source_mtime, created_at, last_accessed_at, hit_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(query_hash) DO UPDATE SET
                    final_answer = excluded.final_answer,
                    citations_json = excluded.citations_json,
                    domain = excluded.domain,
                    model_id = excluded.model_id,
                    display_model = excluded.display_model,
                    deliverable_ids_json = excluded.deliverable_ids_json,
                    source_mtime = excluded.source_mtime,
                    created_at = excluded.created_at,
                    last_accessed_at = excluded.last_accessed_at,
                    hit_count = hit_count + 1
            """, (
                q_hash, raw_query, norm_query, final_answer,
                cit_json, domain, model_id, display_model,
                deliv_json, source_mtime, now, now
            ))

        return CachedResponse(
            query_hash=q_hash,
            raw_query=raw_query,
            normalized_query=norm_query,
            final_answer=final_answer,
            citations=citations or [],
            domain=domain,
            model_id=model_id,
            display_model=display_model,
            deliverable_ids=deliverable_ids or [],
            source_mtime=source_mtime,
            created_at=now,
            last_accessed_at=now,
            hit_count=1,
            is_cached=False
        )

    def clear(self):
        with self._conn:
            self._conn.execute("DELETE FROM response_cache;")

    def get_stats(self) -> Dict[str, Any]:
        with self._conn:
            cursor = self._conn.execute("SELECT COUNT(*), SUM(hit_count) FROM response_cache;")
            count, total_hits = cursor.fetchone()
            return {
                "total_cached_queries": count or 0,
                "total_cache_hits": (total_hits or 0) - (count or 0),
                "db_path": self.db_path
            }

# Global Singleton
response_cache = ResponseCacheLayer()
