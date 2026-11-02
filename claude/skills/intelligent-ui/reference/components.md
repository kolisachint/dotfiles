# App kit reference

Everything here is inlined by `scripts/build.py` (`assets/iui.css` + `assets/iui.js`). Write
markup with these classes and drive it with the `IUI` API. Behavior is delegated at the
document level, so it keeps working after you re-render.

## 1. Shell: app, screens, nav bar, tab bar

```html
<title>Lisbon Day</title>                          <!-- 2–4 word name, used by the artifact gallery -->
<style>:root { --tint-l: #1f4fa8; --tint-d: #86abff; }</style>   <!-- the app's one tint, light + dark -->

<div class="app">                                  <!-- add data-wide for map+list apps that should use desktop width -->
  <section class="screen" id="home" data-title="Lisbon Day">
    <header class="nav">
      <div class="nav-l"><button class="nav-btn" data-edit="stops">Edit</button></div>
      <div class="nav-title"></div>                <!-- filled from the large title; fades in on scroll -->
      <div class="nav-r"><button class="nav-btn" data-sheet="add" aria-label="Add a stop"><svg class="i"><use href="#i-plus"/></svg></button></div>
    </header>
    <div class="title-block"><p class="eyebrow">Saturday</p><h1 class="large-title">Lisbon Day</h1><p class="title-sub">On foot</p></div>
    <div class="content" id="home-content">…</div>
    <div class="bottom-bar"><button class="btn gray">…</button><button class="btn">Add stop</button></div>  <!-- optional thumb-zone toolbar -->
  </section>

  <section class="screen" id="place" hidden>       <!-- pushed screen -->
    <header class="nav">
      <div class="nav-l"><button class="nav-btn" data-back><svg class="i"><use href="#i-chevron-left"/></svg><span class="back-label">Back</span></button></div>
      <div class="nav-title"></div><div class="nav-r"></div>
    </header>
    <div id="place-body"></div>
  </section>

  <nav class="tabbar" aria-label="Sections">       <!-- optional; 2–5 tabs, each a root screen -->
    <button class="tab" data-tab="home"><svg class="i"><use href="#i-map"/></svg><span>Plan</span></button>
  </nav>
</div>
```
- The first screen without `hidden` is the root. A screen without `.large-title` gets an inline nav title.
- **Navigation:** `data-go="screenId"` (+ `data-arg="…"`) pushes with a slide. `data-back` / `IUI.back()` pops, as does an edge swipe from the left. `data-tab` / `IUI.tab(id)` switches roots. `IUI.go(id, arg)` is the same in JS.
- **Render on arrival:** `IUI.onScreen("place", (arg) => draw(arg))` runs before the screen shows, including after a reload (the stack is restored).
- `data-hide-tabbar` on a screen hides the tab bar there. The back label is filled with the previous screen's title.
- Pages scroll the document; nav bars are sticky. The kit adds `scroll-padding` so `scrollIntoView` clears the bars.

## 2. Content layout
```html
<div class="content">                         <!-- 16px gutters, 22px between sections -->
  <div class="section"><div class="section-head"><h2 class="section-title">Pinned</h2></div> … </div>
  <h2 class="list-header">Day settings</h2>   <!-- small caps label above a list -->
  <p class="list-footer">Explanation under a list.</p>
  <div class="grid-2">…</div> <div class="grid-3">…</div> <div class="split">…</div>
</div>
<div class="sticky-sub"><div class="seg">…</div></div>   <!-- control pinned under the nav (day switcher) -->
```

