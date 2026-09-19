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
WA.brandKey = (s) => WA.clean(s).toLowerCase().replace(/[\s\-_.']+/g, "");
WA.canonBrandKey = (s) => {
  const k = WA.brandKey(s);
  return (WA.brandCanon && WA.brandCanon.get(k)) || k;
};
WA.sameBrand = (a, b) => {
  const ka = WA.canonBrandKey(a);
  const kb = WA.canonBrandKey(b);
  return !!ka && ka === kb;
};
WA.brandDisplay = (name) => {
  const k = WA.canonBrandKey(name);
  if (!k) return WA.clean(name);
  if (WA.brandTitle && WA.brandTitle.get(k)) return WA.brandTitle.get(k);
  const fromList = (WA.brands || []).filter((b) => WA.canonBrandKey(b.brand) === k)
    .sort((a, c) => (c.revenue || 0) - (a.revenue || 0))[0];
  if (fromList) return fromList.brand;
  return WA.clean(name);
};
WA.isUnknownBrand = (b) => {
  const s = WA.clean(b);
  return !s || /^unknown$/i.test(s);
};
WA.rememberBrand = (pkg, brand, force) => {
  const p = WA.clean(pkg);
  const b = WA.clean(brand);
  if (!p || WA.isUnknownBrand(b)) return;
  if (!WA.pkgBrand) WA.pkgBrand = new Map();
  if (force || !WA.pkgBrand.has(p)) WA.pkgBrand.set(p, b);
};
WA.brandOfPkg = (pkg) => (WA.pkgBrand && WA.pkgBrand.get(WA.clean(pkg))) || "";
WA.remapBrand = (pkg, brand) => {
  const mapped = WA.brandOfPkg(pkg);
  if (mapped) return mapped;
  const b = WA.clean(brand);
  if (WA.isUnknownBrand(b)) return b;
  return WA.brandDisplay(b);
};
WA.esc = (s) => String(s ?? "").replace(/[&<>"'`]/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;"
}[c]));
WA.BLOCKED_PKGS = new Set([
  "com.armycraft.stickmanarmy",
  "com.equilibrium.blockbalance",
  "com.fatal.iodgf.iltiric",
  "com.silo.cloth.elect.brand.arrow.danskespii",
  "a1leatherjackets.com",
  "bbhbet.space",
  "bchgang.net",
  "betboom.space",
  "betfred.website",
  "betfury.rest",
  "betika.casa",
  "betjee.space",
  "brazino777.space",
  "bustyescortsislamabad.online",
  "bwin.monster",
  "casinoggbet.space",
  "casinorainbet.site",
  "crazytime.rest",
  "crowncasino.rest",
  "dragonmoney.quest",
  "favbet.space",
  "fdj.monster",
  "fonbet.health",
  "fortunacasino.casino",
  "hollandcasino.cfd",
  "hy.hotelescortsskarachi.com",
  "inbet.rest",
  "jackpotcity.sbs",
  "jugabet.online",
  "leoncasino.space",
  "leovegas.ink",
  "lottoland.space",
  "luckia.space",
  "masterseo88.com",
  "nonsktipping.space",
  "nustarcasino.casino",
  "nvcasino.onl",
  "olybet.monster",
  "parimatch.sbs",
  "planetwin365.cfd",
  "platin.rest",
  "pokerstarscasino.casino",
  "polymarket.technology",
  "posido.website",
  "roobet.space",
  "sceneflac.blogspot.com",
  "spillehallen.space",
  "sportium.monster",
  "sportsbet.pics",
  "synottip.space",
  "taxivendingusa.com",
  "tombola.monster",
  "totalcasino.club",
  "vegashero.rest",
  "vegashu.space",
  "vincitu.online",
  "vipmassagecenterkarachi.com",
  "yukongoldcasino.shop",
  "belbet.online",
  "betpawa.cfd",
  "fittools.in",
  "interwetten.space",
  "lottomatica.site",
  "pafiangkolabarat.org",
  "pafiangkolaselatan.org",
  "pafibudiagung.org",
  "ug8838.com",
  "voleybetares.ink",
  "webcommers.com",
  "bbrbet.space",
  "fittools.ir",
  "norsktipping.space",
  "volevbetares.ink"
]);
WA.isBlockedPkg = (p) => WA.BLOCKED_PKGS.has(WA.clean(p).toLowerCase());
WA.isPkg = (p) => {
  const s = WA.clean(p);
  if (s.length < 3 || s.length > 180 || /[\/?#\s:]/.test(s)) return false;
  return /^[A-Za-z][A-Za-z0-9_]{0,40}(\.[A-Za-z][A-Za-z0-9_]{0,40}){1,12}$/.test(s) && !WA.isBlockedPkg(s);
};

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
  const [meta, brands, countries, apps, daily, brandCache] = await Promise.all([
    fetchJson("/data/meta.json"),
    fetchJson("/data/brands.json"),
    fetchJson("/data/countries.json"),
    fetchJson("/data/apps.json"),
    fetchJson("/data/daily.json"),
    fetchJson("/data/brand_cache.json").catch(() => [])
  ]);
  WA.meta = meta;
  WA.pkgBrand = new Map();
  WA.brandCache = brandCache || [];
  for (const x of WA.brandCache) {
    if (!WA.isBlockedPkg(x.package)) WA.rememberBrand(x.package, x.brand);
  }
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
  WA.apps = apps.filter((a) => WA.isPkg(a.package)).map((a) => {
    const pkg = WA.clean(a.package);
    WA.rememberBrand(pkg, a.brand);
    return { ...a, brand: a.brand, package: pkg };
  });
  WA.daily = daily.slice().sort((a, b) => a.date.localeCompare(b.date));
  WA.unifyPkgBrands();
  return WA;
};

WA.loadAgg = async () => {
  if (WA.aggregated) return WA.aggregated;
  const rows = await fetchJson("/data/aggregated.json");
  WA.aggregated = rows.filter((r) => !r.package || WA.isPkg(r.package)).map((r) => {
    const pkg = r.package ? WA.clean(r.package) : "";
    const brand = WA.remapBrand(pkg, r.brand);
    if (pkg) WA.rememberBrand(pkg, brand);
    return {
      ...r,
      brand,
      package: pkg,
      installs: r.installs,
      hasInstalls: r.installs != null,
      conversions: (r.leads || 0) + (r.sales || 0)
    };
  });
  WA.unifyPkgBrands();
  return WA.aggregated;
};

WA.unifyPkgBrands = () => {
  const parent = new Map();
  const find = (k) => {
    if (!k) return "";
    if (!parent.has(k)) parent.set(k, k);
    let cur = k;
    while (parent.get(cur) !== cur) cur = parent.get(cur);
    let walk = k;
    while (walk !== cur) {
      const next = parent.get(walk);
      parent.set(walk, cur);
      walk = next;
    }
    return cur;
  };
  const union = (a, b) => {
    if (!a || !b) return;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  const stats = new Map();
  const addStat = (brand, rev, sales, leads) => {
    const b = WA.clean(brand);
    if (!b || WA.isUnknownBrand(b)) return "";
    const prev = stats.get(b) || { brand: b, revenue: 0, sales: 0, leads: 0 };
    prev.revenue += Number(rev) || 0;
    prev.sales += Number(sales) || 0;
    prev.leads += Number(leads) || 0;
    stats.set(b, prev);
    find(WA.brandKey(b));
    return WA.brandKey(b);
  };
  const byPkg = new Map();
  const ingest = (pkg, brand, rev, sales, leads) => {
    const p = WA.clean(pkg);
    const k = addStat(brand, rev, sales, leads);
    if (!p || !k) return;
    let set = byPkg.get(p);
    if (!set) { set = new Set(); byPkg.set(p, set); }
    set.add(k);
  };

  for (const x of WA.brandCache || []) {
    if (!WA.isBlockedPkg(x.package)) ingest(x.package, x.brand, 0, 0, 0);
  }
  for (const a of WA.apps || []) ingest(a.package, a.brand, a.revenue, a.sales, a.leads);
  for (const r of WA.aggregated || []) ingest(r.package, r.brand, r.revenue, r.sales, r.leads);

  for (const keys of byPkg.values()) {
    const arr = [...keys];
    for (let i = 1; i < arr.length; i++) union(arr[0], arr[i]);
  }

  const score = (x) => (x.revenue || 0) * 1000 + (x.sales || 0) * 10 + (x.leads || 0) + x.brand.length * 0.01;
  const best = new Map();
  for (const x of stats.values()) {
    const root = find(WA.brandKey(x.brand));
    const sc = score(x);
    const prev = best.get(root);
    if (!prev || sc > prev.score) best.set(root, { brand: x.brand, key: WA.brandKey(x.brand), score: sc });
  }

  WA.brandCanon = new Map();
  WA.brandTitle = new Map();
  for (const x of stats.values()) {
    const k = WA.brandKey(x.brand);
    const win = best.get(find(k));
    if (!win) continue;
    WA.brandCanon.set(k, win.key);
    WA.brandTitle.set(win.key, win.brand);
  }
  for (const [pkg, keys] of byPkg) {
    const win = best.get(find([...keys][0]));
    if (win) WA.rememberBrand(pkg, win.brand, true);
  }
  for (const r of WA.aggregated || []) {
    if (!r.package) continue;
    r.brand = WA.brandOfPkg(r.package) || WA.brandDisplay(r.brand) || r.brand;
  }
  for (const a of WA.apps || []) {
    a.brand = WA.brandOfPkg(a.package) || WA.brandDisplay(a.brand) || a.brand;
  }
  const merged = new Map();
  for (const b of WA.brands || []) {
    const name = WA.brandDisplay(b.brand);
    const ck = WA.canonBrandKey(name);
    const prev = merged.get(ck) || { brand: name, conversions: 0, leads: 0, sales: 0, revenue: 0, countries: 0, apps: 0 };
    prev.conversions += b.conversions || 0;
    prev.leads += b.leads || 0;
    prev.sales += b.sales || 0;
    prev.revenue += b.revenue || 0;
    prev.countries = Math.max(prev.countries || 0, b.countries || 0);
    prev.apps += b.apps || 0;
    prev.brand = name;
    merged.set(ck, prev);
  }
  WA.brands = [...merged.values()].sort((a, c) => c.revenue - a.revenue);
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
    return { from: cal, to: cal };
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

WA.brandAppCounts = (from, to, extra = {}) => {
  let rows = WA.aggIn(from, to);
  if (extra.country) rows = rows.filter((r) => r.country === extra.country);
  if (extra.date) rows = rows.filter((r) => r.date === extra.date);
  const map = new Map();
  for (const r of rows) {
    if (!r.package || !r.brand) continue;
    const bk = WA.canonBrandKey(r.brand);
    let set = map.get(bk);
    if (!set) { set = new Set(); map.set(bk, set); }
    set.add(r.package);
    map.set(r.brand, set);
  }
  const out = new Map();
  for (const [k, s] of map) out.set(k, s.size);
  return out;
};

WA.ensureAppCountCol = (table, afterKey = "brand") => {
  const tr = table && table.tHead && table.tHead.rows[0];
  if (!tr || tr.querySelector('[data-key="appCount"]')) return;
  const after = tr.querySelector(`[data-key="${afterKey}"]`);
  const th = document.createElement("th");
  th.className = "num";
  th.dataset.key = "appCount";
  th.textContent = "Прилы";
  if (after) after.after(th);
  else tr.appendChild(th);
};

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
    if (r.package) prev.apps.add(r.package);
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

WA.splitKey = (key) => {
  const i = String(key).indexOf("\t");
  return i < 0 ? [key, ""] : [key.slice(0, i), key.slice(i + 1)];
};

WA.appsInPeriod = (from, to) => {
  const scoped = WA.aggIn(from, to).filter((r) => r.package);
  return WA.groupBy(scoped, (r) => `${r.package}\t${WA.canonBrandKey(r.brand)}`).map((g) => {
    const [pkg] = WA.splitKey(g.key);
    const brand = WA.brandDisplay([...g.brands][0] || "");
    const dates = Object.keys(g.dates).sort();
    return {
      package: pkg,
      brand,
      leads: g.leads,
      sales: g.sales,
      revenue: g.revenue,
      installs: g.installs,
      hasInstalls: g.hasInstalls,
      countries: g.countries.size,
      first_date: dates[0] || "",
      last_date: dates[dates.length - 1] || "",
      rate: WA.pct(g.sales, g.leads)
    };
  });
};

WA.pkgsFor = (from, to, extra = {}) => {
  let rows = WA.aggIn(from, to).filter((r) => r.package);
  if (extra.brand) rows = rows.filter((r) => WA.sameBrand(r.brand, extra.brand));
  if (extra.country) rows = rows.filter((r) => r.country === extra.country);
  if (extra.package) rows = rows.filter((r) => r.package === extra.package);
  return WA.groupBy(rows, (r) => r.package).sort((a, c) => c.revenue - a.revenue);
};

WA.brandApps = (brand) => WA.appsInPeriod(WA.meta?.period?.from || "1970-01-01", WA.meta?.period?.to || "9999-12-31").filter((a) => WA.sameBrand(a.brand, brand));

WA.appActiveIn = (app, from, to) => {
  const a = app.first_date || "1970-01-01";
  const z = app.last_date || "9999-12-31";
  return a <= to && z >= from;
};

WA.brandAppsIn = (brand, from, to) =>
  WA.appsInPeriod(from, to).filter((a) => WA.sameBrand(a.brand, brand)).sort((x, y) => (y.revenue || 0) - (x.revenue || 0));

WA.pkgListHtml = (brand, country, from, to) => {
  const apps = WA.pkgsFor(from, to, { brand, country });
  if (!apps.length) return "—";
  return `<div class="pkg-list">${apps.map((a) => `<a class="pkg-link" href="${WA.href("/app.html", { p: a.key, b: brand, c: country || "" })}">${WA.esc(a.key)}</a>`).join("")}</div>`;
};

WA.bindRowHrefs = (root) => {
  root.querySelectorAll("tr[data-href]").forEach((tr) => {
    tr.onclick = (e) => {
      if (e.target.closest("a")) return;
      location.href = tr.dataset.href;
    };
  });
};

WA.normQ = (s) => WA.clean(s).toLowerCase();
WA.matchScore = (hay, needle) => {
  const h = WA.normQ(hay);
  if (!needle || !h) return 0;
  if (h === needle) return 300;
  if (h.startsWith(needle)) return 200;
  if (h.includes(needle)) return 100;
  return 0;
};

WA.searchHits = (q, limit = 12) => {
  const needle = WA.normQ(q);
  if (needle.length < 1) return [];
  const out = [];
  for (const b of WA.brands || []) {
    const s = WA.matchScore(b.brand, needle);
    if (!s) continue;
    out.push({
      type: "brand",
      key: b.brand,
      brand: b.brand,
      score: s,
      revenue: b.revenue,
      leads: b.leads,
      sales: b.sales,
      apps: b.apps
    });
  }
  for (const a of WA.apps || []) {
    const s = WA.matchScore(a.package, needle);
    if (!s) continue;
    out.push({
      type: "app",
      key: a.package,
      brand: a.brand,
      package: a.package,
      score: s,
      revenue: a.revenue,
      leads: a.leads,
      sales: a.sales
    });
  }
  out.sort((a, c) => c.score - a.score || (c.revenue || 0) - (a.revenue || 0));
  const seen = new Set();
  const uniq = [];
  for (const x of out) {
    const k = x.type === "brand" ? `brand\t${WA.canonBrandKey(x.brand || x.key)}` : `app\t${x.key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (x.type === "brand") x.brand = WA.brandDisplay(x.brand || x.key);
    uniq.push(x);
    if (uniq.length >= limit) break;
  }
  return uniq;
};

WA.searchHref = (hit) => {
  if (!hit) return WA.href("/search.html");
  if (hit.type === "brand") return WA.href("/brand.html", { b: hit.brand || hit.key });
  return WA.href("/app.html", { p: hit.package || hit.key, b: hit.brand || "" });
};

WA.appCountryRows = (pkg, from, to, brand) => {
  let rows = WA.aggIn(from, to).filter((r) => r.package === pkg);
  if (brand) rows = rows.filter((r) => WA.sameBrand(r.brand, brand));
  const brands = [...new Set(rows.map((r) => r.brand).filter(Boolean))];
  return {
    rows,
    mode: rows.length ? "package" : "none",
    brands,
    app: { package: pkg, brand: brand || brands[0] || "", brands }
  };
};
