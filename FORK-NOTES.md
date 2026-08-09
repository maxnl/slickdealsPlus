# Fork Notes

Working reference for [maxnl/slickdealsPlus](https://github.com/maxnl/slickdealsPlus), a fork of
[vanowm/slickdealsPlus](https://github.com/vanowm/slickdealsPlus) by V@no (MIT).

| | |
|---|---|
| Forked from | `b2c6ac8`, 2025-07-19, upstream **v25.7.18** |
| Current | **v26.11.15** |
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
| 26.10.7 | [#19](https://github.com/maxnl/slickdealsPlus/pull/19) | Recognise the classic layout's deal cards |
| 26.10.8 | [#20](https://github.com/maxnl/slickdealsPlus/pull/20) | Restore menu text colour, stop the loading counter overflowing |
| 26.10.9 | [#21](https://github.com/maxnl/slickdealsPlus/pull/21) | Stop breaking the resolver with hyphenated ids and nav links |
| 26.10.10 | [#22](https://github.com/maxnl/slickdealsPlus/pull/22) | Keep the menu overlay out of the top bar's layout |
| 26.10.11 | [#23](https://github.com/maxnl/slickdealsPlus/pull/23) | Reset inherited text properties as a category, tidy the changelog |
| 26.11.1 | [#24](https://github.com/maxnl/slickdealsPlus/pull/24) | **Send the resolver the id it recognises, cache under our own key** |
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

---

## What changed, by theme

### Link resolving and unwrapping

**The resolver id and the cache key are two different things** (#24). This is the single most
important structural change, and getting it wrong broke every link.

- `getUrlId()` produces the id the third-party service is addressed with, and which its response is
  XOR'd against. The service only recognises ids in its own shape. An earlier change redefined it to
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
`[resolver host redacted - assembled at runtime, see the encoded string at the foot of the script]` - V@no's own host, decoded from the obfuscated argument at the
foot of the script, not a Slickdeals service.

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
ids (`1311423pno19854408sdtid3lno`) are already unique, and all seven colour variants resolve to
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

**A rejected answer is asked again under a unique id** (26.11.14). Rejecting a wrong destination
leaves the link unwrapped, which is safe but not the point of the script. Since the service resolves
any id it holds no entry for, `resolveFresh()` replaces `lno` with the link's own cache key and
re-derives the id from the modified URL, so the collision cannot happen and the answer is resolved
for that exact link:

```
19854408sdtid1lno           -> amazon.com/gp/product/B0GTNLL1H8   (cached, wrong)
19854408sdtid1433451321lno  -> rei.com/learn/expert-advice/...     (fresh, right)
```

Both halves are sent because the service checks that the id agrees with the URL. The cache key is
stable per link, so a repeat visit reuses the entry rather than minting another - and because it is a
deterministic crc32, every user of this fork derives the same unique id, so the shared cache still
does its job. Every failure path yields `""` and writes nothing: `decodeResolved()` rejects an absent
body, a non-ok `Response`, an empty buffer and anything that does not decode to an `http(s)` URL. The
retry is chained inside the existing promise so the in-flight accounting in `.finally()` still runs
once per link.

**An ambiguous id is recognised before it is asked** (26.11.15). Whether an id can collide is
knowable from the link alone: `lno` present and `pno` absent means a post-content link, whose index
restarts in every post. `resolverRequest()` sends those to a unique id from the start, so a link
whose answer would have been wrong costs one request rather than two, and never costs more than one.
Deal-body links carry `pno`, are unique already, and keep asking under upstream's id.

**An answer to a unique id is not checked at all - on either path.** The check exists to catch one
thing, an answer belonging to a different link that shares this one's id, and an answer resolved for
this exact URL cannot be that. This has to hold for the cache as well as for a fresh answer:
`resolverRequest()` is therefore called before the cached-destination branch, not just before the
request. Checking only on the way out of the cache would discard a destination that was applied
unchecked when it arrived, re-request it, apply the same answer again and cache it again - once per
page load, indefinitely. This is the same reasoning that lets the retry apply its answer unexamined, and
applying it to both paths is what keeps them consistent: the first draft of this change trusted an
answer arriving by one route and rejected the identical answer arriving by the other.

**The service resolves from `u3`, and `u3` is not the same outside a browser.** A signed-out `curl`
fetch of a page yields links whose `u3` encodes a different destination from the one a real session
gets. The same `timex.com` link answered `www.flexoffers.com` for a curl-fetched URL and the true
`timex.com` product URL - `?cjdata=…&utm_campaign=…FlexOffers.com` - in a browser with the link cache
cleared. Both answers are honest replies to different questions.

This invalidates measurements taken here from outside a browser, including the claim recorded in an
earlier draft that the host check has a "known false positive" on affiliate hops. It does not, on the
evidence available: in a real session that link resolves to the host the anchor states. The
comparison of shared against unique ids over 26 post-content links was apples-to-apples (both used
the same `u3`), but its absolute destinations describe the fetch and not the link, so it cannot rule
out the shared id being better in a real session. **Verify from a browser before trusting anything in
this section.**

**Failure handling** (#36). The promise chain ended in `.catch(console.error)`, so every unresolvable
link printed a red stack trace; a page carries hundreds. Now routed through `debug()`. The group
reclaim test changed from "did it resolve" to "is anything still in flight", which fixes a leak
(failed groups were never reclaimed) and a hazard in the other direction (a group with a second
request in flight could be deleted out from under that request's closure).

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
"colour-variant links stopped resolving"; it was closer to all link resolution stopping. Estimating
the blast radius of a bug from the one report that surfaced it is its own version of the same
mistake.

The failure is the same shape as #1, committed in the same breath as a warning about it. The rule
that would have caught it: find the case that tells your explanation apart from its rival, and test
*that* one.

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
text-shadow but not its colour, so removing `text-shadow` without reclaiming `color` produced white
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
was one of these five.

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
- **`LINKS_MAX` has always been 3000** and has never been lowered. It was introduced in one commit
  (v26.10.2, "Cap the link cache instead of waiting for a quota failure") and nothing has touched it
  or the eviction loop since. If the cache ever does sit pinned at the cap, raising it is the cheaper
  first move - a one-line change with no new failure modes. At ~200 characters an entry the practical
  ceiling is around 6000 (~2.3MB); 10,000 would be ~3.8MB, too close to a 5MB quota shared with
  other storage.
- **Cache sizing, measured** (26.11.15): destinations run 59-321 characters, mean 181; with a
  13-character key and JSON punctuation an entry costs about 200 characters. localStorage is
  accounted in UTF-16 code units, so ~1.14MB at the 3000 cap and ~0.22MB at the 566 seen in
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

| Item | Status |
|---|---|
| `.tracked` is written but never styled | A hook with no look attached. Making it visible is a design choice — see [enhancements](#suggested-enhancements). |
| Price-difference highlighting on the classic **front page** | Structurally limited. Cards carry no comparison price, and the "Deal Editor's Notes" research block is Quick View content — reaching it for every card would mean one request per deal. |
| `diffOnly` / `ratingOnly` settings | Reachable in code and CSS, but their `createMenuItem()` calls are commented out, so only `freeOnly` is usable from the menu. Kept in step so re-enabling them is a one-line change. |
| Classic menu mounts on `window load` | Appears late on slow pages. The `document-start` call runs before any bar exists. |
| `getUrlId` requires hostname exactly `slickdeals.net` | A `www.` variant would be skipped. Not currently served. |
| Ad sweep: `node.parentElement.matches(...)` unguarded | Would throw on a detached node. Nodes from `querySelectorAll` and `MutationObserver` always have a parent. |
| ~~Colour-variant deal-body links stopped resolving in 26.11.13~~ | **Fixed in 26.11.14.** Confirmed `trd` carries the anchor text; the check now reads `data-product-exitwebsite`. All 7 colour variants resolve to their own ASINs again. |
| ~~`isDestinationPlausible()` rejects an affiliate hop on an unrelated domain~~ | **No longer holds a link back.** A `timex.com` link really does resolve to `www.flexoffers.com`; verified end-to-end on both id shapes, it now unwraps either by skipping the check (unique id) or by being retried and applied (shared id). Note the unwrap is of limited use on such links - the destination is itself a redirector that forwards on to the merchant. |
| An unwrapped destination can be an affiliate redirector | `flexoffers.com`, `go.loaded.com`, `goto.walmart.com`. Unwrapping removes the Slickdeals hop, not every hop. Nothing to fix - it is the genuine destination - but it is why a `.tracked`-style badge showing the real host would be worth more than it first appears. **Do not try to resolve one of these through the service**: it derives the id from the URL submitted and requires it to match the id in the path, and a non-Slickdeals URL derives no id at all, so every such request is refused with 404 / error `7.122`. Measured on the `flexoffers.com` destination above under three different ids. `getUrlId()` returns `false` for those hostnames anyway, so the script never asks. Following the hop would mean fetching the redirect ourselves, which registers an affiliate click - see the note against the `/click` 302 in `HANDOFF.md`. |
| ~~The REI post link does not unwrap~~ | **Fixed in 26.11.14** by the unique-id retry. Fixture thread now unwraps 13 of 13. |
| Quick View links resolve correctly | Confirmed in a browser: expanding a listing card shows links blue then green moments later, i.e. injected markup is picked up by the MutationObserver, processed and unwrapped. This path cannot be sampled offline - listing pages carry no `/click` links until a card is expanded - so the browser check is the only evidence there is, and it is positive. |
| The resolver is asked with unbounded concurrency | `processLinks()` fires every link's request at once. Measured over separate connections the service serves roughly 4 at a time; a browser's single multiplexed connection may behave differently, and that has not been measured. Failure is graceful and self-healing — an unresolved link is never cached, so the next page load retries it — so this costs unresolved links on one pageview, not correctness. See [suggested enhancements](#suggested-enhancements). |
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
