#!/usr/bin/env python3
"""Read or replace the Markdown embedded in a built Intelligent UI page, without rebuilding.

Usage:
  md.py extract PAGE.html [-o PLAN.md]     print (or write) the embedded Markdown
  md.py inject  PAGE.html PLAN.md          replace the embedded Markdown in place

The page keeps its design; only <script type="text/markdown" id="iui-data"> changes. Viewers
see the new content on next load (browser state is keyed by a hash of this Markdown).
"""
import argparse
import pathlib
import re
import sys

BLOCK = re.compile(r'(<script type="text/markdown" id="iui-data">\n)(.*?)(</script>)', re.S)


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    x = sub.add_parser("extract"); x.add_argument("page"); x.add_argument("-o", "--out")
    i = sub.add_parser("inject"); i.add_argument("page"); i.add_argument("md")
    a = ap.parse_args()
    page = pathlib.Path(a.page)
    text = page.read_text()
    m = BLOCK.search(text)
    if not m:
        print(f"error: {page} has no embedded Markdown (build it with --data)", file=sys.stderr)
        return 1
    if a.cmd == "extract":
        md = re.sub(r"<\\/script", "</script", m.group(2), flags=re.I)
        if a.out:
            pathlib.Path(a.out).write_text(md)
        else:
            sys.stdout.write(md)
        return 0
    md = pathlib.Path(a.md).read_text()
    md = md if md.endswith("\n") else md + "\n"
    md = re.sub(r"</(script)", r"<\\/\1", md, flags=re.I)
    page.write_text(text[: m.start(2)] + md + text[m.end(2):])
    prev = page.with_suffix(".preview.html")
    if prev.exists():
        p = prev.read_text(); pm = BLOCK.search(p)
        if pm:
            prev.write_text(p[: pm.start(2)] + md + p[pm.end(2):])
    print(f"ok: {page} now embeds {a.md} ({len(md.splitlines())} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
