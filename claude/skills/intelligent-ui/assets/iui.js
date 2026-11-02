/* Intelligent UI app kit runtime (window.IUI). Inlined by build.py before the app's own markup and script.
 * Everything is event-delegated at the document, so it keeps working after the app re-renders.
 * Events (bubble, detail in e.detail): iui:screen {id,arg,dir} · iui:change {name,value,values} ·
 * iui:delete {id} · iui:reorder {from,to,id} · iui:page {index,total} · iui:done · iui:sheet {id,open}
 */
(function () {
  "use strict";
  if (window.IUI && window.IUI.version) return;
  const IUI = (window.IUI = { version: 2 });
  const doc = document, root = doc.documentElement;
  const EASE = "cubic-bezier(.32,.72,0,1)";
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (r, s) => Array.from((r || doc).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const emit = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  IUI.clamp = clamp;

  /* ================= storage, ids, arrays ================= */
  IUI.store = function (key, fallback) {
    const k = "iui:" + key;
    return {
      get() { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
      set(v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
      clear() { try { localStorage.removeItem(k); } catch (e) {} },
    };
  };
  IUI.uid = () => Math.random().toString(36).slice(2, 10);
  IUI.move = function (arr, from, to) { const a = arr.slice(); if (from < 0 || from >= a.length) return a; const [x] = a.splice(from, 1); a.splice(clamp(to, 0, a.length), 0, x); return a; };

  /* ================= safe HTML templates ================= */
  function Safe(s) { this.s = s; }
  Safe.prototype.toString = function () { return this.s; };
  IUI.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  IUI.raw = (s) => new Safe(String(s));
  const interp = (v) => (v == null || v === false ? "" : v instanceof Safe ? v.s : Array.isArray(v) ? v.map(interp).join("") : IUI.esc(v));
  IUI.html = function (strings, ...vals) { let out = strings[0]; vals.forEach((v, i) => { out += interp(v) + strings[i + 1]; }); return new Safe(out); };

  /* ================= formatting ================= */
  const pad = (n) => (n < 10 ? "0" : "") + n;
  function toDate(d) { if (d instanceof Date) return d; if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd); } return new Date(d); }
  IUI.today = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  IUI.addDays = (iso, n) => { const d = toDate(iso); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  IUI.fmt = {
    num: (n, d) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }),
    fixed: (n, d) => Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }),
    money: (n, cur, d) => Number(n).toLocaleString(undefined, { style: "currency", currency: cur || "USD", maximumFractionDigits: d == null ? 0 : d }),
    pct: (n) => Math.round(n * 100) + "%",
    date: (d) => toDate(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    day(d) { const x = toDate(d), t = toDate(IUI.today()), diff = Math.round((t - x) / 864e5); return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : diff > 1 && diff < 7 ? x.toLocaleDateString(undefined, { weekday: "long" }) : IUI.fmt.date(x); },
    weekday: (d) => toDate(d).toLocaleDateString(undefined, { weekday: "short" }),
    time: (mins) => { mins = Math.round(mins); return pad(Math.floor(mins / 60) % 24) + ":" + pad(((mins % 60) + 60) % 60); },
    dur: (mins) => { mins = Math.round(mins); const h = Math.floor(mins / 60), m = mins % 60; return h ? h + " h" + (m ? " " + m + " min" : "") : m + " min"; },
    dist: (km) => (km < 1 ? Math.round((km * 1000) / 10) * 10 + " m" : IUI.fmt.num(km, km < 10 ? 1 : 0) + " km"),
  };

  /* ================= icons (hand-drawn 24px stroke set) ================= */
  const F = ' fill="currentColor" stroke="none"';
  const ICONS = {
    "chevron-left": '<path d="M15 5l-7 7 7 7"/>', "chevron-right": '<path d="M9 5l7 7-7 7"/>', "chevron-down": '<path d="M5 9l7 7 7-7"/>', "chevron-up": '<path d="M5 15l7-7 7 7"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>', "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>', "arrow-down": '<path d="M12 5v14M6 13l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    "check-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.7 2.7L16 9.6"/>', "minus-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5"/>', edit: '<path d="M4 20l1.2-4.3L16 4.9l3.1 3.1L8.3 18.8zM13.8 7.1l3.1 3.1"/>',
    grip: '<circle cx="9" cy="6.5" r="1.4"' + F + '/><circle cx="15" cy="6.5" r="1.4"' + F + '/><circle cx="9" cy="12" r="1.4"' + F + '/><circle cx="15" cy="12" r="1.4"' + F + '/><circle cx="9" cy="17.5" r="1.4"' + F + '/><circle cx="15" cy="17.5" r="1.4"' + F + "/>",
    reorder: '<path d="M4 8h16M4 12h16M4 16h16"/>',
    more: '<circle cx="6" cy="12" r="1.6"' + F + '/><circle cx="12" cy="12" r="1.6"' + F + '/><circle cx="18" cy="12" r="1.6"' + F + "/>",
    share: '<path d="M12 3.5v11M8 7.5l4-4 4 4M5.5 11v8.5h13V11"/>', heart: '<path d="M12 19.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
    star: '<path d="M12 3.8l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.4l-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z"/>',
    pin: '<path d="M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.3"/>',
    map: '<path d="M3.5 6.5L9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5zM9 4v13.5M15 6.5V20"/>',
    route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8"/>',
    walk: '<circle cx="13" cy="4.6" r="1.7"/><path d="M10.5 21l2-6.5-2.3-2.2.8-4.3M11 8l3.6 1 1.9 3.3M12.5 14.5l2.7 2.4.8 4.1M10.6 8.2L8 11.2"/>',
    car: '<path d="M4 16.5v-4L6.3 7h11.4L20 12.5v4zM4 12.5h16M6.5 16.5v2.3M17.5 16.5v2.3"/><circle cx="7.8" cy="14.3" r=".8"' + F + '/><circle cx="16.2" cy="14.3" r=".8"' + F + "/>",
    train: '<rect x="6" y="3.5" width="12" height="13" rx="3"/><path d="M6 10.5h12M8.5 16.5l-2 4M15.5 16.5l2 4"/><circle cx="9" cy="13.5" r=".8"' + F + '/><circle cx="15" cy="13.5" r=".8"' + F + "/>",
    bus: '<rect x="5" y="3.5" width="14" height="14" rx="2.5"/><path d="M5 11h14M7.5 17.5V20M16.5 17.5V20M9 6.5h6"/><circle cx="8.5" cy="14.3" r=".8"' + F + '/><circle cx="15.5" cy="14.3" r=".8"' + F + "/>",
    plane: '<path d="M10.5 4c0-1.3 3-1.3 3 0v5.3l7 4v2l-7-2.2v4.4l2 1.5v1.5L12 19.5l-3.5 1V19l2-1.5v-4.4l-7 2.2v-2l7-4z"/>',
    bed: '<path d="M3 18.5v-12M3 14h18v4.5M21 14v-2a3 3 0 0 0-3-3h-7.5v5"/><circle cx="6.8" cy="11" r="1.8"/>',
    food: '<path d="M7 3.5v17M4.8 3.5V8a2.2 2.2 0 0 0 4.4 0V3.5M17 20.5v-17c-2.6 1-3.7 4-3.7 7.6H17"/>',
    coffee: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5V6M12 3.5V6"/>',
    camera: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13.3" r="3.4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    sun: '<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5L7 7M17 17l1.5 1.5M5.5 18.5L7 17M17 7l1.5-1.5"/>',
    moon: '<path d="M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1z"/>',
    bulb: '<path d="M9.3 17.5h5.4M10.2 20.5h3.6M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5 1 1.3 1 2.1v1.4h4.8v-1.4c0-.8.4-1.6 1-2.1A5.8 5.8 0 0 0 12 3.5z"/>',
    cloud: '<path d="M7.2 18.5a4.3 4.3 0 0 1-.4-8.6 5.8 5.8 0 0 1 11.2 1.6 3.5 3.5 0 0 1-.6 7z"/>',
    drop: '<path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z"/>',
    steps: '<path d="M8.3 3.5c1.6 0 2.4 1.9 2.4 4.2 0 2.2-1 4.1-2.4 4.1S5.9 10 5.9 7.7c0-2.3.8-4.2 2.4-4.2zM6.4 14.3h3.8l-.3 2.1a1.6 1.6 0 0 1-3.2 0zM15.7 7.5c1.6 0 2.4 1.9 2.4 4.2 0 2.2-1 4.1-2.4 4.1s-2.4-1.9-2.4-4.1c0-2.3.8-4.2 2.4-4.2zM13.8 18.3h3.8l-.3 2.1a1.6 1.6 0 0 1-3.2 0z"/>',
    scale: '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4"/><path d="M8.2 10a4.6 4.6 0 0 1 7.6 0M12 10l1.4-2"/>',
    pulse: '<path d="M3 12h4l2.2-5.5 4.2 11 2.4-5.5H21"/>', flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4.2-3.2-5.6-3.6-9.6C11.8 7 10.6 9 10.6 11c-1.4-.9-2-2.4-2-3.6C7.2 9 6 11.4 6 15a6 6 0 0 0 6 6z"/>',
    wrench: '<path d="M14.8 4.4a4.6 4.6 0 0 0-4.2 6.2l-6.2 6.2a2.1 2.1 0 0 0 3 3l6.2-6.2a4.6 4.6 0 0 0 6.2-4.2l-2.8 2.7-2.9-.5-.5-2.9 2.7-2.8a4.6 4.6 0 0 0-1.5-1.5z"/>',
    tool: '<path d="M6.5 3.5h3v10.2a2.3 2.3 0 0 0 2.3 2.3h8.7v3h-8.7a5.3 5.3 0 0 1-5.3-5.3z"/>',
    bike: '<circle cx="5.8" cy="15.8" r="3.6"/><circle cx="18.2" cy="15.8" r="3.6"/><path d="M5.8 15.8l3.5-7h6.6l2.3 7M9.3 8.8l3.2 7 3.4-7M12.5 15.8H5.8M7.8 6.3h3M15.4 8.8l-.9-3.2h2.4"/>',
    layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8zM3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
    palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6s.8-1.7 1.8-1.7h2.1a3.8 3.8 0 0 0 3.8-3.8C20.5 6.9 16.7 3.5 12 3.5z"/><circle cx="7.6" cy="11.3" r="1.1"' + F + '/><circle cx="9.6" cy="7.4" r="1.1"' + F + '/><circle cx="14" cy="6.9" r="1.1"' + F + '/><circle cx="16.9" cy="10" r="1.1"' + F + "/>",
    roller: '<rect x="4" y="3.5" width="13.5" height="5" rx="1.5"/><path d="M17.5 6H20v5.2h-8v3.3"/><rect x="10.5" y="14.5" width="3" height="6" rx="1"/>',
    ruler: '<path d="M3.5 15.8L15.8 3.5l4.7 4.7L8.2 20.5zM7.3 12l2 2M10.2 9.1l2 2M13.1 6.2l2 2"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.9" r=".9"' + F + "/>",
    alert: '<path d="M12 4l8.8 15.5H3.2zM12 10v4.5"/><circle cx="12" cy="17" r=".9"' + F + "/>",
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1.1"' + F + '/><circle cx="4.8" cy="12" r="1.1"' + F + '/><circle cx="4.8" cy="17.5" r="1.1"' + F + "/>",
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>', undo: '<path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', home: '<path d="M4 11l8-7 8 7v9h-5.5v-6h-5v6H4z"/>',
    leaf: '<path d="M5 19c0-8.5 5.3-13.5 14.5-14 0 9.2-5 14-13.5 14zM5 19l7.5-7.5"/>', box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/>',
    crane: '<path d="M2.5 9.5l7 3.2L12 5l2.5 7.7 7-3.2-6 9.5h-7zM12 5l-1.3-1.8"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"' + F + "/>",
    bolt: '<path d="M13 3L5.5 13.5h6L10.5 21l8-10.5h-6z"/>', sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5"/>', compare: '<rect x="3.5" y="5" width="7.5" height="14" rx="1.5"/><rect x="13" y="5" width="7.5" height="14" rx="1.5"/>',
    window: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.5"/><path d="M12 3.5v17M4.5 12h15"/>',
    sofa: '<path d="M5 12V9a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 9v3M3.5 12.5a1.8 1.8 0 0 1 3.5 0V15h10v-2.5a1.8 1.8 0 0 1 3.5 0V18h-17zM5.5 18v1.5M18.5 18v1.5"/>',
    wallet: '<rect x="3.5" y="6.5" width="17" height="13" rx="2.5"/><path d="M3.5 10h17M15.5 14.5h2M6 6.5l9.5-3 1 3"/>',
    "check-list": '<path d="M4 6.5l1.8 1.8L9 5M4 12.5l1.8 1.8L9 11M4 18.5l1.8 1.8L9 17M12 7h8M12 13h8M12 19h8"/>',
    sparkle: '<path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9-1.9 5.6-1.9-5.6-5.6-1.9 5.6-1.9z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.3M12 18.2v2.3M3.5 12h2.3M18.2 12h2.3M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6"/>',
  };
  IUI.icons = Object.keys(ICONS);
  IUI.icon = (name, cls) => new Safe('<svg class="i' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>');
  function injectSprite() {
    if (doc.getElementById("iui-sprite") || !doc.body) return;
    const s = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.id = "iui-sprite"; s.setAttribute("aria-hidden", "true"); s.setAttribute("data-iui-gen", ""); s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    s.innerHTML = "<defs>" + Object.keys(ICONS).map((k) => '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + "</symbol>").join("") +
      '<marker id="iui-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1.5 1.5L8 5l-6.5 3.5" fill="none" style="stroke:var(--tint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>';
    doc.body.insertBefore(s, doc.body.firstChild);
  }

  /* ================= keyed DOM morph ================= */
  const isGen = (n) => n.nodeType === 1 && n.hasAttribute("data-iui-gen");
  const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") || n.id || null : null);
  const sameType = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && (a.tagName !== "INPUT" || a.type === b.type)));
  function nextNonGen(n) { let x = n.nextSibling; while (x && isGen(x)) x = x.nextSibling; return x; }
  function patch(a, b) {
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (isGen(a)) return;
    if (a.tagName === "INPUT" || a.tagName === "SELECT") {
      const oldV = a.getAttribute("value"), newV = b.getAttribute("value");
      if (oldV !== newV && doc.activeElement !== a) a.value = newV == null ? "" : newV;
      if (a.hasAttribute("checked") !== b.hasAttribute("checked")) a.checked = b.hasAttribute("checked");
    }
    const own = a.hasAttribute("data-iui-own");
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    for (const at of Array.from(a.attributes)) if (!b.hasAttribute(at.name) && !at.name.startsWith("data-iui-") && !(own && (at.name === "style" || at.name === "class"))) a.removeAttribute(at.name);
    if (own) return;
    if (a.tagName === "TEXTAREA") { if (doc.activeElement !== a && a.value !== b.textContent) a.value = b.textContent; return; }
    morphChildren(a, b);
  }
  function morphChildren(from, to) {
    const olds = Array.from(from.childNodes).filter((n) => !isGen(n));
    const byKey = new Map();
    olds.forEach((n) => { const k = keyOf(n); if (k != null) byKey.set(k, n); });
    const used = new Set(), result = [];
    let cur = 0;
    for (const nn of Array.from(to.childNodes)) {
      const k = keyOf(nn);
      let m = null;
      if (k != null) { m = byKey.get(k) || null; if (m && (used.has(m) || !sameType(m, nn))) m = null; }
      else {
        while (cur < olds.length && (used.has(olds[cur]) || keyOf(olds[cur]) != null)) cur++;
        if (cur < olds.length && sameType(olds[cur], nn)) m = olds[cur++];
      }
      if (m) { used.add(m); patch(m, nn); result.push(m); } else result.push(nn);
    }
    olds.forEach((n) => { if (!used.has(n)) n.remove(); });
    let ref = null;
    for (let j = result.length - 1; j >= 0; j--) {
      const n = result[j];
      if (n.parentNode !== from || nextNonGen(n) !== ref) from.insertBefore(n, ref);
      ref = n;
    }
  }
  IUI.morph = function (el, html) {
    el = typeof el === "string" ? doc.querySelector(el) : el;
    const t = doc.createElement("template");
    t.innerHTML = String(html);
    morphChildren(el, t.content);
    IUI.mount(el);
    return el;
  };

  /* ================= state + render ================= */
  IUI.state = function (key, initial) {
    const st = key ? IUI.store("state:" + key, null) : null;
    const init = () => (typeof initial === "function" ? initial() : JSON.parse(JSON.stringify(initial)));
    let value = st ? st.get() : null;
    if (value == null) value = init();
    const subs = [];
    let queued = false;
    const flush = () => { queued = false; subs.slice().forEach((f) => f(value)); };
    const kick = () => { if (!queued) { queued = true; queueMicrotask(flush); } };
    return {
      get: () => value,
      set(p) { value = typeof p === "function" ? p(value) : Object.assign({}, value, p); if (st) st.set(value); kick(); return value; },
      reset() { value = init(); if (st) st.clear(); kick(); },
      subscribe(f) { subs.push(f); return () => subs.splice(subs.indexOf(f), 1); },
    };
  };
  IUI.render = function (target, view, state) {
    const el = typeof target === "string" ? doc.querySelector(target) : target;
    const draw = () => IUI.morph(el, view(state ? state.get() : undefined));
    draw();
    if (state) state.subscribe(draw);
    return draw;
  };
  IUI.on = function (type, sel, fn, opts) {
    doc.addEventListener(type, (e) => { const el = e.target && e.target.closest && e.target.closest(sel); if (el) fn(e, el); }, opts);
  };

  /* ================= feedback ================= */
  IUI.haptic = function (kind) { try { if (navigator.vibrate) navigator.vibrate(kind === "success" ? [8, 60, 8] : kind === "heavy" ? 18 : kind === "warn" ? [14, 40, 14] : 6); } catch (e) {} };
  let wake = null, wantWake = false;
  IUI.keepAwake = async function (on) {
    wantWake = on !== false;
    try {
      if (wantWake && "wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); }
      if (!wantWake && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
    return !!wake;
  };
  doc.addEventListener("visibilitychange", () => { if (wantWake && doc.visibilityState === "visible") IUI.keepAwake(true); });

  let toastTimer = null;
  IUI.toast = function (msg, opts) {
    if (typeof opts === "function") opts = { undo: opts };
    opts = opts || {};
    const old = doc.querySelector(".toast"); if (old) old.remove();
    clearTimeout(toastTimer);
    const t = doc.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.setAttribute("data-iui-gen", "");
    t.innerHTML = (opts.icon ? IUI.icon(opts.icon) : "") + "<span>" + IUI.esc(msg) + "</span>" + (opts.undo ? '<button type="button">' + IUI.esc(opts.action || "Undo") + "</button>" : "");
    const hide = () => { clearTimeout(toastTimer); if (!t.isConnected) return; if (reduced()) return t.remove(); t.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(8px)" }], { duration: 180 }).onfinish = () => t.remove(); };
    if (opts.undo) t.querySelector("button").addEventListener("click", () => { opts.undo(); hide(); IUI.haptic(); });
    doc.body.appendChild(t);
    if (!reduced()) t.animate([{ transform: "translateY(16px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 260, easing: EASE });
    toastTimer = setTimeout(hide, opts.undo ? 6000 : 3200);
    return { hide };
  };

  /* ================= sheets & action sheets ================= */
  const desktop = () => innerWidth >= 680;
  function lockScroll(on) { root.style.overflow = on ? "hidden" : ""; }
  IUI.sheet = function (ref) {
    const d = typeof ref === "string" ? doc.getElementById(ref) : ref;
    return {
      el: d,
      open() {
        if (!d || d.open) return;
        d.showModal(); lockScroll(true);
        if (!d.querySelector("[autofocus]")) { d.tabIndex = -1; d.focus({ preventScroll: true }); }
        IUI.mount(d);
        if (!reduced()) d.animate(desktop() ? [{ transform: "scale(.96)", opacity: 0 }, { transform: "none", opacity: 1 }] : [{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 380, easing: EASE });
        emit(d, "iui:sheet", { id: d.id, open: true });
      },
      close() { closeDialog(d); },
    };
  };
  function closeDialog(d, from) {
    if (!d || !d.open || d._closing) return;
    d._closing = true;
    const done = () => { d._closing = false; d.style.transform = ""; d.close(); if (!doc.querySelector("dialog[open]")) lockScroll(false); emit(d, "iui:sheet", { id: d.id, open: false }); };
    if (reduced()) return done();
    const kf = d.classList.contains("zoom") ? [{ opacity: 1 }, { opacity: 0 }] : !desktop() ? [{ transform: "translateY(" + (from || 0) + "px)" }, { transform: "translateY(100%)" }] : [{ opacity: 1 }, { opacity: 0, transform: "scale(.97)" }];
    d.animate(kf, { duration: 260, easing: EASE }).onfinish = done;
  }
  IUI.closeSheet = (ref) => closeDialog(typeof ref === "string" ? doc.getElementById(ref) : ref);
  doc.addEventListener("cancel", (e) => { const d = e.target; if (d.matches && d.matches("dialog.sheet, dialog.action-sheet, dialog.zoom")) { e.preventDefault(); if (d._resolve) d._resolve(false); closeDialog(d); } }, true);
  doc.addEventListener("click", (e) => {
    const d = e.target;
    if (d.tagName === "DIALOG" && (d.classList.contains("sheet") || d.classList.contains("action-sheet"))) {
      const r = d.getBoundingClientRect();
      if (d.classList.contains("action-sheet") || e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) { if (d._resolve) d._resolve(false); closeDialog(d); }
    }
  });
  IUI.confirm = function (o) {
    o = typeof o === "string" ? { title: o } : o || {};
    return new Promise((resolve) => {
      const d = doc.createElement("dialog");
      d.className = "action-sheet"; d.setAttribute("data-iui-gen", "");
      d.innerHTML = '<div class="action-group">' + (o.title || o.message ? '<div class="action-msg">' + (o.title ? "<strong>" + IUI.esc(o.title) + "</strong>" : "") + IUI.esc(o.message || "") + "</div>" : "") +
        '<button type="button" class="action-btn' + (o.destructive !== false ? " destructive" : "") + '" data-ok>' + IUI.esc(o.confirm || "Delete") + "</button></div>" +
        '<div class="action-group"><button type="button" class="action-btn cancel" data-cancel>' + IUI.esc(o.cancel || "Cancel") + "</button></div>";
      doc.body.appendChild(d);
      let settled = false;
      d._resolve = (v) => { if (settled) return; settled = true; resolve(v); setTimeout(() => d.remove(), 500); };
      d.querySelector("[data-ok]").addEventListener("click", (e) => { e.stopPropagation(); d._resolve(true); closeDialog(d); IUI.haptic("heavy"); });
      d.querySelector("[data-cancel]").addEventListener("click", (e) => { e.stopPropagation(); d._resolve(false); closeDialog(d); });
      d.showModal(); lockScroll(true);
      d.querySelector("[data-cancel]").focus({ preventScroll: true });
      if (!reduced()) d.animate([{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 340, easing: EASE });
    });
  };
  let sd = null;
  doc.addEventListener("pointerdown", (e) => {
    const h = e.target.closest && e.target.closest("dialog.sheet .sheet-grabber, dialog.sheet .sheet-nav");
    if (!h || e.target.closest("button, a, input") || desktop()) return;
    sd = { d: h.closest("dialog"), y0: e.clientY, t0: performance.now(), dy: 0, id: e.pointerId };
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
  });
  doc.addEventListener("pointermove", (e) => { if (!sd || e.pointerId !== sd.id) return; sd.dy = Math.max(0, e.clientY - sd.y0); sd.d.style.transform = "translateY(" + sd.dy + "px)"; });
  const endSheetDrag = (e) => {
    if (!sd || e.pointerId !== sd.id) return;
    const { d, dy, t0 } = sd; sd = null;
    const v = dy / Math.max(1, performance.now() - t0);
    if (dy > Math.min(140, d.offsetHeight * 0.3) || (v > 0.6 && dy > 30)) closeDialog(d, dy);
    else { d.style.transform = ""; d.animate([{ transform: "translateY(" + dy + "px)" }, { transform: "none" }], { duration: 250, easing: EASE }); }
  };
  doc.addEventListener("pointerup", endSheetDrag); doc.addEventListener("pointercancel", endSheetDrag);

  /* ================= navigation stack ================= */
  const nav = { stack: null, saved: {}, busy: false, store: null };
  const screensAll = () => $$(doc, ".screen");
  function ensureNav() {
    if (nav.stack) return;
    nav.store = IUI.store("nav:" + (doc.title || location.pathname), null);
    const all = screensAll();
    const first = all.find((s) => !s.hidden) || all[0];
    nav.stack = first ? [{ id: first.id }] : [];
    all.forEach((s) => { s.hidden = s !== first; });
  }
  const screenEl = (entry) => entry && doc.getElementById(entry.id);
  const top = () => nav.stack[nav.stack.length - 1];
  IUI.current = () => (ensureNav(), top());
  function titleOf(s) { if (!s) return ""; const t = s.getAttribute("data-title") || (s.querySelector(".large-title") || s.querySelector(".nav-title") || {}).textContent || ""; return t.trim(); }
  function decorate(s) {
    if (!s) return;
    const prev = nav.stack.length > 1 ? screenEl(nav.stack[nav.stack.length - 2]) : null;
    $$(s, "[data-back] .back-label").forEach((b) => { b.textContent = prev ? titleOf(prev) : "Back"; });
    $$(s, ".nav").forEach((n) => { const nt = n.querySelector(".nav-title"); if (nt && !nt.textContent.trim()) nt.textContent = titleOf(s); if (!s.querySelector(".large-title")) n.classList.add("inline"); });
    $$(doc, ".tabbar").forEach((tb) => {
      tb.hidden = s.hasAttribute("data-hide-tabbar");
      $$(tb, "[data-tab]").forEach((t) => { const on = !!nav.stack[0] && t.getAttribute("data-tab") === nav.stack[0].id; t.setAttribute("aria-selected", on ? "true" : "false"); if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
    });
    $$(s, ".pager").forEach((p) => requestAnimationFrame(() => snapPager(p)));
    updateScrolled(); measureBars();
  }
  const persistNav = () => { if (nav.store) nav.store.set(nav.stack); };
  function swap(nextEntry, dir, animate) {
    const curEl = screenEl(top()), nextEl = screenEl(nextEntry);
    if (!nextEl || nav.busy) return;
    emit(nextEl, "iui:screen", { id: nextEntry.id, arg: nextEntry.arg, dir });
    if (curEl) nav.saved[curEl.id] = scrollY;
    if (dir > 0) nav.stack.push(nextEntry); else if (dir < 0) nav.stack.pop(); else nav.stack = [nextEntry];
    persistNav();
    const restoreY = dir < 0 ? nav.saved[nextEl.id] || 0 : 0;
    if (!animate || reduced() || !curEl || curEl === nextEl) {
      if (curEl && curEl !== nextEl) curEl.hidden = true;
      nextEl.hidden = false; scrollTo(0, restoreY); decorate(nextEl); return;
    }
    nav.busy = true;
    const scrim = doc.createElement("div"); scrim.className = "scrim"; scrim.setAttribute("data-iui-gen", ""); doc.body.appendChild(scrim);
    if (dir > 0) {
      nextEl.hidden = false; nextEl.classList.add("screen-overlay"); nextEl.scrollTop = 0; decorate(nextEl);
      scrim.animate([{ opacity: 0 }, { opacity: 0.12 }], { duration: 380, fill: "forwards" });
      nextEl.animate([{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 400, easing: EASE }).onfinish = () => {
        nextEl.classList.remove("screen-overlay"); curEl.hidden = true; scrim.remove(); scrollTo(0, 0); nav.busy = false; decorate(nextEl);
      };
    } else {
      const y = scrollY;
      curEl.classList.add("screen-overlay"); curEl.scrollTop = y;
      nextEl.hidden = false; scrollTo(0, restoreY); decorate(nextEl);
      scrim.animate([{ opacity: 0.12 }, { opacity: 0 }], { duration: 340, fill: "forwards" });
      curEl.animate([{ transform: "none" }, { transform: "translateX(100%)" }], { duration: 340, easing: EASE }).onfinish = () => {
        curEl.hidden = true; curEl.classList.remove("screen-overlay"); scrim.remove(); nav.busy = false; decorate(nextEl);
      };
    }
  }
  IUI.go = function (id, arg) { ensureNav(); if (top() && top().id === id) return; swap({ id, arg: arg == null ? undefined : arg }, 1, true); };
  IUI.back = function () { ensureNav(); if (nav.stack.length < 2) return false; swap(nav.stack[nav.stack.length - 2], -1, true); return true; };
  IUI.tab = function (id) { ensureNav(); if (nav.stack.length === 1 && top().id === id) { scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); return; } swap({ id }, 0, false); IUI.haptic(); };
  IUI.onScreen = function (id, fn) { doc.addEventListener("iui:screen", (e) => { if (e.detail.id === id) fn(e.detail.arg, e.detail); }); };
  function restoreNav() {
    ensureNav();
    const saved = nav.store.get();
    if (Array.isArray(saved) && saved.length && saved.every((s) => s && doc.getElementById(s.id))) {
      screensAll().forEach((s) => (s.hidden = true));
      nav.stack = saved;
    }
    const s = screenEl(top());
    if (!s) return;
    emit(s, "iui:screen", { id: top().id, arg: top().arg, dir: 0, restored: true });
    s.hidden = false; decorate(s);
  }
  // edge swipe back (iOS-style): drag from the left edge of a pushed screen
  let eb = null;
  doc.addEventListener("pointerdown", (e) => {
    if (!nav.stack || nav.stack.length < 2 || nav.busy || e.pointerType === "mouse" || e.clientX > 24 || doc.querySelector("dialog[open]")) return;
    eb = { x0: e.clientX, y0: e.clientY, id: e.pointerId, on: false, t0: performance.now(), dx: 0 };
  }, true);
  doc.addEventListener("pointermove", (e) => {
    if (!eb || e.pointerId !== eb.id) return;
    const dx = e.clientX - eb.x0, dy = e.clientY - eb.y0;
    if (!eb.on) {
      if (dx > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        eb.on = true;
        const cur = screenEl(top()), prevE = nav.stack[nav.stack.length - 2], prev = screenEl(prevE);
        eb.cur = cur; eb.prev = prev; eb.y = scrollY;
        cur.classList.add("screen-overlay"); cur.scrollTop = eb.y;
        emit(prev, "iui:screen", { id: prev.id, arg: prevE.arg, dir: -1 });
        prev.hidden = false; scrollTo(0, nav.saved[prev.id] || 0);
      } else if (Math.abs(dy) > 12) { eb = null; return; } else return;
    }
    eb.dx = Math.max(0, dx); eb.cur.style.transform = "translateX(" + eb.dx + "px)";
  }, true);
  const endEdge = (e) => {
    if (!eb || e.pointerId !== eb.id) return;
    const g = eb; eb = null;
    if (!g.on) return;
    swSuppress = true; setTimeout(() => { swSuppress = false; }, 350);
    const v = g.dx / Math.max(1, performance.now() - g.t0);
    if (e.type === "pointerup" && (g.dx > innerWidth * 0.33 || (v > 0.45 && g.dx > 60))) {
      nav.saved[g.cur.id] = g.y; nav.stack.pop(); persistNav(); nav.busy = true;
      g.cur.animate([{ transform: "translateX(" + g.dx + "px)" }, { transform: "translateX(100%)" }], { duration: 260, easing: EASE }).onfinish = () => { g.cur.hidden = true; g.cur.classList.remove("screen-overlay"); g.cur.style.transform = ""; nav.busy = false; decorate(g.prev); };
    } else {
      g.cur.animate([{ transform: "translateX(" + g.dx + "px)" }, { transform: "none" }], { duration: 240, easing: EASE }).onfinish = () => { g.prev.hidden = true; g.cur.classList.remove("screen-overlay"); g.cur.style.transform = ""; scrollTo(0, g.y); };
    }
  };
  doc.addEventListener("pointerup", endEdge, true); doc.addEventListener("pointercancel", endEdge, true);

  /* ================= nav bar state & bottom inset ================= */
  function activeScreen() { return doc.querySelector(".screen.screen-overlay:not([hidden])") || (nav.stack && screenEl(top())) || doc.querySelector(".screen:not([hidden])") || doc.querySelector(".app") || doc.body; }
  function updateScrolled() {
    $$(doc, ".nav").forEach((n) => {
      const s = n.closest(".screen") || n.closest(".app");
      if (!s || s.hidden) return;
      const y = s.classList.contains("screen-overlay") ? s.scrollTop : scrollY;
      const lt = s.querySelector(".large-title");
      const on = lt ? lt.getBoundingClientRect().bottom < n.getBoundingClientRect().bottom + 2 : y > 2;
      if (on) n.setAttribute("data-iui-scrolled", ""); else n.removeAttribute("data-iui-scrolled");
      const nt = n.querySelector(".nav-title");
      if (nt) { if (lt && !on) nt.setAttribute("aria-hidden", "true"); else nt.removeAttribute("aria-hidden"); }
    });
  }
  let scrollRaf = 0;
  doc.addEventListener("scroll", () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateScrolled(); }); }, { capture: true, passive: true });
  function measureBars() {
    const s = activeScreen();
    let tab = 0, own = 0;
    $$(doc, ".tabbar").forEach((t) => { if (!t.hidden && t.getClientRects().length) tab = Math.max(tab, t.offsetHeight); });
    if (s) $$(s, ".bottom-bar, .pager-bar").forEach((b) => { if (!b.hidden && b.getClientRects().length) { own = Math.max(own, b.offsetHeight); b.style.bottom = tab ? tab + "px" : ""; } });
    root.style.setProperty("--bottom-inset", tab + own + "px");
  }
  IUI.layout = measureBars;
  addEventListener("resize", () => { measureBars(); $$(doc, ".pager").forEach(snapPager); });

  /* ================= segmented controls, chips, steppers, switches ================= */
  function updateSeg(seg) {
    const bs = $$(seg, ":scope > button");
    if (!bs.length) return;
    seg.setAttribute("role", "radiogroup");
    let i = bs.findIndex((b) => b.getAttribute("aria-checked") === "true");
    if (i < 0) { i = 0; bs[0].setAttribute("aria-checked", "true"); }
    bs.forEach((b, k) => { b.setAttribute("role", "radio"); b.type = "button"; b.tabIndex = k === i ? 0 : -1; if (k !== i) b.setAttribute("aria-checked", "false"); });
    seg.style.setProperty("--n", bs.length); seg.style.setProperty("--i", i);
  }
  function pickSeg(b, focus) {
    const seg = b.parentElement, bs = $$(seg, ":scope > button");
    if (b.getAttribute("aria-checked") === "true") return;
    bs.forEach((x) => x.setAttribute("aria-checked", x === b ? "true" : "false"));
    updateSeg(seg); if (focus) b.focus(); IUI.haptic();
    emit(seg, "iui:change", { name: seg.getAttribute("data-seg") || seg.id, value: b.getAttribute("data-value") || b.textContent.trim(), index: bs.indexOf(b) });
  }
  IUI.on("click", ".seg > button", (e, b) => pickSeg(b));
  IUI.on("keydown", ".seg > button", (e, b) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return; e.preventDefault();
    const bs = $$(b.parentElement, ":scope > button"); pickSeg(bs[(bs.indexOf(b) + d + bs.length) % bs.length], true);
  });
  function updateChips(g) { $$(g, ".chip").forEach((c) => { if (c.tagName === "BUTTON") c.type = "button"; if (!c.hasAttribute("aria-pressed")) c.setAttribute("aria-pressed", "false"); }); }
  IUI.on("click", "[data-chips] .chip", (e, c) => {
    const g = c.closest("[data-chips]"), multi = g.hasAttribute("data-multi"), cs = $$(g, ".chip");
    if (multi) c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true");
    else { if (c.getAttribute("aria-pressed") === "true" && !g.hasAttribute("data-deselect")) return; const on = c.getAttribute("aria-pressed") !== "true"; cs.forEach((x) => x.setAttribute("aria-pressed", x === c && on ? "true" : "false")); }
    IUI.haptic();
    const values = cs.filter((x) => x.getAttribute("aria-pressed") === "true").map((x) => x.getAttribute("data-value") || x.textContent.trim());
    emit(g, "iui:change", { name: g.getAttribute("data-chips"), value: values[0], values });
  });
  function updateStepper(s) {
    const i = s.querySelector("input"); if (!i) return;
    $$(s, "button").forEach((b) => { b.type = "button"; });
    const v = parseFloat(i.value), min = i.min === "" ? -Infinity : +i.min, max = i.max === "" ? Infinity : +i.max;
    const dn = s.querySelector('[data-step^="-"]'), up = s.querySelector('[data-step]:not([data-step^="-"])');
    if (dn) dn.disabled = v <= min; if (up) up.disabled = v >= max;
  }
  IUI.on("click", ".stepper [data-step]", (e, b) => {
    const s = b.closest(".stepper"), i = s.querySelector("input");
    const step = (parseFloat(i.step) || 1) * Math.sign(parseFloat(b.getAttribute("data-step")) || 1);
    const min = i.min === "" ? -Infinity : +i.min, max = i.max === "" ? Infinity : +i.max;
    const dec = ((i.step || "1").split(".")[1] || "").length;
    i.value = clamp(+((parseFloat(i.value) || 0) + step).toFixed(dec), min, max);
    i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true }));
    updateStepper(s); IUI.haptic();
  });
  IUI.on("input", ".stepper input", (e, i) => updateStepper(i.closest(".stepper")));
  IUI.on("change", ".switch, .check-input", () => IUI.haptic());

  /* ================= declarative navigation & dialogs ================= */
  IUI.on("click", "[data-go]", (e, el) => { if (e.defaultPrevented) return; e.preventDefault(); IUI.go(el.getAttribute("data-go"), el.getAttribute("data-arg")); });
  IUI.on("click", "[data-back]", (e) => { e.preventDefault(); IUI.back(); });
  IUI.on("click", "[data-tab]", (e, el) => { e.preventDefault(); IUI.tab(el.getAttribute("data-tab")); });
  IUI.on("click", "[data-sheet]", (e, el) => { e.preventDefault(); IUI.sheet(el.getAttribute("data-sheet")).open(); });
  IUI.on("click", "[data-close]", (e, el) => { e.preventDefault(); closeDialog(el.closest("dialog")); });
  IUI.on("click", "[data-edit]", (e, el) => {
    const l = doc.getElementById(el.getAttribute("data-edit")); if (!l) return;
    const on = l.classList.toggle("editing");
    el.textContent = on ? el.getAttribute("data-done-label") || "Done" : el.getAttribute("data-edit-label") || "Edit";
    el.classList.toggle("strong", on);
  });

  /* ================= swipe-to-delete rows ================= */
  const ACT = 92;
  let sw = null, swSuppress = false;
  function closeRow(r) { if (!r) return; r.setAttribute("data-iui-anim", ""); r.style.setProperty("--sw", "0px"); r.removeAttribute("data-iui-open"); }
  function deleteRow(row) {
    if (!row || row.classList.contains("collapsing")) return;
    IUI.haptic("heavy");
    row.setAttribute("data-iui-anim", ""); row.style.setProperty("--sw", row.offsetWidth + "px");
    row.style.maxHeight = row.offsetHeight + "px";
    setTimeout(() => row.classList.add("collapsing"), 120);
    setTimeout(() => {
      emit(row, "iui:delete", { id: row.getAttribute("data-id") || row.getAttribute("data-key") });
      setTimeout(() => { if (row.isConnected) { row.classList.remove("collapsing"); row.style.maxHeight = ""; closeRow(row); } }, 150);
    }, 330);
  }
  IUI.deleteRow = deleteRow;
  doc.addEventListener("click", (e) => {
    if (swSuppress) { swSuppress = false; e.preventDefault(); e.stopImmediatePropagation(); return; }
    const open = e.target.closest && e.target.closest(".row[data-swipe][data-iui-open]");
    $$(doc, ".row[data-iui-open]").forEach((r) => { if (r !== open) closeRow(r); });
    if (open) {
      e.preventDefault(); e.stopImmediatePropagation();
      const r = open.getBoundingClientRect();
      if (e.clientX > r.right - ACT) deleteRow(open); else closeRow(open);
      return;
    }
    const del = e.target.closest && e.target.closest(".row-del");
    if (del) { e.preventDefault(); e.stopImmediatePropagation(); deleteRow(del.closest(".row")); }
  }, true);
  doc.addEventListener("pointerdown", (e) => {
    const row = e.target.closest && e.target.closest(".row[data-swipe]");
    if (!row || e.button > 0 || e.target.closest(".handle, input, .stepper, .switch") || (e.pointerType !== "mouse" && e.clientX < 24 && nav.stack && nav.stack.length > 1)) return;
    sw = { row, x0: e.clientX, y0: e.clientY, base: row.hasAttribute("data-iui-open") ? ACT : 0, on: false, id: e.pointerId, w: 0 };
  });
  doc.addEventListener("pointermove", (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x0, dy = e.clientY - sw.y0;
    if (!sw.on) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        sw.on = true; try { sw.row.setPointerCapture(e.pointerId); } catch (x) {}
        sw.row.removeAttribute("data-iui-anim");
        $$(doc, ".row[data-iui-open]").forEach((r) => { if (r !== sw.row) closeRow(r); });
      } else if (Math.abs(dy) > 10) { sw = null; return; } else return;
    }
    const W = sw.row.offsetWidth;
    let w = sw.base - dx; if (w < 0) w = w / 4; w = clamp(w, -16, W);
    sw.w = w; sw.row.style.setProperty("--sw", w + "px");
    const armed = w > W * 0.6;
    if (armed !== !!sw.armed) { sw.armed = armed; IUI.haptic(); }
  });
  const endSwipe = (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const g = sw; sw = null;
    if (!g.on) return;
    if (e.type === "pointerup") { swSuppress = true; setTimeout(() => { swSuppress = false; }, 350); }
    const W = g.row.offsetWidth;
    if (g.w > W * 0.6) deleteRow(g.row);
    else if (g.w > ACT / 2) { g.row.setAttribute("data-iui-anim", ""); g.row.style.setProperty("--sw", ACT + "px"); g.row.setAttribute("data-iui-open", ""); }
    else closeRow(g.row);
  };
  doc.addEventListener("pointerup", endSwipe); doc.addEventListener("pointercancel", endSwipe);

  /* ================= drag to reorder ================= */
  let rd = null;
  const rowsOf = (list) => Array.from(list.children).filter((c) => c.classList.contains("row") && !c.hidden);
  doc.addEventListener("pointerdown", (e) => {
    const h = e.target.closest && e.target.closest("[data-reorder] .handle");
    if (!h || e.button > 0) return;
    e.preventDefault();
    const row = h.closest(".row"), list = row.parentElement;
    list.classList.add("reordering");
    const items = rowsOf(list), from = items.indexOf(row);
    const rects = items.map((r) => { const b = r.getBoundingClientRect(); return { top: b.top + scrollY, h: b.height }; });
    rd = { list, row, items, rects, from, to: from, y0: e.clientY, sy0: scrollY, id: e.pointerId, lastY: e.clientY, moved: false };
    try { h.setPointerCapture(e.pointerId); } catch (x) {}
    row.classList.add("dragging"); IUI.haptic();
    items.forEach((r) => { if (r !== row) r.classList.add("shifting"); });
    const auto = () => {
      if (!rd) return;
      const y = rd.lastY, lim = innerHeight - (parseFloat(root.style.getPropertyValue("--bottom-inset")) || 0);
      if (rd.moved) { if (y > lim - 56) scrollBy(0, 7); else if (y < 110) scrollBy(0, -7); dragTo(y); }
      rd.raf = requestAnimationFrame(auto);
    };
    rd.raf = requestAnimationFrame(auto);
  });
  function dragTo(y) {
    const g = rd, dy = y - g.y0 + (scrollY - g.sy0);
    g.row.style.transform = "translateY(" + dy + "px) scale(1.02)";
    const c = g.rects[g.from].top + g.rects[g.from].h / 2 + dy;
    let to = g.from;
    for (let i = g.from + 1; i < g.rects.length; i++) if (c > g.rects[i].top + g.rects[i].h / 2) to = i;
    for (let i = 0; i < g.from; i++) if (c < g.rects[i].top + g.rects[i].h / 2) { to = i; break; }
    if (to !== g.to) { g.to = to; IUI.haptic(); }
    const h = g.rects[g.from].h;
    g.items.forEach((r, i) => { if (r === g.row) return; const s = g.from < i && i <= to ? -h : to <= i && i < g.from ? h : 0; r.style.transform = s ? "translateY(" + s + "px)" : ""; });
  }
  doc.addEventListener("pointermove", (e) => { if (!rd || e.pointerId !== rd.id) return; rd.lastY = e.clientY; rd.moved = true; dragTo(e.clientY); });
  const endDrag = (e) => {
    if (!rd || e.pointerId !== rd.id) return;
    const g = rd; rd = null; cancelAnimationFrame(g.raf);
    g.items.forEach((r) => { r.classList.remove("shifting"); r.style.transform = ""; });
    g.row.classList.remove("dragging"); g.list.classList.remove("reordering");
    if (g.to !== g.from) emit(g.list, "iui:reorder", { from: g.from, to: g.to, id: g.row.getAttribute("data-id") || g.row.getAttribute("data-key") });
  };
  doc.addEventListener("pointerup", endDrag); doc.addEventListener("pointercancel", endDrag);
  IUI.on("keydown", "[data-reorder] .handle", (e, h) => {
    const d = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0; if (!d) return;
    e.preventDefault();
    const row = h.closest(".row"), list = row.parentElement, items = rowsOf(list), from = items.indexOf(row), to = from + d;
    if (to < 0 || to >= items.length) return;
    const key = row.getAttribute("data-key") || row.getAttribute("data-id");
    emit(list, "iui:reorder", { from, to, id: key });
    requestAnimationFrame(() => requestAnimationFrame(() => { const r = key && list.querySelector('[data-key="' + CSS.escape(key) + '"] .handle, [data-id="' + CSS.escape(key) + '"] .handle'); if (r) r.focus(); }));
  });

  /* ================= pager (step-through) ================= */
  const pages = (p) => Array.from(p.children).filter((c) => c.classList.contains("page"));
  const pagerIndex = (p) => clamp(Math.round(p.scrollLeft / Math.max(1, p.clientWidth)), 0, Math.max(0, pages(p).length - 1));
  function snapPager(p) { if (!p._iui || !p.clientWidth) return; const i = p._iui.i || 0; if (Math.abs(p.scrollLeft - i * p.clientWidth) > 2) p.scrollTo({ left: i * p.clientWidth, behavior: "auto" }); updatePager(p); }
  function mountPager(p) {
    if (p._iui) return updatePager(p);
    const key = p.getAttribute("data-pager") || p.id || "pager";
    const st = IUI.store("pager:" + key, 0);
    const prog = doc.createElement("div"); prog.className = "pager-progress"; prog.setAttribute("data-iui-gen", ""); prog.setAttribute("aria-hidden", "true");
    p.parentNode.insertBefore(prog, p);
    const host = p.closest(".screen") || doc.body;
    const bar = doc.createElement("div"); bar.className = "pager-bar"; bar.setAttribute("data-iui-gen", "");
    bar.innerHTML = '<button type="button" class="btn plain" data-pg="prev">' + IUI.icon("chevron-left") + '<span>Back</span></button><button type="button" class="count" data-pg="all" aria-haspopup="dialog"></button><button type="button" class="btn fill" data-pg="next"></button>';
    host.appendChild(bar);
    p._iui = { st, prog, bar, i: clamp(st.get() || 0, 0, Math.max(0, pages(p).length - 1)), key };
    p.setAttribute("aria-roledescription", "carousel");
    let t = 0;
    p.addEventListener("scroll", () => { updatePager(p, true); clearTimeout(t); t = setTimeout(() => updatePager(p), 90); }, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(() => measureBars()).observe(bar);
    requestAnimationFrame(() => { if (p.clientWidth) p.scrollLeft = p._iui.i * p.clientWidth; updatePager(p); measureBars(); });
  }
  function updatePager(p, live) {
    const s = p._iui; if (!s) return;
    const ps = pages(p), n = ps.length, i = p.clientWidth ? pagerIndex(p) : s.i;
    if (s.prog.children.length !== n) s.prog.innerHTML = "<i></i>".repeat(n);
    Array.from(s.prog.children).forEach((seg, k) => seg.style.setProperty("--f", k <= i ? 1 : 0));
    const cnt = s.bar.querySelector(".count"); cnt.textContent = i + 1 + " / " + n; cnt.setAttribute("aria-label", "Step " + (i + 1) + " of " + n + ". Show all steps");
    s.bar.querySelector('[data-pg="prev"]').disabled = i === 0;
    const last = i === n - 1, nx = s.bar.querySelector('[data-pg="next"]');
    const label = last ? p.getAttribute("data-done") || "Done" : p.getAttribute("data-next") || "Next";
    if (nx.textContent !== label) nx.innerHTML = IUI.esc(label) + (last ? "" : String(IUI.icon("chevron-right", "sm")));
    ps.forEach((pg, k) => { const on = k === i; if (on) pg.removeAttribute("aria-hidden"); else pg.setAttribute("aria-hidden", "true"); pg.inert = !on; pg.setAttribute("aria-label", "Step " + (k + 1) + " of " + n); });
    if (!live && i !== s.i) { s.i = i; s.st.set(i); emit(p, "iui:page", { index: i, total: n }); IUI.haptic(); }
    else if (!live) s.i = i;
  }
  IUI.pagerGo = function (p, i) {
    p = typeof p === "string" ? doc.getElementById(p) : p;
    if (!p || !p._iui) return;
    const n = pages(p).length; i = clamp(i, 0, n - 1);
    p.scrollTo({ left: i * p.clientWidth, behavior: reduced() ? "auto" : "smooth" });
    const s = activeScreen(), nb = s && s.querySelector(".nav") ? s.querySelector(".nav").getBoundingClientRect().bottom : 0;
    const anchor = p._iui.prog.getBoundingClientRect().top, pTop = p.getBoundingClientRect().top;
    if (pTop < nb + p._iui.prog.offsetHeight - 2) scrollTo({ top: Math.max(0, scrollY + (anchor < nb ? pTop - p._iui.prog.offsetHeight : anchor) - nb), behavior: reduced() ? "auto" : "smooth" });
  };
  const pagerOf = (el) => (el.closest(".screen") || doc).querySelector(".pager");
  IUI.on("click", "[data-pg]", (e, b) => {
    const p = pagerOf(b); if (!p) return;
    const i = pagerIndex(p), n = pages(p).length, a = b.getAttribute("data-pg");
    if (a === "prev") IUI.pagerGo(p, i - 1);
    else if (a === "next") { if (i === n - 1) { emit(p, "iui:done", {}); IUI.haptic("success"); } else IUI.pagerGo(p, i + 1); }
    else if (a === "all") openOverview(p);
  });
  function openOverview(p) {
    let d = p._iui.overview;
    if (!d) {
      d = doc.createElement("dialog"); d.className = "sheet"; d.setAttribute("data-iui-gen", ""); d.setAttribute("aria-label", "All steps");
      doc.body.appendChild(d); p._iui.overview = d;
      d.addEventListener("click", (e) => { const r = e.target.closest("[data-jump]"); if (r) { closeDialog(d); IUI.pagerGo(p, +r.getAttribute("data-jump")); } });
    }
    const cur = pagerIndex(p);
    d.innerHTML = '<div class="sheet-grabber"></div><header class="sheet-nav"><span></span><h2>All steps</h2><button type="button" class="nav-btn strong" data-close>Done</button></header><div class="sheet-body"><div class="list">' +
      pages(p).map((pg, k) => { const t = pg.getAttribute("data-title") || (pg.querySelector("h2,h3") || {}).textContent || "Step " + (k + 1); return '<button type="button" class="row" data-jump="' + k + '"' + (k === cur ? ' aria-current="true"' : "") + '><span class="pin-n">' + (k + 1) + '</span><span class="row-main"><span class="row-title">' + IUI.esc(t.trim()) + "</span></span>" + (k < cur ? String(IUI.icon("check", "sm")) : "") + "</button>"; }).join("") + "</div></div>";
    IUI.sheet(d).open();
  }
  doc.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || doc.querySelector("dialog[open]") || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || "") || (e.target.closest && e.target.closest(".seg, [data-reorder]"))) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const s = activeScreen(), p = s && s.querySelector(".pager"); if (!p) return;
    IUI.pagerGo(p, pagerIndex(p) + (e.key === "ArrowRight" ? 1 : -1));
  });

  /* ================= zoom viewer for paper diagrams ================= */
  let zd = null;
  IUI.on("click", "[data-zoom]", (e, fig) => { const svg = fig.querySelector("svg"); if (svg) openZoom(svg, fig.getAttribute("aria-label") || (fig.querySelector("figcaption") || {}).textContent || "Diagram"); });
  IUI.on("keydown", "[data-zoom]", (e, fig) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fig.click(); } });
  function openZoom(src, label) {
    if (!zd) {
      zd = doc.createElement("dialog"); zd.className = "zoom paper"; zd.setAttribute("data-iui-gen", "");
      zd.innerHTML = '<div class="zoom-stage"></div><button type="button" class="btn icon zoom-close" data-close aria-label="Close">' + IUI.icon("close") + '</button><div class="zoom-hint">Pinch or double-tap to zoom</div>';
      doc.body.appendChild(zd); bindZoom(zd.querySelector(".zoom-stage"));
    }
    zd.setAttribute("aria-label", String(label).trim());
    const stage = zd.querySelector(".zoom-stage");
    stage.innerHTML = ""; const svg = src.cloneNode(true); svg.removeAttribute("style"); stage.appendChild(svg);
    zd.showModal(); lockScroll(true);
    zd.querySelector(".zoom-close").focus({ preventScroll: true });
    const vb = (svg.getAttribute("viewBox") || "0 0 300 200").split(/[ ,]+/).map(Number);
    const W = stage.clientWidth - 24, H = stage.clientHeight - 120, k = Math.min(W / vb[2], H / vb[3]);
    svg.setAttribute("width", vb[2] * k); svg.setAttribute("height", vb[3] * k);
    const z = (stage._z = { s: 1, x: (stage.clientWidth - vb[2] * k) / 2, y: (stage.clientHeight - vb[3] * k) / 2 });
    z.x0 = z.x; z.y0 = z.y;
    applyZoom(stage);
    if (!reduced()) zd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  }
  function applyZoom(stage) { const z = stage._z, svg = stage.firstElementChild; if (svg) svg.style.transform = "translate(" + z.x + "px," + z.y + "px) scale(" + z.s + ")"; }
  function zoomAt(stage, s, cx, cy) { const z = stage._z; s = clamp(s, 1, 5); z.x = cx - ((cx - z.x) * s) / z.s; z.y = cy - ((cy - z.y) * s) / z.s; z.s = s; if (s === 1) { z.x = z.x0; z.y = z.y0; } applyZoom(stage); }
  function bindZoom(stage) {
    const pts = new Map(); let pinch = null, lastTap = 0, pan = null;
    stage.addEventListener("pointerdown", (e) => {
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { const [a, b] = Array.from(pts.values()); pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: stage._z.s }; pan = null; }
      else pan = { x: e.clientX, y: e.clientY, zx: stage._z.x, zy: stage._z.y };
    });
    stage.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) { const [a, b] = Array.from(pts.values()); zoomAt(stage, (pinch.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); }
      else if (pan && stage._z.s > 1) { stage._z.x = pan.zx + e.clientX - pan.x; stage._z.y = pan.zy + e.clientY - pan.y; applyZoom(stage); }
    });
    const up = (e) => {
      if (e.type === "pointerup" && pan && pts.size === 1 && Math.hypot(e.clientX - pan.x, e.clientY - pan.y) < 10) {
        const now = performance.now();
        if (now - lastTap < 320) { zoomAt(stage, stage._z.s > 1.2 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; } else lastTap = now;
      }
      pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) pan = null;
    };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  }
  IUI.zoom = openZoom;

  /* ================= charts (tap or drag to inspect) ================= */
  function niceStep(range, count) { const raw = range / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; }
  let chartSeq = 0;
  IUI.chart = function (el, spec) {
    el = typeof el === "string" ? doc.querySelector(el) : el;
    if (!el) return;
    el.__spec = spec; el.classList.add("chart"); el.setAttribute("data-iui-own", "");
    if (!el.__ro && "ResizeObserver" in window) { let w0 = el.clientWidth; el.__ro = new ResizeObserver(() => { const w = el.clientWidth; if (w && Math.abs(w - w0) > 4) { w0 = w; drawChart(el); } }); el.__ro.observe(el); }
    drawChart(el);
  };
  function drawChart(el) {
    const spec = el.__spec; if (!spec) return;
    const W = el.clientWidth || 320, H = spec.height || 190, P = { t: 14, r: 42, b: 26, l: 6 };
    const series = spec.series || [], labels = spec.labels || [], n = labels.length, unit = spec.unit || "";
    const fmtv = spec.format || ((v) => IUI.fmt.num(v, spec.decimals == null ? 1 : spec.decimals));
    const readout = spec.readout ? (typeof spec.readout === "string" ? doc.querySelector(spec.readout) : spec.readout) : null;
    if (!n || !series.length || series.every((s) => s.values.every((v) => v == null))) { el.innerHTML = '<div class="empty" style="padding:24px"><p>No data yet</p></div>'; if (readout) readout.innerHTML = ""; return; }
    const all = [].concat(...series.map((s) => s.values)).filter((v) => v != null);
    if (spec.target != null) all.push(spec.target);
    let lo = spec.min != null ? spec.min : spec.type === "bar" ? 0 : Math.min(...all), hi = spec.max != null ? spec.max : Math.max(...all);
    if (hi === lo) { hi += 1; if (spec.type !== "bar") lo -= 1; }
    const step = niceStep(hi - lo, 3);
    if (spec.min == null && spec.type !== "bar") lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step - 1e-9) * step;
    if (hi <= lo) hi = lo + step;
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    const X = (i) => (spec.type === "bar" ? P.l + (iw / n) * (i + 0.5) : P.l + (n === 1 ? iw / 2 : (iw * i) / (n - 1)));
    const Y = (v) => P.t + ih - ((v - lo) / (hi - lo)) * ih;
    const id = "iuig" + ++chartSeq;
    const col = (s, k) => s.color || "var(--c" + ((k % 5) + 1) + ")";
    const dec = step < 1 ? Math.min(2, Math.ceil(-Math.log10(step))) : 0;
    let g = "";
    for (let v = lo; v <= hi + step / 1e6; v += step) g += '<line class="gridline" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="axis-text" x="' + (W - P.r + 6) + '" y="' + (Y(v) + 4) + '">' + IUI.esc(IUI.fmt.num(v, dec)) + "</text>";
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 56))));
    labels.forEach((lab, i) => { if (i % every === 0) g += '<text class="axis-text" x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + IUI.esc(lab) + "</text>"; });
    if (spec.target != null) g += '<line class="target" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(spec.target) + '" y2="' + Y(spec.target) + '"/>';
    series.forEach((s, k) => {
      const c = col(s, k);
      if (spec.type === "bar") {
        const bw = Math.max(3, Math.min(28, ((iw / n) * 0.62) / series.length));
        s.values.forEach((v, i) => { if (v == null) return; const x = X(i) - (bw * series.length) / 2 + bw * k, y = Y(v); g += '<rect data-i="' + i + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + Math.max(0, P.t + ih - y).toFixed(1) + '" rx="' + Math.min(4, bw / 2) + '" style="fill:' + c + '"/>'; });
      } else {
        const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)]));
        let d = "", pen = false, first = null, last = null;
        pts.forEach((p) => { if (!p) { pen = false; return; } d += (pen ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); pen = true; first = first || p; last = p; });
        if (spec.area !== false && series.length === 1 && first) g += '<defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:' + c + ';stop-opacity:.24"/><stop offset="1" style="stop-color:' + c + ';stop-opacity:0"/></linearGradient></defs><path d="' + d + "L" + last[0].toFixed(1) + " " + (P.t + ih) + "L" + first[0].toFixed(1) + " " + (P.t + ih) + 'Z" style="fill:url(#' + id + ')"/>';
        g += '<path d="' + d + '" style="fill:none;stroke:' + c + ';stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round"/>';
        if (last) g += '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4.5" style="fill:' + c + ';stroke:var(--surface);stroke-width:2"/>';
      }
    });
    g += '<g class="scrub-layer"></g><rect class="hit" x="0" y="0" width="' + W + '" height="' + H + '" style="fill:transparent"/>';
    const tl = spec.title || series.map((s) => s.name).join(", ");
    el.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" height="' + H + '" role="img" aria-label="' + IUI.esc(tl) + '">' + g + "</svg>";
    const svg = el.firstChild, layer = svg.querySelector(".scrub-layer");
    const show = (i, active) => {
      const s0 = series[0], v = s0.values[i];
      layer.innerHTML = active && v != null ? '<line class="scrub" x1="' + X(i) + '" x2="' + X(i) + '" y1="' + P.t + '" y2="' + (P.t + ih) + '"/>' + (spec.type === "bar" ? "" : '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="6" style="fill:' + col(s0, 0) + ';stroke:var(--surface);stroke-width:2.5"/>') : "";
      $$(svg, "rect[data-i]").forEach((r) => (r.style.opacity = active && +r.getAttribute("data-i") !== i ? 0.35 : 1));
      if (readout) {
        const sum = !active && spec.summary;
        const k = sum ? spec.summary.label : active ? (spec.fullLabels || labels)[i] : "Latest · " + (spec.fullLabels || labels)[i];
        const val = sum ? spec.summary.value : v == null ? "—" : fmtv(v);
        readout.innerHTML = '<span class="k">' + IUI.esc(k) + '</span><span class="v">' + IUI.esc(val) + '</span><span class="u">' + IUI.esc(unit.trim()) + "</span>" + (spec.readoutNote ? '<span class="d">' + IUI.esc(spec.readoutNote) + "</span>" : "");
      }
      if (spec.onSelect && active) spec.onSelect(i);
    };
    const lastIdx = (() => { const v = series[0].values; for (let i = v.length - 1; i >= 0; i--) if (v[i] != null) return i; return 0; })();
    show(lastIdx, false);
    const idxAt = (cx) => { const r = svg.getBoundingClientRect(), x = ((cx - r.left) / r.width) * W; let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(X(i) - x); if (d < bd) { bd = d; best = i; } } return best; };
    let timer = 0, cur = -1;
    const hit = svg.querySelector(".hit");
    hit.addEventListener("pointerdown", (e) => { clearTimeout(timer); cur = idxAt(e.clientX); show(cur, true); IUI.haptic(); });
    hit.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) { const i = idxAt(e.clientX); if (i !== cur) { cur = i; show(i, true); if (e.pointerType !== "mouse") IUI.haptic(); } } });
    const rel = () => { clearTimeout(timer); timer = setTimeout(() => { cur = -1; show(lastIdx, false); }, 1800); };
    hit.addEventListener("pointerup", rel); hit.addEventListener("pointerleave", rel); hit.addEventListener("pointercancel", rel);
  }
  IUI.spark = function (values, o) {
    o = o || {}; const w = o.w || 84, h = o.h || 30, vs = values.filter((v) => v != null);
    if (vs.length < 2) return IUI.raw("");
    const lo = Math.min(...vs), hi = Math.max(...vs), r = hi - lo || 1;
    if (o.bars) {
      const base = Math.min(0, lo), span = hi - base || 1, bw = (w / values.length) * 0.62;
      return IUI.raw('<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true">' + values.map((v, i) => { const bh = v == null ? 0 : Math.max(2, ((v - base) / span) * (h - 2)); return '<rect x="' + ((i * w) / values.length + bw * 0.3).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" fill="currentColor" opacity="' + (i === values.length - 1 ? 1 : 0.45) + '"/>'; }).join("") + "</svg>");
    }
    const pts = values.map((v, i) => (v == null ? null : [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - lo) / r) * (h - 8)])).filter(Boolean);
    const l = pts[pts.length - 1];
    return IUI.raw('<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true"><polyline points="' + pts.map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ") + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + l[0].toFixed(1) + '" cy="' + l[1].toFixed(1) + '" r="3" fill="currentColor"/></svg>');
  };
  IUI.ring = function (frac, o) {
    o = o || {}; const s = o.size || 56, w = o.stroke || 7, r = (s - w) / 2, c = 2 * Math.PI * r, f = clamp(frac || 0, 0, 1);
    return IUI.raw('<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + " " + s + '" role="img" aria-label="' + Math.round(f * 100) + '%"><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" style="stroke:var(--fill)" stroke-width="' + w + '"/><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" style="stroke:' + (o.color || "var(--tint)") + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - f)).toFixed(2) + '" transform="rotate(-90 ' + s / 2 + " " + s / 2 + ')"/>' + (o.label != null ? '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" style="fill:var(--text);font:700 ' + Math.round(s / 4) + 'px var(--font-num)">' + IUI.esc(o.label) + "</text>" : "") + "</svg>");
  };
  IUI.stackbar = function (parts) {
    return IUI.raw('<div class="stackbar" role="img" aria-label="' + IUI.esc(parts.map((p) => p.label + " " + p.value).join(", ")) + '">' + parts.map((p, k) => '<i style="flex-grow:' + Math.max(0, +p.value) + ";background:" + (p.color || "var(--c" + ((k % 5) + 1) + ")") + '"></i>').join("") + "</div>");
  };

  /* ================= geo + paper map ================= */
  IUI.geo = {
    km(a, b) { const R = 6371, t = Math.PI / 180, dLa = (b.lat - a.lat) * t, dLo = (b.lng - a.lng) * t; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); },
    walkMin(km, detour) { return (km * (detour || 1.3) * 60) / 4.8; },
  };
  IUI.map = function (el, o) {
    el = typeof el === "string" ? doc.querySelector(el) : el;
    if (!el) return;
    el.__map = o; el.setAttribute("data-iui-own", "");
    if (!el.__ro && "ResizeObserver" in window) { let w0 = el.clientWidth; el.__ro = new ResizeObserver(() => { const w = el.clientWidth; if (w && Math.abs(w - w0) > 4) { w0 = w; drawMap(el); } }); el.__ro.observe(el); }
    drawMap(el);
  };
  function drawMap(el) {
    const o = el.__map; if (!o) return;
    const places = (o.places || []).filter((p) => p.lat != null && p.lng != null);
    const cs = getComputedStyle(el), W = Math.max(200, Math.round(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))), H = o.height || Math.round(W * 0.66);
    const ref = places.length ? places : o.center ? [o.center] : [{ lat: 0, lng: 0 }];
    const lat0 = ref.reduce((a, p) => a + p.lat, 0) / ref.length, kx = Math.cos((lat0 * Math.PI) / 180);
    const pr = (p) => [p.lng * kx, -p.lat];
    const xy = ref.concat(o.extent || []).map(pr);
    let x0 = Math.min(...xy.map((p) => p[0])), x1 = Math.max(...xy.map((p) => p[0])), y0 = Math.min(...xy.map((p) => p[1])), y1 = Math.max(...xy.map((p) => p[1]));
    const minSpan = (o.minKm || 0.8) / 111;
    if (x1 - x0 < minSpan) { const c = (x0 + x1) / 2; x0 = c - minSpan / 2; x1 = c + minSpan / 2; }
    if (y1 - y0 < (minSpan * H) / W) { const c = (y0 + y1) / 2; y0 = c - (minSpan * H) / W / 2; y1 = c + (minSpan * H) / W / 2; }
    const pad = { l: 30, r: 30, t: 44, b: 36 };
    const k = Math.min((W - pad.l - pad.r) / (x1 - x0), (H - pad.t - pad.b) / (y1 - y0));
    const ox = pad.l + (W - pad.l - pad.r - (x1 - x0) * k) / 2, oy = pad.t + (H - pad.t - pad.b - (y1 - y0) * k) / 2;
    const P = (p) => { const q = pr(p); return [ox + (q[0] - x0) * k, oy + (q[1] - y0) * k]; };
    const path = (pts, close) => pts.map((p, i) => { const q = P({ lat: p[0], lng: p[1] }); return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + (close ? "Z" : "");
    let s = '<defs><clipPath id="iuimc' + (el.id || "") + '"><rect width="' + W + '" height="' + H + '" rx="8"/></clipPath></defs><g clip-path="url(#iuimc' + (el.id || "") + ')">';
    const kmPerPx = 111 / k, gpx = niceStep(kmPerPx * W, 5) / kmPerPx;
    for (let gx = ((ox % gpx) + gpx) % gpx; gx < W; gx += gpx) s += '<line class="grid" x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="0" y2="' + H + '"/>';
    for (let gy = ((oy % gpx) + gpx) % gpx; gy < H; gy += gpx) s += '<line class="grid" x1="0" x2="' + W + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/>';
    const L = o.layers || {};
    (L.water || []).forEach((poly) => (s += '<path class="water" d="' + path(poly, true) + '"/>'));
    (L.park || []).forEach((poly) => (s += '<path class="park" d="' + path(poly, true) + '"/>'));
    (L.roads || []).forEach((line) => (s += '<path class="road" d="' + path(line, false) + '"/>'));
    s += "</g>";
    (o.labels || []).forEach((t) => { const q = P(t), hw = t.text.length * 3.6 + 4; s += '<text class="soft" x="' + clamp(q[0], hw + 4, W - hw - 4).toFixed(1) + '" y="' + clamp(q[1], 16, H - 22).toFixed(1) + '" text-anchor="middle">' + IUI.esc(t.text) + "</text>"; });
    if (o.route !== false && places.length > 1) { const d = places.map((p, i) => { const q = P(p); return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(""); s += '<path class="route-line" d="' + d + '"/><path class="route" d="' + d + '"/>'; }
    const sel = o.selected;
    // keep pins legible: push overlapping pins apart and draw a leader line to the true spot
    const at = places.map((p) => P(p)), pos = at.map((q) => q.slice()), MIN = 27;
    for (let it = 0; it < 24; it++) {
      let moved = false;
      for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) {
        let dx = pos[b][0] - pos[a][0], dy = pos[b][1] - pos[a][1], dd = Math.hypot(dx, dy);
        if (dd >= MIN) continue;
        if (dd < 0.01) { dx = 1; dy = 0; dd = 1; }
        const push = (MIN - dd) / 2 + 0.5; dx /= dd; dy /= dd;
        pos[a][0] -= dx * push; pos[a][1] -= dy * push; pos[b][0] += dx * push; pos[b][1] += dy * push; moved = true;
      }
      pos.forEach((q) => { q[0] = clamp(q[0], 16, W - 16); q[1] = clamp(q[1], 16, H - 16); });
      if (!moved) break;
    }
    pos.forEach((q, i) => { if (Math.hypot(q[0] - at[i][0], q[1] - at[i][1]) > 3) s += '<path class="ink-2" d="M' + at[i][0].toFixed(1) + " " + at[i][1].toFixed(1) + "L" + q[0].toFixed(1) + " " + q[1].toFixed(1) + '"/><circle class="dot" cx="' + at[i][0].toFixed(1) + '" cy="' + at[i][1].toFixed(1) + '" r="2.5"/>'; });
    const order = places.map((p, i) => i).sort((a, b) => (places[a].id === sel) - (places[b].id === sel));
    order.forEach((i) => {
      const p = places[i], q = pos[i], on = p.id != null && p.id === sel, r = on ? 15 : 12;
      s += '<g class="pin' + (on ? " sel" : "") + '" data-id="' + IUI.esc(p.id == null ? i : p.id) + '" role="button" tabindex="0" aria-label="' + IUI.esc((p.label != null ? p.label : i + 1) + ". " + (p.name || "")) + '"' + (on ? ' aria-pressed="true"' : "") + ' transform="translate(' + q[0].toFixed(1) + " " + q[1].toFixed(1) + ')"><circle r="22" style="fill:transparent"/><circle class="pin-bg" r="' + r + '"/><text>' + IUI.esc(p.label != null ? p.label : i + 1) + "</text></g>";
    });
    const sp = places.find((p) => p.id != null && p.id === sel);
    if (sp && sp.name) { const q = pos[places.indexOf(sp)], tw = Math.min(W - 20, sp.name.length * 7 + 22), lx = clamp(q[0], tw / 2 + 6, W - tw / 2 - 6), ly = q[1] - 36 < 16 ? q[1] + 36 : q[1] - 36; s += '<g class="pin-label" pointer-events="none"><rect x="' + (lx - tw / 2).toFixed(1) + '" y="' + (ly - 13).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="26" rx="13"/><text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '">' + IUI.esc(sp.name) + "</text></g>"; }
    const target = 80 * kmPerPx, sstep = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
    const spx = sstep / kmPerPx;
    s += '<g class="scale" transform="translate(12 ' + (H - 12) + ')"><path d="M0 -6V0H' + spx.toFixed(1) + 'V-6"/><text x="' + (spx + 6).toFixed(1) + '" y="0">' + IUI.esc(IUI.fmt.dist(sstep)) + "</text></g>";
    s += '<g class="compass" transform="translate(' + (W - 16) + ' 16)"><path d="M0 9V-7M-4 -2L0 -7l4 5"/><text x="0" y="22" text-anchor="middle">N</text></g>';
    let svg = el.querySelector(":scope > svg");
    if (!svg) { svg = doc.createElementNS(NS, "svg"); el.insertBefore(svg, el.firstChild); bindMap(el); }
    svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.setAttribute("role", "group"); svg.setAttribute("aria-label", o.label || "Map of " + places.length + " places");
    svg.style.maxHeight = "none";
    svg.innerHTML = s;
  }
  const NS = "http://www.w3.org/2000/svg";
  function bindMap(el) {
    const pick = (g) => { const o = el.__map; if (o && o.onSelect) { const id = g.getAttribute("data-id"); const p = (o.places || []).find((x) => String(x.id) === id); o.onSelect(p ? p.id : id); IUI.haptic(); } };
    el.addEventListener("click", (e) => { const g = e.target.closest(".pin"); if (g) pick(g); });
    el.addEventListener("keydown", (e) => { const g = e.target.closest(".pin"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(g); } });
  }

  /* ================= color helpers (paint, themes) ================= */
  IUI.color = {
    rgb(hex) { hex = String(hex).replace("#", ""); if (hex.length === 3) hex = hex.split("").map((c) => c + c).join(""); const n = parseInt(hex, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; },
    hex(c) { return "#" + [c.r, c.g, c.b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join(""); },
    lum(hex) { const c = IUI.color.rgb(hex), f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); },
    contrast(a, b) { const x = IUI.color.lum(a), y = IUI.color.lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); },
    on(hex) { return IUI.color.contrast(hex, "#111114") >= IUI.color.contrast(hex, "#ffffff") ? "#111114" : "#ffffff"; },
    lrv(hex) { return Math.round(IUI.color.lum(hex) * 1000) / 10; },
    mix(a, b, t) { const x = IUI.color.rgb(a), y = IUI.color.rgb(b); return IUI.color.hex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t }); },
    hsl(hex) { let { r, g, b } = IUI.color.rgb(hex); r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return { h, s, l }; },
    fromHsl(h, s, l) { h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return IUI.color.hex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }); },
    harmony(hex) { const { h, s, l } = IUI.color.hsl(hex), f = IUI.color.fromHsl; return { complement: f(h + 180, s, l), analogous: [f(h - 30, s, l), f(h + 30, s, l)], lighter: f(h, s, Math.min(0.95, l + 0.15)), deeper: f(h, s, Math.max(0.08, l - 0.18)), trim: f(h, s * 0.15, 0.95) }; },
  };

  /* ================= Markdown data: the .md is the app's source of truth =================
     Grammar (see reference/markdown-data.md):
       ---\nkey: value\n---        frontmatter -> doc.meta
       <!-- … -->                 kept verbatim, never rendered (AI instructions live here)
       # Title                     doc.title;  text before the first ## -> doc.intro
       ## Section                  doc.sections[] {key, name, text, items}
       ### Group                   sets item.group for the items below it
       - [ ] text / - [x] text     checklist item {text, done}
       - key: value                record item; indented "  key: value" lines add fields
       - text                      plain item {text}
     Fields starting with "_" (e.g. _id) are runtime-only and never written back. */
  const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const KEY = /^([a-z][a-z0-9_-]*):\s?(.*)$/;
  IUI.md = {
    slug,
    parse(text) {
      const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
      const d = { meta: {}, head: [], title: "", intro: "", sections: [] };
      let i = 0, sec = null, group = "", item = null, lastKey = null;
      const intro = [];
      if (lines[0] === "---") { for (i = 1; i < lines.length && lines[i] !== "---"; i++) { const m = lines[i].match(KEY); if (m) d.meta[m[1]] = m[2].trim(); } i++; }
      const close = () => { if (sec) sec.text = sec._t.join("\n").trim(); };
      for (; i < lines.length; i++) {
        const ln = lines[i];
        if (/^\s*<!--/.test(ln)) {                       // comment block, possibly multi-line
          const buf = [ln]; while (!/-->/.test(buf[buf.length - 1]) && i + 1 < lines.length) buf.push(lines[++i]);
          (sec ? sec.comments : d.head).push(buf.join("\n")); item = null; continue;
        }
        let m;
        if ((m = ln.match(/^# (.+)$/)) && !sec) { d.title = m[1].trim(); continue; }
        if ((m = ln.match(/^## (.+)$/))) { close(); sec = { key: slug(m[1]), name: m[1].trim(), text: "", items: [], comments: [], _t: [] }; d.sections.push(sec); group = ""; item = null; continue; }
        if ((m = ln.match(/^### (.+)$/)) && sec) { group = m[1].trim(); item = null; continue; }
        if ((m = ln.match(/^[-*] (.*)$/)) && sec) {
          const body = m[1];
          let c;
          lastKey = null;
          if ((c = body.match(/^\[( |x|X)\] (.*)$/))) item = { text: c[2].trim(), done: c[1] !== " " };
          else if ((c = body.match(KEY))) { item = {}; item[c[1]] = c[2].trim(); lastKey = c[1]; }
          else item = { text: body.trim() };
          if (group) item.group = group;
          item._id = IUI.uid();
          sec.items.push(item); continue;
        }
        if (item && /^\s{2,}\S/.test(ln)) {               // continuation of the current item
          const t = ln.trim(), c = t.match(KEY);
          if (c && lastKey) { item[c[1]] = c[2].trim(); lastKey = c[1]; }
          else { const k = lastKey || "text"; item[k] = ((item[k] || "") + " " + t).trim(); }
          continue;
        }
        item = null;
        if (sec) sec._t.push(ln); else intro.push(ln);
      }
      close();
      d.intro = intro.join("\n").trim();
      d.sections.forEach((s) => delete s._t);
      return d;
    },
    stringify(d) {
      const out = [], keys = Object.keys(d.meta || {});
      if (keys.length) { out.push("---"); keys.forEach((k) => out.push(k + ": " + d.meta[k])); out.push("---", ""); }
      (d.head || []).forEach((c) => out.push(c, ""));
      if (d.title) out.push("# " + d.title, "");
      if (d.intro) out.push(d.intro, "");
      const fields = (it) => Object.keys(it).filter((k) => k[0] !== "_" && k !== "group" && it[k] != null && it[k] !== "");
      const item = (it) => {
        const ks = fields(it);
        if ("done" in it && ks.every((k) => k === "text" || k === "done")) return "- [" + (it.done ? "x" : " ") + "] " + (it.text || "");
        if (ks.length === 1 && ks[0] === "text") return "- " + it.text;
        return ks.map((k, j) => (j ? "  " : "- ") + k + ": " + String(it[k]).replace(/\s*\n\s*/g, " ")).join("\n");
      };
      (d.sections || []).forEach((s) => {
        out.push("## " + s.name, "");
        (s.comments || []).forEach((c) => out.push(c, ""));
        if (s.text) out.push(s.text, "");
        const groups = [];
        s.items.forEach((it) => { const g = it.group || ""; if (!groups.includes(g)) groups.push(g); });
        groups.sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0));
        groups.forEach((g) => {
          if (g) out.push("### " + g, "");
          const its = s.items.filter((it) => (it.group || "") === g);
          const records = its.some((it) => fields(it).length > 1 && !("done" in it));
          its.forEach((it) => { out.push(item(it)); if (records) out.push(""); });
          if (!records) out.push("");
        });
      });
      return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
    },
    read(id) { const el = doc.getElementById(id || "iui-data"); return el ? el.textContent.replace(/^\n/, "").replace(/<\\\/script/gi, "</script") : ""; },
    hash(s) { let h = 0x811c9dc5; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); },
    section(d, name) { const k = slug(name); return (d.sections || []).find((s) => s.key === k) || null; },
    items(d, name) { const s = IUI.md.section(d, name); return s ? s.items : []; },
    // Field helpers: values are plain strings in the file; type them at render time.
    num(v, dflt) { const n = parseFloat(String(v == null ? "" : v).replace(/[^\d.\-]/g, "")); return Number.isFinite(n) ? n : dflt == null ? 0 : dflt; },
    yes(v) { return /^(y|yes|true|1|x)$/i.test(String(v || "").trim()); },
    list(v) { return String(v || "").split(",").map((x) => x.trim()).filter(Boolean); },
    latlng(v) { const m = String(v || "").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/); return m ? { lat: +m[1], lng: +m[2] } : null; },
    minutes(v) { const s = String(v || ""); const h = s.match(/(\d+(?:\.\d+)?)\s*h/i), mm = s.match(/(\d+)\s*m/i); if (h || mm) return Math.round((h ? +h[1] * 60 : 0) + (mm ? +mm[1] : 0)); return IUI.md.num(s, 0); },
    dur(min) { min = Math.round(min || 0); const h = Math.floor(min / 60), m = min % 60; return h && m ? h + " h " + m + " min" : h ? h + " h" : m + " min"; },
  };
  // State whose content IS the parsed markdown: {doc, ui}. Keyed by a hash of the embedded file, so a new
  // file (edited by an AI and republished) replaces stale browser state instead of being shadowed by it.
  IUI.mdState = function (key, o) {
    o = o || {};
    const src = o.text != null ? o.text : IUI.md.read(o.id);
    const S = IUI.state(key ? key + ":" + IUI.md.hash(src) : null, () => ({ doc: IUI.md.parse(src), ui: Object.assign({}, o.ui) }));
    const withSec = (d, name, fn) => {
      const secs = d.sections.slice(), k = slug(name);
      let i = secs.findIndex((s) => s.key === k);
      if (i < 0) { secs.push({ key: k, name, text: "", items: [], comments: [] }); i = secs.length - 1; }
      secs[i] = Object.assign({}, secs[i], { items: fn(secs[i].items.slice()) });
      return Object.assign({}, d, { sections: secs });
    };
    S.doc = () => S.get().doc;
    S.items = (name) => IUI.md.items(S.get().doc, name);
    S.update = (name, fn) => S.set((s) => Object.assign({}, s, { doc: withSec(s.doc, name, fn) }));
    S.add = (name, item) => { item = Object.assign({ _id: IUI.uid() }, item); S.update(name, (a) => a.concat([item])); return item; };
    S.patch = (name, id, p) => S.update(name, (a) => a.map((x) => (x._id === id ? Object.assign({}, x, p) : x)));
    // remove returns an undo function that puts the item back where it was
    S.remove = (name, id) => { const a = S.items(name), at = a.findIndex((x) => x._id === id), gone = a[at]; S.update(name, (b) => b.filter((x) => x._id !== id)); return () => gone && S.update(name, (b) => { b.splice(Math.min(at, b.length), 0, gone); return b; }); };
    S.setMeta = (p) => S.set((s) => Object.assign({}, s, { doc: Object.assign({}, s.doc, { meta: Object.assign({}, s.doc.meta, p) }) }));
    S.ui = (p) => (p ? S.set((s) => Object.assign({}, s, { ui: Object.assign({}, s.ui, p) })) : S.get().ui);
    S.md = () => IUI.md.stringify(S.get().doc);
    S.load = (text) => { const d = IUI.md.parse(text); if (!d.sections.length) return false; S.set((s) => Object.assign({}, s, { doc: d })); return true; };
    S.source = () => src;
    return S;
  };
  // The whole page, regenerated with new Markdown, in the shape the artifact service serves it.
  // build.py stores the page as a template in #iui-src (Markdown and the template itself as placeholders),
  // so the page can republish itself without serializing the live DOM. null when there is no template.
  IUI.md.SKELETON = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>';
  IUI.md.page = function (md) {
    const el = doc.getElementById("iui-src");
    if (!el) return null;
    let tpl;
    try { tpl = JSON.parse(el.textContent); } catch (e) { return null; }
    const MK = "@@IUI_" + "MD@@", SK = "@@IUI_" + "SRC@@";     // split so this file never contains the markers
    md = String(md); if (!md.endsWith("\n")) md += "\n"; md = md.replace(/<\/(script)/gi, "<\\/$1");   // as build.py embed_md
    const content = tpl.replace(SK, () => el.textContent).replace(MK, () => md);
    return IUI.md.SKELETON + "\n" + content + "\n</body></html>";
  };
  // Publish the page with this Markdown as the new version for everyone. Resolves
  // {ok:true} (the view then reloads) or {ok:false, code, readOnly}.
  let readOnly = false;
  IUI.md.publish = async function (md) {
    const html = IUI.md.page(md);
    const host = window.claude && typeof window.claude.use === "function";
    if (!html || !host || readOnly) return { ok: false, code: readOnly ? "not_writer" : "unavailable", readOnly: true };
    const art = await window.claude.use("artifact").catch(() => null);
    if (!art) { readOnly = true; return { ok: false, code: "unavailable", readOnly: true }; }
    const go = () => art.publish(html);
    try { await go(); return { ok: true }; }
    catch (e) {
      const code = (e && e.code) || "upstream_error";
      if (code === "upstream_error") {
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 900));
        try { await go(); return { ok: true }; } catch (e2) { return { ok: false, code: (e2 && e2.code) || "upstream_error" }; }
      }
      if (/^(not_writer|not_granted|consent_required|not_declared|capability_disabled|capability_removed)$/.test(code)) readOnly = true;
      return { ok: false, code, readOnly };
    }
  };
  // Ready-made "Plan file" sheet: live Markdown with Copy, Save .md, Apply (saves for everyone when the
  // page may republish itself, else in this browser) and Reset. Open it with data-sheet="iui-md".
  // opts: {title, filename, hint}
  IUI.md.sheet = function (S, o) {
    o = o || {};
    const canon = (t) => IUI.md.stringify(IUI.md.parse(t)).trim();
    const published = canon(S.source());
    // dot on every Plan file button while this browser holds changes the published page lacks
    const mark = () => {
      const dirty = S.md().trim() !== published;
      $$(doc, '[data-sheet="iui-md"]').forEach((b) => {
        b.toggleAttribute("data-dirty", dirty);
        b.setAttribute("aria-label", "Plan file (Markdown)" + (dirty ? ", changes not saved for everyone" : ""));
      });
      return dirty;
    };
    S.subscribe(mark);
    setTimeout(mark, 0);
    const d = doc.createElement("dialog");
    d.className = "sheet"; d.id = "iui-md"; d.setAttribute("aria-labelledby", "iui-md-title");
    d.innerHTML = '<div class="sheet-grabber"></div><header class="sheet-nav"><button class="nav-btn" data-close>Done</button><h2 id="iui-md-title">' + IUI.esc(o.title || "Plan file") +
      '</h2><button class="nav-btn strong" data-md-apply>Apply</button></header><div class="sheet-body">' +
      '<div class="note" data-tone="indigo">' + IUI.icon("sparkle") + "<div><strong>This Markdown is the app</strong>" +
      IUI.esc(o.hint || "Every screen is drawn from it. Copy it to Claude and ask for a change, then paste the reply here and tap Apply.") +
      ' <span class="md-status"></span></div></div>' +
      '<textarea class="md-src" id="iui-md-text" spellcheck="false" aria-label="Markdown source"></textarea>' +
      '<div class="md-actions"><button class="btn tinted" data-md-copy>' + IUI.icon("share", "sm") + '<span>Copy</span></button><button class="btn gray" data-md-save>' + IUI.icon("arrow-down", "sm") + "<span>Save .md</span></button></div>" +
      '<button class="btn plain" data-md-reset>Reset to the published file</button></div>';
    (doc.querySelector(".app") || doc.body).appendChild(d);
    const ta = d.querySelector("textarea");
    const shared = () => !!(doc.getElementById("iui-src") && window.claude && typeof window.claude.use === "function" && !readOnly);
    const status = d.querySelector(".md-status"), applyBtn = d.querySelector("[data-md-apply]");
    d.addEventListener("iui:sheet", (e) => {
      if (!e.detail.open) return;
      ta.value = S.md();
      status.textContent = !shared() ? "Apply changes this browser only." : mark() ? "Changes made here are not saved for everyone yet: tap Apply to save them." : "Apply saves it for everyone who opens this link.";
    });
    applyBtn.addEventListener("click", async () => {
      const text = ta.value;
      if (!IUI.md.parse(text).sections.length) return IUI.toast("No ## sections found, nothing applied");
      const changedHere = text.trim() !== S.md().trim(), unpublished = canon(text) !== published;
      if (!changedHere && !unpublished) return IUI.closeSheet(d);
      if (changedHere) S.load(text);
      if (!shared() || !unpublished) { IUI.closeSheet(d); return IUI.toast(shared() ? "Applied" : "Applied in this browser", { icon: "check-circle" }); }
      applyBtn.disabled = true; applyBtn.textContent = "Saving…";
      const r = await IUI.md.publish(text);
      applyBtn.disabled = false; applyBtn.textContent = "Apply";
      IUI.closeSheet(d);
      if (r.ok) return IUI.toast("Saved for everyone. Reloading", { icon: "check-circle" });
      if (r.code === "conflict") return IUI.toast("Someone saved a newer version. Reloading to it");
      if (r.readOnly) return IUI.toast("Applied in this browser. You can view this page but not edit it");
      if (r.code === "rate_limited") return IUI.toast("Applied here. Saving for everyone is paused, try again in a minute");
      IUI.toast("Applied here, but not saved for everyone (" + r.code + ")");
    });
    d.querySelector("[data-md-copy]").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(ta.value); IUI.toast("Copied. Paste it to Claude with your change", { icon: "check-circle" }); }
      catch (e) { ta.focus(); ta.select(); let ok = false; try { ok = doc.execCommand("copy"); } catch (x) {} IUI.toast(ok ? "Copied" : "Selected. Use your device's Copy"); }
    });
    // Save: inside a claude.ai artifact use the `downloads` capability (publish with capabilities
    // {downloads: true}); opened as a plain local file, fall back to a blob link.
    d.querySelector("[data-md-save]").addEventListener("click", async () => {
      const name = o.filename || "plan.md";
      const host = window.claude && typeof window.claude.use === "function";
      if (host) {
        const dl = await window.claude.use("downloads").catch(() => null);
        if (!dl) return IUI.toast("Saving isn't available here. Use Copy instead");
        try { await dl.save({ filename: name, data: ta.value }); IUI.toast("Saved " + name, { icon: "check-circle" }); }
        catch (e) { if (e && e.code === "rate_limited") IUI.toast("A save is already open"); else if (!e || e.code !== "declined") IUI.toast("Saving isn't available here. Use Copy instead"); }
        return;
      }
      try { const a = doc.createElement("a"); a.href = URL.createObjectURL(new Blob([ta.value], { type: "text/markdown" })); a.download = name; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); IUI.toast("Saved " + name); }
      catch (e) { IUI.toast("Saving is blocked here. Use Copy instead"); }
    });
    d.querySelector("[data-md-reset]").addEventListener("click", async () => {
      if (await IUI.confirm({ title: "Reset to the published file?", message: "Edits made in this browser are dropped.", confirm: "Reset", destructive: true })) { S.reset(); IUI.closeSheet(d); }
    });
    return d;
  };

  /* ================= mount & boot ================= */
  IUI.mount = function (r) {
    r = r || doc;
    $$(r, ".seg").forEach(updateSeg);
    $$(r, "[data-chips]").forEach(updateChips);
    $$(r, ".stepper").forEach(updateStepper);
    $$(r, ".pager").forEach(mountPager);
    $$(r, "[data-chart]").forEach((el) => { const a = el.getAttribute("data-chart"); if (el.__chartSrc !== a) { el.__chartSrc = a; try { IUI.chart(el, JSON.parse(a)); } catch (e) { el.textContent = "Chart data error"; } } });
    $$(r, "i[data-icon]").forEach((i) => { const t = doc.createElement("template"); t.innerHTML = String(IUI.icon(i.getAttribute("data-icon"), i.className)); i.replaceWith(t.content.firstChild); });
    $$(r, "[data-reorder] .handle").forEach((h) => { if (!h.hasAttribute("aria-label")) { const t = (h.closest(".row").querySelector(".row-title") || {}).textContent || "item"; h.setAttribute("aria-label", "Reorder " + t.trim() + ". Use the up and down arrow keys"); } if (h.tagName !== "BUTTON" && !h.hasAttribute("tabindex")) h.tabIndex = 0; });
    $$(r, ".row[data-swipe]").forEach((row) => { if (!row.hasAttribute("data-swipe-label")) row.setAttribute("data-swipe-label", row.getAttribute("data-swipe") || "Delete"); });
    $$(r, "[data-zoom]").forEach((f) => { if (!f.hasAttribute("tabindex")) { f.tabIndex = 0; f.setAttribute("role", "button"); if (!f.hasAttribute("aria-label")) f.setAttribute("aria-label", "Enlarge diagram"); } });
    measureBars();
  };
  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    injectSprite();
    if ($$(doc, ".screen").length) restoreNav();
    IUI.mount(doc);
    updateScrolled();
    if ("ResizeObserver" in window) { const ro = new ResizeObserver(() => measureBars()); $$(doc, ".tabbar, .bottom-bar").forEach((b) => ro.observe(b)); }
  }
  injectSprite();
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot); else boot();
})();
