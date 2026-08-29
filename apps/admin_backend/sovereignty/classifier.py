import ipaddress
from typing import Tuple

def classify_ip_address(ip_str: str) -> str:
    """
    Classifies an IP address into one of 3 tiers:
    - LOCALHOST: 127.0.0.1, ::1, 0.0.0.0, ::
      (Internal loopback processes: Ollama daemon, FastAPI server, ChromaDB, Docker daemon)
    - LAN_HOTSPOT: RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
    - EXTERNAL_WAN: Any routable public WAN address
    """
    if not ip_str or ip_str in ("0.0.0.0", "::", "*", ""):
        return "LOCALHOST"

    try:
        ip_obj = ipaddress.ip_address(ip_str)

        if ip_obj.is_loopback or ip_obj.is_unspecified:
            return "LOCALHOST"

        if ip_obj.is_private or ip_obj.is_link_local:
            return "LAN_HOTSPOT"

        # Any public routable IP
        return "EXTERNAL_WAN"
    except ValueError:
        # If hostname or unparseable, check loopback/localhost string
        if "localhost" in ip_str.lower() or "127.0.0.1" in ip_str:
            return "LOCALHOST"
        return "EXTERNAL_WAN"

def format_endpoint(ip: str, port: int) -> str:
    if not ip:
        ip = "0.0.0.0"
    if port == 0:
        return f"{ip}:*"
    return f"{ip}:{port}"

