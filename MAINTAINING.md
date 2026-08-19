# Maintaining Slickdeals+

**Read this before changing anything.** It carries what is decided, what is finished, what must be
run before shipping, and the environment facts that cost hours to rediscover. Read it with
[`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable architecture notes and the full history of
what was tried and why it failed.

It was called `HANDOFF.md` while there was work in flight to hand over. There is not any more, and
the name was doing the file a disservice: §5 is a mandatory pre-ship checklist, not notes, and §1b
and §3a exist to stop finished work being raised again - which has happened more than once, in both
directions, by humans and assistants alike.

The authoritative statement of the rules now lives **in the code**: a header block above
`resolveUrl()` in `Slickdeals+.user.js` lists the six load-bearing constraints and why each cannot
be casually changed. Read that first. It is deliberately in the source rather than here, because
every regression in this repo came from changing the code without reading the history.

---

## 1. Where things stand

Released and current: **v26.11.34**. Confirmation status lives in §1c and is appended to, never
rewritten - see the note there for why.

| version | state |
| --- | --- |
| 26.11.23, .24 | broken, superseded - shipped a call to a function deleted in the same commit |
| 26.11.25 | good - restored it, added the `no-undef` release gate |
| 26.11.26 | good, superseded - one request per link, `pv`/`au` cache-key fix, remembered failures |
| 26.11.27 | good, superseded - a link stating its own host is no longer read as a claim; wiki and featured-comment scoping |
| 26.11.28 | good, superseded - the host check runs only on ids that can be shared |
| 26.11.29 | good, superseded - a "no destination" answer is remembered instead of re-asked every load |
| 26.11.30 | good, superseded - removes a branch 26.11.28 stranded, and its orphaned helper |
| 26.11.31 | good, superseded - guards the two latent CSS traps; no behavior change |
| 26.11.32 | good, superseded - the changelog no longer wraps to one word per line |
| 26.11.33 | good, superseded - the Changes toggle works on the classic layout, and four faults around it |
| 26.11.34 | **current** - guards the last two `$$` dereferences; no behavior change unless one fires |

**Anyone upgrading from 26.11.26 should clear the link cache** - a link rejected under the old rule
is remembered as failed for a week:

```js
localStorage.removeItem("slickdeals+links"); location.reload();
```

---

## 1a. Start here next session

**One thing is half-finished, and it is the only entry in §3: the 34 release tags on the remote
still point at pre-rewrite commits**, because this environment's credentials cannot write
`refs/tags/*`. Read §3 before touching anything to do with the history rewrite. The code is not
affected - the classic-layout menu work closed out in 26.11.33 and `unwrapLinks` was settled, in §3a
with the reasoning. Before adding anything else to §3, check §1b and §3a: most things that look like
gaps here have already been decided, and the reason is recorded next to them.

### What has already been reviewed, and how (Aug 2026)

Seven review passes ran over this repo. **Do not repeat them from scratch** - each had to ask a
question the previous one could not, and re-reading for consistency will now find nothing:

| pass | question it asked | outcome |
|---|---|---|
| 1-3 | is the documentation internally consistent? | 15 fixes; the last found a heading that contradicted §3 |
| 4 | are these claims true *outside* `HEAD`? | the resolver host was in 60 commits of history - rewritten since, §3a |
| 4 | would the harnesses fail if the code were wrong? | yes - four mutations, all caught; `test/README.md` |
| 5 | does the code actually work? | four `$$` dereference sites, two unguarded - fixed in 26.11.34 |
| 6 | what holds the invariants up? | the cache-key contract rests on `crc32`, not on the `0 +` that looks like it - `FORK-NOTES.md` |
| 7 | `processCards`, the ad lists, `parseVotes` | **no defects.** 42 blocklist regexes checked for stateful flags (none), `parseVotes` verified against all 13 documented behaviors |

**Still unaudited:** roughly 1,000 lines - the `SETTINGS` proxy layer, `fixCSS()`'s selector
resolution, and `noAds`'s DOM-insertion interception. Nothing suggests a problem there; it simply has
not been read line by line.

The methods worth reusing, from the sessions that produced the above:

**Measure the panel by forcing it open, never by asking a human to click.** The panel is held open by
`:focus-within`, so clicking into the devtools console closes it and every width reads 0. Two
measurement rounds were lost to that before the cause was found. Set the checkbox, force the `ul` to
`display:block` inline, measure, restore:

```js
(()=>{const c=document.querySelector(".changes");if(!c){console.log("no .changes");return;}
const ul=c.parentElement,cb=document.getElementById("sdpChanges");
if(cb)cb.checked=true;const prev=ul.style.display;ul.style.display="block";
const g=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();
 return {w:Math.round(r.width),display:s.display,position:s.position};};
console.log("ul",g(ul),".changes",g(c),"first div",g(c.querySelector("div")),
 ".changesLink",g(document.querySelector(".changesLink")));
ul.style.display=prev;})();
```

**Page CSS leaks into this panel, and the reset does not stop all of it.** The comment above
`.sdp-fallbackHost .sdp-menu > ul *` records three cases - weight, shadow, color. 26.11.32 was the
fourth: an unreadable cross-origin rule pinned `.changes > div` to `1em`, 12px at the panel's font
size, wrapping every entry to one word. The reset covers color and typography and **not box
metrics**, so anything geometric arriving from the page still has to be fought per-rule, with
`!important`, because the opposing rule's specificity cannot be read.

**A symptom that looks like CSS may be an event-order bug.** Clicking Changes closed the menu *and*
left the checkbox unchecked. The second half is what mattered: the panel is `display:none`d
mid-gesture when the button blurs on mousedown, so the mouseup lands on nothing and no click is ever
generated. Suppressing the default mousedown on the footer fixed it. The first attempt - making the
checkbox focusable - was aimed at a real defect that was not this one, and cost a round.

## 1b. Already done - do not re-raise

This list exists because a second assistant, reading these notes cold, proposed work that was already
finished. If something looks like a loose end and is on this list, it is not.

**Not the same list as §1c, and the two must not be merged.** This one records what is *done* - built,
shipped, settled. §1c records what has been *verified* - run in a browser, on a date, by someone. A
thing can be done and unverified, which is the ordinary state of a fresh release, and collapsing the
two loses exactly the distinction that produced the §1 contradiction: one session read "26.11.31
shipped" and "26.11.31 confirmed" as one fact, the other as two. They are two.

| | |
|---|---|
| The 26.11.13 regression (color variants, then 4 links in 5) | Fixed in 26.11.14 |
| Hardcoded affiliate-network lists | Removed in 26.11.23; the rule is generic and must stay that way |
| A call to a function deleted in the same commit | Fixed in 26.11.25, plus a `no-undef` release gate |
| The deal button and image re-requesting on every page load | Fixed in 26.11.26 (`pv`/`au` stripped from the cache key) |
| Post links costing two requests | Fixed in 26.11.26; they are asked under a unique id from the start |
| Links stating `slickdeals.net` never unwrapping | Fixed in 26.11.27 |
| Wiki and featured-comment links sharing cache keys | Fixed in 26.11.27 |
| A cross-host redirect being rejected | Fixed in 26.11.28 |
| A "no destination" answer re-asked every load | Fixed in 26.11.29 |
| Dead code left by 26.11.28 (`resolveNatural`) | Removed in 26.11.30 |
| `fixCSS()` / `highlightCards()` latent traps | Guarded in 26.11.31 |
| The other two `$$` dereferences (`setColors.update()`, `updateLinks()`) | Guarded in 26.11.34; all four sites now covered, see §4 |
| The changelog wrapping to one word per line | Fixed in 26.11.32, confirmed in a browser |
| Clicking Changes closing the menu, changelog unreachable | Fixed in 26.11.33, confirmed |
| No sign a changelog existed when collapsed | Fixed in 26.11.33 - the Changes label always shows |
| `more` sitting beside the changelog text | Fixed in 26.11.33, confirmed |
| The panel scrolling while room remained | Fixed in 26.11.33 - sized from its real offset |
| Comment entries washed out on the light panel | Fixed in 26.11.33 |
| Concurrency, whether a request queue is needed | Measured Aug 2026: 35 requests, peak 35, 0 failed - no |
| README screenshot of the menu | **Done** - `docs/classic-menu.png` and `docs/menu.png`, both in the README |
| Documenting the menu options for users | **Done** - the options table in the README |
| The resolver hostname appearing in plain text | Removed from every tracked file, and history rewritten Aug 2026 - **but the 34 release tags on the remote still point at pre-rewrite commits**, see §3a |
| Stale claude/* branches | **Done** - deleted by maxnl |
| `node_modules` committed to the repo | **Fixed Aug 2026** - untracked, and `.gitignore` added. See below on why history is left alone |

The same applies to `FORK-NOTES.md`: its *Known characteristics and accepted limitations* table keeps
finished rows struck through for the history. Struck through means finished, and nothing in that
table is open work - it is that file's counterpart to §4 below, not to §3.

**On the `node_modules` row, since the obvious follow-up is "shouldn't we purge it from history?" -
no, and that is measured.** The pre-ship `npm install --no-save eslint globals` in §5 writes
`node_modules` into the working tree, and a `git add -A` committed it: 1114 files, 13MB, 98% of the
repo. It is untracked now and `.gitignore` stops a recurrence. The blobs remain in history - the
Aug 2026 rewrite replaced text only, so all 1114 paths came through it - and a fresh clone over the
wire cost **2.9 MiB packed** against a 464 KB working tree, so they add about 2.5 MB, once, and
compress well. That is less than the two screenshots weigh, and it was not worth widening the
rewrite's blast radius to recover. Note that the "it would break every clone" half of this argument
has since been spent on the hostname rewrite; what is left is simply that 2.5 MB is not worth a
second rewrite.

Measure this correctly if it is ever revisited: a local `git clone` of this repo reports ~9 MB
because it hardlinks loose objects instead of repacking, and `du -sh .git` is misleading for the same
reason. Use `git clone --no-local`, or `git count-objects -vH` on a fresh clone.

---

## 1c. Confirmation log - append, do not rewrite

**Add a row. Do not edit or re-word the rows above it, and do not move this into §1.** Two sessions
once held opposite sentences about what had been tested, ten lines apart in §1, because both rewrote
the same paragraph minutes apart - and git merged them silently, since adjacent lines never conflict.
Test status is the fact in this file that changes fastest, so it gets the structure that survives
concurrent editing: one row per confirmation, newest last.

**Not the same list as §1b, and the two must not be merged.** §1b is what is *done*; this is what has
been *verified*, by whom and when. Both are append-only and they sit next to each other, so a later
tidy-up will read them as redundant - they are not. A release is done the moment it ships and
verified only when someone runs it.

The standard set, referred to below as **the full set**: all eight Amazon color variants keeping
their own ASINs, the rei.com post link, both Timex links, the wiki block, and the three links in post
21 of thread 19854408 resolving to three different destinations.

| version | date | who | what was checked |
|---|---|---|---|
| through 26.11.28 | — | maxnl | the full set, on real threads |
| 26.11.31 | Aug 2026 | maxnl | the full set — passed |
| 26.11.31 | Aug 2026 | maxnl | concurrency probe, thread 19049776, cold cache — 35 requests, peak 35, 0 failed |
| 26.11.32 | Aug 2026 | maxnl | changelog width fix, classic layout — entry went 29px to 240px, wraps normally |
| 26.11.33 | Aug 2026 | maxnl | Changes toggles and the menu stays open; label visible collapsed; more below the text; panel fits |
| 26.11.34 | Aug 2026 | Claude | post-rewrite content check - `Slickdeals+.user.js`, `MAINTAINING.md`, `FORK-NOTES.md`, `README.md` byte-identical across the rewrite; all five §5 gates pass; not a browser test |

**Does a release need re-testing against the full set? Check, do not guess.** Everything shipped
after 26.11.31 - 26.11.32, .33 and .34 - is menu, CSS and guards; **link resolution is untouched**.
Verified by extracting the thirteen resolver-path functions from both versions and comparing them
with comments stripped: twelve are byte-identical to the build maxnl tested, and the thirteenth,
`updateLinks()`, differs only by an `|| []` that cannot substitute, because its selector is a literal
that `querySelectorAll` will never reject. So the 26.11.31 row still covers the current build for
link resolution.

Do the same before asking for a re-test, rather than inferring from the changelog:

```sh
git diff v26.11.31..HEAD -- 'Slickdeals+.user.js' | grep '^[+-]' | grep -vE '^[+-]\s*(\*|//|/\*)'
```

If nothing in `getUrlId`, `getCacheKey`, `crc32`, `isDestinationPlausible`, `decodeResolved`,
`resolveFinalHop`, `askFor`, `resolveUrl`, `processLinks` or `linkUpdate` moved, the full set does not
need running again. **A menu or CSS change is a different question** and needs its own confirmation -
see §5.

**26.11.34 is deliberately not in this table.** It adds two defensive guards and changes nothing
unless one fires, so there is no observable behavior for a browser to confirm - only that nothing
regressed. Absence here means unverifiable, not unverified; it is recorded as done in §1b.

26.11.31 contains 26.11.29's remembered "no destination" answer, so that change is exercised by the
row above. A passing run does **not** retire the residual risk in §4, "the one risk worth knowing" -
that one is about a *transient* bad answer being cached, which a passing run cannot exercise.

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

**One page has since been measured live**, which is worth more than the classification above: thread
19049776 on a cold cache issued **35** resolver requests, all of which succeeded. Static counting of
that page's HTML suggested 94 raw `/click` URLs and 39 distinct by `sdtid`/`lno`/`trd` - so a static
count overstated it by nearly threefold, and even the deduplicated figure was four high. Quote the
live number, not a count of anchors.

---

## 3. Genuinely open

One entry, opened Aug 2026 by the history rewrite. `unwrapLinks` was the previous one; it moved to
§3a and the decision it was waiting on has been taken - the path stays.

- **The 34 release tags on the remote still point at pre-rewrite commits.** The rewrite that stripped
  the resolver hostname reached `master` and the working branch but not `refs/tags/*`: the automation
  environment's git credentials are refused with `HTTP 403` on any tag write, including creating an
  unrelated throwaway tag, so this is a credential scope limit, not a transient failure and not
  something a retry fixes. Because `git clone` fetches tags by default, **the old history is still
  reachable from a fresh clone through them**, which is most of what the rewrite was meant to prevent.

  Finishing it needs credentials that can write `refs/tags/*` - maxnl's own machine, or a token with
  `contents: write` - and then `git push --force --tags origin` from a clone of the rewritten history.
  Deleting the tags instead would detach the 34 GitHub Releases from their commits, so repointing is
  the right move, not deletion. Until then, do not describe the rewrite as complete on the remote;
  §3a's entry states the same limit and should stay in step with this one.

---

## 3a. Decided - closed, not shelved

**These are settled, not paused.** Every entry here was decided by maxnl with reasons recorded
alongside it. Listing them back as "worth revisiting" or "open to revisit" is the same mistake as
re-raising finished work from §1b, and it has happened - re-read the reason before you imagine a
gap, because the reason is usually the thing you were about to rediscover.

- **Unwrapping from anchor text: declined, permanently** (maxnl, Aug 2026). 24 of 248 links have
  URL-shaped anchor text; 15 are truncated with an ellipsis; **7** are complete with a host matching
  `data-product-exitwebsite` and could be resolved with no request, including the one link the service
  refuses.

  The reason, in maxnl's terms: **the anchor text is not reliably the intended destination, and the
  href must not be overridden with it when it is not.** There are various ways the two can come apart,
  and the host matching narrows that without closing it. A cheap resolution that sometimes sends
  someone to the wrong place is worse than an unresolved link that still works.

  That it is the only route to the meta-refresh class does not reopen it - that was known when the
  call was made. **Do not re-propose this as a way to fix `freetaxusa.com`.**
- **A wiki or featured-comment block holding two same-text links: covered by fixture, not hunted for.**
  Hard to find in the wild, so `test/cachekey.js` builds it - two featured comments, a wiki block and
  a reply all holding the identical URL and anchor text, asserted to key differently and stably.
- **The resolver's address stays out of this repo.** The script assembles it at runtime from the
  encoded string at the foot of the file. Decode that when you need it.
- **History was rewritten to strip it (maxnl, Aug 2026), and the result is partial - read the whole
  of this before repeating any claim about it.** It had been written in plain text in the notes and
  then merely redacted in the working copy (`1fc5671`), which left **60 of 297 commits carrying it,
  all reachable from `master`**. `git filter-repo --replace-text` rewrote all 311 commits; the 60 now
  carry a redaction marker instead. Current file content came through byte-identical - `Slickdeals+.user.js`,
  `MAINTAINING.md`, `FORK-NOTES.md` and `README.md` all hash the same before and after - and authorship
  was preserved (V@no 85 + 2, maxnl 93, Claude 131). Every SHA before the fork point changed, so old
  commit references in notes or issues no longer resolve; the fork point itself is now `95d2d25`.

  **`master` and the working branch were force-pushed. The 34 release tags were not** - this
  environment's git credentials are refused (`HTTP 403`) on any write to `refs/tags/*`, including
  creating an unrelated throwaway tag, so it is a credential scope limit and not something retrying
  fixes. Every tag on the remote still points at its pre-rewrite commit, **and `git clone` fetches tags
  by default, so a fresh clone still retrieves the old history through them.** Until the tags are
  repointed or deleted by someone whose credentials can write `refs/tags/*`, treat the rewrite as
  *incomplete on the remote*: the branches are clean, the tags are not.

  **A rewrite is not erasure even once the tags are done.** The repo is public and sits in vanowm's
  fork network (`forks: 0`, `network_count: 2`), which shares an object store, so unreachable objects
  stay fetchable by SHA until GitHub garbage-collects - generally requiring GitHub Support. Existing
  clones keep it, and anything that already indexed the repo already has it. What the rewrite buys is
  removal from every file, branch and fresh clone, and from casual discovery through the GitHub UI and
  `git log -S`. That was always the actual purpose - not secrecy, but not pointing traffic at someone
  else's server from a file GitHub indexes. **Do not describe it as removed.**
- **Nothing on Slickdeals can be unwrapped any more; it all requires resolving** (maxnl, Aug 2026).
  This is a call about the site, not a sampling result, and it outranks the sampling: no `u2` was found
  across 248 saved links or on a live thread page, but a zero count could never have proved the shape
  extinct, so do not go looking for one to "confirm" it.

  What follows from it: `unwrapLinks` gates exactly one branch - `elA._hrefLocal ? SETTINGS.unwrapLinks
  : SETTINGS.resolveLinks` - and `_hrefLocal` is set only when `u2` is present. So the menu's *Unwrap
  tracking links* checkbox currently governs nothing.
- **The unwrap path stays: decided, do not remove it** (maxnl, Aug 2026). It was offered for removal
  and deliberately kept.

  **It is not dead code, and calling it that is the mistake to avoid.** Dead code cannot execute; this
  executes the moment its input appears. `queryObject.has("u2")` is an ordinary runtime test against
  whatever the page serves - hand it a link carrying `u2` and the destination is read straight out of
  the link, `_hrefLocal` is set, and the branch at `:2375` runs as designed. What is absent is the
  input, not the capability, and no amount of the input being absent turns working code into dead
  code.

  So: it costs one branch and one menu row, it cannot misfire while nothing carries `u2`, and it
  resumes working by itself if the site reintroduces the parameter - which nobody would announce and
  nothing else in the script would notice. **A future session finding this branch never taken has
  found the documented state, not a cleanup opportunity.** The same goes for anyone tidying the menu
  because a setting appears to do nothing.
- **The mobile view is out of scope, and that is a decision** (maxnl, Aug 2026). The userscript is not used there and may not
  even be installable. 26.11.33 made the *Changes* label show while collapsed on every layout,
  including mobile, and that was deliberately not tested. Do not raise it.
- **The two menu screenshots, and what is true of each.** Both are in the readme and neither is
  outstanding as an *addition* - do not re-list them as missing.
  - `docs/classic-menu.png` is current, but it was **edited, not recaptured** (Aug 2026). It was taken
    at v26.11.27, before 26.11.33 made the **Changes** label show while collapsed, so its footer read
    as a bare version. The footer row was redrawn to read `Changes … v26.11.33 · maxnl fork`. Both
    changes were verifiable - maxnl had confirmed the label in a browser and the version is a fact -
    so nothing depicted is invented, and **the rest of the image is the original capture.** Say so if
    it is ever revised again; an edited screenshot mistaken for a capture is a trap.
  - `docs/menu.png` is from v23.10.22 and **is genuinely stale**: it is the Blueprint layout and is
    missing four rows the menu now has - *Unwrap tracking links*, *Price first*, *Hide Side Column*,
    *Debug* - plus the footer label. It cannot be fixed the way the classic one was, because editing
    four rows in would mean **inventing** a UI nobody has a current screenshot of, which is not the
    same act as correcting two known strings. Replacing it needs a real capture on the default layout,
    by hand, since the site resets headless Chromium here. maxnl has left it deliberately and the
    readme carries a line saying it shows fewer options than the table, so no reader is misled.

## 4. Known, understood, and deliberately not acted on

**A whole class the resolver cannot answer: meta-refresh interstitials.** `freetaxusa.com` in thread
19049776's wiki (`lno=14`) is the example. The service returns a well-formed *empty* destination -
a few bytes unmasking to `""` - under the natural id and the perturbed one, with a `curl`-derived
`u3`, with the real `u3` from a signed-in browser, and with a `u3` five seconds old while its
neighbors on the same page resolve normally. Staleness is ruled out.

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

**26.11.19, where color variants stopped keeping their own destinations: fixed, and done.** Every
variant of a deal resolved to the same product instead of its own ASIN. It was fixed, it has stayed
fixed, and the `u3` gate makes the current code safe regardless - **this is not an open item and
should not be listed as one.** What is unknown is only *why* it happened: `resolverRequest()` returned
the natural id whenever `pno` was present, so on the face of it it never touched a deal body's links.
An unexplained cause is not the same as an unfixed bug. The only thing it earns is a habit: glance at
the variant colors on the first load after changing anything in this area.

**Unbounded concurrency: measured, and it is fine.** `processLinks()` fires every request with no
queue. Measured by maxnl in a browser on thread 19049776 (Aug 2026, 26.11.31, cold cache): **35
resolver requests, peak 35 concurrent, 0 failed** in 15s. Peak equalling the total means all 35 went
out in one burst, exactly as the no-queue reading predicted - and the service served every one. The
earlier "~4 at a time" figure came from curl; a browser multiplexes over one HTTP/2 connection and
does not trip the limit. **No queue is needed, and none should be added without a fresh measurement
showing failures.**

One link stayed unresolved on that run, which is the expected count: `freetaxusa.com` is the known
meta-refresh case above and cannot resolve. Worth re-checking if that number is ever above 1.

Caveat: one run, one page, one moment. It closes the item on the agreed criterion (`failed` of 0),
but a rate-limit change upstream would not announce itself. **Re-run this if links ever start staying
blue.** It has to be installed before the page loads - a console paste is wiped by the reload - so it
goes in a userscript manager as a second script with `@run-at document-start` and `@grant none`
(without `@grant none` it runs in an isolated world and the `fetch` override never reaches the page).
Then clear the link cache, reload, and read the console after 15s:

```js
(() => {
  const f = window.fetch;
  let inflight = 0, peak = 0, n = 0, fail = 0;
  const t0 = performance.now();
  window.fetch = function (...a) {
    const u = String((a[0] && a[0].url) || a[0]);
    if (!/vano|\/26\.11\./.test(u)) return f.apply(this, a);
    n++; inflight++; peak = Math.max(peak, inflight);
    return f.apply(this, a)
      .then(r => { inflight--; if (!r.ok) fail++; return r; })
      .catch(e => { inflight--; fail++; throw e; });
  };
  setTimeout(() => console.log("requests", n, "| peak", peak, "| failed", fail,
    "| still blue", document.querySelectorAll("a.notResolved").length), 15000);
})();
```

`peak` is the number that matters; `failed` above zero alongside a high peak is what would justify a
queue. Disable the probe afterwards - it hooks `fetch` on every thread page.

Failure is graceful, and this was re-checked when the negative cache went in. A rate-limited or failed
request never reaches the branch that records a failure: `resolveUrl()` catches network errors to
`undefined` and passes a non-ok response through unchanged, and both are thrown out at the top of the
handler, before any `SETTINGS(key, …)` call. Only a *successful* answer that reaches the wrong host,
whose fallback also reaches the wrong host, is remembered. So a rate-limited link stays `notResolved`,
keeps its own href, and is asked again on the next page load — no timer, no in-page queue, no
week-long marker.

**The `$$` traps: four sites, guarded across 26.11.31 and 26.11.34.** `$$()` ends in a bare `catch {}`
and so returns `undefined` on any failure, and for a bare-word argument it returns
`getElementById()`'s `null`. Every caller that dereferences the result without a guard is a total,
silent stop.

26.11.31 guarded two: `fixCSS()` wraps its `querySelector` in a try/catch returning the selector
unresolved, and `highlightCards()` gained the `|| []` that `processLinks()` always had. Neither could
fire - 44 of 44 CSS rules parse and both selector lists are string literals.

**26.11.34 guarded the two that pass had missed**, found by auditing the runtime paths rather than by
anything failing:

- `setColors.update()` did `$$(id).dispatchEvent(...)` on an element **id**, so `$$` hands back a
  plain `null` whenever that input is not in the document - no unparseable selector needed. This is
  the most reachable of the four: `update()` also runs from a deferred `readystatechange` listener,
  and the menu can be gone by then (the MutationObserver carries a branch that reattaches it, so
  removal does happen). A throw escapes into whatever invoked `initMenu()`, which on the Blueprint
  path is a MutationObserver callback - abandoning the rest of that batch.
- `updateLinks()` read `.length` off an unguarded `$$` result. Unreachable today for the same reason
  the 26.11.31 pair were - the selector is a literal - but identical in shape.

The lesson generalises past `$$`: **a helper that swallows failure into `undefined` makes every
unguarded call site a defect**, and finding them means enumerating call sites, not reading the helper.
`grep -n '\$\$(' Slickdeals+.user.js` lists them; four of eleven needed a guard.

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

- **Verify anything the gates cannot cover *before* merging, by injecting it into a live page.**
  Merging publishes: the release workflow fires on a push to `master`, so there is no window between
  merge and release in which to check. Both 26.11.32 and 26.11.33 were confirmed this way, and it is
  what caught the gap between "measured" and "actually right" - 26.11.32's fix was reasoned from a
  computed width and still needed seeing.

  The pattern: put the exact rules the release would ship into the page, exercise the thing, and read
  a number rather than trusting the look of it.

  ```js
  document.head.insertAdjacentHTML("beforeend",
    "<style>.sdp-fallbackHost .changes > div{width:auto !important}</style>");
  // then force the panel open and measure - see §1a - rather than eyeballing it
  ```

  For a JS change, attach the listener by hand the same way (`el.addEventListener(...)`) and confirm
  the behavior before the version is bumped. Where a change *cannot* be seen - 26.11.34's guards do
  nothing unless they fire - say so plainly rather than implying it was confirmed, and record it in
  §1b rather than §1c.
- **A green run says nothing about the menu, the CSS, card processing or ad blocking.** The harnesses
  extract ten resolver-side functions and touch none of that - there is no DOM here. Both 26.11.32
  and 26.11.33 were menu fixes, and every gate above passed on the broken builds; a browser caught
  them. Anything outside link resolution is unverified until someone loads a page. See
  `test/README.md`.
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
  reported as a few color links and was four links in five.

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

## 5b. House style, and working with more than one session

**American spelling throughout** (maxnl, Aug 2026) - `color`, `behavior`, `license`, `normalize`. It
took three passes to clear the British forms out of the docs, the script's comments and `test/*.js`,
so please do not reintroduce them. Check with:

```sh
grep -rniE 'colour|behaviour|neighbour|licence|normalis|optimis|defence|recognise|centre|grey' \
  *.md test/*.md test/*.js 'Slickdeals+.user.js' .github/*.mjs
```

**Expect exactly one hit: this command matching its own pattern, in this file.** Anything else is
real. It was clean at 26.11.34.

**Say what happened, not a dramatic shorthand for it.** The 26.11.19 regression was written up for
months as "the color collapse", which maxnl objected to and which overstated it - what happened is
that color variants stopped resolving to their own destinations. Precise beats vivid here.

**One session owns this file at a time.** Two ran concurrently in Aug 2026 and both rewrote §1
minutes apart; git merged them without a conflict, because they touched adjacent lines rather than
the same ones, and the result asserted that a version both had and had not been browser-confirmed.
Neither edit was wrong on its own.

So, when more than one session is live:

- **Fetch and re-read `master` immediately before editing this file**, never work from a snapshot
  taken earlier in the session. The collision above spanned about ten minutes.
- Prefer appending to §1b and §1c over rewriting anything.
- Say out loud which session is taking a change. Both sessions once deferred to the other and neither
  moved; that costs less than both moving, but it still costs.
- Only one of them should push. A second session that has "already discarded its local fix" is the
  safe state to be in.

---

## 6. Environment

`slickdeals.net` and the resolver host were both reachable. If a future container cannot reach them,
set **Network access → Custom** with those two hosts and *"Also include default list of common
package managers"* checked. The resolver's address is not written down in this repo on purpose - the
script assembles it at runtime from the encoded string at the foot of the file, and upstream
obfuscated it deliberately. Decode that argument when you need the hostname.

- **Only three hosts are reachable from here**, on the network policy described above:
  `slickdeals.net`, `github.com`, and the resolver. Everything else - `example.com` included - fails
  with curl exit code `000`, which reads like a dead link and is not one. Do **not** report a readme
  link as broken on that basis; `tampermonkey.net`, `violentmonkey.github.io` and `img.shields.io`
  all fail here and are all fine. The upstream repo separately answers **403** to curl with any
  user-agent, browser string included - also not a broken link. See §5a.
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
