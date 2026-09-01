import pytest
import os
import io
import time
from fastapi.testclient import TestClient

from apps.admin_backend.main import app
from apps.admin_backend.rag.session_store import session_store
from apps.admin_backend.rag.vector_store import chroma_store
from apps.admin_backend.rag.ingest import document_ingestor
from apps.admin_backend.sovereignty.tamper_log import audit_log

client = TestClient(app)

# ==============================================================================
# TEST SUITE: SESSION RAG ISOLATION & DUAL-TIER RETRIEVAL
# ==============================================================================

def test_session_store_initialization():
    """Verifies that SessionVectorStoreManager initializes in air-gapped mode."""
    assert session_store is not None
    assert session_store.get_active_session_count() >= 0
    assert os.path.exists(session_store.persist_dir)

def test_session_document_ingestion_and_chunking():
    """Verifies parsing, recursive text splitting, and local embedding into an isolated session."""
    session_id = "test-session-001"
    user_id = "process_engineer_42"
    doc_content = b"""
    MRPL CRUDE DISTILLATION UNIT 2 - TEMPORARY SHIFT LOG
    Date: 2026-09-02 | Shift: Night Shift Lead B
    
    Section 1.1: Crude Charge Pump P-101B Anomalies
    At 02:15 hrs, primary crude charge pump P-101B suction strainer delta-P spiked to 1.8 bar.
    Switched to standby pump P-101A and initiated steam backwash procedure on strainer S-101.
    
    Section 1.2: Atmospheric Column Overhead Condenser E-102
    Top reflux drum temperature stabilized at 112 deg C with overhead accumulator level at 64%.
    """

    receipt = document_ingestor.ingest_session_document(
        file_bytes=doc_content,
        filename="CDU2_Shift_Log_Night.txt",
        session_id=session_id,
        user_id=user_id
    )

    assert receipt["success"] is True
    assert receipt["session_id"] == session_id
    assert receipt["chunks_indexed"] >= 1
    assert "sha256_checksum" in receipt

    # Verify query retrieval within session
    results = session_store.query_session(
        session_id=session_id,
        query_text="suction strainer delta-P spiked P-101B",
        top_k=2
    )

    assert len(results) > 0
    assert "P-101B" in results[0].matched_text
    assert results[0].file_name == "CDU2_Shift_Log_Night.txt"
    assert "[SOURCE: SESSION_FILE" in results[0].citation

def test_cross_session_isolation_zero_leakage():
    """
    CRITICAL SECURITY TEST:
    User A in Session Alpha uploads Hydrocracker Unit 4 Turnaround report.
    User B in Session Beta uploads Delayed Coker Unit Furnace B report.
    Verifies that NEITHER session can see or retrieve data from the other session.
    """
    session_alpha = "session-sec-alpha"
    session_beta = "session-sec-beta"

    alpha_doc = b"""
    HYDROCRACKER UNIT 4 - CONFIDENTIAL EMERGENCY TURNAROUND LOG
    Specialist: Lead Hydroprocessing Inspector Alpha
    
    Clause HCU-4.9: Catalyst Bed Differential Pressure Spike
    Reactor R-401 second bed pressure drop reached 4.8 bar due to severe ammonium chloride fouling.
    Emergency depressurization sequence initiated via quench valve XV-409.
    """

    beta_doc = b"""
    DELAYED COKER UNIT - FURNACE B COKING INSPECTION
    Specialist: Thermal Systems Auditor Beta
    
    Section DCU-8.3: Radiant Tube Pass 3 Skin Temperature Alert
    Furnace F-201B pass 3 skin thermocouple TI-208 recorded 685 deg C during heavy vacuum residue feed.
    Velocity steam injection increased by 15% to mitigate decoking requirements.
    """

    # Ingest into respective sessions
    document_ingestor.ingest_session_document(
        file_bytes=alpha_doc,
        filename="HCU4_Confidential_Turnaround.txt",
        session_id=session_alpha,
        user_id="inspector_alpha"
    )

    document_ingestor.ingest_session_document(
        file_bytes=beta_doc,
        filename="DCU_FurnaceB_Thermal_Report.txt",
        session_id=session_beta,
        user_id="auditor_beta"
    )

    # 1. Leak Test 1: Query Session Alpha for Furnace B Pass 3 skin temperature
    # Session Alpha MUST NOT return any results from Session Beta's Delayed Coker file
    alpha_hits = session_store.query_session(
        session_id=session_alpha,
        query_text="Furnace F-201B pass 3 skin thermocouple TI-208",
        top_k=3
    )
    for hit in alpha_hits:
        assert "Furnace F-201B" not in hit.matched_text
        assert "DCU_FurnaceB" not in hit.file_name

    # 2. Leak Test 2: Query Session Beta for Reactor R-401 catalyst bed fouling
    # Session Beta MUST NOT return any results from Session Alpha's Hydrocracker file
    beta_hits = session_store.query_session(
        session_id=session_beta,
        query_text="Reactor R-401 second bed pressure drop ammonium chloride",
        top_k=3
    )
    for hit in beta_hits:
        assert "Reactor R-401" not in hit.matched_text
        assert "HCU4_Confidential" not in hit.file_name

