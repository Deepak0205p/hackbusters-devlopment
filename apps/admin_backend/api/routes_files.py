import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from apps.admin_backend.generators.deliverables import OUTPUT_DIR, deliverable_generator

router = APIRouter(prefix="/api/files", tags=["Deliverable Registry & File Streaming"])

MIME_MAP = {
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "py": "text/x-python",
    "pdf": "application/pdf"
}

@router.get("/download/{filename}")
async def download_file(filename: str):
    """
    Secure file streaming endpoint for generated deliverables.
    Enforces strict path-traversal sanitization against the data/outputs/ tree.
    """
    # 1. Sanitize filename (strip directory parts)
    safe_filename = os.path.basename(filename)

    # 2. Search for the file in the subdirectories of data/outputs/
    target_file = None
    allowed_base = os.path.abspath(OUTPUT_DIR)

    # Check directly and in known subfolders
    candidate_paths = [
        os.path.join(allowed_base, safe_filename),
        os.path.join(allowed_base, "docx", safe_filename),
        os.path.join(allowed_base, "xlsx", safe_filename),
        os.path.join(allowed_base, "pptx", safe_filename),
        os.path.join(allowed_base, "scripts", safe_filename),
    ]

    for p in candidate_paths:
        abs_p = os.path.abspath(p)
        # Security Guard: Path Traversal Check
        if not abs_p.startswith(allowed_base):
            raise HTTPException(status_code=403, detail="Access denied: Path traversal detected.")
        if os.path.exists(abs_p) and os.path.isfile(abs_p):
            target_file = abs_p
            break

    if not target_file:
        # If file is a known demo deliverable that hasn't been generated to disk yet, generate on-demand
        if safe_filename.endswith(".docx"):
            target_file = deliverable_generator.generate_approval_note_docx(safe_filename)
        elif safe_filename == "P101A_Hydraulic_Calculation_Register.xlsx":
            target_file = deliverable_generator.generate_hydraulic_register_xlsx(safe_filename)
        elif safe_filename == "MRPL_P101_Asset_Register.xlsx":
            target_file = deliverable_generator.generate_asset_register_xlsx(safe_filename)
        elif safe_filename.endswith(".pptx"):
            target_file = deliverable_generator.generate_turnaround_briefing_pptx(safe_filename)
        elif safe_filename == "pump_efficiency.py":
            script_path = os.path.join(allowed_base, "scripts", safe_filename)
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(
                    "# MRPL Centrifugal Pump Hydraulic Calculation Script\n"
                    "# Verified API 610 compliant execution\n"
                    "def calculate_efficiency(flow_m3_h, head_m, density_kg_m3, power_in_kw):\n"
                    "    g = 9.81\n"
                    "    q_si = flow_m3_h / 3600.0\n"
                    "    p_hyd_kw = (density_kg_m3 * g * q_si * head_m) / 1000.0\n"
                    "    eff_pct = (p_hyd_kw / power_in_kw) * 100.0\n"
                    "    return {'hydraulic_power_kw': p_hyd_kw, 'efficiency_pct': eff_pct}\n\n"
                    "if __name__ == '__main__':\n"
                    "    res = calculate_efficiency(450, 125, 850, 160)\n"
                    "    print('Calculation result:', res)\n"
                )
            target_file = script_path
        else:
            raise HTTPException(status_code=404, detail=f"Deliverable '{safe_filename}' not found.")

    ext = safe_filename.split(".")[-1].lower() if "." in safe_filename else "bin"
    media_type = MIME_MAP.get(ext, "application/octet-stream")

    return FileResponse(
        path=target_file,
        media_type=media_type,
        filename=safe_filename,
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'}
    )
