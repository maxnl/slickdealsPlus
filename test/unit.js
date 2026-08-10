const fs = require("fs");
const src = fs.readFileSync(require("path").join(__dirname, "..", "Slickdeals+.user.js"), "utf8");
const a = src.indexOf("const hostOf = value =>");
const b = src.indexOf("})();", src.indexOf("const isDestinationPlausible")) + 5;
const fn = new Function(src.slice(a, b) + "\nreturn isDestinationPlausible;")();
const el = host => ({ dataset: host === null ? {} : { productExitwebsite: host } });
const cases = [
	// [stated host, resolved url, expected, why]
	["rei.com",     "https://www.amazon.com/gp/product/B0GTNLL1H8/ref=x", false, "THE BUG: REI post link answered with the deal's amazon page"],
	["rei.com",     "https://www.rei.com/learn/expert-advice/sun-protection.html?ircl=1", true, "REI link, correct answer"],
	["amazon.com",  "https://www.amazon.com/gp/product/B0GTNMT45B?tag=slickdeals09-20", true, "Khaki colour variant"],
	["amazon.com",  "https://www.amazon.com/dp/B0DRW63X1Z?creative=9325", true, "deal image, /dp/ form"],
	["amazon.com",  "https://www.amazon.com:443/amazonprime?primeCampaignId=x", true, "explicit port"],
	["loaded.com",  "https://go.loaded.com/c/10451/1675318/18216?subid1=x", true, "affiliate hop on a subdomain"],
	["wayfair.com", "https://www.wayfair.com/wayfair-rewards?cjdata=x", true, "wayfair rewards"],
	["slickdeals.net", "https://slickdeals.net/forums/showpost.php?p=1&postcount=1", true, "internal link"],
	["timex.com",   "https://www.flexoffers.com/links/?cid=a4f742c7&p=170370", false, "intermediary -> not a match here; the retry handles it"],
	["timex.com",   "https://timex.com/products/x?cjdata=y", true, "what the retry brings back is accepted"],
	["rei.com",     "https://www.rei.com/learn/expert-advice/sun-protection.html", true, "rei retry result accepted"],
	["timex.com",   "https://www.timex.com/products/x", true, "direct merchant still passes"],
	["rei.com",     "https://www.amazon.com/gp/product/B0GTNLL1H8/ref=x", false, "THE COLLISION: must still be rejected"],
	["amazon.com",  "https://evil-amazon.com/dp/x", false, "lookalike still rejected"],
	[null,          "https://www.amazon.com/dp/B0DRW63X1Z", true, "no attribute -> pass through unchecked"],
	["amazon.com",  "not a url", false, "unparseable destination"],
	["amazon.com",  "https://evil-amazon.com/dp/x", false, "must not match a lookalike domain"],
	["amazon.com",  "https://amazon.com.attacker.net/x", false, "must not match a suffix-appended domain"],

	// 26.11.24 - prose in the attribute is not a destination claim
	["Amazon",              "https://www.amazon.com/dp/B0GTNMT45B", true,  "NEW: bare merchant name is not a claim -> unchecked"],
	["Get Deal at Amazon",  "https://www.amazon.com/dp/B0GTNMT45B", true,  "NEW: anchor-text prose is not a claim -> unchecked"],
	["Dark Gray",           "https://www.amazon.com/dp/B0GTNMT45B", true,  "NEW: the 26.11.13 value shape is not a claim"],
	["REI Co-op",           "https://www.amazon.com/dp/B0GTNMT45B", true,  "NEW: spaced name is not a claim"],
	["",                    "https://www.amazon.com/dp/B0GTNMT45B", true,  "empty stays unchecked as before"],
	["Amazon",              "not a url",                            false, "unparseable destination still rejected first"],
	// and the shape guard must not start waving real hosts through
	["shop.rei.com",        "https://www.amazon.com/dp/x",          false, "multi-label host is still a claim, still rejects"],
	["amazon.com",          "https://www.amazon.com/dp/x",          true,  "plain host still believed"],
	["AMAZON.COM",          "https://www.amazon.com/dp/x",          true,  "case-insensitive, still believed"],
	["https://amazon.com/", "https://www.amazon.com/dp/x",          true,  "url-shaped value still believed"],
	["xn--80ak6aa92e.com",  "https://www.amazon.com/dp/x",          false, "punycode host is a claim, still rejects"],
];
let pass = 0, fail = 0;
for (const [stated, url, expected, why] of cases) {
	const got = fn(el(stated), url);
	const ok = got === expected;
	ok ? pass++ : fail++;
	console.log((ok ? "  ok  " : "  FAIL") + "  " + String(stated).padEnd(15) + " -> " + String(got).padEnd(6) + why);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
