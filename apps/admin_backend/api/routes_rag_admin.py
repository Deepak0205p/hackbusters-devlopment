import os
import io
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from apps.admin_backend.rag.ingest import DocumentIngestor, BASE_DATA_DIR, MRPL_DOCS_DIR, ONGC_POLICIES_DIR
from apps.admin_backend.rag.vector_store import get_vector_store

router = APIRouter(prefix="/api/rag-admin", tags=["RAG Document Ingestion & Vector Builder"])

class IngestionResponse(BaseModel):
    status: str
    message: str
    filename: str
    category: str
    chunks_indexed: int
    total_in_chromadb: int
    duration_seconds: float

class ConvertRequest(BaseModel):
    filename: str
    target_format: str  # "docx" | "xlsx" | "pptx" | "txt" | "pdf"

@router.post("/ingest-file", response_model=IngestionResponse)
async def ingest_single_document(
    file: UploadFile = File(...),
    category: str = Form("sop_mops")  # "sop_mops" | "security_policy" | "mrpl_documents" | "ongc_policies"
):
    """
    Uploads a Security Policy, SOP, MOP, or compliance document,
    extracts text, chunks clauses, generates offline BGE-small embeddings,
    and updates the persistent ChromaDB collection in real-time.
    """
    try:
        content = await file.read()
        filename = os.path.basename(file.filename or "uploaded_doc.pdf")
        
        # Determine target storage directory
        target_dir = os.path.join(BASE_DATA_DIR, category)
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, filename)

        with open(file_path, "wb") as f:
            f.write(content)

        # Ingest into ChromaDB
        ingestor = DocumentIngestor()
        chunks = ingestor.chunk_document(file_path, category)

        if not chunks:
            raise HTTPException(status_code=400, detail="Could not extract readable text/clauses from document.")

        vs = get_vector_store()
        import time
        t0 = time.time()
        
        b_ids = [c["id"] for c in chunks]
        b_docs = [c["text"] for c in chunks]
        b_metas = [c["metadata"] for c in chunks]
        b_embeddings = ingestor.embedder.embed_batch(b_docs, batch_size=32)

        vs.collection.upsert(
            ids=b_ids,
            documents=b_docs,
            embeddings=b_embeddings,
            metadatas=b_metas
        )

        duration = round(time.time() - t0, 2)
        total_count = vs.collection.count()

        return IngestionResponse(
            status="SUCCESS",
            message=f"Document '{filename}' parsed and indexed into RAG Vector Store successfully.",
            filename=filename,
            category=category,
            chunks_indexed=len(chunks),
            total_in_chromadb=total_count,
            duration_seconds=duration
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG document ingestion failed: {str(e)}")

@router.post("/convert-document")
async def convert_document(
    file: UploadFile = File(...),
    target_format: str = Form(...)  # "docx" | "xlsx" | "pptx" | "txt"
):
    """
    Universal Document Format Converter.
    Converts incoming PDF, DOCX, TXT, or tabular documents into target formats (DOCX, XLSX, PPTX, TXT).
    """
    try:
        content = await file.read()
        original_name = os.path.basename(file.filename or "document.pdf")
        base_name, ext = os.path.splitext(original_name)
        target_ext = target_format.lower().replace(".", "")

        # Extract text from input file
        extracted_text = ""
        if ext.lower() in [".pdf"]:
            from pypdf import PdfReader
            pdf = PdfReader(io.BytesIO(content))
            for page in pdf.pages:
                text = page.extract_text() or ""
                if text.strip():
                    extracted_text += text + "\n\n"
        elif ext.lower() in [".docx"]:
            from docx import Document
            doc = Document(io.BytesIO(content))
            extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        elif ext.lower() in [".txt", ".log", ".md", ".csv"]:
            extracted_text = content.decode("utf-8", errors="ignore")
        else:
            extracted_text = content.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            extracted_text = f"Extracted text content from {original_name}"

        output_dir = os.path.join(BASE_DATA_DIR, "outputs", "converted")
        os.makedirs(output_dir, exist_ok=True)
        out_filename = f"{base_name}_converted.{target_ext}"
        out_path = os.path.join(output_dir, out_filename)

        if target_ext == "docx":
            from docx import Document
            from docx.shared import Pt, RGBColor
            out_doc = Document()
            title = out_doc.add_heading(f"Converted Document: {base_name}", level=1)
            p = out_doc.add_paragraph(f"Source: {original_name} | Format: DOCX Conversion")
            out_doc.add_heading("Extracted Content", level=2)
            for paragraph_block in extracted_text.split("\n\n"):
                if paragraph_block.strip():
                    out_doc.add_paragraph(paragraph_block.strip())
            out_doc.save(out_path)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        elif target_ext == "xlsx":
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Converted_Data"
            ws.append(["Line #", "Document Section / Content", "Source"])
            for idx, line in enumerate(extracted_text.split("\n"), start=1):
                if line.strip():
                    ws.append([idx, line.strip(), original_name])
            wb.save(out_path)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        elif target_ext == "pptx":
            from pptx import Presentation
            from pptx.util import Inches, Pt
            prs = Presentation()
            # Title slide
            title_slide_layout = prs.slide_layouts[0]
            slide = prs.slides.add_slide(title_slide_layout)
            slide.shapes.title.text = base_name.replace("_", " ").title()
            slide.placeholders[1].text = f"Converted Presentation from {original_name}"

            # Content slides
            bullet_slide_layout = prs.slide_layouts[1]
            paragraphs = [p.strip() for p in extracted_text.split("\n\n") if p.strip()]
            for i in range(0, min(len(paragraphs), 15), 3):
                c_slide = prs.slides.add_slide(bullet_slide_layout)
                c_slide.shapes.title.text = f"Section {(i // 3) + 1}"
                tf = c_slide.placeholders[1].text_frame
                tf.text = paragraphs[i]
                for extra in paragraphs[i+1:i+3]:
                    p = tf.add_paragraph()
                    p.text = extra
            prs.save(out_path)
            media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

        elif target_ext == "txt":
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(extracted_text)
            media_type = "text/plain"

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported target format '{target_format}'. Choose docx, xlsx, pptx, or txt.")

        return FileResponse(
            path=out_path,
            media_type=media_type,
            filename=out_filename,
            headers={"Content-Disposition": f'attachment; filename="{out_filename}"'}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document conversion failed: {str(e)}")
