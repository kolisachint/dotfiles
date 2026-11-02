#!/usr/bin/env bash
# hoocode-watch: live git diff in nvim, auto-resumes after 60s idle.
# Usage: watch.sh [repo-path]
set -u
REPO="${1:-$PWD}"
REPO="$(cd "$REPO" 2>/dev/null && pwd || echo "$PWD")"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HOOCODE_WATCH_REPO="$REPO"

echo "hoocode-watch live diff -> $REPO"
echo "nvim refreshes every 1s. :q interrupts. 60s idle auto-resumes."
sleep 1

while true; do
  clear
  nvim --clean -u "$HERE/live-diff.lua"
  code=$?
  echo
  echo "--- viewer exited (code $code). Interrupted. ---"
  echo "ENTER now = resume diff | wait 60s = auto-resume | q + ENTER = stop watcher"
  if read -t 60 -r ans; then
    case "$ans" in
      [qQ]*|exit|quit) echo "watcher stopped."; break ;;
      *) echo "resuming...";;
    esac
  else
    echo "auto-resuming after 60s idle..."
  fi
  sleep 1
done
