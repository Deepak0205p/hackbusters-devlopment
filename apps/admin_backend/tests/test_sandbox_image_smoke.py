"""
MRPL Sovereign AI Workbench — Sandbox Image Smoke Tests (pytest)
================================================================
Validates that mrpl-sandbox-runtime:latest is present, executes
calculations correctly, and enforces strict network isolation.

Run:
    pytest apps/admin_backend/tests/test_sandbox_image_smoke.py -v
"""

import subprocess
import pytest

IMAGE_TAG = "mrpl-sandbox-runtime:latest"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _docker_available() -> bool:
    """Quick probe: is Docker daemon reachable?"""
    try:
        res = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return res.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _image_exists() -> bool:
    """Check if the sandbox image exists on the local Docker daemon."""
    try:
        res = subprocess.run(
            ["docker", "images", "-q", IMAGE_TAG],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return bool(res.stdout.strip())
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _run_in_sandbox(script: str) -> subprocess.CompletedProcess:
    """Execute a Python script inside the sandbox container with strict isolation."""
    return subprocess.run(
        [
            "docker", "run", "--rm",
            "--network", "none",
            "--read-only",
            "--memory", "512m",
            "--cpus", "1.0",
            "--user", "10001:10001",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            IMAGE_TAG,
            "python", "-I", "-c", script,
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

pytestmark = [
    pytest.mark.skipif(not _docker_available(), reason="Docker daemon not available"),
    pytest.mark.skipif(not _image_exists(), reason=f"Image {IMAGE_TAG} not found — run scripts/build_sandbox_image.py first"),
]


class TestSandboxImagePresence:
    """Verify the hardened sandbox image is present on the Docker daemon."""

    def test_image_exists(self):
        assert _image_exists(), f"Image {IMAGE_TAG} must be present"

    def test_status_reports_image_present(self):
        from apps.admin_backend.sandbox.manager import sandbox_manager
        status = sandbox_manager.get_status()
        assert status["docker_available"] is True
        assert status["image_present"] is True
        assert status["image_name"] == IMAGE_TAG
        assert status["isolation_mode"] == "CONTAINER_ROOTLESS_AIRGAP"


class TestSandboxCalculation:
    """Verify numpy/scipy calculation runs correctly inside the container."""

    def test_pump_hydraulic_efficiency(self):
        script = (
            "import numpy as np\n"
            "from scipy.constants import g\n"
            "Q, H, rho, P_in = 150.0 / 3600.0, 45.0, 850.0, 15000.0\n"
            "P_hyd = rho * g * Q * H\n"
            "eta = (P_hyd / P_in) * 100.0\n"
            "print(f'CALC_SUCCESS: {eta:.2f}%')\n"
        )
        res = _run_in_sandbox(script)
        assert res.returncode == 0, f"Exit code != 0: {res.stderr}"
        assert "CALC_SUCCESS" in res.stdout, f"Expected CALC_SUCCESS in: {res.stdout}"

    def test_sympy_symbolic_math(self):
        script = (
            "from sympy import symbols, solve\n"
            "x = symbols('x')\n"
            "result = solve(x**2 - 4, x)\n"
            "print(f'SYMPY_OK: {sorted(result)}')\n"
        )
        res = _run_in_sandbox(script)
        assert res.returncode == 0
        assert "SYMPY_OK" in res.stdout

    def test_pandas_dataframe(self):
        script = (
            "import pandas as pd\n"
            "df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})\n"
            "print(f'PANDAS_OK: {df.shape}')\n"
        )
        res = _run_in_sandbox(script)
        assert res.returncode == 0
        assert "PANDAS_OK" in res.stdout


class TestSandboxNetworkIsolation:
    """Verify the container enforces strict --network none (air-gap)."""

    def test_network_blocked_localhost(self):
        script = (
            "import socket\n"
            "try:\n"
            "    socket.create_connection(('127.0.0.1', 80), timeout=2)\n"
            "    print('NETWORK_LEAK')\n"
            "except Exception as e:\n"
            "    print(f'NETWORK_BLOCKED: {type(e).__name__}')\n"
        )
        res = _run_in_sandbox(script)
        assert "NETWORK_BLOCKED" in res.stdout, f"Air-gap violated: {res.stdout}"

    def test_network_blocked_dns(self):
        script = (
            "import socket\n"
            "try:\n"
            "    socket.create_connection(('8.8.8.8', 53), timeout=2)\n"
            "    print('NETWORK_LEAK')\n"
            "except Exception as e:\n"
            "    print(f'NETWORK_BLOCKED: {type(e).__name__}')\n"
        )
        res = _run_in_sandbox(script)
        assert "NETWORK_BLOCKED" in res.stdout, f"Air-gap violated: {res.stdout}"

    def test_urllib_blocked(self):
        script = (
            "import urllib.request\n"
            "try:\n"
            "    urllib.request.urlopen('http://example.com', timeout=3)\n"
            "    print('NETWORK_LEAK')\n"
            "except Exception as e:\n"
            "    print(f'NETWORK_BLOCKED: {type(e).__name__}')\n"
        )
        res = _run_in_sandbox(script)
        assert "NETWORK_BLOCKED" in res.stdout, f"Air-gap violated: {res.stdout}"


class TestSandboxSecurityHardening:
    """Verify container security properties."""

    def test_read_only_rootfs(self):
        """Container should fail when writing outside /workspace/tmp."""
        script = (
            "try:\n"
            "    with open('/etc/passwd', 'a') as f:\n"
            "        f.write('test')\n"
            "    print('WRITE_SUCCESS')\n"
            "except Exception as e:\n"
            "    print(f'WRITE_BLOCKED: {type(e).__name__}')\n"
        )
        res = _run_in_sandbox(script)
        assert "WRITE_BLOCKED" in res.stdout or res.returncode != 0

    def test_no_executable_curl(self):
        """curl should not exist in the hardened image."""
        res = _run_in_sandbox("import shutil; print('CURL' if shutil.which('curl') else 'NO_CURL')")
        assert "NO_CURL" in res.stdout

    def test_no_executable_wget(self):
        """wget should not exist in the hardened image."""
        res = _run_in_sandbox("import shutil; print('WGET' if shutil.which('wget') else 'NO_WGET')")
        assert "NO_WGET" in res.stdout

    def test_non_root_user(self):
        """Process should run as UID 10001, not root."""
        script = (
            "import os\n"
            "print(f'UID={os.getuid()}, GID={os.getgid()}')\n"
        )
        res = _run_in_sandbox(script)
        assert "UID=10001" in res.stdout
        assert "GID=10001" in res.stdout
