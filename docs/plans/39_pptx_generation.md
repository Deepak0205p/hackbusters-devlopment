# Plan 39: PowerPoint Slide Deck (.pptx) Generator Design

## 1. Objective
Design the programmatic PowerPoint presentation generator in `backend/tools/pptx_tool.py` using `python-pptx`, generating structured slide decks for refinery turnaround reviews, technical briefings, and executive management updates.

## 2. Requirement Mapping
- **SIH26117 Requirement 10:** *PRODUCTION DELIVERABLE GENERATION* — Direct automated generation of structured, editable enterprise artifacts including PowerPoint (.pptx).

## 3. Detailed Design & Technical Approach

### 3.1. Slide Deck Master Layout & Theme
1. **Slide 1 (Title Slide):** Dark industrial slate background (`#0F172A`), large white title, subtitle, date, and presenter details.
2. **Slide 2+ (Content Slides):** White background, dark header bar, structured bullet points with bold leading terms, and footer disclaimer (*MRPL Confidential — On-Premise Sovereign AI Generated*).

### 3.2. Programmatic PowerPoint Implementation (`backend/tools/pptx_tool.py`)
```python
import os
import uuid
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from typing import Dict, Any, List, Optional
from backend.tools.base import BaseTool

class PptxGeneratorTool(BaseTool):
    name = "pptx_generator"
    description = "Generates formatted Microsoft PowerPoint (.pptx) slide decks from technical data."

    def __init__(self, output_dir: str = "data/outputs/pptx"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    async def _run(
        self,
        presentation_title: str,
        subtitle: str,
        slides_data: List[Dict[str, Any]],
        output_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        prs = Presentation()
        prs.slide_width = Inches(13.333) # 16:9 widescreen
        prs.slide_height = Inches(7.5)

        # 1. Title Slide
        blank_slide_layout = prs.slide_layouts[6]
        slide1 = prs.slides.add_slide(blank_slide_layout)
        
        # Background shape
        bg = slide1.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = RGBColor(15, 23, 42) # Slate 900
        bg.line.fill.background()

        # Title Text
        tx_box = slide1.shapes.add_textbox(Inches(1.5), Inches(2.2), Inches(10.33), Inches(3.0))
        tf = tx_box.text_frame
        tf.word_wrap = True
        
        p_title = tf.paragraphs[0]
        p_title.text = presentation_title
        p_title.font.size = Pt(36)
        p_title.font.bold = True
        p_title.font.color.rgb = RGBColor(255, 255, 255)

        p_sub = tf.add_paragraph()
        p_sub.text = f"{subtitle}\nMangalore Refinery and Petrochemicals Limited (MRPL)"
        p_sub.font.size = Pt(20)
        p_sub.font.color.rgb = RGBColor(148, 163, 184)

        # 2. Content Slides
        for s_idx, s_data in enumerate(slides_data, 1):
            slide = prs.slides.add_slide(blank_slide_layout)
            
            # Slide Header Banner
            header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(1.0))
            tf_h = header_box.text_frame
            p_h = tf_h.paragraphs[0]
            p_h.text = s_data.get("title", f"Slide {s_idx}")
            p_h.font.size = Pt(28)
            p_h.font.bold = True
            p_h.font.color.rgb = RGBColor(15, 23, 42)

            # Bullet Points Box
            body_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.8))
            tf_b = body_box.text_frame
            tf_b.word_wrap = True
            
            bullets = s_data.get("bullet_points", [])
            for b_idx, bullet in enumerate(bullets):
                p_b = tf_b.paragraphs[0] if b_idx == 0 else tf_b.add_paragraph()
                p_b.text = f"•  {bullet}"
                p_b.font.size = Pt(18)
                p_b.font.color.rgb = RGBColor(51, 65, 85)
                p_b.space_after = Pt(12)

        filename = output_filename or f"turnaround_deck_{uuid.uuid4().hex[:6]}.pptx"
        if not filename.endswith(".pptx"):
            filename += ".pptx"
        file_path = os.path.abspath(os.path.join(self.output_dir, filename))
        prs.save(file_path)

        return {
            "status": "SUCCESS",
            "filename": filename,
            "file_path": file_path,
            "total_slides": len(slides_data) + 1,
            "download_url": f"/api/files/download/{filename}"
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Deck title, subtitle, slides list `{title, bullet_points}`.
- **Output:** Valid `.pptx` presentation file and download URL.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md).
- Depended on by: [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Overflowing Text on Content Slides:** Limit bullet points to maximum 6 per slide and wrap text automatically.

## 7. Acceptance Criteria & Verification
- Generates 16:9 widescreen presentation deck with dark title slide and formatted bullet content slides.
- File opens cleanly in PowerPoint, Keynote, and Google Slides.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Defaulting to modern 16:9 aspect ratio (`13.333" x 7.5"`) ensures slide decks look sharp on executive conference displays.
