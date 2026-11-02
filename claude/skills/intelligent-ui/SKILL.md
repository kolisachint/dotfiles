---
name: intelligent-ui
description: Answer an everyday request with a small, native-feeling mobile app bundled into one HTML artifact (screens, nav bar, tab bar, sheets, swipe/drag gestures, visual pick-cards, paper-style 2D diagrams and maps), in the spirit of GPT-6 "Intelligent UI". The app's content lives in an embedded Markdown file that any AI can edit for the next iteration; the HTML is only the view. Use for trip and weekend planners, how-to and assembly guides, folding/craft/recipe steps, itineraries and plans the user edits (add, remove, reorder), live previews and configurators (paint colors, layouts, sizes), trackers and logs (health, habits, spending), comparisons, calculators, and "how does X work" explainers. Also use when the user says "intelligent UI", "iui", "make it interactive", "make it an app", "show me", or "give me a tool for this". Also use to update such an app from its Markdown ("change the plan", a pasted plan file). Not for coding tasks in a repo, and not when a short text answer is the most useful response.
user-invocable: true
argument-hint: "[what you want to do, plan, track, preview, compare or understand]"
---

# Intelligent UI

Shape the interface around what the person is trying to do, then ship it as a **small app**
in one HTML artifact. It should feel installed: nav bar, screens that slide, sheets, swipe
and drag, and state that survives a reload. It is not a styled web page. Build every answer
from the same kit (`<skill>/assets`, inlined by the build), so they look consistent and
fit the platform. `<skill>` is the folder holding this file.

**Two files, one artifact.** `app.html` is the design (screens, styles, script). `app.md` is the
content (the plan, list, steps), written in a strict Markdown grammar with an instruction header
for AIs. The build embeds the .md in the page; the page draws everything from it and writes edits
back into it. Next iteration = edit the .md, not the HTML. See `reference/markdown-data.md`.

## Philosophy

1. **Fit the format to the task.** Find the person's verb (follow, edit, preview, track, decide,
   understand, calculate). The verb picks the app pattern, not the topic.
2. **Text wins ties.** If a sentence answers it, answer in a sentence and build nothing.
3. **An app, not a page.** Use a sticky nav bar with actions, a large title, inset grouped lists, a
   thumb-zone bar (tab bar or toolbar), and sheets for create/edit. Use direct manipulation (swipe to
   delete, drag to reorder, swipe between steps), not ↑ ↓ ✕ buttons. See `reference/app-patterns.md`.
4. **Show the thing.** If words describe a shape, direction, position, color or order, draw
   it: a paper-style 2D diagram, a paper map at real coordinates, or a live preview scene.
5. **One idea per screen.** Phone first (375px). One step, one decision or one preview per
   screen. Summary first, detail behind a tap.
6. **Every control does something visible**, immediately. Destructive actions offer Undo
   (snackbar) or confirm with an action sheet.
7. **Open in a working state.** Start with realistic sample data marked as sample, plus a
   one-tap way to clear it. An empty shell shows nothing.
8. **Honest content.** Use real names, real units and approximate real coordinates. Mark estimates
   "approx." and say what to double-check. For health, money or safety, say when to see a professional.
9. **Calm and consistent.** Use system fonts, one tint color per app picked from the subject's world
   (azulejo blue, workshop orange, washi red), and semantic colors only for meaning. Use icons, never emoji.
10. **Content lives in Markdown.** Anything a person will change later (stops, picks, packing, steps,
    entries) is a section of the embedded `.md`, not a JS literal. View-only state (selected tab,
    search text) stays out of it. Every app with content gets the Plan file sheet (`IUI.md.sheet`).
11. **Choose by looking, not reading.** When the person picks between options (stays, food, vibes,
    ideas), show `.choice` cards in a 2-column `.choices` grid (tinted art + icon, title, one line, 2 tags,
    check badge) and `.chips` for filters. A `.hero` card states the plan at a glance. Text lists are for
    things already chosen.
