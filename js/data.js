const WA = {
  meta: null,
  brands: [],
  countries: [],
  apps: [],
  daily: [],
  aggregated: null,
  cache: null
};

WA.ISO = {
  RU:"Россия",IT:"Италия",BR:"Бразилия",GB:"Великобритания",DE:"Германия",CA:"Канада",ES:"Испания",NL:"Нидерланды",PL:"Польша",BE:"Бельгия",
  CL:"Чили",KR:"Южная Корея",CO:"Колумбия",FR:"Франция",PT:"Португалия",AR:"Аргентина",UA:"Украина",ZA:"ЮАР",AU:"Австралия",PE:"Перу",
  UZ:"Узбекистан",TR:"Турция",CZ:"Чехия",BD:"Бангладеш",IN:"Индия",SA:"Саудовская Аравия",EG:"Египет",PH:"Филиппины",GM:"Гамбия",VE:"Венесуэла",
  AZ:"Азербайджан",CI:"Кот-д’Ивуар",CH:"Швейцария",MY:"Малайзия",SK:"Словакия",IE:"Ирландия",TJ:"Таджикистан",AT:"Австрия",HU:"Венгрия",ID:"Индонезия",
  NG:"Нигерия",BY:"Беларусь",NO:"Норвегия",CD:"ДР Конго",HR:"Хорватия",BF:"Буркина-Фасо",MX:"Мексика",TZ:"Танзания",CM:"Камерун",ZM:"Замбия",
  SG:"Сингапур",ET:"Эфиопия",GR:"Греция",DK:"Дания",PK:"Пакистан",LV:"Латвия",FI:"Финляндия",KG:"Кыргызстан",EE:"Эстония",KE:"Кения",
  SI:"Словения",LK:"Шри-Ланка",DZ:"Алжир",BG:"Болгария",TG:"Того",SE:"Швеция",MA:"Марокко",GA:"Габон",NZ:"Новая Зеландия",UG:"Уганда",
  GH:"Гана",MN:"Монголия",LB:"Ливан",JO:"Иордания",IQ:"Ирак",IS:"Исландия",LT:"Литва",VN:"Вьетнам",MR:"Мавритания",EC:"Эквадор",
  BO:"Боливия",KZ:"Казахстан",BJ:"Бенин",OM:"Оман",GE:"Грузия",AE:"ОАЭ",NP:"Непал",GN:"Гвинея",SN:"Сенегал",ZW:"Зимбабве",
  KW:"Кувейт",MQ:"Мартиника",CG:"Конго",MZ:"Мозамбик",MM:"Мьянма",TH:"Таиланд",MD:"Молдова",ML:"Мали",BH:"Бахрейн",QA:"Катар",
  RS:"Сербия",TD:"Чад",AO:"Ангола",PA:"Панама",TN:"Тунис",AM:"Армения",DO:"Доминикана",SV:"Сальвадор",SL:"Сьерра-Леоне",GT:"Гватемала",
  RW:"Руанда",CR:"Коста-Рика",NE:"Нигер",SY:"Сирия",BA:"Босния",BW:"Ботсвана",UY:"Уругвай",LY:"Ливия",NA:"Намибия",KH:"Камбоджа",
  LR:"Либерия",SO:"Сомали",SD:"Судан",MW:"Малави",MG:"Мадагаскар",BI:"Бурунди",CF:"ЦАР",CU:"Куба",HK:"Гонконг",HT:"Гаити",
  JM:"Ямайка",JP:"Япония",LU:"Люксембург",PF:"Французская Полинезия",RE:"Реюньон",YE:"Йемен",MU:"Маврикий",DJ:"Джибути",PS:"Палестина",US:"США"
};

WA.REGIONS = {
  Europe: ["RU","IT","GB","DE","ES","NL","PL","BE","FR","PT","UA","CZ","CH","SK","IE","AT","HU","BY","NO","HR","GR","DK","LV","FI","EE","SI","BG","SE","IS","LT","MD","RS","AM","BA","LU","RE"],
  Asia: ["KR","UZ","TR","BD","IN","SA","EG","PH","AZ","MY","TJ","ID","SG","PK","KG","LK","MN","LB","JO","IQ","VN","KZ","OM","GE","AE","NP","KW","MM","TH","BH","QA","SY","KH","HK","JP","YE","PS"],
  Americas: ["BR","CA","CL","CO","AR","PE","VE","MX","EC","BO","PA","DO","SV","GT","CR","UY","CU","HT","JM","MQ"],
  Africa: ["ZA","GM","CI","NG","CD","BF","TZ","CM","ZM","ET","KE","DZ","TG","MA","GA","UG","GH","MR","BJ","GN","SN","ZW","CG","MZ","ML","TD","AO","TN","SL","RW","NE","BW","LY","NA","LR","SO","SD","MW","MG","BI","CF","MU","DJ"],
  Oceania: ["AU","NZ","PF"]
};

WA.clean = (s) => String(s || "").replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "").trim();

