# ~/.config/zsh/.zprofile — login shells only (runs after /etc/zprofile).
#
# Apps launched from Finder/Dock (Herdr, editors) read the *login* shell's
# PATH, not .zshrc. /etc/zprofile's path_helper puts /usr/local/bin first,
# where an old git 2.15 lives, so Homebrew must be moved to the front here too.
typeset -U path
path=(/opt/homebrew/bin /opt/homebrew/sbin $HOME/.local/bin $path)
