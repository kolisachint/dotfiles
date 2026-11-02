# ─────────────────────────────────────────────────────────────
#  zsh config — oh-my-zsh + powerlevel10k + hoocode
# ─────────────────────────────────────────────────────────────

# Powerlevel10k instant prompt. Must stay near the top of this file.
# Anything that prints to the console before this must go ABOVE this block.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Prefer Homebrew's current tools over older system or /usr/local binaries.
# path_helper appends /opt/homebrew/bin last, so move it (and sbin) to the front.
typeset -U path
path=(/opt/homebrew/bin /opt/homebrew/sbin $path)

# ~/.local/bin: work, agentdiff and other user tools. typeset -U keeps it once.
path=($HOME/.local/bin $path)

# ── oh-my-zsh ────────────────────────────────────────────────
export ZSH="$ZDOTDIR/oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"

# Keep oh-my-zsh's generated files out of $HOME.
ZSH_CACHE_DIR="$XDG_CACHE_HOME/oh-my-zsh"
ZSH_COMPDUMP="$ZSH_CACHE_DIR/zcompdump-${HOST%%.*}-${ZSH_VERSION}"
mkdir -p "$ZSH_CACHE_DIR/completions"

# Don't nag about updates mid-session; check every 13 days, quietly.
zstyle ':omz:update' mode reminder
zstyle ':omz:update' frequency 13

# Big-font terminals wrap a lot — keep completion lists tidy.
COMPLETION_WAITING_DOTS="true"
HIST_STAMPS="yyyy-mm-dd"

plugins=(
  git
  macos
  python
  colored-man-pages
  command-not-found
)

# Only load tool plugins for tools that are actually installed and runnable.
# A missing binary — or a dangling symlink from an uninstalled app — makes the
# plugin spew errors on every new shell.
for _tool in brew npm docker; do
  [[ -x ${commands[$_tool]:-} ]] && plugins+=($_tool)
done
unset _tool

# zsh-syntax-highlighting must be the last plugin loaded.
plugins+=(zsh-autosuggestions zsh-syntax-highlighting)

source "$ZSH/oh-my-zsh.sh"

# ── History ──────────────────────────────────────────────────
HISTFILE="$XDG_STATE_HOME/zsh/history"
HISTSIZE=100000
SAVEHIST=100000
mkdir -p "${HISTFILE:h}"
setopt HIST_IGNORE_ALL_DUPS HIST_REDUCE_BLANKS SHARE_HISTORY EXTENDED_HISTORY

# ── Readability tweaks for the eyes ──────────────────────────
# Autosuggestions: readable grey (>= 5.5:1) plus italic, so they differ from
# typed text by shape, not colour alone. Picked from macOS appearance at start.
if [[ $(defaults read -g AppleInterfaceStyle 2>/dev/null) == Dark ]]; then
  ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=#9399b2,italic'   # Mocha overlay2
else
  ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=#5c5f77,italic'   # Latte subtext1
fi
# Bump contrast of ls colors (BSD ls on macOS).
export CLICOLOR=1
export LSCOLORS=ExGxBxDxCxEgEdxbxgxcxd
# Pager that doesn't clear the screen, with readable search highlighting.
export LESS='-R -F -X -i -M'
export PAGER=less
export MANPAGER='less -R --use-color -Dd+r -Du+b'

# ── hoocode ──────────────────────────────────────────────────
case ":$PATH:" in
  *":$HOME/.hoocode/bin:"*) ;;
  *) export PATH="$HOME/.hoocode/bin:$PATH" ;;
esac
# `hoo` and `hoocode` both start hoocode. `hc` is Herdr's own CLI
# (~/.local/bin/hc -> herdr-core), so it is not aliased here.
alias hoo='hoocode'

# ── tmux ──────────────────────────────────────────────────────
# Config: ~/.config/tmux/tmux.conf. Inside tmux: Ctrl-Space ? lists keys.
# work [dir] → tmux session: 1 code (nvim|hoocode) · 2 shell · 3 agents (2×hoocode|agentdiff)
alias ta='~/.config/tmux/scripts/agents'   # agent session for this folder
alias tls='tmux ls'
alias tkeys='less ~/.config/tmux/cheatsheet.txt'
alias ad='agentdiff'                        # live diff pane
alias vd='nvim -c DiffviewOpen'   # side-by-side review of all changes

# ── bun ──────────────────────────────────────────────────────
# Installed under XDG data dir instead of ~/.bun.
export BUN_INSTALL="${XDG_DATA_HOME:-$HOME/.local/share}/bun"
case ":$PATH:" in
  *":$BUN_INSTALL/bin:"*) ;;
  *) export PATH="$BUN_INSTALL/bin:$PATH" ;;
esac
[[ -s "$BUN_INSTALL/_bun" ]] && source "$BUN_INSTALL/_bun"

# ── zig ───────────────────────────────────────────────────────
# Whole distribution kept together: the binary finds its lib/ beside it.
ZIG_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/zig/0.17.0"
case ":$PATH:" in
  *":$ZIG_HOME:"*) ;;
  *) export PATH="$ZIG_HOME:$PATH" ;;
esac

# ── hoobot ────────────────────────────────────────────────────
# The bot manager and every bot, in the background: start, stop, status,
# restart, logs. The script is called from the checkout so an edit to it is
# live at once; what actually runs is the launchd agent it installs, which
# holds caffeinate for as long as it is up.
HOOBOT_SUPERVISE="$HOME/github/hoobot/scripts/supervise.sh"
hoobot-supervise() {
  if [[ -f "$HOOBOT_SUPERVISE" ]]; then
    sh "$HOOBOT_SUPERVISE" "$@"
  else
    print -u2 "hoobot: no checkout at ${HOOBOT_SUPERVISE:h:h} — reinstall or edit HOOBOT_SUPERVISE in ~/.config/zsh/.zshrc"
  fi
}
alias hsv='hoobot-supervise'
_hoobot_supervise() {
  local -a actions; actions=(
    'start:start the manager and the named bots (or all)'
    'stop:stop the named bots (or all) and the agent'
    'restart:restart the manager and every supervised bot'
    'status:what is running and whether it is healthy'
    'logs:tail the supervisor log'
    'uninstall:stop everything and remove the launchd agent'
  )
  _describe -t actions 'supervise action' actions
}
compdef _hoobot_supervise hoobot-supervise

# ── Handy aliases ────────────────────────────────────────────
alias ll='ls -lAhF'
alias la='ls -A'
alias ..='cd ..'
alias ...='cd ../..'
alias zrc='${EDITOR:-nano} $ZDOTDIR/.zshrc'
alias p10krc='${EDITOR:-nano} $ZDOTDIR/.p10k.zsh'
alias ghrc='${EDITOR:-nano} $XDG_CONFIG_HOME/ghostty/config'
alias reload='exec zsh'
alias dotfiles='cd ~/github/dotfiles'

# ── Editor ───────────────────────────────────────────────────
export EDITOR=nvim
export VISUAL=nvim

# ── Powerlevel10k prompt config ──────────────────────────────
# Run `p10k configure` to regenerate it from scratch.
[[ ! -f "$ZDOTDIR/.p10k.zsh" ]] || source "$ZDOTDIR/.p10k.zsh"

# Machine-local overrides that shouldn't live in the tracked config.
[[ ! -f "$ZDOTDIR/.zshrc.local" ]] || source "$ZDOTDIR/.zshrc.local"

export NVM_DIR="$HOME/.config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
# (uv's ~/.local/bin/env line removed: ~/.local/bin is already on path above.)
