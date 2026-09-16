WA.renderHeader = (active) => {
  const { range, from, to } = WA.rangeFrom();
  const el = document.getElementById("app-header");
  if (!el) return;
  el.innerHTML = `
    <a class="brand" href="/">
      <img src="/assets/eagle-mark.png?v=3" alt="WingAso">
      <span class="brand-copy">
        <span class="brand-name">WingAso</span>
        <span class="brand-tag">Analytics</span>
      </span>
    </a>
    <nav class="nav">
      <a href="/" class="${active === "overview" ? "active" : ""}">Overview</a>
      <a href="/brands.html" class="${active === "brands" ? "active" : ""}">Brands</a>
      <a href="/countries.html" class="${active === "countries" ? "active" : ""}">Countries</a>
      <a href="/apps.html" class="${active === "apps" ? "active" : ""}">Apps</a>
      <a href="/daily.html" class="${active === "daily" ? "active" : ""}">Daily</a>
    </nav>
    <div class="header-tools">
      <select class="period-select" id="range-select">
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="all">All time</option>
        <option value="custom">Custom range</option>
      </select>
      <div class="custom-range ${range === "custom" ? "open" : ""}" id="custom-range">
        <input class="field" type="date" id="from-date">
        <input class="field" type="date" id="to-date">
      </div>
      <button class="icon-btn" id="theme-btn" title="Toggle theme" type="button">◐</button>
      <a class="logout-link" href="/logout">Logout</a>
    </div>
  `;
  const sel = document.getElementById("range-select");
  sel.value = range;
  document.getElementById("from-date").value = from || WA.meta.period.from;
  document.getElementById("to-date").value = to || WA.meta.period.to;
  sel.addEventListener("change", () => {
    const next = sel.value;
    document.getElementById("custom-range").classList.toggle("open", next === "custom");
    if (next !== "custom") {
      WA.setRange(next);
      location.reload();
    }
  });
  const applyCustom = () => {
    if (sel.value !== "custom") return;
    WA.setRange("custom", document.getElementById("from-date").value, document.getElementById("to-date").value);
    location.reload();
  };
  document.getElementById("from-date").addEventListener("change", applyCustom);
  document.getElementById("to-date").addEventListener("change", applyCustom);
  document.getElementById("theme-btn").addEventListener("click", WA.toggleTheme);
};

WA.applyTheme = () => {
  const theme = localStorage.getItem("wa-theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
};

WA.toggleTheme = () => {
  const next = (localStorage.getItem("wa-theme") || "dark") === "dark" ? "light" : "dark";
  localStorage.setItem("wa-theme", next);
  WA.applyTheme();
};

WA.deltaHtml = (cur, prev) => {
  if (!prev && prev !== 0) return "";
  const d = WA.delta(cur, prev);
  const cls = d >= 0 ? "up" : "down";
  const arrow = d >= 0 ? "↑" : "↓";
  return `<div class="delta ${cls}">${arrow} ${Math.abs(d).toFixed(1)}% vs prev</div>`;
};

WA.sparkSvg = (values) => {
  if (!values.length) return "";
  const w = 92, h = 28, pad = 2;
  const max = Math.max(...values, 1);
  const step = (w - pad * 2) / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - (v / max) * (h - pad * 2)).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline fill="none" stroke="#e94560" stroke-width="1.6" points="${pts}"/></svg>`;
};

WA.flag = (code) => `<img class="flag" alt="${code}" src="https://flagcdn.com/24x18/${String(code).toLowerCase()}.png">`;

WA.updated = () => {
  const t = WA.meta?.lastUpdate;
  return t ? new Date(t).toLocaleString() : "";
};
