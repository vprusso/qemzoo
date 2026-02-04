document.addEventListener("DOMContentLoaded", async () => {
  const cacheBust = `?v=${Date.now()}`;
  const [noiseScaling, references] = await Promise.all([
    fetch(`data/noise-scaling.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
  ]);

  // Build citation index: ref key -> number (1-based, ordered by first appearance).
  const citationOrder = [];
  const citationMap = {};

  for (const method of noiseScaling) {
    for (const key of method.references) {
      if (!(key in citationMap)) {
        citationOrder.push(key);
        citationMap[key] = citationOrder.length;
      }
    }
  }

  renderNoiseScalingSection(noiseScaling, references, citationMap);
  renderReferences(references, citationOrder, citationMap);

  // Typeset MathJax
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }
});

function renderNoiseScalingSection(methods, references, citationMap) {
  const container = document.getElementById("noise-scaling-list");
  if (!container) return;

  let html = "";

  for (const m of methods) {
    const aliases = m.aliases.length
      ? `<div class="aka">Also known as: ${m.aliases.join(", ")}</div>`
      : "";

    const propRows = Object.entries(m.properties)
      .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
      .join("");

    const refLinks = m.references
      .map((key) => {
        const num = citationMap[key];
        return `<a href="#ref-${key}">[${num}]</a>`;
      })
      .join(" ");

    html += `
      <div class="technique" id="${m.id}">
        <h3><a href="technique.html?id=${m.id}&type=noise-scaling">${m.name}</a></h3>
        ${aliases}
        <div class="summary"><p>${m.summary}</p></div>
        <div class="properties"><table>${propRows}</table></div>
        <div class="references"><strong>References:</strong> ${refLinks}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderReferences(references, citationOrder, citationMap) {
  const refSection = document.getElementById("references-section");
  const refList = document.getElementById("references-list");
  if (!refSection || !refList || citationOrder.length === 0) return;

  refSection.style.display = "";

  for (const key of citationOrder) {
    const ref = references[key];
    if (!ref) continue;
    const num = citationMap[key];
    const li = document.createElement("li");
    li.id = `ref-${key}`;
    li.value = num;
    const arxivLink = ref.arxiv
      ? ` <a href="https://arxiv.org/abs/${ref.arxiv}">arXiv:${ref.arxiv}</a>`
      : "";
    const journal = ref.journal ? `, <i>${ref.journal}</i>` : "";
    li.innerHTML = `${ref.authors}, "${ref.title}"${journal} (${ref.year}).${arxivLink}`;
    refList.appendChild(li);
  }
}
