# Preferences & Decisions (long-term memory)

Living note of decisions agreed in agent sessions. Config files are the source
of truth for *what*; this file records *why* and what was decided.

## Final software list (2026-11-10)

| Layer | Tool | Notes |
|---|---|---|
| Terminal emulator | Ghostty | |
| Multiplexer (primary spine) | **herdr** | Rex beta is **closed source**, so herdr is the durable fallback/primary. Herdr keys are its own defaults (prefix Ctrl-b) — nothing to port. |
| Multiplexer (also tracked) | rex | `rex/` stays in dotfiles while usable; keys mirror herdr's default spine. |
| Multiplexer (classic) | tmux | Ctrl-Space primary, Ctrl-b backup. |
| Editor | Neovim | Space leader; Tab/S-Tab cycle tabs. |
| Editor (secondary) | Zed | |
| Browser | **Ardia** | New browsing app (replaces prior browser choice). CLI: `ardia` in `~/.local/bin`. Config folder `~/.config/ardia` (not created yet). Keys via `shortcuts.<command id>`, themes via `ardia theme`. |
| Agent | hoocode | |
| Agent configs | claude, codex | |
| Shell | zsh + oh-my-zsh + p10k | |
| Notes/key refs | cheatsheets (`tkeys`, `hdkeys`, …) | |

## Keybinding decisions (agreed 2026-11-10)

Three laws: (1) Pyramid — Session > Tab > Pane > View > Buffer; **nvim tabpages
are Views, the multiplexer owns tabs**. (2) One verb dictionary (hjkl move,
b sidebar, v/- split, c/x new/close, n/p next/prev, 1–9 jump, z zoom, r resize,
= equalize, [ ] hop, / find, ? help), each app projecting it through its native
entrance: prefix Ctrl-b (TUI), Space leader (nvim), Cmd-Shift (native GUI,
sparing). (3) Defaults are law — never steal an app's own chords; extend only
free layers.

Agreed changes (not yet implemented):
- rex: direct binds `cmd+shift+j/k` → tab next/previous (verified free; its
  native set already covers Cmd-T/W/1..9/D/K/F, Shift-Cmd-D/Enter/P, Cmd-/).
- nvim: aliases `<leader>b` (tree), `<leader>v`/`<leader>-` (splits),
  `<leader>z` (zoom toggle). Keep `<C-n>` tree binding as well.
- Ardia: **J/K swap (decided after schema probe).** `nextTab`/`previousTab`
  → `⇧⌘J/K`; `downloads`/`closeAllTabs` → unbound (menu-only). Ardia's
  schema allows one chord per command, so this replaces its shipped
  `⇧⌘[/]` + alternates — accepted: one chord, one verb, both native apps.
  rex mirrors with the same two direct chords (verified free).
- herdr/tmux/hoocode: zero changes. Verify herdr sends a literal Ctrl-b on
  double-prefix (emacs editing inside hoocode prompts).
- Sidebar chord diverges between natives on purpose: rex `Cmd-/`, Ardia its own
  default. Documented, not unified.

## Keybinding spine

- Prefix **Ctrl-b** everywhere (herdr defaults; rex mirrors it, plus **Cmd-b** alias leader; tmux keeps Ctrl-b as prefix2 beside Ctrl-Space).
- Letter meanings: v/`-` split, h j k l focus, tab cycle, z zoom, r resize mode, `=` balance, c new tab, n/p tabs, 1–9 goto, b sidebar, `/` find, `?` cheat sheet.

## Theme spine

- Catppuccin Latte (light) / Mocha (dark), auto-following macOS appearance across ghostty, tmux, nvim, herdr, rex.
- Kanagawa Dragon is an active trial across rex, nvim, hoocode (commit 2439fd1).
- Ardia to join the spine via `ardia theme` + `appearance = auto` (discussion pending).
