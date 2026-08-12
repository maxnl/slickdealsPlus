# Slickdeals+

[![version](https://img.shields.io/github/v/release/maxnl/slickdealsPlus?label=version&sort=semver)](https://github.com/maxnl/slickdealsPlus/releases/latest)

A fork of [vanowm/slickdealsPlus](https://github.com/vanowm/slickdealsPlus) by V@no, maintained by [maxnl](https://github.com/maxnl). Version numbers here are independent of upstream's and do not correspond to them.

*Have you ever looked in DevTools while browsing slickdeals.net?*

*It's mind-boggling how much useless (to the visitor) stuff it downloads, __uploads__ to other servers and stores on your computer*

This userscript blocks most, if not all, __ads__ and __trackers__, making the site more responsive and more private — and adds a few things to make deals easier to read at a glance.

## What it does

Everything is a switch in the **Slickdeals+** menu in the site header. Settings save as you change
them and apply immediately, except where noted.

<table>
  <tr>
    <td align="center"><sub><b>Blueprint layout</b> — the current Slickdeals design</sub></td>
    <td align="center"><sub><b>Classic layout</b></sub></td>
  </tr>
  <tr>
    <td valign="top"><img src="https://github.com/vanowm/slickdealsPlus/assets/511517/328a7870-9e85-4e24-8fd4-ca3c328c248a" alt="Slickdeals+ on the Blueprint layout"></td>
    <td valign="top"><img src="docs/menu.png" width="535" alt="The Slickdeals+ menu on the classic layout"></td>
  </tr>
</table>

| Option | What it does |
| --- | --- |
| **Free items** | Free items are always highlighted. The swatch beneath **Free Only** sets the colour. |
| **Free Only** | Additionally hide everything that is not free. |
| **Unwrap tracking links** | Some Slickdeals links carry their real destination inside them. This reads it out and points the link straight at it, skipping the redirect. **Entirely local — nothing leaves your browser.** |
| **Resolve links** | For links that *don't* carry their destination, look it up. **This is the only feature that sends anything anywhere:** the link and the page URL go to a third-party service, which returns the final destination. Turn it off to keep everything local. |
| **Price first** | Show the price before the title instead of after it. |
| **Price difference** | Show the price and percent difference between the current and original prices. |
| **Highlight price diff ≥ _n_ %** | Highlight items discounted by at least _n_ percent. The swatch sets the colour. |
| **Highlight score ≥ _n_** | Highlight items with at least _n_ votes. The swatch sets the colour. |
| **Block ads** | Block ad and tracker requests. **Needs a page reload to take effect.** |
| **Hide Side Column** | Hide the side column on the main page (popular, trending deals, and so on). |
| **Debug** | Print what the script is doing to the browser console — what it blocked, and how each link resolved. Leave off unless you are diagnosing something. |
| **Custom CSS** | Your own CSS, applied to every page. Only appears once it has been enabled. |

A colour swatch left empty uses the built-in default, and a highlight threshold of `0` turns that
highlight off.

### Unwrapping vs resolving

These are two different mechanisms, which is why they have separate switches:

* **Unwrapping** reads a destination the link already contains. No request, nothing sent anywhere.
* **Resolving** asks a third-party service for a destination the link does not contain.

Leaving **Resolve links** off keeps the benefit of unwrapping with no external lookups at all.
Resolved destinations are cached in your browser, so a link is normally looked up only once.

### Seeing it work

A link that has been given its real destination shows green; one still waiting shows blue. On a deal
page you will usually see links go blue and then green a moment later. A link that stays blue could
not be resolved — it keeps its original Slickdeals link and still works, it just does not skip the
redirect.

## Install

Requires a userscript manager — [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Safari) or [Violentmonkey](https://violentmonkey.github.io/).

**[▶ Install Slickdeals+](https://github.com/maxnl/slickdealsPlus/releases/latest/download/Slickdeals.user.js)**

With a userscript manager installed, that link opens Tampermonkey's install prompt directly. It always serves the newest [release](https://github.com/maxnl/slickdealsPlus/releases) rather than a half-finished commit, and the script points `@updateURL` at the same place — so Tampermonkey tracks releases from then on and updates itself, with no need to revisit this page.

[Changes](https://github.com/maxnl/slickdealsPlus/commits/master)
