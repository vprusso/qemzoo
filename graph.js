document.addEventListener("DOMContentLoaded", async () => {
  const techniques = await fetch("data/techniques.json").then((r) => r.json());

  const categoryColors = {
    mitigation: "#2c5f8a",
    suppression: "#6b4c8a",
  };

  // Build nodes and links from technique data.
  const nodes = techniques.map((t) => ({
    id: t.id,
    name: t.abbreviation || t.name,
    fullName: t.name,
    category: t.category,
  }));

  const nodeIds = new Set(nodes.map((n) => n.id));
  const linkSet = new Set();
  const links = [];

  for (const t of techniques) {
    if (!t.related) continue;
    for (const rel of t.related) {
      if (!nodeIds.has(rel.id)) continue;
      const key = [t.id, rel.id].sort().join("--");
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source: t.id, target: rel.id, reason: rel.reason });
      }
    }
  }

  const container = document.getElementById("graph-container");
  const tooltip = document.getElementById("tooltip");
  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3
    .select("#graph-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  // Add a root <g> that zoom/pan will transform.
  const g = svg.append("g");

  // Enable pan and zoom on the entire canvas.
  svg.call(
    d3.zoom()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      })
  );

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(35));

  const link = g
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "link")
    .attr("stroke-width", 1.5)
    .on("mouseover", (event, d) => {
      const rect = container.getBoundingClientRect();
      tooltip.textContent = d.reason;
      tooltip.style.display = "block";
      tooltip.style.left = event.clientX - rect.left + 10 + "px";
      tooltip.style.top = event.clientY - rect.top - 10 + "px";
    })
    .on("mouseout", () => {
      tooltip.style.display = "none";
    });

  // Track whether a drag actually moved, to distinguish click from drag.
  let dragged = false;

  const node = g
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .call(
      d3.drag()
        .container(svg.node())
        .on("start", (event, d) => {
          dragged = false;
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          dragged = true;
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  node
    .append("circle")
    .attr("r", 18)
    .attr("fill", (d) => categoryColors[d.category] || "#999");

  // Attach click to the whole node group, fire only if not a drag.
  node.on("click", (event, d) => {
    if (!dragged) {
      window.location.href = `index.html#${d.id}`;
    }
  });

  node.on("mouseover", (event, d) => {
    const rect = container.getBoundingClientRect();
    tooltip.textContent = d.fullName;
    tooltip.style.display = "block";
    tooltip.style.left = event.clientX - rect.left + 10 + "px";
    tooltip.style.top = event.clientY - rect.top - 10 + "px";
  });

  node.on("mouseout", () => {
    tooltip.style.display = "none";
  });

  node
    .append("text")
    .text((d) => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", 30)
    .attr("fill", "#333");

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
});
