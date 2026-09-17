WA.chartTheme = () => {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  const cs = getComputedStyle(document.documentElement);
  const text = (cs.getPropertyValue("--text-primary") || "").trim() || (light ? "#121226" : "#ffffff");
  const tick = (cs.getPropertyValue("--text-secondary") || "").trim() || (light ? "#5b5d72" : "#c8c8d4");
  return {
    grid: light ? "rgba(18,18,38,.1)" : "rgba(255,255,255,.1)",
    tick,
    text
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
  Chart.defaults.color = t.text;
  Chart.defaults.borderColor = t.grid;
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  Chart.defaults.animation = WA.chartAnim();
  return t;
};

WA.legendInkPlugin = {
  id: "waLegendInk",
  beforeDraw(chart) {
    const ink = WA.chartTheme().text;
    const labels = chart.options.plugins?.legend?.labels;
    if (labels) labels.color = ink;
    const legend = chart.legend;
    if (legend?.legendItems) {
      legend.legendItems.forEach((item) => {
        item.fontColor = ink;
        item.color = ink;
      });
    }
  }
};

WA.destroyCharts = () => {
  document.querySelectorAll("canvas").forEach((el) => {
    const ch = typeof Chart !== "undefined" && Chart.getChart(el);
    if (ch) ch.destroy();
  });
  document.querySelectorAll(".chart-pct").forEach((el) => el.remove());
};

WA.paintCharts = () => {
  if (WA.redrawPage) {
    WA.redrawPage();
    return;
  }
  const t = WA.baseChart();
  document.querySelectorAll("canvas").forEach((el) => {
    const ch = Chart.getChart(el);
    if (!ch) return;
    const scales = ch.options.scales || {};
    if (ch.options.indexAxis === "y") {
      if (scales.y?.ticks) scales.y.ticks.color = t.text;
      if (scales.x?.ticks) scales.x.ticks.color = t.tick;
    } else {
      if (scales.x?.ticks) scales.x.ticks.color = t.tick;
      if (scales.y?.ticks) scales.y.ticks.color = t.tick;
    }
    Object.values(scales).forEach((s) => {
      if (s?.grid) s.grid.color = t.grid;
    });
    if (ch.options.plugins?.legend?.labels) {
      ch.options.plugins.legend.labels.color = t.text;
      if (typeof ch.options.plugins.legend.labels.generateLabels === "function") {
        const prev = ch.options.plugins.legend.labels.generateLabels;
        ch.options.plugins.legend.labels.generateLabels = (c) => {
          const items = prev(c) || [];
          return items.map((item) => ({ ...item, color: t.text, fontColor: t.text }));
        };
      }
    }
    ch.update();
  });
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
    return `<span style="--i:${i}"><b>${WA.esc(label)}</b> ${p}%</span>`;
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
      const text = chart.options.plugins?.waBarMoney ? `${WA.money2(values[i])} · ${p}` : p;
      if (horizontal) {
        ctx.textAlign = "left";
        ctx.fillText(text, bar.x + 8, bar.y);
      } else {
        ctx.textAlign = "center";
        ctx.fillText(text, bar.x, bar.y - 10);
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
        borderColor: "#c9a36a",
        backgroundColor: "rgba(201,163,106,.18)",
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
            generateLabels: (c) => (c.data.datasets || []).map((ds, i) => {
              const ink = WA.chartTheme().text;
              return {
                text: ds.label,
                fillStyle: ds.backgroundColor,
                strokeStyle: "transparent",
                color: ink,
                fontColor: ink,
                hidden: false,
                datasetIndex: i
              };
            })
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
    plugins: [WA.barValuePlugin, WA.legendInkPlugin]
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
      ? labels.map((label, i) => `<span style="--i:${i}"><b>${WA.esc(label)}</b> ${WA.num(leads[i])} рег. · ${WA.num(sales[i])} деп.</span>`).join("")
      : "";
  }
  return chart;
};

WA.hBar = (id, labels, data) => {
  const el = document.getElementById(id);
  if (!el) return;
  const prev = Chart.getChart(el);
  if (prev) prev.destroy();
  const wrap = el.parentElement;
  if (wrap && wrap.classList.contains("chart-wrap")) {
    const h = Math.max(260, labels.length * 40 + 28);
    wrap.style.height = h + "px";
    wrap.style.minHeight = h + "px";
  }
  const t = WA.baseChart();
  const values = data.map((v) => Number(v) || 0);
  const chart = new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Выручка", data: values, backgroundColor: "#c9a36a" }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: WA.chartAnim(),
      layout: { padding: { right: 92 } },
      plugins: {
        waBarMoney: true,
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
        y: { ticks: { color: t.text, autoSkip: false, maxTicksLimit: 30 }, grid: { display: false } }
      }
    },
    plugins: [WA.barPctPlugin]
  });
  WA.pctLegend(id, labels, values);
  requestAnimationFrame(() => chart.resize());
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
      const ink = WA.chartTheme();
      const light = document.documentElement.getAttribute("data-theme") === "light";
      ctx.lineWidth = 3;
      ctx.strokeStyle = light ? "rgba(255,255,255,.8)" : "rgba(7,7,18,.6)";
      ctx.strokeText(text, pos.x, pos.y);
      ctx.fillStyle = ink.text;
      ctx.fillText(text, pos.x, pos.y);
    });
    ctx.restore();
  }
};

