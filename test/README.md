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
| `unit.js` | `isDestinationPlausible()` — 29 assertions: collisions rejected, lookalike and suffix-appended domains rejected, prose values treated as no claim |
| `lifecycle.js` | shared rig: extracts the resolver functions and stubs the transport, masking responses exactly as the service does so `decodeResolved()` is genuinely exercised |
| `answers.js` | three consecutive page loads over six real link shapes — request counts, cache behaviour, and that deal-body variants keep their own ASINs |
| `stability.js` | the cost of a link that stays unresolvable, and that the retry id is deterministic |
| `cachekey.js` | what `getCacheKey()` must drop (everything that rotates between loads) and must keep (everything that separates two links, including the post a link sits in) |

`answers.js` reproduces the real resolver ids (`19854408sdtid1lno`, `1311423pno19854408sdtid3lno`),
which is the check that the fixtures are shaped like the page and not like a guess.

Ground truth for the destinations is in `FORK-NOTES.md`; do not re-derive it with `curl`, which
yields a different `u3` and therefore different answers than a real session.
