WA.chartTheme = () => {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  return {
    grid: light ? "rgba(18,18,38,.08)" : "rgba(255,255,255,.08)",
    tick: light ? "#5b5d72" : "#a0a0b0",
    text: light ? "#121226" : "#ffffff"
  };
};

WA.chartAnim = () => {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return reduce
    ? { duration: 0 }
    : { duration: 1100, easing: "easeOutQuart" };
};

WA.baseChart = () => {
  const t = WA.chartTheme();
  Chart.defaults.color = t.tick;
  Chart.defaults.borderColor = t.grid;
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.animation = WA.chartAnim();
  return t;
};

WA.pctLegend = (canvasId, labels, values) => {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const host = canvas.closest(".chart-card") || canvas.parentElement;
  let el = host.querySelector(".chart-pct");
  if (!el) {
    el = document.createElement("div");
    el.className = "chart-pct";
    canvas.parentElement.after(el);
  }
  const total = values.reduce((s, v) => s + (Number(v) || 0), 0);
  if (!total) {
    el.innerHTML = `<span class="muted">Нет данных за период</span>`;
    return;
  }
  el.innerHTML = labels.map((label, i) => {
    const p = ((Number(values[i]) || 0) / total * 100).toFixed(1);
    return `<span style="--i:${i}"><b>${label}</b> ${p}%</span>`;
  }).join("");
};

WA.barPctPlugin = {
  id: "waBarPct",
  afterDatasetsDraw(chart) {
    if (chart.config.type !== "bar") return;
    const ds = chart.data.datasets[0];
    if (!ds || chart.data.datasets.length !== 1) return;
    const values = ds.data.map((v) => Number(v) || 0);
    const total = values.reduce((s, v) => s + v, 0);
    if (!total) return;
    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;
    const t = WA.chartTheme();
    ctx.save();
    ctx.fillStyle = t.text;
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    const horizontal = chart.options.indexAxis === "y";
    meta.data.forEach((bar, i) => {
      const p = (values[i] / total * 100).toFixed(1) + "%";
      if (horizontal) {
        ctx.textAlign = "left";
        ctx.fillText(p, bar.x + 8, bar.y);
      } else {
        ctx.textAlign = "center";
        ctx.fillText(p, bar.x, bar.y - 10);
      }
    });
    ctx.restore();
  }
};

WA.moneyHint = (value) => {
  const n = Number(value) || 0;
  return n >= 100 || n === 0 ? WA.money(n) : WA.money2(n);
};

WA.lineChart = (id, labels, data, label) => {
  const t = WA.baseChart();
  const values = data.map((v) => Number(v) || 0);
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const chart = new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: "#e94560",
        backgroundColor: "rgba(233,69,96,.18)",
        fill: true,
        tension: .35,
        pointRadius: values.length <= 14 ? 3 : 0,
        pointHoverRadius: 5,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: WA.chartAnim(),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const p = (ctx.parsed.y / total * 100).toFixed(1);
              return `${ctx.dataset.label}: ${WA.money2(ctx.parsed.y)} · ${p}%`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: t.tick }, grid: { color: t.grid } },
        y: { ticks: { color: t.tick }, grid: { color: t.grid } }
      }
    }
  });
  if (labels.length && labels.length <= 16) WA.pctLegend(id, labels, values);
  return chart;
};

WA.barValuePlugin = {
  id: "waBarValue",
  afterDatasetsDraw(chart) {
    if (chart.config.type !== "bar" || chart.options.indexAxis === "y") return;
    if (!chart.options.plugins?.waBarValue) return;
    const ctx = chart.ctx;
    const t = WA.chartTheme();
    ctx.save();
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = t.text;
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      meta.data.forEach((bar, i) => {
        const v = Number(ds.data[i]) || 0;
        ctx.fillText(WA.num(v), bar.x, bar.y - 3);
      });
    });
    ctx.restore();
  }
};

