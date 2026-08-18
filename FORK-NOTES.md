# Fork Notes

Working reference for [maxnl/slickdealsPlus](https://github.com/maxnl/slickdealsPlus), a fork of
[vanowm/slickdealsPlus](https://github.com/vanowm/slickdealsPlus) by V@no (MIT).

| | |
|---|---|
| Forked from | `b2c6ac8`, 2025-07-19, upstream **v25.7.18** |
| Current | **v26.11.31** |
| Diff since fork | +809 / −58 lines in `Slickdeals+.user.js` |
| Files added | `.github/workflows/release.yml`, this file |
| Files deleted | `CNAME`, `CHANGES.html` |

Upstream has not released since 25.7.18. Its scheme is `YY.M.D` — a date. Ours is a plain
incrementing counter and does **not** correspond to upstream's. See
[`VERSION` is load-bearing](#version-is-load-bearing) for why it carries no fork suffix.

---

## Contents

- [Release history](#release-history)
- [What changed, by theme](#what-changed-by-theme)
- [Issues we hit](#issues-we-hit)
- [Caveats for anyone editing this](#caveats-for-anyone-editing-this)
- [Outstanding items](#outstanding-items)
- [Suggested enhancements](#suggested-enhancements)

---

## Release history

Releases exist on GitHub from v26.11.1 onward; the release workflow was added part-way through.
Earlier versions are reconstructed from the file at each merge.

| Version | PR | Change |
|---|---|---|
| 26.8.7 | [#1](https://github.com/maxnl/slickdealsPlus/pull/1) | Fix Quick View blocking and forum link cache-key collisions |
| 26.8.7 | [#2](https://github.com/maxnl/slickdealsPlus/pull/2) | Sweep tracking images by `src`, not `href` |
| 26.8.8 | [#3](https://github.com/maxnl/slickdealsPlus/pull/3) | Add one-click install and auto-update from this repo |
| 26.8.9 | [#4](https://github.com/maxnl/slickdealsPlus/pull/4) | Point fork artifacts at this repo, fix lost debug upgrade |
| 26.8.10 | [#5](https://github.com/maxnl/slickdealsPlus/pull/5) | Declare an author so userscript managers show one |
| 26.9.1 | [#6](https://github.com/maxnl/slickdealsPlus/pull/6) | Add settings menu fallback for the classic layout |
| 26.9.2 | [#7](https://github.com/maxnl/slickdealsPlus/pull/7) | Make link cache eviction actually free entries |
| 26.9.3 | [#8](https://github.com/maxnl/slickdealsPlus/pull/8) | Delete dead `CHANGES.html`, fix the 26.9.2 changelog entry |
| 26.9.3 | [#9](https://github.com/maxnl/slickdealsPlus/pull/9) | Delete the dead first-party allowlist entry |
| 26.9.4 | [#10](https://github.com/maxnl/slickdealsPlus/pull/10) | Stop swallowing errors, make the debug switch reachable |
| 26.9.5 | [#11](https://github.com/maxnl/slickdealsPlus/pull/11) | `u2` decode fix (double-decode threw `URIError`) |
| 26.9.6 | [#12](https://github.com/maxnl/slickdealsPlus/pull/12) | Fix unreadable menu text and the loading counter over the arrow |
| 26.10.1 | [#13](https://github.com/maxnl/slickdealsPlus/pull/13) | Separate local link unwrapping from the network resolver |
| 26.10.2 | [#14](https://github.com/maxnl/slickdealsPlus/pull/14) | Cap the link cache instead of waiting for a quota failure |
| 26.10.3 | [#15](https://github.com/maxnl/slickdealsPlus/pull/15) | Keep per-pageview parameters out of the link cache key |
| 26.10.4 | [#16](https://github.com/maxnl/slickdealsPlus/pull/16) | Make `initMenu` actually retry while the header is still rendering |
| 26.10.5 | [#17](https://github.com/maxnl/slickdealsPlus/pull/17) | Release links that have left the document |
| 26.10.6 | [#18](https://github.com/maxnl/slickdealsPlus/pull/18) | Beat the page's ID selectors when resetting menu text |
| 26.10.7 | [#19](https://github.com/maxnl/slickdealsPlus/pull/19) | Recognize the classic layout's deal cards |
| 26.10.8 | [#20](https://github.com/maxnl/slickdealsPlus/pull/20) | Restore menu text color, stop the loading counter overflowing |
| 26.10.9 | [#21](https://github.com/maxnl/slickdealsPlus/pull/21) | Stop breaking the resolver with hyphenated ids and nav links |
| 26.10.10 | [#22](https://github.com/maxnl/slickdealsPlus/pull/22) | Keep the menu overlay out of the top bar's layout |
| 26.10.11 | [#23](https://github.com/maxnl/slickdealsPlus/pull/23) | Reset inherited text properties as a category, tidy the changelog |
| 26.11.1 | [#24](https://github.com/maxnl/slickdealsPlus/pull/24) | **Send the resolver the id it recognizes, cache under our own key** |
| 26.11.1 | [#25](https://github.com/maxnl/slickdealsPlus/pull/25) | Publish a GitHub release whenever the version changes |
| 26.11.2 | [#26](https://github.com/maxnl/slickdealsPlus/pull/26) | Let the menu grow to fit instead of scrolling at 80vh |
| 26.11.3 | [#27](https://github.com/maxnl/slickdealsPlus/pull/27) | Harden three paths that fail silently on unfamiliar markup |
| 26.11.4 | [#28](https://github.com/maxnl/slickdealsPlus/pull/28) | Install and update from the latest release, not from master |
| 26.11.5 | [#29](https://github.com/maxnl/slickdealsPlus/pull/29) | Give the changelog room and align its wrapped lines |
| 26.11.6 | [#30](https://github.com/maxnl/slickdealsPlus/pull/30) | **Classic layout: free and price-difference highlighting** |
| 26.11.7 | [#31](https://github.com/maxnl/slickdealsPlus/pull/31) | Inset the version number from the menu panel edge |
| 26.11.8 | [#32](https://github.com/maxnl/slickdealsPlus/pull/32) | Identify the script as a fork, without touching `VERSION` |
| 26.11.9 | [#33](https://github.com/maxnl/slickdealsPlus/pull/33) | **"Free Only" fixed on classic layout and search results** |
| 26.11.10 | [#34](https://github.com/maxnl/slickdealsPlus/pull/34) | Even out the space around the version number |
| 26.11.11 | [#35](https://github.com/maxnl/slickdealsPlus/pull/35) | Version number an even 15px from both menu edges |
| 26.11.12 | [#36](https://github.com/maxnl/slickdealsPlus/pull/36) | Resolver console flood silenced; failed-group leak closed |
| 26.11.13 | — | **Post links no longer resolve to the deal's own destination** |
| 26.11.14 | [#40](https://github.com/maxnl/slickdealsPlus/pull/40) | **Destination check reads `data-product-exitwebsite`; 26.11.13 had broken ~79% of links** |
| 26.11.15 | [#41](https://github.com/maxnl/slickdealsPlus/pull/41) | Post-content links are asked under an id of their own from the start |
| 26.11.16 | [#42](https://github.com/maxnl/slickdealsPlus/pull/42) | Stale pre-26.11.15 cache entries purged once; cap raised from 3000 to 5000 |
| 26.11.17 | [#43](https://github.com/maxnl/slickdealsPlus/pull/43) | Shared-id requests send the link's own href again (no behavior change) |
| 26.11.18 | [#45](https://github.com/maxnl/slickdealsPlus/pull/45) | **A cached destination is never re-checked; affiliate-redirector links stop re-resolving every page load** |
| 26.11.19 | [#46](https://github.com/maxnl/slickdealsPlus/pull/46) | Free highlighting reaches the homepage list view and the `/deals/` list view |
| 26.11.20 | [#47](https://github.com/maxnl/slickdealsPlus/pull/47) | **`lno` perturbation reverted - deal-body variant links resolved to the deal's default product** |
| 26.11.21 | [#48](https://github.com/maxnl/slickdealsPlus/pull/48) | An affiliate network is no longer read as a contradicting destination |
| 26.11.22 | [#49](https://github.com/maxnl/slickdealsPlus/pull/49) | A network answer is followed on to the merchant, guarded by the host the anchor states |
| 26.11.23 | — | **The same, without any hardcoded networks - and the rei.com link resolves again** |
| 26.11.24 | — | Only a hostname-shaped value is believed as a destination claim - prose is not a claim |
| 26.11.25 | — | **Restores a function 26.11.23 deleted while still calling it - link resolving was broken in 26.11.23-24** |
| 26.11.26 | — | **The deal button and image could never hit the cache** - plus one request per post link, and remembered failures |
| 26.11.27 | — | **A link stating `slickdeals.net` as its destination was never unwrapped** - plus wiki/featured-comment scoping |
| 26.11.28 | — | The host check no longer runs on ids that cannot be shared, so a cross-host redirect resolves |
| 26.11.29 | — | A "no destination" answer is remembered, instead of being re-asked on every page load |
| 26.11.30 | — | Removes a branch 26.11.28 made unreachable, and the helper it was the only caller of |
| 26.11.31 | — | Guards the two latent CSS traps - no behavior change |

---

## What changed, by theme

### Link resolving and unwrapping

**The resolver id and the cache key are two different things** (#24). This is the single most
important structural change, and getting it wrong broke every link.

- `getUrlId()` produces the id the third-party service is addressed with, and which its response is
  XOR'd against. The service only recognizes ids in its own shape. An earlier change redefined it to
  make it collision-free, and every lookup started returning 404.
- `getCacheKey()` is ours: a crc32 of the path plus query with per-pageview parameters
  (`u3`, `adobeRef`, `peid`, `hash`, `auuid`, `sdtrk`) stripped and the rest sorted. Unique per link,
  stable across page loads. Correction (26.11.13): `u3` is **not** per-pageview - it is byte-identical
  across captures 40 minutes apart. Stripping it stays harmless, since over-stripping only merges
  links that share a destination, but the source comment calling it volatile is wrong.

Why both are needed: `lno` is the link index *within a post*, so it restarts at 1 in every post and
the first link of every post in a thread shares an id. Using the resolver id as the cache key made
links inherit whichever destination happened to resolve first (#1, #15).

**What the resolver actually is** (26.11.14, measured directly over the network). The endpoint is
V@no's own host, not a Slickdeals service. Its address is **deliberately not written down here**: the
script assembles it at runtime from the encoded string at the foot of the file, and upstream
obfuscated it for a reason - spelling it out in a file GitHub indexes undoes that and points traffic
at someone else's server. Decode that argument if you need it.

It is **a cache in front of an on-demand resolver**, not the pure lookup table 26.11.13 recorded.
Three things were measured, and the first two correct that earlier note:

- **It reads the URL in the request body.** The id in the path and the parameters of the URL in the
  body must agree; a mismatched pair is refused with 404 / error `7.122`. This is why an earlier
  attempt at a collision-free `getUrlId()` 404'd everything (#24) - not because the id shape was
  rejected, but because an id that no longer matched the submitted URL never could be.
- **An id it has no record for is resolved fresh, not 404'd.** Perturbing the REI link's `lno` so
  the derived id is novel returns the *correct* destination, which the ambiguous id does not:

  ```
  19854408sdtid1lno    -> https://www.amazon.com/gp/product/B0GTNLL1H8/...   (wrong - cached)
  19854408sdtid999lno  -> https://www.rei.com/learn/expert-advice/sun-protection.html  (right)
  19854408sdtid        -> https://www.rei.com/learn/expert-advice/sun-protection.html  (right)
  ```

- **It requires `Origin` and `Referer`.** Without them every request is refused with 404 / error
  `1.30`, whatever the id. Any future probing with `curl` must send both or it will look like the
  service is down.

So a wrong destination is a **stale cache entry on the server keyed by the colliding id**, not an
inability to resolve. `lno` is the link index within a post and restarts at 1 in every post, so the
first link of *every* post in a thread is asked under `19854408sdtid1lno`, and whichever one was
recorded first is served to all of them. Deal-body links are unaffected: they carry `pno`, so their
ids (`1311423pno19854408sdtid3lno`) are already unique, and all seven color variants resolve to
their own distinct ASINs.

The corollary for the fork: a client-side id scheme *can* reach a correct answer, but only by
perturbing `lno` in the URL that is submitted alongside it, which writes a new entry into someone
else's cache on every link. Not adopted - see [outstanding items](#outstanding-items).

`u3` decodes (base64url) to 88 bytes of high-entropy data that neither the resolver's own unmasking
scheme nor any obvious key turns into a URL - presumably encrypted with a server-side key, which is
why a resolver service exists at all. With `trd` cut at 32 characters and the anchor text abridged in
the middle, **the full destination is not recoverable locally.**

**Unwrapping and resolving are separate settings** (#13). Reading a destination out of a link's own
`u2` parameter is free and entirely local; asking the service costs a request and sends the link and
the page URL to a third party. One switch used to govern both. Now `unwrapLinks` governs
locally-derived destinations and `resolveLinks` governs service ones, tracked per link via
`_hrefLocal`. Local unwrapping is tried first, so many links never reach the network at all.

**Cache management** (#7, #14, #17). Eviction on quota failure ran the iterator to exhaustion and
then deleted `undefined`, so every pass freed nothing and recursed up to 10,000 times against an
unchanged cache. Now it evicts oldest-first in exponentially growing batches, and a hard cap
(`LINKS_MAX = 3000`) trims on write so the failure path is rarely reached at all. Separately,
`linksData` kept a reference to every anchor the script had ever seen, including detached ones —
1000 retained references dropped to 20 once departed links were pruned.

**A wrong answer is now rejected rather than displayed** (26.11.13). `getCacheKey()` stops links
that share a resolver id from inheriting each other's destination *locally*, but the destination for
a link inside a forum post is already wrong when it arrives: `lno` restarts at 1 in every post, so
the first link of every post in a thread is sent as one id (`19854408sdtid1lno`) and the service
answers all of them with the thread's own product page. Reported live — a post linking to `rei.com`
rendered as the deal's `amazon.com` page, with an `ascsubtag` from a different pageview, which is
what identified the answer as the service's and not the cache's.

The id we send is derived from the link's own parameters, so a colliding link is always asked under
the colliding id and always gets the stale answer back. `isDestinationPlausible()` therefore checks
the answer against `data-product-exitwebsite`, the destination host Slickdeals states on the anchor
(26.11.14 — 26.11.13 used `trd` for this and was wrong about what `trd` is). Only the host is
compared: the resolver legitimately returns a different path (`/dp/` comes back as `/gp/product/`,
affiliate parameters get appended). A subdomain of the stated host matches, so an affiliate hop like
`go.loaded.com` passes for a link stating `loaded.com`; a redirector on an unrelated domain does not.
An anchor with no stated host is passed through unchecked. A rejected destination is neither applied
nor cached, and a cached one that fails is deleted, so a bad entry written before this check cannot
keep reappearing.

Rejection is deliberately conservative: the link keeps its original href, stays `notResolved`, and
still reaches the correct page through Slickdeals' redirect. What it loses is the unwrap, not the
destination.

**Perturbing `lno` was tried, and reverted** (26.11.14 -> 26.11.20). The service resolves any id it
holds no entry for, so a rejected answer could be re-asked under an id it could not already have -
`resolveFresh()` replaced `lno` with the link's own cache key and re-derived the id; 26.11.15 went
further and sent post-content links there from the start. On the rei.com post link it worked, and
that link was the only one it was measured on.

**`lno` is not an index the destination is independent of.** A deal body's variant links are
`&lno=3&trd=Khaki`, `&lno=6&trd=Black`: `lno` is what selects the variant. Replacing it made
Slickdeals fall back to the deal's default product, so seven color links that each had their own
ASIN all resolved to one. Confirmed against the untouched originals in a browser - Khaki really goes
to `B0GTNMT45B`, Black to `B0GTNDJ3FZ`, while every one of them was being rewritten to `B0H2CM94NK`.

So `lno` is not ours to touch, on any path, and 26.11.20 removed the machinery entirely. A colliding
answer is rejected and the link left alone: it keeps its original href, stays `notResolved`, and
still reaches the right page through Slickdeals' own redirect - it only loses the unwrap. That is
honest. A perturbed request that returns a *different* wrong answer is not, and cannot be told from
a right one.

The cost is the rei.com post link, which goes back to not unwrapping. That is the correct trade:
one link left alone against seven rewritten to the wrong product.

### The classic (vBulletin) layout

Everything in this section was dead before the fork's changes. The classic pages have no Blueprint
header, no `li`-based cards, and no Vue custom properties.

- **Menu** (#6, #16, #22). `createFallbackMenuHost()` builds a host with the exact shape `initMenu()`
  expects, so `initMenu()` runs unmodified. Mounted immediately left of the avatar/username cluster
  in `#top_userbar`.
- **Card recognition** (#19). `div.dealitem` added to the card selector and to `closest()`. Before
  this, `elCard` was null and free, price-difference *and* score highlighting were all silently off.
- **Price parsing** (#30). The classic price carries no class — it is a bare `<b>` inside
  `<span class="dealblocktext"><strong>`, with the shipping line as a sibling `<b>`.
  `.dealblocktext strong > b:first-of-type` selects the price and never the shipping line.
- **Paint rules** (#30). Elsewhere the highlight works by redefining `--backgroundColor` and letting
  the page's own Vue stylesheets read it. Classic pages predate those variables and read nothing, so
  the `div.free` / `div.highlightDiff` / `div.highlightRating` rules were matching with no effect.
  Now consumed explicitly, as `.resultRow` already did.
- **Filters** (#33). Every `freeOnly` / `diffOnly` / `ratingOnly` rule matched an `li` inside one of
  seven named containers. `div.dealitem` and `div.resultRow` appeared in none of them, so "Free Only"
  did nothing on the classic layout *or* on search results.
- **Vote counts** (#19). `.fp_votebar > .rating`, rendered as `+406`. `parseVotes()` handles the
  leading `+`, thousands separators and `k`/`M` suffixes — `parseInt` stopped at the first non-digit,
  which would have read `1,234` as `1`, mis-scoring exactly the deals highlighting exists for.
  **Verified live:** 768 of 770 cards matched, `+406` → `406`.

### Ad blocking

- **Quick View** (#1). `blockText` patterns are meant for script/iframe payloads. Applying them to
  every `innerHTML`/`outerHTML` assignment killed legitimate markup: the old front page's Quick View
  HTML carries `facebook_url="...utm_source=facebook"` on the vote widget, which matched `/facebook/`
  and dropped the whole insertion with no error, so deals never expanded. The `skipCheck` gate now
  runs the text filter only on markup that can actually execute.
- **Image sweep** (#2). `HTMLImageElement` has no `href`, so the old `node.href` test was always
  undefined and images were never swept. Now reads `node.src || node.href`.
- **Dead allowlist entry** (#9). A `/:\/\/slickdeals\.net\//` entry was tested against a bare
  hostname, which can never contain `://`, so it never matched. Removed rather than repaired —
  repairing it would have started allowing first-party `/click./`, `/analytic/`, `/adsystem/` URLs.

### Menu and presentation

Menu text readability (#12, #18, #20, #23), overlay containment (#22), loading counter sizing
(#12, #20), panel growth instead of early scrolling (#26), changelog spacing (#29), and version
label placement (#31, #34, #35).

### Distribution

- `@downloadURL` / `@updateURL` point at `releases/latest/download/Slickdeals.user.js` (#28).
- `.github/workflows/release.yml` publishes a release on every version change, gated on `@version`
  matching `const VERSION` and on `node --check` passing (#25).
- Fork identity in `@name`, `@author`, the menu footer and the README (#5, #32).

---

## Issues we hit

Recorded because the *shape* of each recurs.

**The resolver id must be upstream's shape.** Making it collision-free broke every lookup, silently
— the links simply stayed blue. Settled only by a controlled test: upstream's id returned 200 with a
228-byte body, a differently-derived id for the same link and version returned 404. Collision
freedom moved to `getCacheKey()` instead.

**A class per cached link on `<html>`** (26.11.13). `settingsFunction()` ended in
`document.documentElement.classList.toggle(id, !!value)`, run for every id it was given — including
link-cache ids, so each resolved link left a `0…crc` class on the root element, one per link, with
nothing reading them. Noticed while adding the cache delete, fixed in its own commit rather than
folded in. Safe because `settingsInit()` has always iterated `defaultSettings` rather than the
stored data, so the startup path never had the problem, and the guard reuses the same `isLink`
routing that already chose the storage Map — with all 17 settings keys beginning with a letter, no
setting can fall on the link side of it.

**A signal validated on one sample is not validated** (26.11.13 -> fixed in 26.11.14).
`isDestinationPlausible()` compared the resolved host against `trd`, and `trd` was read off exactly
one link - a forum post whose anchor text *was* the URL. On that link, "trd is the sanitised
destination URL" and "trd is the sanitised anchor text" produce byte-identical strings, so the sample
could not discriminate between them. Every other link does: `Dark Gray` stores `Dark+Gray`,
`Deal Image` stores `Deal Image`, and a host comparison rejects them all.

Confirmed by scanning the thread's own markup - `trd` tracked the anchor text on all 31 links - and
the damage was then measured rather than guessed: **228 of 287 links across 25 threads, 79%**,
including the `Get Deal at Amazon` button and every deal image. The regression was recorded as
"color-variant links stopped resolving"; it was closer to all link resolution stopping. Estimating
the blast radius of a bug from the one report that surfaced it is its own version of the same
mistake.

The failure is the same shape as #1, committed in the same breath as a warning about it. The rule
that would have caught it: find the case that tells your explanation apart from its rival, and test
*that* one.

**A dangerous operation can be safe in one place and not another** (26.11.15 -> 26.11.22).
Perturbing `lno` to force an on-demand resolve is destructive in general - it rewrote seven color
links to the deal's default product, and 26.11.20 removed it. 26.11.22 uses it again, in one place,
and that is not a reversal: what makes it safe is not the operation but where it runs and what is
done with the answer.

It fires only when the natural answer is an affiliate network - which a deal body's variant links
never are, since they answer with `amazon.com/dp/…` directly - and the result is taken only if it
lands on the host the anchor states. A link already answered with its merchant never reaches it.

The residual is honest and worth writing down: a variant link on a merchant that *does* route through
a network, whose perturbed answer is the deal's default on the same host, would be accepted wrongly
and invisibly. No such link has been seen; Amazon links cannot produce one.

The generalisation: "this operation is unsafe" and "this operation is unsafe here" are different
claims, and collapsing them costs you the cases where it was the only thing that worked.

**Naming the exception is a sign the rule is wrong** (26.11.21 -> 26.11.23). The host check kept
rejecting affiliate networks, so 26.11.21 gave it a list of them to let through. maxnl objected to
hardcoding domains and was right, for a better reason than maintenance: the list was standing in for
a distinction the code could already make.

A mismatch between the answer and the host the anchor states is *not* proof of a collision. It is
equally what an intermediate hop looks like. Nothing about the answer tells you which - but asking
again under an id the service holds nothing for does, because that resolves on demand, follows the
chain, and either reaches the stated host or does not. Match, and it was an intermediate hop and is
now complete. Still disagree, and it was a collision, so the link is left alone.

**A check is only as good as the field it reads, and it should say so** (26.11.24). maxnl asked what
happens to a link whose text is words rather than a domain. The check does not read anchor text - it
reads `data-product-exitwebsite`, and swapping to that attribute is what repaired 26.11.13. But the
question was the right one aimed one field over: nothing made the check *require* that attribute to
hold a hostname.

An absent value was handled - no claim, resolve unchecked. A value holding prose was not: `Amazon`
normalises to `amazon`, which no real host can equal or be a subdomain of, so the link was rejected
and, from 26.11.23, burned a retry on the way. That is 26.11.13 exactly, one attribute along, and
the only thing standing between the script and it was that this attribute happens to hold hostnames.

Measured across 14 saved pages: 30 of 4,314 anchors carry the attribute, 30 of 31 resolver-bound
links do, and all 3 distinct values are hostname-shaped. Never observed - but 3 values is not a
guarantee, and the fix costs one predicate.

So the shape is now required before the value is believed, and a value that fails it is treated as
no claim at all. The direction matters: unchecked is how every link behaved before the check
existed, and it fails visibly - a wrong destination gets reported. A claim nothing can satisfy fails
invisibly, rejecting links that were fine and reading as "resolution is just broken again".

The generalisation: when a check depends on a field having a particular shape, test the shape rather
than assuming it, and make an unreadable value mean *no information* rather than *contradiction*.

**A harness that re-implements the code under test validates your intent, not the artifact**
(26.11.23 -> 26.11.25). 26.11.23 removed the hardcoded network list, and removed `decodeResolved()`
and `resolveFinalHop()` along with it - they sat next to the deleted code - while leaving the call
to `resolveFinalHop()` in place. Both 26.11.23 and 26.11.24 shipped that way. Link resolving was
broken in both, in the way maxnl had already reported once for 26.11.20.

Every gate passed. `node --check` parses and does not resolve names. The version numbers agreed.
The stylesheet check passed. The unit assertions passed, because they test `isDestinationPlausible()`
and nothing else. And the decision model - the thing that printed `Timex 1 -> FOLLOWED ON` and was
quoted as proof the retry worked - *re-implemented the retry in the harness* rather than calling the
shipped one, so nothing in the whole suite ever looked the missing function up.

The browser hid it too, and by a mechanism this file already documents: the ReferenceError is raised
inside the `.then()`, caught by the `catch` that wraps the decode, and logged through `debug()`,
which is `fVoid` unless Debug is ticked. A silent catch turns a missing function into a link that
just quietly does not resolve.

Two things follow. A harness must call the shipped function, not a copy of it - extract it from the
file, as the `isDestinationPlausible` unit test does, and if it cannot be extracted that is a reason
to restructure the code, not to model it. And a gate for the class, not the instance: the release now
runs ESLint `no-undef` over the script, which flags exactly this in one line, and which was added
only after confirming it fails on the shipped 26.11.24 and passes on the fix.

The wider point, and the third time this file has had to make it: *proving the mechanism* and
*proving this build has the mechanism* are different claims. The first was true throughout.

**Measure the thing before accepting its cost** (26.11.26). The two-request path was accepted as the
price of keeping a deal body's color links intact, on the belief that any unique id costs a second
request. maxnl pushed back on that, and the belief did not survive contact with the service.

Measured against the live resolver on thread 19854408 - curl-to-curl, which is valid for
perturbation-invariance because both requests carry the same `u3`; only *where a link goes* needs a
browser:

| link class | natural id | asked naturally | perturbed |
|---|---|---|---|
| deal body (`pno` present) | already unique per link | all 8 colors -> their own ASIN, 1 request | `lno` replaced: all collapse to `B0GTNLL1H8`. `pcoid` added: Khaki -> `B0H2CM94NK` (wrong), Black -> correct |
| post link (`lno`, no `pno`) | `<sdtid>sdtid<lno>lno`, shared by the first link of every post | rei.com link -> the thread's amazon product | `lno` replaced -> its own rei.com URL, first time |

Two things fall out. **A deal body's links never needed anything** - their ids are already unique and
already right, so the whole cost was being paid by post links only. And **`pcoid` is worse than
`lno`**: it was correct for Black and wrong for Khaki, so a single sample would have made it look
safe. That is the 26.11.15 mistake exactly, and it was avoided this time only by testing two links
instead of one.

So the perturbation goes back, restricted to where the id is ambiguous by construction - `lno`
present, `pno` absent - which is the rule 26.11.19 shipped and 26.11.20 reverted. Reading 26.11.19's
`resolverRequest()` again: it returned the natural id whenever `pno` was present, so it never
touched a deal body's links, and the collapse maxnl saw cannot have come from it. **The revert was
aimed at the wrong thing, and the real cause of that collapse is still unexplained.** The one
explanation that fits is that the browser's markup omits `pno` where the fetched markup carries it -
which would make this rule unsafe, and is why it is not merged without checking the browser first.

The generalisation: an accepted cost deserves the same scepticism as a bug report. "This is the price
of correctness" is a claim, and it can be measured like any other.

**`u3` is the condition; `pno` was a symptom of it.** The rule above was first written as "`lno`
present, `pno` absent", which is what 26.11.19 used. maxnl asked whether the `u3` details were right,
and checking them produced the better rule.

`u3` carries the destination itself, encrypted. A link that has one can be resolved from the URL
alone, so asking under an id the service holds nothing for makes it decrypt `u3` rather than answer
from what it already holds - and what it already holds is another link's destination. A link with no
`u3` has nothing in it to resolve from: the service identifies it by the parameters, `lno` among
them, so changing `lno` asks about a different link. That is one mechanism explaining both halves of
the table above, where `pno` only correlated.

Measured over both fixture threads: every link that takes the perturbed path carries `u3` (3 of 3),
and no deal-body link does (0 of 12). All three conditions are now required, so the markup would have
to change in three ways at once before a deal's links could be perturbed - which also means the
open question about whether the browser's markup carries `pno` no longer gates the change.

Two `u3` invariants worth not breaking, both verified rather than assumed:

- `getCacheKey()` **strips** `u3`, because it is per-pageview. Two loads of the same page give
  different `u3` and must give the same key, or nothing would ever hit the local cache.
- the perturbed request **keeps** `u3`, because it is the destination. Perturbing `lno` while
  dropping `u3` would ask the service to resolve nothing.

**Cache compatibility with upstream.** Of 45 resolver-bound links across both fixture threads, 38
are sent with an id *and* URL byte-identical to what V@no's script sends, so those share his cached
entries in both directions. The 7 that diverge are exactly the post links whose shared id answers
with another link's destination - the entry we would be sharing is the wrong one, so not sharing it
is the point. Nothing overwrites an upstream entry; the divergent ids are additional, deterministic,
and asked at most once per link thanks to the local cache.

**A cache nobody can read is not a cache** (26.11.26). Asked whether the local cache was really being
used, the answer turned out to be "not for the two most-used links on a deal page". `getCacheKey()`
strips the parameters that change between pageviews, and two of them were missing: `pv` and `au`.

Measured by keying two fetches of thread 19854408 taken a day apart: 12 of 14 links kept their key,
and the 2 that did not were the deal's own `Get Deal at Amazon` button and its image. Their key was
different on every pageview, so the entry written on one load could never be found on the next, and
those two links re-asked the service on **every single page load, for the life of the install** -
while looking perfectly healthy, because they always resolved. With `pv` and `au` stripped, 14 of 14
are stable. Every key changes shape, so the cache is cleared once on upgrade.

`trd` was stripped too, briefly, and then put back - which is the more interesting half. It is only
the anchor's text and cannot affect a destination, and stripping it merges the sticky-bar button with
the deal image, saving a request. But links in different posts of one thread are
`sdtid=<thread>&lno=<n>&sdfid=9`, where `lno` restarts in every post and `sdfid` is the *forum*, not
the post. Strip `trd` as well and two posts' first links key identically - one destination handed to
two different links, which is the exact bug this key exists to prevent, reintroduced in the name of
saving one request.

The generalisation, and it cuts both ways from the note above: over-stripping is only safe while
something else still tells two links apart. Check what that something is before removing anything -
here it was the one parameter that looked most obviously useless.

**And the post a link sits in belongs in the key too** (26.11.26). maxnl's follow-up: anchor text can
change, and the same text can appear more than once with different destinations. Both are true, and
the second is the dangerous one - a changed text is a cache miss that heals itself, while two links
sharing a key hand one destination to both.

`lno` restarts at 1 in every post, `sdfid` is the *forum* rather than the post, and `trd` is the
anchor text truncated to 32 characters with punctuation stripped. So two posts in one thread, each
with a first link labelled `here` or `this one` - or two long URLs agreeing for 32 characters - have
nothing left in the URL to tell them apart. The post id is in the DOM, is permanent, and is the one
thing that does.

Cost, measured over 76 links on four pages: 33 cache keys become 34. The single extra is a link the
deal page renders twice, once inside a post and once outside; it now resolves under two keys instead
of one. One request, once, then both cached.

Worth recording what this measurement *cannot* show. No sample here contains two different posts each
linking somewhere different under the same words, so the bug was never observed - only shown to be
possible from the shape of the URLs. The guard costs 1.3% more requests, which is cheap enough that
it does not need the bug to be demonstrated first. An earlier attempt to detect the clash by looking
for one cache key covering two `u3` values was abandoned: `u3` differs per *rendered instance*, not
per destination, so it flags a link the page renders twice and proves nothing.

**How the href behaves between loads**, since this keeps coming up: of 14 `/click` links compared
across two fetches three seconds apart, 11 hrefs were byte-identical and 3 differed - only ever in
`pv`, `au` and `u3`. The stable part of the href really is stable; those three rotate, which is
exactly why they are stripped.

**Post content renders in three places, and the collision is real** (26.11.27). Everything above about
colliding ids was deduced from the shape of the URLs; thread 19632174 shows it happening. That thread
serves `19632174sdtid1lno` for **both** a dansdeals.com link and a capitalone.com one, and
`19632174sdtid2lno` for **both** a dansdeals.com and a paze.com one. Four links, two collisions, four
different destinations. Under the natural id the service answers each pair alike; the perturbation
gives all four their own id.

The reason is that a thread renders post content in three places, and only replies sit inside
`[id^=post]`:

| block | selector | scoped by |
|---|---|---|
| replies | `[id^=post]` | its own id |
| wiki / community notes | `.communityNotesTab__post` | its class - a thread has exactly one |
| featured comments | `.featuredComment` | the post id in its own permalink |

`lno` restarts inside each block, which is why two blocks both start at 1. 26.11.26 scoped only the
first, so links in the other two were separated by `trd` alone - fine while their anchor texts differ,
which on this thread they do, but nothing guaranteed it.

Also corrected: `lno` is **not** simply "the index within a post". On page 2 of thread 19854408 the
first-post render is `lno=1` and the next post's links are `lno=2,3,4` - the count spans the block as
rendered, and the visible `/click` links need not start at 1 because unwrapped links take numbers too.

**A link that states its own host states nothing** (26.11.27). maxnl reported five links in one post
of thread 19632174 staying wrapped while a sixth resolved. The browser table settled it in one pass,
and it is the third variation on the same theme.

| link | states | actually goes to | 26.11.26 |
|---|---|---|---|
| `Paze`, `participating stores`, `FAQ`, `participating banks`, `here` | `slickdeals.net` | **paze.com** | rejected, left wrapped |
| `original post` | `slickdeals.net` | slickdeals.net | accepted |
| the same paze.com pages linked from post content | `paze.com` | paze.com | accepted |

These are `slickdeals.net/click?…` wrappers. An anchor giving its exit website as `slickdeals.net` is
the wrapper describing itself - true of every link on the site, so it distinguishes none of them. The
check read it as a destination claim, found paze.com instead, and discarded a correct answer. The one
link that passed was the one that really does stay on slickdeals.net.

So a stated host equal to **the link's own host** is treated as no claim, exactly as prose is. Nothing
is keyed to a domain: the rule is "the anchor names the site it already is", which is information-free
wherever it appears. Leaving those unchecked is safe because the check was never what protected them -
a link with `pno` already has an id unique to it, and a post link is asked under a perturbed one, so
either way the answer was resolved for that exact URL and cannot be another link's.

Three times now the same shape of bug: `trd` (26.11.13), prose in `data-product-exitwebsite`
(26.11.24), and now the attribute naming the wrapper's own host. **A signal that cannot distinguish
the cases it is asked to distinguish is not a weak signal, it is no signal**, and reading one as a
contradiction rejects correct answers invisibly. Every future check here should ask first: what values
can this field take where it tells me nothing?

And the measuring rule earned another entry. `curl` reported `paze.com` for the very links the browser
reports `slickdeals.net` for - the attribute itself differs between a signed-out fetch and a real
session, not just `u3`. Markup, not only destinations, has to be confirmed from a browser.

**A check that cannot be wrong has no job to do** (26.11.28). Two links in thread 19049776's wiki did
not resolve. Probing the live service told them apart at once, and only one was ours:

- `freetaxusa.com` - the service answers nothing usable, on the natural id and the perturbed one, on
  repeated tries. A resolver-side dead end. The link keeps its href and still works. *At 26.11.28* it
  was never cached as a failure - an empty answer was thrown out before the branch that records one -
  so it was re-asked on every load; **26.11.29 changed that**, and the answer is now remembered for a
  week like any other recorded failure. Nothing to fix here.
- `irs.treasury.gov/freetaxprep/` states `treasury.gov` and the service answers `https://www.irs.gov/`
  - which is correct; that URL really does redirect across hosts. The host check rejected it.

The second is the bug, and the fix is to notice what the check is *for*. It exists to catch an answer
belonging to a **different link**, arriving because ids collide. An answer to an id the service held
nothing for was resolved from this link's own `u3`, for this exact URL, so it cannot be another
link's - and a host that disagrees then means the destination genuinely moves hosts. The check had
nothing to catch and threw away a correct answer.

So it now runs only where a collision remains possible: `!ask.unique`. The links that still go through
it are the ones asked under an id they may share.

The generalisation, and it is the counterpart to the three "no signal" entries above: **a check needs
a failure mode it can actually catch.** Ask what it would be detecting on each path before running it
there - on a path where the thing it detects cannot happen, every rejection it makes is a false one.

**What the resolver will not answer, and what that leaves.** `freetaxusa.com` in thread 19049776
returns a well-formed empty destination - six bytes unmasking to `""` - under the natural id and the
perturbed one, with a `curl`-derived `u3` and with the real `u3` from a signed-in browser. It is a
deliberate "no destination", not a failure, so no retry helps.

Which raises the one source not yet used: the anchor's own text. Some links are labelled with the URL
they point at. Measured over every saved page: 24 of 248 `/click` links have URL-shaped anchor text,
15 of those carry a display ellipsis and are unusable, and **7 are complete with a host matching
`data-product-exitwebsite`** - resolvable with no request at all, `freetaxusa.com` among them.

Deliberately not built. It would point a link at what it *says* rather than at what the resolver
returns, and the two can differ; the host match narrows that but does not close it. Recorded as a
decision for maxnl rather than taken quietly - which is the same reason the domain lists came out.

**And now the reason the resolver refuses it, which changes the case.** maxnl asked why this fails
when Timex - also behind a referral network - worked. The difference is not the network, it is the
*kind* of redirect.

Fetching that `/click` URL once, without following redirects, returns **HTTP 200 with an HTML
interstitial**, not a 302. The interstitial carries `<meta http-equiv="refresh">` pointing at a
Commission Junction hop whose `url=` parameter holds `https://www.freetaxusa.com/`. The Timex chain
is HTTP redirects, which the service follows; this one starts with a meta refresh, which is not a
redirect at the HTTP level, so the service has nothing to follow and honestly answers "no
destination". Retrying cannot help, and the emptiness was never staleness - a `u3` five seconds old
behaves identically while its neighbours on the same page resolve.

So this is a whole *class*: any link Slickdeals serves as a meta-refresh interstitial is unresolvable
through the service, however many times it is asked. The destination is sitting in that interstitial,
but reading it means fetching the `/click` URL, and every such fetch mints an `ascsubtag` and
registers a click - the exact thing maxnl ruled out. The anchor text is the only source left that
costs nothing.

(Two diagnostic fetches of that URL were made to establish this. Diagnostic only, and not something
the script may ever do.)

**And it was being asked again on every load** (26.11.29). maxnl's follow-up: is that answer cached,
or does it keep retrying? It kept retrying. `decodeResolved()` returns `""` for an answer that is not
a URL, and the handler's `if (!response) return;` sat *before* every `SETTINGS(key, …)` call, so the
one terminal outcome that was never recorded was the one the service is most certain about.

The asymmetry is the tell: a link whose answer reached the wrong host - which might be a collision,
and might resolve differently next time - was remembered for a week, while a link the service
explicitly has no destination for was asked again on every single page load, for the life of the
install. Backwards. Both are now recorded the same way and expire the same way.

Note what makes this safe: a failed or rate-limited request throws higher up, before this point, so
only a *successful* answer carrying an empty destination is remembered. Nothing about a network
problem gets cached.

The generalisation: **enumerate the terminal outcomes and check each one is handled.** There were
three - resolved, wrong host, no destination - and two had a cache write. Missing the third cost a
request per page load on exactly the links that can never benefit from it.

**Code a change strands is not obvious from the change** (26.11.30). 26.11.28 narrowed the host check
to `!ask.unique`. Inside that branch `ask.unique` is therefore always false - so the ternary choosing
between `resolveNatural()` and `resolveFinalHop()` could only ever pick the second, and
`resolveNatural()`, added two releases earlier for exactly that fallback, became unreachable. Nothing
failed, no gate objected: `no-undef` only catches a name with no definition, never a definition with
no live caller. It sat there for two releases, with a comment describing behavior the code could no
longer produce - which is worse than the dead code, because the comment reads as documentation.

Found by asking of every helper "who calls this, and can that call still happen?" rather than by any
tool. Worth repeating after any change that narrows a condition: the branch not taken may have been
some function's only caller.

**A guard is cheap when the failure is total** (26.11.31). Two spots were left unguarded for several
releases on the reasoning that neither could fire - which was true, and checked: all 44 `[data-v-ID]`
rules parse, and `highlightCards()`'s selector list is a string literal. The reasoning was also
incomplete. What matters is not only *how likely* a failure is but *how bad*, and both of these fail
the same way: `fixCSS()`'s throw escapes `String.replace` and aborts `init()`, taking the entire
script down with no error a user would ever see, and `$$` swallowing an exception turns an empty
result into a TypeError.

Held off originally to avoid touching working code mid-churn, which was the right call at the time
and the wrong one to leave standing. Two lines, no behavior change, and the next person to add a CSS
rule cannot silently kill the script.

That is generic, needs no knowledge of any particular network, and works for one nobody has seen
before. It also resolves the rei.com post link, which the list never could - the collision and the
intermediate hop turn out to be the same question, asked twice.

The tell was having to write "add to this when an unfamiliar network turns up" in a comment. A rule
that needs a growing list of exceptions is usually the wrong rule.

**A check needs its false positives measured, not assumed** (26.11.13 -> 26.11.21). `isDestinationPlausible()`
rejects an answer whose host contradicts the one the anchor states. Twice this session a false
positive was suspected, then dismissed as an artifact of fetching pages outside a browser - and it
was real. Measured from maxnl's own session with Debug on: both `timex.com` links on thread 19856376
resolve to `flexoffers.com/links/?cid=<unique per link>&p=170370`, correct per-link answers thrown
away for naming an affiliate network rather than the shop.

An affiliate network is transit, never another link's destination, so it cannot be the collision the
check exists to catch. 26.11.21 passes a list of them through. The answer is opaque - `?cid=…&p=…`,
nothing in it names timex - so there is no way to recognize one by shape; the list needs adding to
when an unfamiliar network appears, and the symptom is a link that stays unresolved with a
"destination discarded" line naming something that is plainly a network rather than a shop.

Also worth knowing: the service returns the network's **first hop** when answering from its cache and
the **final merchant URL** when it resolves on demand. Both are correct; only the first looks wrong
to a host comparison.

**One sample cannot tell you a parameter is inert** (26.11.14 -> 26.11.20). Perturbing `lno` to
dodge the id collision was measured on exactly one link, the rei.com post link, where the answer
survived the change. That licensed treating `lno` as an index the destination does not depend on. It
is not: a deal body's variant links are `&lno=3&trd=Khaki`, `&lno=6&trd=Black`, and `lno` selects the
variant. Seven color links each with their own ASIN all resolved to the deal's default product.

The same mistake as 26.11.13's `trd` reading, in the same place, three days apart - and with the
lesson from it already written in this file. Validating on one sample tells you the sample is
consistent with your explanation, nothing more. The discriminating case here cost one command:
compare two links whose only difference is the parameter you intend to change.

Worse, it was self-concealing. The wrong destination is a real Amazon product page on the right
host, so `isDestinationPlausible()` passes it, the link turns green, and it looks resolved. It was
found only because maxnl knew what those links should point at and opened the untouched originals.

Reverted entirely in 26.11.20. A colliding answer is now rejected and the link left alone - honest,
and visibly unresolved - rather than replaced by a differently-wrong one that cannot be told from a
right one.

**Fixing an asymmetry on one path does not fix it on the other** (26.11.14 -> 26.11.18). The retry
applies its answer without the plausibility check, because an answer resolved for one exact URL cannot
be another link's. The cached branch went on checking every non-`u2` destination on the way back out.
So any link whose genuine destination sits on a host its anchor does not state - an affiliate
redirector like `track.flexlinkspro.com` for a `timex.com` link - discarded its own cache entry on
every page load, re-asked, got the same answer, re-applied and re-cached it. Two requests per page
load for the life of the install, and the cache never settling for exactly the links that most need
it. Nothing looked broken: the link resolved correctly every time.

26.11.16 fixed this shape for links asked under a unique id and stopped there. The identical
asymmetry on the shared path survived two further reviews because both were spent confirming the
half already fixed. Found by simulating five consecutive page loads of one link rather than reasoning
about a single load - a state machine that settles and one that oscillates look the same if you only
ever run one step.

The fix removes the cached check outright rather than narrowing it again. It is no longer needed:
everything in the cache was written by current logic and is trustworthy, either because it passed the
check when it arrived or because it came from a unique id, and legacy entries were dropped once on
the way in to 26.11.16.

**Skipping a check also skips its cleanup** (26.11.15 -> 26.11.16). 26.11.15 stopped checking a
cached destination for links asked under an id of their own, which is right on its own terms: such an
answer was resolved for that exact URL and cannot belong to another link. What it missed is that the
same check was doing a second job - deleting wrong destinations cached by *earlier* versions, which
were written from the shared id and can be collisions. Those are post-content links, exactly the ones
most likely to hold a wrong answer, and the guard silenced their cleanup. A destination cached before
26.11.15 would have been handed out for as long as the entry survived, with no way to notice.

Found by reading the shipped diff rather than from a symptom, and only because the comment directly
above the guard still said what the check was for: "can be an id collision that was written before
this check existed, so drop it rather than keep handing it out". The fix is a one-off `links.clear()`
in the version-upgrade block, since nothing records which id an entry came from. The general shape:
before narrowing a condition, check what else depends on it running - a guard that is correct for
the case you are thinking about can disable a case you are not.

**A collision-free cache key does not make the answer right** (26.11.13). #24 established that
`getUrlId()` must keep upstream's shape and that collision-freedom belongs in `getCacheKey()`. That
is still true, and it is still not enough: keying the *cache* per link stops one link inheriting
another's destination locally, but the resolver is still addressed with the ambiguous id, so it can
answer a rei.com link with an amazon.com destination and the cache faithfully stores it under the
right key. The tell was an `ascsubtag` inside the wrong destination that belonged to a different
pageview — proof the value came off the wire and not out of our own cache. The lesson generalises:
when an id sent to a third party is known to collide, every answer that comes back on it is a claim,
not a fact, and needs checking against something the request itself carries.

**Backticks inside CSS comments, four times.** The entire stylesheet is one template literal passed
into the IIFE. A backtick in a comment terminates it. Caught by `node --check` every time, but only
because it is run every time.

**CSS specificity against the host page, three times.** `#top_userbar a` is (1,0,1). A reset written
as three classes and a type is (0,3,1) and loses. The fix is `!important`, not more selectors —
an `#top_userbar` prefix would break if the host were ever mounted elsewhere.

**Fixtures that did not reproduce the page.** Twice a fixture lacked the page's competing ID rules,
so a losing rule looked like a working one. Once a fixture carried the page's font-weight and
text-shadow but not its color, so removing `text-shadow` without reclaiming `color` produced white
text on a white panel and the fixture showed nothing wrong. Fixtures now extract the real stylesheet
from the script and measure computed values rather than being eyeballed.

**One PR shipped four regressions behind one real fix** (#1 → #21, #24). Volatile parameters in the
cache key, a hyphen breaking ids, a lost gate, and the id format itself. All four passed
`node --check`; all four were found only from live HARs and console output.

**`return` where `continue` was meant.** In `processLinks`, a `return` aborted the whole loop, so as
soon as two links on a page shared an id every remaining link went unprocessed. The `u2`
double-decode had the same shape: `URIError` on a URL containing a bare `%` propagated out and
killed link processing for the rest of the page.

**A silent `str.replace()` no-op.** A changelog edit used a real newline in its search string while
the file stored a literal `\n`; Python's `str.replace` no-opped without complaint and a wrong
changelog entry shipped. Edits are now made with tools that fail loudly, and read back afterwards.

**Matching boxes is not matching what the eye sees** (#34 → #35). Equal margins put the version
label 17px from the right and 21px from the bottom, because the label has no descenders and 4px of
empty descender space sits inside its line box. Fixed by rendering the label and scanning for its
last inked pixel.

---

## Caveats for anyone editing this

### `VERSION` is load-bearing

```js
fetch(api + VERSION + "/" + id, {method: "SD", ...})
```

`VERSION` is a **path segment in the resolver's URL**. Increment it freely; do not change its
*shape*. It is not known whether the service parses that segment or merely logs it, and if it parses,
a suffix fails as a silent 404 that stops every link resolving. This is why the fork marker lives in
a separate display-only `FORK` constant. The release workflow enforces that `@version` and
`const VERSION` agree so they cannot drift.

### The stylesheet is a template literal

No backticks and no `${` anywhere in the CSS, including inside comments. Always run:

```sh
node --check 'Slickdeals+.user.js'
# expect exactly 2 — the literal's own opening and closing delimiters
sed -n '/^})(`/,$p' 'Slickdeals+.user.js' | grep -c '`\|\${'
```

### Adding a layout means touching five places

This is the recurring gap. Free/diff/score support for a layout needs all of:

1. `processCards()` price selector
2. `processCards()` `closest()` card list
3. `highlightCards()` card selector, and its vote-count selector
4. Paint CSS — `background-color: var(--backgroundColor)` for non-Vue layouts
5. Filter CSS — the `freeOnly` / `diffOnly` / `ratingOnly` hide rules

Miss any one and the feature is silently inert on that layout. Every classic-layout bug in this fork
was one of these five, and 26.11.19 found two more layouts in the same state - each discovered by
counting selector matches against real page HTML rather than by anyone noticing:

| Layout | Card | What was missing |
|---|---|---|
| `/deals/` list | `div.dealRow` | the card itself - unknown to `closest()`, `highlightCards()`, paint and filter CSS, so **0 of 50** priced cards found a card ancestor |
| Homepage list (`fpStyle=list`) | `li.frontpageGrid__feedItem > article.dealCardList` | the price class `.dealCardList__salePrice`, and paint - the card reads no Vue custom property, so `--backgroundColor` painted nothing |

Both are structurally limited beyond that, and no amount of selector work changes it: neither renders a
comparison price, so price-difference highlighting cannot apply, and the homepage list view renders no
vote count at all, so score highlighting cannot either. Free highlighting and Free Only work in both.

**The check that finds these takes a minute**: fetch the page, run the price selector and the card
selector over it, and count how many priced elements can reach a card ancestor. Anything short of all
of them is a layout the script is silently inert on.

### Other things that will bite

- **`processedMarker` is `℗`** (U+2117), used as a class name. Valid CSS, surprising in a grep.
- **`trd` on a `/click` link is the link's own anchor text**, not its destination, with runs of
  non-alphanumerics collapsed to `+` and cut at 32 characters. `Dark Gray` stores `Dark+Gray`,
  `Deal Image` stores `Deal Image`. 26.11.13 read it as the destination and rejected 228 of 287
  sampled links; 26.11.14 stopped using it. It looks like a URL only when the anchor text *is* one.
  Note `URLSearchParams.get("trd")` returns it with the `+` separators as spaces.
- **`data-product-exitwebsite` is the destination host**, stated bare on the anchor (`rei.com`,
  `amazon.com`). This is what `isDestinationPlausible()` compares against. Sampled over 287 links on
  25 threads: hostname-shaped every time, 15 distinct hosts, never a merchant name. Written
  `data-product-exitWebsite` in the markup, so the dataset key is `productExitwebsite`. About one
  anchor in ten omits it, and those pass through unchecked.
- **`SETTINGS(id, null)` deletes**, but only for link-cache ids (`/^\d/`). Settings are unaffected —
  `css` is legitimately stored as null and goes through `settings.set()` directly.
- **`Map` eviction is FIFO, not LRU.** Re-setting an existing key does not move it. FIFO already
  keeps the most recently *added* entries; evicting those instead would be strictly worse. LRU -
  keeping the most recently *used* - only changes anything once the cap is reached, and it is not:
  an organically grown cache reached 566 entries against a 3000 cap.
- **`LINKS_MAX` is 5000**, raised from 3000 in 26.11.16. It was introduced at 3000 in v26.10.2
  ("Cap the link cache instead of waiting for a quota failure") and has never been lowered - the only
  changes to it or the eviction loop are that commit and the raise. Raising it further is the cheaper
  first move if the cache is ever pinned at the cap, but around 6000 (~2.3MB) is the sensible
  ceiling: 10,000 would be ~3.8MB, too close to a 5MB quota shared with the settings blob and
  slickdeals.net's own storage, and the failure mode above it is not a clean refusal - it is
  `settingsSave()` evicting in a loop to make each write fit.
- **Cache sizing, measured** (26.11.15): destinations run 59-321 characters, mean 181; with a
  13-character key and JSON punctuation an entry costs about 200 characters. localStorage is
  accounted in UTF-16 code units, so ~2.0MB at the 5000 cap and ~0.22MB at the 566 seen in
  practice, against a typical 5MB origin quota shared with the settings blob and slickdeals.net's
  own storage. The earlier 100-150 character estimate was low.
- **`URLSearchParams.get()` already percent-decodes.** Do not wrap it in `decodeURIComponent`.
- **`initMenu()` requires** at least 4 children on its host, a `<header>` ancestor
  (`closest("header")` matches self), and a `data-v-1` dataset key — `fixCSS()` resolves the script's
  `[data-v-ID]` selectors by matching `/^v([A-F]|-\d)/`.
- **`datasets` is a Proxy** that writes to every registered dataset but reads only the first, and
  dataset values are strings.
- **localStorage keys are string literals** (`"slickdeals+"`, `"slickdeals+links"`), independent of
  script identity — renaming the script cannot orphan settings or the cache.
- **A threshold of 0 switches its feature off.** `SETTINGS.highlightRating && …` — `0 &&` is falsy,
  so score and price-difference highlighting do nothing until set above zero. This is not a bug, but
  it looks exactly like one.
- **`debug()` is `fVoid` unless `SETTINGS.debug === 1`,** and its arguments evaluate eagerly. Do not
  reference the `colors` map outside the `noAds` IIFE — it is unreachable and would throw inside the
  error handler itself, even with logging off.

### Clearing the link cache

```js
localStorage.removeItem("slickdeals+links"); location.reload();
```

---

## Outstanding items

None of these is a defect; all are known and deliberate.

> **Read the strikethroughs.** Rows written `~~like this~~` are **finished** and kept only for the
> history of what was wrong and how it was found. They are not work. Only the un-struck rows are
> live, and every one of them is either a design choice or a limit that cannot be reached in
> practice - none is a task waiting to be picked up.

| Item | Status |
|---|---|
| `.tracked` is written but never styled | A hook with no look attached. Making it visible is a design choice — see [enhancements](#suggested-enhancements). |
| Price-difference highlighting on the classic **front page** | Structurally limited. Cards carry no comparison price, and the "Deal Editor's Notes" research block is Quick View content — reaching it for every card would mean one request per deal. |
| `diffOnly` / `ratingOnly` settings | Reachable in code and CSS, but their `createMenuItem()` calls are commented out, so only `freeOnly` is usable from the menu. Kept in step so re-enabling them is a one-line change. |
| Classic menu mounts on `window load` | Appears late on slow pages. The `document-start` call runs before any bar exists. |
| `getUrlId` requires hostname exactly `slickdeals.net` | A `www.` variant would be skipped. Not currently served. |
| Ad sweep: `node.parentElement.matches(...)` unguarded | Would throw on a detached node. Nodes from `querySelectorAll` and `MutationObserver` always have a parent. |
| ~~Color-variant deal-body links stopped resolving in 26.11.13~~ | **Fixed in 26.11.14.** Confirmed `trd` carries the anchor text; the check now reads `data-product-exitwebsite`. All 7 color variants resolve to their own ASINs again. |
| ~~`isDestinationPlausible()` rejects an affiliate hop on an unrelated domain~~ | **No longer holds a link back.** A `timex.com` link really does resolve to `www.flexoffers.com`; verified end-to-end on both id shapes, it now unwraps either by skipping the check (unique id) or by being retried and applied (shared id). Note the unwrap is of limited use on such links - the destination is itself a redirector that forwards on to the merchant. |
| An unwrapped destination can be an affiliate redirector | `flexoffers.com`, `go.loaded.com`, `goto.walmart.com`. Unwrapping removes the Slickdeals hop, not every hop. Nothing to fix - it is the genuine destination - but it is why a `.tracked`-style badge showing the real host would be worth more than it first appears. **Do not try to resolve one of these through the service**: it derives the id from the URL submitted and requires it to match the id in the path, and a non-Slickdeals URL derives no id at all, so every such request is refused with 404 / error `7.122`. Measured on the `flexoffers.com` destination above under three different ids. `getUrlId()` returns `false` for those hostnames anyway, so the script never asks. Following the hop would mean fetching the redirect ourselves, which registers an affiliate click - see the note against the `/click` 302 in `MAINTAINING.md`. |
| ~~The REI post link does not unwrap~~ | **Fixed in 26.11.14** by the unique-id retry. Fixture thread now unwraps 13 of 13. |
| Quick View links resolve correctly | Confirmed in a browser: expanding a listing card shows links blue then green moments later, i.e. injected markup is picked up by the MutationObserver, processed and unwrapped. This path cannot be sampled offline - listing pages carry no `/click` links until a card is expanded - so the browser check is the only evidence there is, and it is positive. |
| No cached destination is re-checked, for any link | **Links are cached exactly as before** - first load resolves and stores, later loads are cache hits with no request. What no longer happens, since 26.11.18, is the plausibility check re-running on the way *out* of the cache. It is unnecessary: everything in the cache was written by current logic, either passing the check when it arrived or coming from an id unique to that link, and legacy entries were dropped once on the way in to 26.11.16. It was also actively harmful - see [issues we hit](#issues-we-hit) for the every-page-load loop it caused. The residual is that a wrong answer, if the service ever gave one to a checked or unique lookup, would persist until the 5000-entry cap evicted it. Symptom: one link resolving somewhere wrong and staying wrong across reloads while its neighbours are fine. Remedy: `localStorage.removeItem("slickdeals+links")`. A TTL would close it properly if it ever bites — one exists for *failures* since 26.11.29 (`RESOLVE_RETRY_AFTER`, one week); extending it to successful destinations would be the fix. |
| ~~The resolver is asked with unbounded concurrency~~ | **Measured in a browser, and it is fine.** Thread 19049776 on a cold cache at 26.11.31: **35 requests, peak 35 concurrent, 0 failed**. Peak equalling the total confirms the no-queue reading exactly - all 35 went out in one burst - and the service served every one. The "roughly 4 at a time" figure came from separate curl connections; a browser multiplexes over one HTTP/2 connection and does not trip it. **No queue is needed, and none should be added without a fresh measurement showing failures.** The command is in `MAINTAINING.md` §1a. |
| ~~`fixCSS()` and `highlightCards()` could be killed by one bad CSS selector~~ | **Guarded in 26.11.31.** `fixCSS()` wraps its `querySelector` in a try/catch returning the selector unresolved; `highlightCards()` has the `\|\| []` that `processLinks()` always had. Neither could fire - 44 of 44 rules parse and both selector lists are literals - but both failed totally and silently. |
| `settingsSave` recursion up to 10,000 | Bounded, and batches grow as `attempt²`, so an observed 566-entry cache drained in 12 rounds. Deep but not reachable in practice. |

---

## Suggested enhancements

Not started — recorded for later review. Roughly ordered by value-to-effort.

**Keyword mute list.** A textarea of words or patterns; cards whose title matches get hidden. This is
the `freeOnly` mechanism with a different predicate, so it reuses the settings, class-toggle and
filter-CSS machinery that already exists. The front page is heavy with categories a given user never
wants.

**Destination domain badge.** After unwrapping we know the real target. Showing `amazon.com` or
`walmart.com` on the card tells you whether it is a major retailer or an unknown reseller *before*
clicking. Slickdeals renders `[domain]` itself in editor-composed deal bodies but not in forum posts,
so this would fill in exactly the links it leaves bare — and would show the true destination rather
than the one their template asserts. This is also the natural use for `.tracked`: mark the links we
could not unwrap.

**~~Validate destinations against `data-product-exitwebsite` instead of `trd`.~~** Done in 26.11.14.
Sampled first, as the entry asked: 287 links over 25 threads, hostname-shaped every time across 15
distinct hosts, never a merchant name. `trd` was dropped rather than kept as a fallback — it carries
the anchor text, so falling back to it would reintroduce the false rejections being repaired.
Confirmed at the same time: the full destination is **not** recoverable from the page. The only
`rei.com` URL in the post's markup is the abridged link *text*
(`https://www.rei.com/learn/expert-...ction.html`), so the resolver remains the only source.

**Cap the resolver's concurrency.** `processLinks()` fires `resolveUrl()` for every link in its loop
with no `await` and no queue, so a thread with 47 resolvable links opens 47 simultaneous requests.
The service does not serve them: measured over separate connections, 12 requests at concurrency 1
all succeeded, while 8 or more in flight lost two thirds. Sequentially 30 requests at 200ms spacing
lost 2. So the constraint is concurrency, not volume, and a small queue (4 in flight, say) would
resolve every link on a page rather than most of them.

**Measure this from a browser before acting on it.** The numbers above come from separate `curl`
processes, each with its own TLS handshake, from a datacenter IP with no session cookies. A browser
issues the same requests as multiplexed streams over a single HTTP/2 connection, which may not trip
the limit at all — and if it did trip it this badly, unresolved links would be the norm rather than
the exception. Confirm against a real page before adding machinery for it.

**Local price history.** Store `{dealId: [{price, date}]}` alongside the link cache and flag a card
when the same item was posted cheaper before. Entirely local. "Is this actually a good price" is the
question the current percent badge only half answers, since it trusts the merchant's own list price.

**Parse the Deal Editor's price research.** On deal detail pages and in already-expanded Quick View
panels, the notes contain e.g. *"this is $33 lower than the next best comparable online prices
starting from $63.99"*. Usable **only where the content is already loaded** — never by expanding
cards. Three caveats: it is prose, not markup, so wording varies by editor; it is a competitor price
rather than a list price, so it means something different from `data-deal-percent`; and it is
research at posting time. Probe wording variance across several deals before trusting a parser.

**Dismiss a deal.** An × that hides a card permanently by id. The front page repeats heavily.

**Sort by discount.** `data-deal-percent` is already computed on every card; a sort control would
just reorder on a value that exists.

---

## Licensing

Upstream is MIT. This fork keeps the licence, retains V@no's attribution in `@author`
(`maxnl (fork of Slickdeals+ by V@no)`), and links back to the upstream repository from the README.
`@namespace` is unchanged. None of this is intended for upstreaming.
