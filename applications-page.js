document.addEventListener("DOMContentLoaded", async () => {
  const cacheBust = `?v=${Date.now()}`;
  const [applications, references, techniques] = await Promise.all([
    fetch(`data/applications.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/techniques.json${cacheBust}`).then((r) => r.json()),
  ]);

  // Sort alphabetically by name
  applications.sort((a, b) => a.name.localeCompare(b.name));

  // Build citation index
  const citationOrder = [];
  const citationMap = {};
  for (const app of applications) {
    for (const key of app.references || []) {
      if (!(key in citationMap)) {
        citationOrder.push(key);
        citationMap[key] = citationOrder.length;
      }
    }
  }

  const main = document.getElementById("applications-list");
  const alphaNav = document.getElementById("alpha-nav");
  const noResults = document.querySelector(".no-results");
  const searchInput = document.getElementById("search");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeCategory = "all";

  // Show application counts on filter buttons
  const categoryCounts = {};
  for (const app of applications) {
    categoryCounts[app.category] = (categoryCounts[app.category] || 0) + 1;
  }
  filterBtns.forEach((btn) => {
    const cat = btn.dataset.category;
    if (cat === "all") {
      btn.textContent = `All (${applications.length})`;
    } else if (categoryCounts[cat] !== undefined) {
      const label = cat.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      btn.textContent = `${label} (${categoryCounts[cat]})`;
    }
  });

  // Group applications by first letter
  const grouped = {};
  for (const app of applications) {
    const letter = app.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(app);
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

  // Render application cards
  for (const letter of letters) {
    const heading = document.createElement("h2");
    heading.className = "letter-heading";
    heading.id = `letter-${letter}`;
    heading.textContent = letter;
    main.appendChild(heading);

    for (const app of grouped[letter]) {
      const card = document.createElement("div");
      card.className = "technique";
      card.dataset.category = app.category;
      card.dataset.letter = letter;
      card.id = app.id;

      const categoryLabel = app.category.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      // Build list of QEM techniques used
      let techniquesHtml = "";
      if (app.qem_techniques && app.qem_techniques.length) {
        const techLinks = app.qem_techniques
          .map((id) => {
            const tech = techniques.find((t) => t.id === id);
            if (!tech) return `<span class="tech-link">${id}</span>`;
            const label = tech.abbreviation || tech.name;
            return `<a href="technique.html?id=${id}" class="tech-link">${label}</a>`;
          })
          .join(" ");
        techniquesHtml = `<div class="qem-techniques"><strong>QEM techniques:</strong> ${techLinks}</div>`;
      }

      // Build key results list
      let resultsHtml = "";
      if (app.key_results && app.key_results.length) {
        const resultsList = app.key_results.map((r) => `<li>${r}</li>`).join("");
        resultsHtml = `<div class="key-results"><strong>Key results:</strong><ul>${resultsList}</ul></div>`;
      }

      const refLinks = (app.references || [])
        .map((key) => {
          const num = citationMap[key];
          return `<a href="#ref-${key}">[${num}]</a>`;
        })
        .join(" ");

      card.innerHTML = `
        <h3>
          <a href="application.html?id=${app.id}">${app.name}</a>
          <span class="badge badge-${app.category}">${categoryLabel}</span>
        </h3>
        <div class="summary"><p>${app.summary}</p></div>
        ${techniquesHtml}
        ${resultsHtml}
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
