document.addEventListener("DOMContentLoaded", async () => {
  const cacheBust = `?v=${Date.now()}`;
  const [noiseTypes, references, techniques] = await Promise.all([
    fetch(`data/noise.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/references.json${cacheBust}`).then((r) => r.json()),
    fetch(`data/techniques.json${cacheBust}`).then((r) => r.json()),
  ]);

  // Sort alphabetically by name
  noiseTypes.sort((a, b) => a.name.localeCompare(b.name));

  // Build citation index
  const citationOrder = [];
  const citationMap = {};
  for (const n of noiseTypes) {
    for (const key of n.references || []) {
      if (!(key in citationMap)) {
        citationOrder.push(key);
        citationMap[key] = citationOrder.length;
      }
    }
  }

  const main = document.getElementById("noise-list");
  const alphaNav = document.getElementById("alpha-nav");
  const noResults = document.querySelector(".no-results");
  const searchInput = document.getElementById("search");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let activeCategory = "all";

  // Show noise type counts on filter buttons
  const categoryCounts = { incoherent: 0, coherent: 0 };
  for (const n of noiseTypes) {
    categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
  }
  filterBtns.forEach((btn) => {
    const cat = btn.dataset.category;
    if (cat === "all") {
      btn.textContent = `All (${noiseTypes.length})`;
    } else if (categoryCounts[cat] !== undefined) {
      btn.textContent = `${cat.charAt(0).toUpperCase() + cat.slice(1)} (${categoryCounts[cat]})`;
    }
  });

  // Group noise types by first letter
  const grouped = {};
  for (const n of noiseTypes) {
    const letter = n.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(n);
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

  // Render noise cards
  for (const letter of letters) {
    const heading = document.createElement("h2");
    heading.className = "letter-heading";
    heading.id = `letter-${letter}`;
    heading.textContent = letter;
    main.appendChild(heading);

    for (const n of grouped[letter]) {
      const card = document.createElement("div");
      card.className = "technique";
      card.dataset.category = n.category;
      card.dataset.letter = letter;
      card.id = n.id;

      const categoryLabel = n.category.charAt(0).toUpperCase() + n.category.slice(1);
      const aliases =
        n.aliases && n.aliases.length
          ? `<div class="aka">Also known as: ${n.aliases.join(", ")}</div>`
          : "";

      // Build list of mitigating techniques
      let mitigatedByHtml = "";
      if (n.mitigated_by && n.mitigated_by.length) {
        const techLinks = n.mitigated_by
          .map((id) => {
            const tech = techniques.find((t) => t.id === id);
            if (!tech) return null;
            const label = tech.abbreviation || tech.name;
            return `<a href="technique.html?id=${id}" class="tech-link">${label}</a>`;
          })
          .filter(Boolean)
          .join(" ");
        mitigatedByHtml = `<div class="mitigated-by"><strong>Mitigated by:</strong> ${techLinks}</div>`;
      }

      const refLinks = (n.references || [])
        .map((key) => {
          const num = citationMap[key];
          return `<a href="#ref-${key}">[${num}]</a>`;
        })
        .join(" ");

      // Build properties table
      const props = [];
      if (n.physical_origin) {
        props.push(["Physical origin", n.physical_origin]);
      }
      if (n.effect_on_bloch_sphere) {
        props.push(["Bloch sphere effect", n.effect_on_bloch_sphere]);
      }
      const propRows = props.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");

      card.innerHTML = `
        <h3>
          <a href="technique.html?id=${n.id}&type=noise">${n.name}</a>
          <span class="badge badge-${n.category}">${categoryLabel}</span>
        </h3>
        ${aliases}
        <div class="summary"><p>${n.summary}</p></div>
        ${propRows ? `<div class="properties"><table>${propRows}</table></div>` : ""}
        ${mitigatedByHtml}
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
