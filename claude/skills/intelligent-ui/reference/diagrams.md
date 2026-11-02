# Paper diagrams, maps and preview scenes

Draw flat 2D pictures on a paper card, like a good instruction leaflet: calm, low
contrast, with one thing highlighted. They answer "which part, which way, where", which text
handles badly.

```html
<figure class="paper" data-zoom aria-label="What the drawing shows">
  <svg viewBox="0 0 320 210" role="img" aria-label="What the drawing shows">…</svg>
  <figcaption>Optional one-line takeaway</figcaption>
</figure>
```
`data-zoom` makes it tap-to-zoom (pinch, double-tap, Esc). Colors come from tokens, so dark mode
is automatic. Never put fills in a diagram except through these classes or `style="…var(--…)"`.

## Stroke vocabulary (SVG classes)

| Class | Use |
|---|---|
| `ink` | main outlines (2px, round caps) |
| `ink-2` | context and secondary parts: things not in focus this step |
| `ghost` | dashed faint outline: where something was, or will go |
| `sheet` / `sheet-back` | a surface or object, front / back face |
| `tint` | the colored side, or the part being worked on |
| `hl` | **the one thing to look at** (tint fill + stroke). One per diagram |
| `arrow` | motion: fold, push, turn, insert (shared arrowhead `#iui-arrow`) |
| `valley` | dashed tint line: fold toward you / crease |
| `mountain` | dash-dot gray line: fold away from you |
| `dot` | small tint marker |
| `text`, `text.soft`, `text.on-tint` | 13px labels on the drawing: strong, quiet, on a tint fill |

## Drawing rules
1. **Start state, motion, result.** Draw the object, an `arrow` for what moves, and a `ghost`
   or a small inset of the result. Left to right reads as before → after.
2. **One highlight.** Only the acted-on part gets `hl`/`tint`. Earlier parts drop to `ink-2`.
3. **Few strokes: 5–25 elements** of simple geometry. If it needs more, split the step.
4. **Same viewBox and orientation for every step**, so the object never jumps. Flip it only when
   the person physically does, and label that ("turn over").
5. **Labels are 1–3 words**; the sentence goes under the figure. Keep labels at least 10px from edges.
6. **Draw from data.** Keep geometry in JS (`const frame = '<path class="ink" …/>'`), compose
   each step from shared parts, and change only the highlight. Build step N from step N-1.
7. **Check the geometry:** a fold halves an edge, symmetrical parts mirror, and nothing leaves the viewBox.
   Zoom into each step once in the browser.
8. **Legend once, on the first page**, for symbol systems (valley, mountain, arrow). Use rows with tiny inline SVGs.

## Maps
Use `IUI.map` (see components §9), never map tiles. The page can't load them, and a paper
map is calmer and themed.
- Give **real approximate lat/lng** for every place. The projection is north-up and fitted to the
  places, so relative positions and the scale bar are true. Say "estimates" for times and distances.
- Add context sparingly: one `water` polygon for a coast or river you're sure of, 2–3 district `labels`.
  Leave out roads unless you know their shape. Random strokes read as noise.
- Use `extent` to pull a landmark (a river) into frame, and `minKm` so a single place isn't zoomed in to street level.
- Link map and list both ways: `onSelect` → set `selected` → highlight the row (`aria-current`) and
  `scrollIntoView({ block: "nearest" })`; tapping a row selects its pin.
- For a place you have no coordinates for, put it near the previous stop and label it "position approx."

## Preview scenes (live configurators)
Draw a flat, front-on scene of the thing being configured: a room for paint, a garden bed,
a shelf, an outfit.
- **Back plane, floor plane, 2–4 context objects** (sofa, window, plant). The context objects use
  realistic fixed colors (wood, fabric). Those are content, so literal hex is fine there.
- **The previewed surface is a shape with an `id`** whose fill comes from state, so tests and code can check it.
- **Lighting:** overlay a full-size rect with `mix-blend-mode: multiply` (warm `#ffb35c` ~0.24 for
  evening, cool `#7f95b8` ~0.2 for north light).
- **Text on the user's color** uses `IUI.color.on(hex)`. Show the color's real-world numbers
  (code, LRV via `IUI.color.lrv`) beside the scene.
- **Compare:** split the surface (new on the left, previous on the right) with a 2px divider and labels.
- Keep the scene **sticky under the nav** (`position: sticky; top: calc(env(safe-area-inset-top) + var(--nav-h))`, about 30vh)
  so controls scroll underneath and every change stays in view.
