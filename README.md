# The QEM Zoo

A comprehensive catalog of quantum error mitigation (QEM) and quantum error suppression (QES) techniques, inspired by the [Complexity Zoo](https://complexityzoo.net/Complexity_Zoo) and the [Error Correction Zoo](https://errorcorrectionzoo.org/).

Motivated by Open Problem 1 in [Cai et al., "Quantum Error Mitigation," *Rev. Mod. Phys.* (2023)](https://arxiv.org/abs/2210.00921).

## Running locally

```bash
uv run main.py
```

This starts a local server at [http://localhost:8000](http://localhost:8000) and opens it in your browser.

### Pages

- **Catalog** (`index.html`) — searchable, filterable listing of all techniques with LaTeX-rendered math
- **Graph View** (`graph.html`) — interactive force-directed graph showing technique relationships

## Adding a technique

1. Add the BibTeX entry to `references.bib`
2. Add the corresponding entry to `data/references.json`
3. Add the technique to `data/techniques.json` (including `related` edges for the graph view)

## Structure

- `data/techniques.json` — all technique entries as structured data
- `data/references.json` — reference metadata (mirrors `references.bib`)
- `references.bib` — BibTeX source of truth for citations
- `index.html` / `style.css` / `script.js` — catalog frontend
- `graph.html` / `graph.js` — graph view (D3.js)
- `main.py` — local static file server
