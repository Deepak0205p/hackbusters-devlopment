# Plan 38: Excel Spreadsheet (.xlsx) Generator & Equipment Asset Register Template

## 1. Objective
Design the programmatic Excel spreadsheet generator in `backend/tools/xlsx_tool.py` using `openpyxl`, creating structured equipment asset registers, calculation sheets with formulas, custom header formatting, and conditional maintenance flags.

## 2. Requirement Mapping
- **SIH26117 Requirement 10:** *PRODUCTION DELIVERABLE GENERATION* — Direct automated generation of structured, editable enterprise artifacts including Excel (.xlsx).
- **SIH26117 Requirement 14:** *END-TO-END INDUSTRIAL AGENTIC TASK* — Organizes extracted P&ID assets into an editable Excel workbook.

## 3. Detailed Design & Technical Approach

### 3.1. Asset Register Styling Rules
1. **Title Header:** Dark Slate `#1E293B` background with White bold text.
2. **Column Headers:** Emerald `#047857` background with White bold text.
3. **Data Rows:** Zebra striping with alternating `#F8FAFC` background.
4. **Maintenance Flags:** Conditional fill (Red `#FEE2E2` for `CRITICAL` / `OVERHAUL`, Yellow `#FEF3C7` for `INSPECT`, Green `#DCFCE7` for `NORMAL`).
5. **Column Auto-Fit:** Automatically adjusts column widths based on maximum string lengths.

### 3.2. Programmatic Excel Generator Implementation (`backend/tools/xlsx_tool.py`)
```python
import os
import uuid
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from typing import Dict, Any, List, Optional
from backend.tools.base import BaseTool

class XlsxGeneratorTool(BaseTool):
    name = "xlsx_generator"
    description = "Generates formatted Microsoft Excel (.xlsx) equipment asset registers and calculation workbooks."

    def __init__(self, output_dir: str = "data/outputs/xlsx"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    async def _run(
        self,
        sheet_title: str,
        headers: List[str],
        rows: List[List[Any]],
        output_filename: Optional[str] = None
    ) -> Dict[str, Any]:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_title[:30] # Excel max sheet name length

        # 1. Organization Header Row
        ws.merge_cells("A1:E1")
        title_cell = ws["A1"]
        title_cell.value = "MRPL REFINERY ASSET REGISTER & P&ID EXTRACTION"
        title_cell.font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
        title_cell.fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        title_cell.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[1].height = 30

        # 2. Table Column Headers (Row 3)
        header_fill = PatternFill(start_color="047857", end_color="047857", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        
        for col_idx, header in enumerate(headers, 1):
            cell = ws.cell(row=3, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
        ws.row_dimensions[3].height = 24

        # 3. Populate Data Rows
        thin_border = Border(
            left=Side(style='thin', color='CBD5E1'),
            right=Side(style='thin', color='CBD5E1'),
            top=Side(style='thin', color='CBD5E1'),
            bottom=Side(style='thin', color='CBD5E1')
        )

        for r_idx, row_data in enumerate(rows, 4):
            for c_idx, val in enumerate(row_data, 1):
                cell = ws.cell(row=r_idx, column=c_idx, value=val)
                cell.border = thin_border
                cell.alignment = Alignment(vertical="center")
                
                # Check for maintenance flags
                val_str = str(val).upper()
                if "CRITICAL" in val_str or "OVERHAUL" in val_str:
                    cell.fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
                    cell.font = Font(bold=True, color="B91C1C")
                elif "INSPECT" in val_str or "WARNING" in val_str:
                    cell.fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
                    cell.font = Font(bold=True, color="B45309")
                elif "NORMAL" in val_str or "OPERATIONAL" in val_str:
                    cell.fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
                    cell.font = Font(color="15803D")

        # 4. Auto-Fit Column Widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

        filename = output_filename or f"asset_register_{uuid.uuid4().hex[:6]}.xlsx"
        if not filename.endswith(".xlsx"):
            filename += ".xlsx"
        file_path = os.path.abspath(os.path.join(self.output_dir, filename))
        wb.save(file_path)

        return {
            "status": "SUCCESS",
            "filename": filename,
            "file_path": file_path,
            "total_rows": len(rows),
            "download_url": f"/api/files/download/{filename}"
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Sheet title, header array `List[str]`, row data `List[List[Any]]`.
- **Output:** Valid `.xlsx` workbook saved to disk and download URL.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 19](file:///G:/SIH/p/docs/plans/19_tool_calling_interface.md).
- Depended on by: [Plan 27](file:///G:/SIH/p/docs/plans/27_pid_drawing_analysis.md), [Plan 49](file:///G:/SIH/p/docs/plans/49_demo_scenarios_e2e.md).

## 6. Edge Cases & Failure Modes
- **Numeric vs String Values:** Auto-detect integer and float values so Excel formats them as numbers rather than text strings.

## 7. Acceptance Criteria & Verification
- Generates valid `.xlsx` containing styling, borders, and maintenance color highlights.
- Workbook opens cleanly in Excel, LibreOffice Calc, and Google Sheets without repair warnings.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Conditional row highlighting in Excel provides immediate visual clarity for engineering maintenance teams reviewing P&ID extractions.
