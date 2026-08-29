# Plan 24: PaddleOCR Integration & Offline Model Caching Strategy

## 1. Objective
Design the primary high-accuracy local OCR engine in `backend/tools/ocr_tool.py` using PaddleOCR, configured in strict offline mode with pre-downloaded, bundled model weights in `data/models/paddleocr/` for extracting text, equipment tags, and numerical tables from low-resolution or degraded refinery scans.

## 2. Requirement Mapping
- **SIH26117 Requirement 08:** *MULTIMODAL INPUT PROCESSING* — Native support for processing scanned PDF inspection reports, handwritten field notes, and engineering diagrams.
- **SIH26117 Requirement 09:** *ON-DEVICE OCR & VISION* — Integration of high-precision local OCR engines (PaddleOCR/Tesseract).

## 3. Detailed Design & Technical Approach

### 3.1. Offline Model Weight Directory Layout
```
data/models/paddleocr/
├── whl/
│   ├── det/en/en_PP-OCRv4_det_infer/
│   │   ├── inference.pdmodel
│   │   └── inference.pdiparams
│   ├── rec/en/en_PP-OCRv4_rec_infer/
│   │   ├── inference.pdmodel
│   │   └── inference.pdiparams
│   └── cls/ch_ppocr_mobile_v2.0_cls_infer/
│       ├── inference.pdmodel
│       └── inference.pdiparams
```

### 3.2. Offline PaddleOCR Tool Implementation (`backend/tools/ocr_tool.py`)
```python
import os
from typing import Dict, Any, List
from paddleocr import PaddleOCR
from backend.tools.base import BaseTool

# Suppress Paddle auto-reporting and cloud lookups
os.environ["PADDLE_PDX_DISABLE_REPORT"] = "1"

class PaddleOCRTool(BaseTool):
    name = "paddle_ocr"
    description = "Extracts high-precision text, tabular values, and equipment tags from scanned PDFs and images."

    def __init__(self, model_dir: str = "data/models/paddleocr"):
        self.model_dir = model_dir
        # Initialize PaddleOCR pointing to local offline directories
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang="en",
            use_gpu=False, # Use CPU to conserve 6GB GPU VRAM for LLMs
            det_model_dir=os.path.join(model_dir, "whl/det/en/en_PP-OCRv4_det_infer"),
            rec_model_dir=os.path.join(model_dir, "whl/rec/en/en_PP-OCRv4_rec_infer"),
            cls_model_dir=os.path.join(model_dir, "whl/cls/ch_ppocr_mobile_v2.0_cls_infer"),
            show_log=False
        )

    async def _run(self, file_path: str, extract_tables: bool = True) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Input file not found at: {file_path}")

        result = self.ocr.ocr(file_path, cls=True)
        text_blocks = []
        extracted_lines = []

        if result and result[0]:
            for line in result[0]:
                box = line[0]
                text, score = line[1]
                if score >= 0.60: # Confidence filter
                    text_blocks.append({
                        "text": text,
                        "confidence": round(float(score), 3),
                        "box": box
                    })
                    extracted_lines.append(text)

        full_text = "\n".join(extracted_lines)
        return {
            "status": "SUCCESS",
            "file_path": file_path,
            "total_blocks_found": len(text_blocks),
            "text_blocks": text_blocks,
            "raw_text": full_text
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** `file_path` (PDF or image path).
- **Output:** Extracted `text_blocks` array with bounding boxes, confidence scores, and concatenated `raw_text`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md).
- Depended on by: [Plan 25](file:///G:/SIH/p/docs/plans/25_tesseract_fallback.md), [Plan 26](file:///G:/SIH/p/docs/plans/26_qwen2_vl_preprocessing.md), [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **PDF with Multiple Pages:** Iterate through PDF pages via `pdfplumber` or `pdf2image`, performing OCR per page and merging results.
- **Local Model Weights Missing:** Detect missing directory and cleanly fallback to Tesseract OCR engine.

## 7. Acceptance Criteria & Verification
- OCR extracts skin temperature `620 C` and corrosion rate `0.45 mm/yr` from sample furnace inspection sheet with $> 95\%$ character accuracy.
- Execution completes locally with 0 outbound network packets.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Running PaddleOCR on CPU (`use_gpu=False`) is a key architectural decision: it takes only ~1.5s per page on Ryzen 5 CPU and preserves 100% of the GPU's 6GB VRAM for LLM inference.
