# Plan 28: Handwritten Notes & Degraded Field Log Extraction Plan

## 1. Objective
Design the offline extraction and enhancement pipeline in `backend/tools/handwritten_extractor.py` for reading handwritten operator shift logs, inspection notes, and low-contrast refinery field sheets.

## 2. Requirement Mapping
- **SIH26117 Requirement 08:** *MULTIMODAL INPUT PROCESSING* — Handwritten field notes and inspection photographs.
- **SIH26117 Requirement 09:** *ON-DEVICE OCR & VISION* — High-precision local OCR coupled with VLMs.

## 3. Detailed Design & Technical Approach

### 3.1. Adaptive Thresholding & Binarization Pipeline
```python
import numpy as np
from PIL import Image, ImageOps, ImageFilter
from typing import Dict, Any
from backend.tools.ocr_tool import PaddleOCRTool
from backend.core.ollama_client import OllamaClient

class HandwrittenLogExtractor:
    def __init__(self, ocr_tool: PaddleOCRTool, ollama: OllamaClient):
        self.ocr = ocr_tool
        self.ollama = ollama

    def enhance_handwriting(self, image_path: str, output_path: str) -> str:
        """Apply grayscale, unsharp mask, and adaptive thresholding to bring out faint handwriting."""
        with Image.open(image_path) as img:
            gray = img.convert("L")
            # Enhance local edge contrast
            sharpened = gray.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            # Auto-contrast stretch
            stretched = ImageOps.autocontrast(sharpened, cutoff=2)
            stretched.save(output_path)
            return output_path

    async def extract_handwritten_content(self, image_path: str) -> Dict[str, Any]:
        temp_enhanced = image_path.replace(".", "_enhanced.")
        self.enhance_handwriting(image_path, temp_enhanced)
        
        # Run PaddleOCR with mobile handwriting/rec model
        ocr_result = await self.ocr._run(file_path=temp_enhanced)
        
        # Use Qwen 3 reasoning to clean up OCR errors and normalize field log entries
        clean_prompt = (
            f"Here is the raw OCR output from a handwritten refinery field maintenance log:\n"
            f"{ocr_result.get('raw_text', '')}\n\n"
            f"Correct minor OCR misspellings, extract equipment status and readings, and format into structured bullet points."
        )
        
        corrected_chunks = []
        async for chunk in self.ollama.generate_stream(model="qwen3:4b-q4_k_m", prompt=clean_prompt):
            corrected_chunks.append(chunk)

        return {
            "status": "SUCCESS",
            "raw_ocr": ocr_result.get("raw_text", ""),
            "normalized_log": "".join(corrected_chunks)
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Handwritten field log image path (`.jpg` / `.png`).
- **Output:** Cleaned, structured text log with equipment readings and maintenance annotations.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 24](file:///G:/SIH/p/docs/plans/24_paddleocr_integration.md), [Plan 26](file:///G:/SIH/p/docs/plans/26_qwen2_vl_preprocessing.md).
- Depended on by: [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Carbon-Copy Smudged Text:** Unsharp masking and auto-contrast stretch faint ink lines while suppressing gray background paper grain.

## 7. Acceptance Criteria & Verification
- Extraction from sample handwritten log sheet recovers numeric values (e.g. `620°C`, `0.45 mm/yr`) with $> 90\%$ accuracy.
- Pipeline runs completely offline with 0 external network packets.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Post-processing raw OCR through Qwen 3 reasoning corrects domain abbreviations (e.g. `temp -> temperature`, `vlv -> valve`) intelligently.
