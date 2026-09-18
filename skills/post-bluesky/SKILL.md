---
name: post-bluesky
description: Adapt and publish campaign items on Bluesky — posts and reply-chain threads via official AT Protocol API
---

# Bluesky Adapter

Facts live in `platforms/bluesky.json` (300 chars, 4 images/1MB, reply-chain
threads). Bluesky has a real public API — the adapter implements it.

## What Bluesky rewards (culture)

- Sincere, conversational, early-adopter energy. What Twitter felt like
  circa 2010.
- Direct enthusiasm is fine; corporate voice stands out badly.
- Short reply-chain threads (3–5 posts) for step-by-step content.
- Custom feeds and starter packs drive discovery more than any algorithm.

## Drafting from the content graph

- `core-claim` → the post. 300 chars is tight — cut ruthlessly.
- `proof` → reply-chain posts if a thread earns it.
- Links → inline facets (API handles link detection) or a reply with the
  URL; either is native here.
- No hashtag stuffing; a couple of organic tags are fine (facets exist).

## Publishing — three honest modes

- `api` (default when creds exist) → `BSKY_HANDLE` + `BSKY_APP_PASSWORD`
  env vars. App-password scope only; never ask for the main password.
  Threads = reply chains (root=first post, parent=previous). Partial
  failures report exactly which posts landed.
- `agent-browser` → playbook via bsky.app composer.
- `manual` → draft package.

## Genuine engagement

- Reply to replies; Bluesky culture is conversation-first.
- Join relevant custom feeds; contribute where your niche lives.
- No engagement bait, no follow-farming, no recycled replies.

## Pitfalls

- 300-char limit is per post — validate every thread post.
- Media cap is 1MB per image — tighter than other platforms.
- Old advice said "no hashtags" — outdated (facets added 2024); the data
  file keeps the current truth.
