#!/usr/bin/env node
// Mobile-app audit for Intelligent UI pages. Runs the page in real Chromium with phone
// emulation (touch, DPR, hover:none) in light and dark, measures what makes a page feel
// like an app or like a website, takes screenshots, and optionally runs a scripted
// touch flow with assertions.
//
//   node audit.mjs page.html [--out DIR] [--flow flow.mjs] [--devices iphone,se,pixel,desktop] [--themes light,dark]
//
// page.html may be the artifact fragment from build.py (it is wrapped in the same skeleton
// the Artifact viewer adds) or a full document. Exit code 1 when an error-level finding
// or a failed flow assertion exists.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// ---------- args ----------
const argv = process.argv.slice(2);
const opt = { out: null, flow: null, devices: "iphone,se,pixel,desktop", themes: "light,dark" };
const files = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") opt.out = argv[++i];
  else if (a === "--flow") opt.flow = argv[++i];
  else if (a === "--devices") opt.devices = argv[++i];
  else if (a === "--themes") opt.themes = argv[++i];
  else files.push(a);
}
if (!files.length) { console.error("usage: audit.mjs page.html [--out DIR] [--flow flow.mjs] [--devices ...] [--themes ...]"); process.exit(2); }

// ---------- playwright ----------
async function loadPlaywright() {
  try { return await import("playwright"); } catch {}
  const cands = [];
  if (process.env.PLAYWRIGHT_DIR) cands.push(process.env.PLAYWRIGHT_DIR);
  const npx = path.join(os.homedir(), ".npm/_npx");
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) cands.push(path.join(npx, d, "node_modules"));
  for (const c of cands) {
    if (fs.existsSync(path.join(c, "playwright", "package.json"))) {
      try { return createRequire(path.join(c, "_.js"))("playwright"); } catch {}
    }
  }
  console.error("Playwright not found. Install once with:\n  npm i -g playwright && npx playwright install chromium\n(or set PLAYWRIGHT_DIR to a node_modules folder containing playwright)");
  process.exit(2);
}
const { chromium, devices } = await loadPlaywright();

const DEVICES = {
  iphone: { label: "iPhone 13 (390×844)", ...devices["iPhone 13"], mobile: true },
  se: { label: "iPhone SE (375×667)", ...devices["iPhone SE"], mobile: true },
  pixel: { label: "Pixel 7 (412×915)", ...devices["Pixel 7"], mobile: true },
  desktop: { label: "Desktop (1280×800)", viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, mobile: false },
};

// The Artifact viewer's skeleton (see the Artifact tool's page contract).
const SKELETON_HEAD = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,-apple-system,sans-serif;background:#fafaf8}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>`;

function prepare(file) {
  const src = fs.readFileSync(file, "utf8");
  if (/^\s*<!doctype/i.test(src)) return pathToFileURL(path.resolve(file)).href;
  const tmp = path.join(os.tmpdir(), "iui-audit-" + path.basename(file, ".html") + "-" + process.pid + ".html");
  fs.writeFileSync(tmp, SKELETON_HEAD + src + "\n</body></html>");
  return pathToFileURL(tmp).href;
}