12. **Say what the page can't do.** An artifact can't call live services (no fetch, no API keys). Link
    out instead: Google Maps search `https://www.google.com/maps/search/?api=1&query=…`, directions
    `…/maps/dir/?api=1&origin=lat,lng&destination=lat,lng&waypoints=a|b`. Never invent businesses,
    prices, hours or ratings; name a kind of place and give the search. Tell the person in the reply
    what needs a real service (live search, bookings, sync between devices).

## Pick the app pattern from the verb

| Verb | App pattern | Screens & components | Real apps to match |
|---|---|---|---|
| **Follow** (assemble, fold, cook, fix) | Step-through guide | inline nav + `.pager` (progress, swipe, All steps sheet); page 1 = needs/legend; each step = `.paper[data-zoom]` diagram + 1–2 sentences + `.note`; last page = done + checklist; `IUI.keepAwake` | IKEA instructions, LEGO Builder, NYT Cooking mode |
| **Edit a plan** (itinerary, agenda) | Living plan | `.summary` → `IUI.map` → `.list[data-reorder]` with `.leg` connectors, swipe delete, Edit → `.bottom-bar` toolbar (smart action + Add) → search **sheet** to add → push **detail screen** with steppers | Wanderlog, Google Maps lists |
| **Preview** (paint, layout, outfit) | Live configurator | sticky scene preview → `.seg` context (light) → `.seg` families + `.swatches` → `.switch` rows (variants, compare) → facts list → favorites (swipe) → estimate **sheet** | Dulux Visualizer, IKEA Kreativ |
| **Track** (health, habits, money) | Tracker | tab bar (Summary, History) · summary: goal ring, `.grid-2` of `.metric` cards with sparklines, highlights · tap → detail screen with `.seg` range, scrubbable chart, goal stepper, entries · Add Data **sheet** with steppers | Apple Health, Google Fit |
| **Plan with time** (trip, event) | Plan view | tab bar (Trip, Stay & Eat, Packing, Ideas) · `.hero` + day `.seg` + map + stop list · `.choices` pick-cards with a Maps link · vibe `.chips` filtering idea cards that add stops · checklist with ring. Worked example: `examples/weekend/` | Google Travel, TripIt, Wanderlog |
| **Decide** | Comparison | cards or a table side by side, `.seg`/chips to weight what matters, a verdict `.note` that updates | Wirecutter, Apple Compare |
| **Understand** | Explorable | diagram/chart on top, one slider below, a sentence saying what changed | Brilliant |
| **Calculate** | Calculator | big result card on top, `.list` of steppers/fields below | Calculator utilities |

Patterns combine: a trip is a plan view whose days are living plans.

## Build

1. Read `<skill>/reference/app-patterns.md` (what native apps do) and
   `<skill>/reference/components.md` (kit markup + `IUI` API). For diagrams, maps or scenes, also
   read `<skill>/reference/diagrams.md`. Read each once per session.
   For any app with content, read `<skill>/reference/markdown-data.md`. For a trip or plan, start
   from `<skill>/examples/weekend/` (copy, then change the .md and the tint).
2. Write the **content** (`<name>.md`): frontmatter, the AI instruction header (template in
   markdown-data.md §2, listing every section and field the app reads), `# Title`, one intro line,
   then `## Sections` of records / checklists. Real names, approx. coordinates, `search` queries.
3. Write the **fragment** (`<name>.html`, same folder, scratchpad unless told otherwise):
   `<title>` (2–4 word name), `<style>` with `:root { --tint-l: …; --tint-d: …; }` and any extras
   (tokens only), `<div class="app">` with screens, `<dialog class="sheet">`s, and one `<script>`.
4. App code pattern:
   - `const S = IUI.mdState("<app>", { ui: {…} })` reads the embedded .md (`s.doc`) plus view state
     (`s.ui`); `IUI.md.sheet(S)` adds the Plan file sheet; edit with `S.add/patch/remove/update`;
     an app with no editable content may use `IUI.state("<app>:v1", seed)` instead;
   - `IUI.render(region, view, S)` per region; views are `IUI.html\`…\`` (auto-escaped); list items
     carry `data-key="${item._id}"`;
   - events via `IUI.on(type, selector, fn)` and kit events (`iui:delete`, `iui:reorder`,
     `iui:change`, `iui:screen`, `iui:sheet`, `iui:done`); maps and charts are redrawn in `S.subscribe`;
   - generate repeated markup and SVG from data. Never copy-paste near-identical blocks.
