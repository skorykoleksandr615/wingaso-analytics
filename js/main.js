WA.applyTheme();

WA.ready = async () => {
  await WA.loadCore();
  WA.renderHeader(document.body.dataset.page);
  const page = document.body.dataset.page;
  if (page === "overview") return WA.pageOverview();
  if (page === "brands") return WA.pageBrands();
  if (page === "countries") return WA.pageCountries();
  if (page === "apps") return WA.pageApps();
  if (page === "daily") return WA.pageDaily();
  if (page === "brand") return WA.pageBrand();
  if (page === "country") return WA.pageCountry();
  if (page === "app") return WA.pageApp();
};

WA.currentBounds = () => {
  const { range, from, to } = WA.rangeFrom();
  return WA.bounds(range, from, to);
};

WA.pageOverview = async () => {
  const b = WA.currentBounds();
  const cur = WA.sumDaily(WA.dailyIn(b.from, b.to));
  const prevB = WA.prevBounds(b.from, b.to);
  const prev = WA.sumDaily(WA.dailyIn(prevB.from, prevB.to));
  const days = WA.dailyIn(b.from, b.to);
  await WA.loadAgg();
  const rows = WA.aggIn(b.from, b.to);
  const countryCount = new Set(rows.map((r) => r.country)).size;
  const hasInst = rows.some((r) => r.hasInstalls);
  const instSum = rows.reduce((s, r) => s + (Number(r.installs) || 0), 0);
  document.getElementById("kpis").innerHTML = [
    ["Выручка", WA.money2(cur.revenue), WA.deltaHtml(cur.revenue, prev.revenue)],
    ["Регистрации", WA.num(cur.leads), WA.deltaHtml(cur.leads, prev.leads)],
    ["Инсталы", hasInst ? WA.num(instSum) : "—", ""],
    ["Депозиты", WA.num(cur.sales), WA.deltaHtml(cur.sales, prev.sales)],
    ["Конверсия", WA.pctTxt(cur.sales, cur.leads), WA.deltaHtml(WA.pct(cur.sales, cur.leads), WA.pct(prev.sales, prev.leads))],
    ["Страны", WA.num(countryCount), ""]
  ].map(([label, value, delta]) => `<article class="card kpi"><div class="label">${label}</div><div class="value">${value}</div>${delta}</article>`).join("");

  document.getElementById("updated").textContent = `Обновлено ${WA.updated()} · ${b.from} → ${b.to}`;
  WA.lineChart("rev-line", days.map((d) => d.date.slice(5)), days.map((d) => d.revenue), "Выручка");
  WA.barCompare("conv-bar", days.map((d) => d.date.slice(5)), days.map((d) => d.leads), days.map((d) => d.sales));

  const brands = WA.groupBy(rows, (r) => r.brand).sort((a, c) => c.revenue - a.revenue).slice(0, 10);
  const countries = WA.groupBy(rows, (r) => r.country).sort((a, c) => c.revenue - a.revenue).slice(0, 10);
  WA.hBar("brand-bar", brands.map((x) => x.key), brands.map((x) => x.revenue));
  WA.hBar("country-bar", countries.map((x) => x.key), countries.map((x) => x.revenue));
  const pie = brands.slice(0, 8);
  const other = brands.slice(8).reduce((s, x) => s + x.revenue, 0);
  const pieLabels = pie.map((x) => x.key);
  const pieData = pie.map((x) => x.revenue);
  if (other > 0) { pieLabels.push("Другие"); pieData.push(other); }
  WA.pie("brand-pie", pieLabels, pieData);
};

WA.brandRows = (from, to) => {
  const rows = WA.aggIn(from, to);
  return WA.groupBy(rows, (r) => r.brand).map((x) => ({
    brand: x.key,
    conversions: x.conversions,
    leads: x.leads,
    sales: x.sales,
    installs: x.installs,
    hasInstalls: x.hasInstalls,
    revenue: x.revenue,
    rate: WA.pct(x.sales, x.leads),
    countries: [...x.countries].sort().join(", "),
    countryCount: x.countries.size,
    spark: WA.spark(x.dates, from, to)
  }));
};

