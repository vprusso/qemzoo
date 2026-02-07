document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const content = document.getElementById("detail-content");
  const breadcrumbName = document.getElementById("breadcrumb-name");

  if (!id) {
    content.innerHTML = '<p class="error-msg">No application specified. Return to the <a href="applications.html">applications</a> page.</p>';
    return;
  }

  const cacheBust = `?v=${Date.now()}`;

  try {
    const [applications, references, techniques, detail] = await Promise.all([
      fetch(`data/applications.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/techniques.json${cacheBust}`).then((r) => r.json()),
      fetch(`data/applications/${id}.json${cacheBust}`).then((r) => {
        if (!r.ok) throw new Error("Detail file not found");
        return r.json();
      }),
    ]);

    const app = applications.find((a) => a.id === id);
    if (!app) {
      content.innerHTML = '<p class="error-msg">Application not found. Return to the <a href="applications.html">applications</a> page.</p>';
      return;
    }

    // Update page title and breadcrumb
    document.title = `${app.name} — QEM Zoo`;
    breadcrumbName.textContent = app.name;

    // Build citation map
    const citationMap = {};
    (app.references || []).forEach((key, i) => {
      citationMap[key] = i + 1;
    });

    let html = "";

    // Title and badge
    const categoryLabel = app.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    html += `<h2 class="detail-title">${app.name} <span class="badge badge-${app.category}">${categoryLabel}</span></h2>`;

    // Summary
    html += `<section class="detail-section"><h3>Overview</h3><p>${app.summary}</p></section>`;

    // Diagram/Image (if exists)
    const imageId = app.id;
    html += `<section class="detail-section diagram-section">
      <img src="images/applications/${imageId}.svg" alt="${app.name} diagram" class="application-diagram" onerror="this.parentElement.style.display='none'"/>
    </section>`;

    // Extended description
    if (detail.description && detail.description.length) {
      html += `<section class="detail-section"><h3>Description</h3>`;
      for (const para of detail.description) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // Diagrams from detail file
    if (detail.diagrams && detail.diagrams.length) {
      html += `<section class="detail-section"><h3>Workflow</h3>`;
      html += `<div class="circuit-diagrams">`;
      for (const diag of detail.diagrams) {
        html += `<figure class="circuit-figure">`;
        html += `<img src="${diag.src}" alt="${app.name} workflow" class="circuit-diagram"/>`;
        if (diag.caption) {
          let captionText = diag.caption;
          // Add reference citation if provided
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

    // Why error mitigation matters
    if (detail.why_qem && detail.why_qem.length) {
      html += `<section class="detail-section"><h3>Why Error Mitigation Matters</h3>`;
      for (const para of detail.why_qem) {
        html += `<p>${para}</p>`;
      }
      html += `</section>`;
    }

    // QEM techniques used
    if (app.qem_techniques && app.qem_techniques.length) {
      html += `<section class="detail-section"><h3>QEM Techniques Used</h3>`;
      html += `<div class="related-grid">`;
      for (const techId of app.qem_techniques) {
        const tech = techniques.find((t) => t.id === techId);
        if (!tech) continue;
        const techLabel = tech.abbreviation || tech.name;
        const techCat = tech.category;
        html += `<a href="technique.html?id=${techId}" class="related-card">`;
        html += `<span class="related-name">${techLabel}</span>`;
        html += `<span class="badge badge-${techCat}">${techCat}</span>`;
        html += `<span class="related-reason">${tech.name}</span>`;
        html += `</a>`;
      }
      html += `</div></section>`;
    }

    // Key results
    if (app.key_results && app.key_results.length) {
      html += `<section class="detail-section"><h3>Key Results</h3><ul>`;
      for (const result of app.key_results) {
        html += `<li>${result}</li>`;
      }
      html += `</ul></section>`;
    }

    // Experimental demonstrations
    if (detail.demonstrations && detail.demonstrations.length) {
      html += `<section class="detail-section"><h3>Experimental Demonstrations</h3>`;
      for (const demo of detail.demonstrations) {
        html += `<div class="demonstration">`;
        html += `<h4>${demo.title}</h4>`;
        html += `<p>${demo.description}</p>`;
        if (demo.hardware) html += `<p><strong>Hardware:</strong> ${demo.hardware}</p>`;
        if (demo.qubits) html += `<p><strong>Qubits:</strong> ${demo.qubits}</p>`;
        if (demo.gates) html += `<p><strong>Gates:</strong> ${demo.gates}</p>`;
        if (demo.techniques) html += `<p><strong>Techniques:</strong> ${demo.techniques}</p>`;
        html += `</div>`;
      }
      html += `</section>`;
    }

    // Challenges
    if (detail.challenges && detail.challenges.length) {
      html += `<section class="detail-section"><h3>Challenges</h3><ul>`;
      for (const challenge of detail.challenges) {
        html += `<li>${challenge}</li>`;
      }
      html += `</ul></section>`;
    }

    // References
    if (app.references && app.references.length) {
      html += `<section class="detail-section" id="references"><h3>References</h3><ol class="detail-refs">`;
      for (const key of app.references) {
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

    // Typeset MathJax
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }
  } catch (e) {
    content.innerHTML = `<p class="error-msg">Error loading application: ${e.message}. Return to the <a href="applications.html">applications</a> page.</p>`;
  }
});
