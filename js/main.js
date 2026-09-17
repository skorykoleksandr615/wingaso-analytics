WA.applyTheme();

WA.redrawPage = async () => {
  WA.destroyCharts();
  const page = document.body.dataset.page;
  if (page === "overview") return WA.pageOverview();
  if (page === "brands") return WA.pageBrands();
  if (page === "countries") return WA.pageCountries();
  if (page === "apps") return WA.pageApps();
  if (page === "daily") return WA.pageDaily();
  if (page === "brand") return WA.pageBrand();
  if (page === "country") return WA.pageCountry();
  if (page === "app") return WA.pageApp();
  if (page === "dead") return WA.pageDead();
};

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
  if (page === "dead") return WA.pageDead();
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
  const instCur = cur.hasInstalls ? cur.installs : (rows.some((r) => r.hasInstalls) ? rows.reduce((s, r) => s + (Number(r.installs) || 0), 0) : null);
  document.getElementById("kpis").innerHTML = [
    ["Выручка", WA.money2(cur.revenue), WA.deltaHtml(cur.revenue, prev.revenue)],
    ["Регистрации", WA.num(cur.leads), WA.deltaHtml(cur.leads, prev.leads)],
    ["Инсталы", instCur == null ? "—" : WA.num(instCur), cur.hasInstalls ? WA.deltaHtml(cur.installs, prev.installs) : ""],
    ["Депозиты", WA.num(cur.sales), WA.deltaHtml(cur.sales, prev.sales)],
    ["Конверсия", WA.pctTxt(cur.sales, cur.leads), WA.deltaHtml(WA.pct(cur.sales, cur.leads), WA.pct(prev.sales, prev.leads))],
    ["Страны", WA.num(countryCount), ""]
  ].map(([label, value, delta]) => `<article class="card kpi"><div class="label">${label}</div><div class="value">${value}</div>${delta}</article>`).join("");

  document.getElementById("updated").textContent = `Обновлено ${WA.updated()} · ${b.from} → ${b.to}`;
  WA.lineChart("rev-line", days.map((d) => d.date.slice(5)), days.map((d) => d.revenue), "Выручка");
  WA.barCompare("conv-bar", days.map((d) => d.date.slice(5)), days.map((d) => d.leads), days.map((d) => d.sales));

  const period = WA.periodLabel(b.from, b.to);
  const topBrandsTitle = document.getElementById("top-brands-title");
  const topCountriesTitle = document.getElementById("top-countries-title");
  const pieTitle = document.getElementById("pie-title");
  if (topBrandsTitle) topBrandsTitle.textContent = `Топ-10 брендов · ${period}`;
  if (topCountriesTitle) topCountriesTitle.textContent = `Топ-10 стран · ${period}`;
  if (pieTitle) pieTitle.textContent = `Распределение выручки · ${period}`;
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
    let rows = all.filter((r) => r.brand.toLowerCase().includes(q) && r.revenue >= minRev && WA.matchZero(r, WA.tableState.extra));
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
  WA.bindZeroFilters(document.getElementById("zero-filters"), WA.tableState.extra, draw);
  document.getElementById("brand-search").oninput = (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); };
  document.getElementById("min-rev").oninput = (e) => { WA.tableState.extra.minRev = e.target.value; WA.tableState.page = 1; draw(); };
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
  const byCountry = WA.groupBy(rows, (r) => r.country).map((x) => ({
    country: x.key, leads: x.leads, installs: x.installs, hasInstalls: x.hasInstalls,
    sales: x.sales, revenue: x.revenue, rate: WA.pct(x.sales, x.leads)
  }));
  WA.hBar("country-bar", [...byCountry].sort((a, c) => c.revenue - a.revenue).slice(0, 12).map((x) => x.country), [...byCountry].sort((a, c) => c.revenue - a.revenue).slice(0, 12).map((x) => x.revenue));
  const countryState = { key: "revenue", dir: "desc" };
  const drawCountries = () => {
    const list = WA.sortRows(byCountry, countryState.key, countryState.dir);
    WA.markSort(document.getElementById("country-table"), countryState.key, countryState.dir);
    const countryBody = document.querySelector("#country-table tbody");
    if (countryBody) {
      countryBody.innerHTML = list.map((x) => `
        <tr data-href="${WA.href("/brand.html", { b: name, c: x.country })}">
          <td><span class="pill">${WA.flag(x.country)} ${x.country}</span> ${WA.countryName(x.country)}</td>
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
      countryCards.innerHTML = list.map((x) => `
        <a class="card mobile-card" href="${WA.href("/brand.html", { b: name, c: x.country })}">
          <strong>${WA.flag(x.country)} ${x.country} · ${WA.countryName(x.country)}</strong>
          <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(x.leads)} / ${WA.instTxt(x)} / ${WA.num(x.sales)}</span></div>
          <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(x.revenue)}</span></div>
        </a>`).join("");
    }
  };
  WA.bindTableSort(document.getElementById("country-table"), countryState, drawCountries);
  drawCountries();

  const appTable = document.querySelector("#app-table tbody");
  const appCards = document.getElementById("brand-app-cards");
  const appHead = document.getElementById("apps-head");
  const note = document.getElementById("apps-note");
  const appState = { key: "revenue", dir: "desc" };
  let appRows = [];
  let appCountry = "";
  if (country) {
    const scoped = WA.appsForBrandCountry(name, country, b.from, b.to, rows, sum);
    if (appHead) appHead.textContent = `Приложения в ${country}`;
    if (note) {
      note.hidden = !scoped.note;
      if (scoped.note) note.textContent = scoped.note;
    }
    appRows = scoped.apps;
    appCountry = country;
  } else {
    if (note) note.hidden = true;
    appRows = WA.brandApps(name);
  }
  const drawApps = () => {
    const list = WA.sortRows(appRows, appState.key, appState.dir);
    WA.markSort(document.getElementById("app-table"), appState.key, appState.dir);
    appTable.innerHTML = list.length
      ? list.map((a) => WA.appRowHtml(a, appCountry)).join("")
      : `<tr><td colspan="8" class="empty">${appCountry ? `Нет приложений с трафом в ${appCountry} за этот период.` : "Нет приложений по этому бренду."}</td></tr>`;
    if (appCards) {
      appCards.innerHTML = list.length
        ? list.map((a) => WA.appCardHtml(a, appCountry)).join("")
        : `<article class="card mobile-card"><span class="muted">${appCountry ? `Нет приложений с трафом в ${appCountry} за этот период.` : "Нет приложений по этому бренду."}</span></article>`;
    }
    WA.bindRowHrefs(appTable);
  };
  WA.bindTableSort(document.getElementById("app-table"), appState, drawApps);
  drawApps();
};

WA.appsForBrandCountry = (brand, country, from, to, rows, sum) => {
  const byPkg = WA.groupBy(rows.filter((r) => r.package), (r) => r.package).sort((a, c) => c.revenue - a.revenue);
  if (byPkg.length) {
    return {
      note: `Пакеты с трафом в ${country} за период.`,
      apps: byPkg.map((g) => ({
        package: g.key,
        brand,
        leads: g.leads,
        sales: g.sales,
        revenue: g.revenue,
        installs: g.installs,
        hasInstalls: g.hasInstalls,
        countries: 1,
        first_date: from,
        last_date: to
      }))
    };
  }
  const active = WA.brandAppsIn(brand, from, to);
  if (!active.length) return { note: "", apps: [] };
  if (active.length === 1) {
    const only = active[0];
    return {
      note: `В этом периоде у бренда одно активное приложение — цифры ${country} с него.`,
      apps: [{
        ...only,
        leads: sum.leads,
        sales: sum.sales,
        revenue: sum.revenue,
        installs: sum.installs,
        hasInstalls: sum.hasInstalls,
        countries: 1
      }]
    };
  }
  const attributed = active.map((a) => {
    const geo = WA.groupBy(WA.uniqueAppDays(a.package, from, to).filter((r) => r.country === country), (r) => r.country)[0];
    if (!geo) return { ...a, unknownGeo: true, countries: "н/д" };
    return {
      ...a,
      leads: geo.leads,
      sales: geo.sales,
      revenue: geo.revenue,
      installs: geo.installs,
      hasInstalls: geo.hasInstalls,
      countries: 1,
      unknownGeo: false
    };
  }).filter((a) => !a.unknownGeo);
  if (attributed.length) {
    return {
      note: `Цифры ${country} по дням, когда пакет был единственным активным у бренда.`,
      apps: attributed.sort((a, c) => c.revenue - a.revenue)
    };
  }
  return {
    note: `Несколько прил активны в периоде, в выгрузке нет прила × страна — цифры ${country} не раскладываю по пакетам.`,
    apps: active.map((a) => ({ ...a, unknownGeo: true, countries: "н/д" }))
  };
};

WA.appRowHtml = (a, country) => {
  const nd = a.unknownGeo;
  return `
  <tr data-href="${WA.href("/app.html", { p: a.package, c: country || "" })}">
    <td class="mono">${a.package}</td>
    <td class="num">${nd ? "н/д" : WA.num(a.leads)}</td>
    <td class="num">${nd ? "н/д" : WA.instTxt(a)}</td>
    <td class="num">${nd ? "н/д" : WA.num(a.sales)}</td>
    <td class="num">${nd ? "н/д" : WA.money2(a.revenue)}</td>
    <td class="num">${nd ? "н/д" : a.countries}</td>
    <td>${a.first_date || ""}</td>
    <td>${a.last_date || ""}</td>
  </tr>`;
};

WA.appCardHtml = (a, country) => {
  const nd = a.unknownGeo;
  return `
  <a class="card mobile-card" href="${WA.href("/app.html", { p: a.package, c: country || "" })}">
    <strong class="mono">${a.package}</strong>
    <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${nd ? "н/д" : `${WA.num(a.leads)} / ${WA.instTxt(a)} / ${WA.num(a.sales)}`}</span></div>
    <div class="row"><span class="muted">Выручка</span><span class="mono">${nd ? "н/д" : WA.money2(a.revenue)}</span></div>
    <div class="row"><span class="muted">Страны</span><span class="mono">${nd ? "н/д" : a.countries}</span></div>
  </a>`;
};

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
      return hit && (!region || r.region === region) && WA.matchZero(r, WA.tableState.extra);
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
  WA.bindZeroFilters(document.getElementById("zero-filters"), WA.tableState.extra, draw);
  document.getElementById("country-search").oninput = (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); };
  document.getElementById("region-filter").onchange = (e) => { WA.tableState.extra.region = e.target.value; WA.tableState.page = 1; draw(); };
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
  const byBrand = WA.groupBy(rows, (r) => r.brand).map((x) => ({
    brand: x.key, leads: x.leads, installs: x.installs, hasInstalls: x.hasInstalls,
    sales: x.sales, revenue: x.revenue, rate: WA.pct(x.sales, x.leads)
  }));
  const topBrand = [...byBrand].sort((a, c) => c.revenue - a.revenue);
  WA.hBar("brand-bar", topBrand.slice(0, 12).map((x) => x.brand), topBrand.slice(0, 12).map((x) => x.revenue));
  const brandState = { key: "revenue", dir: "desc" };
  const drawBrands = () => {
    const list = WA.sortRows(byBrand, brandState.key, brandState.dir);
    WA.markSort(document.getElementById("brand-table"), brandState.key, brandState.dir);
    document.querySelector("#brand-table tbody").innerHTML = list.map((x) => `
      <tr data-href="${WA.href("/brand.html", { b: x.brand, c: code })}">
        <td>${x.brand}</td>
        <td class="pkg-cell">${WA.pkgListHtml(x.brand, code, b.from, b.to)}</td>
        <td class="num">${WA.num(x.leads)}</td>
        <td class="num">${WA.instTxt(x)}</td>
        <td class="num">${WA.num(x.sales)}</td>
        <td class="num">${WA.money2(x.revenue)}</td>
        <td class="num">${WA.pctTxt(x.sales, x.leads)}</td>
      </tr>`).join("");
    WA.bindRowHrefs(document.querySelector("#brand-table tbody"));
    const brandCards = document.getElementById("country-brand-cards");
    if (brandCards) {
      brandCards.innerHTML = list.map((x) => `
        <a class="card mobile-card" href="${WA.href("/brand.html", { b: x.brand, c: code })}">
          <strong>${x.brand}</strong>
          <div class="pkg-list">${WA.brandAppsIn(x.brand, b.from, b.to).map((a) => `<span class="mono">${a.package}</span>`).join("")}</div>
          <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(x.revenue)}</span></div>
          <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(x.leads)} / ${WA.instTxt(x)} / ${WA.num(x.sales)}</span></div>
          <div class="row"><span class="muted">Конверсия</span><span class="mono">${WA.pctTxt(x.sales, x.leads)}</span></div>
        </a>`).join("");
    }
  };
  WA.bindTableSort(document.getElementById("brand-table"), brandState, drawBrands);
  drawBrands();
};

WA.pageApps = async () => {
  await WA.loadAgg();
  const b = WA.currentBounds();
  document.getElementById("updated").textContent = `${b.from} → ${b.to} · цифры прил за выбранный период`;
  WA.resetTable("revenue");
  const grouped = WA.groupBy(WA.aggIn(b.from, b.to).filter((r) => r.package), (r) => r.package);
  const meta = new Map(WA.apps.map((a) => [a.package, a]));
  const all = grouped.map((g) => {
    const a = meta.get(g.key) || {};
    return {
      package: g.key,
      brand: a.brand || [...g.brands][0] || "",
      leads: g.leads,
      sales: g.sales,
      revenue: g.revenue,
      installs: g.installs,
      hasInstalls: g.hasInstalls,
      countries: g.countries.size,
      first_date: a.first_date || "",
      last_date: a.last_date || "",
      rate: WA.pct(g.sales, g.leads)
    };
  });
  const draw = () => {
    const q = WA.tableState.query.toLowerCase();
    const active = WA.tableState.extra.active === "7";
    const from7 = WA.bounds("7").from;
    let rows = all.filter((a) => {
      const hit = a.package.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q);
      const last = a.last_date || "";
      return hit && (!active || last >= from7) && WA.matchZero(a, WA.tableState.extra);
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
  WA.bindZeroFilters(document.getElementById("zero-filters"), WA.tableState.extra, draw);
  document.getElementById("app-search").oninput = (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); };
  document.getElementById("active-filter").onchange = (e) => { WA.tableState.extra.active = e.target.value; WA.tableState.page = 1; draw(); };
  draw();
};

WA.pageApp = async () => {
  await WA.loadAgg();
  const params = new URLSearchParams(location.search);
  const pkg = params.get("p") || "";
  const countryHint = (params.get("c") || "").toUpperCase();
  const b = WA.currentBounds();
  let found = WA.appCountryRows(pkg, b.from, b.to);
  if (countryHint && found.rows.length) {
    found = { ...found, rows: found.rows.filter((r) => r.country === countryHint) };
  }
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

  const grouped = WA.groupBy(found.rows, (r) => r.country).map((x) => ({
    country: x.key, leads: x.leads, installs: x.installs, hasInstalls: x.hasInstalls,
    sales: x.sales, revenue: x.revenue, rate: WA.pct(x.sales, x.leads)
  }));
  const byDay = WA.groupBy(found.rows, (r) => r.date).sort((a, c) => a.key.localeCompare(c.key));
  const note = document.getElementById("geo-note");
  if (found.mode === "package" || found.mode === "brand" || found.mode === "unique") {
    if (note) {
      note.hidden = false;
      note.textContent = found.mode === "package"
        ? "Разбивка по этой приле из выгрузки."
        : found.mode === "brand"
          ? "У бренда одно приложение — страны взяты с уровня бренда."
          : "Страны по дням, когда эта прила была единственной активной у бренда. Дни с несколькими пакетами не входят.";
    }
    WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Выручка");
    const topGeo = [...grouped].sort((a, c) => c.revenue - a.revenue);
    WA.hBar("country-bar", topGeo.slice(0, 12).map((x) => x.country), topGeo.slice(0, 12).map((x) => x.revenue));
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
  const geoState = { key: "revenue", dir: "desc" };
  const drawGeo = () => {
    const list = WA.sortRows(grouped, geoState.key, geoState.dir);
    WA.markSort(document.getElementById("country-table"), geoState.key, geoState.dir);
    body.innerHTML = list.map((x) => `
      <tr data-href="${WA.href("/country.html", { c: x.country })}">
        <td><span class="pill">${WA.flag(x.country)} ${x.country}</span> ${WA.countryName(x.country)}</td>
        <td class="num">${WA.num(x.leads)}</td>
        <td class="num">${WA.instTxt(x)}</td>
        <td class="num">${WA.num(x.sales)}</td>
        <td class="num">${WA.money2(x.revenue)}</td>
        <td class="num">${WA.pctTxt(x.sales, x.leads)}</td>
      </tr>`).join("");
    body.querySelectorAll("tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    const cards = document.getElementById("app-country-cards");
    if (cards) {
      cards.innerHTML = list.map((x) => `
        <a class="card mobile-card" href="${WA.href("/country.html", { c: x.country })}">
          <strong>${WA.flag(x.country)} ${x.country} · ${WA.countryName(x.country)}</strong>
          <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(x.leads)} / ${WA.instTxt(x)} / ${WA.num(x.sales)}</span></div>
          <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(x.revenue)}</span></div>
        </a>`).join("");
    }
  };
  WA.bindTableSort(document.getElementById("country-table"), geoState, drawGeo);
  drawGeo();
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
  const dayState = { key: "date", dir: "desc" };
  const drawDays = () => {
    const list = WA.sortRows(dayRows, dayState.key, dayState.dir);
    WA.markSort(document.getElementById("daily-table"), dayState.key, dayState.dir);
    document.querySelector("#daily-table tbody").innerHTML = list.map((d) => `
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
      dailyCards.innerHTML = list.map((d) => `
        <article class="card mobile-card ${d.alert ? "alert" : ""}">
          <strong>${d.date}</strong>
          <div class="row"><span class="muted">Выручка</span><span class="mono">${WA.money2(d.revenue)}</span></div>
          <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(d.leads)} / ${WA.hasNum(d.installs) ? WA.num(d.installs) : "—"} / ${WA.num(d.sales)}</span></div>
          <div class="row"><span class="muted">Топ-бренд</span><span>${d.topBrand}</span></div>
          <div class="row"><span class="muted">к пред. дню</span><span class="mono ${d.change >= 0 ? "delta up" : "delta down"}">${d.change >= 0 ? "↑" : "↓"} ${Math.abs(d.change).toFixed(1)}%</span></div>
        </article>`).join("");
    }
  };
  WA.bindTableSort(document.getElementById("daily-table"), dayState, drawDays);
  drawDays();
  const periodRev = days.reduce((s, d) => s + (d.revenue || 0), 0) || 1;
  const ranked = WA.groupBy(agg, (r) => r.brand).sort((a, c) => c.revenue - a.revenue);
  const topSel = document.getElementById("top-n");
  const drawStack = () => {
    const n = Math.max(3, Math.min(20, Number(topSel?.value || localStorage.getItem("wa-top-n") || 5)));
    if (topSel) topSel.value = String(n);
    localStorage.setItem("wa-top-n", String(n));
    const title = document.getElementById("stack-title");
    if (title) title.textContent = `Топ-${n} брендов · ${WA.periodLabel(b.from, b.to)}`;
    const top = ranked.slice(0, n);
    WA.hBar("stack-area", top.map((x) => x.key), top.map((x) => x.revenue));
    const host = document.getElementById("stack-area")?.closest(".chart-card");
    if (host) {
      let el = host.querySelector(".chart-pct");
      if (!el) {
        el = document.createElement("div");
        el.className = "chart-pct";
        document.getElementById("stack-area").parentElement.after(el);
      }
      const share = b.from === b.to ? "дня" : "периода";
      el.innerHTML = top.map((x, i) => `<span style="--i:${i}"><b>${x.key}</b> ${WA.money2(x.revenue)} · ${(x.revenue / periodRev * 100).toFixed(1)}% ${share}</span>`).join("");
    }
  };
  if (topSel) {
    topSel.value = localStorage.getItem("wa-top-n") || "5";
    topSel.onchange = drawStack;
  }
  drawStack();
};

