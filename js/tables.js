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

WA.bindSort = (table, onChange) => {
  table.querySelectorAll("th[data-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (WA.tableState.sortKey === key) WA.tableState.sortDir = WA.tableState.sortDir === "desc" ? "asc" : "desc";
      else {
        WA.tableState.sortKey = key;
        WA.tableState.sortDir = th.dataset.dir || "desc";
      }
      WA.tableState.page = 1;
      onChange();
    });
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
