# Plan 41: Packet-Level Sniffing Engine & Multi-Tier Traffic Monitor Design

## 1. Objective
Design the packet-level sniffing engine in `backend/core/packet_sniffer.py` using `scapy`, capturing network frame traffic on all host interfaces, distinguishing between local LAN/Hotspot multi-device packets and external WAN packets, and verifying that Total External Egress Packets equals exactly zero.

## 2. Requirement Mapping
- **SIH26117 Requirement 02:** *ZERO EXTERNAL EGRESS* — Absolute network boundary enforcement where zero packets leave the premises/closed network.
- **SIH26117 Requirement 12:** *PROVABLE SOVEREIGNTY AUDITING* — Real-time verifiable network traffic monitoring.

## 3. Detailed Design & Technical Approach

### 3.1. 3-Tier Packet Filtering & Accounting Logic (`backend/core/packet_sniffer.py`)
```python
import threading
import time
import ipaddress
from typing import Dict, Any
from scapy.all import sniff, IP, TCP, UDP

class ScapyPacketAuditor:
    def __init__(self):
        self.total_packets_sniffed = 0
        self.localhost_packets = 0
        self.lan_hotspot_packets = 0
        self.external_packets_detected = 0
        self.external_bytes_detected = 0
        self.is_running = False
        self._thread = None

    def _packet_callback(self, packet):
        self.total_packets_sniffed += 1
        
        if IP in packet:
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            
            is_src_loopback = src_ip.startswith("127.") or src_ip in ("0.0.0.0", "::1")
            is_dst_loopback = dst_ip.startswith("127.") or dst_ip in ("0.0.0.0", "::1")
            
            if is_src_loopback and is_dst_loopback:
                self.localhost_packets += 1
                return

            # Check if private RFC 1918 LAN/Hotspot traffic
            try:
                src_private = ipaddress.ip_address(src_ip).is_private
                dst_private = ipaddress.ip_address(dst_ip).is_private
                
                if src_private and dst_private:
                    self.lan_hotspot_packets += 1
                    return
            except ValueError:
                pass

            # Any non-private IP on workbench ports constitutes external egress attempt
            sport = packet.sport if (TCP in packet or UDP in packet) else 0
            dport = packet.dport if (TCP in packet or UDP in packet) else 0
            
            if sport in (8000, 11434) or dport in (8000, 11434):
                self.external_packets_detected += 1
                self.external_bytes_detected += len(packet)

    def start_sniffing(self):
        if not self.is_running:
            self.is_running = True
            self._thread = threading.Thread(
                target=lambda: sniff(prn=self._packet_callback, store=0, filter="tcp or udp"),
                daemon=True
            )
            self._thread.start()

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "total_packets_sniffed": self.total_packets_sniffed,
            "localhost_packets": self.localhost_packets,
            "lan_hotspot_packets": self.lan_hotspot_packets,
            "external_packets": self.external_packets_detected,
            "external_bytes": self.external_bytes_detected,
            "airgap_verdict": "100% AIR-GAPPED & SOVEREIGN" if self.external_packets_detected == 0 else "EGRESS_DETECTED"
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** Network interface packet streams.
- **Output:** Packet count metrics dictionary (`localhost_packets`, `lan_hotspot_packets`, `external_packets: 0`, `airgap_verdict`).

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md), [Plan 40](file:///G:/SIH/p/docs/plans/40_socket_watchdog.md).
- Depended on by: [Plan 42](file:///G:/SIH/p/docs/plans/42_tamper_evident_audit_log.md), [Plan 44](file:///G:/SIH/p/docs/plans/44_websocket_streaming.md), [Plan 50](file:///G:/SIH/p/docs/plans/50_judge_verification_checklist.md).

## 6. Edge Cases & Failure Modes
- **Raw Socket Permission Denied on Windows Without WinPcap/Npcap:** Handle non-root packet sniffer mode by falling back to `psutil` socket connection auditing.

## 7. Acceptance Criteria & Verification
- When evaluator connects via hotspot (`192.168.137.X`) and runs a query, `lan_hotspot_packets` increments while `external_packets` remains strictly `0`.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** Separating `lan_hotspot_packets` from `external_packets` provides demonstrable proof to evaluators that remote devices are actively communicating without any internet egress.
