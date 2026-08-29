# Plan 27: P&ID Engineering Drawing Component Classification Plan

## 1. Objective
Design the domain-specific parser for Piping & Instrumentation Diagrams (P&IDs), detecting and classifying refinery assets (gate valves, control valves, centrifugal pumps, pressure/temperature transmitters) and extracting equipment tag strings (e.g. `P-101A/B`, `PT-201`, `FCV-102`).

## 2. Requirement Mapping
- **SIH26117 Requirement 08:** *MULTIMODAL INPUT PROCESSING* — Processing complex engineering diagrams.
- **SIH26117 Requirement 10:** *PRODUCTION DELIVERABLE GENERATION* — Generating Excel asset registers from drawings.

## 3. Detailed Design & Technical Approach

### 3.1. Refinery Tag Nomenclature & ISA 5.1 Standards
The parser recognizes standard ISA 5.1 instrumentation and equipment prefixes:
- **`P-[0-9]{3}[A-Z]?`**: Centrifugal / Booster Pump
- **`FCV-[0-9]{3}`**: Flow Control Valve
- **`PT-[0-9]{3}`**: Pressure Transmitter
- **`TT-[0-9]{3}`**: Temperature Transmitter
- **`LT-[0-9]{3}`**: Level Transmitter
- **`F-[0-9]{3}`**: Process Furnace / Heater
- **`V-[0-9]{3}`**: Pressure Vessel / Drum

### 3.2. P&ID Tag Extraction & Classification Logic (`backend/tools/pid_analyzer.py`)
```python
import re
from typing import List, Dict, Any
from backend.rag.vision_pipeline import MultimodalVisionPipeline

class PIDDrawingAnalyzer:
    TAG_REGEXES = {
        "Centrifugal Pump": re.compile(r'\b(P-\d{3}[A-Z]?)\b', re.IGNORECASE),
        "Control Valve": re.compile(r'\b(FCV-\d{3}|PCV-\d{3}|TCV-\d{3})\b', re.IGNORECASE),
        "Gate / Manual Valve": re.compile(r'\b(HV-\d{3}|GV-\d{3}|VLV-\d{3})\b', re.IGNORECASE),
        "Pressure Transmitter": re.compile(r'\b(PT-\d{3}|PIT-\d{3})\b', re.IGNORECASE),
        "Temperature Transmitter": re.compile(r'\b(TT-\d{3}|TIT-\d{3})\b', re.IGNORECASE),
        "Process Vessel / Drum": re.compile(r'\b(V-\d{3}|D-\d{3})\b', re.IGNORECASE)
    }

    def __init__(self, vision_pipeline: MultimodalVisionPipeline):
        self.vision = vision_pipeline

    async def extract_pid_assets(self, image_path: str) -> List[Dict[str, Any]]:
        # Run combined OCR + Qwen2-VL analysis
        analysis = await self.vision.analyze_visual_document(
            image_path=image_path,
            query="Extract all equipment tags, valves, pumps, and instruments in this P&ID drawing."
        )
        
        combined_text = analysis["ocr_text"] + " " + analysis["vlm_analysis"]
        detected_assets = []
        seen_tags = set()

        for equip_type, regex in self.TAG_REGEXES.items():
            matches = regex.findall(combined_text)
            for tag in matches:
                tag_upper = tag.upper()
                if tag_upper not in seen_tags:
                    seen_tags.add(tag_upper)
                    detected_assets.append({
                        "tag_number": tag_upper,
                        "equipment_type": equip_type,
                        "status": "OPERATIONAL",
                        "maintenance_flag": "INSPECT" if "P-" in tag_upper else "NORMAL"
                    })

        return detected_assets
```

## 4. Inputs / Outputs & Contracts
- **Input:** P&ID schematic image file path (`.png` / `.pdf`).
- **Output:** Structured asset list with `tag_number`, `equipment_type`, and `maintenance_flag`.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 26](file:///G:/SIH/p/docs/plans/26_qwen2_vl_preprocessing.md).
- Depended on by: [Plan 38](file:///G:/SIH/p/docs/plans/38_xlsx_generation.md), [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Rotated Vertical Tag Text:** PaddleOCR angle classification (`use_angle_cls=True`) automatically normalizes 90-degree and 270-degree rotated labels.

## 7. Acceptance Criteria & Verification
- Analysis of demo P&ID drawing extracts at least 6 distinct equipment tags with 100% correct type classification.
- Output array is passed directly into `xlsx_generator` to create `asset_register.xlsx`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** ISA 5.1 regex post-filtering cleans up raw OCR noise, ensuring that only authentic engineering tags enter the asset register.
