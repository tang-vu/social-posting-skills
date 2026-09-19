---
name: post-medium
description: Adapt and publish campaign items on Medium — polished long-form articles, draft-exported for manual publishing
---

# Medium Adapter

Facts live in `platforms/medium.json` (≤5 tags, canonical URLs, no reliable
write API). Medium's legacy API is deprecated and reachability varies by
region — generation and drafts never depend on medium.com access.

## What Medium rewards (culture)

- Polished, essayistic long-form: H2 structure, narrative + takeaway.
- Personal voice beats content-farm tone.
- Syndication is welcome — set canonical_url when cross-posting.
- Publications have their own submission rules; respect them.

## Drafting from the content graph

- `core-claim` → a real title (not a headline-bait title).
- `context` → lede: the story or the problem.
- `proof`/`technical` → the middle sections, with the strongest specifics.
- `demo` → a "try it" walkthrough where it earns its place.
- `cta` → closing: takeaway + pointer, no hard sell.
- ≤5 topic tags at the end.

## Publishing

- `manual` → complete draft package (title, subtitle, tags, body, media).
- No browser mode: reachability is unreliable and automation brittle.
- No API: deprecated for new integrations.

## Genuine engagement

- Respond to highlights/responses thoughtfully.
- Cross-post honestly: canonical links and syndication notes, not duplicated
  SEO plays.

## Pitfalls

- "Medium is blocked here" is a connectivity issue, not a content issue —
  drafts work regardless; publish when reachable.
- Don't paste platform-specific markdown that Medium doesn't render
  (e.g., some embeds) — check the draft in Medium's editor.
