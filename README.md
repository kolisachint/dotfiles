# dotfiles

Sachin's Mac setup. **Private repo.** No secrets live here.

## What's inside

| Folder | Tool | Lives at |
|---|---|---|
| `zsh/` | zsh, oh-my-zsh, powerlevel10k | `~/.zshenv`, `~/.config/zsh/` |
| `ghostty/` | Ghostty terminal | `~/.config/ghostty/config` |
| `tmux/` | tmux (prefix Ctrl-Space) | `~/.config/tmux/` |
| `nvim/` | Neovim (lazy.nvim) | `~/.config/nvim/` |
| `herdr/`, `herdr-app/` | Herdr TUI + app | `~/.config/herdr*/` |
| `hoocode/` | hoocode agent rules, modes, live-diff | `~/.hoocode/`, `~/.config/hoocode/` |
| `git/` | git identity (noreply email) | `~/.config/git/` |
| `bin/` | `work`, `agentdiff` | `~/.local/bin/` |
| `claude/` | Claude Code settings + skills | `~/.claude/` |
| `codex/` | Codex config | `~/.codex/` |
| `zed/` | Zed editor | `~/.config/zed/` |
| `cheatsheets/` | key cheat sheets | `~/.config/cheatsheets/` |
| `Brewfile` | Homebrew packages | `brew bundle` |

## Use

```sh
./install.sh            # dry run: shows what would change
./install.sh --apply    # make the symlinks (old files are backed up)
./install.sh --check    # find links an app replaced with a plain file
```

Backups: `~/.local/state/dotfiles-backup/<date-time>/`.

Edit files **here** (or through the links: same file).
Some apps save by replacing the file, which breaks the link.
Run `--check` now and then. It lists those files and how to diff them.

## Secrets: never in this repo

- `.gitignore` is an **allow-list**. Only the folders above can be added.
- `hooks/pre-commit` blocks token-shaped text and private files
  (`auth.json`, `hosts.yml`, `*.sqlite`, `.zshrc.local`, `hoocode/settings.json`).
  It also runs `gitleaks` if installed (`brew install gitleaks`).
- hoocode: only `settings.example.json` is tracked. The real
  `~/.hoocode/settings.json` (with the Tavily key) stays local.
- Machine-only shell bits go in `~/.config/zsh/.zshrc.local` (not tracked).

## New Mac

```sh
git clone <this repo> ~/github/dotfiles
cd ~/github/dotfiles && ./install.sh --apply
brew bundle --file=Brewfile
```

Then in tmux press prefix + `I` to install plugins. Neovim installs its own.
