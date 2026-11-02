#!/usr/bin/env python3
"""Compile an Intelligent UI app fragment into one self-contained, artifact-ready HTML file, then lint it.

Usage:
  build.py FRAGMENT.html -o OUT.html [--data PLAN.md] [--title "Lisbon Day"] [--preview] [--check-only]

DATA (default: FRAGMENT with a .md suffix, when that file exists) is the app's content as
Markdown. It is embedded verbatim as <script type="text/markdown" id="iui-data">, read with
IUI.md.read() / IUI.mdState(). Edit the .md and rebuild, or swap it inside a built page with
scripts/md.py, to change what the app shows without touching the design.

With data, the page also carries its own template (<script type="application/json" id="iui-src">,
about the size of the page again) so the Plan file sheet's Apply can republish the page for
everyone through the artifact capability (publish with capabilities {artifact: {}}).
--no-self-save leaves it out.

FRAGMENT holds only the app: an optional <style> (set --tint-l/--tint-d there), the
<div class="app"> markup, sheets (<dialog class="sheet">), and one trailing <script>.
The kit (assets/iui.css + assets/iui.js) is inlined ahead of it.

OUT.html follows the Artifact page contract: no doctype/html/head/body (the viewer adds a
skeleton with charset, viewport-fit=cover, safe-area padding and [hidden] reset). With
--preview, OUT.preview.html is also written, wrapped in an equivalent skeleton so it can
be opened locally or fed to scripts/audit.mjs.

Exit code 1 if lint finds errors (warnings don't fail the build).
"""
import argparse
import html
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
ALLOWED_SCRIPT_HOSTS = ("https://cdnjs.cloudflare.com/", "https://cdn.jsdelivr.net/npm/", "https://unpkg.com/")
MAX_BYTES = 4_000_000

