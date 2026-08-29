import json
from apps.admin_backend.sandbox.manager import sandbox_manager
from apps.admin_backend.sandbox.ast_screener import ast_screener
from apps.admin_backend.agent.self_correction import self_correction_engine
from apps.admin_backend.sovereignty.tamper_log import audit_log

def test_docker_sandbox_live():
    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - DOCKER SANDBOX & ISOLATION LIVE TEST")
    print("=" * 70)

    # 1. Test Case 1: Valid Mathematical Script (Success Execution)
    print("\n--- [1] TEST CASE 1: VALID SCRIPT EXECUTION (API 610 MATH) ---")
    valid_script = (
        "flow_m3_h = 450.0\n"
        "head_m = 125.0\n"
        "density = 850.0\n"
        "power_in_kw = 160.0\n"
        "g = 9.81\n"
        "q_si = flow_m3_h / 3600.0\n"
        "p_hyd_kw = (density * g * q_si * head_m) / 1000.0\n"
        "eff = (p_hyd_kw / power_in_kw) * 100.0\n"
        "print(f'P_HYD:{p_hyd_kw:.2f},EFF:{eff:.2f}')\n"
    )
    res_1 = sandbox_manager.execute_script(valid_script)
    print(f"Execution Result 1: Success={res_1.success}, ExitCode={res_1.exit_code}, Duration={res_1.duration_ms}ms")
    print(f"  • Engine: {res_1.execution_engine} (Network: {res_1.network_mode})")
    print(f"  • Stdout: {res_1.stdout.strip()}")
    assert res_1.success is True
    assert "P_HYD:" in res_1.stdout.strip() and "EFF:" in res_1.stdout.strip()

    # 2. Test Case 2: Broken Script -> Traceback Capture -> Self-Correction Loop
    print("\n--- [2] TEST CASE 2: REAL TYPEERROR TRACEBACK & SELF-CORRECTION ---")
    broken_script = (
        "flow_m3_h = 450.0\n"
        "head_m = 125.0\n"
        "density = 850.0\n"
        "g = 9.81\n"
        "q_si = flow_m3_h / 3600.0\n"
        "# Deliberate string division to trigger real Python TypeError exception\n"
        'p_hyd_kw = (density * g * q_si * head_m) / "1000"\n'
        "print(f'P_HYD:{p_hyd_kw}')\n"
    )
    res_2 = sandbox_manager.execute_script(broken_script)
    print(f"Broken Execution: Success={res_2.success}, ExitCode={res_2.exit_code}")
    print(f"  • Captured Stderr:\n{res_2.stderr.strip()}")
    assert res_2.success is False
    assert "TypeError" in res_2.stderr

    # Feed into self-correction engine
    diag = self_correction_engine.diagnose_and_fix(broken_script, res_2.stderr, attempt=1)
    print(f"  • Self-Correction Attempt 1/10 Diagnosis: {diag['explanation']}")
    fixed_script = diag["fixed_input"]

    # Re-run fixed script in sandbox
    res_2_fixed = sandbox_manager.execute_script(fixed_script)
    print(f"Fixed Execution: Success={res_2_fixed.success}, ExitCode={res_2_fixed.exit_code}")
    print(f"  • Fixed Stdout: {res_2_fixed.stdout.strip()}")
    assert res_2_fixed.success is True
    assert "P_HYD:" in res_2_fixed.stdout.strip()

    # 3. Test Case 3: Malicious Payloads (Network call & System Command Blocked by AST Shield)
    print("\n--- [3] TEST CASE 3: MALICIOUS & NETWORK INJECTION BLOCKING (AST SHIELD) ---")
    malicious_scripts = [
        ("Network Egress Attempt", "import socket\ns = socket.socket()\ns.connect(('8.8.8.8', 53))\n"),
        ("OS System Call Attempt", "import os\nos.system('dir')\n"),
        ("Subprocess Call Attempt", "import subprocess\nsubprocess.run(['cmd.exe'])\n"),
        ("Dunder Globals Escape", "().__class__.__bases__[0].__subclasses__()\n"),
        ("Dynamic eval() Execution", "eval('__import__(\"os\").system(\"whoami\")')\n"),
    ]

    for title, code in malicious_scripts:
        res_mal = sandbox_manager.execute_script(code)
        print(f"  • [{title}]: Security Verdict = {res_mal.security_verdict} (Success={res_mal.success})")
        print(f"     Blocked Reason: {res_mal.stderr.strip()}")
        assert res_mal.success is False
        assert res_mal.security_verdict == "BLOCKED"

    # 4. Sovereignty Audit Log Verification
    print("\n--- [4] SOVEREIGNTY AUDIT LOG RECORDING ---")
    integrity = audit_log.verify_chain_integrity()
    print(f"Total Audit Blocks: {integrity['total_blocks']}")
    print(f"Head Block Hash: {integrity['head_hash']}")
    print(f"Integrity Verdict: {integrity['verdict']} (Valid: {integrity['valid']})")
    assert integrity["valid"] is True

    print("\n" + "=" * 70)
    print("  ALL DOCKER SANDBOX & ISOLATION TESTS PASSED (100% VERIFIED)")
    print("=" * 70)

if __name__ == "__main__":
    test_docker_sandbox_live()
