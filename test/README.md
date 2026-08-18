# Harnesses

Run with `node test/<file>.js` from the repo root. No dependencies.

**Every function under test is extracted from `Slickdeals+.user.js` at run time.**
That is not a convenience — it is the point. The harness that 26.11.23 was shipped on
re-implemented the retry inside itself, so it printed a passing result for a build whose
retry function had been deleted. A harness that copies the code validates your intent;
only one that loads the code validates the artifact. If something cannot be extracted,
that is a reason to restructure the script, not to model it.

| file | what it covers |
| --- | --- |
| `unit.js` | `isDestinationPlausible()` — 34 assertions: collisions rejected, lookalike and suffix-appended domains rejected, prose values treated as no claim |
| `lifecycle.js` | shared rig: extracts the resolver functions and stubs the transport, masking responses exactly as the service does so `decodeResolved()` is genuinely exercised |
| `answers.js` | three consecutive page loads over six real link shapes — request counts, cache behavior, and that deal-body variants keep their own ASINs |
| `stability.js` | the cost of a link that stays unresolvable, and that the retry id is deterministic |
| `cachekey.js` | what `getCacheKey()` must drop (everything that rotates between loads) and must keep (everything that separates two links) — including the block a link sits in: replies, the wiki, and featured comments, each asserted to key differently for the identical URL and anchor text |

## What these do NOT cover

**Everything outside link resolution.** The harnesses extract ten functions - `crc32`, `getCacheKey`,
`getUrlId`, `hostOf`, `isHostShaped`, `isDestinationPlausible`, `decodeResolved`, `resolveFinalHop`,
`askFor` and `RESOLVE_RETRY_AFTER` - and touch nothing in `initMenu()`, the CSS, `processCards()`,
`highlightCards()` or the ad sweep. There is no DOM here, so that is a boundary rather than an
oversight.

**It matters because a green suite says nothing about the menu.** 26.11.32 and 26.11.33 were both
menu fixes - a changelog wrapping to one word per line, and a click that closed the panel instead of
opening it - and every gate in `MAINTAINING.md` §5 passed on the broken builds. maxnl found both in a
browser. **A change to the menu, the CSS, card processing or ad blocking is unverified until someone
loads a page**, whatever the harnesses print; §1a of `MAINTAINING.md` carries the method for
measuring the panel without the act of measuring closing it.

`answers.js` reproduces the real resolver ids (`19854408sdtid1lno`, `1311423pno19854408sdtid3lno`),
which is the check that the fixtures are shaped like the page and not like a guess.

Ground truth for the destinations is in `FORK-NOTES.md`; do not re-derive it with `curl`, which
yields a different `u3` and therefore different answers than a real session.
