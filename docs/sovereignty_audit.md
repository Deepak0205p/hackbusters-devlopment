# Sovereignty & Air-Gap Audit Architecture
## MRPL Sovereign AI Workbench (SIH26117)

---

## 1. Dual-Scope Network Telemetry Architecture

The Sovereignty Daemon and Network Watchdog operate on a **two-tier diagnostic scoping model**:

```
+-------------------------------------------------------------------------------+
| HOST OPERATING SYSTEM (System-Wide Network Interfaces)                       |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | MRPL WORKBENCH PROCESS TREE (Audited Scope: Zero External Egress)       |  |
|  |  • FastAPI Gateway (PID, Port 8000)                                     |  |
|  |  • Ollama Local Inference Runtime (PID, Port 11434)                     |  |
|  |  • ChromaDB Local Vector Store (Embedded in Process)                    |  |
|  |  • Docker Sandbox Runtime (Network: None / Internal Only)               |  |
|  |  • Python Multimodal Workers & Subprocesses                             |  |
|  |                                                                         |  |
|  |  --> OUTBOUND WAN PACKETS: 0 (Strictly Blocked & Verified)              |  |
|  |  --> ALLOWED CONNECTIONS: LOCALHOST (127.0.0.1) & RFC 1918 (LAN/Hotspot)|  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  • Non-Workbench OS Background Services (e.g. Windows Update, Host Browser)   |
|    Audited and displayed in system table with explicit "Non-workbench" tag.   |
+-------------------------------------------------------------------------------+
```

### 1.1. Workbench Scope (Statutory Compliance Guarantee)
- **Target:** The complete application process tree (`FastAPI`, `Ollama`, `ChromaDB`, `Docker`, worker processes).
- **Invariant:** **Zero external internet connections (`external_internet_connections == 0`) and zero WAN packets transmitted (`external_packets == 0`).**
- **Verdict:** If any workbench PID initiates a socket connection to a non-private IP, the watchdog triggers `AIR-GAP BREACH DETECTED`, records a breach block in the tamper-evident log, and broadcasts an alert over `WS /api/audit-stream`.

### 1.2. System Scope (Host Machine Transparency)
- **Target:** All `AF_INET` / `AF_INET6` sockets on the host OS.
- **Purpose:** Full transparency for competition evaluators. Proves that listening ports are bound safely to `0.0.0.0:8000` and `127.0.0.1:11434`, and that connected evaluator devices belong exclusively to private RFC 1918 subnets (`192.168.*`, `10.*`, `172.16-31.*`).

---

## 2. 3-Tier Address Classification Matrix

| Tier | IP Range / Criteria | Security Verdict | Handling Policy |
| :--- | :--- | :--- | :--- |
| **`LOCALHOST`** | `127.0.0.1`, `::1`, `0.0.0.0`, `::` | `PERMITTED` | Inter-process communication (FastAPI $\leftrightarrow$ Ollama $\leftrightarrow$ Frontend $\leftrightarrow$ ChromaDB $\leftrightarrow$ Docker Daemon). |
| **`LAN_HOTSPOT`** | RFC 1918 Private: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` | `PERMITTED` | Evaluator mobile/laptop connectivity via Venue Wi-Fi (Option A) or Host Hotspot (Option B). |
| **`EXTERNAL_WAN`** | All public routable IP addresses | `BREACH_FLAGGED` (if Workbench) | Forbidden for workbench processes. Proves 100% sovereign operation. |


---

## 3. Cryptographic Tamper-Evident Hash Chaining

Every audit event is cryptographically sealed using SHA-256 hash chaining:
$$\text{Block Hash}_N = \text{SHA-256}\left(\text{Index}_N \parallel \text{Timestamp}_N \parallel \text{EventType}_N \parallel \text{Details}_N \parallel \text{BlockHash}_{N-1}\right)$$

Genesis block $\text{Block}_0$ anchors the chain with $\text{PreviousHash} = 0^{64}$. The cryptographic certificate is exportable via `GET /api/sovereignty-audit/export`.

---

## 4. Python Sandbox Isolation Boundaries & Execution Tiers

The Workbench executes untrusted Python code through a **two-tier defense-in-depth model**:

### 4.1. Tier 1 (Target / Production): Real Docker Container (`--network none`)
- **Isolation Mechanism:** Linux Kernel Network Namespaces (`CLONE_NEWNET`), cgroups memory limit ($512\text{ MB}$), CPU CFS quotas ($2.0\text{ vCPUs}$), and ephemeral container lifetime (`--rm` / `remove=True`).
- **Network Guarantee:** The container has no network interfaces other than a loopback that does not route to the host. Any socket creation fails at the kernel system-call level (`ENETUNREACH`), providing a cryptographic air-gap guarantee even if code bypasses static analysis.

### 4.2. Tier 2 (Development Fallback): Hardened Isolated Subprocess + AST Shield
- **Trigger:** Used when the Docker daemon is offline or absent in development/testing environments (`is_docker_live == False`).
- **Isolation Mechanism:** Static Abstract Syntax Tree (`ast`) pre-screening that scans and rejects forbidden modules (`socket`, `os`, `subprocess`, `urllib`), dangerous direct calls (`eval`, `exec`, `open`), and dunder escapes (`__subclasses__`, `__globals__`). Execution runs in an isolated Python interpreter process (`python -I`) with cleaned environment variables and a $5.0\text{s}$ timeout kill switch.
- **Security Limitation Disclosure:** While the AST shield effectively blocks standard library imports and known escape vectors, it does not provide OS kernel network namespace isolation. Therefore, final competition demonstration mandates running Docker on the host GPU workstation (tracked in `docs/tasks.md` Task 4).

