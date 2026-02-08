document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type"); // "noise-scaling" or null (default = protocol)
  const content = document.getElementById("detail-content");
  const breadcrumbName = document.getElementById("breadcrumb-name");
  const breadcrumb = document.getElementById("breadcrumb");

  if (!id) {
    content.innerHTML = '<p class="error-msg">No technique specified. Return to the <a href="index.html">catalog</a>.</p>';
    return;
  }

  const cacheBust = `?v=${Date.now()}`;

  // Handle noise-scaling methods
  if (type === "noise-scaling") {
    await renderNoiseScalingDetail(id, content, breadcrumbName, breadcrumb, cacheBust);
    return;
  }

  // Handle noise types
  if (type === "noise") {
    await renderNoiseDetail(id, content, breadcrumbName, breadcrumb, cacheBust);
    return;
  }

  // Handle extrapolation methods
  if (type === "extrapolation") {
    await renderExtrapolationDetail(id, content, breadcrumbName, breadcrumb, cacheBust);
    return;
  }

  // Handle noise learning methods
  if (type === "noise-learning") {
    await renderNoiseLearningDetail(id, content, breadcrumbName, breadcrumb, cacheBust);
    return;
  }

  try {
    const techniques = await fetch(`data/techniques.json${cacheBust}`).then((r) => r.json());

    // Resolve aliases: if the id doesn't match directly, search abbreviations and aliases.
    let tech = techniques.find((t) => t.id === id);
    if (!tech) {
      const query = id.toLowerCase().replace(/[-_]/g, " ");
      tech = techniques.find((t) =>
        (t.abbreviation && t.abbreviation.toLowerCase() === query) ||
        t.aliases.some((a) => a.toLowerCase() === query) ||
        t.name.toLowerCase() === query
      );
      if (tech) {
        // Redirect to the canonical URL so bookmarks use the real id.
        window.location.replace(`technique.html?id=${tech.id}`);
        return;
      }
      content.innerHTML = '<p class="error-msg">Technique not found. Return to the <a href="index.html">catalog</a>.</p>';
      return;
    }

    const [references, detail] = await Promise.all([
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/techniques/${id}.json${cacheBust}`).then((r) => {
        if (!r.ok) throw new Error("Detail file not found");
        return r.json();
      }),
    ]);

    // Update page title and breadcrumb.
    const displayName = tech.abbreviation ? `${tech.name} (${tech.abbreviation})` : tech.name;
    document.title = `${displayName} — QEM Zoo`;
    breadcrumbName.textContent = displayName;

    let html = "";

    // Title and badge.
    const categoryLabel = tech.category.charAt(0).toUpperCase() + tech.category.slice(1);
    html += `<h2 class="detail-title">${tech.name}`;
    if (tech.abbreviation) html += ` <span class="detail-abbr">(${tech.abbreviation})</span>`;
    html += ` <span class="badge badge-${tech.category}">${categoryLabel}</span></h2>`;

    if (tech.aliases.length) {
      html += `<div class="aka">Also known as: ${tech.aliases.join(", ")}</div>`;
    }

    // Summary.
    html += `<section class="detail-section"><h3>Overview</h3><p>${tech.summary}</p></section>`;

    // Extended description.
    if (detail.description && detail.description.length) {
      html += `<section class="detail-section"><h3>Description</h3>`;
      for (const para of detail.description) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // Build citation map for reference numbers.
    const citationMap = {};
    tech.references.forEach((key, idx) => {
      citationMap[key] = idx + 1;
    });

    // Diagrams.
    if (detail.diagrams && detail.diagrams.length) {
      html += `<section class="detail-section"><h3>Diagram</h3>`;
      html += `<div class="circuit-diagrams">`;
      for (const diag of detail.diagrams) {
        html += `<figure class="circuit-figure">`;
        html += `<img src="${diag.src}" alt="${diag.caption || tech.name + ' diagram'}" class="circuit-diagram">`;
        if (diag.caption) {
          let captionText = diag.caption;
          if (diag.reference && citationMap[diag.reference]) {
            const citationNum = citationMap[diag.reference];
            captionText += ` <a href="#references">[${citationNum}]</a>`;
          }
          html += `<figcaption>${captionText}</figcaption>`;
        }
        html += `</figure>`;
      }
      html += `</div></section>`;
    }

    // How it works.
    if (detail.how_it_works && detail.how_it_works.length) {
      html += `<section class="detail-section"><h3>How It Works</h3><ol class="steps-list">`;
      for (const step of detail.how_it_works) {
        html += `<li>${step}</li>`;
      }
      html += `</ol></section>`;
    }

    // Key equations.
    if (detail.key_equations && detail.key_equations.length) {
      html += `<section class="detail-section"><h3>Key Equations</h3>`;
      for (const eq of detail.key_equations) {
        html += `<div class="equation-block">`;
        html += `<div class="equation-label">${eq.label}</div>`;
        html += `<div class="equation-math">\\[${eq.latex}\\]</div>`;
        html += `</div>`;
      }
      html += `</section>`;
    }

    // Properties table.
    const propRows = Object.entries(tech.properties)
      .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
      .join("");
    html += `<section class="detail-section"><h3>Properties</h3><table class="properties-table">${propRows}</table></section>`;

    // Advantages / Disadvantages.
    if ((detail.advantages && detail.advantages.length) || (detail.disadvantages && detail.disadvantages.length)) {
      html += `<section class="detail-section"><h3>Trade-offs</h3><div class="pros-cons">`;
      if (detail.advantages && detail.advantages.length) {
        html += `<div class="pros"><h4>Advantages</h4><ul>`;
        for (const a of detail.advantages) html += `<li>${a}</li>`;
        html += `</ul></div>`;
      }
      if (detail.disadvantages && detail.disadvantages.length) {
        html += `<div class="cons"><h4>Disadvantages</h4><ul>`;
        for (const d of detail.disadvantages) html += `<li>${d}</li>`;
        html += `</ul></div>`;
      }
      html += `</div></section>`;
    }

    // Use cases.
    if (detail.use_cases && detail.use_cases.length) {
      html += `<section class="detail-section"><h3>Use Cases</h3><ul>`;
      for (const u of detail.use_cases) html += `<li>${u}</li>`;
      html += `</ul></section>`;
    }

    // Related techniques.
    if (tech.related && tech.related.length) {
      html += `<section class="detail-section"><h3>Related Techniques</h3><div class="related-grid">`;
      for (const rel of tech.related) {
        const relTech = techniques.find((t) => t.id === rel.id);
        if (!relTech) continue;
        const relLabel = relTech.abbreviation || relTech.name;
        const relCat = relTech.category;
        html += `<a href="technique.html?id=${rel.id}" class="related-card">`;
        html += `<span class="related-name">${relLabel}</span>`;
        html += `<span class="badge badge-${relCat}">${relCat}</span>`;
        html += `<span class="related-reason">${rel.reason}</span>`;
        html += `</a>`;
      }
      html += `</div></section>`;
    }

    // References.
    if (tech.references.length) {
      html += `<section class="detail-section" id="references"><h3>References</h3><ol class="detail-refs">`;
      for (const key of tech.references) {
        const ref = references[key];
        if (!ref) continue;
        const arxivLink = ref.arxiv
          ? ` <a href="https://arxiv.org/abs/${ref.arxiv}">arXiv:${ref.arxiv}</a>`
          : "";
        const journal = ref.journal ? `, <i>${ref.journal}</i>` : "";
        html += `<li>${ref.authors}, "${ref.title}"${journal} (${ref.year}).${arxivLink}</li>`;
      }
      html += `</ol></section>`;
    }

    content.innerHTML = html;

    // Typeset MathJax.
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading technique: ${e.message}. Return to the <a href="index.html">catalog</a>.</p>`;
  }
});

