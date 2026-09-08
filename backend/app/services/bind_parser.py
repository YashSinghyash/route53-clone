"""Pure (DB-free) parser for BIND zone files.

Turns zone-file text into a list of parsed records plus a list of lines that
could not be understood. Value reconstruction produces the same string format
the rest of the system stores (see ``services/validation.py``).
"""
import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

from app.services.validation import VALID_TYPES

_CLASSES = {"IN", "CH", "HS", "CS"}
_TTL_RE = re.compile(r"^\d+$")
_DURATION_RE = re.compile(r"^(\d+[smhdwSMHDW])+$")


@dataclass
class ParsedRecord:
    name: str          # fully-qualified, no trailing dot
    ttl: int
    type: str
    value: str


@dataclass
class SkippedLine:
    line: str
    reason: str


def _duration_to_seconds(tok: str) -> int:
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}
    total = 0
    for num, unit in re.findall(r"(\d+)([smhdwSMHDW])", tok):
        total += int(num) * units[unit.lower()]
    return total


def _strip_comment(line: str) -> str:
    """Remove a trailing ``;`` comment, ignoring semicolons inside quotes."""
    out = []
    in_quote = False
    escaped = False
    for ch in line:
        if escaped:
            out.append(ch)
            escaped = False
            continue
        if ch == "\\":
            out.append(ch)
            escaped = True
            continue
        if ch == '"':
            in_quote = not in_quote
            out.append(ch)
            continue
        if ch == ";" and not in_quote:
            break
        out.append(ch)
    return "".join(out)


def _fqdn(name: str, origin: str) -> str:
    origin = origin.rstrip(".")
    if name in ("@", ""):
        return origin
    if name.endswith("."):
        return name.rstrip(".")
    return f"{name}.{origin}"


def _reconstruct_txt(tokens: List[str]) -> str:
    raw = " ".join(tokens).strip()
    quoted = re.findall(r'"((?:[^"\\]|\\.)*)"', raw)
    if quoted:
        return "".join(seg.replace('\\"', '"') for seg in quoted)
    return raw


def _reconstruct_value(rtype: str, tokens: List[str]) -> str:
    if not tokens:
        return ""
    if rtype == "TXT":
        return _reconstruct_txt(tokens)
    # A/AAAA/CNAME/NS/PTR: single token. MX/SRV/CAA: space-joined fields,
    # which is exactly the format validation.py expects.
    return " ".join(tokens).strip()


def _logical_lines(text: str) -> List[Tuple[str, str, bool]]:
    """Yield (assembled_line, original_block, first_line_had_leading_ws) tuples,
    joining ``( ... )`` continuation groups into one logical line."""
    result: List[Tuple[str, str, bool]] = []
    buf: List[str] = []
    raw_buf: List[str] = []
    depth = 0
    leading_ws = False
    for raw in text.splitlines():
        stripped = _strip_comment(raw)
        if depth == 0 and not stripped.strip():
            continue
        if depth == 0 and not buf:
            leading_ws = bool(raw) and raw[0] in (" ", "\t")
        depth += stripped.count("(") - stripped.count(")")
        cleaned = stripped.replace("(", " ").replace(")", " ")
        buf.append(cleaned)
        raw_buf.append(raw.strip())
        if depth <= 0:
            assembled = " ".join(p.strip() for p in buf if p.strip())
            if assembled:
                result.append((assembled, " ".join(r for r in raw_buf if r), leading_ws))
            buf, raw_buf, depth = [], [], 0
    if buf:
        assembled = " ".join(p.strip() for p in buf if p.strip())
        if assembled:
            result.append((assembled, " ".join(r for r in raw_buf if r), leading_ws))
    return result


def parse_bind_zone(
    text: str, default_origin: str
) -> Tuple[List[ParsedRecord], List[SkippedLine]]:
    origin = default_origin.rstrip(".") + "."
    default_ttl: Optional[int] = None
    last_owner: Optional[str] = None

    records: List[ParsedRecord] = []
    skipped: List[SkippedLine] = []

    for assembled, original, leading_ws in _logical_lines(text):
        line = assembled.strip()
        if not line:
            continue

        # --- directives ---
        if line.upper().startswith("$ORIGIN"):
            parts = line.split()
            if len(parts) >= 2:
                origin = parts[1] if parts[1].endswith(".") else parts[1] + "."
            continue
        if line.upper().startswith("$TTL"):
            parts = line.split()
            if len(parts) >= 2 and (_TTL_RE.match(parts[1]) or _DURATION_RE.match(parts[1])):
                default_ttl = (
                    int(parts[1]) if _TTL_RE.match(parts[1])
                    else _duration_to_seconds(parts[1])
                )
            continue
        if line.startswith("$"):
            skipped.append(SkippedLine(original, f"unsupported directive '{line.split()[0]}'"))
            continue

        # --- owner name (leading whitespace => reuse previous owner) ---
        tokens = line.split()
        if leading_ws and last_owner is not None:
            name = last_owner
        else:
            name = tokens.pop(0)
            last_owner = name

        if not tokens:
            skipped.append(SkippedLine(original, "no record data after name"))
            continue

        # --- optional TTL / CLASS in any order before TYPE ---
        ttl = default_ttl if default_ttl is not None else 300
        saw_ttl = False
        while tokens:
            tok = tokens[0].upper()
            if not saw_ttl and (_TTL_RE.match(tokens[0]) or _DURATION_RE.match(tokens[0])):
                ttl = (
                    int(tokens[0]) if _TTL_RE.match(tokens[0])
                    else _duration_to_seconds(tokens[0])
                )
                saw_ttl = True
                tokens.pop(0)
                continue
            if tok in _CLASSES:
                tokens.pop(0)
                continue
            break

        if not tokens:
            skipped.append(SkippedLine(original, "missing record type"))
            continue

        rtype = tokens.pop(0).upper()
        if rtype not in VALID_TYPES:
            skipped.append(SkippedLine(original, f"unsupported record type '{rtype}'"))
            continue

        value = _reconstruct_value(rtype, tokens)
        if not value:
            skipped.append(SkippedLine(original, "missing record value"))
            continue

        records.append(
            ParsedRecord(name=_fqdn(name, origin), ttl=ttl, type=rtype, value=value)
        )

    return records, skipped
