document.addEventListener("DOMContentLoaded", async () => {
  const cacheBust = `?v=${Date.now()}`;
  const techniques = await fetch(`data/techniques.json${cacheBust}`).then((r) => r.json());

  try {
    const [tradeoffs, comparison, composability, noiseScaling, references] = await Promise.all([
      fetch(`data/tradeoffs.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/comparison.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/composability.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/noise-scaling.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
    ]);
    renderNoiseScalingSection(noiseScaling, references);
    renderTradeoffChart(tradeoffs, techniques);
    renderComparisonChart(comparison, techniques);
    renderComposabilityChart(composability, techniques);
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

// ── Bias/Variance Trade-off Chart ─────────────────────────────────────────────

function renderTradeoffChart(tradeoffs, techniques) {
  const container = document.getElementById("tradeoff-chart");
  if (!container || typeof d3 === "undefined") return;

  const tooltip = document.getElementById("tradeoff-tooltip");
  const width = 650;
  const height = 450;
  const margin = { top: 25, right: 30, bottom: 50, left: 60 };
  const inner = { w: width - margin.left - margin.right, h: height - margin.top - margin.bottom };

  const svg = d3.select(container)
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 1]).range([0, inner.w]);
  const y = d3.scaleLinear().domain([0, 1]).range([inner.h, 0]);
  const r = d3.scaleLinear().domain([0, 1]).range([6, 18]);

  const catColors = { mitigation: "#2c5f8a", suppression: "#6b4c8a" };

  // Grid lines.
  g.append("g").attr("class", "grid")
    .selectAll("line.h").data(d3.range(0.2, 1, 0.2)).join("line")
    .attr("x1", 0).attr("x2", inner.w)
    .attr("y1", d => y(d)).attr("y2", d => y(d))
    .attr("stroke", "#eee").attr("stroke-dasharray", "3,3");

  g.append("g").attr("class", "grid")
    .selectAll("line.v").data(d3.range(0.2, 1, 0.2)).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d))
    .attr("y1", 0).attr("y2", inner.h)
    .attr("stroke", "#eee").attr("stroke-dasharray", "3,3");

  // Axes.
  g.append("g").attr("transform", `translate(0,${inner.h})`).call(d3.axisBottom(x).ticks(5))
    .append("text").attr("x", inner.w / 2).attr("y", 38).attr("fill", "#333")
    .attr("text-anchor", "middle").attr("font-size", "13px").text("Bias →");

  g.append("g").call(d3.axisLeft(y).ticks(5))
    .append("text").attr("x", -inner.h / 2).attr("y", -42).attr("fill", "#333")
    .attr("text-anchor", "middle").attr("font-size", "13px")
    .attr("transform", "rotate(-90)").text("Variance →");

  // Ideal corner label.
  g.append("text").attr("x", 4).attr("y", inner.h - 6).attr("fill", "#aaa")
    .attr("font-size", "10px").attr("font-family", "system-ui, sans-serif").text("✦ ideal");

  // Data points.
  for (const t of tradeoffs) {
    const tech = techniques.find((tc) => tc.id === t.id);
    if (!tech) continue;
    const label = tech.abbreviation || tech.name;
    const color = catColors[tech.category] || "#999";

    const group = g.append("g").attr("class", "tradeoff-point").style("cursor", "pointer");

    group.append("circle")
      .attr("cx", x(t.bias))
      .attr("cy", y(t.variance))
      .attr("r", r(t.overhead))
      .attr("fill", color)
      .attr("opacity", 0.75)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    group.append("text")
      .attr("x", x(t.bias))
      .attr("y", y(t.variance) - r(t.overhead) - 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .attr("font-weight", "600")
      .attr("fill", "#333")
      .text(label);

    group.on("click", () => {
      window.location.href = `technique.html?id=${t.id}`;
    });

    if (tooltip) {
      group.on("mouseover", (event) => {
        const rect = container.getBoundingClientRect();
        tooltip.textContent = `${tech.name}: ${t.notes}`;
        tooltip.style.display = "block";
        tooltip.style.left = (event.clientX - rect.left + 12) + "px";
        tooltip.style.top = (event.clientY - rect.top - 12) + "px";
      });
      group.on("mouseout", () => {
        tooltip.style.display = "none";
      });
    }
  }

  // Size legend.
  const legendG = svg.append("g").attr("transform", `translate(${margin.left + 10}, ${margin.top + 10})`);
  legendG.append("text").attr("x", 0).attr("y", 0).attr("font-size", "10px")
    .attr("font-family", "system-ui, sans-serif").attr("fill", "#666").text("Circle size = sampling overhead");
}

// ── Technique comparison chart ───────────────────────────────────────────────

function renderComparisonChart(comparison, techniques) {
  const container = document.getElementById("comparison-chart");
  if (!container || typeof d3 === "undefined") return;

  const axes = comparison.axes;
  const ratings = comparison.ratings;

  let html = '<table class="comparison-table"><thead><tr><th>Technique</th>';
  for (const ax of axes) {
    html += `<th title="${ax.description}">${ax.label}</th>`;
  }
  html += "</tr></thead><tbody>";

  const catColors = { mitigation: "#2c5f8a", suppression: "#6b4c8a" };
  const sorted = ratings.slice().sort((a, b) => {
    const ta = techniques.find((t) => t.id === a.id);
    const tb = techniques.find((t) => t.id === b.id);
    return (ta?.name || "").localeCompare(tb?.name || "");
  });

  for (const r of sorted) {
    const tech = techniques.find((t) => t.id === r.id);
    if (!tech) continue;
    const label = tech.abbreviation ? `${tech.abbreviation}` : tech.name;
    const color = catColors[tech.category];
    html += `<tr><td><a href="technique.html?id=${r.id}" style="color:${color};font-weight:600;text-decoration:none">${label}</a></td>`;
    for (const ax of axes) {
      const val = r[ax.key] || 0;
      const intensity = val / 5;
      const bg = `rgba(44, 95, 138, ${intensity * 0.3})`;
      const dots = "\u2B24".repeat(val) + "\u25CB".repeat(5 - val);
      html += `<td style="background:${bg};text-align:center;font-size:0.7rem;letter-spacing:1px" title="${ax.label}: ${val}/5">${dots}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  container.innerHTML = html;
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
