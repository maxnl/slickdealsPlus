const { visit, cache, NET, WORLD, S } = require("./lifecycle.js");
const B = "https://slickdeals.net/click?";
// a link whose answer disagrees AND whose retry also disagrees -> never cached
const href = B+"trd=mystery&sdtid=19999999&lno=1";
const u = new URL(href);
WORLD[S.getUrlId(u)] = "https://www.some-network.com/x";
const uf = new URL(href); uf.searchParams.set("lno", S.getCacheKey(u).replace(/\D/g,"")||"0");
WORLD[S.getUrlId(uf)] = "https://www.still-not-it.com/y";
(async () => {
  console.log("a link that stays unresolvable (stated host never reached):");
  for (let n = 1; n <= 3; n++) {
    const before = NET.calls.length;
    const r = await visit(href, "mystery-shop.com");
    console.log("  load " + n + ": " + (NET.calls.length - before) + " requests  " + r.outcome + "  cached=" + cache.size);
  }
  // is the retry id stable? (does it hit the same entry on Vano's side each time)
  const ids = new Set();
  for (let n = 0; n < 5; n++) { const v = new URL(href); v.searchParams.set("lno", S.getCacheKey(new URL(href)).replace(/\D/g,"")||"0"); ids.add(S.getUrlId(v)); }
  console.log("\n  distinct retry ids generated over 5 loads: " + ids.size + "  -> " + [...ids][0]);

  // a link the service answers with "no destination" - the freetaxusa case.
  // Structurally unresolvable, so it must not ask again on every load.
  const href2 = B + "trd=freetaxusa&sdtid=19049776&lno=14&u3=ENC";
  const u2 = new URL(href2);
  WORLD[S.getUrlId(u2)] = "";                       // service answers, but empty
  const uf2 = new URL(href2);
  uf2.searchParams.set("lno", S.getCacheKey(u2).replace(/\D/g, "") || "0");
  WORLD[S.getUrlId(uf2)] = "";
  console.log("\na link the service has no destination for:");
  for (let n = 1; n <= 3; n++) {
    const before = NET.calls.length;
    const r = await visit(href2, "freetaxusa.com");
    console.log("  load " + n + ": " + (NET.calls.length - before) + " requests  " + r.outcome);
  }
})();