// ---------- in-page checks (serialized into the browser) ----------
function inPageAudit(cfg) {
  const out = { errors: [], warnings: [], metrics: {} };
  const desc = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    const cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) s += "." + cls.join(".");
    const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
    return t ? s + ' "' + t + '"' : s;
  };
  const cumOpacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
  const visible = (el) => {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[hidden],[inert],dialog:not([open])");
  };
  const inViewportX = (r) => r.right > 0 && r.left < innerWidth;

  // 1. horizontal overflow
  out.metrics.hOverflow = document.documentElement.scrollWidth - innerWidth;
  if (out.metrics.hOverflow > 1) out.errors.push("page scrolls sideways by " + out.metrics.hOverflow + "px");

  // 2. body background explicit
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  if (/rgba\(0, 0, 0, 0\)|transparent/.test(bodyBg)) out.errors.push("body has no explicit background");

  // 3. touch targets
  const sel = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [role=option], [role=slider], [role=link]';
  const small = [];
  let targets = 0;
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el) || el.closest("[data-audit-ignore]")) continue;
    if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue;
    targets++;
    let r = el.getBoundingClientRect();
    const lab = el.closest("label") || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]'));
    if (lab && /^(checkbox|radio|color|range)$/.test(el.type)) r = lab.getBoundingClientRect();
    // a hit-area extender (::after, absolutely positioned, negative inset) counts
    const af = getComputedStyle(el, "::after");
    let ex = 0, ey = 0;
    if (af.content !== "none" && af.position === "absolute") { ex = Math.max(0, -parseFloat(af.left) || 0); ey = Math.max(0, -parseFloat(af.top) || 0); }
    const w = r.width + 2 * ex, h = r.height + 2 * ey;
    if (el.type === "range") { if (h < 28) small.push(desc(el) + " " + Math.round(w) + "×" + Math.round(h)); continue; }
    if (w < 43.5 || h < 43.5) small.push(desc(el) + " " + Math.round(w) + "×" + Math.round(h));
  }
  out.metrics.touchTargets = targets;
  out.metrics.smallTargets = small.length;
  if (small.length) (cfg.mobile ? out.errors : out.warnings).push(small.length + " tap targets under 44×44: " + small.slice(0, 8).join("; ") + (small.length > 8 ? " …" : ""));

  // 4. iOS zooms the page when a focused input has font-size < 16px
  if (cfg.mobile) {
    const zoomers = [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=hidden]), select, textarea")]
      .filter(visible).filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16);
    out.metrics.zoomInputs = zoomers.length;
    if (zoomers.length) out.errors.push(zoomers.length + " inputs under 16px font (iOS zooms on focus): " + zoomers.slice(0, 5).map(desc).join("; "));
  }

  // 5. text size + contrast
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bgOf = (el) => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== "none" && !/radial-gradient\(.*1px/.test(cs.backgroundImage)) return null; // gradient/image: unknown
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const root = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (root && root.a > 0) bg = root;
    for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
    return bg;
  };
  const tiny = [], low = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  let textNodes = 0;
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!el || seen.has(el) || el.closest("script,style,template,[aria-hidden=true],[data-audit-ignore]")) continue;
    seen.add(el);
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (!inViewportX(r)) continue;
    textNodes++;
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    const isSvg = el instanceof SVGElement;
    if (fs < 11 && !isSvg) tiny.push(desc(el) + " " + fs + "px");
    if (isSvg && fs * (el.ownerSVGElement ? el.ownerSVGElement.getBoundingClientRect().width / (el.ownerSVGElement.viewBox.baseVal.width || 1) : 1) < 9.5) tiny.push(desc(el) + " (svg, renders <9.5px)");
    if (el.closest("button:disabled, [aria-disabled=true], input::placeholder")) continue;
    if (cumOpacity(el) < 0.98) continue; // faded on purpose (disabled / done states)
    let fg = parse(isSvg ? cs.fill : cs.color);
    if (!fg || (isSvg && cs.fill === "none")) continue;
    let bg = bgOf(isSvg ? el.ownerSVGElement || el : el);
    if (!bg) continue;
    if (isSvg) {
      // text drawn on top of an SVG shape (pins, bars): measure against that shape's fill
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      // by geometry, not elementsFromPoint: that returns nothing for text below the fold
      const unders = el.ownerSVGElement ? [...el.ownerSVGElement.querySelectorAll("circle,rect,ellipse,path,polygon")].filter((u) => {
        if (!(u.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) return false; // drawn before the text = underneath
        const b = u.getBoundingClientRect();
        return b.width > 0 && cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
      }) : [];
      for (const under of unders) {
        const ucs = getComputedStyle(under), uf = parse(ucs.fill);
        if (uf && ucs.fill !== "none") { uf.a *= parseFloat(ucs.fillOpacity || "1") * cumOpacity(under); if (uf.a > 0.05) bg = over(uf, bg); }
      }
    }
    fg = over(fg, bg);
    const big = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 600);
    const need = big ? 3 : 4.5, got = ratio(fg, bg);
    if (got < need - 0.05) low.push(desc(el) + " " + got.toFixed(2) + ":1" + (isSvg ? " (svg, approx)" : ""));
  }
  out.metrics.textNodes = textNodes;
  out.metrics.lowContrast = low.length;
  if (tiny.length) out.warnings.push(tiny.length + " text runs under 11px: " + tiny.slice(0, 6).join("; "));
  if (low.length) out.errors.push(low.length + " text runs below WCAG contrast: " + low.slice(0, 8).join("; ") + (low.length > 8 ? " …" : ""));

  // 6. accessible names
  const unnamed = [...document.querySelectorAll("button, a[href], [role=button], [role=tab], [role=switch]")].filter(visible)
    .filter((el) => !(el.textContent.trim() || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title));
  if (unnamed.length) out.errors.push(unnamed.length + " controls without an accessible name: " + unnamed.slice(0, 5).map(desc).join("; "));
  const unlabeled = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].filter(visible)
    .filter((el) => !(el.closest("label") || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")));
  if (unlabeled.length) out.errors.push(unlabeled.length + " inputs without a label: " + unlabeled.slice(0, 5).map(desc).join("; "));
  const noAlt = [...document.images].filter((i) => !i.hasAttribute("alt"));
  if (noAlt.length) out.errors.push(noAlt.length + " images without alt");

  // 7. emoji used as UI icons (renders differently per platform; looks like a web page)
  const emo = [...document.querySelectorAll("button, [role=tab], nav a, .chip, .tab, .btn")].filter(visible)
    .filter((el) => /\p{Extended_Pictographic}/u.test(el.textContent));
  out.metrics.emojiControls = emo.length;
  if (emo.length) out.warnings.push(emo.length + " controls use emoji as icons: " + emo.slice(0, 5).map(desc).join("; "));

  // 8. content invisible at rest (opacity ~0 but not hidden)
  const ghosts = [...document.querySelectorAll("body *")].filter((el) => el.children.length === 0 && el.textContent.trim() && visible(el) && !el.closest("[aria-hidden=true],.toast,[role=status]") && cumOpacity(el) < 0.1);
  if (ghosts.length) out.errors.push(ghosts.length + " text elements invisible at rest: " + ghosts.slice(0, 4).map(desc).join("; "));

  // 9. app chrome inventory
  const fixed = [...document.querySelectorAll("body *")].filter((el) => { const p = getComputedStyle(el).position; return (p === "fixed" || p === "sticky") && visible(el); });
  const bottomBars = fixed.filter((el) => { const r = el.getBoundingClientRect(); return r.bottom >= innerHeight - 2 && r.top > innerHeight * 0.55 && r.width > innerWidth * 0.5; });
  const topBars = fixed.filter((el) => { const r = el.getBoundingClientRect(); return r.top <= 2 && r.bottom < innerHeight * 0.3 && r.width > innerWidth * 0.5; });
  out.metrics.topBar = topBars.length > 0;
  out.metrics.bottomBar = bottomBars.length > 0;
  if (cfg.mobile && !topBars.length) out.warnings.push("no sticky top bar: reads as a web page, not an app");
  if (cfg.mobile && !bottomBars.length) out.warnings.push("no bottom bar in the thumb zone (tab bar or primary action)");
  if (bottomBars.length) {
    const css = [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join(""); } catch { return ""; } }).join("");
    if (!/safe-area-inset-bottom/.test(css)) out.errors.push("bottom bar ignores env(safe-area-inset-bottom)");
  }
  out._bars = { top: topBars.map(desc), bottom: bottomBars.map(desc) };
  return out;
}

