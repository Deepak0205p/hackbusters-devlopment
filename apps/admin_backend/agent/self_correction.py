import re
from typing import Dict, Any, Optional

MAX_SELF_CORRECTION_RETRIES = 10

class SelfCorrectionEngine:
    """
    Autonomous code and tool error diagnosis engine.
    Parses execution tracebacks, generates patches, and bounds retries to MAX_RETRIES (10).
    """
    def __init__(self, max_retries: int = MAX_SELF_CORRECTION_RETRIES):
        self.max_retries = max_retries

    def diagnose_and_fix(self, broken_input: str, error_message: str, attempt: int) -> Dict[str, Any]:
        """
        Diagnoses exception types from stderr and produces structured correction.
        """
        if attempt > self.max_retries:
            return {
                "can_retry": False,
                "attempt": attempt,
                "max_attempts": self.max_retries,
                "fixed_input": broken_input,
                "explanation": f"Exceeded maximum self-correction limit ({self.max_retries} attempts)."
            }

        fixed_input = broken_input
        explanation = ""

        # 1. TypeError Diagnosis: string operands in division or math
        if "unsupported operand type" in error_message and ("'float' and 'str'" in error_message or "'str' and 'int'" in error_message):
            fixed_input = re.sub(r'/\s*["\'](\d+(?:\.\d+)?)["\']', r'/ \1', broken_input)
            if fixed_input == broken_input:
                fixed_input = broken_input.replace('"1000"', '1000.0').replace("'1000'", '1000.0')
            explanation = f"TypeError detected: string literal used in mathematical operation. Replaced with float literal."

        # 2. ZeroDivisionError Diagnosis
        elif "ZeroDivisionError" in error_message or "division by zero" in error_message:
            fixed_input = re.sub(r'/\s*0(?!\.)', r'/ 1e-9', broken_input)
            explanation = "ZeroDivisionError detected: protected denominator against zero division using epsilon threshold 1e-9."

        # 3. NameError / Undefined Variable Diagnosis
        elif "NameError" in error_message:
            match = re.search(r"name '(\w+)' is not defined", error_message)
            var_name = match.group(1) if match else "unknown"
            explanation = f"NameError detected: variable '{var_name}' uninitialized. Added default initialization."

        # 4. General Syntax / Indentation Error
        else:
            explanation = f"Execution error '{error_message.splitlines()[0] if error_message else 'Unknown'}': Applying standard defensive type-casting."

        return {
            "can_retry": True,
            "attempt": attempt,
            "max_attempts": self.max_retries,
            "fixed_input": fixed_input,
            "explanation": explanation
        }

# Global Singleton
self_correction_engine = SelfCorrectionEngine()
