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
      <a href="${WA.href("/dead.html")}" class="${active === "dead" ? "active" : ""}">Беспонт</a>
      <a href="${WA.href("/daily.html")}" class="${active === "daily" ? "active" : ""}">По дням</a>
      <a href="${WA.href("/search.html")}" class="${active === "search" ? "active" : ""}">Поиск</a>
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
        <label class="date-field">
          <input class="field" type="date" id="from-date" aria-label="С даты">
          <span class="date-ico" aria-hidden="true"></span>
        </label>
        <span class="range-sep">—</span>
        <label class="date-field">
          <input class="field" type="date" id="to-date" aria-label="По дату">
          <span class="date-ico" aria-hidden="true"></span>
        </label>
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

WA.bindGlobalSearch = () => {
  const input = document.getElementById("q-search");
  const drop = document.getElementById("q-drop");
  if (!input || !drop || input.dataset.bound === "1") return;
  input.dataset.bound = "1";
  const params = new URLSearchParams(location.search);
  if (params.get("q") && !input.value) input.value = params.get("q");
  let idx = -1;
  let hits = [];
  const hide = () => {
    drop.hidden = true;
    drop.innerHTML = "";
    idx = -1;
  };
  const paint = () => {
    drop.querySelectorAll("[data-i]").forEach((el) => el.classList.toggle("active", Number(el.dataset.i) === idx));
  };
  const go = (hit) => {
    if (!hit) return;
    location.href = WA.searchHref(hit);
  };
  const all = (q) => {
    location.href = WA.href("/search.html", { q });
  };
  const render = () => {
    const q = input.value.trim();
    hits = WA.searchHits(q, 12);
    idx = hits.length ? 0 : -1;
    if (!q) {
      hide();
      return;
    }
    const rows = hits.map((h, i) => {
      const kind = h.type === "brand" ? "бренд" : "пакет";
      const title = h.type === "brand" ? WA.esc(h.brand) : WA.esc(h.package);
      const sub = h.type === "brand"
        ? `${WA.num(h.apps || 0)} прил. · ${WA.money2(h.revenue)}`
        : `${WA.esc(h.brand || "—")} · ${WA.money2(h.revenue)}`;
      return `<a class="search-hit${i === 0 ? " active" : ""}" data-i="${i}" href="${WA.searchHref(h)}"><span class="kind">${kind}</span><span class="hit-title">${title}</span><span class="hit-meta">${sub}</span></a>`;
    }).join("");
    drop.innerHTML = `${rows || `<div class="search-empty">Ничего не найдено</div>`}<a class="search-more" href="${WA.href("/search.html", { q })}">Все результаты и полная инфа →</a>`;
    drop.hidden = false;
  };
  input.addEventListener("input", render);
  input.addEventListener("focus", () => {
    if (input.value.trim()) render();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hide();
      input.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!hits.length) return;
      idx = (idx + 1) % hits.length;
      paint();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hits.length) return;
      idx = (idx - 1 + hits.length) % hits.length;
      paint();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      if (idx >= 0 && hits[idx] && !e.shiftKey) go(hits[idx]);
      else all(q);
    }
  });
  drop.addEventListener("mousedown", (e) => {
    const hit = e.target.closest("[data-i]");
    if (hit) idx = Number(hit.dataset.i);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#global-search")) hide();
  });
};

WA.renderAtmosphere = () => {
  if (!document.body || document.body.classList.contains("login-body")) return;
  if (document.querySelector(".dash-fx")) return;
  const fx = document.createElement("div");
  fx.className = "dash-fx";
  fx.setAttribute("aria-hidden", "true");
  fx.innerHTML = `<div class="dash-embers"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
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
