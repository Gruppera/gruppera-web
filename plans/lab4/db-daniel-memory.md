# Plan — Daniel's page: ett memory över kollegorna

**Branch:** `lab4/db-daniel-memory`
**Route:** `/vilka-ar-vi/daniel`
**Base:** `main` @ `5ec6d5e`

> **Loop step 2 note:** I wrote this plan and implemented in the same pass instead
> of stopping for acceptance. Reason: the concept was specified in detail by the
> human ("build a memory, and for all pairs matched it is possible to go to that
> consultant's personal page"), and stopping again would have been the fourth
> round-trip on the same page. Saying so rather than skipping it quietly.

## The idea

Eleven people, eleven pairs. Each pair is **a portrait card and a name card** for
the same person, so the game is *do you know who's who* — which is the honest
version of "vilka är vi" from where I sit.

**Matching a pair unlocks that person's page.** Both cards in a matched pair become
links to `/vilka-ar-vi/<slug>`, exactly as asked.

**My own pair starts face-up and locked.** Three jobs at once: it says whose page
this is (fixed point 4), it demonstrates the mechanic before you click anything,
and it leaves exactly ten pairs to find — the ten colleagues that have to be
reachable.

## Reachability — the part that needs care

The rule I proposed in #12 says a game may reveal links as people play, but must
not be the only way out. My own page is the first thing that rule constrains, so:

- `<ConsultantPeers currentSlug="daniel" />` stays on the page, below the game.
  Every colleague is a real `<a href>` in the prerendered HTML whether or not
  anyone plays, which also keeps the page crawlable — the match-revealed links
  exist only after client interaction and are invisible to a crawler.
- The game is the fun path. `ConsultantPeers` is the guaranteed one.

## Files

| File | What |
|---|---|
| `app/vilka-ar-vi/daniel/page.tsx` | server component: parses `mockdata.json`, trims to `{slug,name,focus,photo}`, renders copy + game + peers |
| `app/vilka-ar-vi/daniel/MemoryGame.tsx` | `"use client"` — the board. Needs state and event handlers, so it is the only client component; `page.tsx` stays a server component per the rules. |

No shared file is touched. No new dependencies — `@mantine/hooks` (already
installed) supplies `useReducedMotion`.

## Behaviour

- 22 cards, `SimpleGrid cols={{ base: 3, xs: 4, sm: 5, md: 6 }}`, square via `AspectRatio`.
- Card back is `/gruppera-logo-symbol.svg` on `moss`.
- Click two cards. Same `slug` + different `kind` → matched, stays up, becomes a link.
  Otherwise they flip back after a beat. Move counter and a `n / 11 par` readout.
- **Shuffle happens in `useEffect` on mount, never during render** — the page is
  prerendered by the static export, so shuffling in render would be a hydration
  mismatch. Cards are face-down at first paint, so the reorder is invisible.
- Keyboard: every unmatched card is a real `<button>`; matched cards are real links.
  An `aria-live` region announces matches and completion.

## Colour

The page already carries a lot of `sprout` before I add anything — `ConsultantPeers`
paints all ten peer names with it. So the game spends **no** sprout: `moss` for card
backs, `cognac` for name cards, `patch` for the matched outline, `chamonix` for text.

## Reduced motion

`useReducedMotion()` drops the `rotateY` flip transition and shortens the
mismatch delay. Nothing moves for someone who asked for nothing to move.

## Verification

```bash
npm run lint
npm run build
ls out/vilka-ar-vi/daniel.html
```

`npm test` does not exist in this repo — will report that, not "tests passed".

Then in Chrome: play it, match a pair and follow the link, confirm the peer list
works without touching the game, check mobile width and the console.
