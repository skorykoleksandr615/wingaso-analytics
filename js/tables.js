WA.tableState = {
  page: 1,
  perPage: 25,
  sortKey: "revenue",
  sortDir: "desc",
  query: "",
  extra: {}
};

WA.resetTable = (sortKey = "revenue") => {
  WA.tableState.page = 1;
  WA.tableState.sortKey = sortKey;
  WA.tableState.sortDir = "desc";
  WA.tableState.query = "";
  WA.tableState.extra = {};
};

WA.sortRows = (rows, key, dir) => {
  const m = dir === "asc" ? 1 : -1;
  return rows.slice().sort((a, b) => {
    const va = a[key], vb = b[key];
    if (typeof va === "string" || typeof vb === "string") return String(va || "").localeCompare(String(vb || ""), "ru") * m;
    return ((Number(va) || 0) - (Number(vb) || 0)) * m;
  });
};

WA.paginate = (rows) => {
  const { page, perPage } = WA.tableState;
  const start = (page - 1) * perPage;
  return {
    rows: rows.slice(start, start + perPage),
    total: rows.length,
    pages: Math.max(1, Math.ceil(rows.length / perPage))
  };
};

WA.markSort = (table, key, dir) => {
  if (!table) return;
  table.querySelectorAll("th[data-key]").forEach((th) => {
    const on = th.dataset.key === key;
    th.classList.toggle("sorted", on);
    th.dataset.sort = on ? dir : "";
  });
};

WA.bindTableSort = (table, state, onChange) => {
  if (!table) return;
  table.querySelectorAll("th[data-key]").forEach((th) => {
    th.onclick = () => {
      if (state.key === th.dataset.key) state.dir = state.dir === "desc" ? "asc" : "desc";
      else {
        state.key = th.dataset.key;
        state.dir = th.dataset.dir || "desc";
      }
      onChange();
    };
  });
  WA.markSort(table, state.key, state.dir);
};

WA.bindSort = (table, onChange) => {
  const state = {
    get key() { return WA.tableState.sortKey; },
    set key(v) { WA.tableState.sortKey = v; },
    get dir() { return WA.tableState.sortDir; },
    set dir(v) { WA.tableState.sortDir = v; }
  };
  WA.bindTableSort(table, state, () => {
    WA.tableState.page = 1;
    WA.markSort(table, WA.tableState.sortKey, WA.tableState.sortDir);
    onChange();
  });
};

WA.matchZero = (row, extra = {}) => {
  const checks = [];
  if (extra.noInst) checks.push((Number(row.installs) || 0) === 0);
  if (extra.noLead) checks.push((Number(row.leads) || 0) === 0);
  if (extra.noSale) checks.push((Number(row.sales) || 0) === 0);
  if (!checks.length) return true;
  return checks.every(Boolean);
};

WA.bindZeroFilters = (root, extra, onChange) => {
  if (!root) return;
  root.querySelectorAll("[data-zero]").forEach((el) => {
    extra[el.dataset.zero] = el.checked;
    el.onchange = () => {
      extra[el.dataset.zero] = el.checked;
      WA.tableState.page = 1;
      onChange();
    };
  });
};

WA.renderPager = (host, pageObj, onChange) => {
  host.innerHTML = `
    <span>${WA.num(pageObj.total)} строк · стр. ${pageObj.pages ? WA.tableState.page : 0}/${pageObj.pages}</span>
    <span>
      <button type="button" data-act="prev">Назад</button>
      <button type="button" data-act="next">Далее</button>
      <button type="button" data-act="csv">CSV</button>
    </span>
  `;
  host.querySelector("[data-act=prev]").onclick = () => { if (WA.tableState.page > 1) { WA.tableState.page--; onChange(); } };
  host.querySelector("[data-act=next]").onclick = () => { if (WA.tableState.page < pageObj.pages) { WA.tableState.page++; onChange(); } };
  host.querySelector("[data-act=csv]").onclick = () => host.dispatchEvent(new CustomEvent("csv"));
};

WA.csv = (filename, headers, rows) => {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(",")].concat(rows.map((r) => r.map(esc).join(",")));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};