WA.money = (n) => "$" + (Number(n) || 0).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
WA.money2 = (n) => "$" + (Number(n) || 0).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
WA.num = (n) => (Number(n) || 0).toLocaleString("ru-RU");
WA.pct = (sales, leads) => {
  const l = Number(leads) || 0;
  if (!l) return 0;
  return (Number(sales) || 0) / l * 100;
};
WA.pctTxt = (sales, leads) => WA.pct(sales, leads).toFixed(1) + "%";
WA.hasNum = (n) => n != null && n !== "";
WA.instTxt = (row) => {
  if (!row) return "—";
  if (row.hasInstalls === true) return WA.num(row.installs || 0);
  if (row.hasInstalls === false) return "—";
  if (Object.prototype.hasOwnProperty.call(row, "installs") && row.installs != null) return WA.num(row.installs);
  return "—";
};
WA.localYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
WA.fmtDay = (ymd) => {
  if (!ymd || ymd.length < 10) return ymd || "";
  return `${ymd.slice(8, 10)}.${ymd.slice(5, 7)}.${ymd.slice(0, 4)}`;
};
WA.periodLabel = (from, to) => (from && to && from !== to) ? `${WA.fmtDay(from)} — ${WA.fmtDay(to)}` : WA.fmtDay(from || to);
WA.yesterdayYmd = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return WA.localYmd(d);
};
WA.href = (path, extra = {}) => {
  const { range, from, to } = WA.rangeFrom();
  const u = new URL(path, location.origin);
  if (range) u.searchParams.set("range", range);
  if (range === "custom" && from && to) {
    u.searchParams.set("from", from);
    u.searchParams.set("to", to);
  }
  Object.entries(extra).forEach(([k, v]) => {
    if (v != null && v !== "") u.searchParams.set(k, v);
  });
  return u.pathname + u.search;
};

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(path + " " + res.status);
  return res.json();
}

WA.loadCore = async () => {
  const [meta, brands, countries, apps, daily] = await Promise.all([
    fetchJson("/data/meta.json"),
    fetchJson("/data/brands.json"),
    fetchJson("/data/countries.json"),
    fetchJson("/data/apps.json"),
    fetchJson("/data/daily.json")
  ]);
  WA.meta = meta;
  const map = new Map();
  for (const b of brands) {
    const name = WA.clean(b.brand);
    const prev = map.get(name) || { brand: name, conversions: 0, leads: 0, sales: 0, revenue: 0, countries: 0, apps: 0 };
    prev.conversions += b.conversions || 0;
    prev.leads += b.leads || 0;
    prev.sales += b.sales || 0;
    prev.revenue += b.revenue || 0;
    prev.countries = Math.max(prev.countries, b.countries || 0);
    prev.apps += b.apps || 0;
    map.set(name, prev);
  }
  WA.brands = [...map.values()].sort((a, b) => b.revenue - a.revenue);
  WA.countries = countries;
  WA.apps = apps.map((a) => ({ ...a, brand: WA.clean(a.brand) }));
  WA.daily = daily.slice().sort((a, b) => a.date.localeCompare(b.date));
  return WA;
};

WA.loadAgg = async () => {
  if (WA.aggregated) return WA.aggregated;
  const rows = await fetchJson("/data/aggregated.json");
  WA.aggregated = rows.map((r) => ({
    ...r,
    brand: WA.clean(r.brand),
    package: r.package ? WA.clean(r.package) : "",
    installs: r.installs,
    hasInstalls: r.installs != null,
    conversions: (r.leads || 0) + (r.sales || 0)
  }));
  return WA.aggregated;
};

WA.rangeFrom = () => {
  const params = new URLSearchParams(location.search);
  const range = params.get("range") || localStorage.getItem("wa-range") || "all";
  const from = params.get("from") || localStorage.getItem("wa-from") || "";
  const to = params.get("to") || localStorage.getItem("wa-to") || "";
  return { range, from, to };
};

WA.setRange = (range, from, to) => {
  localStorage.setItem("wa-range", range);
  if (from) localStorage.setItem("wa-from", from); else localStorage.removeItem("wa-from");
  if (to) localStorage.setItem("wa-to", to); else localStorage.removeItem("wa-to");
  const url = new URL(location.href);
  url.searchParams.set("range", range);
  if (range === "custom" && from && to) {
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
  } else {
    url.searchParams.delete("from");
    url.searchParams.delete("to");
  }
  history.replaceState({}, "", url);
};

WA.bounds = (range, from, to) => {
  const end = WA.meta?.period?.to || WA.daily.at(-1)?.date;
  const start = WA.meta?.period?.from || WA.daily[0]?.date;
  const endD = new Date(end + "T00:00:00Z");
  const shift = (days) => {
    const d = new Date(endD);
    d.setUTCDate(d.getUTCDate() - (days - 1));
    return d.toISOString().slice(0, 10);
  };
  if (range === "yesterday") {
    const cal = WA.yesterdayYmd();
    const hasCal = (WA.daily || []).some((d) => d.date === cal);
    const day = hasCal ? cal : end;
    return { from: day, to: day };
  }
  if (range === "7") return { from: shift(7), to: end };
  if (range === "30") return { from: shift(30), to: end };
  if (range === "90") return { from: shift(90), to: end };
  if (range === "custom" && from && to) return { from, to };
  return { from: start, to: end };
};

