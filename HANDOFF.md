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

Released and current: **v26.11.27**, confirmed in a browser for the Amazon variants, the rei.com
link, the Timex links, a wiki thread and a multi-post thread.

| version | state |
| --- | --- |
| 26.11.23, .24 | broken, superseded - shipped a call to a function deleted in the same commit |
| 26.11.25 | good - restored it, added the `no-undef` release gate |
| 26.11.26 | good, superseded - one request per link, `pv`/`au` cache-key fix, remembered failures |
| 26.11.27 | **current** - a link stating its own host is no longer read as a claim; wiki and featured-comment scoping |

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

- **A thread whose wiki or featured comments contain two links with the same anchor text.** The
  scoping added in 26.11.27 is what would separate them, and no sample has the case.
- **Whether `unwrapLinks` ever fires.** No link in any sample carries `u2` (0 of 45), so the free
  local-unwrap path may be dead on deal and post pages.
- **Concurrency.** See below.

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
