#!/usr/bin/env python3
"""Generate language-specific post manifests from posts/<lang>/*.md.

Outputs:
- posts/manifest.<lang>.json for each language directory
- posts/manifest.json as alias of zh (for backward compatibility)
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"

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


def generate_for_lang(lang_dir: Path) -> list[str]:
    fallback_epoch = datetime(1970, 1, 1)
    items: list[tuple[datetime, str]] = []

    for path in lang_dir.glob("*.md"):
        text = path.read_text(encoding="utf-8")
        dt = parse_front_matter_date(text) or fallback_epoch
        rel = path.relative_to(ROOT).as_posix()
        items.append((dt, rel))

    items.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return [rel for _, rel in items]


def write_json(path: Path, data: list[str]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    lang_dirs = [d for d in POSTS_DIR.iterdir() if d.is_dir()]

    if not lang_dirs:
        write_json(POSTS_DIR / "manifest.json", [])
        print("No language directories found under posts/.")
        return

    for lang_dir in sorted(lang_dirs):
        lang = lang_dir.name
        result = generate_for_lang(lang_dir)
        out = POSTS_DIR / f"manifest.{lang}.json"
        write_json(out, result)
        print(f"Generated {out.relative_to(ROOT)} with {len(result)} posts.")

        if lang == "zh":
            write_json(POSTS_DIR / "manifest.json", result)


if __name__ == "__main__":
    main()
