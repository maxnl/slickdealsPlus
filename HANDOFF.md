# Handoff — link resolution

State as of **v26.11.26**. Read with [`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable
architecture notes and the full history of what was tried and why it failed. This file holds only
what a new session needs to pick the work up.

The authoritative statement of the rules now lives **in the code**: a header block above
`resolveUrl()` in `Slickdeals+.user.js` lists the six load-bearing constraints and why each cannot
be casually changed. Read that first. It is deliberately in the source rather than here, because
every regression in this repo came from changing the code without reading the history.

---

## 1. Where things stand

Released and working: **v26.11.25**. Everything below that is newer is on the branch, not released.

| version | state | what it did |
| --- | --- | --- |
| 26.11.23, .24 | **broken, superseded** | shipped a call to a function deleted in the same commit; link resolving did not work |
| 26.11.25 | **released, good** | restored it; added the `no-undef` release gate |
| 26.11.26 | **on the branch, PR #54, not merged** | one request per link instead of two; `pv`/`au` cache-key fix; remembered failures; post-scoped keys |

**v26.11.26 has not been confirmed in a browser.** It is measured against the live resolver and
covered by four harnesses, but see §3 — the things it changes are exactly the things that have been
broken and re-broken here, so it wants a real look before it is trusted.

---

## 2. What v26.11.26 changes, and the evidence for each

**One request per link, not two.** A post's links carry `lno` and no `pno`, so their id is
`<sdtid>sdtid<lno>lno` and `lno` restarts in every post: the first link of every post shares one id
and the service answers them all alike. Those are asked under a perturbed id from the start rather
than asked naturally and then re-asked. Measured on the live service: the rei.com link asked
naturally returns the thread's amazon product, asked freshly returns its own rei.com URL.

Gated on `u3`, not on `pno`. `u3` is the destination itself, encrypted, so a link carrying one can
be resolved from the URL alone — which is *why* a fresh id works for it and destroys a link without
one. 3 of 3 perturbed links carry `u3`; 0 of 12 deal-body links do.

**The deal's own button and image could never hit the cache.** `getCacheKey()` strips what rotates
between loads, and `pv` and `au` were missing. Keying two fetches of thread `19854408` a day apart:
12 of 14 links kept their key; the 2 that did not were the `Get Deal at Amazon` button and the deal
image. They re-asked the service on **every page load, for the life of the install**, while looking
perfectly healthy because they always resolved. Now 14 of 14 stable. Every key changes shape, so the
link cache clears once on upgrade.

**A failure is remembered for a week.** A link whose answer got nowhere was never cached, so it cost
two requests on every load forever. Now stored as an empty destination plus a timestamp; expires
rather than being permanent, because the service's own cache changes.

**The cache key is scoped to the containing post.** `lno` restarts per post and `trd` is the anchor
text truncated to 32 characters, so two posts linking somewhere different under the same words would
share one entry and one destination. 33 keys become 34 over 76 links.

---

## 3. What still needs a browser

Nothing here can be settled from a container; see the measuring rule at the end of §5.

- **The Amazon colour variants must keep their own ASINs.** Thread `19854408`. This is the thing that
  has broken twice. Khaki is `B0GTNMT45B`, Black is `B0GTNDJ3FZ`; all eight must differ.
- **The rei.com post link** in that thread should reach
  `rei.com/learn/expert-advice/sun-protection.html`, and should now do it in one request.
- **Both Timex links**, thread `19856376`, should reach `timex.com/products/…` and
  `timex.com/collections/summer-sale`. Timex is the one destination never confirmed from here — curl
  yields a different `u3` and answers `flexoffers.com` for it, which says nothing about a real
  session.
- **A thread with a wiki section**, and **a thread with links in several different posts**. Neither
  exists in any sample taken so far, so those two link classes are reasoned about but unverified.
  The multi-post case is where the post-scoped key would actually be exercised.

---

## 4. Open, not acted on

**The 26.11.19 colour collapse is still unexplained.** Its `resolverRequest()` returned the natural
id whenever `pno` was present, so it never touched a deal body's links — yet the colours collapsed.
The `u3` gate makes the current code safe regardless, but the cause is unknown, so watch the colours
on the first load after any change in this area.

**Unbounded concurrency.** `processLinks()` fires every request with no queue. Measured over curl the
service serves ~4 at a time; a browser multiplexes over one HTTP/2 connection and may not trip it at
all. Deliberately not acted on — measure from a browser first. Failure is graceful: an unresolved
link is never cached, so the next load retries it.

**No link in any sample carries `u2`** (0 of 45). The free local-unwrap path never fires on deal or
post links, so `unwrapLinks` is effectively inert there. Worth confirming in a browser before
concluding the setting does nothing.

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

## 6. Environment

`slickdeals.net` and `slickdeals.net.vano.org` were both reachable. If a future container cannot
reach them, set **Network access → Custom** with those two hosts and *"Also include default list of
common package managers"* checked.

- **The resolver requires `Origin` and `Referer`** — without them everything 404s with error `1.30`,
  which reads exactly like the service being down.
- **Node's `fetch` gets 400 from the resolver here; `curl` gets 200.** Use curl for probes.
- **Error codes:** `1.30` missing Origin/Referer. `7.122` id disagrees with the submitted URL.
- It rate-limits by concurrency, not volume. Space probes ~2s apart.
- `slickdeals.net` resets headless Chromium but serves `curl` with a browser user-agent.