WA.pageBrands = async () => {
  await WA.loadAgg();
  const b = WA.currentBounds();
  document.getElementById("updated").textContent = `${b.from} → ${b.to}`;
  WA.resetTable("revenue");
  const all = WA.brandRows(b.from, b.to);
  const draw = () => {
    const q = WA.tableState.query.toLowerCase();
    const minRev = Number(WA.tableState.extra.minRev || 0);
    let rows = all.filter((r) => r.brand.toLowerCase().includes(q) && r.revenue >= minRev);
    rows = WA.sortRows(rows, WA.tableState.sortKey, WA.tableState.sortDir);
    const page = WA.paginate(rows);
    const body = document.querySelector("#brand-table tbody");
    body.innerHTML = page.rows.map((r, i) => `
      <tr data-href="${WA.href("/brand.html", { b: r.brand })}">
        <td>${(WA.tableState.page - 1) * WA.tableState.perPage + i + 1}</td>
        <td>${r.brand}</td>
        <td class="num">${WA.num(r.leads)}</td>
        <td class="num">${WA.instTxt(r)}</td>
        <td class="num">${WA.num(r.sales)}</td>
        <td class="num">${WA.money2(r.revenue)}</td>
        <td class="num">${r.rate.toFixed(1)}%</td>
        <td>${r.countryCount} · ${r.countries.split(", ").slice(0, 6).join(", ")}${r.countryCount > 6 ? "…" : ""}</td>
        <td>${WA.sparkSvg(r.spark)}</td>
      </tr>`).join("");
    document.getElementById("brand-cards").innerHTML = page.rows.map((r) => `
      <a class="card mobile-card" href="${WA.href("/brand.html", { b: r.brand })}">
        <strong>${r.brand}</strong>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(r.revenue)}</span></div>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(r.leads)} / ${WA.instTxt(r)} / ${WA.num(r.sales)}</span></div>
        <div class="row"><span class="muted">Конверсия</span><span class="mono">${r.rate.toFixed(1)}%</span></div>
      </a>`).join("");
    body.querySelectorAll("tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    WA.renderPager(document.getElementById("brand-pager"), page, draw);
    document.getElementById("brand-pager").oncsv = null;
    document.getElementById("brand-pager").addEventListener("csv", () => {
      WA.csv("wingaso-brands.csv", ["Бренд","Регистрации","Инсталы","Депозиты","Выручка","Конверсия","Страны"], rows.map((r) => [r.brand, r.leads, r.hasInstalls ? r.installs : "", r.sales, r.revenue.toFixed(2), r.rate.toFixed(1), r.countries]));
    }, { once: true });
  };
  WA.bindSort(document.getElementById("brand-table"), draw);
  document.getElementById("brand-search").addEventListener("input", (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); });
  document.getElementById("min-rev").addEventListener("input", (e) => { WA.tableState.extra.minRev = e.target.value; WA.tableState.page = 1; draw(); });
  draw();
};

