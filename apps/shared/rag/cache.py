import os
import re
import time
import json
import hashlib
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import pymysql
import pymysql.cursors

BASE_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
MRPL_DOCS_DIR = os.path.join(BASE_DATA_DIR, "mrpl_documents")
ONGC_POLICIES_DIR = os.path.join(BASE_DATA_DIR, "ongc_policies")

# MySQL (XAMPP) Configuration
MYSQL_HOST = os.environ.get("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "mrpl_reveal_auth")

def get_mysql_cache_connection():
    """Connect to XAMPP MySQL database for caching layer."""
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    with conn.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    conn.select_db(MYSQL_DATABASE)
    return conn

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
    High-performance local air-gapped Response Caching Layer using MySQL (XAMPP / Prisma).
    Stores synthesized answers, citations, and metadata keyed by normalized query hashes.
    Features TTL expiration and automated source-document modification invalidation.
    """
    def __init__(self, default_ttl_seconds: int = 86400):
        self.default_ttl = default_ttl_seconds
        self._init_db()

    def _init_db(self):
        try:
            conn = get_mysql_cache_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS response_cache (
                        query_hash VARCHAR(64) PRIMARY KEY,
                        raw_query TEXT NOT NULL,
                        normalized_query VARCHAR(512) NOT NULL,
                        final_answer LONGTEXT NOT NULL,
                        citations_json LONGTEXT NOT NULL,
                        domain VARCHAR(64) NOT NULL,
                        model_id VARCHAR(64) NOT NULL,
                        display_model VARCHAR(128) NOT NULL,
                        deliverable_ids_json TEXT NOT NULL,
                        source_mtime DOUBLE NOT NULL,
                        created_at DOUBLE NOT NULL,
                        last_accessed_at DOUBLE NOT NULL,
                        hit_count INT DEFAULT 1,
                        INDEX idx_cache_norm_query (normalized_query),
                        INDEX idx_cache_created (created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """)
            conn.close()
        except Exception as e:
            print(f"[RESPONSE_CACHE] MySQL initialization notice: {e}")

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
        Checks cache for an existing answer in MySQL.
        Validates both TTL and source-document timestamp.
        """
        norm_query = self.normalize_query(raw_query)
        q_hash = self.compute_query_hash(norm_query)
        ttl = max_age_seconds if max_age_seconds is not None else self.default_ttl

        now = time.time()
        current_source_mtime = self.get_source_documents_max_mtime()

        try:
            conn = get_mysql_cache_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM response_cache WHERE query_hash = %s", (q_hash,))
                row = cur.fetchone()
                if not row:
                    conn.close()
                    return None

                # 1. TTL Invalidation Check
                age = now - float(row["created_at"])
                if age >= ttl:
                    cur.execute("DELETE FROM response_cache WHERE query_hash = %s", (q_hash,))
                    conn.close()
                    return None

                # 2. Source Document Change Invalidation Check
                if current_source_mtime > float(row["source_mtime"]):
                    cur.execute("DELETE FROM response_cache WHERE query_hash = %s", (q_hash,))
                    conn.close()
                    return None

                # Update hit count and last_accessed_at
                cur.execute("""
                    UPDATE response_cache
                    SET hit_count = hit_count + 1, last_accessed_at = %s
                    WHERE query_hash = %s
                """, (now, q_hash))

            conn.close()

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
                source_mtime=float(row["source_mtime"]),
                created_at=float(row["created_at"]),
                last_accessed_at=now,
                hit_count=int(row["hit_count"]) + 1,
                is_cached=True
            )
        except Exception as e:
            print(f"[RESPONSE_CACHE] MySQL get error: {e}")
            return None

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

        try:
            conn = get_mysql_cache_connection()
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO response_cache (
                        query_hash, raw_query, normalized_query, final_answer,
                        citations_json, domain, model_id, display_model,
                        deliverable_ids_json, source_mtime, created_at, last_accessed_at, hit_count
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
                    ON DUPLICATE KEY UPDATE
                        final_answer = VALUES(final_answer),
                        citations_json = VALUES(citations_json),
                        domain = VALUES(domain),
                        model_id = VALUES(model_id),
                        display_model = VALUES(display_model),
                        deliverable_ids_json = VALUES(deliverable_ids_json),
                        source_mtime = VALUES(source_mtime),
                        created_at = VALUES(created_at),
                        last_accessed_at = VALUES(last_accessed_at),
                        hit_count = hit_count + 1;
                """, (
                    q_hash, raw_query, norm_query, final_answer,
                    cit_json, domain, model_id, display_model,
                    deliv_json, source_mtime, now, now
                ))
            conn.close()
        except Exception as e:
            print(f"[RESPONSE_CACHE] MySQL set error: {e}")

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
        try:
            conn = get_mysql_cache_connection()
            with conn.cursor() as cur:
                cur.execute("DELETE FROM response_cache;")
            conn.close()
        except Exception as e:
            print(f"[RESPONSE_CACHE] MySQL clear error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        try:
            conn = get_mysql_cache_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) as cnt, SUM(hit_count) as total_hits FROM response_cache;")
                res = cur.fetchone()
                count = int(res['cnt']) if res and res.get('cnt') else 0
                total_hits = int(res['total_hits']) if res and res.get('total_hits') else 0
            conn.close()
            return {
                "total_cached_queries": count,
                "total_cache_hits": max(0, total_hits - count),
                "database": f"MySQL (XAMPP / {MYSQL_DATABASE})"
            }
        except Exception as e:
            return {
                "total_cached_queries": 0,
                "total_cache_hits": 0,
                "database": f"MySQL (XAMPP / {MYSQL_DATABASE})"
            }

# Global Singleton
response_cache = ResponseCacheLayer()
