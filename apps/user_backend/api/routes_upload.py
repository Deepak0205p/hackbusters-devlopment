import os
import base64
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, status

from apps.shared.ocr.pipeline import multimodal_pipeline, DocumentProcessingResult
from apps.shared.rag.ingest import document_ingestor
from apps.shared.rag.session_store import session_store

router = APIRouter(prefix="/api/upload", tags=["Multimodal Ingestion & Session RAG Hub"])

# ==============================================================================
# SCHEMAS
# ==============================================================================
class Base64OCRRequest(BaseModel):
    filename: str
    file_base64: str
    prompt: Optional[str] = "Extract and structure all engineering parameters and text."

class SessionUploadResponse(BaseModel):
    success: bool
    session_id: str
    file_id: str
    file_name: str
    pages_extracted: int
    chunks_indexed: int
    total_session_chunks: int
    sha256_checksum: str
    duration_ms: int
    message: str = "Document successfully ingested into isolated session vector store."

class SessionFileListResponse(BaseModel):
    session_id: str
    active: bool
    total_files: int
    total_chunks: int
    files: List[Dict[str, Any]] = Field(default_factory=list)

class SessionDeleteResponse(BaseModel):
    success: bool
    session_id: str
    message: str

# ==============================================================================
# OCR & MULTIMODAL INGESTION ENDPOINTS (LEGACY & EXTENSION)
# ==============================================================================
@router.post("", response_model=DocumentProcessingResult)
async def upload_document(file: UploadFile = File(...)):
    """
    Ingests refinery PDF inspection reports, P&ID schematics, or equipment images.
    Executes magic-byte validation, OCR extraction, structured entity parsing,
    and SOP compliance checking.
    """
    try:
        content = await file.read()
        filename = os.path.basename(file.filename or "uploaded_doc.pdf")

        # Execute 5-Stage Multimodal Processing Pipeline
        result = multimodal_pipeline.process_document(filename, content)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid document format or payload: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Document Ingestion Error: Unable to process the uploaded file through the multimodal pipeline. Please ensure the file is valid and uncorrupted."
        )

@router.post("/base64", response_model=DocumentProcessingResult)
async def upload_document_base64(payload: Base64OCRRequest):
    """
    Direct base64 image/document upload endpoint for chat attachments.
    """
    try:
        raw_b64 = payload.file_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        content = base64.b64decode(raw_b64)
        filename = os.path.basename(payload.filename or "chat_attachment.png")

        result = multimodal_pipeline.process_document(filename, content)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="OCR Extraction Error: Unable to parse the base64-encoded attachment. Please verify the image formatting and try again."
        )

# ==============================================================================
# SESSION-SCOPED EPHEMERAL RAG INGESTION ENDPOINTS
# ==============================================================================
@router.post("/session", response_model=SessionUploadResponse)
async def upload_session_document(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    user_id: Optional[str] = Form("operator"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    """
    Uploads and indexes ad-hoc turnaround log sheets, P&ID scans, or shift handover notes
    strictly into the caller's isolated session vector partition.
    Guarantees ZERO leakage into global master knowledge or other user sessions.
    """
    target_session_id = session_id or x_session_id
    if not target_session_id or not target_session_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid 'session_id' must be provided via form data or 'X-Session-ID' header."
        )

    try:
        content = await file.read()
        filename = os.path.basename(file.filename or "session_attachment.pdf")

        # Ingest into session vector store with local BGE-M3 embeddings
        receipt = document_ingestor.ingest_session_document(
            file_bytes=content,
            filename=filename,
            session_id=target_session_id.strip(),
            user_id=user_id or "operator"
        )

        return SessionUploadResponse(
            success=True,
            session_id=target_session_id.strip(),
            file_id=receipt["file_id"],
            file_name=filename,
            pages_extracted=receipt.get("pages_extracted", 1),
            chunks_indexed=receipt["chunks_indexed"],
            total_session_chunks=receipt["total_session_chunks"],
            sha256_checksum=receipt.get("sha256_checksum", ""),
            duration_ms=receipt["duration_ms"],
            message=f"File '{filename}' indexed into session '{target_session_id}' ({receipt['chunks_indexed']} chunks)."
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document parameter or format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session Ingestion Unavailable: An unexpected issue occurred while indexing the session document into the vector store. Please verify the document structure and retry."
        )

@router.get("/session/{session_id}/files", response_model=SessionFileListResponse)
async def list_session_files(session_id: str):
    """
    Returns the list of temporary documents and chunk stats for an active session.
    """
    stats = session_store.get_session_stats(session_id)
    files = session_store.list_session_files(session_id)

    return SessionFileListResponse(
        session_id=session_id,
        active=stats.get("active", False),
        total_files=len(files),
        total_chunks=stats.get("total_chunks", 0),
        files=files
    )

@router.delete("/session/{session_id}", response_model=SessionDeleteResponse)
async def delete_session_vectors(
    session_id: str,
    user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Explicitly purges all ephemeral vector embeddings and temporary files for the specified session.
    """
    success = session_store.delete_session(session_id=session_id, user_id=user_id or "operator")
    if not success:
        return SessionDeleteResponse(
            success=False,
            session_id=session_id,
            message=f"Session '{session_id}' not found or already deallocated."
        )

    return SessionDeleteResponse(
        success=True,
        session_id=session_id,
        message=f"Ephemeral vector memory for session '{session_id}' successfully purged."
    )
