document.addEventListener("DOMContentLoaded", async () => {
  const cacheBust = `?v=${Date.now()}`;
  const [noiseScaling, extrapolation, references] = await Promise.all([
    fetch(`data/noise-scaling.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/extrapolation.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
  ]);

  // Combine all techniques with category markers
  const allTechniques = [
    ...noiseScaling.map((t) => ({ ...t, category: "scaling", type: "noise-scaling" })),
    ...extrapolation.map((t) => ({ ...t, category: "extrapolation", type: "extrapolation" })),
  ];

  // Sort alphabetically by name
  allTechniques.sort((a, b) => a.name.localeCompare(b.name));

  // Build citation index: ref key -> number (1-based, ordered by first appearance)
  const citationOrder = [];
  const citationMap = {};
  for (const t of allTechniques) {
    for (const key of t.references || []) {
      if (!(key in citationMap)) {
        citationOrder.push(key);
        citationMap[key] = citationOrder.length;
      }
    }
  }

  const main = document.getElementById("techniques");
  const alphaNav = document.getElementById("alpha-nav");
  const noResults = document.querySelector(".no-results");
  const searchInput = document.getElementById("search");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeCategory = "all";

  // Show technique counts on filter buttons
  const categoryCounts = { scaling: 0, extrapolation: 0 };
  for (const t of allTechniques) {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  }
  filterBtns.forEach((btn) => {
    const cat = btn.dataset.category;
    if (cat === "all") {
      btn.textContent = `All (${allTechniques.length})`;
    } else if (cat === "scaling") {
      btn.textContent = `Noise Scaling (${categoryCounts.scaling})`;
    } else if (cat === "extrapolation") {
      btn.textContent = `Extrapolation (${categoryCounts.extrapolation})`;
    }
  });

  // Group techniques by first letter
  const grouped = {};
  for (const t of allTechniques) {
    const letter = t.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(t);
  }

  // Render alphabet nav
  const letters = Object.keys(grouped).sort();
  for (const l of letters) {
    const a = document.createElement("a");
    a.href = `#letter-${l}`;
    a.textContent = l;
    a.dataset.letter = l;
    alphaNav.appendChild(a);
  }

  // Render technique cards
  for (const letter of letters) {
    const heading = document.createElement("h2");
    heading.className = "letter-heading";
    heading.id = `letter-${letter}`;
    heading.textContent = letter;
    main.appendChild(heading);

    for (const t of grouped[letter]) {
      const card = document.createElement("div");
      card.className = "technique";
      card.dataset.category = t.category;
      card.dataset.letter = letter;
      card.id = t.id;

      const categoryLabel = t.category === "scaling" ? "Noise Scaling" : "Extrapolation";
      const aliases =
        t.aliases && t.aliases.length
          ? `<div class="aka">Also known as: ${t.aliases.join(", ")}</div>`
          : "";

      const propRows = Object.entries(t.properties || {})
        .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
        .join("");

      const refLinks = (t.references || [])
        .map((key) => {
          const num = citationMap[key];
          return `<a href="#ref-${key}">[${num}]</a>`;
        })
        .join(" ");

      card.innerHTML = `
        <h3>
          <a href="technique.html?id=${t.id}&type=${t.type}">${t.name}</a>
          <span class="badge badge-${t.category}">${categoryLabel}</span>
        </h3>
        ${aliases}
        <div class="summary"><p>${t.summary}</p></div>
        ${propRows ? `<div class="properties"><table>${propRows}</table></div>` : ""}
        ${refLinks ? `<div class="references"><strong>References:</strong> ${refLinks}</div>` : ""}
      `;
      main.appendChild(card);
    }
  }

  // Render references section
  const refSection = document.getElementById("references-section");
  const refList = document.getElementById("references-list");
  if (citationOrder.length > 0) {
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

  // Filtering and search
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const cards = main.querySelectorAll(".technique");
    let visible = 0;

    cards.forEach((card) => {
      const matchCategory =
        activeCategory === "all" || card.dataset.category === activeCategory;
      const matchSearch = !query || card.textContent.toLowerCase().includes(query);
      const show = matchCategory && matchSearch;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });

    // Update letter headings visibility
    main.querySelectorAll(".letter-heading").forEach((h) => {
      const letter = h.id.replace("letter-", "");
      let hasVisible = false;
      let next = h.nextElementSibling;
      while (next && !next.classList.contains("letter-heading") && next.tagName !== "H2") {
        if (next.classList.contains("technique") && next.style.display !== "none") {
          hasVisible = true;
        }
        next = next.nextElementSibling;
      }
      h.style.display = hasVisible ? "" : "none";
    });

    // Update alpha nav
    alphaNav.querySelectorAll("a").forEach((a) => {
      const heading = document.getElementById(`letter-${a.dataset.letter}`);
      a.classList.toggle("disabled", heading && heading.style.display === "none");
    });

    noResults.style.display = visible === 0 ? "block" : "none";
  }

  searchInput.addEventListener("input", applyFilters);

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      applyFilters();
    });
  });

  // Typeset MathJax after all content is rendered
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise();
  }

  // Scroll to hash target after dynamic content is rendered
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      target.style.outline = "3px solid var(--accent)";
      setTimeout(() => {
        target.style.outline = "";
      }, 2000);
    }
  }
});
