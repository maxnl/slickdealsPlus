# Handoff — link resolution work

Written at the end of the session that shipped **v26.11.14** through **v26.11.18** (PRs #40-#45).
All are merged and released. Read this with
[`FORK-NOTES.md`](FORK-NOTES.md), which holds the durable architecture notes; this file holds only
what the next session needs to pick the work up, and should be deleted once the open items below are
closed.

---

## 1. Where we stand

26.11.13 shipped a destination check that compared the resolved host against `trd`, believing `trd`
held the sanitised outbound URL. **`trd` is the link's own anchor text.** `Dark Gray` stores
`Dark+Gray`; the one link it was validated against happened to have a URL as its anchor text, which
is the single case where both readings produce the same string.

Measured rather than estimated: that check rejected **228 of 287 links across 25 threads — 79%**,
the `Get Deal at Amazon` button and every deal image included. It was reported as "the colour
variants stopped resolving"; it was closer to all link resolution stopping.

26.11.14 does the first two; 26.11.15 adds the third. Both are released:

1. **Checks against `data-product-exitwebsite`**, the destination host Slickdeals states on the
   anchor. Sampled before adopting: 287 links, 15 distinct hosts, hostname-shaped every time, never a
   merchant name. `trd` is not kept as a fallback — it is a known-wrong signal.
2. **Asks again under a unique id when an answer is rejected.** The service resolves any id it holds
   no entry for, so `resolveFresh()` swaps `lno` for the link's cache key and re-derives the id.
3. **Asks uniquely from the start when the id is ambiguous by construction** — `lno` present, `pno`
   absent, i.e. a post-content link. One request instead of two, never more than one.

An answer to a unique id is **not** put through the check: the check catches answers belonging to a
different link sharing an id, and an answer resolved for this exact URL cannot be one.

Fixture thread `19854408`: 13 of 13 links unwrap in 13 requests, every colour variant to its own
ASIN, the rei.com post link included. Was 0 of 13 under 26.11.13.

---

## 2. The most important thing learned — `u3`, and measuring from outside a browser

**The service resolves from `u3`, and `u3` is not the same outside a browser.** A signed-out `curl`
fetch of a page yields links whose `u3` encodes a different destination from the one a real session
gets. The same `timex.com` link answered `www.flexoffers.com` for a curl-fetched URL and the true
`timex.com` product URL in a browser with the link cache cleared. Both are honest answers to
different questions.

This session's measurements were nearly all taken with `curl`. The structural ones held up when
checked in a browser — `trd` being anchor text, the 79% breakage, on-demand resolution, the id/URL
agreement rule. **The ones about what a specific link resolves to did not.** One claim recorded in
an earlier draft — that the host check has a "known false positive" on affiliate hops — was an
artifact of the fetch and has been retracted.

The rule going forward: a measurement of *whether the mechanism works* can be taken with `curl`; a
measurement of *where a link goes* must come from a browser.

---

## 3. Outstanding

**Asking uniquely has not been checked in a browser - and it is now live.** The browser test of
thread `19856376` ran on v26.11.14, which predates the change, so those two `timex.com` post links
were asked under the *shared* id and answered correctly with the true product URL. From 26.11.15 they
take the unique path instead, and the only measurement of what that returns for them came from probes
carrying a curl-derived `u3`, which answered an opaque `flexoffers.com` redirector. Per §2 that
cannot tell a real downgrade from an artifact of the fetch.

**Check this first, on a released build:** clear the link cache
(`localStorage.removeItem("slickdeals+links"); location.reload();`), load `19856376`, and confirm both
green post links still land on `timex.com`. If they land on `flexoffers.com` instead, the change is a
downgrade for links of that shape and `resolverRequest()` should be reverted - 26.11.14's behaviour is
unaffected and still released. If they land on `timex.com`, this item is closed and the curl result
was an artifact, as §2 predicts.

**Unbounded concurrency.** `processLinks()` fires `resolveUrl()` for every link with no `await` and
no queue, so a thread with 47 resolvable links opens 47 simultaneous requests. Measured over separate
`curl` connections the service serves roughly four at a time: 12 requests at concurrency 1 all
succeeded, 8-plus in flight lost two thirds, 30 sequential at 200ms spacing lost 2. **Not acted on,
deliberately** — those are separate TLS handshakes from a datacenter IP, while a browser issues the
same requests as multiplexed streams over one HTTP/2 connection and may not trip the limit at all.
Per §2, measure from a browser first. Failure is graceful and self-healing either way: an unresolved
link is never cached, so the next page load retries it.

**~~Quick View links are unsampled.~~ Confirmed working in a browser.** Expanding a card on a listing
page shows its links blue (`notResolved`, original href) and then green (`resolved`, unwrapped) a
moment later, which is the whole path working end to end - the MutationObserver picking up the
injected markup, `processLinks()` running on it, and `linkUpdate()` swapping the href. Nothing here
could be sampled from outside a browser: listing pages carry no `/click` links until a card is
expanded, and `slickdeals.net` resets headless Chromium.

That blue-then-green transition is also the quickest visual check that link resolution is alive at
all - no console needed. A link that stays blue is one that never resolved.

**Possible free extra hop, unverified.** A `track.flexlinkspro.com` destination carried the full
final URL in its own `url=` parameter, extractable locally with no request, exactly like `u2`. Found
with a curl-derived `u3`, so per §2 it may not describe what a browser gets — a browser may receive
the final URL directly and never see the redirector. Confirm from a browser before building on it.

**README screenshot of the classic-layout menu.** Requested, not done. The site resets headless
Chromium here, so no genuine screenshot could be taken, and a fixture mock-up presented as a
screenshot would misrepresent the UI. Needs to be captured by hand.

---

## 4. Environment

Network access to `slickdeals.net` and `slickdeals.net.vano.org` worked this session. If a future
container cannot reach them, set **Network access → Custom** with those two hosts and **"Also
include default list of common package managers" checked**.

Things that will otherwise waste a session:

- **The resolver requires `Origin` and `Referer`.** Without them every request returns 404 / error
  `1.30` regardless of the id, which reads exactly like the service being down.
- **It rate-limits by concurrency, not volume.** Sequential requests at ~1.8-2.5s spacing are stable;
  parallel bursts get connection resets. Always back off and retry before recording a failure — most
  of this session's apparent 404s were rate limiting, including one wrongly attributed to a missing
  `u3`.
- **Error codes:** `1.30` = missing Origin/Referer. `7.122` = the id in the path does not agree with
  the URL in the body.
- `slickdeals.net` resets headless Chromium but serves `curl` with a browser user-agent.

---

## 5. Test fixtures

- **`19854408`** — colour variants in the deal body, the rei.com post link in a later post. A single
  fetch of the base URL returns both. The rei.com link is the collision fixture.
- **`19856376`** (Timex) — three links stating `timex.com`: a `Get Deal at Timex` CTA with no `lno`
  (shared-id path) and two post-content links with `lno` and no `pno` (unique-id path). This is the
  fixture that exposed the `u3` finding in §2.

Ground truth, if it must be re-derived: Slickdeals' own `/click` URL 302s straight to the
destination, and affiliate-wrapped links carry the full target in a `u=` parameter. **Do not build
this into the script** — every such request mints a fresh `ascsubtag` and registers as a click, so
using it for resolution would generate phantom affiliate clicks on every page load. Diagnostic only,
and use it sparingly even then.

---

## 6. Before you ship

- `getUrlId()` must keep upstream's shape **and** keep agreeing with the URL submitted alongside it.
  That second half is why the earlier collision-free attempt 404'd — not the shape, as was recorded.
- `VERSION` is a path segment in the resolver URL. Bump it; never change its shape. `@version` and
  `const VERSION` must agree or the release workflow fails.
- The stylesheet is one template literal — no backtick or `${` anywhere in it, comments included.
  `sed -n '/^})(`/,$p' 'Slickdeals+.user.js' | grep -c '`\|\${'` must print `2`.
- `node --check` proves nothing about behaviour. Every regression in this repo's history passed it.
- The release workflow runs only on push to `master`, so a PR shows no checks. That is expected, not
  a failure. Its gates — version consistency and `node --check` — are worth running by hand.
- **Two lessons, both learned the hard way here.** A signal validated on one sample is not validated:
  find the case that tells your explanation apart from its rival and test *that*. And measure how far
  a problem reaches rather than trusting the report that surfaced it — 26.11.13 was reported as a
  handful of colour links and was four links in five.
