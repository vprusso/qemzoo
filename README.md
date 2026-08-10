# The QEM Zoo

A comprehensive catalog of quantum error mitigation (QEM) and quantum error suppression (QES) techniques, inspired by the [Complexity Zoo](https://complexityzoo.net/Complexity_Zoo) and the [Error Correction Zoo](https://errorcorrectionzoo.org/).

Motivated by Open Problem 1 in [Cai et al., "Quantum Error Mitigation," *Rev. Mod. Phys.* (2023)](https://arxiv.org/abs/2210.00921).

## Running locally

```bash
uv run main.py
```

This starts a local server at [http://localhost:8000](http://localhost:8000) and opens it in your browser.

### Pages

- **Protocols** (`index.html`) — the main catalog of QEM and QES methods
- **Techniques** (`techniques.html`) — supporting methods: noise scaling, extrapolation and post-processing, noise learning
- **Noise** (`noise.html`) — noise channels and the techniques that address them
- **Applications** (`applications.html`) — VQE, QAOA, Hamiltonian simulation, and other use cases
- **Detail pages** (`technique.html?id=...`, `application.html?id=...`) — rendered from the JSON data files, with LaTeX typeset by MathJax

## Contributing

Corrections and new entries are welcome, either as a pull request or by email
(see the [FAQ](https://qemzoo.com/faq.html)). Everything on the site is
rendered from the JSON files under `data/`, so an edit is a JSON edit; no build
step is involved.

To add a protocol:

1. Add its references to `data/references.json`, keyed by first author and year
2. Add a catalog entry to `data/techniques.json`: `id`, `name`, `category`
   (`mitigation` or `suppression`), `summary`, `properties`, `references`, and
   `related` edges to other entries
3. Add `data/techniques/<id>.json` with the long-form content: `description`,
   `how_it_works`, `key_equations`, `advantages`, `disadvantages`, `use_cases`,
   and any `diagrams`

The other catalogs follow the same two-file pattern: a list file
(`data/noise.json`, `data/applications.json`, `data/extrapolation.json`,
`data/noise-scaling.json`, `data/noise-learning.json`) and a per-entry detail
file in the matching directory.

Claims on a page should be traceable to a cited paper, and numbers (qubit
counts, overheads, thresholds) should match what that paper reports.

## Structure

- `data/techniques.json` and `data/techniques/` — protocol catalog and per-protocol detail
- `data/noise.json`, `data/applications.json`, `data/extrapolation.json`, `data/noise-scaling.json`, `data/noise-learning.json` — the other catalogs, each with a matching detail directory
- `data/references.json` — reference metadata used to render every citation
- `references.bib` — partial BibTeX export; `data/references.json` is the source of truth
- `*.html`, `css/`, `js/` — static frontend, one script per page type
- `images/`, `scripts/` — figures and the scripts that generate them
- `main.py` — local static file server
