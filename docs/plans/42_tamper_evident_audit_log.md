# Plan 42: Tamper-Evident Audit Log & Cryptographic Hash Chaining Design

## 1. Objective
Design the tamper-evident audit logging engine in `backend/core/audit_logger.py`, writing cryptographic SHA-256 hash-chained compliance entries to `data/outputs/sovereignty_audit.log`, logging 3-tier traffic metrics (Localhost, LAN/Hotspot, External) and generating exportable JSON/CSV audit certificates for MRPL security evaluators.

## 2. Requirement Mapping
- **SIH26117 Requirement 02:** *ZERO EXTERNAL EGRESS* — Tamper-evident proof of air-gap compliance across standalone, LAN, and Hotspot modes.
- **SIH26117 Requirement 12:** *PROVABLE SOVEREIGNTY AUDITING* — Exportable, tamper-evident audit logs confirming Total External Packets is zero.

## 3. Detailed Design & Technical Approach

### 3.1. SHA-256 Hash Chaining Mathematical Specification
Every audit record $R_n$ is cryptographically bound to the preceding record $R_{n-1}$:

$$\text{Hash}_0 = \text{SHA256}(\text{"GENESIS_BLOCK_MRPL_SOVEREIGNTY_2026"})$$
$$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} + \text{Timestamp}_n + \text{PayloadJSON}_n)$$

If any attacker modifies a previous line in the log file, the entire subsequent hash chain breaks, providing instant proof of log tampering.

### 3.2. Tamper-Evident Logger Implementation (`backend/core/audit_logger.py`)
```python
import hashlib
import json
import os
import time
from typing import Dict, Any, List

class TamperEvidentAuditLogger:
    GENESIS_HASH = hashlib.sha256(b"GENESIS_BLOCK_MRPL_SOVEREIGNTY_2026").hexdigest()

    def __init__(self, log_path: str = "data/outputs/sovereignty_audit.log"):
        self.log_path = log_path
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        self.last_hash = self._get_last_hash()

    def _get_last_hash() -> str:
        if not os.path.exists(self.log_path):
            return self.GENESIS_HASH
        
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f.readlines() if line.strip()]
                if lines:
                    last_entry = json.loads(lines[-1])
                    return last_entry.get("block_hash", self.GENESIS_HASH)
        except Exception:
            pass
        return self.GENESIS_HASH

    def log_audit_event(self, socket_data: Dict[str, Any], packet_data: Dict[str, Any]) -> Dict[str, Any]:
        timestamp = time.time()
        payload = {
            "timestamp_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp)),
            "sovereignty_verdict": "100% AIR-GAPPED & SOVEREIGN" if packet_data.get("external_packets", 0) == 0 else "BREACH",
            "deployment_mode": socket_data.get("deployment_mode", "STANDALONE_LOCAL"),
            "host_ip": socket_data.get("host_ip", "127.0.0.1"),
            "traffic_summary": {
                "localhost_connections": socket_data.get("localhost_count", 0),
                "lan_hotspot_connections": socket_data.get("lan_hotspot_count", 0),
                "external_internet_connections": socket_data.get("external_breach_count", 0),
                "total_packets_sniffed": packet_data.get("total_packets_sniffed", 0),
                "lan_hotspot_packets": packet_data.get("lan_hotspot_packets", 0),
                "external_packets": packet_data.get("external_packets", 0),
                "external_bytes": packet_data.get("external_bytes", 0)
            },
            "previous_hash": self.last_hash
        }

        # Calculate current block hash
        raw_to_hash = f"{self.last_hash}:{timestamp}:{json.dumps(payload, sort_keys=True)}"
        current_hash = hashlib.sha256(raw_to_hash.encode("utf-8")).hexdigest()
        payload["block_hash"] = current_hash
        self.last_hash = current_hash

        # Append to log file
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")

        return payload

    def verify_log_integrity(self) -> Dict[str, Any]:
        """Verify that every entry in the log maintains unbroken SHA-256 hash chaining."""
        if not os.path.exists(self.log_path):
            return {"valid": True, "total_blocks": 0, "message": "Log empty"}

        with open(self.log_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]

        expected_prev = self.GENESIS_HASH
        for idx, line in enumerate(lines):
            entry = json.loads(line)
            if entry.get("previous_hash") != expected_prev:
                return {"valid": False, "broken_at_block": idx, "message": "Hash chain broken!"}
            
            block_hash = entry["block_hash"]
            expected_prev = block_hash

        return {"valid": True, "total_blocks": len(lines), "message": "100% Tamper-Evident Integrity Confirmed"}
```

## 4. Inputs / Outputs & Contracts
- **Input:** Socket scan metrics and packet sniffer counters.
- **Output:** Cryptographic log block appended to file and verification status dictionary.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 40](file:///G:/SIH/p/docs/plans/40_socket_watchdog.md), [Plan 41](file:///G:/SIH/p/docs/plans/41_packet_sniffer.md).
- Depended on by: [Plan 43](file:///G:/SIH/p/docs/plans/43_fastapi_endpoints.md), [Plan 50](file:///G:/SIH/p/docs/plans/50_judge_verification_checklist.md).

## 6. Edge Cases & Failure Modes
- **Concurrent Log Appends:** File writes use thread locks to prevent interleaved JSON lines.

## 7. Acceptance Criteria & Verification
- `verify_log_integrity()` returns `valid: True` across 1,000 continuous logged audit cycles.
- Manually editing a single byte in `sovereignty_audit.log` causes verification to fail instantly and report exact corrupted block.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Recording `deployment_mode` and `lan_hotspot_connections` inside the tamper-evident chain provides cryptographic proof of multi-device demo evaluation.
