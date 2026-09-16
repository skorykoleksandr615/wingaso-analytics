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
  document.getElementById("kpis").innerHTML = [
    ["Total Revenue", WA.money2(cur.revenue), WA.deltaHtml(cur.revenue, prev.revenue)],
    ["Total Conversions", WA.num(cur.conversions), WA.deltaHtml(cur.conversions, prev.conversions)],
    ["Total Sales", WA.num(cur.sales), WA.deltaHtml(cur.sales, prev.sales)],
    ["Conversion Rate", WA.pctTxt(cur.sales, cur.leads), WA.deltaHtml(WA.pct(cur.sales, cur.leads), WA.pct(prev.sales, prev.leads))],
    ["Active Apps", WA.num(WA.meta.totals.apps), ""],
    ["Active Countries", WA.num(WA.meta.totals.countries), ""]
  ].map(([label, value, delta]) => `<article class="card kpi"><div class="label">${label}</div><div class="value">${value}</div>${delta}</article>`).join("");

  document.getElementById("updated").textContent = `Last update ${WA.updated()} · ${b.from} → ${b.to}`;
  WA.lineChart("rev-line", days.map((d) => d.date.slice(5)), days.map((d) => d.revenue), "Revenue");
  WA.barCompare("conv-bar", days.map((d) => d.date.slice(5)), days.map((d) => d.leads), days.map((d) => d.sales));

  await WA.loadAgg();
  const rows = WA.aggIn(b.from, b.to);
  const brands = WA.groupBy(rows, (r) => r.brand).sort((a, c) => c.revenue - a.revenue).slice(0, 10);
  const countries = WA.groupBy(rows, (r) => r.country).sort((a, c) => c.revenue - a.revenue).slice(0, 10);
  WA.hBar("brand-bar", brands.map((x) => x.key), brands.map((x) => x.revenue));
  WA.hBar("country-bar", countries.map((x) => x.key), countries.map((x) => x.revenue));
  const pie = brands.slice(0, 8);
  const other = brands.slice(8).reduce((s, x) => s + x.revenue, 0);
  const pieLabels = pie.map((x) => x.key);
  const pieData = pie.map((x) => x.revenue);
  if (other > 0) { pieLabels.push("Other"); pieData.push(other); }
  WA.pie("brand-pie", pieLabels, pieData);
};

