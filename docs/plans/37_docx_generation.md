# Plan 37: Word Document (.docx) Generator & Executive Approval Note Template

## 1. Objective
Design the programmatic Word document generator in `backend/tools/docx_tool.py` using `python-docx`, creating production-grade, editable executive approval notes and technical memos styled with official MRPL headers, table structures, and SOP citations.

## 2. Requirement Mapping
- **SIH26117 Requirement 10:** *PRODUCTION DELIVERABLE GENERATION* — Direct automated generation of fully structured, editable enterprise artifacts including Word (.docx).
- **SIH26117 Requirement 14:** *END-TO-END INDUSTRIAL AGENTIC TASK* — Prepares an urgent approval note as a formatted Word (.docx) file.

## 3. Detailed Design & Technical Approach

### 3.1. Executive Approval Note Layout & Styling Rules
1. **Document Header:** Formal organizational title (*MANGALORE REFINERY AND PETROCHEMICALS LIMITED*).
2. **Metadata Table:** Note Reference Number, Date, Subject, Initiating Department, Priority Level (Urgent / Normal).
3. **Structured Sections:**
   - Section 1: Executive Summary & Anomaly Findings
   - Section 2: Technical Inspection Metrics (Furnace Skin Temp, Corrosion Rate)
   - Section 3: Grounded Standard Operating Procedure Verification (Clause citations)
   - Section 4: Recommended Turnaround Actions & Financial Impact
4. **Sign-Off Block:** Designated approval signature blocks for Chief General Manager (Operations) and Executive Director.

### 3.2. Programmatic Word Generator Implementation (`backend/tools/docx_tool.py`)
```python
import os
import uuid
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from typing import Dict, Any, List
from backend.tools.base import BaseTool

class DocxGeneratorTool(BaseTool):
    name = "docx_generator"
    description = "Generates formatted Microsoft Word (.docx) approval notes, memos, and executive reports."

    def __init__(self, output_dir: str = "data/outputs/docx"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    async def _run(
        self,
        title: str,
        subject: str,
        sections: List[Dict[str, str]],
        metadata: Optional[Dict[str, str]] = None,
        output_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        doc = Document()
        
        # Set margins
        for sec in doc.sections:
            sec.top_margin = Inches(1.0)
            sec.bottom_margin = Inches(1.0)
            sec.left_margin = Inches(1.0)
            sec.right_margin = Inches(1.0)

        # 1. Header Title
        p_head = doc.add_paragraph()
        p_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_org = p_head.add_run("MANGALORE REFINERY AND PETROCHEMICALS LIMITED\n")
        run_org.font.size = Pt(14)
        run_org.font.bold = True
        run_org.font.color.rgb = RGBColor(15, 23, 42)

        run_sub = p_head.add_run(title.upper() + "\n")
        run_sub.font.size = Pt(12)
        run_sub.font.bold = True
        run_sub.font.color.rgb = RGBColor(220, 38, 38) # Red alert accent

        # 2. Metadata Table
        meta_table = doc.add_table(rows=3, cols=2)
        meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        meta_table.style = 'Light Shading Accent 1'
        
        meta = metadata or {}
        rows_data = [
            ("SUBJECT:", subject),
            ("DATE & REF:", f"{meta.get('date', '2026-08-25')} | REF: {meta.get('ref_no', 'MRPL/OPS/2026/089')}"),
            ("GROUNDED SOP:", meta.get("sop_reference", "SOP-MRPL-FURNACE-01 Clause 4.1.2"))
        ]
        for idx, (label, val) in enumerate(rows_data):
            row = meta_table.rows[idx]
            row.cells[0].paragraphs[0].add_run(label).font.bold = True
            row.cells[1].paragraphs[0].add_run(val)

        doc.add_paragraph("") # Spacing

        # 3. Content Sections
        for sec in sections:
            h = doc.add_heading(sec.get("heading", "Section"), level=1)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
            p = doc.add_paragraph(sec.get("content", ""))
            p.paragraph_format.line_spacing = 1.15

        # 4. Signatures
        doc.add_paragraph("\n\n")
        sig_table = doc.add_table(rows=1, cols=2)
        sig_table.rows[0].cells[0].paragraphs[0].add_run("Prepared by:\nLead Inspection Engineer\nMRPL Refinery Unit-1").font.italic = True
        sig_table.rows[0].cells[1].paragraphs[0].add_run("Approved by:\nChief General Manager (Operations)\nExecutive Director (Technical Services)").font.italic = True

        # Save File
        filename = output_filename or f"approval_note_{uuid.uuid4().hex[:6]}.docx"
        if not filename.endswith(".docx"):
            filename += ".docx"
        file_path = os.path.abspath(os.path.join(self.output_dir, filename))
        doc.save(file_path)

        return {
            "status": "SUCCESS",
            "filename": filename,
            "file_path": file_path,
            "download_url": f"/api/files/download/{filename}"
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Document title, subject, sections list `{heading, content}`, metadata `{sop_reference, ref_no}`.
- **Output:** Valid `.docx` file saved to disk and returned with download URL.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md).
- Depended on by: [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Invalid Section Content Types:** Sanitize inputs, converting non-string values to string format before adding to document paragraphs.

## 7. Acceptance Criteria & Verification
- Generates fully formatted `approval_note.docx` containing headings, metadata table, SOP clause citations, and signature blocks.
- Word document opens without corruption in Microsoft Word and LibreOffice Writer.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Using standard `python-docx` styles (`Light Shading Accent 1`) ensures clean, professional rendering across all versions of Microsoft Office.
