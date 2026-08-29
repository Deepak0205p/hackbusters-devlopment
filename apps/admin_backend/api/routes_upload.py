import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from apps.admin_backend.ocr.pipeline import multimodal_pipeline, DocumentProcessingResult

router = APIRouter(prefix="/api/upload", tags=["Multimodal Ingestion & OCR Hub"])

@router.post("", response_model=DocumentProcessingResult)
async def upload_document(file: UploadFile = File(...)):
    """
    Ingests refinery PDF inspection reports, P&ID schematics, or handwritten logs.
    Executes magic-byte validation, PaddleOCR CPU extraction, Qwen2-VL tag classification,
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
