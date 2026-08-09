# Handoff — link resolution work

Written at the end of the session that shipped **v26.11.13**. Read this with
[`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable architecture notes; this file holds only
what the next session needs to pick the work up, and should be deleted once the open item below is
closed.

---

## 1. Open regression — fix this first

**Symptom.** In the deal body of
[thread 19854408](https://slickdeals.net/f/19854408-prime-members-yaniky-upf-50-quick-dry-lightweight-running-baseball-cap-various-6-99-free-shipping),
the colour-variant links (`Dark Gray`, `Khaki`, `Blue`, `Light Gray`, `Black`, `White`, `& More...`)
each point at a different Amazon product. Under **26.11.12 they resolved correctly**, each to its own
item. Under **26.11.13 they no longer resolve or unwrap** — they keep the full Slickdeals click-through
with referral parameters intact.

**Cause — high confidence, not yet confirmed live.** `isDestinationPlausible()`, added in 26.11.13,
compares the resolved destination's host against the link's `trd` parameter. It was validated against
exactly one link, and that link was the one case where the two competing readings of `trd` cannot be
told apart:

| Reading of `trd` | On the REI post link | On a colour link |
|---|---|---|
| sanitised **destination URL**, cut at 32 chars | `https+www+rei+com+learn+expert+c` | `https+www+amazon+com+dp+B0…` → passes |
| sanitised **anchor text**, cut at 32 chars | `https+www+rei+com+learn+expert+c` | `dark+gray` → **rejected** |

They are identical on the REI link because its anchor text *is* the URL — Slickdeals rendered it as
`https://www.rei.com/learn/expert-...ction.html`. Verified offline: both derivations produce the
identical 32-character string. The colour links are the discriminating case, and their behaviour says
`trd` follows the anchor text.

**Confirm it in one step** (needs the allowed domains from §3, or run in a browser console on the deal
page):

```js
for (const a of document.querySelectorAll('a[href*="/click?"], a.overlayUrl[href*="/click?"]'))
	console.log(JSON.stringify((a.textContent || "").trim().slice(0, 40)),
		"->", new URL(a.href, location).searchParams.get("trd"));
```

If `Dark Gray` prints `trd` = `Dark Gray`, the diagnosis is confirmed. Note the outer anchor's `href`
is rewritten once resolved, so read `trd` from the `a.overlayUrl` child.

**Recommended fix, in preference order.**

1. **Switch to `data-product-exitwebsite`.** The anchor carries the destination host exactly —
   `data-product-exitwebsite="rei.com"` was observed on the REI link, alongside `data-cta="outclick"`
   and `data-outclick-typeofoutclick="Post Content Link"`. This is what `trd` was standing in for, and
   it is not truncated. **Sample it across several hundred links on several page types before
   trusting it** — if it is ever a merchant *name* (`REI`) rather than a host, a host comparison
   against it fails everywhere, which is precisely the mistake being repaired here. The check would
   need `isDestinationPlausible()` to take the anchor element, not just the URL.
2. **Guard the existing `trd` check** so it only applies when `trd` begins with an `http`/`https`
   token, treating anything else as "no destination recorded" and passing it through. Small and safe
   under either reading of `trd`, but it only restores the colour links — it does not make the check
   correct, and a link whose anchor text merely *looks* like a URL would still be checked against the
   wrong string.
3. **Revert `52d28fc` entirely** if the colour links matter more than the wrong-destination fix in the
   meantime. That restores 26.11.12 behaviour: the REI link goes back to showing amazon.com, the
   colour links work again.

Whichever route, the mechanism this repairs is real and still there — see §2.

---

## 2. Established facts — do not re-derive these

All measured live during the 26.11.13 session, on thread 19854408.

**The resolver is a lookup table keyed by id, and it does not read the URL you send it.**
Endpoint (decoded from the obfuscated argument at the foot of the script):

```
[resolver host redacted - assembled at runtime, see the encoded string at the foot of the script]          <- V@no's own host, not Slickdeals
```

Asked about the *same* REI link twice, from the page's own origin:

```
19854408sdtid1lno  -> 200, 194 bytes -> https://www.amazon.com/gp/product/B0GTNLL1H8/...
340707555crc       -> 404, error 7.122
```

The request body carries `[linkUrl, pageUrl]` and is ignored: an id the server does not know 404s
rather than being answered from the URL supplied. This reproduces #24's measurement on a second,
independent link. **Consequence: no client-side id scheme can fix the wrong destination.** The only
id the server answers is the ambiguous one, and its answer is wrong. Filtering the answer is the only
available remedy — which is why 26.11.13 exists, and why the fix in §1 should repair the filter
rather than remove it.

**The wrong destination is served, not cached locally.** With `slickdeals+links` deleted and the page
reloaded, the link resolved off the wire and returned byte-identical content including
`ascsubtag=9e8da36a92d611f1…`, a tracking value minted in an unrelated pageview. The server is
replaying another user's recorded destination for the shared id.

**The id collision is upstream's own unfinished business.** The upstream commit whose entire changelog
is `! resolved links are sometimes wrong` (24.10.30, `8df2f5b`) is the one that *added* `lno`:

```
before:  ["pno", "sdtid", "tid", "pcoid"]
after:   ["pno", "sdtid", "tid", "pcoid", "lno"]
```

It only half-works: `lno` is the link index *within a post* and restarts at 1 in every post, so the
first link of every post in a thread shares one id — `19854408sdtid1lno`.

**`u3` is stable per link, not per pageview.** Byte-identical across two captures of the same link
taken ~40 minutes apart, while `adobeRef` and `peid` both changed. `getCacheKey()` strips it as
volatile; harmless, since over-stripping only merges links that share a destination, but the stated
reason is wrong. It decodes (base64url) to 88 bytes of high-entropy data; neither the resolver's own
unmasking scheme nor any obvious key yields a URL. Assume it is encrypted with a server-side key —
almost certainly why a resolver service exists at all.

**The full destination is not recoverable locally.** `trd` is cut at 32 characters, `u3` is encrypted,
and the anchor text is abridged in the middle (`https://www.rei.com/learn/expert-...ction.html`). The
beginning and the end are on the page; the middle is not.

---

## 3. Environment

This session ran with **Trusted** network access, which blocks both `slickdeals.net` and
`slickdeals.net.vano.org` (`gateway answered 403 to CONNECT`), so every live probe had to be pasted
into a browser console by hand. The new container should be configured with **Network access →
Custom**:

```
slickdeals.net
slickdeals.net.vano.org
```

and **"Also include default list of common package managers" checked**, or npm/GitHub access is lost.
With that, the probes in §1 and §2 can be run directly with `curl` instead of round-tripping through
a human.

Note the resolver host is a subdomain of `vano.org` styled to read as `slickdeals.net`. Resolving
sends the link URL and the current page URL there; `resolveLinks` governs it. `unwrapLinks` is purely
local and sends nothing.

---

## 4. Test fixtures

Thread: `https://slickdeals.net/f/19854408-…?v=1&page=2`

The REI post link (page 2, ambiguous id, wrong answer):

```
https://slickdeals.net/click?adobeRef=…&sdtid=19854408&sdfpid=1311423&sdfid=9&lno=1
  &trd=https+www+rei+com+learn+expert+c&pv=&au=&sdtrk=frontpage&u3=Mt7n5E8KXjxv…&peid=…
```

- resolver id: `19854408sdtid1lno` → answers `amazon.com/gp/product/B0GTNLL1H8`
- unique-per-link crc id: `340707555crc` → 404 / `7.122`
- anchor dataset: `productExitwebsite: 'rei.com'`, `cta: 'outclick'`,
  `outclickTypeofoutclick: 'Post Content Link'`

The colour-variant links live in the **deal body** of the same thread, anchor text `Dark Gray`,
`Khaki`, etc., each a different Amazon product. These are the regression fixtures.

---

## 5. Before you ship

From `FORK-NOTES.md` — the ones this area keeps tripping over:

- `getUrlId()` must keep upstream's exact shape. Redefining it 404s every lookup, silently.
- `VERSION` is a path segment in the resolver URL. Bump it; never change its shape. `@version` and
  `const VERSION` must agree or the release workflow fails.
- The stylesheet is one template literal — no backtick or `${` anywhere in it, comments included.
  `sed -n '/^})(`/,$p' 'Slickdeals+.user.js' | grep -c '`\|\${'` must print `2`.
- `node --check 'Slickdeals+.user.js'` proves nothing about behaviour. Every regression in this
  repo's history passed it.
- **The lesson this handoff exists to pass on:** a signal validated on one sample is not validated.
  Find the case that discriminates between your explanation and its rival, and test *that*.
