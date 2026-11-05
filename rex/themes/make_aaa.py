#!/usr/bin/env python3
"""make_aaa.py — build WCAG AAA (7:1) versions of Catppuccin Latte / Mocha for Rex.

Reads Ghostty's Catppuccin theme files, then nudges each colour's OKLCH
lightness (hue kept, chroma trimmed only if it leaves sRGB) until it reaches
7:1 against the colour it is drawn on. Writes Ghostty-format theme files that
Rex imports with:  rex do client.theme.import path=<file>

Roles checked:
  foreground on background
  ANSI 1-15 on background (8 = "bright black": comments, zsh autosuggestions)
  ANSI 0 is a background role: foreground is checked ON it instead
  cursor-text on cursor, selection-foreground on selection-background

Usage: make_aaa.py [--audit]   (--audit only prints, writes nothing)
"""
import math, os, sys

SRC = "/Applications/Ghostty.app/Contents/Resources/ghostty/themes"
OUT = os.path.dirname(os.path.abspath(__file__))
TARGET = 7.0
MARGIN = 7.1  # aim a hair above 7 so rounding to hex never dips under


# ── colour maths ───────────────────────────────────────────────
def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

def rgb2hex(c):
    return "#" + "".join(f"{round(max(0, min(1, v)) * 255):02x}" for v in c)

def lin(v):
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4

def delin(v):
    return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055

def lum(h):
    r, g, b = (lin(v) for v in hex2rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

def to_oklch(h):
    r, g, b = (lin(v) for v in hex2rgb(h))
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = (math.copysign(abs(x) ** (1 / 3), x) for x in (l, m, s))
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, math.hypot(A, B), math.atan2(B, A)

def from_oklch(L, C, H):
    A, B = C * math.cos(H), C * math.sin(H)
    l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
    m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
    s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3
    r = 4.0767416621 * l - 3.3077618134 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return r, g, b

def oklch_hex(L, C, H):
    # trim chroma until the colour fits in sRGB (keeps hue + lightness)
    for _ in range(40):
        rgb = from_oklch(L, C, H)
        if all(-1e-4 <= v <= 1 + 1e-4 for v in rgb):
            return rgb2hex([delin(max(0, min(1, v))) for v in rgb])
        C *= 0.95
    return rgb2hex([delin(max(0, min(1, v))) for v in from_oklch(L, 0, H)])

def fix(colour, against, lighter, goal=MARGIN):
    """Smallest lightness change that gives `colour` >= goal on `against`."""
    if ratio(colour, against) >= goal:
        return colour
    L, C, H = to_oklch(colour)
    lo, hi = (L, 1.0) if lighter else (0.0, L)
    for _ in range(40):
        mid = (lo + hi) / 2
        ok = ratio(oklch_hex(mid, C, H), against) >= goal
        if lighter:
            lo, hi = (lo, mid) if ok else (mid, hi)
        else:
            lo, hi = (mid, hi) if ok else (lo, mid)
    return oklch_hex(hi if lighter else lo, C, H)


# ── theme files ────────────────────────────────────────────────
def read(name):
    t = {}
    for line in open(os.path.join(SRC, name)):
        if "=" not in line:
            continue
        k, v = (s.strip() for s in line.split("=", 1))
        if k == "palette":
            i, c = v.split("=")
            t[int(i)] = c.strip()
        else:
            t[k] = v
    return t

def pairs(t):
    """(label, text colour key, background colour key)"""
    out = [("foreground on background", "foreground", "background")]
    out += [(f"ANSI {i:<2} on background", i, "background") for i in range(1, 16)]
    out += [("foreground on ANSI 0", "foreground", 0),
            ("cursor-text on cursor", "cursor-text", "cursor-color"),
            ("selection text on selection", "selection-foreground", "selection-background")]
    return out

def audit(title, t):
    print(f"\n{title}")
    fails = 0
    for label, fg, bg in pairs(t):
        r = ratio(t[fg], t[bg])
        mark = "AAA" if r >= TARGET else ("AA " if r >= 4.5 else "FAIL")
        fails += r < TARGET
        print(f"  {label:<30} {t[fg]} on {t[bg]}  {r:5.2f}:1  {mark}")
    print(f"  -> {fails} below 7:1")
    return fails

def make_aaa(t, dark):
    n = dict(t)
    bg = n["background"]
    # text roles: move away from the background.
    # Hierarchy so AAA doesn't flatten everything to the same 7:1 tone:
    #   foreground >= 10:1, so dim text (ANSI 8, 7, 15) still reads as dimmer
    #   brights 9-14 >= 9:1, so they stay distinct from normals 1-6
    # (Mocha already clears these; the goals only bite on Latte.)
    n["foreground"] = fix(n["foreground"], bg, lighter=dark, goal=10.0)
    for i in range(1, 16):
        goal = 9.0 if 9 <= i <= 14 else MARGIN
        n[i] = fix(n[i], bg, lighter=dark, goal=goal)
    # ANSI 0 is a background role: push it toward the background until
    # the foreground reads on it, rather than making it text-bright.
    n[0] = fix(n[0], n["foreground"], lighter=not dark)
    # Cursor and selection: keep the accent fill, recolour the text on it.
    for txt, fill in (("cursor-text", "cursor-color"),
                      ("selection-foreground", "selection-background")):
        cand = [fix(n[txt], n[fill], lighter=False),
                fix(n[txt], n[fill], lighter=True)]
        best = max(cand, key=lambda c: ratio(c, n[fill]))
        if ratio(best, n[fill]) < TARGET:
            # fill too mid-tone for any text: lighten (light theme) or
            # darken (dark theme) the fill, keep its hue, use theme text.
            n[txt] = n["foreground"] if not dark else n["background"]
            n[fill] = fix(n[fill], n[txt], lighter=not dark)
        else:
            n[txt] = best
    return n

def write(name, t, note):
    path = os.path.join(OUT, name)
    with open(path, "w") as f:
        f.write(f"# {name} — {note}\n# Generated by make_aaa.py; every text pair is >= 7:1 (WCAG AAA).\n")
        for i in range(16):
            f.write(f"palette = {i}={t[i]}\n")
        for k in ("background", "foreground", "cursor-color", "cursor-text",
                  "selection-background", "selection-foreground"):
            f.write(f"{k} = {t[k]}\n")
    return path


if __name__ == "__main__":
    only_audit = "--audit" in sys.argv
    for src, dark, out, note in (
        ("Catppuccin Mocha", True, "Catppuccin Mocha AAA", "night / dark mode"),
        ("Catppuccin Latte", False, "Catppuccin Latte AAA", "day / light mode"),
    ):
        t = read(src)
        audit(f"BEFORE  {src}", t)
        if only_audit:
            continue
        n = make_aaa(t, dark)
        changed = [k for k in t if t[k] != n[k]]
        print("  changed: " + ", ".join(f"{k}: {t[k]}->{n[k]}" for k in changed))
        audit(f"AFTER   {out}", n)
        print("  wrote", write(out, n, note))
