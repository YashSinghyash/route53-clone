"""Per-record-type value validation for DNS records.

Raises ValueError with a human-readable message on invalid input.
"""
import ipaddress
import re

VALID_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}

_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$"
)


def _is_domain(v: str) -> bool:
    v = v.strip()
    return bool(v) and bool(_DOMAIN_RE.match(v))


def _require_ipv4(v: str) -> None:
    try:
        if not isinstance(ipaddress.ip_address(v.strip()), ipaddress.IPv4Address):
            raise ValueError
    except ValueError:
        raise ValueError("value must be a valid IPv4 address")


def _require_ipv6(v: str) -> None:
    try:
        if not isinstance(ipaddress.ip_address(v.strip()), ipaddress.IPv6Address):
            raise ValueError
    except ValueError:
        raise ValueError("value must be a valid IPv6 address")


def _require_domain(v: str, label: str = "value") -> None:
    if not _is_domain(v):
        raise ValueError(f"{label} must be a valid domain name")


def validate_record_value(rtype: str, value: str) -> None:
    rtype = (rtype or "").upper()
    if rtype not in VALID_TYPES:
        raise ValueError(f"type must be one of: {', '.join(sorted(VALID_TYPES))}")

    value = (value or "").strip()
    if not value:
        raise ValueError("value is required")

    if rtype == "A":
        _require_ipv4(value)
    elif rtype == "AAAA":
        _require_ipv6(value)
    elif rtype in ("CNAME", "NS", "PTR"):
        _require_domain(value)
    elif rtype == "TXT":
        if not value:
            raise ValueError("TXT value must be a non-empty string")
    elif rtype == "MX":
        parts = value.split()
        if len(parts) != 2 or not parts[0].isdigit():
            raise ValueError("MX value must be '<priority:int> <mailserver:domain>'")
        _require_domain(parts[1], "MX mailserver")
    elif rtype == "SRV":
        parts = value.split()
        if len(parts) != 4 or not all(p.isdigit() for p in parts[:3]):
            raise ValueError("SRV value must be '<priority> <weight> <port> <target:domain>'")
        _require_domain(parts[3], "SRV target")
    elif rtype == "CAA":
        parts = value.split(None, 2)
        if len(parts) != 3 or not parts[0].isdigit():
            raise ValueError("CAA value must be '<flags:int> <issue|issuewild|iodef> <value>'")
        if parts[1] not in ("issue", "issuewild", "iodef"):
            raise ValueError("CAA tag must be one of: issue, issuewild, iodef")
