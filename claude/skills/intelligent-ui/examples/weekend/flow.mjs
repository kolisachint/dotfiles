import fs from "node:fs";
export default async function (t) {
  // Apply republishes the page: the regenerated document must equal what the artifact service serves today
  const built = fs.readFileSync("out/weekend.html", "utf8");
  const regen = await t.eval(() => IUI.md.page(IUI.md.read()));
  const skel = await t.eval(() => IUI.md.SKELETON);
  t.expect(regen === skel + "\n" + built + "\n</body></html>", "self-save regenerates the page byte for byte");
  const regen2 = await t.eval(() => { const h = IUI.md.page(IUI.md.read().replace("travellers: 2", "travellers: 3")); return h.includes("travellers: 3") && h.split("@@IUI_" + "MD@@").length === 2 && h.length; });
  t.expect(!!regen2, "self-save embeds new Markdown and keeps its own template");
  const rt = await t.eval(() => {
    const src = IUI.md.read(), a = IUI.md.stringify(IUI.md.parse(src)), b = IUI.md.stringify(IUI.md.parse(a));
    const d = IUI.md.parse(src);
    return { stable: a === b, secs: d.sections.map((s) => s.key).join(","), stops: IUI.md.items(d, "stops").length, pack: IUI.md.items(d, "packing").length, head: d.head.length, place: d.meta.place, same: a.trim() === src.trim() };
  });
  t.expect(rt.stable && rt.secs === "stops,stay,eat,ideas,vibe,packing" && rt.stops === 4 && rt.pack === 15 && rt.head === 1, "markdown parses and round-trips stably " + JSON.stringify(rt));
  t.expect((await t.count("#stops .row")) === 4, "trip shows 4 stops from the file");
  await t.tap("[data-seg=day] button[data-value=Sun]");
  t.expect((await t.count("#stops .row")) === 1, "day switcher filters to Sunday");
  await t.tap("[data-seg=day] button[data-value=All]");
  await t.swipe("#stops .row >> nth=1", -330);
  t.expect((await t.count("#stops .row")) === 3, "swipe deletes a stop");
  await t.tap(".toast button");
  t.expect((await t.count("#stops .row")) === 4, "undo restores it");
  await t.shot("trip");
  await t.tap(".tab[data-tab=eat]");
  await t.tap("[data-pick=stay] >> nth=1");
  t.expect((await t.count("[data-pick=stay][aria-pressed=true]")) === 1, "stay is single-pick");
  await t.shot("stay");
  await t.tap(".tab[data-tab=ideas]");
  await t.tap("[data-idea] >> nth=0");
  await t.shot("ideas");
  await t.tap(".tab[data-tab=trip]");
  t.expect((await t.count("#stops .row")) === 5, "idea card adds a stop");
  t.expect(await t.eval(() => document.querySelector("#trip [data-sheet=iui-md]").hasAttribute("data-dirty")), "plan file button shows unsaved-changes dot");
  await t.tap("#trip [data-sheet=iui-md]");
  const md = await t.eval(() => document.getElementById("iui-md-text").value);
  t.expect(md.includes("## Stops") && md.includes("idea: ") && md.includes("HOW TO CHANGE THIS PLAN") && md.includes("pick: yes"), "plan file shows live markdown incl. edits and AI instructions");
  await t.shot("md-sheet");
  await t.fill("#iui-md-text", md.replace("place: Lonavala, Maharashtra", "place: Test Town"));
  await t.tap("[data-md-apply]");
  await t.wait(500);
  t.expect((await t.text(".hero-t")) === "Test Town", "applying edited markdown updates the UI");
  await t.page.reload(); await t.wait(600);
  t.expect((await t.text(".hero-t")) === "Test Town" && (await t.count("#stops .row")) === 5, "edits persist across reload");
  await t.tap("#trip .bottom-bar [data-sheet=add]");
  await t.fill("#a-name", "Tiger Point");
  await t.fill("#a-at", "18.7215, 73.3945");
  await t.tap(".sheet-nav .strong");
  t.expect((await t.count("#stops .row")) === 6, "add sheet adds a stop with pasted coordinates");

  // Apply inside an artifact: mock the host's artifact capability
  await t.eval(() => { window.__pub = null; window.claude = { use: async (n) => (n === "artifact" ? { publish: async (html) => { window.__pub = html; return { version: "v-test" }; } } : null) }; });
  await t.tap("#trip [data-sheet=iui-md]");
  t.expect((await t.text(".md-status")).includes("not saved for everyone"), "sheet says local changes are not saved for everyone");
  const cur = await t.eval(() => document.getElementById("iui-md-text").value);
  await t.fill("#iui-md-text", cur.replace("travellers: 2", "travellers: 4"));
  await t.tap("[data-md-apply]");
  await t.wait(400);
  const pub = await t.eval(() => window.__pub);
  t.expect(!!pub && pub.startsWith("<!doctype html><html><head>") && pub.includes("travellers: 4") && pub.includes("Tiger Point") && pub.endsWith("</body></html>"), "Apply publishes the whole page with the edited Markdown");
  t.expect((await t.text(".toast")).includes("Saved for everyone"), "Apply reports saved for everyone");
  // read-only viewer
  await t.eval(() => { window.claude = { use: async (n) => (n === "artifact" ? { publish: async () => { throw { code: "not_writer", message: "x" }; } } : null) }; });
  await t.tap("#trip [data-sheet=iui-md]");
  const cur2 = await t.eval(() => document.getElementById("iui-md-text").value);
  await t.fill("#iui-md-text", cur2.replace("travellers: 4", "travellers: 5"));
  await t.tap("[data-md-apply]");
  await t.wait(400);
  t.expect((await t.text(".toast")).includes("view this page but not edit"), "read-only viewer gets a local apply and a clear message");
  t.expect((await t.text(".hero-k")) !== null, "page still works after a refused save");
}
