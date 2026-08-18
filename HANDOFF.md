# Handoff — link resolution

State as of **v26.11.31**. Read with [`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable
architecture notes and the full history of what was tried and why it failed. This file holds only
what a new session needs to pick the work up.

The authoritative statement of the rules now lives **in the code**: a header block above
`resolveUrl()` in `Slickdeals+.user.js` lists the six load-bearing constraints and why each cannot
be casually changed. Read that first. It is deliberately in the source rather than here, because
every regression in this repo came from changing the code without reading the history.

---

## 1. Where things stand

Released and current: **v26.11.31**, confirmed in a browser for the Amazon variants, the rei.com
link, the Timex links, a wiki thread, a multi-post thread and a thread whose wiki links state a host
they do not end on.

| version | state |
| --- | --- |
| 26.11.23, .24 | broken, superseded - shipped a call to a function deleted in the same commit |
| 26.11.25 | good - restored it, added the `no-undef` release gate |
| 26.11.26 | good, superseded - one request per link, `pv`/`au` cache-key fix, remembered failures |
| 26.11.27 | good, superseded - a link stating its own host is no longer read as a claim; wiki and featured-comment scoping |
| 26.11.28 | good, superseded - the host check runs only on ids that can be shared |
| 26.11.29 | good, superseded - a "no destination" answer is remembered instead of re-asked every load |
| 26.11.30 | good, superseded - removes a branch 26.11.28 stranded, and its orphaned helper |
| 26.11.31 | **current** - guards the two latent CSS traps; no behaviour change |

Confirmed working in a browser: all eight Amazon colour variants keep their own ASINs, the rei.com
post link resolves, both Timex links resolve, the wiki block resolves, and the three links in post 21
of thread 19854408 resolve to three different destinations.

**26.11.31 was browser-tested against all of those by maxnl (Aug 2026) and passed.** That build
contains 26.11.29's remembered "no destination" answer, so that change is exercised too - but a
passing run does not retire the residual risk in §4, "the one risk worth knowing", which is about a
*transient* bad answer being cached rather than a steady-state wrong one.

**Anyone upgrading from 26.11.26 should clear the link cache** - a link rejected under the old rule
is remembered as failed for a week:

```js
localStorage.removeItem("slickdeals+links"); location.reload();
```

---

## 1a. Start here next session

Two things are waiting, in order of value. Both need a browser; neither can be done from a
container.

**1. The changelog panel renders one word per line.** Open bug, reproduced by maxnl on the classic
layout at 26.11.30, screenshots in the session. The changelog block under **Changes** wraps every
word onto its own line, and `more` sits beside the text instead of below it. Not diagnosable by
reading the CSS - there are two layout paths and it is not certain which one is active. Run this with
the menu open and **Changes expanded**:

```js
const c=document.querySelector('.changes'),d=c&&c.querySelector('div'),l=document.querySelector('.changesLink');
const g=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();
 return {w:Math.round(r.width),display:s.display,position:s.position,float:s.float,flex:s.flex};};
console.log('fallbackHost?',!!document.querySelector('.sdp-fallbackHost'));
console.log('ul  ',g(c.parentElement),getComputedStyle(c.parentElement).display);
console.log('.changes',g(c)); console.log('first div',d&&g(d)); console.log('.changesLink',l&&g(l));
```

One word per line means the box is about as wide as the longest word, so the widths in that output
locate the culprit immediately. Leading suspicion: `.changesLink` is `position:absolute; right:0.8em`
in the base CSS and the classic-layout override may not be winning, leaving the text to wrap in the
gap beside it. **Do not fix this from the CSS by inspection** - confirm with the numbers first.

**2. Concurrency.** The last genuinely unmeasured thing. Paste on a busy deal page (thread 19049776
has 46+ links) *before* loading, then reload:

```js
(()=>{const f=window.fetch;let inflight=0,peak=0,n=0,fail=0;const t0=performance.now();
window.fetch=function(...a){const u=String(a[0]&&a[0].url||a[0]);
 if(!/vano|\/26\.11\./.test(u))return f.apply(this,a);
 n++;inflight++;peak=Math.max(peak,inflight);
 return f.apply(this,a).then(r=>{inflight--;if(!r.ok)fail++;return r;})
   .catch(e=>{inflight--;fail++;throw e;});};
setTimeout(()=>{const blue=document.querySelectorAll('a.notResolved').length;
 console.log('resolver requests:',n,'| peak concurrent:',peak,'| failed:',fail,
  '| still unresolved:',blue,'| elapsed:',Math.round(performance.now()-t0)+'ms');},15000);})();