// After scrolling to the very bottom, nothing interactive or textual may be stuck under a bottom bar.
function obstructionCheck() {
  const bars = [...document.querySelectorAll("body *")].filter((el) => {
    const cs = getComputedStyle(el); if (cs.position !== "fixed" && cs.position !== "sticky") return false;
    const r = el.getBoundingClientRect(); return r.width > innerWidth * 0.5 && r.bottom >= innerHeight - 2 && r.top > innerHeight * 0.55 && cs.display !== "none";
  });
  if (!bars.length) return [];
  const hits = [];
  for (const bar of bars) {
    const br = bar.getBoundingClientRect();
    for (const el of document.querySelectorAll("button, a[href], input, h1, h2, h3, p, li, label")) {
      if (bar.contains(el) || el.contains(bar) || el.closest("[hidden],dialog:not([open]),.toast")) continue;
      const cs = getComputedStyle(el); if (cs.position === "fixed") continue;
      if (el.closest('[style*="position: fixed"]')) continue;
      let fixedAncestor = false; for (let e = el.parentElement; e; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === "fixed") { fixedAncestor = true; break; } }
      if (fixedAncestor) continue;
      const r = el.getBoundingClientRect();
      if (r.height && r.bottom > br.top + 4 && r.top < br.bottom && r.right > br.left && r.left < br.right) hits.push(el.tagName.toLowerCase() + ' "' + el.textContent.trim().slice(0, 30) + '"');
    }
  }
  return hits.slice(0, 6);
}