WA.inRange = (date, from, to) => date >= from && date <= to;

WA.dailyIn = (from, to) => WA.daily.filter((d) => WA.inRange(d.date, from, to));

WA.prevBounds = (from, to) => {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  const days = Math.round((b - a) / 86400000) + 1;
  const prevTo = new Date(a);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1));
  return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) };
};

WA.sumDaily = (rows) => rows.reduce((acc, d) => {
  acc.conversions += d.conversions || 0;
  acc.leads += d.leads || 0;
  acc.sales += d.sales || 0;
  acc.revenue += d.revenue || 0;
  if (d.installs != null) {
    acc.hasInstalls = true;
    acc.installs += Number(d.installs) || 0;
  }
  return acc;
}, { conversions: 0, leads: 0, sales: 0, revenue: 0, installs: 0, hasInstalls: false });

WA.delta = (cur, prev) => {
  if (!prev) return 0;
  return (cur - prev) / Math.abs(prev) * 100;
};

WA.aggIn = (from, to) => (WA.aggregated || []).filter((r) => WA.inRange(r.date, from, to));

WA.groupBy = (rows, keyFn) => {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    const prev = map.get(k) || { key: k, conversions: 0, leads: 0, sales: 0, revenue: 0, installs: 0, hasInstalls: false, dates: {}, countries: new Set(), brands: new Set(), apps: new Set() };
    prev.conversions += r.conversions || ((r.leads || 0) + (r.sales || 0));
    prev.leads += r.leads || 0;
    prev.sales += r.sales || 0;
    prev.revenue += r.revenue || 0;
    if (r.hasInstalls || r.installs != null) {
      prev.hasInstalls = true;
      prev.installs += Number(r.installs) || 0;
    }
    prev.dates[r.date] = (prev.dates[r.date] || 0) + (r.revenue || 0);
    if (r.country) prev.countries.add(r.country);
    if (r.brand) prev.brands.add(r.brand);
    map.set(k, prev);
  }
  return [...map.values()];
};

WA.spark = (datesMap, from, to) => {
  const out = [];
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    out.push(datesMap[key] || 0);
  }
  return out;
};

WA.countryName = (code) => WA.ISO[code] || code;
WA.regionOf = (code) => {
  for (const [name, list] of Object.entries(WA.REGIONS)) {
    if (list.includes(code)) return name;
  }
  return "Other";
};

WA.brandApps = (brand) => WA.apps.filter((a) => a.brand === WA.clean(brand));

WA.appActiveIn = (app, from, to) => {
  const a = app.first_date || "1970-01-01";
  const z = app.last_date || "9999-12-31";
  return a <= to && z >= from;
};

WA.brandAppsIn = (brand, from, to) =>
  WA.brandApps(brand).filter((a) => WA.appActiveIn(a, from, to)).sort((x, y) => (y.revenue || 0) - (x.revenue || 0));

WA.pkgListHtml = (brand, country, from, to) => {
  const apps = (from && to) ? WA.brandAppsIn(brand, from, to) : WA.brandApps(brand).sort((a, c) => (c.revenue || 0) - (a.revenue || 0));
  if (!apps.length) return "—";
  return `<div class="pkg-list">${apps.map((a) => `<a class="pkg-link" href="${WA.href("/app.html", { p: a.package, c: country || "" })}">${a.package}</a>`).join("")}</div>`;
};

WA.bindRowHrefs = (root) => {
  root.querySelectorAll("tr[data-href]").forEach((tr) => {
    tr.onclick = (e) => {
      if (e.target.closest("a")) return;
      location.href = tr.dataset.href;
    };
  });
};

WA.uniqueAppDays = (pkg, from, to) => {
  const app = WA.apps.find((a) => a.package === pkg);
  if (!app) return [];
  const siblings = WA.brandApps(app.brand);
  const scoped = WA.aggIn(from, to).filter((r) => r.brand === app.brand);
  const byPackage = scoped.filter((r) => r.package && r.package === pkg);
  if (byPackage.length) return byPackage;
  if (siblings.length === 1) return scoped;
  return scoped.filter((r) => {
    const active = siblings.filter((s) => WA.appActiveIn(s, r.date, r.date));
    return active.length === 1 && active[0].package === pkg;
  });
};

WA.appCountryRows = (pkg, from, to) => {
  const app = WA.apps.find((a) => a.package === pkg);
  if (!app) return { rows: [], mode: "missing" };
  const scoped = WA.aggIn(from, to);
  const byPackage = scoped.filter((r) => r.package && r.package === pkg);
  if (byPackage.length) return { rows: byPackage, mode: "package", app };
  const siblings = WA.brandApps(app.brand);
  if (siblings.length === 1) {
    return { rows: scoped.filter((r) => r.brand === app.brand), mode: "brand", app };
  }
  const unique = WA.uniqueAppDays(pkg, from, to);
  if (unique.length) return { rows: unique, mode: "unique", app };
  return { rows: [], mode: "none", app };
};
