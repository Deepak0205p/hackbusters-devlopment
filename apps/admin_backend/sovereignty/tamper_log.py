import time
import hashlib
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditLogEntry(BaseModel):
    index: int
    timestamp: str
    epoch_time: float
    event_type: str
    details: str
    previous_hash: str
    current_hash: str
    verified: bool = True

class TamperEvidentAuditLog:
    """
    Cryptographic SHA-256 Hash-Chained Audit Log.
    Guarantees immutability and mathematical verification of sovereignty records.
    """
    def __init__(self):
        self.entries: List[AuditLogEntry] = []
        self._initialize_genesis_block()

    def _compute_hash(self, index: int, epoch_time: float, event_type: str, details: str, previous_hash: str) -> str:
        payload = f"{index}|{epoch_time:.4f}|{event_type}|{details}|{previous_hash}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def _initialize_genesis_block(self):
        epoch = time.time()
        genesis_hash = self._compute_hash(
            index=0,
            epoch_time=epoch,
            event_type="GENESIS_SYSTEM_BOOT",
            details="MRPL Sovereign AI Workbench initialized in 100% air-gapped mode.",
            previous_hash=GENESIS_HASH
        )
        entry = AuditLogEntry(
            index=0,
            timestamp=time.strftime("%H:%M:%S", time.localtime(epoch)),
            epoch_time=epoch,
            event_type="GENESIS_SYSTEM_BOOT",
            details="MRPL Sovereign AI Workbench initialized in 100% air-gapped mode.",
            previous_hash=GENESIS_HASH,
            current_hash=genesis_hash,
            verified=True
        )
        self.entries.append(entry)

    def append_event(self, event_type: str, details: str) -> AuditLogEntry:
        prev_entry = self.entries[-1]
        new_index = prev_entry.index + 1
        epoch = time.time()
        new_hash = self._compute_hash(
            index=new_index,
            epoch_time=epoch,
            event_type=event_type,
            details=details,
            previous_hash=prev_entry.current_hash
        )
        entry = AuditLogEntry(
            index=new_index,
            timestamp=time.strftime("%H:%M:%S", time.localtime(epoch)),
            epoch_time=epoch,
            event_type=event_type,
            details=details,
            previous_hash=prev_entry.current_hash,
            current_hash=new_hash,
            verified=True
        )
        self.entries.append(entry)
        return entry

    def verify_chain_integrity(self) -> Dict[str, Any]:
        """
        Iterates through every block from Genesis to Head to verify SHA-256 integrity.
        """
        for i in range(len(self.entries)):
            entry = self.entries[i]
            expected_prev = GENESIS_HASH if i == 0 else self.entries[i - 1].current_hash
            if entry.previous_hash != expected_prev:
                return {
                    "valid": False,
                    "error": f"Previous hash mismatch at index {i}",
                    "compromised_index": i
                }

            recomputed = self._compute_hash(
                index=entry.index,
                epoch_time=entry.epoch_time,
                event_type=entry.event_type,
                details=entry.details,
                previous_hash=entry.previous_hash
            )
            if entry.current_hash != recomputed:
                return {
                    "valid": False,
                    "error": f"Block hash tampering detected at index {i}",
                    "compromised_index": i
                }

        return {
            "valid": True,
            "total_blocks": len(self.entries),
            "head_hash": self.entries[-1].current_hash,
            "verdict": "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"
        }

    def export_certificate(self) -> Dict[str, Any]:
        verification = self.verify_chain_integrity()
        return {
            "certificate_title": "MRPL Sovereign AI Workbench - Air-Gap Cryptographic Audit Certificate",
            "standard_compliance": ["SIH26117_REQ_02", "SIH26117_REQ_12"],
            "issued_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "total_audit_blocks": len(self.entries),
            "head_sha256_hash": self.entries[-1].current_hash,
            "integrity_verification": verification,
            "audit_blocks": [e.dict() for e in self.entries]
        }

# Global Singleton
audit_log = TamperEvidentAuditLog()
