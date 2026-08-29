import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from PIL import Image, ImageDraw, ImageFont

def generate_realistic_inspection_pdf(filepath: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        alignment=1
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )

    story = []
    
    # 1. Header
    story.append(Paragraph("MANGALORE REFINERY AND PETROCHEMICALS LIMITED (MRPL)", title_style))
    story.append(Paragraph("CRUDE DISTILLATION UNIT (CDU-1) - PERIODIC EQUIPMENT INSPECTION LOG", sub_style))
    story.append(Spacer(1, 14))
    
    # 2. Metadata Box
    meta_data = [
        [Paragraph("<b>Equipment ID:</b> Furnace F-101", body_style), Paragraph("<b>Inspection Date:</b> 2026-08-24", body_style)],
        [Paragraph("<b>Service:</b> Crude Charge Pre-Heating", body_style), Paragraph("<b>Shift / Lead:</b> Night Shift B / Lead Insp. R. Sharma", body_style)],
        [Paragraph("<b>Operating Standard:</b> SOP-MRPL-FURNACE-01", body_style), Paragraph("<b>Report ID:</b> MRPL-INS-CDU1-2026-0894", body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))
    
    # 3. Thermocouple & Critical Parameter Log Table
    story.append(Paragraph("<b>1. Radiant Tube Skin Thermocouple Telemetry & Integrity Readings</b>", body_style))
    story.append(Spacer(1, 6))
    
    data_table = [
        ["Sensor Tag", "Measurement Location", "Recorded Temp", "Design Limit", "Status / Verdict"],
        ["TT-101", "Radiant Section - Zone A Inlet", "582 °C", "610 °C", "NORMAL (Compliant)"],
        ["TT-102", "Radiant Section - Zone A Midpoint", "594 °C", "610 °C", "NORMAL (Compliant)"],
        ["TT-103", "Radiant Section - Zone B Lower", "604 °C", "610 °C", "ELEVATED (Monitor)"],
        ["TT-104", "Radiant Section - Zone B Upper", "620 °C", "610 °C", "CRITICAL BREACH (>610°C)"],
        ["TT-105", "Convection Bank Inlet", "415 °C", "450 °C", "NORMAL (Compliant)"],
        ["TT-106", "Convection Bank Exit", "385 °C", "410 °C", "NORMAL (Compliant)"]
    ]
    
    t_data = Table(data_table, colWidths=[70, 170, 95, 95, 110])
    t_data.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#fee2e2')), # Highlight breach row in red/pink
        ('TEXTCOLOR', (0,4), (-1,4), colors.HexColor('#991b1b')),
        ('FONTNAME', (0,4), (-1,4), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_data)
    story.append(Spacer(1, 14))
    
    # 4. Ultrasonic Wall Thickness & Firing Inspection
    story.append(Paragraph("<b>2. Metallurgical Wall Thickness & Firing Conditions</b>", body_style))
    story.append(Spacer(1, 6))
    
    para_table = [
        ["Parameter", "Measured Value", "Standard Threshold", "Action Directive"],
        ["Wall Thinning / Corrosion Rate", "0.45 mm/year", "Max 0.25 mm/year", "Exceeds Corrosion Allowance"],
        ["Ultrasonic Residual Thickness", "4.62 mm", "Min 5.00 mm (SOP 4.1.3)", "Retire / Sleeve Required"],
        ["Burner Firing Rate", "104% MCR", "100% Maximum Continuous", "De-rate Burners to 90% MCR"],
        ["Excess O2 Flue Gas Level", "1.8 vol%", "2.5 - 3.0 vol%", "Adjust Draft Damper"]
    ]
    t_para = Table(para_table, colWidths=[150, 110, 140, 140])
    t_para.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_para)
    story.append(Spacer(1, 14))
    
    # 5. Inspector Remarks & Mandatory SOP Clause Notice
    story.append(Paragraph("<b>3. Lead Inspector Engineering Findings & Mandatory Action</b>", body_style))
    story.append(Spacer(1, 4))
    remarks = (
        "<b>FINDING:</b> Radiant coil thermocouple TE-104 has consistently logged skin temperatures at <b>620 °C</b>, "
        "exceeding the design envelope limit of <b>610 °C</b> stipulated in SOP-MRPL-FURNACE-01 Clause 4.1.2. "
        "Ultrasonic measurement indicates severe localized wall loss (residual 4.62 mm vs 5.0 mm allowable minimum).<br/>"
        "<b>DIRECTIVE:</b> In accordance with MRPL Refinery Operating Standard Clause 4.1.2, mandatory load de-rating "
        "to 75% capacity is required immediately, followed by emergency furnace turnaround and decoking within <b>7 days</b>."
    )
    story.append(Paragraph(remarks, body_style))
    story.append(Spacer(1, 18))
    
    # 6. Signature Block
    sig_data = [
        [Paragraph("<b>Inspected By:</b> R. Sharma, Lead NDT Inspector (MRPL)", body_style), Paragraph("<b>Reviewed By:</b> Chief General Manager (Operations)", body_style)],
        [Paragraph("<b>Status:</b> ESCALATED TO CRITICAL AUDIT", body_style), Paragraph("<b>Air-Gap Cryptographic Hash:</b> SEALED", body_style)]
    ]
    t_sig = Table(sig_data, colWidths=[270, 270])
    t_sig.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)

    doc.build(story)
    print(f"Generated realistic PDF: {filepath} ({os.path.getsize(filepath)} bytes)")

