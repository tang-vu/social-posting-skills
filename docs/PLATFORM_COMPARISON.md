# Platform Comparison

> **The numbers live in `platforms/*.json` — this page is orientation, not the source of truth.**
> Each JSON file carries `verification.lastReviewed` and per-fact confidence; consult it (or `npx social-posting-skills adapters`) for current values.

## Publish modes

| Platform | manual | agent-browser | api | Thread | API env |
|---|---|---|---|---|---|
| X | ✓ | ✓ | — | ✓ thread | — |
| Bluesky | ✓ | ✓ | ✓ | ✓ reply chain | `BSKY_HANDLE`, `BSKY_APP_PASSWORD` |
| Threads | ✓ | ✓ | — | ✓ reply chain | — |
| LinkedIn | ✓ | — | — | — | — |
| Reddit | ✓ | ✓ | — | — | — |
| Hacker News | ✓ | ✓ | — | — | — |
| Dev.to | ✓ | ✓ | ✓ | — | `DEVTO_API_KEY` |
| Product Hunt | ✓ | — | — | — | (`PH_API_TOKEN` metadata only) |
| Substack | ✓ | ✓ | — | — | — |
| Medium | ✓ | — | — | — | — |
| Facebook | ✓ | ✓ | — | — | (`FB_*` metadata only) |
| IndieHackers | ✓ | — | — | — | — |

## What each platform wants (culture layer)

| Platform | Native shape | Tone | Notable rules |
|---|---|---|---|
| X | Hook + thread; link in reply or last post | terse, concrete | engagement-bait flagged |
| Bluesky | Short post or reply chain | conversational, indie-web | no hashtag culture |
| Threads | Micro-post + optional replies | casual | — |
| LinkedIn | Narrative with professional context | reflective, specific | link-in-comments heuristic |
| Reddit | Community-fit title + body, transparent affiliation | genuine, non-promotional | title required; subreddit rules + flair; disclosure expected |
| Hacker News | `Show HN: Name – what it does` + url | factual, zero marketing | never ask for votes; superlatives warned |
| Dev.to | Full article with frontmatter tags | technical, tutorial-ish | up to 4 tags; remote drafts via API |
| Product Hunt | Name + tagline + first comment | energetic launch copy | launch assets required |
| Substack | Newsletter article | essayistic | email + web audiences |
| Medium | Long-form article | editorial | up to 5 tags |
| Facebook | Community/group post | friendly | group rules vary; confirm before posting |
| IndieHackers | Build-in-public update | transparent metrics welcome | milestone culture |

## Hard numbers

Char limits, image bounds, and per-fact confidence are **not duplicated here** — they change. See `platforms/<id>.json` (`constraints`, `media`, `hashtags`) or run:

```bash
npx social-posting-skills adapters
```

Review dates per file: `platforms/<id>.json → verification.lastReviewed`. See `docs/MAINTENANCE.md` for the quarterly review process.