// ---------- flow helpers ----------
function makeT(page, cdp, outDir, base, results) {
  const center = async (selOrLoc) => {
    const loc = typeof selOrLoc === "string" ? page.locator(selOrLoc).first() : selOrLoc;
    await loc.scrollIntoViewIfNeeded();
    // like a finger: the point must actually hit the element, not a bar floating over it
    for (let i = 0; i < 3; i++) {
      const hit = await loc.evaluate((el) => { const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, h = document.elementFromPoint(x, y); return { ok: !!h && (el === h || el.contains(h) || h.contains(el)), y, vh: innerHeight }; });
      if (hit.ok) break;
      await page.evaluate((dy) => window.scrollBy(0, dy), hit.y > hit.vh / 2 ? 120 : -120);
      await page.waitForTimeout(120);
    }
    const b = await loc.boundingBox();
    if (!b) throw new Error("not visible: " + selOrLoc);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
  };
  const touchPath = async (pts, holdMs = 0, stepMs = 16) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pts[0].x, y: pts[0].y }] });
    if (holdMs) await page.waitForTimeout(holdMs);
    for (const p of pts.slice(1)) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x, y: p.y }] }); await page.waitForTimeout(stepMs); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const line = (a, dx, dy, n = 12) => Array.from({ length: n + 1 }, (_, i) => ({ x: a.x + (dx * i) / n, y: a.y + (dy * i) / n }));
  const t = {
    page,
    async tap(sel) { const c = await center(sel); await page.touchscreen.tap(c.x, c.y); await page.waitForTimeout(120); },
    async swipe(sel, dx, dy = 0, opts = {}) { const c = await center(sel); await touchPath(line(c, dx, dy, opts.steps || 12), 0, opts.stepMs || 16); await page.waitForTimeout(opts.settle ?? 450); },
    async edgeSwipe(y, dx, opts = {}) { await touchPath(line({ x: 4, y }, dx, 0, opts.steps || 14), 0, 18); await page.waitForTimeout(opts.settle ?? 450); },
    async longDrag(sel, dx, dy, opts = {}) { const c = await center(sel); await touchPath(line(c, dx, dy, opts.steps || 16), opts.hold ?? 0, 20); await page.waitForTimeout(opts.settle ?? 350); },
    async fill(sel, v) { await page.locator(sel).first().fill(String(v)); },
    async wait(ms) { await page.waitForTimeout(ms); },
    text: (sel) => page.locator(sel).first().innerText(),
    count: (sel) => page.locator(sel).count(),
    visible: (sel) => page.locator(sel).first().isVisible(),
    eval: (fn, arg) => page.evaluate(fn, arg),
    async shot(name) { await page.screenshot({ path: path.join(outDir, base + "-flow-" + name + ".png") }); },
    expect(cond, msg) { results.push({ ok: !!cond, msg }); console.log((cond ? "  ✓ " : "  ✗ ") + msg); },
  };
  return t;
}