WA.barCompare = (id, labels, leads, sales) => {
  const t = WA.baseChart();
  const showNums = labels.length <= 16;
  const chart = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Регистрации", data: leads, backgroundColor: "#4c8dff", borderWidth: 0 },
        { label: "Депозиты", data: sales, backgroundColor: "#e94560", borderWidth: 0 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: WA.chartAnim(),
      layout: { padding: { top: showNums ? 18 : 0 } },
      plugins: {
        waBarValue: showNums,
        legend: {
          position: "top",
          labels: {
            color: t.text,
            font: { size: 12, weight: "600" },
            generateLabels: (c) => (c.data.datasets || []).map((ds, i) => ({
              text: ds.label,
              fillStyle: ds.backgroundColor,
              strokeStyle: "transparent",
              fontColor: t.text,
              hidden: false,
              datasetIndex: i
            }))
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${WA.num(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: t.tick }, grid: { display: false } },
        y: { ticks: { color: t.tick }, grid: { color: t.grid }, grace: "12%" }
      }
    },
    plugins: [WA.barValuePlugin]
  });
  const host = document.getElementById(id)?.closest(".chart-card") || document.getElementById(id)?.parentElement;
  if (host) {
    let el = host.querySelector(".chart-pct");
    if (!el) {
      el = document.createElement("div");
      el.className = "chart-pct";
      document.getElementById(id).parentElement.after(el);
    }
    el.innerHTML = labels.length <= 16
      ? labels.map((label, i) => `<span style="--i:${i}"><b>${label}</b> ${WA.num(leads[i])} рег. · ${WA.num(sales[i])} деп.</span>`).join("")
      : "";
  }
  return chart;
};

WA.hBar = (id, labels, data) => {
  const t = WA.baseChart();
  const values = data.map((v) => Number(v) || 0);
  const chart = new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Выручка", data: values, backgroundColor: "#e94560" }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: WA.chartAnim(),
      layout: { padding: { right: 42 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = values.reduce((s, v) => s + v, 0) || 1;
              const p = (ctx.parsed.x / total * 100).toFixed(1);
              return `${WA.money2(ctx.parsed.x)} · ${p}%`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: t.tick }, grid: { color: t.grid }, grace: "18%" },
        y: { ticks: { color: t.text }, grid: { display: false } }
      }
    },
    plugins: [WA.barPctPlugin]
  });
  WA.pctLegend(id, labels, values);
  return chart;
};

WA.piePctPlugin = {
  id: "waPiePct",
  afterDatasetsDraw(chart) {
    if (chart.config.type !== "doughnut" && chart.config.type !== "pie") return;
    const values = (chart.data.datasets[0]?.data || []).map((v) => Number(v) || 0);
    const total = values.reduce((s, v) => s + v, 0);
    if (!total) return;
    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;
    ctx.save();
    ctx.font = "700 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    meta.data.forEach((arc, i) => {
      const p = values[i] / total * 100;
      if (p < 3.5) return;
      const pos = arc.tooltipPosition();
      const text = p.toFixed(1) + "%";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(7,7,18,.55)";
      ctx.strokeText(text, pos.x, pos.y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, pos.x, pos.y);
    });
    ctx.restore();
  }
};

WA.pie = (id, labels, data) => {
  const t = WA.baseChart();
  const colors = ["#e94560","#00d26a","#4c8dff","#ffc107","#ff6b6b","#9b59b6","#1abc9c","#f39c12","#3498db","#95a5a6"];
  const values = data.map((v) => Number(v) || 0);
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const chart = new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { ...WA.chartAnim(), animateRotate: true, animateScale: true },
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: t.text,
            font: { size: 12, weight: "600" },
            padding: 10,
            generateLabels: (c) => (c.data.labels || []).map((label, i) => ({
              text: `${label}  ${((values[i] || 0) / total * 100).toFixed(1)}%`,
              fillStyle: colors[i % colors.length],
              strokeStyle: "transparent",
              fontColor: t.text,
              hidden: false,
              index: i
            }))
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const p = (ctx.parsed / total * 100).toFixed(1);
              return `${ctx.label}: ${WA.money2(ctx.parsed)} · ${p}%`;
            }
          }
        }
      }
    },
    plugins: [WA.piePctPlugin]
  });
  WA.pctLegend(id, labels, values);
  return chart;
};

WA.stackedArea = (id, labels, datasets) => {
  const t = WA.baseChart();
  const colors = ["#e94560","#4c8dff","#00d26a","#ffc107","#9b59b6"];
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: datasets.map((d, i) => ({
        label: d.label,
        data: d.data,
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length] + "55",
        fill: true,
        tension: .3,
        pointRadius: 0
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: WA.chartAnim(),
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "top" } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: t.tick }, grid: { color: t.grid } },
        y: { stacked: true, ticks: { color: t.tick }, grid: { color: t.grid } }
      }
    }
  });
};
