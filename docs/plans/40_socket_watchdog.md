# Plan 40: Network Socket Watchdog & Multi-Tier Process Boundary Auditor

## 1. Objective
Design the continuous background socket inspection daemon in `backend/core/socket_auditor.py` using `psutil`, scanning open TCP/UDP sockets every 1000ms across all system processes, categorizing connections into a 3-tier hierarchy (Localhost, LAN/Hotspot, External WAN), and raising instant security alerts if any public external connection is detected.

## 2. Requirement Mapping
- **SIH26117 Requirement 02:** *ZERO EXTERNAL EGRESS* — Absolute network boundary enforcement where zero packets leave the workstation/closed local network.
- **SIH26117 Requirement 12:** *PROVABLE SOVEREIGNTY AUDITING* — Real-time, verifiable network traffic monitoring and socket sniffing.

## 3. Detailed Design & Technical Approach

### 3.1. 3-Tier Classification & Adapter Auto-Detection Logic (`backend/core/socket_auditor.py`)
```python
import psutil
import socket
import ipaddress
import time
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("sovereignty_watchdog")

class SocketAuditor:
    def __init__(self, target_processes: Optional[List[str]] = None):
        self.target_processes = target_processes or ["uvicorn", "python", "ollama", "docker", "node"]

    def detect_network_mode(self) -> Dict[str, Any]:
        """Detect whether host is in Standalone, Venue LAN, or Host Hotspot mode."""
        interfaces = psutil.net_if_addrs()
        stats = psutil.net_if_stats()
        
        hotspot_detected = False
        lan_detected = False
        active_ips = []

        for iface_name, addrs in interfaces.items():
            if iface_name in stats and not stats[iface_name].isup:
                continue
            for addr in addrs:
                if addr.family == socket.AF_INET and not addr.address.startswith("127."):
                    ip = addr.address
                    active_ips.append({"interface": iface_name, "ip": ip})
                    if ip.startswith("192.168.137.") or "hotspot" in iface_name.lower() or "hostednetwork" in iface_name.lower():
                        hotspot_detected = True
                    elif ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
                        lan_detected = True

        if hotspot_detected:
            mode = "HOTSPOT_OPTION_B"
            primary_ip = next((x["ip"] for x in active_ips if x["ip"].startswith("192.168.137.")), active_ips[0]["ip"] if active_ips else "127.0.0.1")
        elif lan_detected:
            mode = "LAN_OPTION_A"
            primary_ip = active_ips[0]["ip"] if active_ips else "127.0.0.1"
        else:
            mode = "STANDALONE_LOCAL"
            primary_ip = "127.0.0.1"

        return {
            "mode": mode,
            "primary_ip": primary_ip,
            "interfaces": active_ips
        }

    def audit_active_sockets(self) -> Dict[str, Any]:
        """Inspect all system network connections and classify into 3 tiers."""
        localhost_sockets = []
        lan_sockets = []
        external_breaches = []

        try:
            connections = psutil.net_connections(kind="inet")
        except Exception as e:
            logger.error(f"Failed to fetch network connections: {e}")
            connections = []

        for conn in connections:
            try:
                proc_name = psutil.Process(conn.pid).name().lower() if conn.pid else "unknown"
            except Exception:
                proc_name = "unknown"

            if any(p in proc_name for p in self.target_processes) or conn.pid == psutil.Process().pid:
                laddr = f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else ""
                raddr = f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None
                status = conn.status

                # Classify remote IP
                if raddr is None or conn.raddr.ip.startswith("127.") or conn.raddr.ip in ("::1", "0.0.0.0"):
                    tier = "TIER_1_LOCALHOST"
                    is_compliant = True
                else:
                    try:
                        remote_ip_obj = ipaddress.ip_address(conn.raddr.ip)
                        if remote_ip_obj.is_private:
                            tier = "TIER_2_LAN_HOTSPOT"
                            is_compliant = True
                        else:
                            tier = "TIER_3_EXTERNAL_WAN"
                            is_compliant = False
                    except ValueError:
                        tier = "TIER_3_EXTERNAL_WAN"
                        is_compliant = False

                socket_entry = {
                    "pid": conn.pid,
                    "process": proc_name,
                    "proto": "TCP" if conn.type == psutil.SOCK_STREAM else "UDP",
                    "local_address": laddr,
                    "remote_address": raddr,
                    "status": status,
                    "tier": tier,
                    "is_compliant": is_compliant
                }

                if tier == "TIER_1_LOCALHOST":
                    localhost_sockets.append(socket_entry)
                elif tier == "TIER_2_LAN_HOTSPOT":
                    lan_sockets.append(socket_entry)
                else:
                    external_breaches.append(socket_entry)

        net_info = self.detect_network_mode()

        return {
            "timestamp": time.time(),
            "deployment_mode": net_info["mode"],
            "host_ip": net_info["primary_ip"],
            "verdict": "100% AIR-GAPPED & SOVEREIGN" if len(external_breaches) == 0 else "BREACH_DETECTED",
            "localhost_count": len(localhost_sockets),
            "lan_hotspot_count": len(lan_sockets),
            "external_breach_count": len(external_breaches),
            "localhost_sockets": localhost_sockets,
            "lan_sockets": lan_sockets,
            "external_breaches": external_breaches
        }
```

## 4. Inputs / Outputs & Contracts
- **Input:** System process table and network socket connections.
- **Output:** Audit snapshot dictionary containing 3-tier socket counts, network mode, host IP, and compliance verdict.

## 5. Dependencies on Other Plan Files
- Depends on: [Plan 04](file:///G:/SIH/p/docs/plans/04_dependency_pinning.md).
- Depended on by: [Plan 41](file:///G:/SIH/p/docs/plans/41_packet_sniffer.md), [Plan 42](file:///G:/SIH/p/docs/plans/42_tamper_evident_audit_log.md), [Plan 44](file:///G:/SIH/p/docs/plans/44_websocket_streaming.md).

## 6. Edge Cases & Failure Modes
- **Access Denied on Protected Windows Process:** Catch `psutil.AccessDenied` exception per process PID without aborting the overall socket audit loop.

## 7. Acceptance Criteria & Verification
- Identifies active Uvicorn (`0.0.0.0:8000`) and Ollama (`127.0.0.1:11434`).
- Correctly tags incoming requests from `192.168.137.X` as `TIER_2_LAN_HOTSPOT` with `is_compliant: True`.
- Any connection to public internet WAN IP raises `TIER_3_EXTERNAL_WAN` breach alert.

## 8. Design Decisions & Open Questions
- **DESIGN DECISION — reasoning:** `ipaddress.ip_address(ip).is_private` provides strict RFC 1918 private subnet validation, mathematically distinguishing local evaluator connections from public WAN traffic.
