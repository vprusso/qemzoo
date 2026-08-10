#!/usr/bin/env python3
"""Regenerate sitemap.xml from the data files.

The sitemap was maintained by hand and had drifted: it listed 43 of the 79
pages, missing every noise, extrapolation, noise-scaling and noise-learning
detail page along with several protocols added later. Run this after adding an
entry.
"""

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://qemzoo.com"
TODAY = date.today().isoformat()

# catalog file -> (detail page, query type, priority)
CATALOGS = [
    ("data/techniques.json", "technique.html", None, "0.8"),
    ("data/applications.json", "application.html", None, "0.8"),
    ("data/noise.json", "technique.html", "noise", "0.7"),
    ("data/extrapolation.json", "technique.html", "extrapolation", "0.7"),
    ("data/noise-scaling.json", "technique.html", "noise-scaling", "0.7"),
    ("data/noise-learning.json", "technique.html", "noise-learning", "0.7"),
]

TOP_LEVEL = [
    ("/", "1.0"),
    ("/techniques.html", "0.9"),
    ("/noise.html", "0.9"),
    ("/applications.html", "0.9"),
    ("/faq.html", "0.6"),
]


def urls():
    for path, priority in TOP_LEVEL:
        yield f"{BASE}{path}", priority
    for catalog, page, qtype, priority in CATALOGS:
        entries = json.loads((ROOT / catalog).read_text())
        for entry in sorted(entries, key=lambda e: e["id"]):
            suffix = f"&amp;type={qtype}" if qtype else ""
            yield f"{BASE}/{page}?id={entry['id']}{suffix}", priority


def main():
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, priority in urls():
        lines += ["  <url>",
                  f"    <loc>{loc}</loc>",
                  f"    <lastmod>{TODAY}</lastmod>",
                  "    <changefreq>weekly</changefreq>",
                  f"    <priority>{priority}</priority>",
                  "  </url>"]
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n")
    print(f"sitemap.xml: {len(lines[2:-1]) // 6} urls")


if __name__ == "__main__":
    main()
