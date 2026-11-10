#!/usr/bin/env bash
# install.sh — link the files in this repo to where each tool reads them.
#
#   ./install.sh           show what would change (changes nothing)
#   ./install.sh --apply   make the links; existing files are moved to a backup
#   ./install.sh --check   report links that an app replaced with a plain file
#
# Backups go to ~/.local/state/dotfiles-backup/<date-time>/, same layout as $HOME.
# Works with macOS's bash 3.2.
# shellcheck disable=SC2088  # "~/..." is only display text here
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles-backup/$STAMP"
MODE="${1:-plan}"

# repo path                          → target (relative to $HOME)
LINKS="
zsh/.zshenv                          .zshenv
zsh/.zshrc                           .config/zsh/.zshrc
zsh/.zprofile                        .config/zsh/.zprofile
zsh/.p10k.zsh                        .config/zsh/.p10k.zsh
ghostty/config                       .config/ghostty/config
tmux/tmux.conf                       .config/tmux/tmux.conf
tmux/cheatsheet.txt                  .config/tmux/cheatsheet.txt
tmux/themes                          .config/tmux/themes
tmux/scripts                         .config/tmux/scripts
nvim/init.lua                        .config/nvim/init.lua
nvim/lua                             .config/nvim/lua
nvim/lazy-lock.json                  .config/nvim/lazy-lock.json
rex                                .config/rex
herdr/config.toml                    .config/herdr/config.toml
herdr-app/settings.json              .config/herdr-app/settings.json
herdr-app/layouts                    .config/herdr-app/layouts
hoocode/hoo-config.json              .hoocode/hoo-config.json
hoocode/hoocode-watch                .config/hoocode/hoocode-watch
git/config                           .config/git/config
git/ignore                           .config/git/ignore
bin/work                             .local/bin/work
bin/agentdiff                        .local/bin/agentdiff
claude/settings.json                 .claude/settings.json
claude/skills/impeccable             .claude/skills/impeccable
claude/skills/intelligent-ui         .claude/skills/intelligent-ui
claude/skills/ui-ux-pro-max          .claude/skills/ui-ux-pro-max
codex/config.toml                    .codex/config.toml
codex/hooks.json                     .codex/hooks.json
zed/settings.json                    .config/zed/settings.json
zed/keymap.json                      .config/zed/keymap.json
zed/tasks.json                      .config/zed/tasks.json
ardia/config.json                 .config/ardia/config.json
cheatsheets                          .config/cheatsheets
"

# Third-party code: cloned, never copied into this repo
CLONES="
https://github.com/ohmyzsh/ohmyzsh.git                .config/zsh/oh-my-zsh
https://github.com/romkatv/powerlevel10k.git           .config/zsh/oh-my-zsh/custom/themes/powerlevel10k
https://github.com/zsh-users/zsh-autosuggestions      .config/zsh/oh-my-zsh/custom/plugins/zsh-autosuggestions
https://github.com/zsh-users/zsh-syntax-highlighting  .config/zsh/oh-my-zsh/custom/plugins/zsh-syntax-highlighting
https://github.com/tmux-plugins/tpm                   .config/tmux/plugins/tpm
"

ok=0; todo=0; drift=0
line() { printf '  %-8s %s\n' "$1" "$2"; }

link_one() {
  local src="$REPO/$1" dst="$HOME/$2"
  if [[ ! -e $src ]]; then line "MISSING" "$1 (not in repo)"; return; fi
  if [[ -L $dst && "$(readlink "$dst")" == "$src" ]]; then
    ok=$((ok + 1)); [[ $MODE == --check ]] || line "OK" "~/$2"
    return
  fi
  if [[ $MODE == --check ]]; then
    if [[ -e $dst ]]; then
      drift=$((drift + 1)); line "REPLACED" "~/$2 is a plain file now (app rewrote it)"
      line "" "  see changes:  diff '$src' '$dst'"
    else
      drift=$((drift + 1)); line "GONE" "~/$2"
    fi
    return
  fi
  todo=$((todo + 1))
  if [[ $MODE != --apply ]]; then
    if [[ -e $dst || -L $dst ]]; then line "LINK" "~/$2  (current one backed up first)"
    else line "LINK" "~/$2  (new)"; fi
    return
  fi
  if [[ -e $dst || -L $dst ]]; then
    mkdir -p "$BACKUP/$(dirname "$2")"
    mv "$dst" "$BACKUP/$2"
  fi
  mkdir -p "$(dirname "$dst")"
  ln -s "$src" "$dst"
  line "LINKED" "~/$2"
}

echo
case $MODE in
  plan)    echo "Dry run. Nothing changes. Run with --apply to do it." ;;
  --apply) echo "Linking. Backups (if any): $BACKUP" ;;
  --check) echo "Checking links." ;;
  *) echo "Usage: $0 [--apply | --check]"; exit 2 ;;
esac
echo

while read -r src dst; do
  [[ -z ${src:-} ]] && continue
  link_one "$src" "$dst"
done <<< "$LINKS"

if [[ $MODE == --check ]]; then
  echo
  echo "  $ok linked, $drift need attention."
  echo "  To fix a REPLACED file: copy the newer one into the repo, then --apply."
  exit $(( drift > 0 ))
fi

echo
echo "Third-party code (cloned if missing):"
while read -r url dst; do
  [[ -z ${url:-} ]] && continue
  if [[ -d $HOME/$dst ]]; then line "OK" "~/$dst"
  elif [[ $MODE == --apply ]]; then git clone --depth 1 -q "$url" "$HOME/$dst" && line "CLONED" "~/$dst"
  else line "CLONE" "~/$dst"; fi
done <<< "$CLONES"

# hoocode settings: real file holds an API key, so only seed it from the example
hs="$HOME/.hoocode/settings.json"
if [[ ! -e $hs ]]; then
  if [[ $MODE == --apply ]]; then
    cp "$REPO/hoocode/settings.example.json" "$hs"; chmod 600 "$hs"
    line "COPIED" "~/.hoocode/settings.json — now add your Tavily key to it"
  else line "COPY" "~/.hoocode/settings.json from settings.example.json"; fi
fi

# Turn on the secret-blocking commit hook for this repo
if [[ $MODE == --apply ]]; then
  git -C "$REPO" config core.hooksPath hooks
  chmod +x "$REPO/hooks/pre-commit" "$REPO/bin/"* "$REPO/tmux/scripts/"* 2>/dev/null || true
fi

echo
if [[ $MODE == --apply ]]; then
  echo "Done. Open a new terminal (or run: reload)."
  echo "Then: tmux prefix + I to install tmux plugins; nvim installs its own."
  echo "Optional: brew bundle --file='$REPO/Brewfile'"
else
  echo "$ok already linked, $todo to change."
fi
