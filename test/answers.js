const { visit, cache, NET, WORLD, S } = require("./lifecycle.js");

const B = "https://slickdeals.net/click?";
const LINKS = [
  // deal-body variant links: pno + sdtid + lno  -> unique id per variant
  ["Amazon Khaki",  B+"trd=Khaki&pno=1311423&sdtid=19854408&lno=3", "amazon.com"],
  ["Amazon Black",  B+"trd=Black&pno=1311423&sdtid=19854408&lno=6", "amazon.com"],
  ["Get Deal btn",  B+"trd=Get%20Deal%20at%20Amazon&pno=1311423&sdtid=19854408", "amazon.com"],
  // post-content links: sdtid + lno, NO pno -> id collides across posts
  ["REI post link", B+"trd=sun%20protection&sdtid=19854408&lno=1&u3=ENC1", "rei.com"],
  ["Timex post 1",  B+"trd=Timex%20watch&sdtid=19856376&lno=1&u3=ENC2",    "timex.com"],
  ["Timex post 2",  B+"trd=summer%20sale&sdtid=19856376&lno=2&u3=ENC3",    "timex.com"],
];

// u3 on post links, none on deal-body links - that is the measured markup
// (post links 3 of 3 carry u3; deal-body links 0 of 12)
// what the service answers for each id it already holds
for (const [name, href] of LINKS.map(l => [l[0], l[1]])) {
  const u = new URL(href); const id = S.getUrlId(u);
  console.log(String(name).padEnd(15) + " id=" + id);
}
const id = href => S.getUrlId(new URL(href));
WORLD[id(LINKS[0][1])] = "https://www.amazon.com/dp/B0GTNMT45B?tag=x";   // Khaki, correct
WORLD[id(LINKS[1][1])] = "https://www.amazon.com/dp/B0GTNDJ3FZ?tag=x";   // Black, correct
WORLD[id(LINKS[2][1])] = "https://www.amazon.com/dp/B0H2CM94NK?tag=x";   // deal default, correct
// the collision: post links share "<sdtid>sdtid<lno>lno" with other threads' posts
WORLD[id(LINKS[3][1])] = "https://www.amazon.com/gp/product/B0GTNLL1H8"; // WRONG - collision
WORLD[id(LINKS[4][1])] = "https://www.flexoffers.com/links/?cid=a4&p=17";// intermediate hop
WORLD[id(LINKS[5][1])] = "https://www.flexoffers.com/links/?cid=b9&p=17";// intermediate hop
// what a FRESH id (one the service holds nothing for) resolves to on demand:
const freshId = (href) => { const u = new URL(href); const k = S.getCacheKey(u);
  u.searchParams.set("lno", k.replace(/\D/g,"")||"0"); return S.getUrlId(u); };
WORLD[freshId(LINKS[3][1])] = "https://www.rei.com/learn/expert-advice/sun-protection.html";
WORLD[freshId(LINKS[4][1])] = "https://timex.com/products/tw2y48200";
WORLD[freshId(LINKS[5][1])] = "https://timex.com/collections/summer-sale";

(async () => {
  for (let load = 1; load <= 3; load++) {
    console.log("\n===== page load " + load + " =====");
    const start = NET.calls.length;
    for (const [name, href, stated] of LINKS) {
      const r = await visit(href, stated);
      const req = typeof r === "object" ? r.requests : 0;
      const out = typeof r === "object" ? r.outcome : r;
      const dest = typeof r === "object" ? (r.dest || "-") : "-";
      console.log("  " + name.padEnd(15) + String(req) + " req  " + out.padEnd(26) + dest.slice(0, 52));
    }
    console.log("  ---- requests this load: " + (NET.calls.length - start) + " | local cache entries: " + cache.size);
  }
})();
