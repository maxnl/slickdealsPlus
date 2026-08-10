/* Faithful page-load simulation. Every function under test is EXTRACTED from
 * the shipped file - none is re-implemented here. That is the 26.11.25 lesson. */
const fs = require("fs");
const SRC = require("path").join(__dirname, "..", "Slickdeals+.user.js");
const src = fs.readFileSync(SRC, "utf8");

const cut = (from, toMarker) => {
	const a = src.indexOf(from);
	if (a < 0) throw new Error("NOT FOUND IN SHIPPED FILE: " + from);
	const b = src.indexOf(toMarker, a);
	return src.slice(a, b + toMarker.length);
};

// crc32 + getCacheKey + getUrlId + hostOf/isHostShaped/isDestinationPlausible
// + decodeResolved + resolveFinalHop, all straight out of the file.
const blocks = [
	cut("const crc32 = text =>", "\n};"),
	cut("const getCacheKey = (() =>", "\n})();"),
	cut("const getUrlId = (() =>", "\n})();"),
	cut("const hostOf = value =>", '.replace(/\\.$/, "");'),
	cut("const isHostShaped = value =>", ".test(value);"),
	cut("const decodeResolved = (id, response) =>", "\n};"),
	cut("const resolveFinalHop = (urlObject, key) =>", "\n};"),
	cut("const askFor = (urlObject, key, id) =>", "\n};"),
	cut("const resolveNatural = (id, href) =>", '.catch(() => "");'),
	cut("const isDestinationPlausible = (() =>", "\n})();"),
];
const NET = { calls: [] };
const shipped = new Function("resolveUrl", "TextEncoder", "TextDecoder",
	blocks.join("\n") + "\nreturn {getCacheKey,getUrlId,isDestinationPlausible,resolveFinalHop,decodeResolved,askFor,resolveNatural};");

// stubbed transport: records every request the script would make
const WORLD = {};                       // id -> destination the service answers
const resolveUrl = (id, url) => {
	NET.calls.push({ id, url });
	const dest = WORLD[id];
	if (!dest) return Promise.resolve(null);
	// mask exactly as the service does, so decodeResolved() is genuinely exercised
	const k = new TextEncoder().encode(id);
	const plain = new TextEncoder().encode("\0" + dest);
	const out = new Uint8Array(plain.length);
	for (let i = 0; i < plain.length; i++) out[i] = plain[i] ^ (i ? out[i-1] : 0) ^ k[i % k.length];
	return Promise.resolve(out.buffer);
};
const S = shipped(resolveUrl, TextEncoder, TextDecoder);

/* processLinks()'s control flow for one link, transcribed from the shipped
 * source (the surrounding loop is not extractable - it is inside a 90-line
 * function - so the FLOW is mirrored and every DECISION is delegated). */
const cache = new Map();                                  // the localStorage link cache
const visit = async (href, stated) => {
	const urlObject = new URL(href);
	const id = S.getUrlId(urlObject);
	if (!id) return "no id -> skipped";
	const key = S.getCacheKey(urlObject);
	const elLink = { dataset: stated ? { productExitwebsite: stated } : {} };

	const q = new URLSearchParams(urlObject.search);
	let url = q.has("u2") ? q.get("u2") : cache.get(key);
	if (url) return { outcome: "CACHE HIT", requests: 0, dest: url };

	const before = NET.calls.length;
	const ask = S.askFor(urlObject, key, id);
	const raw = await resolveUrl(ask.id, ask.url);
	let response = S.decodeResolved(ask.id, raw);
	if (!response) return { outcome: "no answer", requests: NET.calls.length - before, dest: "" };

	if (!S.isDestinationPlausible(elLink, response)) {
		const final = ask.unique ? await S.resolveNatural(id, href) : await S.resolveFinalHop(urlObject, key);
		if (!final || !S.isDestinationPlausible(elLink, final))
			return { outcome: "REJECTED (link left alone)", requests: NET.calls.length - before, dest: "" };
		cache.set(key, final);
		return { outcome: "retry -> FOLLOWED ON", requests: NET.calls.length - before, dest: final };
	}
	cache.set(key, response);
	return { outcome: "natural answer", requests: NET.calls.length - before, dest: response };
};
module.exports = { visit, cache, NET, WORLD, S };
