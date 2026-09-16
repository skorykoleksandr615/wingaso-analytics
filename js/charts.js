WA.chartTheme = () => {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  return {
    grid: light ? "rgba(18,18,38,.08)" : "rgba(255,255,255,.08)",
    tick: light ? "#5b5d72" : "#a0a0b0",
    text: light ? "#121226" : "#ffffff"
  };
};

WA.baseChart = () => {
  const t = WA.chartTheme();
  Chart.defaults.color = t.tick;
  Chart.defaults.borderColor = t.grid;
  Chart.defaults.font.family = "Inter, system-ui, sans-serif";
  return t;
};

WA.lineChart = (id, labels, data, label) => {
  const t = WA.baseChart();
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: "#e94560",
        backgroundColor: "rgba(233,69,96,.18)",
        fill: true,
        tension: .35,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: t.tick }, grid: { color: t.grid } },
        y: { ticks: { color: t.tick }, grid: { color: t.grid } }
      }
    }
  });
};

WA.barCompare = (id, labels, leads, sales) => {
  const t = WA.baseChart();
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Leads", data: leads, backgroundColor: "#16213e", borderColor: "#2a2a4a", borderWidth: 1 },
        { label: "Sales", data: sales, backgroundColor: "#e94560" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: t.tick }, grid: { display: false } },
        y: { ticks: { color: t.tick }, grid: { color: t.grid } }
      }
    }
  });
};

WA.hBar = (id, labels, data) => {
  const t = WA.baseChart();
  return new Chart(document.getElementById(id), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Revenue", data, backgroundColor: "#e94560" }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: t.tick }, grid: { color: t.grid } },
        y: { ticks: { color: t.text }, grid: { display: false } }
      }
    }
  });
};

WA.pie = (id, labels, data) => {
  WA.baseChart();
  const colors = ["#e94560","#00d26a","#4c8dff","#ffc107","#ff6b6b","#9b59b6","#1abc9c","#f39c12","#3498db","#95a5a6"];
  return new Chart(document.getElementById(id), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } }
    }
  });
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
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "top" } },
      scales: {
        x: { ticks: { maxTicksLimit: 8, color: t.tick }, grid: { color: t.grid } },
        y: { stacked: true, ticks: { color: t.tick }, grid: { color: t.grid } }
      }
    }
  });
};
