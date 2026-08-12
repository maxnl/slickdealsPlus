# Handoff — link resolution

State as of **v26.11.28**. Read with [`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable
architecture notes and the full history of what was tried and why it failed. This file holds only
what a new session needs to pick the work up.

The authoritative statement of the rules now lives **in the code**: a header block above
`resolveUrl()` in `Slickdeals+.user.js` lists the six load-bearing constraints and why each cannot
be casually changed. Read that first. It is deliberately in the source rather than here, because
every regression in this repo came from changing the code without reading the history.

---

## 1. Where things stand

Released and current: **v26.11.28**, confirmed in a browser for the Amazon variants, the rei.com
link, the Timex links, a wiki thread, a multi-post thread and a thread whose wiki links state a host
they do not end on.

| version | state |
| --- | --- |
| 26.11.23, .24 | broken, superseded - shipped a call to a function deleted in the same commit |
| 26.11.25 | good - restored it, added the `no-undef` release gate |
| 26.11.26 | good, superseded - one request per link, `pv`/`au` cache-key fix, remembered failures |
| 26.11.27 | good, superseded - a link stating its own host is no longer read as a claim; wiki and featured-comment scoping |
| 26.11.28 | **current** - the host check runs only on ids that can be shared, so a cross-host redirect resolves |

Confirmed working in a browser: all eight Amazon colour variants keep their own ASINs, the rei.com
post link resolves, both Timex links resolve, the wiki block resolves, and the three links in post 21
of thread 19854408 resolve to three different destinations.

**Anyone upgrading from 26.11.26 should clear the link cache** - a link rejected under the old rule
is remembered as failed for a week:

```js
localStorage.removeItem("slickdeals+links"); location.reload();
```

---

## 3. What still needs a browser

Nothing on the list below has been settled; everything previously here has been.

- **Whether `unwrapLinks` ever fires anywhere.** Across every saved page - 248 `/click` links - **not
  one carries `u2`**, so the local-unwrap path never runs on anything sampled. The setting may be
  dead entirely, or `u2` may only appear on link shapes not sampled here. Do not remove it on this
  evidence alone - confirm from a browser across a few page types first.
- **Whether to unwrap from the anchor text.** Some links show their destination as their own label.
  Measured: 24 of 248 have URL-shaped anchor text, 15 of those are visibly truncated with an ellipsis
  and unusable, leaving **7 that are complete and whose host matches `data-product-exitwebsite`** -
  unwrappable with no request at all. That set includes the one link the resolver refuses (below).
  Not built: it would point a link at its displayed URL rather than at a resolved one, which is a
  behaviour change maxnl should decide on rather than inherit.
- **Concurrency.** See below.

*(A wiki or featured-comment block holding two same-text links is no longer on this list. It is hard
to find in the wild, so `test/cachekey.js` now covers it with a fixture instead: two featured
comments, a wiki block and a reply, all holding the identical URL and anchor text, asserted to key
differently and to key stably across loads.)*

## 4. Open, not acted on

**A whole class the resolver cannot answer: meta-refresh interstitials.** `freetaxusa.com` in thread
19049776's wiki (`lno=14`) is the example. The service returns a well-formed *empty* destination -
a few bytes unmasking to `""` - under the natural id and the perturbed one, with a `curl`-derived
`u3`, with the real `u3` from a signed-in browser, and with a `u3` five seconds old while its
neighbours on the same page resolve normally. Staleness is ruled out.

The cause: that `/click` URL answers **HTTP 200 with an HTML interstitial**, not a 302. It carries a
`<meta http-equiv="refresh">` to a Commission Junction hop whose `url=` parameter holds the real
destination. Timex - also behind a referral network - is a chain of HTTP redirects, which the service
follows. A meta refresh is not an HTTP redirect, so there is nothing to follow and the service
answers honestly. No retry can help.

Reading the interstitial ourselves would mean fetching the `/click` URL, which mints an `ascsubtag`
and registers a click - ruled out. The anchor-text option above is the only free source.

**The 26.11.19 colour collapse is still unexplained.** Its `resolverRequest()` returned the natural
id whenever `pno` was present, so it never touched a deal body's links — yet the colours collapsed.
The `u3` gate makes the current code safe regardless, but the cause is unknown, so watch the colours
on the first load after any change in this area.

**Unbounded concurrency.** `processLinks()` fires every request with no queue. Measured over curl the
service serves ~4 at a time; a browser multiplexes over one HTTP/2 connection and may not trip it at
all. Deliberately not acted on — measure from a browser first.

Failure is graceful, and this was re-checked when the negative cache went in. A rate-limited or failed
request never reaches the branch that records a failure: `resolveUrl()` catches network errors to
`undefined` and passes a non-ok response through unchanged, and both are thrown out at the top of the
handler, before any `SETTINGS(key, …)` call. Only a *successful* answer that reaches the wrong host,
whose fallback also reaches the wrong host, is remembered. So a rate-limited link stays `notResolved`,
keeps its own href, and is asked again on the next page load — no timer, no in-page queue, no
week-long marker.

**Two latent traps, deliberately not patched.** Neither is a live bug; both are ways a future edit
turns into a whole-script failure, so they are written down rather than guarded, to avoid another
change in an area that has been churned enough.

- `fixCSS()` calls `document.body.querySelector(query)` on whatever precedes `[data-v-ID]` on a CSS
  line, with no guard. Every current rule puts a complete selector there - checked, 44 of 44 parse -
  but a rule that splits a selector across lines would make `querySelector` throw, and the throw
  escapes `String.replace` and aborts `init()`. If you add `[data-v-ID]` rules, keep the whole
  selector on one line, or wrap that call in a try/catch returning `query`.
- `highlightCards()` uses `$$(…, true)` without the `|| []` that `processLinks()` has. `$$` swallows
  exceptions and returns `undefined`, so an invalid selector there becomes a TypeError on
  `nlItems.length` rather than an empty result. The selectors are static, so this cannot fire today.

**README screenshot of the classic-layout menu.** Requested, never done — the site resets headless
Chromium here, so no genuine screenshot can be taken. Needs capturing by hand.

---

## 5. Before you ship

Run all of these; the workflow only runs the first three.

```
node --check 'Slickdeals+.user.js'
npm install --no-save eslint globals && node .github/undef-check.mjs 'Slickdeals+.user.js'
sed -n '/^})(`/,$p' 'Slickdeals+.user.js' | grep -c '`\|\${'      # must print 2
node test/unit.js && node test/cachekey.js && node test/answers.js && node test/stability.js
```

- `@version` and `const VERSION` must agree, or the release workflow fails. `VERSION` is also a path
  segment in the resolver URL: bump it, never change its shape.
- **A harness must call the shipped function, not a copy of it.** The 26.11.23 suite re-implemented
  the retry and passed for a build whose retry function had been deleted. Everything in `test/`
  extracts from the file at run time; keep it that way.
- The release workflow runs only on push to `master`, so a PR shows no checks. That is expected.
- **Whether a mechanism works can be measured with `curl`. Where a link goes cannot.** A curl fetch
  gets a different `u3` than a real session. That confusion has produced wrong conclusions here at
  least four times, including two retracted claims about Timex.
- Measure how far a problem reaches rather than trusting the report that surfaced it. 26.11.13 was
  reported as a few colour links and was four links in five.

---

## 5a. Ask instead of assuming something is unavailable

A standing instruction from maxnl, earned the hard way in this session more than once.

When something cannot be reached from the container - a file, an image, a page, a service - **say so
and ask**. Do not quietly conclude it is unavailable and route around it. The container's view is not
the user's view, and the difference has been load-bearing here repeatedly:

- `curl` reports a different `u3` **and different `data-product-exitwebsite` values** than a signed-in
  browser. Four wrong conclusions came from treating the container's fetch as authoritative.
- The upstream README screenshot returns 403 to `curl` with any user-agent, which says nothing about
  whether it renders on the repo page for a real visitor.
- A screenshot pasted into the conversation is not a file on disk. It has to be committed to the repo
  before it can be edited - asking for the path takes one turn, guessing wastes several.
- `slickdeals.net` resets headless Chromium, so "I cannot screenshot it" is true here and false for
  the user.

The cost is asymmetric: asking costs one turn, assuming costs a wrong conclusion that then has to be
found and retracted. When the answer would change what gets built, ask before building.

---

## 6. Environment

`slickdeals.net` and the resolver host were both reachable. If a future container cannot reach them,
set **Network access → Custom** with those two hosts and *"Also include default list of common
package managers"* checked. The resolver's address is not written down in this repo on purpose - the
script assembles it at runtime from the encoded string at the foot of the file, and upstream
obfuscated it deliberately. Decode that argument when you need the hostname.

- **The resolver requires `Origin` and `Referer`** — without them everything 404s with error `1.30`,
  which reads exactly like the service being down.
- **Node's `fetch` gets 400 from the resolver here; `curl` gets 200.** Use curl for probes.
- **Error codes:** `1.30` missing Origin/Referer. `7.122` id disagrees with the submitted URL.
- It rate-limits by concurrency, not volume. Space probes ~2s apart.
- `slickdeals.net` resets headless Chromium but serves `curl` with a browser user-agent.
- **Branch deletion is not possible from here.** `git push origin --delete <branch>` returns HTTP 403
  through the environment's git proxy, which permits pushes but not ref deletion, and the GitHub tools
  available expose `create_branch` with no delete counterpart. Merged branches have to be removed by
  hand - repo → **Branches** → the bin icon next to each - or with `git push origin --delete <branch>`
  from a normal clone. Say so and ask rather than reporting them as deleted.
