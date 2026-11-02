# The only zsh file that has to live in $HOME — zsh reads this path directly.
# Everything else lives under ~/.config/zsh.
export ZDOTDIR="$HOME/.config/zsh"

# XDG base directories, so new tools default to ~/.config and ~/.local
# instead of scattering dotfiles across $HOME.
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
export XDG_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
export XDG_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}"

# Where bun keeps global installs. Without this bun prefers ~/.bun whenever that
# directory exists and ~/.local/share/bun otherwise, and this machine has both.
# The two then disagree, and the failure is silent: `bun add -g` writes to one
# tree while the `hoobot` on PATH comes from the other, so an upgrade reports
# success and the running bot is still the old version.
#
# This must match the BUN_INSTALL in the hoobot supervisor's launchd plist, or
# the terminal and the supervisor will drift apart again. ~/.local/share/bun is
# the one the bots actually run from, so that is the one we point at here.
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.local/share/bun}"

. "$HOME/.cargo/env"