WA.pageDead = async () => {
  await WA.loadAgg();
  const b = WA.currentBounds();
  document.getElementById("updated").textContent = `${b.from} → ${b.to}`;
  WA.resetTable("installs");
  const extra = WA.tableState.extra;
  extra.noSale = true;
  extra.hasTraffic = true;
  const scoped = WA.aggIn(b.from, b.to);
  const brands = WA.groupBy(scoped, (r) => r.brand).map((x) => ({
    brand: x.key,
    leads: x.leads,
    installs: x.installs,
    hasInstalls: x.hasInstalls,
    sales: x.sales,
    revenue: x.revenue,
    countries: x.countries.size,
    rate: WA.pct(x.sales, x.leads)
  }));
  const meta = new Map(WA.apps.map((a) => [a.package, a]));
  const apps = WA.groupBy(scoped.filter((r) => r.package), (r) => r.package).map((g) => {
    const a = meta.get(g.key) || {};
    return {
      package: g.key,
      brand: a.brand || [...g.brands][0] || "",
      leads: g.leads,
      installs: g.installs,
      hasInstalls: g.hasInstalls,
      sales: g.sales,
      revenue: g.revenue,
      countries: g.countries.size
    };
  });
  const keep = (row) => {
    if (!WA.matchZero(row, extra)) return false;
    if (extra.hasTraffic && !((Number(row.installs) || 0) > 0 || (Number(row.leads) || 0) > 0)) return false;
    const q = (WA.tableState.query || "").toLowerCase();
    if (!q) return true;
    return String(row.brand || "").toLowerCase().includes(q) || String(row.package || "").toLowerCase().includes(q);
  };
  const brandState = { key: "installs", dir: "desc" };
  const appState = { key: "installs", dir: "desc" };
  let appPage = 1;
  const draw = () => {
    const deadBrands = WA.sortRows(brands.filter(keep), brandState.key, brandState.dir);
    const deadApps = WA.sortRows(apps.filter(keep), appState.key, appState.dir);
    document.getElementById("dead-brands-title").textContent = `Бренды · ${deadBrands.length}`;
    document.getElementById("dead-apps-title").textContent = `Приложения · ${deadApps.length}`;
    const kpis = document.getElementById("kpis");
    if (kpis) {
      const inst = deadBrands.reduce((s, r) => s + (Number(r.installs) || 0), 0);
      const leads = deadBrands.reduce((s, r) => s + (Number(r.leads) || 0), 0);
      kpis.innerHTML = [
        ["Пустых брендов", WA.num(deadBrands.length)],
        ["Пустых прил", WA.num(deadApps.length)],
        ["Их инсталы", WA.num(inst)],
        ["Их регистрации", WA.num(leads)],
        ["Период", `${WA.fmtDay(b.from)} — ${WA.fmtDay(b.to)}`],
        ["Фильтр", [extra.noSale && "без деп", extra.noLead && "без рег", extra.noInst && "без инст", extra.hasTraffic && "был траф"].filter(Boolean).join(" · ") || "все"]
      ].map(([label, value]) => `<article class="card kpi"><div class="label">${label}</div><div class="value">${value}</div></article>`).join("");
    }
    WA.tableState.sortKey = brandState.key;
    WA.tableState.sortDir = brandState.dir;
    const brandPage = WA.paginate(deadBrands);
    WA.markSort(document.getElementById("dead-brand-table"), brandState.key, brandState.dir);
    document.querySelector("#dead-brand-table tbody").innerHTML = brandPage.rows.length
      ? brandPage.rows.map((r) => `
        <tr data-href="${WA.href("/brand.html", { b: r.brand })}">
          <td>${r.brand}</td>
          <td class="num">${WA.num(r.leads)}</td>
          <td class="num">${WA.instTxt(r)}</td>
          <td class="num">${WA.num(r.sales)}</td>
          <td class="num">${WA.money2(r.revenue)}</td>
          <td class="num">${WA.num(r.countries)}</td>
        </tr>`).join("")
      : `<tr><td colspan="6" class="empty">Нет брендов под этот фильтр.</td></tr>`;
    document.querySelectorAll("#dead-brand-table tbody tr[data-href]").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    document.getElementById("dead-brand-cards").innerHTML = brandPage.rows.map((r) => `
      <a class="card mobile-card" href="${WA.href("/brand.html", { b: r.brand })}">
        <strong>${r.brand}</strong>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(r.leads)} / ${WA.instTxt(r)} / ${WA.num(r.sales)}</span></div>
      </a>`).join("");
    WA.renderPager(document.getElementById("dead-brand-pager"), brandPage, () => { draw(); });

    const per = WA.tableState.perPage;
    const appPages = Math.max(1, Math.ceil(deadApps.length / per));
    if (appPage > appPages) appPage = appPages;
    const appSlice = deadApps.slice((appPage - 1) * per, appPage * per);
    WA.markSort(document.getElementById("dead-app-table"), appState.key, appState.dir);
    document.querySelector("#dead-app-table tbody").innerHTML = appSlice.length
      ? appSlice.map((a) => `
        <tr data-href="${WA.href("/app.html", { p: a.package })}">
          <td class="mono">${a.package}</td>
          <td>${a.brand}</td>
          <td class="num">${WA.num(a.leads)}</td>
          <td class="num">${WA.instTxt(a)}</td>
          <td class="num">${WA.num(a.sales)}</td>
          <td class="num">${WA.money2(a.revenue)}</td>
          <td class="num">${WA.num(a.countries)}</td>
        </tr>`).join("")
      : `<tr><td colspan="7" class="empty">Нет прил под этот фильтр.</td></tr>`;
    document.querySelectorAll("#dead-app-table tbody tr[data-href]").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    document.getElementById("dead-app-cards").innerHTML = appSlice.map((a) => `
      <a class="card mobile-card" href="${WA.href("/app.html", { p: a.package })}">
        <strong class="mono">${a.package}</strong>
        <div class="row"><span class="muted">Бренд</span><span>${a.brand}</span></div>
        <div class="row"><span class="muted">Рег. / инст. / деп.</span><span class="mono">${WA.num(a.leads)} / ${WA.instTxt(a)} / ${WA.num(a.sales)}</span></div>
      </a>`).join("");
    const appPager = document.getElementById("dead-app-pager");
    WA.renderPager(appPager, { rows: appSlice, total: deadApps.length, pages: appPages }, () => {});
    appPager.querySelector("[data-act=prev]").onclick = () => { if (appPage > 1) { appPage--; draw(); } };
    appPager.querySelector("[data-act=next]").onclick = () => { if (appPage < appPages) { appPage++; draw(); } };
    appPager.querySelector("[data-act=csv]").onclick = () => {
      WA.csv("wingaso-dead-apps.csv", ["Пакет","Бренд","Регистрации","Инсталы","Депозиты","Выручка","Страны"], deadApps.map((a) => [a.package, a.brand, a.leads, a.installs, a.sales, a.revenue.toFixed(2), a.countries]));
    };
    document.getElementById("dead-brand-pager").oncsv = null;
    document.getElementById("dead-brand-pager").addEventListener("csv", () => {
      WA.csv("wingaso-dead-brands.csv", ["Бренд","Регистрации","Инсталы","Депозиты","Выручка","Страны"], deadBrands.map((r) => [r.brand, r.leads, r.installs, r.sales, r.revenue.toFixed(2), r.countries]));
    }, { once: true });
  };
  extra.noSale = true;
  extra.hasTraffic = true;
  WA.bindTableSort(document.getElementById("dead-brand-table"), brandState, () => { WA.tableState.page = 1; draw(); });
  WA.bindTableSort(document.getElementById("dead-app-table"), appState, () => { appPage = 1; draw(); });
  WA.bindZeroFilters(document.getElementById("zero-filters"), extra, () => { WA.tableState.page = 1; appPage = 1; draw(); });
  extra.noSale = document.querySelector("[data-zero=noSale]")?.checked;
  extra.noLead = document.querySelector("[data-zero=noLead]")?.checked;
  extra.noInst = document.querySelector("[data-zero=noInst]")?.checked;
  extra.hasTraffic = document.querySelector("[data-zero=hasTraffic]")?.checked;
  document.getElementById("dead-search").oninput = (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; appPage = 1; draw(); };
  draw();
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
