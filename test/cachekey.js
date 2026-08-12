/* getCacheKey() — what it must drop, and what it must keep.
 * The function is extracted from the shipped file; nothing here re-implements it. */
const fs = require("fs");
const SRC = require("path").join(__dirname, "..", "Slickdeals+.user.js");
const src = fs.readFileSync(SRC, "utf8");
const cut = (from, to) => { const a = src.indexOf(from); const b = src.indexOf(to, a); return src.slice(a, b + to.length); };
const getCacheKey = new Function(
	cut("const crc32 = text =>", "\n};") + "\n" +
	cut("const getCacheKey = (() =>", "\n})();") + "\nreturn getCacheKey;")();

const el = postId => ({ closest: sel => /post/.test(sel) && postId ? { id: postId } : null });
const B = "https://slickdeals.net/click?sdtid=19854408&lno=1&trd=here";
let pass = 0, fail = 0;
const check = (name, a, b, mustMatch) => {
	const same = a === b;
	const ok = same === mustMatch;
	ok ? pass++ : fail++;
	console.log((ok ? "  ok   " : "  FAIL ") + name);
};

// --- must DROP: parameters that rotate between page loads ---
for (const p of ["u3", "pv", "au", "adobeRef", "peid", "hash", "auuid", "sdtrk"])
	check("ignores " + p + " (rotates every load, else the entry is unreadable)",
		getCacheKey(new URL(B + "&" + p + "=AAA"), el(null)),
		getCacheKey(new URL(B + "&" + p + "=BBB"), el(null)), true);

// --- must KEEP: everything that separates one link from another ---
check("separates different anchor text (trd)",
	getCacheKey(new URL("https://slickdeals.net/click?sdtid=1&lno=1&trd=aaa"), el(null)),
	getCacheKey(new URL("https://slickdeals.net/click?sdtid=1&lno=1&trd=bbb"), el(null)), false);
check("separates different link index (lno)",
	getCacheKey(new URL("https://slickdeals.net/click?sdtid=1&lno=1&trd=x"), el(null)),
	getCacheKey(new URL("https://slickdeals.net/click?sdtid=1&lno=2&trd=x"), el(null)), false);
check("separates different threads (sdtid)",
	getCacheKey(new URL("https://slickdeals.net/click?sdtid=1&lno=1&trd=x"), el(null)),
	getCacheKey(new URL("https://slickdeals.net/click?sdtid=2&lno=1&trd=x"), el(null)), false);

// --- THE CASE THAT PROMPTED THE POST SCOPE ---
// same thread, same link index, same anchor text, DIFFERENT posts.
// lno restarts at 1 in every post, so nothing in the URL tells these apart.
check("separates identical links in DIFFERENT posts (same text, same lno)",
	getCacheKey(new URL(B), el("post111")),
	getCacheKey(new URL(B), el("post222")), false);
check("same link in the SAME post keys identically across loads",
	getCacheKey(new URL(B + "&pv=1&u3=A"), el("post111")),
	getCacheKey(new URL(B + "&pv=2&u3=B"), el("post111")), true);
check("an anchor outside any post still keys stably",
	getCacheKey(new URL(B + "&pv=1"), el(null)),
	getCacheKey(new URL(B + "&pv=9"), el(null)), true);
// tolerate being called without an element (older call sites / harnesses)
check("no element passed is not a crash and stays stable",
	getCacheKey(new URL(B + "&pv=1")), getCacheKey(new URL(B + "&pv=2")), true);

// --- block scoping: post content renders in three places, only replies have ids ---
// Fake just enough DOM for the scope lookup; no jsdom, no dependencies.
const block = o => ({
	id: o.id || "",
	className: o.className || "",
	querySelector: () => o.permalink ? { getAttribute: () => o.permalink } : null
});
const inBlock = blk => ({ closest: () => blk });

const reply1 = inBlock(block({ id: "post111" }));
const reply2 = inBlock(block({ id: "post222" }));
const wiki   = inBlock(block({ className: "communityNotesTab__post" }));
const feat1  = inBlock(block({ className: "featuredComment", permalink: "/f/1?p=184866396#post184866396" }));
const feat2  = inBlock(block({ className: "featuredComment", permalink: "/f/1?p=184859763#post184859763" }));
const loose  = inBlock(null);

// The case that is hard to find in the wild: same thread, same lno, same anchor
// text, two different featured comments. Nothing in the URL separates them.
check("separates same-text links in two different FEATURED COMMENTS",
	getCacheKey(new URL(B), feat1), getCacheKey(new URL(B), feat2), false);
check("separates a wiki link from a featured-comment link with the same text",
	getCacheKey(new URL(B), wiki), getCacheKey(new URL(B), feat1), false);
check("separates a wiki link from a reply link with the same text",
	getCacheKey(new URL(B), wiki), getCacheKey(new URL(B), reply1), false);
check("separates a featured comment from a reply with the same text",
	getCacheKey(new URL(B), feat1), getCacheKey(new URL(B), reply2), false);
check("separates content in a block from content outside any block",
	getCacheKey(new URL(B), wiki), getCacheKey(new URL(B), loose), false);
// and each block still keys stably for itself across loads
check("the same featured comment keys identically across loads",
	getCacheKey(new URL(B + "&pv=1&u3=A"), feat1),
	getCacheKey(new URL(B + "&pv=2&u3=B"), feat1), true);
check("the wiki block keys identically across loads",
	getCacheKey(new URL(B + "&pv=1&u3=A"), wiki),
	getCacheKey(new URL(B + "&pv=2&u3=B"), wiki), true);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