## 3. Lists and rows (inset grouped)
```html
<div class="list">
  <button class="row" data-go="detail" data-arg="7">
    <span class="tile" data-tone="orange"><svg class="i"><use href="#i-clock"/></svg></span>
    <span class="row-main"><span class="row-title">Start at</span><span class="row-sub">Secondary line</span></span>
    <span class="row-value">09:00</span><svg class="i chev"><use href="#i-chevron-right"/></svg>
  </button>
  <label class="row" for="acc"><span class="row-main"><span class="row-title">Accent wall</span></span><input type="checkbox" class="switch" id="acc"></label>
  <button class="row center destructive"><span class="row-title">Remove from Day</span></button>
</div>
```
- Tones: `data-tone="red|orange|yellow|green|teal|blue|indigo|purple|pink|gray"` sets `--tone` (text) and `--tone-tile` (tile bg).
- A row that has its own controls (handle, stepper) is a `div.row`, and its tappable body is a `<button class="row-main">`. Never nest buttons.
- **Checklist row:** `<label class="row" for="x"><input type="checkbox" class="check-input" id="x"><span class="row-main">…</span></label>`. Always use `for=` when the label also contains a button (a label targets its *first* labelable descendant).
- **Numbered stop:** `<span class="pin-n">3</span>`. **Connector between rows:** `<div class="leg" data-key="leg-…"><svg class="i"><use href="#i-walk"/></svg><span>7 min · 380 m</span></div>`.
- **Highlighted row:** `aria-current="true"`.

### Swipe to delete, Edit mode, reorder
```html
<div class="list" id="stops" data-reorder>
  <div class="row" data-key="ab12" data-id="ab12" data-swipe="Delete">
    <button class="row-del" aria-label="Delete Alfama">…minus-circle…</button>  <!-- visible in Edit mode -->
    <button class="row-main">…</button>
    <span class="handle" role="button">…grip…</span>                          <!-- drag to reorder -->
  </div>
</div>
<button class="nav-btn" data-edit="stops">Edit</button>
```
```js
IUI.on("iui:delete", "#stops", (e) => remove(e.detail.id));          // after the row animates out; offer Undo
IUI.on("iui:reorder", "#stops", (e) => S.set((s) => ({ ...s, stops: IUI.move(s.stops, e.detail.from, e.detail.to) })));
```
- A short swipe reveals the action; a full swipe or a tap on it deletes. Handles also take ↑/↓ keys.
- `from`/`to` index the `.row` children only (legs are ignored), so render rows in state order.

## 4. Controls
```html
<div class="seg" data-seg="range"><button data-value="w" aria-checked="true">Week</button><button data-value="m">Month</button></div>
<div class="chips" data-chips="metric"><button class="chip" data-value="sleep" aria-pressed="true">Sleep</button>…</div>   <!-- data-multi for multi-select -->
<div class="stepper"><button data-step="-1" aria-label="Less">…minus…</button><input type="number" id="stay" value="30" min="10" max="240" step="5" inputmode="numeric" aria-label="Minutes"><button data-step="1" aria-label="More">…plus…</button></div>
<input type="checkbox" class="switch">  <input type="range" class="slider">  <input type="color" class="color-well">
<label class="search"><svg class="i sm"><use href="#i-search"/></svg><input type="search" aria-label="Search places"></label>
<input class="field-input" type="time|date|number|text">          <!-- right-aligned value inside a .row -->
<div class="swatches"><button class="swatch" data-hex="#3f5a48" aria-pressed="true" style="--c:#3f5a48"><i></i>Forest</button></div>
```
- `.seg` and `.chips` emit `iui:change` `{name, value, values}`. The stepper fires `input`/`change` on its input.
- **Buttons:** `.btn` (filled tint, 50px), `.btn.tinted`, `.btn.gray`, `.btn.plain`, `.btn.danger`, `.btn.sm`, `.btn.icon` (44px round, `aria-pressed` for toggles), `.nav-btn` (`.strong` for the confirm action).

