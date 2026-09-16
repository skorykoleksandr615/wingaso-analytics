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
  RU:"Russia",IT:"Italy",BR:"Brazil",GB:"United Kingdom",DE:"Germany",CA:"Canada",ES:"Spain",NL:"Netherlands",PL:"Poland",BE:"Belgium",
  CL:"Chile",KR:"South Korea",CO:"Colombia",FR:"France",PT:"Portugal",AR:"Argentina",UA:"Ukraine",ZA:"South Africa",AU:"Australia",PE:"Peru",
  UZ:"Uzbekistan",TR:"Turkey",CZ:"Czechia",BD:"Bangladesh",IN:"India",SA:"Saudi Arabia",EG:"Egypt",PH:"Philippines",GM:"Gambia",VE:"Venezuela",
  AZ:"Azerbaijan",CI:"Côte d’Ivoire",CH:"Switzerland",MY:"Malaysia",SK:"Slovakia",IE:"Ireland",TJ:"Tajikistan",AT:"Austria",HU:"Hungary",ID:"Indonesia",
  NG:"Nigeria",BY:"Belarus",NO:"Norway",CD:"DR Congo",HR:"Croatia",BF:"Burkina Faso",MX:"Mexico",TZ:"Tanzania",CM:"Cameroon",ZM:"Zambia",
  SG:"Singapore",ET:"Ethiopia",GR:"Greece",DK:"Denmark",PK:"Pakistan",LV:"Latvia",FI:"Finland",KG:"Kyrgyzstan",EE:"Estonia",KE:"Kenya",
  SI:"Slovenia",LK:"Sri Lanka",DZ:"Algeria",BG:"Bulgaria",TG:"Togo",SE:"Sweden",MA:"Morocco",GA:"Gabon",NZ:"New Zealand",UG:"Uganda",
  GH:"Ghana",MN:"Mongolia",LB:"Lebanon",JO:"Jordan",IQ:"Iraq",IS:"Iceland",LT:"Lithuania",VN:"Vietnam",MR:"Mauritania",EC:"Ecuador",
  BO:"Bolivia",KZ:"Kazakhstan",BJ:"Benin",OM:"Oman",GE:"Georgia",AE:"UAE",NP:"Nepal",GN:"Guinea",SN:"Senegal",ZW:"Zimbabwe",
  KW:"Kuwait",MQ:"Martinique",CG:"Congo",MZ:"Mozambique",MM:"Myanmar",TH:"Thailand",MD:"Moldova",ML:"Mali",BH:"Bahrain",QA:"Qatar",
  RS:"Serbia",TD:"Chad",AO:"Angola",PA:"Panama",TN:"Tunisia",AM:"Armenia",DO:"Dominican Republic",SV:"El Salvador",SL:"Sierra Leone",GT:"Guatemala",
  RW:"Rwanda",CR:"Costa Rica",NE:"Niger",SY:"Syria",BA:"Bosnia",BW:"Botswana",UY:"Uruguay",LY:"Libya",NA:"Namibia",KH:"Cambodia",
  LR:"Liberia",SO:"Somalia",SD:"Sudan",MW:"Malawi",MG:"Madagascar",BI:"Burundi",CF:"Central African Republic",CU:"Cuba",HK:"Hong Kong",HT:"Haiti",
  JM:"Jamaica",JP:"Japan",LU:"Luxembourg",PF:"French Polynesia",RE:"Réunion",YE:"Yemen",MU:"Mauritius",DJ:"Djibouti",PS:"Palestine",US:"United States"
};

WA.REGIONS = {
  Europe: ["RU","IT","GB","DE","ES","NL","PL","BE","FR","PT","UA","CZ","CH","SK","IE","AT","HU","BY","NO","HR","GR","DK","LV","FI","EE","SI","BG","SE","IS","LT","MD","RS","AM","BA","LU","RE"],
  Asia: ["KR","UZ","TR","BD","IN","SA","EG","PH","AZ","MY","TJ","ID","SG","PK","KG","LK","MN","LB","JO","IQ","VN","KZ","OM","GE","AE","NP","KW","MM","TH","BH","QA","SY","KH","HK","JP","YE","PS"],
  Americas: ["BR","CA","CL","CO","AR","PE","VE","MX","EC","BO","PA","DO","SV","GT","CR","UY","CU","HT","JM","MQ"],
  Africa: ["ZA","GM","CI","NG","CD","BF","TZ","CM","ZM","ET","KE","DZ","TG","MA","GA","UG","GH","MR","BJ","GN","SN","ZW","CG","MZ","ML","TD","AO","TN","SL","RW","NE","BW","LY","NA","LR","SO","SD","MW","MG","BI","CF","MU","DJ"],
  Oceania: ["AU","NZ","PF"]
};

WA.clean = (s) => String(s || "").replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "").trim();

WA.money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
WA.money2 = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
WA.num = (n) => (Number(n) || 0).toLocaleString("en-US");
WA.pct = (sales, leads) => {
  const l = Number(leads) || 0;
  if (!l) return 0;
  return (Number(sales) || 0) / l * 100;
};
WA.pctTxt = (sales, leads) => WA.pct(sales, leads).toFixed(1) + "%";

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
  return acc;
}, { conversions: 0, leads: 0, sales: 0, revenue: 0 });

WA.delta = (cur, prev) => {
  if (!prev) return 0;
  return (cur - prev) / Math.abs(prev) * 100;
};

WA.aggIn = (from, to) => (WA.aggregated || []).filter((r) => WA.inRange(r.date, from, to));

WA.groupBy = (rows, keyFn) => {
  const map = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    const prev = map.get(k) || { key: k, conversions: 0, leads: 0, sales: 0, revenue: 0, dates: {}, countries: new Set(), brands: new Set(), apps: new Set() };
    prev.conversions += r.conversions || ((r.leads || 0) + (r.sales || 0));
    prev.leads += r.leads || 0;
    prev.sales += r.sales || 0;
    prev.revenue += r.revenue || 0;
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
