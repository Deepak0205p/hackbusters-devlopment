import re
import math
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

# ==============================================================================
# 1. ISA-5.1 INSTRUMENT IDENTIFICATION STANDARD
# ==============================================================================
ISA_FIRST_LETTERS: Dict[str, str] = {
    "A": "Analysis / Chemical Composition",
    "B": "Burner / Flame",
    "C": "Conductivity",
    "D": "Density / Specific Gravity",
    "E": "Voltage / Potential",
    "F": "Flow Rate",
    "G": "Gauging / Position / Dimension",
    "H": "Hand / Manual Operator",
    "I": "Current (Electric)",
    "J": "Power",
    "K": "Time / Schedule",
    "L": "Level",
    "M": "Moisture / Humidity",
    "P": "Pressure / Vacuum",
    "Q": "Quantity / Totalizer",
    "R": "Radiation",
    "S": "Speed / Frequency",
    "T": "Temperature",
    "U": "Multivariable",
    "V": "Vibration / Mechanical Analysis",
    "W": "Weight / Force",
    "X": "Unclassified",
    "Y": "Event / State",
    "Z": "Position / Dimension"
}

ISA_SUCCEEDING_LETTERS: Dict[str, str] = {
    "A": "Alarm",
    "C": "Controller",
    "D": "Differential",
    "E": "Element / Primary Sensor",
    "G": "Glass / Gauge",
    "H": "High",
    "I": "Indicator",
    "K": "Control Station",
    "L": "Low",
    "O": "Orifice",
    "P": "Point (Test)",
    "R": "Recorder",
    "S": "Switch",
    "T": "Transmitter",
    "V": "Valve / Damper",
    "Y": "Relay / Compute Unit",
    "Z": "Emergency / Safety Final Element"
}

COMMON_INSTRUMENT_TAGS: Dict[str, str] = {
    "PT": "Pressure Transmitter",
    "PI": "Pressure Indicator",
    "PIC": "Pressure Indicator Controller",
    "PSV": "Pressure Safety Relief Valve",
    "TT": "Temperature Transmitter",
    "TI": "Temperature Indicator",
    "TIC": "Temperature Indicator Controller",
    "FT": "Flow Transmitter",
    "FI": "Flow Indicator",
    "FIC": "Flow Indicator Controller",
    "FE": "Flow Orifice Element",
    "LT": "Level Transmitter",
    "LI": "Level Indicator",
    "LIC": "Level Indicator Controller",
    "LG": "Level Gauge Glass",
    "AT": "Gas / Composition Analyzer",
    "ZT": "Valve Position Transmitter",
    "ZSC": "Valve Closed Limit Switch",
    "ZSO": "Valve Open Limit Switch",
    "FV": "Flow Control Valve",
    "PV": "Pressure Control Valve",
    "LV": "Level Control Valve",
    "TV": "Temperature Control Valve",
    "FCV": "Flow Control Valve",
    "PCV": "Pressure Control Valve",
    "LCV": "Level Control Valve",
    "TCV": "Temperature Control Valve",
    "ESDV": "Emergency Shutdown Valve",
    "MOV": "Motor Operated Valve",
    "XV": "Process Interlock Shutdown Valve",
    "SDV": "Shutdown Valve",
    "BDV": "Blowdown Valve",
    "CV": "Check Valve / Control Valve",
    "V": "Isolation Valve"
}

# ==============================================================================
# 2. ISO 10628 / DIN 28004 MAJOR REFINERY EQUIPMENT TAXONOMY
# ==============================================================================
EQUIPMENT_PREFIXES: Dict[str, Dict[str, str]] = {
    "P": {"category": "PUMP", "name": "Centrifugal / Positive Displacement Pump"},
    "K": {"category": "COMPRESSOR", "name": "Gas / Hydrogen Compressor"},
    "C": {"category": "COLUMN", "name": "Distillation / Fractionation Column"},
    "V": {"category": "VESSEL", "name": "Pressure Vessel / Separator Drum"},
    "E": {"category": "EXCHANGER", "name": "Shell & Tube / Plate Heat Exchanger"},
    "TK": {"category": "TANK", "name": "Atmospheric Crude / Product Storage Tank"},
    "F": {"category": "FURNACE", "name": "Crude / Vacuum Charge Furnace"},
    "R": {"category": "REACTOR", "name": "Hydrocracker / Catalytic Reforming Reactor"},
    "S": {"category": "STRAINER", "name": "Suction Strainer / Cartridge Filter"},
    "M": {"category": "AGITATOR", "name": "Mixer / Motor Agitator"},
    "FL": {"category": "FLARE", "name": "Elevated Acid / HC Flare Stack"}
}

VALVE_TYPES: Dict[str, str] = {
    "GATE": "Gate Valve (Isolation)",
    "GLOBE": "Globe Valve (Throttling)",
    "BALL": "Ball Valve (Quarter-Turn Isolation)",
    "BUTTERFLY": "Butterfly Valve",
    "CHECK": "Non-Return Check Valve (NRV)",
    "NEEDLE": "Needle Valve (Fine Metering)",
    "PLUG": "Plug Valve",
    "CONTROL": "Diaphragm Pneumatic Control Valve",
    "SAFETY": "Pressure Safety / Relief Valve (PSV)",
    "ESDV": "Emergency Shutdown Isolation Valve (Fail-Safe)"
}