WA.pageBrand = async () => {
  await WA.loadAgg();
  const params = new URLSearchParams(location.search);
  const name = WA.clean(params.get("b") || "");
  const country = (params.get("c") || "").toUpperCase();
  const b = WA.currentBounds();
  let rows = WA.aggIn(b.from, b.to).filter((r) => r.brand === name);
  if (country) rows = rows.filter((r) => r.country === country);
  const sum = rows.reduce((a, r) => {
    a.leads += r.leads || 0;
    a.sales += r.sales || 0;
    a.revenue += r.revenue || 0;
    if (r.hasInstalls) { a.hasInstalls = true; a.installs += Number(r.installs) || 0; }
    return a;
  }, { leads: 0, sales: 0, revenue: 0, installs: 0, hasInstalls: false });
  const back = country
    ? `<a href="${WA.href("/country.html", { c: country })}">← ${WA.flag(country)} ${country}</a>`
    : `<a href="${WA.href("/brands.html")}">← Бренды</a>`;
  const backEl = document.getElementById("back-link");
  if (backEl) backEl.innerHTML = back;
  document.getElementById("title").textContent = country ? `${name} · ${WA.countryName(country)}` : (name || "Бренд");
  document.getElementById("lead").textContent = `${WA.money2(sum.revenue)} · ${WA.num(sum.leads)} рег. · ${WA.instTxt(sum)} инст. · ${WA.num(sum.sales)} деп. · ${WA.pctTxt(sum.sales, sum.leads)} · ${b.from} → ${b.to}`;
  const byDay = WA.groupBy(rows, (r) => r.date).sort((a, c) => a.key.localeCompare(c.key));
  WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Выручка");
  const byCountry = WA.groupBy(rows, (r) => r.country).sort((a, c) => c.revenue - a.revenue);
  WA.hBar("country-bar", byCountry.slice(0, 12).map((x) => x.key), byCountry.slice(0, 12).map((x) => x.revenue));
  const countryBody = document.querySelector("#country-table tbody");
  if (countryBody) {
    countryBody.innerHTML = byCountry.map((x) => `
      <tr data-href="${WA.href("/brand.html", { b: name, c: x.key })}">
        <td><span class="pill">${WA.flag(x.key)} ${x.key}</span> ${WA.countryName(x.key)}</td>
        <td class="num">${WA.num(x.leads)}</td>
        <td class="num">${WA.instTxt(x)}</td>
        <td class="num">${WA.num(x.sales)}</td>
        <td class="num">${WA.money2(x.revenue)}</td>
        <td class="num">${WA.pctTxt(x.sales, x.leads)}</td>
      </tr>`).join("");
    countryBody.querySelectorAll("tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
  }
  const countryCards = document.getElementById("brand-country-cards");
  if (countryCards) {
    countryCards.innerHTML = byCountry.map((x) => `
      <a class="card mobile-card" href="${WA.href("/brand.html", { b: name, c: x.key })}">
        <strong>${WA.flag(x.key)} ${x.key} · ${WA.countryName(x.key)}</strong>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(x.leads)} / ${WA.instTxt(x)} / ${WA.num(x.sales)}</span></div>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(x.revenue)}</span></div>
      </a>`).join("");
  }

  const appTable = document.querySelector("#app-table tbody");
  const appCards = document.getElementById("brand-app-cards");
  const appHead = document.getElementById("apps-head");
  const note = document.getElementById("apps-note");

  const apps = WA.brandApps(name).sort((a, c) => c.revenue - a.revenue);
  if (country) {
    const pkgs = new Set(rows.filter((r) => r.package).map((r) => r.package));
    const scoped = pkgs.size ? apps.filter((a) => pkgs.has(a.package)) : apps;
    if (appHead) appHead.textContent = `Приложения бренда`;
    if (note) {
      note.hidden = false;
      note.textContent = pkgs.size
        ? `Пакеты с трафом в ${country}.`
        : `Выручка ${country} сверху — по бренду. Имена пакетов ниже; цифры пакета за всё время, в выгрузке нет прила × страна.`;
    }
    appTable.innerHTML = scoped.length ? scoped.map((a) => WA.appRowHtml(a, country)).join("") : `<tr><td colspan="8" class="empty">Нет приложений по этому бренду.</td></tr>`;
    if (appCards) {
      appCards.innerHTML = scoped.length ? scoped.map((a) => WA.appCardHtml(a, country)).join("") : `<article class="card mobile-card"><span class="muted">Нет приложений по этому бренду.</span></article>`;
    }
    WA.bindRowHrefs(appTable);
    return;
  }

  if (note) note.hidden = true;
  appTable.innerHTML = apps.length ? apps.map((a) => WA.appRowHtml(a)).join("") : `<tr><td colspan="8" class="empty">Нет приложений по этому бренду.</td></tr>`;
  if (appCards) {
    appCards.innerHTML = apps.length ? apps.map((a) => WA.appCardHtml(a)).join("") : `<article class="card mobile-card"><span class="muted">Нет приложений по этому бренду.</span></article>`;
  }
  WA.bindRowHrefs(appTable);
};

WA.appRowHtml = (a, country) => `
  <tr data-href="${WA.href("/app.html", { p: a.package, c: country || "" })}">
    <td class="mono">${a.package}</td>
    <td class="num">${WA.num(a.leads)}</td>
    <td class="num">${WA.instTxt(a)}</td>
    <td class="num">${WA.num(a.sales)}</td>
    <td class="num">${WA.money2(a.revenue)}</td>
    <td class="num">${a.countries}</td>
    <td>${a.first_date || ""}</td>
    <td>${a.last_date || ""}</td>
  </tr>`;

WA.appCardHtml = (a, country) => `
  <a class="card mobile-card" href="${WA.href("/app.html", { p: a.package, c: country || "" })}">
    <strong class="mono">${a.package}</strong>
    <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(a.leads)} / ${WA.instTxt(a)} / ${WA.num(a.sales)}</span></div>
    <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(a.revenue)}</span></div>
    <div class="row"><span class="muted">Страны</span><span class="mono">${a.countries}</span></div>
  </a>`;

WA.pageCountries = async () => {
  await WA.loadAgg();
  const b = WA.currentBounds();
  document.getElementById("updated").textContent = `${b.from} → ${b.to}`;
  WA.resetTable("revenue");
  const rowsIn = WA.aggIn(b.from, b.to);
  const topMap = new Map();
  for (const r of rowsIn) {
    const k = r.country;
    const inner = topMap.get(k) || new Map();
    inner.set(r.brand, (inner.get(r.brand) || 0) + (r.revenue || 0));
    topMap.set(k, inner);
  }
  const grouped = WA.groupBy(rowsIn, (r) => r.country).map((x) => {
    let topBrand = "—", topRev = -1;
    for (const [brand, rev] of (topMap.get(x.key) || [])) {
      if (rev > topRev) { topRev = rev; topBrand = brand; }
    }
    return {
      country: x.key,
      name: WA.countryName(x.key),
      region: WA.regionOf(x.key),
      conversions: x.conversions,
      leads: x.leads,
      sales: x.sales,
      installs: x.installs,
      hasInstalls: x.hasInstalls,
      revenue: x.revenue,
      rate: WA.pct(x.sales, x.leads),
      topBrand,
      spark: WA.spark(x.dates, b.from, b.to)
    };
  });
  const draw = () => {
    const q = WA.tableState.query.toLowerCase();
    const region = WA.tableState.extra.region || "";
    let rows = grouped.filter((r) => {
      const hit = r.country.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
      return hit && (!region || r.region === region);
    });
    rows = WA.sortRows(rows, WA.tableState.sortKey, WA.tableState.sortDir);
    const page = WA.paginate(rows);
    document.querySelector("#country-table tbody").innerHTML = page.rows.map((r, i) => `
      <tr data-href="${WA.href("/country.html", { c: r.country })}">
        <td>${(WA.tableState.page - 1) * WA.tableState.perPage + i + 1}</td>
        <td><span class="pill">${WA.flag(r.country)} ${r.country}</span> ${r.name}</td>
        <td class="num">${WA.num(r.leads)}</td>
        <td class="num">${WA.instTxt(r)}</td>
        <td class="num">${WA.num(r.sales)}</td>
        <td class="num">${WA.money2(r.revenue)}</td>
        <td class="num">${r.rate.toFixed(1)}%</td>
        <td>${r.topBrand}</td>
        <td>${WA.sparkSvg(r.spark)}</td>
      </tr>`).join("");
    document.getElementById("country-cards").innerHTML = page.rows.map((r) => `
      <a class="card mobile-card" href="${WA.href("/country.html", { c: r.country })}">
        <strong>${WA.flag(r.country)} ${r.country} · ${r.name}</strong>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(r.revenue)}</span></div>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(r.leads)} / ${WA.instTxt(r)} / ${WA.num(r.sales)}</span></div>
        <div class="row"><span class="muted">Топ-бренд</span><span>${r.topBrand}</span></div>
      </a>`).join("");
    document.querySelectorAll("#country-table tbody tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    WA.renderPager(document.getElementById("country-pager"), page, draw);
    document.getElementById("country-pager").addEventListener("csv", () => {
      WA.csv("wingaso-countries.csv", ["Страна","Название","Регистрации","Инсталы","Депозиты","Выручка","Конверсия","Топ-бренд"], rows.map((r) => [r.country, r.name, r.leads, r.hasInstalls ? r.installs : "", r.sales, r.revenue.toFixed(2), r.rate.toFixed(1), r.topBrand]));
    }, { once: true });
  };
  WA.bindSort(document.getElementById("country-table"), draw);
  document.getElementById("country-search").addEventListener("input", (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); });
  document.getElementById("region-filter").addEventListener("change", (e) => { WA.tableState.extra.region = e.target.value; WA.tableState.page = 1; draw(); });
  draw();
};

WA.pageCountry = async () => {
  await WA.loadAgg();
  const code = (new URLSearchParams(location.search).get("c") || "").toUpperCase();
  const b = WA.currentBounds();
  const rows = WA.aggIn(b.from, b.to).filter((r) => r.country === code);
  const sum = rows.reduce((a, r) => {
    a.leads += r.leads || 0; a.sales += r.sales || 0; a.revenue += r.revenue || 0;
    if (r.hasInstalls) { a.hasInstalls = true; a.installs += Number(r.installs) || 0; }
    return a;
  }, { leads: 0, sales: 0, revenue: 0, installs: 0, hasInstalls: false });
  document.getElementById("title").innerHTML = `${WA.flag(code)} ${code} · ${WA.countryName(code)}`;
  document.getElementById("lead").textContent = `${WA.money2(sum.revenue)} · ${WA.num(sum.leads)} рег. · ${WA.instTxt(sum)} инст. · ${WA.num(sum.sales)} деп. · ${WA.pctTxt(sum.sales, sum.leads)} · ${b.from} → ${b.to}`;
  const byDay = WA.groupBy(rows, (r) => r.date).sort((a, c) => a.key.localeCompare(c.key));
  WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Выручка");
  const byBrand = WA.groupBy(rows, (r) => r.brand).sort((a, c) => c.revenue - a.revenue);
  WA.hBar("brand-bar", byBrand.slice(0, 12).map((x) => x.key), byBrand.slice(0, 12).map((x) => x.revenue));
  document.querySelector("#brand-table tbody").innerHTML = byBrand.map((x) => `
    <tr data-href="${WA.href("/brand.html", { b: x.key, c: code })}">
      <td>${x.key}</td>
      <td class="pkg-cell">${WA.pkgListHtml(x.key, code)}</td>
      <td class="num">${WA.num(x.leads)}</td>
      <td class="num">${WA.instTxt(x)}</td>
      <td class="num">${WA.num(x.sales)}</td>
      <td class="num">${WA.money2(x.revenue)}</td>
      <td class="num">${WA.pctTxt(x.sales, x.leads)}</td>
    </tr>`).join("");
  WA.bindRowHrefs(document.querySelector("#brand-table tbody"));
  const brandCards = document.getElementById("country-brand-cards");
  if (brandCards) {
    brandCards.innerHTML = byBrand.map((x) => `
      <a class="card mobile-card" href="${WA.href("/brand.html", { b: x.key, c: code })}">
        <strong>${x.key}</strong>
        <div class="pkg-list">${WA.brandApps(x.key).sort((a, c) => c.revenue - a.revenue).map((a) => `<span class="mono">${a.package}</span>`).join("")}</div>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(x.revenue)}</span></div>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(x.leads)} / ${WA.instTxt(x)} / ${WA.num(x.sales)}</span></div>
        <div class="row"><span class="muted">Конверсия</span><span class="mono">${WA.pctTxt(x.sales, x.leads)}</span></div>
      </a>`).join("");
  }
};

WA.pageApps = async () => {
  const b = WA.currentBounds();
  document.getElementById("updated").textContent = `${b.from} → ${b.to} · цифры приложений за всё время, фильтр по активности`;
  WA.resetTable("revenue");
  const all = WA.apps.map((a) => ({ ...a, rate: WA.pct(a.sales, a.leads) }));
  const draw = () => {
    const q = WA.tableState.query.toLowerCase();
    const active = WA.tableState.extra.active === "7";
    const from7 = WA.bounds("7").from;
    let rows = all.filter((a) => {
      const hit = a.package.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q);
      const overlap = (!a.last_date || a.last_date >= b.from) && (!a.first_date || a.first_date <= b.to);
      const last = a.last_date || "";
      return hit && overlap && (!active || last >= from7);
    });
    rows = WA.sortRows(rows, WA.tableState.sortKey, WA.tableState.sortDir);
    const page = WA.paginate(rows);
    document.querySelector("#app-table tbody").innerHTML = page.rows.map((a) => `
      <tr data-href="${WA.href("/app.html", { p: a.package })}">
        <td class="mono">${a.package}</td>
        <td><a href="${WA.href("/brand.html", { b: a.brand })}">${a.brand}</a></td>
        <td class="num">${WA.num(a.leads)}</td>
        <td class="num">${WA.instTxt(a)}</td>
        <td class="num">${WA.num(a.sales)}</td>
        <td class="num">${WA.money2(a.revenue)}</td>
        <td class="num">${a.countries}</td>
        <td>${a.first_date || ""}</td>
        <td>${a.last_date || ""}</td>
      </tr>`).join("");
    document.getElementById("app-cards").innerHTML = page.rows.map((a) => `
      <a class="card mobile-card" href="${WA.href("/app.html", { p: a.package })}">
        <strong class="mono">${a.package}</strong>
        <div class="row"><span class="muted">Бренд</span><span>${a.brand}</span></div>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(a.leads)} / ${WA.instTxt(a)} / ${WA.num(a.sales)}</span></div>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(a.revenue)}</span></div>
      </a>`).join("");
    document.querySelectorAll("#app-table tbody tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    WA.renderPager(document.getElementById("app-pager"), page, draw);
    document.getElementById("app-pager").addEventListener("csv", () => {
      WA.csv("wingaso-apps.csv", ["Пакет","Бренд","Регистрации","Инсталы","Депозиты","Выручка","Страны","Первый","Последний"], rows.map((a) => [a.package, a.brand, a.leads, WA.hasNum(a.installs) ? a.installs : "", a.sales, a.revenue, a.countries, a.first_date, a.last_date]));
    }, { once: true });
  };
  WA.bindSort(document.getElementById("app-table"), draw);
  document.getElementById("app-search").addEventListener("input", (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); });
  document.getElementById("active-filter").addEventListener("change", (e) => { WA.tableState.extra.active = e.target.value; WA.tableState.page = 1; draw(); });
  draw();
};

