#!/usr/bin/env python3
"""Regenerate references.bib from data/references.json.

data/references.json is what the site renders from, so it is the source of
truth for authors, titles, journals, years and identifiers. The hand-written
bib file carried volumes, page numbers and full author names that the JSON does
not store, so those are carried over wherever the entry still exists and its
author list has not changed.
"""

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON = ROOT / "data" / "references.json"
BIB = ROOT / "references.bib"

# keys that changed in the JSON after the bib was last hand-edited
RENAMES = {"souza2011": "souza2012", "cai2022": "cai2023"}

PROCEEDINGS = {
    "IEEE International Conference on Quantum Computing and Engineering (QCE)",
    "ASPLOS",
}


def surnames(author_field, style):
    """Surname sequence, for comparing a JSON author list with a BibTeX one."""
    if style == "json":
        parts = [a.strip() for a in author_field.split(",")]
        names = [p.split()[-1] for p in parts if p and p != "et al."]
    else:
        names = []
        for a in author_field.split(" and "):
            a = a.strip()
            names.append(a.split(",")[0].strip() if "," in a else a.split()[-1])
    out = []
    for n in names:
        n = unicodedata.normalize("NFKD", re.sub(r"[{}\\'`\"^~]", "", n))
        n = "".join(c for c in n if not unicodedata.combining(c)).lower()
        out.append(n.split()[-1] if n.split() else n)  # ignore particles when comparing
    return out


# name particles that belong to the surname, not to the given names
PARTICLES = {"da", "de", "del", "della", "den", "der", "di", "du", "la", "le",
             "van", "von", "ten", "ter", "dos", "das"}


def json_authors_to_bibtex(author_field):
    """'K. Temme, S. Bravyi' -> 'Temme, K. and Bravyi, S.', keeping particles
    with the surname: 'W. A. de Jong' -> 'de Jong, W. A.'"""
    out = []
    for a in [a.strip() for a in author_field.split(",") if a.strip()]:
        if a == "et al.":
            out.append("others")
            continue
        bits = a.split()
        if len(bits) == 1:
            out.append(bits[0])
            continue
        cut = len(bits) - 1
        while cut > 0 and bits[cut - 1].lower() in PARTICLES:
            cut -= 1
        out.append(f"{' '.join(bits[cut:])}, {' '.join(bits[:cut])}")
    return " and ".join(out)


def parse_fields(body):
    """field -> value, matching braces so that values like Rist\\`{e} survive."""
    fields = {}
    for m in re.finditer(r"(\w+)\s*=\s*\{", body):
        depth, i = 1, m.end()
        while i < len(body) and depth:
            if body[i] == "{":
                depth += 1
            elif body[i] == "}":
                depth -= 1
            i += 1
        fields[m.group(1)] = body[m.end():i - 1].strip()
    return fields


def parse_existing(text):
    """key -> {field: value} for the entries already in the file."""
    entries = {}
    for match in re.finditer(r"@(\w+)\{([^,]+),(.*?)\n\}", text, re.S):
        _, key, body = match.groups()
        entries[RENAMES.get(key.strip(), key.strip())] = parse_fields(body)
    return entries


def main():
    refs = json.loads(JSON.read_text())
    existing = parse_existing(BIB.read_text()) if BIB.exists() else {}

    blocks = []
    carried = 0
    for key in sorted(refs):
        ref = refs[key]
        old = existing.get(key, {})

        author = json_authors_to_bibtex(ref["authors"])
        if old.get("author") and surnames(old["author"], "bib") == surnames(ref["authors"], "json"):
            author = old["author"]  # full first names, still the right list
            carried += 1

        venue = ref.get("journal", "")
        if venue == "arXiv preprint":
            kind, venue_field = "misc", None
        elif venue in PROCEEDINGS:
            kind, venue_field = "inproceedings", ("booktitle", venue)
        else:
            kind, venue_field = "article", ("journal", venue)

        lines = [f"@{kind}{{{key},", f"  author  = {{{author}}},",
                 f"  title   = {{{{{ref['title']}}}}},"]
        if venue_field:
            lines.append(f"  {venue_field[0]} = {{{venue_field[1]}}},")
        for field in ("volume", "pages"):
            if old.get(field):
                lines.append(f"  {field:<7} = {{{old[field]}}},")
        lines.append(f"  year    = {{{ref['year']}}},")
        if ref.get("arxiv"):
            lines.append(f"  eprint  = {{{ref['arxiv']}}},")
            lines.append("  archiveprefix = {arXiv},")
        if ref.get("doi"):
            lines.append(f"  doi     = {{{ref['doi']}}},")
        lines[-1] = lines[-1].rstrip(",")
        lines.append("}")
        blocks.append("\n".join(lines))

    BIB.write_text("% Generated from data/references.json by scripts/generate_bibtex.py.\n"
                   "% Edit the JSON, not this file.\n\n" + "\n\n".join(blocks) + "\n")
    print(f"references.bib: {len(blocks)} entries, {carried} author lists carried over")


if __name__ == "__main__":
    main()
