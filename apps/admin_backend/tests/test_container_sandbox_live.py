import pytest
import time
from fastapi.testclient import TestClient

from apps.admin_backend.main import app
from apps.admin_backend.sandbox.manager import sandbox_manager
from apps.admin_backend.sandbox.ast_screener import ast_screener
from apps.admin_backend.sovereignty.tamper_log import audit_log

client = TestClient(app)

# ==============================================================================
# TEST SUITE: HARDENED CONTAINER & AST SANDBOX (SIH PS 26117)
# ==============================================================================

def test_safe_engineering_math_calculation():
    """
    Verifies that real engineering algorithms (API-570 Remaining Life and Darcy-Weisbach friction)
    execute safely inside the sandbox with correct numeric standard output.
    """
    script = """
import math

# 1. API-570 Piping Remaining Life Calculation
t_actual_mm = 8.45      # Measured ultrasonic wall thickness (mm)
t_min_mm = 4.20         # Minimum design structural thickness (mm)
corrosion_rate_mm_yr = 0.28  # Annual measured metal loss rate (mm/year)

remaining_life_years = (t_actual_mm - t_min_mm) / corrosion_rate_mm_yr

# 2. Darcy-Weisbach Hydraulic Pipe Head Loss: h_f = f * (L/D) * (v^2 / 2g)
f = 0.018               # Darcy friction factor
L_m = 250.0             # Pipe length (meters)
D_m = 0.3048            # 12-inch pipe inner diameter (meters)
v_ms = 2.45             # Flow velocity (m/s)
g = 9.81

head_loss_m = f * (L_m / D_m) * (v_ms**2 / (2 * g))

print(f"API_570_REMAINING_LIFE_YEARS: {remaining_life_years:.2f}")
print(f"DARCY_WEISBACH_HEAD_LOSS_METERS: {head_loss_m:.3f}")
"""

    result = sandbox_manager.execute_script(script)
    assert result.success is True
    assert result.exit_code == 0
    assert result.security_verdict == "PERMITTED"
    assert "API_570_REMAINING_LIFE_YEARS: 15.18" in result.stdout
    assert "DARCY_WEISBACH_HEAD_LOSS_METERS: 4.517" in result.stdout
    assert result.duration_ms > 0
    assert len(result.sha256_hash) == 64

def test_ast_blocks_network_socket_import():
    """
    CRITICAL SECURITY TEST:
    Verifies that any script attempting to import network, socket, or HTTP modules
    is stopped dead by the AST screener BEFORE execution.
    """
    malicious_scripts = [
        "import socket\ns = socket.socket()\ns.connect(('8.8.8.8', 53))",
        "import requests\nr = requests.get('http://google.com')",
        "from urllib.request import urlopen\nurlopen('http://evil.com')",
        "import http.client\nconn = http.client.HTTPConnection('127.0.0.1')"
    ]

    for script in malicious_scripts:
        screen_res = ast_screener.screen(script)
        assert screen_res.is_safe is False
        assert len(screen_res.violations) >= 1

        exec_res = sandbox_manager.execute_script(script)
        assert exec_res.success is False
        assert exec_res.security_verdict == "BLOCKED"
        assert "ASTSecurityException" in exec_res.stderr

def test_ast_blocks_obfuscated_dunder_and_getattr():
    """
    CRITICAL SECURITY TEST:
    Verifies that sandbox escape tricks (dunder attribute traversal and getattr/eval obfuscation)
    are caught and blocked by AST screener.
    """
    obfuscated_payloads = [
        "getattr(__builtins__, '__import__')('os').system('dir')",
        "().__class__.__bases__[0].__subclasses__()",
        "eval('__import__(\"os\").system(\"id\")')",
        "exec('import socket; s = socket.socket()')",
        "import subprocess\nsubprocess.Popen(['notepad.exe'])"
    ]

    for payload in obfuscated_payloads:
        screen_res = ast_screener.screen(payload)
        assert screen_res.is_safe is False

        exec_res = sandbox_manager.execute_script(payload)
        assert exec_res.success is False
        assert exec_res.security_verdict == "BLOCKED"
        assert exec_res.exit_code == 1

def test_sandbox_timeout_circuit_breaker():
    """
    Verifies that infinite loops or CPU exhaustion attacks are killed by the timeout breaker.
    """
    infinite_loop = """
# Infinite loop resource bomb test
x = 0
while True:
    x += 1
"""

    res = sandbox_manager.execute_script(infinite_loop, timeout_seconds=1.5)
    assert res.success is False
    assert res.exit_code == -9
    assert res.security_verdict == "TIMEOUT_KILLED"
    assert "TimeoutExpired" in res.stderr

def test_sandbox_tamper_audit_logging():
    """
    Verifies that all script executions, AST blocks, and timeouts are cryptographically
    sealed into the SHA-256 Merkle chain.
    """
    event_types = [e.event_type for e in audit_log.entries[-20:]]
    assert "AST_SECURITY_BLOCKED" in event_types
    assert "SANDBOX_EXECUTION_SUCCESS" in event_types

    # Verify cryptographic integrity of the audit chain
    verification = audit_log.verify_chain_integrity()
    assert verification["valid"] is True
    assert verification["verdict"] == "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"

def test_sandbox_fastapi_endpoints():
    """
    Verifies FastAPI REST endpoints:
    - POST /api/sandbox/execute
    - POST /api/sandbox/screen
    - GET /api/sandbox/status
    """
    # 1. Test Execute Endpoint
    valid_code = "print('Calculated Pressure: ' + str(101.325 * 1.5) + ' kPa')"
    res = client.post("/api/sandbox/execute", json={"code": valid_code, "timeout_seconds": 5.0})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Calculated Pressure: 151.9875 kPa" in data["stdout"]
    assert data["security_verdict"] == "PERMITTED"

    # 2. Test Dry-Run AST Screen Endpoint
    res_screen = client.post("/api/sandbox/screen", json={"code": "import socket\nimport math"})
    assert res_screen.status_code == 200
    screen_data = res_screen.json()
    assert screen_data["is_safe"] is False
    assert len(screen_data["violations"]) >= 1

    # 3. Test Sandbox Status Endpoint
    res_status = client.get("/api/sandbox/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["status"] == "ONLINE"
    assert status_data["network_isolation"] == "STRICT_NONE"
    assert status_data["air_gap_compliant"] is True