def test_master_knowledge_shared_availability():
    """
    Verifies that while sessions are strictly isolated from each other,
    BOTH sessions can seamlessly access Tier 1 Global Master SOP Knowledge Base.
    """
    merged_alpha = chroma_store.similarity_search_merged(
        query="radiant tube skin temperature limit furnace shutdown",
        session_id="session-sec-alpha",
        top_k_master=2,
        top_k_session=2
    )

    merged_beta = chroma_store.similarity_search_merged(
        query="radiant tube skin temperature limit furnace shutdown",
        session_id="session-sec-beta",
        top_k_master=2,
        top_k_session=2
    )

    # Both sessions should receive master SOP results
    assert len(merged_alpha.master_results) > 0
    assert len(merged_beta.master_results) > 0
    assert "[SOURCE: MASTER_SOP" in merged_alpha.combined_grounding_text
    assert "[SOURCE: MASTER_SOP" in merged_beta.combined_grounding_text

def test_dual_tier_merged_retrieval_and_provenance():
    """Verifies that merged search combines master SOPs and session attachments with distinct provenance headers."""
    session_id = "session-merged-test"
    doc_bytes = b"Special local procedure for Emergency Steam Header 3: Bypass valve HV-302 must remain 10% cracked."
    
    document_ingestor.ingest_session_document(
        file_bytes=doc_bytes,
        filename="Local_Steam_Header_Note.txt",
        session_id=session_id,
        user_id="operator_77"
    )

    res = chroma_store.similarity_search_merged(
        query="Emergency Steam Header 3 Bypass valve HV-302",
        session_id=session_id,
        top_k_master=2,
        top_k_session=2
    )

    assert res.total_hits > 0
    assert len(res.session_results) >= 1
    assert "Local_Steam_Header_Note.txt" in res.combined_grounding_text
    assert "[SOURCE: SESSION_FILE" in res.combined_grounding_text

def test_session_purge_lifecycle():
    """Verifies explicit deletion purges all session vector partitions from memory and disk."""
    session_id = "session-to-purge-99"
    doc_bytes = b"Temporary ephemeral data that should be completely deleted."

    document_ingestor.ingest_session_document(
        file_bytes=doc_bytes,
        filename="Temporary_Note.txt",
        session_id=session_id,
        user_id="temp_user"
    )

    assert session_store.get_session_stats(session_id)["active"] is True

    # Purge session
    success = session_store.delete_session(session_id, user_id="admin_cleanup")
    assert success is True

    # Verify session is no longer active and returns 0 hits
    stats = session_store.get_session_stats(session_id)
    assert stats["active"] is False
    assert len(session_store.query_session(session_id, "Temporary ephemeral data")) == 0

def test_tamper_log_records_session_events():
    """Verifies that all session RAG ingests and evictions are logged to tamper-evident audit trail."""
    recent_events = [e.event_type for e in audit_log.entries[-15:]]
    assert "SESSION_RAG_INGEST" in recent_events
    assert "SESSION_RAG_EVICT" in recent_events

    # Verify cryptographic integrity of the audit chain
    verification = audit_log.verify_chain_integrity()
    assert verification["valid"] is True
    assert verification["verdict"] == "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"

def test_upload_session_fastapi_endpoints():
    """Verifies FastAPI REST endpoints for session document upload, file listing, and deletion."""
    test_session = f"fastapi-session-{int(time.time())}"
    file_payload = ("test_report.txt", io.BytesIO(b"Compressor C-101 discharge pressure: 18.4 bar."), "text/plain")

    # 1. Upload file into session
    response = client.post(
        "/api/upload/session",
        data={"session_id": test_session, "user_id": "api_tester"},
        files={"file": file_payload}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["session_id"] == test_session
    assert data["chunks_indexed"] >= 1

    # 2. List files in session
    list_res = client.get(f"/api/upload/session/{test_session}/files")
    assert list_res.status_code == 200
    files_data = list_res.json()
    assert files_data["total_files"] == 1
    assert files_data["files"][0]["file_name"] == "test_report.txt"

    # 3. Delete session
    del_res = client.delete(f"/api/upload/session/{test_session}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