```

**peak concurrent** is the number that matters. `failed` above zero alongside a high peak is the
signal that a queue is needed; if `failed` is 0 the whole item can be closed.

Cache clear, needed before any resolution test:

```js
localStorage.removeItem("slickdeals+links"); location.reload();
```

---

## 2a. Request cost, as it actually stands

Measured over 248 resolver-bound links across every saved page:

| path | links | cost |
|---|---|---|
| unique id, host check skipped | 32 | always 1 request |
| no usable claim, host check skipped | 22 | always 1 request |
| still host-checked | **194** | 1 if the answer matches the stated host, **2 if not** |

So the two-request path is **not gone** - it is unreachable for 54 links and live for 194.

Read that table carefully: it is a **static classification of which links could take two**, not a
measurement that 194 took one. About twenty links were actually resolved against the live service,
and every one of those took a single request under the current code. The other ~174 were never
resolved live at all. Do not describe the script as "one request per link" without that
qualification.

After the first load all of them cost nothing: destinations are cached, and so now are both terminal
failures.

---

## 3. Genuinely open

Everything else previously listed here has been settled. All three need a browser.

- **Whether `unwrapLinks` ever fires anywhere.** Across every saved page - 248 `/click` links - **not
  one carries `u2`**, so the local-unwrap path never runs on anything sampled. The setting may be
  dead entirely, or `u2` may only appear on link shapes not sampled here. Do not remove it on this
  evidence alone.
- **Concurrency.** See §1a for the command and §4 for what is known.
- **The changelog panel rendering one word per line.** Open bug, see §1a. Not a resolver issue - a
  layout one, in the menu's own CSS.

---

## 3a. Decided - do not reopen without a reason

- **Unwrapping from anchor text: declined** (maxnl, Aug 2026). 24 of 248 links have URL-shaped anchor
  text; 15 are truncated with an ellipsis; **7** are complete with a host matching
  `data-product-exitwebsite` and could be resolved with no request, including the one link the service
  refuses. Declined because it would point a link at its displayed label rather than a resolved
  destination, and those can differ. Recorded because it is the *only* route to the meta-refresh class.
- **A wiki or featured-comment block holding two same-text links: covered by fixture, not hunted for.**
  Hard to find in the wild, so `test/cachekey.js` builds it - two featured comments, a wiki block and
  a reply all holding the identical URL and anchor text, asserted to key differently and stably.
- **The resolver's address stays out of this repo.** The script assembles it at runtime from the
  encoded string at the foot of the file. Decode that when you need it.
- **The screenshot of the default layout is from v23.10.22** and shows fewer options than the table
  beneath it. Left as is deliberately (maxnl, Aug 2026).
- **Both menu screenshots are in and done.** `docs/menu.png` and `docs/classic-menu.png` render side
  by side in the readme. The classic one was captured by hand by maxnl, since the site resets headless
  Chromium here - do not re-list it as outstanding.

## 4. Known, understood, and deliberately not acted on

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
and registers a click - ruled out. The anchor-text option above is the only free source, and maxnl has
decided against it for now.

Since 26.11.29 that answer is **remembered** rather than re-asked on every page load. It expires after
a week like any other recorded failure, so a link the service later learns about is still picked up.

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

**Both latent traps are now guarded** (26.11.31). `fixCSS()` wraps its `querySelector` in a
try/catch returning the selector unresolved, and `highlightCards()` has the `|| []` that
`processLinks()` always had. Neither could fire before - 44 of 44 CSS rules parse, and both selector
lists are string literals - but both failures were total and silent, and the guards are two lines.

**The one risk worth knowing, from 26.11.29.** A "no destination" answer is now remembered for a
week. Network errors and non-OK responses throw *before* that branch, so they are not cached - but if
the service ever returned HTTP 200 with a body that decodes to a non-URL *transiently*, that link
would go quiet for a week rather than retrying. Never observed, cannot be ruled out. Clearing the
link cache is the escape hatch.

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
