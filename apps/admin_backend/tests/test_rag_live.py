import os
from apps.admin_backend.rag.vector_store import chroma_store, SEED_SOPS, generate_local_dense_embedding
from apps.admin_backend.ocr.pipeline import multimodal_pipeline
from apps.admin_backend.sovereignty.tamper_log import audit_log

def test_rag_chromadb_live():
    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - CHROMADB RAG & VECTOR SEARCH LIVE TEST")
    print("=" * 70)

    # 1. Verify ChromaDB Initialization & Embedding Generation
    print("\n--- [1] EMBEDDING GENERATION & SEED CHUNKS VALIDATION ---")
    print(f"Total Seeded Refinery SOP Chunks: {len(SEED_SOPS)}")
    for chunk in SEED_SOPS:
        vec = generate_local_dense_embedding(chunk.content)
        print(f"  • [{chunk.sop_id} Clause {chunk.clause}] -> 384-dim Dense Vector (Norm: {sum(x*x for x in vec):.4f})")
        assert len(vec) == 384

    # 2. Test Real Vector Similarity Query (Furnace 620°C Skin Temp Finding)
    print("\n--- [2] REAL VECTOR SIMILARITY SEARCH: FURNACE TUBE TEMPERATURE BREACH ---")
    query_text = "radiant tube thermocouple sensor skin temperature exceeding limit emergency shutdown"
    hits = chroma_store.query_sop(query_text, top_k=2)

    print(f"Query: '{query_text}'")
    print(f"Retrieved {len(hits)} matching SOP chunks from ChromaDB:")
    for idx, hit in enumerate(hits, 1):
        print(f"\n  [Match {idx}] {hit.sop_id} | Clause {hit.clause} (Page {hit.page_number})")
        print(f"    • Title: {hit.title}")
        print(f"    • Similarity Score: {hit.similarity_score}")
        print(f"    • Text Excerpt: {hit.matched_text[:140]}...")

    assert len(hits) >= 1
    top_hit = hits[0]
    assert top_hit.sop_id == "SOP-MRPL-FURNACE-01"
    assert top_hit.clause == "4.1.2"
    assert "610°C" in top_hit.matched_text

    # 3. Test End-to-End Pipeline Integration (Module 6 Upload -> Real ChromaDB Cross-Reference)
    print("\n--- [3] END-TO-END PIPELINE INTEGRATION: UPLOAD PDF -> CHROMADB HIT ---")
    sample_pdf_bytes = b"%PDF-1.4\n%INSPECTION REPORT\n1 0 obj<<>>endobj\ntrailer<<>>%%EOF"
    upload_res = multimodal_pipeline.process_document("test_inspection_report.pdf", sample_pdf_bytes)

    print(f"Document Processed: {upload_res.name}")
    print(f"  • SOP Violations Detected by ChromaDB: {len(upload_res.sop_violations)}")
    for v in upload_res.sop_violations:
        print(f"     - {v}")

    assert len(upload_res.sop_violations) > 0
    all_violations_text = " ".join(upload_res.sop_violations)
    assert "MRPL" in all_violations_text or "SOP" in all_violations_text

    # 4. Air-Gap Telemetry Check
    print("\n--- [4] AIR-GAP TELEMETRY SECURITY CHECK ---")
    print(f"ANONYMIZED_TELEMETRY Environment Flag: {os.environ.get('ANONYMIZED_TELEMETRY')}")
    assert os.environ.get("ANONYMIZED_TELEMETRY") == "False"

    # 5. Sovereignty Audit Trail
    print("\n--- [5] SOVEREIGNTY AUDIT LOG VERIFICATION ---")
    integrity = audit_log.verify_chain_integrity()
    print(f"Total Audit Blocks: {integrity['total_blocks']}")
    print(f"Head Block Hash: {integrity['head_hash']}")
    print(f"Integrity Verdict: {integrity['verdict']} (Valid: {integrity['valid']})")
    assert integrity["valid"] is True

    print("\n" + "=" * 70)
    print("  ALL CHROMADB RAG & VECTOR SEARCH TESTS PASSED (100% VERIFIED)")
    print("=" * 70)

if __name__ == "__main__":
    test_rag_chromadb_live()
