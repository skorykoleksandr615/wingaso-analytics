WA.renderHeader = (active) => {
  const { range, from, to } = WA.rangeFrom();
  const b = WA.bounds(range, from, to);
  const el = document.getElementById("app-header");
  if (!el) return;
  el.innerHTML = `
    <a class="brand" href="${WA.href("/")}">
      <img src="/assets/eagle-mark.png?v=5" alt="WingAso">
      <span class="brand-copy">
        <span class="brand-name">WingAso</span>
        <span class="brand-tag">Аналитика</span>
      </span>
    </a>
    <nav class="nav">
      <a href="${WA.href("/")}" class="${active === "overview" ? "active" : ""}">Обзор</a>
      <a href="${WA.href("/brands.html")}" class="${active === "brands" ? "active" : ""}">Бренды</a>
      <a href="${WA.href("/countries.html")}" class="${active === "countries" ? "active" : ""}">Страны</a>
      <a href="${WA.href("/apps.html")}" class="${active === "apps" ? "active" : ""}">Приложения</a>
      <a href="${WA.href("/daily.html")}" class="${active === "daily" ? "active" : ""}">По дням</a>
    </nav>
    <div class="header-tools">
      <select class="period-select" id="range-select">
        <option value="yesterday">Вчера</option>
        <option value="7">7 дней</option>
        <option value="30">30 дней</option>
        <option value="90">90 дней</option>
        <option value="all">Всё время</option>
        <option value="custom">Диапазон</option>
      </select>
      <div class="custom-range open" id="custom-range">
        <input class="field" type="date" id="from-date" aria-label="С даты">
        <span class="range-sep">—</span>
        <input class="field" type="date" id="to-date" aria-label="По дату">
      </div>
      <button class="icon-btn" id="theme-btn" title="Тема" type="button">◐</button>
      <a class="logout-link" href="/logout">Выйти</a>
    </div>
  `;
  const sel = document.getElementById("range-select");
  const fromEl = document.getElementById("from-date");
  const toEl = document.getElementById("to-date");
  sel.value = range;
  fromEl.value = range === "custom" && from ? from : b.from;
  toEl.value = range === "custom" && to ? to : b.to;
  const min = WA.meta?.period?.from || "";
  const max = range === "yesterday" ? b.to : (WA.meta?.period?.to || "");
  if (min) { fromEl.min = min; toEl.min = min; }
  if (max) { fromEl.max = max; toEl.max = max; }
  sel.addEventListener("change", () => {
    const next = sel.value;
    if (next === "custom") {
      WA.setRange("custom", fromEl.value, toEl.value);
    } else {
      WA.setRange(next);
    }
    location.reload();
  });
  const applyCustom = () => {
    if (!fromEl.value || !toEl.value) return;
    sel.value = "custom";
    WA.setRange("custom", fromEl.value, toEl.value);
    location.reload();
  };
  fromEl.addEventListener("change", applyCustom);
  toEl.addEventListener("change", applyCustom);
  document.getElementById("theme-btn").addEventListener("click", WA.toggleTheme);
};

WA.renderAtmosphere = () => {
  if (!document.body || document.body.classList.contains("login-body")) return;
  if (document.querySelector(".dash-fx")) return;
  const fx = document.createElement("div");
  fx.className = "dash-fx";
  fx.setAttribute("aria-hidden", "true");
  fx.innerHTML = `
    <div class="dash-eagle"><img src="/assets/eagle-battle.jpg" alt=""></div>
    <div class="dash-embers"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="dash-sheen"></div>`;
  document.body.prepend(fx);
};

WA.applyTheme = () => {
  const theme = localStorage.getItem("wa-theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  WA.renderAtmosphere();
};

WA.toggleTheme = () => {
  const next = (localStorage.getItem("wa-theme") || "dark") === "dark" ? "light" : "dark";
  localStorage.setItem("wa-theme", next);
  WA.applyTheme();
  if (WA.paintCharts) WA.paintCharts();
};

WA.deltaHtml = (cur, prev) => {
  if (!prev && prev !== 0) return "";
  const d = WA.delta(cur, prev);
  const cls = d >= 0 ? "up" : "down";
  const arrow = d >= 0 ? "↑" : "↓";
  return `<div class="delta ${cls}">${arrow} ${Math.abs(d).toFixed(1)}% к пред.</div>`;
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
  return t ? new Date(t).toLocaleString("ru-RU") : "";
};
