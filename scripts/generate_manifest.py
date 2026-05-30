#!/usr/bin/env python3
"""Generate posts/manifest.json from posts/*.md.

Sort order:
1) front matter `date` (newest first)
2) file name (desc)
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
MANIFEST = POSTS_DIR / "manifest.json"

DATE_PATTERNS = [
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d %H:%M:%S",
]


def parse_front_matter_date(text: str) -> datetime | None:
    m = re.match(r"^---\n([\s\S]*?)\n---\n?", text)
    if not m:
        return None

    for line in m.group(1).splitlines():
        if not line.strip().startswith("date:"):
            continue
        raw = line.split(":", 1)[1].strip().strip('"').strip("'")
        for fmt in DATE_PATTERNS:
            try:
                return datetime.strptime(raw, fmt)
            except ValueError:
                pass
    return None


def main() -> None:
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    items: list[tuple[datetime, str]] = []
    fallback_epoch = datetime(1970, 1, 1)

    for path in POSTS_DIR.glob("*.md"):
        text = path.read_text(encoding="utf-8")
        dt = parse_front_matter_date(text) or fallback_epoch
        rel = path.relative_to(ROOT).as_posix()
        items.append((dt, rel))

    items.sort(key=lambda x: (x[0], x[1]), reverse=True)
    result = [rel for _, rel in items]

    MANIFEST.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {MANIFEST.relative_to(ROOT)} with {len(result)} posts.")


if __name__ == "__main__":
    main()