SKELETON = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px system-ui,-apple-system,sans-serif;background:#fafaf8}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head>
<body>
{page}
</body>
</html>
"""

EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐⬆↔-⇿]")


MD_MARK, SRC_MARK = "@@IUI_MD@@", "@@IUI_SRC@@"


def encode_template(tpl: str) -> str:
    """The page template as JSON that is safe inside a <script>: no "<" (so no "</script"), ASCII only."""
    return json.dumps(tpl).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def embed_md(md: str) -> str:
    """Markdown as the text of a <script> element: only "</script" needs escaping."""
    md = md if md.endswith("\n") else md + "\n"
    return re.sub(r"</(script)", r"<\\/\1", md, flags=re.I)


def strip_scripts(s: str) -> str:
    return re.sub(r"<script\b.*?</script>", "", s, flags=re.S | re.I)


def lint(body: str, page: str) -> tuple[list[str], list[str]]:
    errors, warnings = [], []
    markup = strip_scripts(body)
    scripts = "\n".join(re.findall(r"<script\b[^>]*>(.*?)</script>", body, flags=re.S | re.I))

    if not re.search(r'class="[^"]*\bapp\b', body):
        errors.append('no <div class="app"> root: the app shell and column layout will not apply')
    if not re.search(r'class="[^"]*\b(screen|large-title)\b', body):
        warnings.append("no .screen / .large-title: it will read as a page, not an app")
    if re.search(r"<!doctype|<html\b|<head\b|<body\b", body, re.I):
        errors.append("fragment contains doctype/html/head/body; the artifact viewer adds its own skeleton")

    for src in re.findall(r'<script[^>]+src="([^"]+)"', body):
        if not src.startswith(ALLOWED_SCRIPT_HOSTS):
            errors.append(f"script from a host the artifact CSP blocks: {src}")
        elif not re.search(r"[@/]\d+\.\d+\.\d+", src):
            errors.append(f"script URL must pin an exact version: {src}")
    for href in re.findall(r'<link[^>]+href="(https?://[^"]+)"', body):
        if not href.startswith("https://fonts.googleapis.com/"):
            errors.append(f"external stylesheet the artifact CSP blocks: {href}")
    if re.search(r"<(img|video|audio|source|iframe)\b[^>]+src=\"https?://", markup):
        errors.append("external media/iframes are blocked in artifacts; embed data: URIs or draw it")

    if re.search(r"\bfetch\(|XMLHttpRequest|WebSocket\(|navigator\.sendBeacon", scripts):
        errors.append("network calls: embed the data in the page instead")
    if re.search(r"(?<![\w.])(alert|confirm|prompt)\(", scripts):
        errors.append("alert()/confirm()/prompt() do nothing in artifacts; use IUI.confirm() / IUI.toast()")
    if re.search(r"window\.print\(|\bprint\(\)", scripts):
        errors.append("window.print() is blocked in artifacts")
    if re.search(r"\beval\(|new Function\(", scripts):
        errors.append("eval/new Function may be blocked by the artifact CSP")
    if re.search(r"<form\b[^>]*\baction=", markup):
        errors.append("forms must not post anywhere; handle submit in script with preventDefault()")
    if re.search(r"\blocalStorage\.|sessionStorage\.", scripts):
        warnings.append("raw localStorage; use IUI.state(key, …) or IUI.store(key, …) (try/catch-safe)")
    if re.search(r"\.innerHTML\s*[+]?=\s*`[^`]*\$\{", scripts):
        warnings.append("template literal into innerHTML: use IUI.render/IUI.morph with IUI.html`…` so values are escaped")
    if re.search(r"\bon(click|input|change|submit)=", markup):
        warnings.append("inline on* handlers; use IUI.on(type, selector, fn) delegation")

    ui_text = re.findall(r"<(?:button|a)\b[^>]*>(.*?)</(?:button|a)>", markup, flags=re.S)
    if any(EMOJI.search(re.sub(r"<[^>]+>", "", t)) for t in ui_text) or re.search(r"(IUI\.html`[^`]*<(button|a)\b[^`]*" + EMOJI.pattern + ")", scripts):
        warnings.append("emoji inside buttons/links; use IUI.icon(name) or <svg class=\"i\"><use href=\"#i-name\"/></svg>")
    for m in re.finditer(r'<(button|a)\b([^>]*)>\s*(<svg\b(?:(?!</(?:button|a)>).)*?</svg>|\$\{(?:IUI\.)?icon\([^)]*\)\})\s*</\1>', body, flags=re.S):
        if "aria-label" not in m.group(2):
            warnings.append("icon-only button/link without aria-label")
            break
    if re.search(r"<input\b(?![^>]*\b(id|aria-label)=)[^>]*>", markup) and not re.search(r"<label\b", markup):
        warnings.append("inputs without labels")
    if re.search(r"\b100vh\b", body):
        warnings.append("100vh overflows inside the artifact frame on phones; use 100dvh or height:100% on html/body")
    if re.search(r"position:\s*fixed", markup) and "safe-area-inset" not in body:
        warnings.append("a fixed element without env(safe-area-inset-*) padding")
    style_blocks = "\n".join(re.findall(r"<style\b[^>]*>(.*?)</style>", body, flags=re.S | re.I))
    lit = [c for c in re.findall(r"#[0-9a-fA-F]{6}\b", re.sub(r"--tint-[ld]\s*:\s*#[0-9a-fA-F]{6}", "", style_blocks))]
    if lit:
        warnings.append(f"{len(lit)} literal hex colors in <style>; use tokens (var(--…)) so both themes work")
    if re.search(r"<img\b(?![^>]*\balt=)", markup):
        errors.append("<img> without alt text")
    if len(page.encode()) > MAX_BYTES:
        errors.append(f"page is {len(page.encode())} bytes (> {MAX_BYTES})")
    return errors, warnings


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("fragment")
    ap.add_argument("-o", "--out")
    ap.add_argument("--data", help="Markdown file to embed as the app's data (default: FRAGMENT.md if present)")
    ap.add_argument("--no-self-save", action="store_true", help="don't embed the page template used by Apply to save for everyone")
    ap.add_argument("--title")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--check-only", action="store_true")
    a = ap.parse_args()

    body = pathlib.Path(a.fragment).read_text()
    title = a.title
    m = re.search(r"<title>(.*?)</title>", body, re.S)
    if m:
        body = body.replace(m.group(0), "", 1)
        title = title or m.group(1).strip()
    if not title:
        m = re.search(r'class="large-title"[^>]*>(.*?)<', body, re.S) or re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
        title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else "Answer"
    data_path = pathlib.Path(a.data) if a.data else pathlib.Path(a.fragment).with_suffix(".md")
    head = (
        f"<title>{html.escape(title)}</title>\n"
        f"<style>\n{(ASSETS / 'iui.css').read_text()}\n</style>\n"
        f"<script>\n{(ASSETS / 'iui.js').read_text()}\n</script>\n"
    )
    tail = f"{body.strip()}\n"
    if a.data or data_path.exists():
        md = data_path.read_text()
        if "IUI.md" not in body and "IUI.mdState" not in body:
            print("warning: data embedded but the app never reads it (IUI.mdState / IUI.md.read)", file=sys.stderr)
        tpl = head + f'<script type="text/markdown" id="iui-data">\n{MD_MARK}</script>\n'
        if not a.no_self_save:
            tpl += f'<script type="application/json" id="iui-src">{SRC_MARK}</script>\n'
        tpl += tail
        if tpl.count(MD_MARK) != 1 or tpl.count(SRC_MARK) > 1:
            print("error: the page itself contains the template markers @@IUI_MD@@ / @@IUI_SRC@@", file=sys.stderr)
            return 1
        page = tpl.replace(SRC_MARK, encode_template(tpl), 1).replace(MD_MARK, embed_md(md), 1)
    elif "IUI.mdState" in body or "IUI.md.read" in body:
        print(f"error: the app reads Markdown data but {data_path} does not exist (pass --data)", file=sys.stderr)
        return 1
    else:
        page = head + tail
    errors, warnings = lint(body, page)
    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    for e in errors:
        print(f"error: {e}", file=sys.stderr)
    if errors:
        return 1
    if not a.check_only:
        out = pathlib.Path(a.out or pathlib.Path(a.fragment).with_suffix(".page.html"))
        out.write_text(page)
        msg = f"ok: {out} ({len(page.encode()) // 1024} KB, {len(warnings)} warnings)"
        if a.preview:
            prev = out.with_suffix(".preview.html")
            prev.write_text(SKELETON.format(page=page))
            msg += f"; preview: {prev}"
        print(msg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
