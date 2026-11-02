#!/usr/bin/env bash
# hoocode-watch setup: live nvim git diff + reusable detached session "hoocode-watch".
# Usage: setup.sh [--panel] [repo-path]   (defaults: next-window mode, current dir)
#   (no flag)  wire NEXT tmux window to the viewer
#   --panel    use the side pane next to the active one (splits if only one pane)
set -u
MODE="window"
if [[ "${1:-}" == "--panel" || "${1:-}" == "-p" ]]; then MODE="panel"; shift; fi
REPO="$(cd "${1:-$PWD}" && pwd)"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WATCH="$HERE/watch.sh"
chmod +x "$WATCH" 2>/dev/null

if ! tmux info >/dev/null 2>&1; then
  echo "tmux server not running. Start tmux first."
  exit 1
fi

CUR="$(tmux display-message -p '#S')"
if [[ "$MODE" == "panel" ]]; then
  NPANES="$(tmux list-panes -t "$CUR" | wc -l | tr -d ' ')"
  if [[ "$NPANES" -ge 2 ]]; then
    # side pane next to the active one (idle prompt assumed)
    TARGET="$(tmux display-message -p -t "$CUR:.+" '#{pane_id}')"
  else
    TARGET="$(tmux split-window -h -t "$CUR" -c "$REPO" -l 35% -P -F '#{pane_id}')"
  fi
  tmux send-keys -t "$TARGET" "clear; bash '$WATCH' '$REPO'" Enter
  echo "live side panel: $TARGET"
else
  ACTIVE="$(tmux display-message -p '#{active_window_index}')"
  # next index after active, else create fresh
  NEXT=""
  IDS="$(tmux list-windows -t "$CUR" -F '#I')"
  CANDIDATE=$((ACTIVE + 1))
  if echo "$IDS" | grep -qx "$CANDIDATE"; then
    NEXT="$CANDIDATE"
  else
    NEXT="$(tmux new-window -t "$CUR" -c "$REPO" -n git-live-diff -P -F '#I')"
  fi
  tmux rename-window -t "$CUR:$NEXT" "git-live-diff"
  # launch watcher in that window (idle zsh prompt assumed; harmless if typed at prompt)
  tmux send-keys -t "$CUR:$NEXT" "clear; bash '$WATCH' '$REPO'" Enter
  echo "live window : $CUR:$NEXT (git-live-diff)"
fi

# reusable detached session for later: attach with  tmux attach -t hoocode-watch
if tmux has-session -t hoocode-watch 2>/dev/null; then
  echo "session hoocode-watch already exists."
else
  tmux new-session -d -s hoocode-watch -c "$REPO" -n diff "bash '$WATCH' '$REPO'"
  echo "created detached session hoocode-watch."
fi

echo "done:"
echo "  reuse       : tmux switch-client -t hoocode-watch"
echo "              : tmux attach -t hoocode-watch   (from outside tmux)"
echo "  rerun setup : bash '$HERE/setup.sh' [repo-path]"