// ---------- run ----------
const browser = await chromium.launch();
let failed = false;
for (const file of files) {
  const url = prepare(file);
  const base = path.basename(file, ".html").replace(/\.page$/, "");
  const outDir = opt.out || path.join(path.dirname(path.resolve(file)), "audit");
  fs.mkdirSync(outDir, { recursive: true });
  console.log("\n━━ " + base + " ━━");
  const report = { file, runs: [], flow: null };
  for (const dk of opt.devices.split(",")) {
    const dev = DEVICES[dk]; if (!dev) continue;
    for (const theme of opt.themes.split(",")) {
      const { label, mobile, ...ctxOpts } = dev;
      const ctx = await browser.newContext({ ...ctxOpts, colorScheme: theme, reducedMotion: "no-preference" });
      const page = await ctx.newPage();
      const consoleErrors = [];
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
      page.on("pageerror", (e) => consoleErrors.push(String(e)));
      await page.goto(url);
      await page.waitForTimeout(700);
      const res = await page.evaluate(inPageAudit, { mobile });
      await page.screenshot({ path: path.join(outDir, `${base}-${dk}-${theme}.png`) });
      await page.evaluate(() => window.scrollTo(0, 1e7));
      await page.waitForTimeout(250);
      const blocked = await page.evaluate(obstructionCheck);
      if (blocked.length) res.errors.push("content stuck under the bottom bar at max scroll: " + blocked.join("; "));
      if (consoleErrors.length) res.errors.unshift("console errors: " + consoleErrors.slice(0, 3).join(" | "));
      if (dk === "iphone" && theme === "light") {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(outDir, `${base}-${dk}-${theme}-full.png`), fullPage: true });
      }
      const tag = `${label} · ${theme}`;
      report.runs.push({ device: dk, theme, ...res });
      const nE = res.errors.length, nW = res.warnings.length;
      console.log(`${nE ? "✗" : "✓"} ${tag}: ${nE} errors, ${nW} warnings · targets ${res.metrics.touchTargets} (small ${res.metrics.smallTargets}) · lowContrast ${res.metrics.lowContrast} · topBar ${res.metrics.topBar} bottomBar ${res.metrics.bottomBar}`);
      for (const e of res.errors) console.log("    error: " + e);
      for (const w of res.warnings) console.log("    warn:  " + w);
      if (nE) failed = true;
      await ctx.close();
    }
  }
  if (opt.flow) {
    const flowMod = await import(pathToFileURL(path.resolve(opt.flow)).href);
    const { label, mobile, ...ctxOpts } = DEVICES.iphone;
    const ctx = await browser.newContext({ ...ctxOpts, colorScheme: "light" });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(url);
    await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page);
    const results = [];
    console.log("flow (" + label + "):");
    try { await flowMod.default(makeT(page, cdp, outDir, base, results)); }
    catch (e) { results.push({ ok: false, msg: "flow threw: " + e.message }); console.log("  ✗ flow threw: " + e.message); }
    if (errs.length) { results.push({ ok: false, msg: "runtime errors: " + errs.slice(0, 3).join(" | ") }); console.log("  ✗ runtime errors: " + errs.slice(0, 3).join(" | ")); }
    const nf = results.filter((r) => !r.ok).length;
    console.log(`  ${results.length - nf}/${results.length} assertions passed`);
    if (nf) failed = true;
    report.flow = results;
    await ctx.close();
  }
  fs.writeFileSync(path.join(outDir, base + "-report.json"), JSON.stringify(report, null, 2));
}
await browser.close();
process.exit(failed ? 1 : 0);