def generate_realistic_pid_drawing(filepath: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    # Create 1200x800 industrial CAD blueprint style schematic
    img = Image.new('RGB', (1200, 800), color='#0b1329') # Dark blue CAD background
    draw = ImageDraw.Draw(img)
    
    # Border & Title block
    draw.rectangle([(20, 20), (1180, 780)], outline='#1e3a8a', width=2)
    draw.rectangle([(800, 680), (1175, 775)], fill='#0f172a', outline='#3b82f6', width=2)
    
    # Draw Grid Lines
    for x in range(50, 1150, 50):
        draw.line([(x, 30), (x, 770)], fill='#132347', width=1)
    for y in range(50, 750, 50):
        draw.line([(30, y), (1170, y)], fill='#132347', width=1)
        
    # Title Block Text
    draw.text((810, 690), "MANGALORE REFINERY & PETROCHEMICALS LTD", fill='#93c5fd')
    draw.text((810, 710), "P&ID SCHEMATIC: CRUDE PRE-FLASH & CHARGE PUMPS", fill='#ffffff')
    draw.text((810, 730), "DRAWING NO: DWG-MRPL-CDU-004 | REV: 04", fill='#60a5fa')
    draw.text((810, 750), "STANDARD: ISA 5.1 INSTRUMENTATION IDENTIFICATION", fill='#34d399')

    # Main Crude Process Flow Header Line
    draw.line([(60, 350), (1100, 350)], fill='#38bdf8', width=5) # Crude Header Pipe
    draw.text((80, 330), "CRUDE FEED FROM TANK FARM (12-INCH HEADER)", fill='#38bdf8')

    # Draw 3 Centrifugal Pumps (P-101A, P-101B, P-101C)
    pumps = [
        (250, 480, "P-101A", "Primary Pump (450 m3/h)"),
        (550, 480, "P-101B", "Standby Pump (450 m3/h)"),
        (850, 480, "P-101C", "Booster Pump (150 m3/h)")
    ]
    
    for px, py, ptag, pdesc in pumps:
        # Suction branch from header
        draw.line([(px, 350), (px, py - 40)], fill='#38bdf8', width=3)
        # Pump Circle Symbol
        draw.ellipse([(px - 35, py - 35), (px + 35, py + 35)], outline='#60a5fa', width=3, fill='#1e293b')
        # Tangential Discharge Line
        draw.line([(px + 25, py - 25), (px + 60, py - 60)], fill='#38bdf8', width=3)
        draw.line([(px + 60, py - 60), (px + 60, 250)], fill='#38bdf8', width=3)
        # Tag Bubble
        draw.ellipse([(px - 30, py + 50), (px + 30, py + 90)], outline='#fbbf24', width=2, fill='#0f172a')
        draw.text((px - 22, py + 62), ptag, fill='#fbbf24')
        draw.text((px - 50, py + 95), pdesc, fill='#94a3b8')

    # Draw Discharge Common Line
    draw.line([(310, 250), (950, 250)], fill='#38bdf8', width=4)
    draw.text((320, 230), "PUMP DISCHARGE TO CDU-1 PRE-HEAT TRAIN", fill='#38bdf8')

    # Draw Control Valves (FCV-102, FCV-103)
    valves = [
        (420, 250, "FCV-102", "Feed Control Valve"),
        (720, 250, "FCV-103", "Recycle Control Valve")
    ]
    for vx, vy, vtag, vdesc in valves:
        # Bow-tie valve symbol
        draw.polygon([(vx - 20, vy - 15), (vx + 20, vy + 15), (vx + 20, vy - 15), (vx - 20, vy + 15)], fill='#f87171', outline='#ffffff')
        # Actuator circle on top
        draw.line([(vx, vy), (vx, vy - 30)], fill='#ffffff', width=2)
        draw.ellipse([(vx - 12, vy - 45), (vx + 12, vy - 25)], outline='#f87171', width=2, fill='#1e293b')
        # Tag bubble
        draw.ellipse([(vx - 30, vy - 85), (vx + 30, vy - 50)], outline='#fbbf24', width=2, fill='#0f172a')
        draw.text((vx - 26, vy - 73), vtag, fill='#fbbf24')
        draw.text((vx - 40, vy - 100), vdesc, fill='#94a3b8')

    # Draw Pressure Transmitters (PT-201, PT-202)
    transmitters = [
        (180, 350, "PT-201", "Suction Pressure (0-25 bar)"),
        (980, 250, "PT-202", "Discharge Pressure (0-50 bar)")
    ]
    for tx, ty, ttag, tdesc in transmitters:
        draw.line([(tx, ty), (tx, ty - 50)], fill='#94a3b8', width=2)
        draw.ellipse([(tx - 25, ty - 90), (tx + 25, ty - 50)], outline='#a78bfa', width=2, fill='#0f172a')
        draw.text((tx - 20, ty - 75), ttag, fill='#a78bfa')
        draw.text((tx - 50, ty - 105), tdesc, fill='#94a3b8')

    # Draw Safety Relief Valves (PSV-401, PSV-402)
    psvs = [
        (480, 250, "PSV-401", "Overpressure Relief (18 bar)"),
        (780, 250, "PSV-402", "Thermal Relief (22 bar)")
    ]
    for sx, sy, stag, sdesc in psvs:
        draw.line([(sx, sy), (sx, sy + 40)], fill='#94a3b8', width=2)
        draw.polygon([(sx - 15, sy + 40), (sx + 15, sy + 60), (sx + 15, sy + 40), (sx - 15, sy + 60)], fill='#34d399', outline='#ffffff')
        draw.ellipse([(sx - 28, sy + 70), (sx + 28, sy + 105)], outline='#fbbf24', width=2, fill='#0f172a')
        draw.text((sx - 24, sy + 82), stag, fill='#fbbf24')

    img.save(filepath, 'PNG')
    print(f"Generated realistic P&ID PNG: {filepath} ({os.path.getsize(filepath)} bytes)")

if __name__ == "__main__":
    pdf_path = "G:/SIH/p/data/sample_inputs/inspection_report_furnace.pdf"
    png_path = "G:/SIH/p/data/sample_inputs/engineering_pid_drawing.png"
    generate_realistic_inspection_pdf(pdf_path)
    generate_realistic_pid_drawing(png_path)