// Render noise-scaling method detail page
async function renderNoiseScalingDetail(id, content, breadcrumbName, breadcrumb, cacheBust) {
  try {
    // Update breadcrumb to link to techniques page
    breadcrumb.innerHTML = '<a href="techniques.html">Techniques</a> &rsaquo; <span id="breadcrumb-name">Loading...</span>';
    const breadcrumbNameEl = document.getElementById("breadcrumb-name");

    const [methods, references, detail] = await Promise.all([
      fetch(`data/noise-scaling.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/noise-scaling/${id}.json${cacheBust}`).then((r) => {
        if (!r.ok) throw new Error("Detail file not found");
        return r.json();
      }),
    ]);

    const method = methods.find((m) => m.id === id);
    if (!method) {
      content.innerHTML = '<p class="error-msg">Method not found. Return to the <a href="techniques.html">techniques</a> page.</p>';
      return;
    }

    // Update page title and breadcrumb.
    document.title = `${method.name} — QEM Zoo`;
    breadcrumbNameEl.textContent = method.name;

    let html = "";

    // Title.
    html += `<h2 class="detail-title">${method.name} <span class="badge badge-scaling">Noise Scaling</span></h2>`;

    if (method.aliases && method.aliases.length) {
      html += `<div class="aka">Also known as: ${method.aliases.join(", ")}</div>`;
    }

    // Summary.
    html += `<section class="detail-section"><h3>Overview</h3><p>${method.summary}</p></section>`;

    // Extended description.
    if (detail.description && detail.description.length) {
      html += `<section class="detail-section"><h3>Description</h3>`;
      for (const para of detail.description) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // Circuit diagrams.
    if (detail.diagrams && detail.diagrams.length) {
      html += `<section class="detail-section"><h3>Circuit Examples</h3>`;
      html += `<div class="circuit-diagrams">`;
      for (const diag of detail.diagrams) {
        html += `<figure class="circuit-figure">`;
        html += `<img src="${diag.src}" alt="${diag.caption}" class="circuit-diagram">`;
        html += `<figcaption>${diag.caption}</figcaption>`;
        html += `</figure>`;
      }
      html += `</div></section>`;
    }

    // How it works.
    if (detail.how_it_works && detail.how_it_works.length) {
      html += `<section class="detail-section"><h3>How It Works</h3><ol class="steps-list">`;
      for (const step of detail.how_it_works) {
        html += `<li>${step}</li>`;
      }
      html += `</ol></section>`;
    }

    // Key equations.
    if (detail.key_equations && detail.key_equations.length) {
      html += `<section class="detail-section"><h3>Key Equations</h3>`;
      for (const eq of detail.key_equations) {
        html += `<div class="equation-block">`;
        html += `<div class="equation-label">${eq.label}</div>`;
        html += `<div class="equation-math">\\[${eq.latex}\\]</div>`;
        html += `</div>`;
      }
      html += `</section>`;
    }

    // Properties table.
    if (method.properties) {
      const propRows = Object.entries(method.properties)
        .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
        .join("");
      html += `<section class="detail-section"><h3>Properties</h3><table class="properties-table">${propRows}</table></section>`;
    }

    // Advantages / Disadvantages.
    if ((detail.advantages && detail.advantages.length) || (detail.disadvantages && detail.disadvantages.length)) {
      html += `<section class="detail-section"><h3>Trade-offs</h3><div class="pros-cons">`;
      if (detail.advantages && detail.advantages.length) {
        html += `<div class="pros"><h4>Advantages</h4><ul>`;
        for (const a of detail.advantages) html += `<li>${a}</li>`;
        html += `</ul></div>`;
      }
      if (detail.disadvantages && detail.disadvantages.length) {
        html += `<div class="cons"><h4>Disadvantages</h4><ul>`;
        for (const d of detail.disadvantages) html += `<li>${d}</li>`;
        html += `</ul></div>`;
      }
      html += `</div></section>`;
    }

    // Use cases.
    if (detail.use_cases && detail.use_cases.length) {
      html += `<section class="detail-section"><h3>Use Cases</h3><ul>`;
      for (const u of detail.use_cases) html += `<li>${u}</li>`;
      html += `</ul></section>`;
    }

    // References.
    if (method.references && method.references.length) {
      html += `<section class="detail-section"><h3>References</h3><ol class="detail-refs">`;
      for (const key of method.references) {
        const ref = references[key];
        if (!ref) continue;
        const arxivLink = ref.arxiv
          ? ` <a href="https://arxiv.org/abs/${ref.arxiv}">arXiv:${ref.arxiv}</a>`
          : "";
        const journal = ref.journal ? `, <i>${ref.journal}</i>` : "";
        html += `<li>${ref.authors}, "${ref.title}"${journal} (${ref.year}).${arxivLink}</li>`;
      }
      html += `</ol></section>`;
    }

    content.innerHTML = html;

    // Typeset MathJax.
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading technique: ${e.message}. Return to the <a href="techniques.html">techniques</a> page.</p>`;
  }
}

// Render noise type detail page
async function renderNoiseDetail(id, content, breadcrumbName, breadcrumb, cacheBust) {
  try {
    // Update breadcrumb to link to noise page
    breadcrumb.innerHTML = '<a href="noise.html">Noise</a> &rsaquo; <span id="breadcrumb-name">Loading...</span>';
    const breadcrumbNameEl = document.getElementById("breadcrumb-name");

    const [noiseTypes, references, techniques, detail] = await Promise.all([
      fetch(`data/noise.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/techniques.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/noise/${id}.json${cacheBust}`).then((r) => {
        if (!r.ok) throw new Error("Detail file not found");
        return r.json();
      }),
    ]);

    const noise = noiseTypes.find((n) => n.id === id);
    if (!noise) {
      content.innerHTML = '<p class="error-msg">Noise type not found. Return to the <a href="noise.html">noise</a> page.</p>';
      return;
    }

    // Update page title and breadcrumb.
    document.title = `${noise.name} — QEM Zoo`;
    breadcrumbNameEl.textContent = noise.name;

    let html = "";

    // Title and badge.
    const categoryLabel = noise.category.charAt(0).toUpperCase() + noise.category.slice(1);
    html += `<h2 class="detail-title">${noise.name} <span class="badge badge-${noise.category}">${categoryLabel}</span></h2>`;

    if (noise.aliases && noise.aliases.length) {
      html += `<div class="aka">Also known as: ${noise.aliases.join(", ")}</div>`;
    }

    // Summary.
    html += `<section class="detail-section"><h3>Overview</h3><p>${noise.summary}</p></section>`;

    // Extended description.
    if (detail.description && detail.description.length) {
      html += `<section class="detail-section"><h3>Description</h3>`;
      for (const para of detail.description) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // Bloch sphere visualization.
    // Check if generated visualization exists
    const blochImagePath = `assets/bloch/${id}.png`;
    html += `<section class="detail-section"><h3>Bloch Sphere Effect</h3>`;
    html += `<figure class="bloch-figure">`;
    html += `<img src="${blochImagePath}" alt="Effect of ${noise.name} on the Bloch sphere" class="bloch-diagram" onerror="this.parentElement.style.display='none'">`;
    html += `<figcaption>How ${noise.name.toLowerCase()} affects quantum states on the Bloch sphere at increasing noise strengths (p=0 to p=0.9). Colors indicate initial z-coordinate; gray arrows show state drift.</figcaption>`;
    html += `</figure>`;
    html += `</section>`;

    // Additional diagrams from detail file (if available).
    if (detail.diagrams && detail.diagrams.length) {
      html += `<section class="detail-section"><h3>Additional Diagrams</h3>`;
      html += `<div class="circuit-diagrams">`;
      for (const diag of detail.diagrams) {
        html += `<figure class="circuit-figure">`;
        html += `<img src="${diag.src}" alt="${diag.caption}" class="circuit-diagram">`;
        html += `<figcaption>${diag.caption}</figcaption>`;
        html += `</figure>`;
      }
      html += `</div></section>`;
    }

    // Quantum channel representation.
    if (detail.quantum_channel) {
      html += `<section class="detail-section"><h3>Quantum Channel</h3>`;
      const ch = detail.quantum_channel;
      if (ch.kraus_form) {
        html += `<div class="equation-block"><div class="equation-label">Kraus form</div>`;
        html += `<div class="equation-math">\\[${ch.kraus_form}\\]</div></div>`;
      }
      if (ch.kraus_operators) {
        html += `<div class="equation-block"><div class="equation-label">Kraus operators</div>`;
        html += `<div class="equation-math">\\[${ch.kraus_operators}\\]</div></div>`;
      }
      if (ch.time_evolution) {
        html += `<div class="equation-block"><div class="equation-label">Time evolution</div>`;
        html += `<div class="equation-math">\\[${ch.time_evolution}\\]</div></div>`;
      }
      if (ch.alternative_form) {
        html += `<div class="equation-block"><div class="equation-label">Alternative form</div>`;
        html += `<div class="equation-math">\\[${ch.alternative_form}\\]</div></div>`;
      }
      html += `</section>`;
    }

    // Properties table.
    if (detail.properties) {
      const propRows = Object.entries(detail.properties)
        .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
        .join("");
      html += `<section class="detail-section"><h3>Properties</h3><table class="properties-table">${propRows}</table></section>`;
    }

    // Physical examples.
    if (detail.physical_examples && detail.physical_examples.length) {
      html += `<section class="detail-section"><h3>Physical Examples</h3><ul>`;
      for (const ex of detail.physical_examples) html += `<li>${ex}</li>`;
      html += `</ul></section>`;
    }

    // QEM considerations.
    if (detail.qem_considerations && detail.qem_considerations.length) {
      html += `<section class="detail-section"><h3>Error Mitigation Considerations</h3><ul>`;
      for (const c of detail.qem_considerations) html += `<li>${c}</li>`;
      html += `</ul></section>`;
    }

    // Mitigated by techniques.
    if (noise.mitigated_by && noise.mitigated_by.length) {
      html += `<section class="detail-section"><h3>Applicable QEM Techniques</h3><div class="related-grid">`;
      for (const techId of noise.mitigated_by) {
        const tech = techniques.find((t) => t.id === techId);
        if (!tech) continue;
        const label = tech.abbreviation || tech.name;
        html += `<a href="technique.html?id=${techId}" class="related-card">`;
        html += `<span class="related-name">${label}</span>`;
        html += `<span class="badge badge-${tech.category}">${tech.category}</span>`;
        html += `<span class="related-reason">${tech.name}</span>`;
        html += `</a>`;
      }
      html += `</div></section>`;
    }

    // References.
    if (noise.references && noise.references.length) {
      html += `<section class="detail-section"><h3>References</h3><ol class="detail-refs">`;
      for (const key of noise.references) {
        const ref = references[key];
        if (!ref) continue;
        const arxivLink = ref.arxiv
          ? ` <a href="https://arxiv.org/abs/${ref.arxiv}">arXiv:${ref.arxiv}</a>`
          : "";
        const journal = ref.journal ? `, <i>${ref.journal}</i>` : "";
        html += `<li>${ref.authors}, "${ref.title}"${journal} (${ref.year}).${arxivLink}</li>`;
      }
      html += `</ol></section>`;
    }

    content.innerHTML = html;

    // Typeset MathJax.
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading noise type: ${e.message}. Return to the <a href="noise.html">noise</a> page.</p>`;
  }
}

// Render extrapolation method detail page
async function renderExtrapolationDetail(id, content, breadcrumbName, breadcrumb, cacheBust) {
  try {
    // Update breadcrumb to link to techniques page
    breadcrumb.innerHTML = '<a href="techniques.html">Techniques</a> &rsaquo; <span id="breadcrumb-name">Loading...</span>';
    const breadcrumbNameEl = document.getElementById("breadcrumb-name");

    const [methods, references] = await Promise.all([
      fetch(`data/extrapolation.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
    ]);

    const method = methods.find((m) => m.id === id);
    if (!method) {
      content.innerHTML = '<p class="error-msg">Method not found. Return to the <a href="techniques.html">techniques</a> page.</p>';
      return;
    }

    // Try to load detail file
    let detail = {};
    try {
      detail = await fetch(`data/extrapolation/${id}.json${cacheBust}`).then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      });
    } catch (e) {
      // Detail file is optional
    }

    // Update page title and breadcrumb.
    document.title = `${method.name} — QEM Zoo`;
    breadcrumbNameEl.textContent = method.name;

    let html = "";

    // Title.
    html += `<h2 class="detail-title">${method.name} <span class="badge badge-extrapolation">Extrapolation</span></h2>`;

    if (method.aliases && method.aliases.length) {
      html += `<div class="aka">Also known as: ${method.aliases.join(", ")}</div>`;
    }

    // Summary.
    html += `<section class="detail-section"><h3>Overview</h3><p>${method.summary}</p></section>`;

    // Extended description.
    if (detail.description && detail.description.length) {
      html += `<section class="detail-section"><h3>Description</h3>`;
      for (const para of detail.description) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // How it works.
    if (detail.how_it_works && detail.how_it_works.length) {
      html += `<section class="detail-section"><h3>How It Works</h3><ol class="steps-list">`;
      for (const step of detail.how_it_works) {
        html += `<li>${step}</li>`;
      }
      html += `</ol></section>`;
    }

    // Key equations.
    if (detail.key_equations && detail.key_equations.length) {
      html += `<section class="detail-section"><h3>Key Equations</h3>`;
      for (const eq of detail.key_equations) {
        html += `<div class="equation-block">`;
        html += `<div class="equation-label">${eq.label}</div>`;
        html += `<div class="equation-math">\\[${eq.latex}\\]</div>`;
        html += `</div>`;
      }
      html += `</section>`;
    }

    // Properties table.
    if (method.properties) {
      const propRows = Object.entries(method.properties)
        .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
        .join("");
      html += `<section class="detail-section"><h3>Properties</h3><table class="properties-table">${propRows}</table></section>`;
    }

    // Advantages / Disadvantages.
    if ((detail.advantages && detail.advantages.length) || (detail.disadvantages && detail.disadvantages.length)) {
      html += `<section class="detail-section"><h3>Trade-offs</h3><div class="pros-cons">`;
      if (detail.advantages && detail.advantages.length) {
        html += `<div class="pros"><h4>Advantages</h4><ul>`;
        for (const a of detail.advantages) html += `<li>${a}</li>`;
        html += `</ul></div>`;
      }
      if (detail.disadvantages && detail.disadvantages.length) {
        html += `<div class="cons"><h4>Disadvantages</h4><ul>`;
        for (const d of detail.disadvantages) html += `<li>${d}</li>`;
        html += `</ul></div>`;
      }
      html += `</div></section>`;
    }

    // References.
    if (method.references && method.references.length) {
      html += `<section class="detail-section"><h3>References</h3><ol class="detail-refs">`;
      for (const key of method.references) {
        const ref = references[key];
        if (!ref) continue;
        const arxivLink = ref.arxiv
          ? ` <a href="https://arxiv.org/abs/${ref.arxiv}">arXiv:${ref.arxiv}</a>`
          : "";
        const journal = ref.journal ? `, <i>${ref.journal}</i>` : "";
        html += `<li>${ref.authors}, "${ref.title}"${journal} (${ref.year}).${arxivLink}</li>`;
      }
      html += `</ol></section>`;
    }

    content.innerHTML = html;

    // Typeset MathJax.
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading extrapolation method: ${e.message}. Return to the <a href="techniques.html">techniques</a> page.</p>`;
  }
}

// Render noise learning method detail page
async function renderNoiseLearningDetail(id, content, breadcrumbName, breadcrumb, cacheBust) {
  try {
    // Update breadcrumb to link to techniques page
    breadcrumb.innerHTML = '<a href="techniques.html">Techniques</a> &rsaquo; <span id="breadcrumb-name">Loading...</span>';
    const breadcrumbNameEl = document.getElementById("breadcrumb-name");

    const [methods, references] = await Promise.all([
      fetch(`data/noise-learning.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
    ]);

    const method = methods.find((m) => m.id === id);
    if (!method) {
      content.innerHTML = '<p class="error-msg">Method not found. Return to the <a href="techniques.html">techniques</a> page.</p>';
      return;
    }

    // Try to load detail file
    let detail = {};
    try {
      detail = await fetch(`data/noise-learning/${id}.json${cacheBust}`).then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      });
    } catch (e) {
      // Detail file is optional
    }

    // Update page title and breadcrumb.
    document.title = `${method.name} — QEM Zoo`;
    breadcrumbNameEl.textContent = method.name;

    let html = "";

    // Title.
    html += `<h2 class="detail-title">${method.name} <span class="badge badge-learning">Noise Learning</span></h2>`;

    if (method.aliases && method.aliases.length) {
      html += `<div class="aka">Also known as: ${method.aliases.join(", ")}</div>`;
    }

    // Summary.
    html += `<section class="detail-section"><h3>Overview</h3><p>${method.summary}</p></section>`;

    // Extended description.
    if (detail.description && detail.description.length) {
      html += `<section class="detail-section"><h3>Description</h3>`;
      for (const para of detail.description) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // Diagrams.
    if (detail.diagrams && detail.diagrams.length) {
      html += `<section class="detail-section"><h3>Diagram</h3>`;
      html += `<div class="circuit-diagrams">`;
      for (const diag of detail.diagrams) {
        html += `<figure class="circuit-figure">`;
        html += `<img src="${diag.src}" alt="${diag.caption || method.name + ' diagram'}" class="circuit-diagram">`;
        if (diag.caption) {
          html += `<figcaption>${diag.caption}</figcaption>`;
        }
        html += `</figure>`;
      }
      html += `</div></section>`;
    }

    // How it works.
    if (detail.how_it_works && detail.how_it_works.length) {
      html += `<section class="detail-section"><h3>How It Works</h3><ol class="steps-list">`;
      for (const step of detail.how_it_works) {
        html += `<li>${step}</li>`;
      }
      html += `</ol></section>`;
    }

    // Key equations.
    if (detail.key_equations && detail.key_equations.length) {
      html += `<section class="detail-section"><h3>Key Equations</h3>`;
      for (const eq of detail.key_equations) {
        html += `<div class="equation-block">`;
        html += `<div class="equation-label">${eq.label}</div>`;
        html += `<div class="equation-math">\\[${eq.latex}\\]</div>`;
        html += `</div>`;
      }
      html += `</section>`;
    }

    // Properties table.
    if (method.properties) {
      const propRows = Object.entries(method.properties)
        .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
        .join("");
      html += `<section class="detail-section"><h3>Properties</h3><table class="properties-table">${propRows}</table></section>`;
    }

    // Advantages / Disadvantages.
    if ((detail.advantages && detail.advantages.length) || (detail.disadvantages && detail.disadvantages.length)) {
      html += `<section class="detail-section"><h3>Trade-offs</h3><div class="pros-cons">`;
      if (detail.advantages && detail.advantages.length) {
        html += `<div class="pros"><h4>Advantages</h4><ul>`;
        for (const a of detail.advantages) html += `<li>${a}</li>`;
        html += `</ul></div>`;
      }
      if (detail.disadvantages && detail.disadvantages.length) {
        html += `<div class="cons"><h4>Disadvantages</h4><ul>`;
        for (const d of detail.disadvantages) html += `<li>${d}</li>`;
        html += `</ul></div>`;
      }
      html += `</div></section>`;
    }

    // Use cases.
    if (detail.use_cases && detail.use_cases.length) {
      html += `<section class="detail-section"><h3>Use Cases</h3><ul>`;
      for (const u of detail.use_cases) html += `<li>${u}</li>`;
      html += `</ul></section>`;
    }

    // References.
    if (method.references && method.references.length) {
      html += `<section class="detail-section"><h3>References</h3><ol class="detail-refs">`;
      for (const key of method.references) {
        const ref = references[key];
        if (!ref) continue;
        const arxivLink = ref.arxiv
          ? ` <a href="https://arxiv.org/abs/${ref.arxiv}">arXiv:${ref.arxiv}</a>`
          : "";
        const journal = ref.journal ? `, <i>${ref.journal}</i>` : "";
        html += `<li>${ref.authors}, "${ref.title}"${journal} (${ref.year}).${arxivLink}</li>`;
      }
      html += `</ol></section>`;
    }

    content.innerHTML = html;

    // Typeset MathJax.
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading noise learning method: ${e.message}. Return to the <a href="techniques.html">techniques</a> page.</p>`;
  }
}
