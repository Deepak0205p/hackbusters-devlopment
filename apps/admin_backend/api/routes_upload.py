import os
import base64
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from apps.admin_backend.ocr.pipeline import multimodal_pipeline, DocumentProcessingResult

router = APIRouter(prefix="/api/upload", tags=["Multimodal Ingestion & OCR Hub"])

class Base64OCRRequest(BaseModel):
    filename: str
    file_base64: str
    prompt: Optional[str] = "Extract and structure all engineering parameters and text."

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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multimodal ingestion failed: {str(e)}")

@router.post("/base64", response_model=DocumentProcessingResult)
async def upload_document_base64(payload: Base64OCRRequest):
    """
    Direct base64 image/document upload endpoint for chat attachments.
    """
    try:
        # Strip data URL header if present (e.g. data:image/png;base64,...)
        raw_b64 = payload.file_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        content = base64.b64decode(raw_b64)
        filename = os.path.basename(payload.filename or "chat_attachment.png")

        result = multimodal_pipeline.process_document(filename, content)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Base64 OCR extraction failed: {str(e)}")