5. Pitfalls the kit can't fix for you:
   - no nested buttons (a row with a handle uses `button.row-main`); labels that also contain a
     button need `for=`; stepper/row buttons inside forms are fine (the kit sets `type=button`);
   - no `alert/confirm/prompt/print/eval/fetch` (blocked in artifacts). Use `IUI.confirm` / `IUI.toast`;
   - text on a user-chosen color uses `IUI.color.on()`; every input has a label or `aria-label`;
   - a link inside a pick-card is a sibling of the card's button (`.choice-wrap > .choice-link`), never inside it.
6. Compile and lint. This embeds `app.md` (same stem, or `--data`) and writes the artifact file and a local preview:
   ```bash
   python3 <skill>/scripts/build.py app.html -o out/app.html --preview
   ```

## Test like a phone (required)

1. **Device matrix:** `node <skill>/scripts/audit.mjs out/app.preview.html --out audit`. It runs
   iPhone 13, iPhone SE, Pixel 7 and desktop in light and dark, with real touch emulation. It fails
   on tap targets under 44px, inputs that make iOS zoom, contrast below WCAG, sideways scroll, content
   stuck under bars, invisible text, console errors, emoji icons and missing labels. Fix to 0 errors.
2. **Touch flow:** write `flow.mjs` that exercises every interaction once, and run it with `--flow flow.mjs`:
   ```js
   export default async function (t) {
     await t.swipe("#stops .row >> nth=1", -330);           // swipe left (also t.longDrag, t.edgeSwipe)
     t.expect((await t.count("#stops .row")) === 5, "full swipe deletes");
     await t.tap(".toast button"); await t.tap("[data-sheet=add]"); await t.fill("#q", "market");
     await t.shot("add-sheet");                               // screenshot for review
   }
   ```
   Cover push/back, sheet open → submit → close, swipe delete → Undo, reorder, segmented and stepper
   changes, and reload persistence. For Markdown apps also assert that
   `IUI.md.stringify(IUI.md.parse(IUI.md.read()))` equals the file, that the Plan file sheet shows
   your edits, and that Apply with an edited file changes the screen (see `examples/weekend/flow.mjs`). `t.tap` refuses to tap through bars or toasts, like a real finger.
3. **Look** at the iPhone light and dark screenshots and the flow shots in one pass. Fix, rerun once, stop.
   (Needs Playwright: `npm i -g playwright && npx playwright install chromium`, or set `PLAYWRIGHT_DIR`.)

## Deliver

Publish `out/app.html` with the Artifact tool (private by default), with a one-word icon and a
one-sentence description, and `capabilities: {artifact: {}, downloads: true}` when it has the Plan
file sheet (Apply saves for everyone; Save .md works). Where there is no Artifact tool, use an inline widget, or give the person
the file. Keep `app.md` next to it. Reply in 1–3 sentences: what the app does, the key takeaway,
and what to double-check, plus one line on how to change it (Plan file → Copy → ask Claude → paste →
Apply, which saves it for everyone with edit access).

## Iterate (the next request)

The person asks for a change, or pastes a plan file:
- **Content change** (add a stop, swap the hotel, new packing items): edit only the `.md`. Keep
  the frontmatter keys, section names, field names and the instruction comment. Then
  `python3 <skill>/scripts/md.py inject out/app.html app.md` and republish to the **same URL**. If
  you only have the published page, `Artifact read` it, then `md.py extract page.html -o app.md` first.
- **Pasted Markdown** from the Plan file sheet: edit it and return the whole file in one fenced
  ```markdown block so they can paste it back and tap Apply (which republishes the page for everyone).
- **Before you republish an artifact** whose viewers can Apply, `Artifact read` it first and extract
  its Markdown: someone may have saved a newer plan from the page itself. Build on that, not on your copy.
- **Design or feature change:** edit the fragment, rebuild (the .md is re-embedded), audit, republish.
  A new field must also be added to the .md instruction header.
