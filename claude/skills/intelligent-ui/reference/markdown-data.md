# Markdown data: the .md is the app, the HTML is the view

Every app that holds content someone will change later (a plan, a list, a tracker, a guide)
keeps that content in **one Markdown file**, embedded in the page. The HTML only draws it.

Why:
- **AI edits text well.** Changing a trip means editing ~10 lines of Markdown, not hunting
  through generated HTML. The next iteration is "edit the .md, re-embed, republish".
- **The design stays put.** Look and behaviour live in the fragment; content lives in the
  file. Either can change without breaking the other.
- **Portable.** One self-contained HTML file carries its data. Anyone can open the Plan
  file sheet, copy the Markdown, take it to any AI, and paste the reply back.

```
app.html  (design: screens, styles, one script)  ─┐
app.md    (content: frontmatter + ## sections)    ─┼─ build.py ─► out/app.html
                                                    │   <script type="text/markdown" id="iui-data">…</script>
the page parses it on load ─► IUI.mdState ─► screens ─► edits write back into the same Markdown
```

## 1. File grammar (strict, small, round-trips exactly)

```markdown
---
place: Lonavala, Maharashtra        ← frontmatter: doc.meta (flat key: value)
dates: Sat 17 – Sun 18 Oct 2026
sample: yes
---

<!--
HOW TO CHANGE THIS … (instructions for Claude or any AI)   ← kept verbatim, never rendered
-->

# Weekend Getaway                   ← doc.title

One-line hero text.                 ← doc.intro (anything before the first ##)

## Stops                            ← section; key = slug ("stops")

- name: Bhushi Dam                  ← record item: "- key: value"
  day: Sat                          ←   indented "key: value" lines add fields
  at: 18.7460, 73.3999

## Packing

### Clothes                         ← group: sets item.group for the items below

- [ ] Rain jacket                   ← checklist item {text, done}
- [x] Grippy shoes

## Notes

- Bring cash for parking            ← plain item {text}
Free paragraph text                 ← section.text
```

Rules the parser relies on (put them in the file's instruction comment):
- Keys are **lowercase identifiers** (`name`, `pick`, `at`). "Tip: carry water" with a capital
  is a plain item, not a record.
- Values are **strings**. Type them at render time with the helpers (§3). Empty values are
  dropped on write, so "unset" = "leave the key out".
- Section names are the contract between the file and the app. The app reads
  `S.items("Stops")`. A section the app does not know is preserved but not shown.
- Item order in the file is the order on screen (routes, steps, priorities).
- Runtime fields start with `_` (`_id`) and are never written back.

`stringify(parse(x))` reproduces a file written in this style exactly (blank line between
records, none between checklist lines, frontmatter first, instruction comment next). Keep
seed files in that style so diffs stay small.

## 2. The instruction header (always include it)

Put a comment right after the frontmatter. It travels with the data wherever the file goes,
so any AI that receives it knows how to edit it safely. Template:

```markdown
<!--
HOW TO CHANGE THIS <THING> (instructions for Claude or any AI)
This Markdown is the whole content of the "<App name>" app. The HTML only draws it.
Change it by editing this text, then either:
  a) paste it into the app's Plan file sheet and tap Apply (only that browser sees it), or
  b) re-embed and republish so everyone sees it (intelligent-ui skill):
       python3 scripts/md.py inject out/<app>.html <app>.md
     then republish out/<app>.html to the same artifact URL.

Format rules (the parser is strict; keep to them):
- Sections are "## Name". Keep these names: <list>. Other ## sections are kept but not shown.
- A record is "- key: value" plus indented "  key: value" lines. Keys are lowercase.
- <Section>: <field> (<allowed values / format>), … one line per section.
- Checklists: "- [x] item" / "- [ ] item", grouped by "### Group".
- Do not invent precise facts (prices, hours, phone numbers, ratings). Give a search query.
-->
```

Write the field list from the app's actual reads, with allowed values (`type (start | nature
| …)`, `price (₹ | ₹₹ | ₹₹₹)`, `at ("lat, lng" as Google Maps copies it)`). That list is
what keeps a future AI edit from breaking the screens.

## 3. API

```js
const M = IUI.md;
const S = IUI.mdState("weekend", { ui: { day: "All", sel: null } });   // reads #iui-data
IUI.md.sheet(S, { filename: "weekend-plan.md" });                     // adds the Plan file sheet (data-sheet="iui-md")

