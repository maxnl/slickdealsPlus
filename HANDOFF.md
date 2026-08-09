# Handoff — link resolution work

Written at the end of the session that shipped **v26.11.14**. Read this with
[`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable architecture notes; this file holds only
what the next session needs to pick the work up, and should be deleted once the open item below is
closed.

---

## 1. What 26.11.14 closed

The 26.11.13 regression is fixed. `isDestinationPlausible()` compared the resolved host against
`trd`, on the reading that `trd` held the sanitised destination URL. It does not — **`trd` is the
link's own anchor text**, sanitised the same way. Confirmed by scanning the fixture thread's markup:
`Dark Gray` stores `Dark+Gray`, `Deal Image` stores `Deal Image`, and the REI link stores
`https www rei com learn expert c` only because its anchor text *is* a URL.

The damage was larger than 26.11.13's notes recorded — not just the colour variants but **228 of 287
links across 25 threads (79%)**, the `Get Deal at Amazon` button and every deal image included.

The check now reads `data-product-exitwebsite`, the destination host Slickdeals states on the anchor.
Sampled before adopting, as the old notes demanded: 287 links, 15 distinct hosts, hostname-shaped
every time, never a merchant name. On the fixture thread 12 of 13 links now unwrap, every colour
variant to its own ASIN.

---

## 2. Open item — the REI link still does not unwrap

It resolves to `amazon.com`, the check correctly rejects that, and the link keeps its Slickdeals
href. **It still works and still reaches rei.com** — it just keeps the referral hop.

The fix is known and measured, and is described in full under *Suggested enhancements* in
`FORK-NOTES.md`. In short: the server resolves any id it has no cached record for, so perturbing
`lno` in the submitted URL (and in the id derived from it, which must agree) returns the correct
destination:

```
19854408sdtid1lno    -> https://www.amazon.com/gp/product/B0GTNLL1H8/...            (cached, wrong)
19854408sdtid999lno  -> https://www.rei.com/learn/expert-advice/sun-protection.html (fresh, right)
```

**The open question is not technical.** Doing this writes entries into V@no's cache under keys his
own scheme would never generate. The collision is upstream's bug — `lno` restarts at 1 in every post
— so raising it with him is the better first move. Decide that before implementing.

---

## 3. Environment

This session had working network access to both `slickdeals.net` and `slickdeals.net.vano.org`, so
every measurement above was taken directly with `curl` rather than pasted from a browser console. If
a future container cannot reach them, set **Network access → Custom** with those two hosts and
**"Also include default list of common package managers" checked**.

Two things that will otherwise waste a session:

- **The resolver requires `Origin` and `Referer`.** Without them every request returns 404 / error
  `1.30` regardless of the id, which reads exactly like the service being down.
- **It rate-limits.** Sustained probing gets connection resets; ~1.8s between requests was stable.

`slickdeals.net` resets headless Chromium (bot protection), but serves `curl` with a browser
user-agent. Deal listing pages are client-rendered: the homepage carries **no** `/click` links at
all, and forum threads are where they live.

---

## 4. Test fixtures

Thread: `https://slickdeals.net/f/19854408-…` — colour variants in the deal body on page 1, the REI
post link on page 2. A single fetch of the base URL returns both.

Ground truth for that thread, if you need to re-derive it: Slickdeals' own `/click` URL 302s straight
to the destination, and for affiliate-wrapped links the `u=` parameter carries the full target. **Do
not build this into the script** — every such request mints a fresh `ascsubtag` and registers as a
click, so using it for resolution would generate phantom affiliate clicks on every page load. It is a
diagnostic, not a mechanism.

---

## 5. Before you ship

From `FORK-NOTES.md` — the ones this area keeps tripping over:

- `getUrlId()` must keep upstream's exact shape, **and** must keep agreeing with the URL that is
  submitted alongside it. That second half is why the earlier collision-free attempt 404'd.
- `VERSION` is a path segment in the resolver URL. Bump it; never change its shape. `@version` and
  `const VERSION` must agree or the release workflow fails.
- The stylesheet is one template literal — no backtick or `${` anywhere in it, comments included.
  `sed -n '/^})(`/,$p' 'Slickdeals+.user.js' | grep -c '`\|\${'` must print `2`.
- `node --check 'Slickdeals+.user.js'` proves nothing about behaviour. Every regression in this
  repo's history passed it.
- **The lesson this handoff exists to pass on:** a signal validated on one sample is not validated.
  Find the case that discriminates between your explanation and its rival, and test *that*. Then
  measure how far the problem actually reaches — 26.11.13 was reported as a handful of colour links
  and was in fact four links in five.
