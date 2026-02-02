document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const content = document.getElementById("detail-content");
  const breadcrumbName = document.getElementById("breadcrumb-name");

  if (!id) {
    content.innerHTML = '<p class="error-msg">No technique specified. Return to the <a href="index.html">catalog</a>.</p>';
    return;
  }

  try {
    const techniques = await fetch("data/techniques.json").then((r) => r.json());

    // Resolve aliases: if the id doesn't match directly, search abbreviations and aliases.
    let resolvedId = id;
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

    const [references, tradeoffs, detail] = await Promise.all([
      fetch("data/references.json").then((r) => r.json()),
      fetch("data/tradeoffs.json").then((r) => r.json()),
      fetch(`data/techniques/${id}.json`).then((r) => {
        if (!r.ok) throw new Error("Detail file not found");
        return r.json();
      }),
    ]);

    // Update page title and breadcrumb.
    const displayName = tech.abbreviation ? `${tech.name} (${tech.abbreviation})` : tech.name;
    document.title = `${displayName} — QEM Zoo`;
    breadcrumbName.textContent = displayName;

    // Build citation map for references used by this technique.
    const citationMap = {};
    tech.references.forEach((key, i) => {
      citationMap[key] = i + 1;
    });

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

    // Bias/Variance mini chart.
    html += `<section class="detail-section"><h3>Bias–Variance Trade-off</h3>`;
    html += `<div class="tradeoff-mini" id="tradeoff-mini"></div>`;
    if (detail.bias_variance && detail.bias_variance.notes) {
      html += `<p class="tradeoff-notes">${detail.bias_variance.notes}</p>`;
    }
    html += `</section>`;

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
      html += `<section class="detail-section"><h3>References</h3><ol class="detail-refs">`;
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

    // Render mini bias/variance chart.
    renderMiniTradeoff(tradeoffs, techniques, id);

    // Typeset MathJax.
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading technique: ${e.message}. Return to the <a href="index.html">catalog</a>.</p>`;
  }
});

function renderMiniTradeoff(tradeoffs, techniques, currentId) {
  const container = document.getElementById("tradeoff-mini");
  if (!container) return;

  const width = 400;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 45, left: 55 };
  const inner = { w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("class", "tradeoff-svg");

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 1]).range([0, inner.w]);
  const y = d3.scaleLinear().domain([0, 1]).range([inner.h, 0]);

  // Axes.
  g.append("g").attr("transform", `translate(0,${inner.h})`).call(d3.axisBottom(x).ticks(5))
    .append("text").attr("x", inner.w / 2).attr("y", 35).attr("fill", "#333")
    .attr("text-anchor", "middle").attr("font-size", "12px").text("Bias →");

  g.append("g").call(d3.axisLeft(y).ticks(5))
    .append("text").attr("x", -inner.h / 2).attr("y", -40).attr("fill", "#333")
    .attr("text-anchor", "middle").attr("font-size", "12px")
    .attr("transform", "rotate(-90)").text("Variance →");

  // Ideal corner label.
  g.append("text").attr("x", 2).attr("y", inner.h - 4).attr("fill", "#999")
    .attr("font-size", "9px").text("ideal");

  // Category colors.
  const catColors = { mitigation: "#2c5f8a", suppression: "#6b4c8a", detection: "#4a8a2c" };

  // Plot all points.
  for (const t of tradeoffs) {
    const tech = techniques.find((tc) => tc.id === t.id);
    if (!tech) continue;
    const isCurrent = t.id === currentId;
    const color = isCurrent ? catColors[tech.category] : "#ccc";
    const label = tech.abbreviation || tech.name;

    g.append("circle")
      .attr("cx", x(t.bias))
      .attr("cy", y(t.variance))
      .attr("r", isCurrent ? 8 : 5)
      .attr("fill", color)
      .attr("stroke", isCurrent ? "#333" : "none")
      .attr("stroke-width", isCurrent ? 2 : 0)
      .attr("opacity", isCurrent ? 1 : 0.4);

    g.append("text")
      .attr("x", x(t.bias))
      .attr("y", y(t.variance) - (isCurrent ? 12 : 8))
      .attr("text-anchor", "middle")
      .attr("font-size", isCurrent ? "11px" : "9px")
      .attr("font-weight", isCurrent ? "bold" : "normal")
      .attr("fill", isCurrent ? "#222" : "#999")
      .text(label);
  }
}
