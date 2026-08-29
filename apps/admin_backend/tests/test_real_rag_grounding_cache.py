import os
import sys
import time
from apps.admin_backend.rag.embeddings import get_embedder
from apps.admin_backend.rag.vector_store import chroma_store, PRIMARY_COLLECTION
from apps.admin_backend.rag.grounding import grounding_verifier
from apps.admin_backend.rag.cache import response_cache

def sanitize(text: str) -> str:
    """Sanitizes text for safe terminal printing on Windows cp1252 console."""
    return text.encode('ascii', errors='replace').decode('ascii')

def test_real_rag_grounding_cache():
    print("=" * 80)
    print("  MRPL/ONGC REAL RAG PIPELINE, GROUNDING VERIFICATION & CACHING TEST")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. REAL BAAI/bge-small-en-v1.5 EMBEDDING MODEL VERIFICATION
    # -------------------------------------------------------------
    print("\n--- [1] REAL EMBEDDING MODEL (BAAI/bge-small-en-v1.5) VALIDATION ---")
    embedder = get_embedder()
    test_text = "MRPL contractor safety requirements and standard operating procedures"
    vec = embedder.embed_text(test_text)
    print(f"Generated Embedding for '{test_text[:45]}...':")
    print(f"  * Vector Dimension: {len(vec)} (Expected: 384)")
    print(f"  * Sample Values: [{vec[0]:.4f}, {vec[1]:.4f}, {vec[2]:.4f}, ...]")
    print(f"  * L2 Norm: {sum(x*x for x in vec):.4f}")
    assert len(vec) == 384
    assert any(x != 0.0 for x in vec)

    # -------------------------------------------------------------
    # 2. REAL CHROMADB INGESTION & SEMANTIC RETRIEVAL (REAL DOCS)
    # -------------------------------------------------------------
    print("\n--- [2] REAL CHROMADB COMPLIANCE REPOSITORY RETRIEVAL ---")
    assert chroma_store.is_chroma_ready is True
    assert chroma_store.primary_collection is not None
    total_docs = chroma_store.primary_collection.count()
    print(f"Total Real Documents/Chunks in ChromaDB ('{PRIMARY_COLLECTION}'): {total_docs}")
    assert total_docs >= 1000

    # Query 1: MRPL Contractor Safety Requirements
    q_mrpl = "contractor safety induction training and personal protective equipment PPE compliance requirements"
    hits_mrpl = chroma_store.query_sop(q_mrpl, top_k=2)
    print(f"\nQuery: '{q_mrpl}'")
    print(f"Retrieved {len(hits_mrpl)} real chunks:")
    for idx, hit in enumerate(hits_mrpl, 1):
        clean_title = sanitize(hit.title)
        clean_snippet = sanitize(hit.matched_text[:120]).replace('\n', ' ')
        print(f"  [Hit {idx}] {clean_title} | Source: {hit.source_folder}/{hit.filename} | Clause: {hit.clause} (P.{hit.page_number})")
        print(f"    * Similarity: {hit.similarity_score}")
        print(f"    * Text snippet: {clean_snippet}...")
    assert len(hits_mrpl) >= 1
    assert hits_mrpl[0].source_folder in ["mrpl_documents", "ongc_policies"]

    # Query 2: ONGC Human Rights & Supplier Policy
    q_ongc = "human rights policy zero tolerance child forced labour and supplier code of conduct"
    hits_ongc = chroma_store.query_sop(q_ongc, top_k=2)
    print(f"\nQuery: '{q_ongc}'")
    print(f"Retrieved {len(hits_ongc)} real chunks:")
    for idx, hit in enumerate(hits_ongc, 1):
        clean_title = sanitize(hit.title)
        clean_snippet = sanitize(hit.matched_text[:120]).replace('\n', ' ')
        print(f"  [Hit {idx}] {clean_title} | Source: {hit.source_folder}/{hit.filename} | Clause: {hit.clause} (P.{hit.page_number})")
        print(f"    * Similarity: {hit.similarity_score}")
        print(f"    * Text snippet: {clean_snippet}...")
    assert len(hits_ongc) >= 1

    # -------------------------------------------------------------
    # 3. GROUNDING VERIFICATION GATE (CITATION ENFORCEMENT)
    # -------------------------------------------------------------
    print("\n--- [3] GROUNDING VERIFICATION GATE TESTS ---")
    # Case A: Legitimate grounded answer
    legit_clause = hits_mrpl[0].clause
    legit_answer = (
        f"In accordance with {hits_mrpl[0].title} under {legit_clause}, all contractor personnel must complete "
        f"mandatory safety induction and wear certified PPE before entering the refinery premises."
    )
    res_grounded = grounding_verifier.verify_grounding(legit_answer, hits_mrpl)
    print(f"Legitimate Answer Verification: Status={res_grounded.status}, Score={res_grounded.grounding_score}, IsGrounded={res_grounded.is_grounded}")
    print(f"  * Verified Citations: {[c.citation_token for c in res_grounded.verified_citations]}")
    assert res_grounded.is_grounded is True

    # Case B: Hallucinated / Unverified citation detection
    hallucinated_answer = (
        f"Per MRPL Safety Standard Clause 99.88.77 and Policy Section 999, unauthorized personnel may enter without PPE."
    )
    res_hallucinated = grounding_verifier.verify_grounding(hallucinated_answer, hits_mrpl)
    print(f"Hallucinated Answer Verification: Status={res_hallucinated.status}, Score={res_hallucinated.grounding_score}, IsGrounded={res_hallucinated.is_grounded}")
    print(f"  * Unverified Citations Detected: {res_hallucinated.unverified_citations}")
    assert res_hallucinated.is_grounded is False
    assert len(res_hallucinated.unverified_citations) > 0

    # -------------------------------------------------------------
    # 4. LOCAL PERSISTENT RESPONSE CACHING & TIMING PROOF
    # -------------------------------------------------------------
    print("\n--- [4] LOCAL PERSISTENT RESPONSE CACHING & TIMING PROOF ---")
    response_cache.clear()
    sample_query = "What are the mandatory PPE safety requirements for refinery contractor workers?"
    sample_answer = (
        "All contractor personnel must wear ISI-marked safety helmets, steel-toe boots, and fire-retardant coveralls "
        "as per MRPL Contractor Safety Policy Clause 4.1."
    )

    # First Call: Cache Miss -> Store response
    t0 = time.perf_counter()
    cached_first = response_cache.get(sample_query)
    assert cached_first is None
    # Store in response cache
    response_cache.set(
        raw_query=sample_query,
        final_answer=sample_answer,
        citations=[{"source": "mrpl_documents/01_Contractor_Workers_Safety_Policy.pdf", "clause": "Clause 4.1"}],
        domain="reasoning",
        model_id="qwen2.5-coder-7b",
        display_model="Qwen 2.5 Coder 7B"
    )
    t_first_ms = (time.perf_counter() - t0) * 1000

    # Second Call: Cache Hit -> Instant retrieval
    t1 = time.perf_counter()
    cached_second = response_cache.get(sample_query)
    t_second_ms = (time.perf_counter() - t1) * 1000

    print(f"Cache Performance Benchmark for query '{sample_query}':")
    print(f"  * First Call (Store/Miss overhead): {t_first_ms:.2f} ms")
    print(f"  * Second Call (Cache HIT lookup): {t_second_ms:.4f} ms")
    print(f"  * Speedup Factor: {t_first_ms / max(t_second_ms, 0.0001):.1f}x faster")
    print(f"  * Cache Hit Count: {cached_second.hit_count}")
    print(f"  * Cached Answer: '{cached_second.final_answer[:60]}...'")

    assert cached_second is not None
    assert cached_second.is_cached is True
    assert cached_second.final_answer == sample_answer
    assert cached_second.hit_count >= 2
    assert t_second_ms < 15.0  # Must be sub-15ms SQLite lookup

    # 5. Invalidation Check
    print("\n--- [5] CACHE INVALIDATION CHECKS ---")
    expired_check = response_cache.get(sample_query, max_age_seconds=0)
    print(f"Expired TTL Check (max_age=0s): {expired_check is None} (Expected: True)")
    assert expired_check is None

    stats = response_cache.get_stats()
    print(f"Response Cache Stats: {stats}")

    print("\n" + "=" * 80)
    print("  ALL REAL RAG, GROUNDING, AND CACHING TESTS PASSED (100% VERIFIED)")
    print("=" * 80)

if __name__ == "__main__":
    test_real_rag_grounding_cache()