## 5. Sheets, action sheets, toasts
```html
<dialog class="sheet" id="add" aria-labelledby="add-title">
  <div class="sheet-grabber"></div>
  <header class="sheet-nav"><button class="nav-btn" data-close>Cancel</button><h2 id="add-title">Add Data</h2><button class="nav-btn strong" type="submit" form="add-form">Add</button></header>
  <form class="sheet-body" id="add-form" novalidate>…lists of fields…</form>
</dialog>
```
- Open with `data-sheet="add"` or `IUI.sheet("add").open()`; close with `data-close`, `IUI.closeSheet("add")`, a drag down, a backdrop tap or Esc. It emits `iui:sheet {id, open}`, so prefill the form when `open` is true.
- `await IUI.confirm({ title, message, confirm: "Remove", destructive: true })` shows an action sheet and resolves `true`/`false`. `confirm()` itself is blocked in artifacts.
- `IUI.toast("Removed Alfama", undoFn)` or `IUI.toast(msg, { icon: "check-circle", undo, action: "Undo" })` shows a snackbar above the bars.

## 6. Pager (step-through)
```html
<div class="pager" id="pager" data-pager="unique-key" data-done="Finish">
  <article class="page" data-title="Fit the handlebar">
    <div class="page-head"><span class="n">1</span><h2>Fit the handlebar</h2></div>
    <figure class="paper" data-zoom aria-label="…">…svg…</figure>
    <p>One or two short sentences.</p>
    <div class="note" data-tone="orange">…</div>
  </article>
</div>
```
- The kit generates a segmented progress bar, a bottom bar (Back · "n / N" · Next) and an "All steps" sheet when the counter is tapped. Swipe follows the finger (native scroll-snap); ←/→ keys work.
- It remembers the page across reloads. It emits `iui:page {index,total}` and `iui:done`. `IUI.pagerGo("pager", i)` jumps to a page.
- Generate pages from data with `IUI.morph("#pager", html\`…\`)` before the kit boots (the inline script runs first).
- `IUI.keepAwake(true)` keeps the screen on while someone follows the steps. It returns false where that's refused, so tell the user.

## 7. Content blocks
`.card` (`.card.pressable` for tappable), `.metric` card (`.metric-head` / `.metric-value small` / `.metric-foot`),
`.summary` strip (`.v` value + `.k` label, 2–4 cells), `.badge` (`.tint` or `data-tone`), `.note` (icon + `<strong>` + text, `data-tone`),
`.timeline > li` (`.t` time + `.b` body), `.progress > i` (`--p: 40%`), `IUI.stackbar(parts)`, `.legend-dot`, `.kv` (dl), `.empty` state
(`.empty-icon` + h3 + p + a button), `.prose`.

## 8. Charts, sparkline, ring
```js
IUI.chart("#chart", { type: "bar" | "line", labels, fullLabels, series: [{ name, values, color: "var(--tone)" }],
  unit: " h", target: 7.5, decimals: 1, height: 200, readout: "#readout",
  summary: { label: "Average · last 7 days", value: "7.2" } });
```
- `readout` is a `<div class="chart-readout">` that shows `summary` at rest and the touched point while a finger is down.
- Tap or drag to inspect; vertical scroll still works. It redraws on resize. `null` values leave gaps.
- `IUI.spark(values, { w, h, bars })`, `IUI.ring(fraction, { size, stroke, label, color })`.

## 9. Maps (paper, real coordinates)
```js
IUI.map("#map", { places: [{ id, name, lat, lng, label }], selected: id, onSelect: (id) => …,
  layers: { water: [[[lat, lng], …]], park: […], roads: [[[lat, lng], …]] }, labels: [{ lat, lng, text }],
  extent: [{ lat, lng }], minKm: 0.8, height: 240, route: true });
```
- North-up equirectangular projection fitted to the places. It draws a grid, compass and scale bar, plus a dotted route in list order and numbered pins (44px hit areas) with a name bubble on the selected one. Pins that overlap get spread apart with leader lines.
- Container: `<figure class="paper map" id="map" aria-label="…"></figure>`. Call `IUI.map` again after state changes.
- `IUI.geo.km(a, b)` (haversine), `IUI.geo.walkMin(km, detour = 1.3)` at 4.8 km/h. Label every derived time "estimate".