IUI.render("#list", (s) => h`…${M.items(s.doc, "stops").map(…)}…`, S);  // s = {doc, ui}
S.items("stops")                       // current items (each has a stable _id for data-key)
S.add("stops", { name, day, at })      // returns the item (with _id)
S.patch("stops", id, { time: "1 h" })  // merge fields
const undo = S.remove("stops", id)     // returns undo(): puts it back at the same index
S.update("stops", (items) => IUI.move(items, from, to))   // any array transform
S.setMeta({ place: "…" }); S.ui({ day: "Sun" }); S.ui()   // frontmatter / view-only state
S.md()                                 // current Markdown (what Copy / Save give you)
S.load(text)                           // apply pasted Markdown; false if it has no ## sections
S.reset()                              // back to the published file
```

- `S.get().doc` = `{ meta, head, title, intro, sections: [{ key, name, text, items, comments }] }`.
- **View-only state** (selected pin, current tab filter, search text) lives in `S.ui`, never
  in the file.
- **Persistence:** the state key includes a hash of the embedded file. A viewer's edits
  persist across reloads until a new file is published; then the new file wins. That is
  what makes "AI edits the .md → UI changes" reliable.
- Helpers for string fields: `M.num(v)`, `M.yes(v)` (yes/true/1/x), `M.list("a, b")`,
  `M.latlng("18.74, 73.39")` → `{lat, lng}`, `M.minutes("1 h 30 min")` → 90, `M.dur(90)` → "1 h 30 min".
- Write values back as the same human strings (`time: M.dur(mins)`, `pick: "yes"` / `""`),
  so the file stays readable.

## 4. The Plan file sheet, and saving for everyone

`IUI.md.sheet(S, opts)` injects a sheet with the live Markdown, **Copy**, **Save .md**,
**Apply** and **Reset to the published file**. Put a `data-sheet="iui-md"` button (icon `list`,
`aria-label="Plan file (Markdown)"`) in each root screen's nav bar. It gets an orange dot while
this browser holds changes the published page lacks.

**Apply saves for everyone.** build.py embeds the page's own template
(`<script type="application/json" id="iui-src">`, Markdown and template as placeholders, about
the page's size again). Apply regenerates the complete document with the new Markdown
(`IUI.md.page(md)`, in the exact shape the artifact service serves) and publishes it through
the `artifact` capability (`IUI.md.publish(md)`); every open view reloads to it. Outcomes:
- saved: toast "Saved for everyone", the view reloads to the new version;
- `conflict`: someone saved first, the view reloads to theirs;
- read-only viewer (`not_writer` / `not_granted` / no capability): applied in this browser
  only, and the toast says they can view but not edit;
- `rate_limited` / other: applied here, not saved for everyone, with the reason.
Opened as a local file (no artifact host), Apply changes that browser only.

**Publish with `capabilities: {artifact: {}, downloads: true}`**: `artifact` lets Apply save,
`downloads` lets Save .md work in the viewer (a blob link is used when opened as a local file).
If the clipboard is blocked, Copy falls back to selecting the text and says so.
Keep the self-save template unless size matters (`--no-self-save`); then Apply is local-only.

The test for this lives in `examples/weekend/flow.mjs`: the regenerated page must equal the
built page byte for byte, and Apply is exercised against a mocked host (save and read-only).

## 5. Iterating with an AI (the loop)

1. **Small change, by the person:** open Plan file, Copy, paste to Claude with the request,
   paste the reply back, Apply. The page saves itself for everyone who opens the link.
2. **Change for everyone:** edit `<app>.md` (or extract it from a published page:
   `md.py extract out/app.html -o app.md`), then `md.py inject out/app.html app.md` and
   republish to the same URL. No rebuild needed, and the design is untouched.
3. **New feature or look:** edit the fragment, then `build.py app.html -o out/app.html`
   (it embeds `app.md` automatically), audit, republish.

When Claude receives a Markdown file pasted from the app, it edits only the content, keeps
the frontmatter keys, section names, field names and the instruction comment, and returns
the whole file.
