#!/usr/bin/env bash
# swatch.sh — solid blocks of every terminal colour, for contrast checks.
# Each row: label, then a solid run of █ in that colour on the default background.
blk=$(printf '█%.0s' {1..40})
clear
printf '  %-8s \e[39m%s\e[0m\n' "fg" "$blk"
for i in $(seq 1 15); do
  printf '  %-8s \e[38;5;%dm%s\e[0m\n' "ansi$i" "$i" "$blk"
done
# default foreground drawn on ANSI 0 background
printf '  %-8s \e[40m\e[39m%s\e[0m\n' "fg/0" "$(printf '█%.0s' {1..20})$(printf ' %.0s' {1..20})"
printf '\n  Sample text:  \e[39mplain  \e[90mcomment(8)  \e[31mred  \e[32mgreen  \e[33myellow  \e[34mblue  \e[35mmagenta  \e[36mcyan\e[0m\n'
printf '                \e[91mbred  \e[92mbgreen  \e[93mbyellow  \e[94mbblue  \e[95mbmagenta  \e[96mbcyan  \e[37mwhite(7)  \e[97mbwhite(15)\e[0m\n'
# idle so the pane stays put for the screenshot
read -r -s _