WA.pageApp = async () => {
  await WA.loadAgg();
  const params = new URLSearchParams(location.search);
  const pkg = params.get("p") || "";
  const countryHint = (params.get("c") || "").toUpperCase();
  const b = WA.currentBounds();
  const found = WA.appCountryRows(pkg, b.from, b.to);
  const app = found.app || WA.apps.find((a) => a.package === pkg);
  const back = app
    ? `<a href="${WA.href("/brand.html", { b: app.brand, c: countryHint })}">← ${app.brand}</a>`
    : `<a href="${WA.href("/apps.html")}">← Приложения</a>`;
  const backEl = document.getElementById("back-link");
  if (backEl) backEl.innerHTML = back;
  document.getElementById("title").textContent = pkg || "Приложение";
  if (!app) {
    document.getElementById("lead").textContent = "Пакет не найден в выгрузке.";
    return;
  }
  document.getElementById("lead").textContent = `${app.brand} · пакет за всё время: ${WA.money2(app.revenue)} · ${WA.num(app.leads)} рег. · ${WA.instTxt(app)} инст. · ${WA.num(app.sales)} деп. · графики ${b.from} → ${b.to}`;
  const kpis = document.getElementById("kpis");
  if (kpis) {
    kpis.innerHTML = [
      ["Регистрации", WA.num(app.leads)],
      ["Инсталы", WA.instTxt(app)],
      ["Депозиты", WA.num(app.sales)],
      ["Выручка", WA.money2(app.revenue)],
      ["Конверсия", WA.pctTxt(app.sales, app.leads)],
      ["Страны (всего)", WA.num(app.countries)]
    ].map(([label, value]) => `<article class="card kpi"><div class="label">${label}</div><div class="value">${value}</div></article>`).join("");
  }

  const grouped = WA.groupBy(found.rows, (r) => r.country).sort((a, c) => c.revenue - a.revenue);
  const byDay = WA.groupBy(found.rows, (r) => r.date).sort((a, c) => a.key.localeCompare(c.key));
  const note = document.getElementById("geo-note");
  if (found.mode === "package") {
    if (note) { note.hidden = false; note.textContent = "Разбивка по этой приле из выгрузки."; }
    WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Выручка");
    WA.hBar("country-bar", grouped.slice(0, 12).map((x) => x.key), grouped.slice(0, 12).map((x) => x.revenue));
  } else if (found.mode === "brand") {
    if (note) { note.hidden = false; note.textContent = "У бренда одно приложение — страны взяты с уровня бренда."; }
    WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Выручка");
    WA.hBar("country-bar", grouped.slice(0, 12).map((x) => x.key), grouped.slice(0, 12).map((x) => x.revenue));
  } else {
    if (note) {
      note.hidden = false;
      note.textContent = "В текущей выгрузке нет прила × страна. Нельзя честно разложить этот пакет по гео — у бренда несколько приложений. Ниже пусто, без чужих стран.";
    }
    WA.lineChart("rev-line", [], [], "Выручка");
    WA.hBar("country-bar", [], []);
  }

  const body = document.querySelector("#country-table tbody");
  if (!grouped.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty">Нет разбивки по странам для этой прилы.</td></tr>`;
    const cards = document.getElementById("app-country-cards");
    if (cards) cards.innerHTML = `<article class="card mobile-card"><span class="muted">Нет разбивки по странам для этой прилы.</span></article>`;
    return;
  }
  body.innerHTML = grouped.map((x) => `
    <tr data-href="${WA.href("/country.html", { c: x.key })}">
      <td><span class="pill">${WA.flag(x.key)} ${x.key}</span> ${WA.countryName(x.key)}</td>
      <td class="num">${WA.num(x.leads)}</td>
      <td class="num">${WA.instTxt(x)}</td>
      <td class="num">${WA.num(x.sales)}</td>
      <td class="num">${WA.money2(x.revenue)}</td>
      <td class="num">${WA.pctTxt(x.sales, x.leads)}</td>
    </tr>`).join("");
  body.querySelectorAll("tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
  const cards = document.getElementById("app-country-cards");
  if (cards) {
    cards.innerHTML = grouped.map((x) => `
      <a class="card mobile-card" href="${WA.href("/country.html", { c: x.key })}">
        <strong>${WA.flag(x.key)} ${x.key} · ${WA.countryName(x.key)}</strong>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(x.leads)} / ${WA.instTxt(x)} / ${WA.num(x.sales)}</span></div>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(x.revenue)}</span></div>
      </a>`).join("");
  }
};

WA.pageDaily = async () => {
  await WA.loadAgg();
  const b = WA.currentBounds();
  const days = WA.dailyIn(b.from, b.to);
  document.getElementById("updated").textContent = `${b.from} → ${b.to}`;
  const agg = WA.aggIn(b.from, b.to);
  const dayRows = days.map((d, i) => {
    const prev = days[i - 1];
    const top = WA.groupBy(agg.filter((r) => r.date === d.date), (r) => r.brand).sort((a, c) => c.revenue - a.revenue)[0];
    const change = prev ? WA.delta(d.revenue, prev.revenue) : 0;
    return { ...d, topBrand: top?.key || "—", change, alert: Math.abs(change) >= 35 };
  });
  document.querySelector("#daily-table tbody").innerHTML = dayRows.map((d) => `
    <tr class="${d.alert ? "alert" : ""}">
      <td>${d.date}</td>
      <td class="num">${WA.num(d.leads)}</td>
      <td class="num">${WA.hasNum(d.installs) ? WA.num(d.installs) : "—"}</td>
      <td class="num">${WA.num(d.sales)}</td>
      <td class="num">${WA.money2(d.revenue)}</td>
      <td>${d.topBrand}</td>
      <td class="num ${d.change >= 0 ? "delta up" : "delta down"}">${d.change >= 0 ? "↑" : "↓"} ${Math.abs(d.change).toFixed(1)}%</td>
    </tr>`).join("");
  const dailyCards = document.getElementById("daily-cards");
  if (dailyCards) {
    dailyCards.innerHTML = dayRows.map((d) => `
      <article class="card mobile-card ${d.alert ? "alert" : ""}">
        <strong>${d.date}</strong>
        <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(d.revenue)}</span></div>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(d.leads)} / ${WA.hasNum(d.installs) ? WA.num(d.installs) : "—"} / ${WA.num(d.sales)}</span></div>
        <div class="row"><span class="muted">Топ-бренд</span><span>${d.topBrand}</span></div>
        <div class="row"><span class="muted">к пред. дню</span><span class="mono ${d.change >= 0 ? "delta up" : "delta down"}">${d.change >= 0 ? "↑" : "↓"} ${Math.abs(d.change).toFixed(1)}%</span></div>
      </article>`).join("");
  }
  const labels = days.map((d) => d.date.slice(5));
  const top5 = WA.groupBy(agg, (r) => r.brand).sort((a, c) => c.revenue - a.revenue).slice(0, 5);
  const datasets = top5.map((brand) => ({
    label: brand.key,
    data: days.map((d) => brand.dates[d.date] || 0)
  }));
  WA.stackedArea("stack-area", labels, datasets);
};

document.addEventListener("DOMContentLoaded", () => {
  WA.ready().catch((err) => {
    const host = document.getElementById("content") || document.body;
    const box = document.createElement("div");
    box.className = "wrap empty";
    box.textContent = "Не удалось загрузить дашборд: " + err.message;
    host.prepend(box);
  });
});