WA.pie = (id, labels, data) => {
  const t = WA.baseChart();
  const colors = ["#c9a36a","#e94560","#4c8dff","#00d26a","#d4b483","#9b59b6","#1abc9c","#f39c12","#3498db","#95a5a6"];
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
            color: () => WA.chartTheme().text,
            font: { size: 12, weight: "600" },
            padding: 10,
            generateLabels: (c) => (c.data.labels || []).map((label, i) => {
              const ink = WA.chartTheme().text;
              return {
                text: `${label}  ${((values[i] || 0) / total * 100).toFixed(1)}%`,
                fillStyle: colors[i % colors.length],
                strokeStyle: "transparent",
                color: ink,
                fontColor: ink,
                hidden: false,
                index: i
              };
            })
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
    plugins: [WA.piePctPlugin, WA.legendInkPlugin]
  });
  WA.pctLegend(id, labels, values);
  return chart;
};

WA.stackedArea = (id, labels, datasets) => {
  const el = document.getElementById(id);
  if (!el) return;
  const prev = Chart.getChart(el);
  if (prev) prev.destroy();
  const t = WA.baseChart();
  const colors = ["#c9a36a","#4c8dff","#00d26a","#e94560","#ffc107","#9b59b6","#1abc9c","#f39c12","#3498db","#ff6b6b","#d4b483","#7eb6ff","#95a5a6","#e67e22","#2ecc71"];
  const one = labels.length <= 1;
  const axis = labels.length ? labels : ["—"];
  return new Chart(el, {
    type: one ? "bar" : "line",
    data: {
      labels: axis,
      datasets: datasets.map((d, i) => ({
        label: d.label,
        data: d.data.length ? d.data : [0],
        borderColor: colors[i % colors.length],
        backgroundColor: one ? colors[i % colors.length] : colors[i % colors.length] + "55",
        fill: !one,
        tension: .3,
        pointRadius: one ? 0 : (axis.length <= 16 ? 4 : 0),
        pointHoverRadius: 6,
        borderWidth: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: WA.chartAnim(),
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: one && datasets.length <= 8 ? 16 : 0 } },
      plugins: {
        waBarValue: one && datasets.length <= 8,
        legend: {
          position: "top",
          labels: {
            color: () => WA.chartTheme().text,
            font: { size: 12, weight: "600" }
          }
        }
      },
      scales: {
        x: { stacked: one, ticks: { maxTicksLimit: 8, color: t.tick }, grid: { color: one ? "transparent" : t.grid } },
        y: { stacked: true, ticks: { color: t.tick }, grid: { color: t.grid }, grace: "10%" }
      }
    },
    plugins: [WA.barValuePlugin, WA.legendInkPlugin]
  });
};