# ==============================================================================
# 3. REGEX PATTERNS FOR P&ID LABELS & PIPELINE SPEC CODES
# ==============================================================================
# Matches: 6"-HC-1002-CS-150#, 10"-P-401-SS316, 4"-CW-201, 8"-FG-105-CS
LINE_SPEC_REGEX = re.compile(
    r'(?:(\d+(?:\.\d+)?)"?\s*[-/]?\s*)?'       # Size (e.g. 6", 10", 4)
    r'([A-Z]{1,4})\s*[-/]\s*'                   # Fluid Code (e.g. HC, P, CW, FG, H2, STEAM)
    r'([0-9]{3,5}[A-Z]?)\s*'                    # Line Number (e.g. 1002, 401A)
    r'(?:[-/]\s*([A-Z0-9]+))?'                  # Material Spec (e.g. CS, SS316, A106)
    r'(?:[-/]\s*(\d{3}#|\d+LB))?',              # Flange Rating (e.g. 150#, 300LB)
    re.IGNORECASE
)

# Matches Equipment Tags: P-101A, K-201, C-101, E-102A/B, TK-201, F-101, R-301
EQUIPMENT_TAG_REGEX = re.compile(
    r'\b(TK|FL|[PKCVEFRSM])[-_ ]?([0-9]{3,4}[A-Z]?(?:/[A-Z])?)\b',
    re.IGNORECASE
)

# Matches Instrument & Valve Tags: PT-1001, FV-1002, PSV-201, ESDV-401, TT-102A
INSTRUMENT_TAG_REGEX = re.compile(
    r'\b(ESDV|PSV|MOV|BDV|SDV|PIC|TIC|FIC|LIC|PCV|TCV|FCV|LCV|FV|PV|LV|TV|PT|TT|FT|LT|PI|TI|FI|LI|AT|ZT|XV|CV|V)[-_ ]?([0-9]{3,5}[A-Z]?)\b',
    re.IGNORECASE
)

# ==============================================================================
# 4. HELPER UTILITIES
# ==============================================================================
def parse_line_specification(text: str) -> Optional[Dict[str, Any]]:
    """Parses industrial piping string into structured engineering attributes."""
    match = LINE_SPEC_REGEX.search(text.strip())
    if not match:
        return None

    size, fluid, number, material, rating = match.groups()
    return {
        "raw_tag": match.group(0),
        "pipe_size": f"{size} inch" if size else "Unknown Size",
        "fluid_service": (fluid or "").upper(),
        "line_number": number,
        "material_class": (material or "Carbon Steel (CS)").upper(),
        "flange_rating": rating or "150# ANSI"
    }

def classify_tag(tag_str: str) -> Dict[str, Any]:
    """Classifies an OCR detected string into Equipment, Valve, Instrument, or Pipe Spec."""
    clean = tag_str.strip().upper()

    # 1. Check Instrument/Valve Tag
    inst_m = INSTRUMENT_TAG_REGEX.match(clean)
    if inst_m:
        prefix, num = inst_m.groups()
        name = COMMON_INSTRUMENT_TAGS.get(prefix, f"{prefix} Instrument/Valve")
        category = "VALVE" if prefix in [
            "ESDV", "PSV", "MOV", "BDV", "SDV", "PCV", "TCV", "FCV", "LCV",
            "FV", "PV", "LV", "TV", "XV", "CV", "V"
        ] else "INSTRUMENT"
        return {
            "is_recognized": True,
            "category": category,
            "tag": f"{prefix}-{num}",
            "prefix": prefix,
            "number": num,
            "description": name
        }

    # 2. Check Major Equipment Tag
    eq_m = EQUIPMENT_TAG_REGEX.match(clean)
    if eq_m:
        prefix, num = eq_m.groups()
        meta = EQUIPMENT_PREFIXES.get(prefix, {"category": "EQUIPMENT", "name": f"{prefix} Equipment"})
        return {
            "is_recognized": True,
            "category": meta["category"],
            "tag": f"{prefix}-{num}",
            "prefix": prefix,
            "number": num,
            "description": meta["name"]
        }

    # 3. Check Pipeline Spec
    line_dict = parse_line_specification(clean)
    if line_dict:
        return {
            "is_recognized": True,
            "category": "PIPE_LINE",
            "tag": line_dict["raw_tag"],
            "specs": line_dict,
            "description": f"Process Line ({line_dict['pipe_size']} {line_dict['fluid_service']})"
        }

    return {"is_recognized": False, "category": "UNKNOWN", "tag": tag_str}

def euclidean_distance(pt1: Tuple[float, float], pt2: Tuple[float, float]) -> float:
    return math.sqrt((pt1[0] - pt2[0])**2 + (pt1[1] - pt2[1])**2)

def calculate_bbox_center(bbox: List[int]) -> Tuple[int, int]:
    """Calculates integer (cx, cy) from [x1, y1, x2, y2]."""
    x1, y1, x2, y2 = bbox
    return (int((x1 + x2) / 2), int((y1 + y2) / 2))
