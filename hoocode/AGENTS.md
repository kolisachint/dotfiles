# Global environment notes

Machine: macOS, terminal is **Ghostty**, shell is **zsh + oh-my-zsh + powerlevel10k**.
The user has low vision — favor readable output: short lines, clear headings,
no dense walls of text, and never rely on color alone to carry meaning.

## Config layout — XDG, nothing loose in `$HOME`

The user does not want stray dotfiles at the root of `~`. Everything lives in
`~/.config`, `~/.cache` or `~/.local`. **Put any new config in `~/.config/<tool>/`**;
if a tool insists on `$HOME`, check for an env var that redirects it first.

| Piece | Location |
|---|---|
| zsh entrypoint (**the one mandatory root file**) | `~/.zshenv` — only sets `ZDOTDIR` + XDG vars |
| zsh config | `~/.config/zsh/.zshrc` |
| p10k prompt config | `~/.config/zsh/.p10k.zsh` (lean style) |
| oh-my-zsh | `~/.config/zsh/oh-my-zsh` |
| powerlevel10k | `~/.config/zsh/oh-my-zsh/custom/themes/powerlevel10k` |
| machine-local zsh overrides | `~/.config/zsh/.zshrc.local` (sourced last if present) |
| old config backups | `~/.config/zsh/backups/` |
| Ghostty config | `~/.config/ghostty/config` (Ghostty reads XDG natively on macOS) |
| shell history | `~/.local/state/zsh/history` |
| omz cache + zcompdump | `~/.cache/oh-my-zsh/` |
| hoocode settings | `~/.hoocode/settings.json` |
| tmux / nvim / herdr | `~/.config/tmux/`, `~/.config/nvim/`, `~/.config/herdr/config.toml` |
| **dotfiles repo** (source of truth, private) | `~/github/dotfiles` — files are symlinked out by `install.sh`. Edit there; never add secrets. |

Helper aliases: `zrc`, `p10krc`, `ghrc` open those files; `dotfiles` cds to
`~/github/dotfiles`; `reload` re-execs the shell.

Theme is **Catppuccin Latte (light) / Mocha (dark)**, following macOS
appearance, in Ghostty, tmux, Neovim and Herdr. hoocode's theme is `auto`.
Font is **JetBrainsMono Nerd Font Mono** at 16pt. Any new UI/theme work must
work in both flavours and keep text at WCAG 4.5:1 or better.

## Kitty keyboard protocol

Ghostty negotiates it automatically, so `Alt+<key>` chords reach hoocode.
`macos-option-as-alt = true` and `keybind = alt+backspace=text:\x1b\x7f` are set
in the Ghostty config. If `Alt` shortcuts ever stop working, check that file
first — do not reach for `~/.hoocode/keybindings.json` unless a rebind is
actually wanted.

## Tool availability

- **git**: `/opt/homebrew/bin/git` (latest, first on PATH). `/usr/bin/git` is
  Apple's stub — ignore it.
- **Homebrew** is installed at `/opt/homebrew` (also provides `gh`).
- **Node** v24 via nvm (`~/.config/nvm`), with `npm`; **Bun** at
  `~/.local/share/bun/bin` (global installs: `bun add -g`).
- `python3` at `/usr/local/bin`. `uv` / `uvx` in `~/.local/bin`. No `pipx`.
- **No docker.** `/usr/local/bin/docker*` are dangling symlinks from an
  uninstalled Docker.app — ignore them.
- Prefer `curl | sh`, `git clone` or `bun` for new tools; use `brew` only when
  that is the simplest route.

## Preferences

- Never commit or push unless asked.
- `hoo` is an alias for `hoocode`. `hc` is **Herdr's** CLI
  (`~/.local/bin/hc -> herdr-core`), not hoocode.
