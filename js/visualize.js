document.addEventListener("DOMContentLoaded", async () => {
  const cacheBust = `?v=${Date.now()}`;
  const techniques = await fetch(`data/techniques.json${cacheBust}`).then((r) => r.json());

  try {
    const [composability, noise, references] = await Promise.all([
      fetch(`data/composability.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/noise.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
    ]);
    renderComposabilityChart(composability, techniques);
    renderNoiseApplicabilityMatrix(noise, techniques);
  } catch (e) {
    console.warn("Could not load chart data:", e);
  }
});

// ── Noise Scaling Methods ─────────────────────────────────────────────────────

function renderNoiseScalingSection(methods, references) {
  const container = document.getElementById("noise-scaling-list");
  if (!container) return;

  let html = '<div class="noise-scaling-grid">';

  for (const m of methods) {
    const aliases = m.aliases.length ? `<div class="aliases">Also known as: ${m.aliases.join(", ")}</div>` : "";

    const propRows = Object.entries(m.properties)
      .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
      .join("");

    const refLinks = m.references
      .map((key) => {
        const ref = references[key];
        if (!ref) return `[${key}]`;
        return `<a href="https://arxiv.org/abs/${ref.arxiv}" target="_blank" title="${ref.title}">[${ref.arxiv}]</a>`;
      })
      .join(" ");

    html += `
      <div class="noise-scaling-card">
        <h3>${m.name}</h3>
        ${aliases}
        <p class="summary">${m.summary}</p>
        <table class="properties">${propRows}</table>
        <div class="references"><strong>References:</strong> ${refLinks}</div>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  // Typeset MathJax if available
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([container]);
  }
}

// ── Composability matrix chart ───────────────────────────────────────────────

function renderComposabilityChart(composability, techniques) {
  const container = document.getElementById("composability-chart");
  if (!container || typeof d3 === "undefined") return;

  const tooltip = document.getElementById("composability-tooltip");
  const techLabels = composability.techniques;
  const techIds = composability.ids;
  const pairs = composability.matrix;

  const lookup = {};
  for (const p of pairs) {
    lookup[`${p.from}--${p.to}`] = p;
    lookup[`${p.to}--${p.from}`] = p;
  }

  const n = techLabels.length;
  const cellSize = 52;
  const margin = { top: 60, left: 60 };
  const width = margin.left + n * cellSize + 20;
  const height = margin.top + n * cellSize + 20;

  const svg = d3.select(container).append("svg").attr("viewBox", [0, 0, width, height]);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  for (let j = 0; j < n; j++) {
    g.append("text")
      .attr("x", j * cellSize + cellSize / 2)
      .attr("y", -8)
      .attr("text-anchor", "start")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "600")
      .attr("fill", "#333")
      .attr("transform", `rotate(-45, ${j * cellSize + cellSize / 2}, -8)`)
      .text(techLabels[j]);
  }

  for (let i = 0; i < n; i++) {
    g.append("text")
      .attr("x", -8)
      .attr("y", i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "600")
      .attr("fill", "#333")
      .text(techLabels[i]);
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        g.append("rect")
          .attr("x", j * cellSize).attr("y", i * cellSize)
          .attr("width", cellSize - 2).attr("height", cellSize - 2)
          .attr("fill", "#f0f0f0").attr("rx", 3);
        continue;
      }

      const fromId = techIds[i];
      const toId = techIds[j];
      const entry = lookup[`${fromId}--${toId}`];

      let color = "#f5f5f5";
      let symbol = "";
      if (entry) {
        if (entry.compatible) {
          color = "#d4edda";
          symbol = "\u2714";
        } else {
          color = "#f0f0f0";
          symbol = "\u2013";
        }
      }

      const cell = g.append("g").style("cursor", entry ? "pointer" : "default");

      cell.append("rect")
        .attr("x", j * cellSize).attr("y", i * cellSize)
        .attr("width", cellSize - 2).attr("height", cellSize - 2)
        .attr("fill", color).attr("rx", 3)
        .attr("stroke", "#e0e0e0").attr("stroke-width", 0.5);

      if (symbol) {
        cell.append("text")
          .attr("x", j * cellSize + cellSize / 2 - 1)
          .attr("y", i * cellSize + cellSize / 2)
          .attr("text-anchor", "middle").attr("dy", "0.35em")
          .attr("font-size", "14px")
          .attr("fill", entry.compatible ? "#2c8a4c" : "#999")
          .text(symbol);
      }

      if (entry && tooltip) {
        cell.on("mouseover", (event) => {
          const rect = container.getBoundingClientRect();
          const text = entry.compatible
            ? `${entry.order}: ${entry.notes}`
            : `Not standard: ${entry.notes}`;
          tooltip.textContent = text;
          tooltip.style.display = "block";
          tooltip.style.left = (event.clientX - rect.left + 12) + "px";
          tooltip.style.top = (event.clientY - rect.top - 12) + "px";
        });
        cell.on("mouseout", () => {
          tooltip.style.display = "none";
        });
      }
    }
  }
}

// ── Noise-Technique Applicability Matrix ──────────────────────────────────────

function renderNoiseApplicabilityMatrix(noiseTypes, techniques) {
  const container = document.getElementById("noise-applicability-chart");
  if (!container || typeof d3 === "undefined") return;

  const tooltip = document.getElementById("noise-applicability-tooltip");

  // Get all unique technique IDs from mitigated_by arrays
  const allTechIds = new Set();
  for (const n of noiseTypes) {
    if (n.mitigated_by) {
      for (const t of n.mitigated_by) {
        allTechIds.add(t);
      }
    }
  }

  // Filter techniques to only those that appear in mitigated_by
  const relevantTechs = techniques.filter((t) => allTechIds.has(t.id));
  // Sort techniques alphabetically
  relevantTechs.sort((a, b) => (a.abbreviation || a.name).localeCompare(b.abbreviation || b.name));

  const techLabels = relevantTechs.map((t) => t.abbreviation || t.name);
  const techIds = relevantTechs.map((t) => t.id);

  const noiseLabels = noiseTypes.map((n) => n.name.replace(" Noise", "").replace(" Errors", ""));
  const noiseIds = noiseTypes.map((n) => n.id);

  // Build lookup for applicability
  const applicable = {};
  for (const n of noiseTypes) {
    if (n.mitigated_by) {
      for (const t of n.mitigated_by) {
        applicable[`${n.id}--${t}`] = true;
      }
    }
  }

  const nNoise = noiseLabels.length;
  const nTech = techLabels.length;
  const cellSize = 42;
  const margin = { top: 90, left: 130 };
  const width = margin.left + nTech * cellSize + 20;
  const height = margin.top + nNoise * cellSize + 20;

  const svg = d3.select(container).append("svg").attr("viewBox", [0, 0, width, height]);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Column headers (techniques)
  for (let j = 0; j < nTech; j++) {
    const label = g.append("text")
      .attr("x", j * cellSize + cellSize / 2)
      .attr("y", -8)
      .attr("text-anchor", "start")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "600")
      .attr("fill", "#2c5f8a")
      .attr("transform", `rotate(-45, ${j * cellSize + cellSize / 2}, -8)`)
      .style("cursor", "pointer")
      .text(techLabels[j]);

    label.on("click", () => {
      window.location.href = `technique.html?id=${techIds[j]}`;
    });
  }

  // Row headers (noise types)
  for (let i = 0; i < nNoise; i++) {
    const label = g.append("text")
      .attr("x", -8)
      .attr("y", i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "600")
      .attr("fill", noiseTypes[i].category === "coherent" ? "#6b4c8a" : "#a66b2a")
      .style("cursor", "pointer")
      .text(noiseLabels[i]);

    label.on("click", () => {
      window.location.href = `technique.html?type=noise&id=${noiseIds[i]}`;
    });
  }

  // Cells
  for (let i = 0; i < nNoise; i++) {
    for (let j = 0; j < nTech; j++) {
      const noiseId = noiseIds[i];
      const techId = techIds[j];
      const isApplicable = applicable[`${noiseId}--${techId}`];

      const color = isApplicable ? "#d4edda" : "#f9f9f9";
      const symbol = isApplicable ? "\u2714" : "";

      const cell = g.append("g").style("cursor", isApplicable ? "pointer" : "default");

      cell.append("rect")
        .attr("x", j * cellSize).attr("y", i * cellSize)
        .attr("width", cellSize - 2).attr("height", cellSize - 2)
        .attr("fill", color).attr("rx", 3)
        .attr("stroke", "#e0e0e0").attr("stroke-width", 0.5);

      if (symbol) {
        cell.append("text")
          .attr("x", j * cellSize + cellSize / 2 - 1)
          .attr("y", i * cellSize + cellSize / 2)
          .attr("text-anchor", "middle").attr("dy", "0.35em")
          .attr("font-size", "14px")
          .attr("fill", "#2c8a4c")
          .text(symbol);
      }

      if (tooltip) {
        const noiseName = noiseTypes[i].name;
        const techName = relevantTechs[j].name;
        const text = isApplicable
          ? `${techName} can mitigate ${noiseName}`
          : `${techName} is not typically used for ${noiseName}`;

        cell.on("mouseover", (event) => {
          const rect = container.getBoundingClientRect();
          tooltip.textContent = text;
          tooltip.style.display = "block";
          tooltip.style.left = (event.clientX - rect.left + 12) + "px";
          tooltip.style.top = (event.clientY - rect.top - 12) + "px";
        });
        cell.on("mouseout", () => {
          tooltip.style.display = "none";
        });

        if (isApplicable) {
          cell.on("click", () => {
            window.location.href = `technique.html?id=${techId}`;
          });
        }
      }
    }
  }

  // Legend
  const legendG = svg.append("g").attr("transform", `translate(${margin.left}, ${height - 15})`);
  legendG.append("rect").attr("width", 14).attr("height", 14).attr("fill", "#d4edda").attr("rx", 2);
  legendG.append("text").attr("x", 20).attr("y", 11).attr("font-size", "10px")
    .attr("font-family", "system-ui, sans-serif").attr("fill", "#666").text("= technique is applicable");

  legendG.append("circle").attr("cx", 150).attr("cy", 7).attr("r", 5).attr("fill", "#a66b2a");
  legendG.append("text").attr("x", 160).attr("y", 11).attr("font-size", "10px")
    .attr("font-family", "system-ui, sans-serif").attr("fill", "#666").text("Incoherent noise");

  legendG.append("circle").attr("cx", 270).attr("cy", 7).attr("r", 5).attr("fill", "#6b4c8a");
  legendG.append("text").attr("x", 280).attr("y", 11).attr("font-size", "10px")
    .attr("font-family", "system-ui, sans-serif").attr("fill", "#666").text("Coherent noise");
}
