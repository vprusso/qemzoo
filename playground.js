document.addEventListener("DOMContentLoaded", async () => {
  const manifest = await fetch("circuits/manifest.json").then((r) => r.json());

  const circuitSelect = document.getElementById("circuit-select");
  const circuitInfo = document.getElementById("circuit-info");
  const techniqueList = document.getElementById("technique-list");
  const addBtn = document.getElementById("add-technique-btn");
  const runBtn = document.getElementById("run-btn");
  const resultsPanel = document.getElementById("results-panel");
  const resultSummary = document.getElementById("result-summary");
  const errorMsg = document.getElementById("error-msg");
  const debugLog = document.getElementById("debug-log");

  let chart = null;

  function log(msg, type) {
    const cls = type === "error" ? "log-error" : type === "success" ? "log-success" : "log-label";
    const ts = new Date().toLocaleTimeString();
    debugLog.innerHTML += `<span class="${cls}">[${ts}]</span> ${msg}\n`;
    debugLog.scrollTop = debugLog.scrollHeight;
    console.log(msg);
  }

  log("Playground loaded. Manifest has " + manifest.length + " circuits.");

  // Populate circuit dropdown.
  for (const c of manifest) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    circuitSelect.appendChild(opt);
  }

  function updateCircuitInfo() {
    const c = manifest.find((m) => m.id === circuitSelect.value);
    if (c) {
      circuitInfo.innerHTML = `
        <strong>${c.name}</strong><br>
        Qubits: ${c.qubits} | Observable: &langle;${c.observable}&rangle; | Ideal value: ${c.ideal_value.toFixed(4)}<br>
        ${c.description}
      `;
    }
  }

  circuitSelect.addEventListener("change", updateCircuitInfo);
  updateCircuitInfo();

  // Technique definitions with their configurable parameters.
  const techniqueDefinitions = {
    zne: {
      name: "Zero-Noise Extrapolation (ZNE)",
      params: [
        {
          key: "scale_factors",
          label: "Scale factors (comma-separated)",
          type: "text",
          default: "1, 3, 5",
        },
        {
          key: "extrapolation",
          label: "Extrapolation method",
          type: "select",
          options: ["richardson", "linear", "exponential"],
          default: "richardson",
        },
      ],
    },
    ddd: {
      name: "Digital Dynamical Decoupling (DDD)",
      params: [
        {
          key: "rule",
          label: "DD sequence",
          type: "select",
          options: ["xx", "xyxy", "yy"],
          default: "xx",
        },
      ],
    },
    rem: {
      name: "Readout Error Mitigation (REM)",
      params: [
        {
          key: "num_calibration_shots",
          label: "Calibration shots",
          type: "number",
          default: "1000",
        },
      ],
    },
  };

  let techniqueCounter = 0;

  addBtn.addEventListener("click", () => {
    techniqueCounter++;
    const id = techniqueCounter;

    const card = document.createElement("div");
    card.className = "technique-card";
    card.dataset.id = id;

    const techKeys = Object.keys(techniqueDefinitions);

    let selectHtml = `<label>Technique</label><select class="tech-select">`;
    for (const k of techKeys) {
      selectHtml += `<option value="${k}">${techniqueDefinitions[k].name}</option>`;
    }
    selectHtml += `</select>`;

    card.innerHTML = `
      <button class="remove-btn" title="Remove">&times;</button>
      <h4>Technique #${id}</h4>
      ${selectHtml}
      <div class="tech-params"></div>
    `;

    card.querySelector(".remove-btn").addEventListener("click", () => {
      card.remove();
    });

    const techSelect = card.querySelector(".tech-select");
    const paramsDiv = card.querySelector(".tech-params");

    function renderParams() {
      const def = techniqueDefinitions[techSelect.value];
      paramsDiv.innerHTML = "";
      for (const p of def.params) {
        const label = document.createElement("label");
        label.textContent = p.label;
        paramsDiv.appendChild(label);

        if (p.type === "select") {
          const sel = document.createElement("select");
          sel.dataset.paramKey = p.key;
          for (const o of p.options) {
            const opt = document.createElement("option");
            opt.value = o;
            opt.textContent = o;
            if (o === p.default) opt.selected = true;
            sel.appendChild(opt);
          }
          paramsDiv.appendChild(sel);
        } else {
          const inp = document.createElement("input");
          inp.type = p.type === "number" ? "number" : "text";
          inp.dataset.paramKey = p.key;
          inp.value = p.default;
          paramsDiv.appendChild(inp);
        }
      }
    }

    techSelect.addEventListener("change", renderParams);
    renderParams();

    techniqueList.appendChild(card);
    log("Added technique: " + techniqueDefinitions[techKeys[0]].name);
  });

  // Run simulation.
  runBtn.addEventListener("click", async () => {
    errorMsg.textContent = "";
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner"></span>Running...';

    const techniques = [];
    for (const card of techniqueList.querySelectorAll(".technique-card")) {
      const techName = card.querySelector(".tech-select").value;
      const params = {};
      for (const el of card.querySelectorAll("[data-param-key]")) {
        const key = el.dataset.paramKey;
        let val = el.value;
        if (key === "scale_factors") {
          val = val.split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
        }
        params[key] = val;
      }
      techniques.push({ name: techName, params });
    }

    const requestBody = {
      circuit: circuitSelect.value,
      techniques,
      noise_level: parseFloat(document.getElementById("noise-level").value),
    };

    log("Sending POST /api/run");
    log("Request: " + JSON.stringify(requestBody));

    try {
      const resp = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      log("Response status: " + resp.status);

      const text = await resp.text();
      log("Response body: " + text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        log("Failed to parse JSON: " + parseErr.message, "error");
        errorMsg.textContent = `Error: Server returned invalid JSON. Status: ${resp.status}`;
        runBtn.disabled = false;
        runBtn.textContent = "Run Simulation";
        return;
      }

      if (!resp.ok || data.error) {
        log("Server error: " + (data.error || `HTTP ${resp.status}`), "error");
        errorMsg.textContent = `Error: ${data.error || `HTTP ${resp.status}`}`;
        runBtn.disabled = false;
        runBtn.textContent = "Run Simulation";
        return;
      }

      log("Simulation complete! Ideal=" + data.ideal_value.toFixed(4) +
          " Noisy=" + data.noisy_value.toFixed(4) +
          " Mitigated=" + data.mitigated_value.toFixed(4), "success");

      displayResults(data);
    } catch (e) {
      log("Fetch failed: " + e.message, "error");
      errorMsg.textContent = `Error: ${e.message}. Is the server running with Mitiq installed?`;
    }

    runBtn.disabled = false;
    runBtn.textContent = "Run Simulation";
  });

  function displayResults(data) {
    resultsPanel.style.display = "block";

    const hasTechniques = data.techniques_applied && data.techniques_applied.length > 0;

    const labels = ["Ideal", "Noisy"];
    const values = [data.ideal_value, data.noisy_value];
    const colors = ["#2c8a4c", "#c44"];

    if (hasTechniques) {
      const techLabel = data.techniques_applied.map((t) => t.toUpperCase()).join(" + ");
      labels.push(techLabel);
      values.push(data.mitigated_value);
      colors.push("#2c5f8a");
    }

    if (chart) chart.destroy();

    const ctx = document.getElementById("results-chart").getContext("2d");
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Expectation Value",
            data: values,
            backgroundColor: colors,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            title: { display: true, text: "Expectation Value" },
          },
        },
      },
    });

    // Summary table.
    let rows = `
      <tr><th>Stage</th><th>Value</th><th>Error from Ideal</th></tr>
      <tr><td>Ideal</td><td>${data.ideal_value.toFixed(6)}</td><td>0</td></tr>
      <tr><td>Noisy</td><td>${data.noisy_value.toFixed(6)}</td><td>${Math.abs(data.ideal_value - data.noisy_value).toFixed(6)}</td></tr>
    `;
    if (hasTechniques) {
      const techLabel = data.techniques_applied.map((t) => t.toUpperCase()).join(" + ");
      rows += `<tr><td>${techLabel}</td><td>${data.mitigated_value.toFixed(6)}</td><td>${Math.abs(data.ideal_value - data.mitigated_value).toFixed(6)}</td></tr>`;
    }
    resultSummary.innerHTML = `<table>${rows}</table>`;
  }
});
