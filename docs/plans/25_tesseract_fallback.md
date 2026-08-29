# Plan 25: Tesseract OCR Fallback & Preprocessing Pipeline

## 1. Objective
Design the secondary offline OCR fallback engine using Tesseract 5.3+ via `pytesseract`, combined with OpenCV/Pillow image binarization and thresholding filters to extract text if PaddleOCR is uninitialized or encountering corrupted models.

## 2. Requirement Mapping
- **SIH26117 Requirement 09:** *ON-DEVICE OCR & VISION* — Integration of high-precision local OCR engines (PaddleOCR/Tesseract).

## 3. Detailed Design & Technical Approach

### 3.1. Image Preprocessing & Tesseract Wrapper (`backend/tools/tesseract_tool.py`)
```python
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import os
from typing import Dict, Any
from backend.tools.base import BaseTool

class TesseractOCRTool(BaseTool):
    name = "tesseract_ocr"
    description = "Fallback local OCR engine for extracting text from images and documents."

    def _preprocess_image(self, image_path: str) -> Image.Image:
        """Apply contrast enhancement and grayscale conversion for degraded scans."""
        img = Image.open(image_path).convert("L") # Grayscale
        # Increase contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        # Apply slight median filter to remove scan noise
        img = img.filter(ImageFilter.MedianFilter(size=3))
        return img

    async def _run(self, file_path: str) -> Dict[str, Any]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} does not exist.")

        processed_img = self._preprocess_image(file_path)
        extracted_text = pytesseract.image_to_string(processed_img, config="--psm 6")
        
        return {
            "status": "SUCCESS",
            "file_path": file_path,
            "engine": "tesseract_fallback",
            "raw_text": extracted_text.strip()
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Image file path (`.png`, `.jpg`, `.tiff`).
- **Output:** Extracted plain text string payload.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md), [Plan 24](file:///G:/SIH/p/docs/plans/24_paddleocr_integration.md).
- Depended on by: [Plan 26](file:///G:/SIH/p/docs/plans/26_qwen2_vl_preprocessing.md).

## 6. Edge Cases & Failure Modes
- **Tesseract Binary Not in System PATH:** Provide configuration override `pytesseract.pytesseract.tesseract_cmd = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe"` on Windows.

## 7. Acceptance Criteria & Verification
- Preprocessing filter sharpens blurry scan and extracts text with $> 90\%$ accuracy.
- Execution completes locally in $< 1.0\text{ second}$.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Grayscale conversion and contrast enhancement pre-filtering significantly boosts Tesseract accuracy on degraded carbon-copy refinery field logs.
