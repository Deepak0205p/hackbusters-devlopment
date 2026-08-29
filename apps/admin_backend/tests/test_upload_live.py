import io
from fastapi.testclient import TestClient
from apps.admin_backend.main import app
from apps.admin_backend.sovereignty.tamper_log import audit_log

def test_multimodal_upload_live():
    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - MULTIMODAL INGESTION & OCR LIVE TEST")
    print("=" * 70)

    client = TestClient(app)

    # 1. Test Valid PDF Inspection Report Upload with Real Magic Bytes (%PDF)
    print("\n--- [1] TEST VALID INSPECTION REPORT PDF (%PDF HEADER) ---")
    with open("data/sample_inputs/inspection_report_furnace.pdf", "rb") as f:
        pdf_content = f.read()
    files = {"file": ("inspection_report_furnace.pdf", pdf_content, "application/pdf")}

    res = client.post("/api/upload", files=files)
    print(f"POST /api/upload -> Status: {res.status_code}")
    data = res.json()
    print(f"  • Ingested ID: {data['id']}")
    print(f"  • Name: {data['name']} ({data['size_formatted']})")
    print(f"  • SHA-256: {data['sha256_hash']}")
    print(f"  • OCR Engine: {data['ocr_engine']}")
    print(f"  • Extracted Findings Count: {len(data['findings'])}")
    for f in data['findings']:
        print(f"     - [{f['category'].upper()}] {f['key']}: {f['value']} (Confidence: {f['confidence']}%)")
    print(f"  • SOP Violations: {data['sop_violations']}")

    assert res.status_code == 200
    assert data["name"] == "inspection_report_furnace.pdf"
    assert len(data["findings"]) >= 4
    assert len(data["sop_violations"]) > 0

    # 2. Test Valid P&ID Schematic PNG Upload with Real PNG Signature (\x89PNG)
    print("\n--- [2] TEST VALID P&ID DRAWING PNG (PNG MAGIC BYTES) ---")
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    files_pid = {"file": ("dwg_cdu_004_pid.png", png_content, "image/png")}

    res_pid = client.post("/api/upload", files=files_pid)
    print(f"POST /api/upload (P&ID) -> Status: {res_pid.status_code}")
    data_pid = res_pid.json()
    print(f"  • Type: {data_pid['type']}")
    print(f"  • ISA 5.1 Tags Found: {len(data_pid['findings'])}")
    for f in data_pid['findings'][:3]:
        print(f"     - {f['key']}: {f['value']}")

    assert res_pid.status_code == 200
    assert data_pid["type"] == "pid_drawing"
    assert len(data_pid["findings"]) >= 2
    assert "Vision" in data_pid["findings"][0]["value"]

    # 3. Test Security Check: Magic-Byte Spoofing Rejection
    print("\n--- [3] TEST SECURITY: MAGIC-BYTE SPOOFING REJECTION ---")
    spoofed_content = b"MALICIOUS_EXECUTABLE_CONTENT_NOT_A_PDF"
    files_spoofed = {"file": ("malicious_file.pdf", spoofed_content, "application/pdf")}

    res_spoofed = client.post("/api/upload", files=files_spoofed)
    print(f"POST /api/upload (Spoofed PDF) -> Status: {res_spoofed.status_code} (Expected 400)")
    print(f"  • Error Detail: {res_spoofed.json()['detail']}")
    assert res_spoofed.status_code == 400
    assert "magic-byte signature mismatch" in res_spoofed.json()["detail"].lower()

    # 4. Verify Sovereignty Audit Log Entry
    print("\n--- [4] SOVEREIGNTY AUDIT LOG INGESTION RECORD ---")
    integrity = audit_log.verify_chain_integrity()
    print(f"Total Audit Blocks: {integrity['total_blocks']}")
    print(f"Head Block Hash: {integrity['head_hash']}")
    print(f"Integrity Verdict: {integrity['verdict']} (Valid: {integrity['valid']})")
    assert integrity["valid"] is True

    print("\n" + "=" * 70)
    print("  ALL MULTIMODAL INGESTION & OCR TESTS PASSED (100% VERIFIED)")
    print("=" * 70)

if __name__ == "__main__":
    test_multimodal_upload_live()
