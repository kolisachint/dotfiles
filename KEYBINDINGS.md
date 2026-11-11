# Keybinding philosophy

One dictionary of verbs, one entrance per app, defaults are law.
Agreed 2026-11-10. Tool configs are the source of truth for *what*;
this file is the *why*.

## Law 1 — The Pyramid

`Session > Tab > Pane > View > Buffer`. One letter moves exactly one tier.

- **nvim tabpages are Views, not Tabs.** The multiplexer owns the Tab tier.
  This kills the only true key conflict we had (`Tab` = next pane in
  rex/herdr vs next tabpage in nvim): different tiers, never ambiguous
  in context. Keep nvim tabpages near-zero; let the multiplexer own tabs.

## Law 2 — One dictionary, native entrance per app

The verbs and letters are fixed; only the *entrance* changes, and it is
whatever the platform natively affords:

| Entrance | Apps |
|---|---|
| `Ctrl-b` + letter (tmux also `Ctrl-Space`) | herdr, rex, tmux (prefix culture) |
| `Cmd-b` + letter (alias leader) | rex only (thumb-friendly native path) |
| `Space` + letter (leader), bare `Ctrl-` for movement | nvim |
| `Cmd-Shift` + letter (gap-fill only) | Ardia (the only free layer macOS leaves) |
| `Ctrl-x` + letter, context-mode bare letters | hoocode |

Same letter ⇒ same verb, always.

### The verb dictionary

| Verb | Key | herdr | rex | tmux | nvim | Ardia |
|---|---|---|---|---|---|---|
| move focus | `h j k l` | prefix | prefix / Cmd-b | prefix | bare `Ctrl-` | — |
| next/prev | `n` / `p` | prefix n/p | prefix n/p + direct `⇧⌘J/K`* | prefix n/p | `]t` / `[t`, `Tab` | custom `⇧⌘J/K` |
| sidebar/tree | `b` | prefix b | prefix b; native `Cmd-/` | prefix b (status bar) | `<leader>b` (+ `Ctrl-n` kept) | custom `⌘B` (= Zed default; bare `⌘B` impossible in rex, `Cmd-b` is its leader) |
| split right/down | `v` / `-` | prefix | prefix | prefix (+ `%` `"` kept) | `<leader>v` / `<leader>-` | shipped `⌃⇧=` (open) |
| new / close tab | `c` / `x` | prefix | prefix | prefix | `<leader>te` / `<leader>tx` | shipped `⌘T` / `⌘W` |
| jump to slot | `1–9` | prefix | prefix; native `Cmd-1..9` | prefix | `<leader>t1..9` | shipped `⌘1–8` |
| zoom | `z` | prefix | prefix | prefix | `<leader>z` (toggle) | — (no such verb) |
| resize / equalize | `r` / `=` | prefix r | prefix r / `=` | `=` kept | `Ctrl-w =` native | — |
| hop siblings | `[ ]` | — | prefix (prompts) | — | `]t [t` (tabs) | `⇧⌘[/]` (tabs) |
| find / help | `/` `?` | prefix | prefix | prefix | native | shipped `⌘F` / menu |
| rename | `shift+t/p` | ✓ | ✓ | — | — | menu only |
| palette | `:` / `;` | — | prefix `;`, native `⇧⌘P` | — | — | custom `⇧⌘P` (was `⌘L`; one chord per command, `⌃F5` alternate also gone) |

\* rex's two direct binds mirror Ardia's *custom* chords: `nextTab`/`previousTab`
are rebound to `⇧⌘J/K` (their defaults `⇧⌘J/K` = Downloads / Close All
Tabs were unbound to menu-only). One chord per command in Ardia's schema,
so the rebound replaces its shipped `⇧⌘[/]` + alternates — accepted cost
for one chord / one verb in both native apps.

## Law 3 — Defaults are law

An app's own defaults are never stolen; the spine only (a) fills genuine
gaps and (b) adds aliases. Consequences, all deliberate:

- **herdr: zero config.** Its untouched defaults *are* the dictionary —
  the ideal state, and the reason the rex-beta fallback costs nothing.
- **Ardia: 7 custom entries.** `nextTab`/`previousTab` → `⇧⌘J/K`;
  `downloads`/`closeAllTabs` → unbound (menu-only); `toggleSidebar` → `⌘B`
  (Zed parity, spine letter `b`; replaces shipped `⌘S`/`⇧⌘L`/`⇧⌘F`);
  `focusCommandBar` → `⇧⌘P` (one palette chord with rex; replaces `⌘L`/`⌃F5`);
  `keyboardShortcuts` → `⇧⌘/` (`⌘?`, Help convention; had no chord).
  Everything else default. `⇧⌘B` stays untouched (bookmarks-bar toggle).
  Verified 2026-11-10 from `config.schema.json`; `ardia config check` clean.
- **Never-steal list** (verified): `Cmd-L/K/T/W/D/F/R/1-9` in browsers,
  `Cmd-;` (system spelling in text fields), `⇧⌘J/K/B/V` in Ardia,
  `Cmd-K/D` in rex. `⇧⌘J/K` are now *ours* in Ardia (rebound); `⇧⌘B/V`
  and `Cmd-;` stay untouched. Revisit only if an app reshuffles defaults.
- **Sidebar is one letter (`b`), native entrance per app**: TUI `prefix b`,
  nvim `<leader>b`, Zed + Ardia bare `⌘B`, rex `Cmd-/` (its `Cmd-b` slot is
  the alias leader, so bare `⌘B` is impossible there).

## Global layer — app jumps (above every app)

`⇧⌘1/2/3` jump to the three most-used apps from anywhere. Owned by
Apple Shortcuts, not by any app config: shortcut files can't carry their
global hotkey, so each chord is assigned by hand in the Shortcuts app
and can't be version-controlled. `⇧⌘4` stays free on purpose (see below).

| Chord | App | Shortcut name |
|---|---|---|
| `⇧⌘1` | Ardia | Focus Ardia |
| `⇧⌘2` | Rex Beta | Focus Rex |
| `⇧⌘3` | System Settings | Focus Settings |

Rules for this layer: a global chord must be free in *every* app's
default set (Law 3 applied machine-wide). Numbers were free except one
collision: **`⇧⌘3` ships as fullscreen-screenshot** (and `⇧⌘4` as
selection-screenshot), so taking `⇧⌘3` means turning off or rebinding
that screenshot chord in System Settings → Keyboard → Keyboard
Shortcuts → Screenshots. `⇧⌘4` is left unmapped so screenshots keep one
native chord; claim it only if selection-screenshots get rebound too.

## Cross-app notes

- **Double-prefix sends a literal through** (rex: `ctrl+b>ctrl+b`; tmux:
  double `Ctrl-Space`): hoocode's emacs `Ctrl-b/f` prompt editing costs one
  extra keystroke, never a dead key. (Herdr: verify once — press
  `Ctrl-b Ctrl-b` in a hoocode prompt; cursor should move left.)
- **Cheat sheets, one per tool**: `tkeys` (tmux) · `hdkeys` (herdr TUI) ·
  `rkeys` (rex) · `akeys` (ardia). Same table shape everywhere.
- **Ardia verification basis**: `ardia config init` writes the schema;
  `ardia config list` shows every default; the in-app `keyboardShortcuts`
  page is authoritative. The table above reflects the 2026-11-10 schema.