## 10. State, rendering, events
```js
const S = IUI.state("lisbon:v2", () => ({ stops: seed(), pace: "relaxed" }));   // persisted per viewer; null key = not persisted
IUI.render("#home-content", (s) => html`…`, S);                               // re-renders (keyed morph) on every S.set
S.set({ pace: "brisk" }); S.set((s) => ({ ...s, stops: … })); S.reset(); S.subscribe(fn);
IUI.on("click", "[data-add]", (e, el) => …);                                  // delegated: survives re-renders
```
- **`IUI.html` escapes every `${value}`.** Use it for anything containing user text. `IUI.raw(str)` marks trusted markup, nested `html` results stay raw, and arrays are joined.
- **Morph keeps DOM identity:** give list items `data-key`. Focused inputs keep their value. Attributes starting with `data-iui-` are runtime state and survive re-renders. Elements owned by charts or maps are left alone.
- Other helpers: `IUI.morph(el, html)` (one-off), `IUI.mount(el)` (after inserting markup yourself), `IUI.store(key, fallback)`, `IUI.uid()`, `IUI.move(arr, from, to)`, `IUI.clamp`, `IUI.today()`, `IUI.addDays(iso, n)`, `IUI.haptic(kind)`, `IUI.layout()`.
- **Format:** `IUI.fmt.num/fixed/money/pct/date/day/weekday/time(minutes)/dur(minutes)/dist(km)`.
- **Color:** `IUI.color.on(hex)` (readable ink), `.lrv(hex)` (light reflectance 0–100), `.contrast(a,b)`, `.mix(a,b,t)`, `.harmony(hex)` → `{complement, analogous, lighter, deeper, trim}`.

## 11. Icons
`IUI.icon(name, cls)` in templates or `<svg class="i"><use href="#i-name"/></svg>` in static markup (`.sm` 18px, `.lg` 30px).
Names: chevron-left/right/up/down, arrow-right/up/down, plus, minus, close, check, check-circle, minus-circle, trash, edit,
grip, reorder, more, share, heart, star, pin, map, route, walk, car, train, bus, plane, bed, food, coffee, camera, clock,
calendar, sun, moon, bulb, cloud, drop, steps, scale, pulse, flame, wrench, tool, bike, layers, palette, roller, ruler,
info, alert, list, check-list, grid, play, undo, search, home, leaf, box, crane, target, bolt, sliders, expand, compare,
window, sofa, wallet, sparkle, settings. Never use emoji as icons.

## 12. Markdown data, hero, pick-cards
```js
const S = IUI.mdState("trip", { ui: { day: "All" } });   // content from the embedded .md (build.py embeds app.md)
IUI.md.sheet(S, { filename: "trip.md" });                // Plan file sheet; open with data-sheet="iui-md"
S.items("stops"); S.add/patch/remove/update(...); S.ui({...}); S.md(); S.load(text)
IUI.md.latlng / minutes / dur / yes / list / num        // string fields → values
```
Full grammar, instruction header and iteration loop: `reference/markdown-data.md`.
```html
<div class="hero">${IUI.icon("leaf", "hero-art")}<p class="hero-k">Dates</p><h2 class="hero-t">Place</h2>
  <p class="hero-s">One line</p><div class="hero-stats"><div><b>4</b><span>Stops</span></div>…</div></div>

<div class="choices">                                   <!-- or .rail for a horizontal snap scroller -->
  <div class="choice-wrap" data-key="…">
    <button class="choice" data-tone="teal" aria-pressed="true">
      <span class="choice-art">…icon…</span><span class="choice-check">…check…</span>
      <span class="choice-body"><span class="choice-t">Title</span><span class="choice-s">Area · ₹₹</span>
        <span class="choice-tags"><span class="badge">quiet</span></span></span>
    </button>
    <a class="choice-link" href="https://www.google.com/maps/search/?api=1&query=…" target="_blank" rel="noopener" aria-label="Search … on Google Maps"><span>…map icon…</span></a>
  </div>
</div>
```
- `aria-pressed` drives the selected ring and check. Single-choice: clear the others in the handler.