WA.brandRows = (from, to) => {
  const rows = WA.aggIn(from, to);
  return WA.groupBy(rows, (r) => r.brand).map((x) => ({
    brand: x.key,
    conversions: x.conversions,
    leads: x.leads,
    sales: x.sales,
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
      <tr data-href="/brand.html?b=${encodeURIComponent(r.brand)}">
        <td>${(WA.tableState.page - 1) * WA.tableState.perPage + i + 1}</td>
        <td>${r.brand}</td>
        <td class="num">${WA.num(r.conversions)}</td>
        <td class="num">${WA.num(r.leads)}</td>
        <td class="num">${WA.num(r.sales)}</td>
        <td class="num">${WA.money2(r.revenue)}</td>
        <td class="num">${r.rate.toFixed(1)}%</td>
        <td>${r.countryCount} · ${r.countries.split(", ").slice(0, 6).join(", ")}${r.countryCount > 6 ? "…" : ""}</td>
        <td>${WA.sparkSvg(r.spark)}</td>
      </tr>`).join("");
    document.getElementById("brand-cards").innerHTML = page.rows.map((r) => `
      <a class="card mobile-card" href="/brand.html?b=${encodeURIComponent(r.brand)}">
        <strong>${r.brand}</strong>
        <div class="row"><span class="muted">Revenue</span><span class="mono">${WA.money2(r.revenue)}</span></div>
        <div class="row"><span class="muted">Sales / Leads</span><span class="mono">${WA.num(r.sales)} / ${WA.num(r.leads)}</span></div>
        <div class="row"><span class="muted">Rate</span><span class="mono">${r.rate.toFixed(1)}%</span></div>
      </a>`).join("");
    body.querySelectorAll("tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    WA.renderPager(document.getElementById("brand-pager"), page, draw);
    document.getElementById("brand-pager").oncsv = null;
    document.getElementById("brand-pager").addEventListener("csv", () => {
      WA.csv("wingaso-brands.csv", ["Brand","Conversions","Leads","Sales","Revenue","Rate","Countries"], rows.map((r) => [r.brand, r.conversions, r.leads, r.sales, r.revenue.toFixed(2), r.rate.toFixed(1), r.countries]));
    }, { once: true });
  };
  WA.bindSort(document.getElementById("brand-table"), draw);
  document.getElementById("brand-search").addEventListener("input", (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); });
  document.getElementById("min-rev").addEventListener("input", (e) => { WA.tableState.extra.minRev = e.target.value; WA.tableState.page = 1; draw(); });
  draw();
};

WA.pageBrand = async () => {
  await WA.loadAgg();
  const name = WA.clean(new URLSearchParams(location.search).get("b") || "");
  const b = WA.currentBounds();
  const rows = WA.aggIn(b.from, b.to).filter((r) => r.brand === name);
  const sum = rows.reduce((a, r) => {
    a.leads += r.leads || 0; a.sales += r.sales || 0; a.revenue += r.revenue || 0; return a;
  }, { leads: 0, sales: 0, revenue: 0 });
  document.getElementById("title").textContent = name || "Brand";
  document.getElementById("lead").textContent = `${WA.money2(sum.revenue)} · ${WA.num(sum.sales)} sales · ${WA.pctTxt(sum.sales, sum.leads)} · ${b.from} → ${b.to}`;
  const byDay = WA.groupBy(rows, (r) => r.date).sort((a, c) => a.key.localeCompare(c.key));
  WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Revenue");
  const byCountry = WA.groupBy(rows, (r) => r.country).sort((a, c) => c.revenue - a.revenue);
  WA.hBar("country-bar", byCountry.slice(0, 12).map((x) => x.key), byCountry.slice(0, 12).map((x) => x.revenue));
  const apps = WA.apps.filter((a) => a.brand === name).sort((a, c) => c.revenue - a.revenue);
  document.querySelector("#app-table tbody").innerHTML = apps.length ? apps.map((a) => `
    <tr>
      <td class="mono">${a.package}</td>
      <td class="num">${WA.num(a.conversions)}</td>
      <td class="num">${WA.money2(a.revenue)}</td>
      <td class="num">${a.countries}</td>
      <td>${a.first_date || ""}</td>
      <td>${a.last_date || ""}</td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty">No apps for this brand in cache.</td></tr>`;
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
      <tr data-href="/country.html?c=${r.country}">
        <td>${(WA.tableState.page - 1) * WA.tableState.perPage + i + 1}</td>
        <td><span class="pill">${WA.flag(r.country)} ${r.country}</span> ${r.name}</td>
        <td class="num">${WA.num(r.conversions)}</td>
        <td class="num">${WA.num(r.leads)}</td>
        <td class="num">${WA.num(r.sales)}</td>
        <td class="num">${WA.money2(r.revenue)}</td>
        <td class="num">${r.rate.toFixed(1)}%</td>
        <td>${r.topBrand}</td>
        <td>${WA.sparkSvg(r.spark)}</td>
      </tr>`).join("");
    document.getElementById("country-cards").innerHTML = page.rows.map((r) => `
      <a class="card mobile-card" href="/country.html?c=${r.country}">
        <strong>${WA.flag(r.country)} ${r.country} · ${r.name}</strong>
        <div class="row"><span class="muted">Revenue</span><span class="mono">${WA.money2(r.revenue)}</span></div>
        <div class="row"><span class="muted">Top brand</span><span>${r.topBrand}</span></div>
      </a>`).join("");
    document.querySelectorAll("#country-table tbody tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
    WA.renderPager(document.getElementById("country-pager"), page, draw);
    document.getElementById("country-pager").addEventListener("csv", () => {
      WA.csv("wingaso-countries.csv", ["Country","Name","Conversions","Leads","Sales","Revenue","Rate","TopBrand"], rows.map((r) => [r.country, r.name, r.conversions, r.leads, r.sales, r.revenue.toFixed(2), r.rate.toFixed(1), r.topBrand]));
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
  const sum = rows.reduce((a, r) => { a.leads += r.leads || 0; a.sales += r.sales || 0; a.revenue += r.revenue || 0; return a; }, { leads: 0, sales: 0, revenue: 0 });
  document.getElementById("title").innerHTML = `${WA.flag(code)} ${code} · ${WA.countryName(code)}`;
  document.getElementById("lead").textContent = `${WA.money2(sum.revenue)} · ${WA.num(sum.sales)} sales · ${WA.pctTxt(sum.sales, sum.leads)} · ${b.from} → ${b.to}`;
  const byDay = WA.groupBy(rows, (r) => r.date).sort((a, c) => a.key.localeCompare(c.key));
  WA.lineChart("rev-line", byDay.map((x) => x.key.slice(5)), byDay.map((x) => x.revenue), "Revenue");
  const byBrand = WA.groupBy(rows, (r) => r.brand).sort((a, c) => c.revenue - a.revenue);
  WA.hBar("brand-bar", byBrand.slice(0, 12).map((x) => x.key), byBrand.slice(0, 12).map((x) => x.revenue));
  document.querySelector("#brand-table tbody").innerHTML = byBrand.map((x) => `
    <tr data-href="/brand.html?b=${encodeURIComponent(x.key)}">
      <td>${x.key}</td>
      <td class="num">${WA.num(x.conversions)}</td>
      <td class="num">${WA.num(x.sales)}</td>
      <td class="num">${WA.money2(x.revenue)}</td>
      <td class="num">${WA.pctTxt(x.sales, x.leads)}</td>
    </tr>`).join("");
  document.querySelectorAll("#brand-table tbody tr").forEach((tr) => tr.onclick = () => location.href = tr.dataset.href);
};

WA.pageApps = async () => {
  const b = WA.currentBounds();
  document.getElementById("updated").textContent = `${b.from} → ${b.to}`;
  WA.resetTable("revenue");
  const cutoff = b.to;
  const from7 = WA.bounds("7").from;
  const all = WA.apps.map((a) => ({ ...a, rate: WA.pct(a.sales, a.leads) }));
  const draw = () => {
    const q = WA.tableState.query.toLowerCase();
    const active = WA.tableState.extra.active === "7";
    let rows = all.filter((a) => {
      const hit = a.package.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q);
      const last = a.last_date || "";
      return hit && (!active || last >= from7);
    });
    rows = WA.sortRows(rows, WA.tableState.sortKey, WA.tableState.sortDir);
    const page = WA.paginate(rows);
    document.querySelector("#app-table tbody").innerHTML = page.rows.map((a) => `
      <tr>
        <td class="mono">${a.package}</td>
        <td><a href="/brand.html?b=${encodeURIComponent(a.brand)}">${a.brand}</a></td>
        <td class="num">${WA.num(a.conversions)}</td>
        <td class="num">${WA.money2(a.revenue)}</td>
        <td class="num">${a.countries}</td>
        <td>${a.first_date || ""}</td>
        <td>${a.last_date || ""}</td>
      </tr>`).join("");
    document.getElementById("app-cards").innerHTML = page.rows.map((a) => `
      <article class="card mobile-card">
        <strong class="mono">${a.package}</strong>
        <div class="row"><span class="muted">Brand</span><span>${a.brand}</span></div>
        <div class="row"><span class="muted">Revenue</span><span class="mono">${WA.money2(a.revenue)}</span></div>
      </article>`).join("");
    WA.renderPager(document.getElementById("app-pager"), page, draw);
    document.getElementById("app-pager").addEventListener("csv", () => {
      WA.csv("wingaso-apps.csv", ["Package","Brand","Conversions","Revenue","Countries","First","Last"], rows.map((a) => [a.package, a.brand, a.conversions, a.revenue, a.countries, a.first_date, a.last_date]));
    }, { once: true });
  };
  WA.bindSort(document.getElementById("app-table"), draw);
  document.getElementById("app-search").addEventListener("input", (e) => { WA.tableState.query = e.target.value; WA.tableState.page = 1; draw(); });
  document.getElementById("active-filter").addEventListener("change", (e) => { WA.tableState.extra.active = e.target.value; WA.tableState.page = 1; draw(); });
  void cutoff;
  draw();
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
      <td class="num">${WA.num(d.conversions)}</td>
      <td class="num">${WA.num(d.leads)}</td>
      <td class="num">${WA.num(d.sales)}</td>
      <td class="num">${WA.money2(d.revenue)}</td>
      <td>${d.topBrand}</td>
      <td class="num ${d.change >= 0 ? "delta up" : "delta down"}">${d.change >= 0 ? "↑" : "↓"} ${Math.abs(d.change).toFixed(1)}%</td>
    </tr>`).join("");
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
    box.textContent = "Failed to load dashboard: " + err.message;
    host.prepend(box);
  });
});
