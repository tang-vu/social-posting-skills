# Skill Catalog

Canonical sources live in `skills/`; `.agents/skills/` holds identical generated copies.

## Orchestrator

| Skill | Path | Purpose |
|---|---|---|
| `social-campaign` | `skills/social-campaign/` | The pipeline: source → campaign → graph → platform adaptations → preview → approval → publish/export → observe → learnings |

## Shared

| Skill | Purpose |
|---|---|
| `content-writing` | Voice, hooks, structure — graph-aware adaptation guidance |
| `image-generation` | Media manifest discipline: dimensions, alt text, provenance |

## Platform skills (`post-*`)

Each references `platforms/<id>.json` for limits/rules instead of restating them.

| Skill | Platform | Modes | Thread |
|---|---|---|---|
| `post-x` | X | manual, agent-browser | ✓ |
| `post-bluesky` | Bluesky | manual, agent-browser, api | ✓ chain |
| `post-threads` | Threads | manual, agent-browser | ✓ chain |
| `post-linkedin` | LinkedIn | manual | — |
| `post-reddit` | Reddit | manual, agent-browser | — |
| `post-hackernews` | Hacker News | manual, agent-browser | — |
| `post-devto` | Dev.to | manual, agent-browser, api | — |
| `post-producthunt` | Product Hunt | manual | — |
| `post-substack` | Substack | manual, agent-browser | — |
| `post-medium` | Medium | manual | — |
| `post-facebook` | Facebook | manual, agent-browser | — |
| `post-indiehackers` | IndieHackers | manual | — |

## Workflow

| File | Purpose |
|---|---|
| `.agents/workflows/post-social.md` | The campaign lifecycle as an agent workflow (filename kept for compatibility) |

## Interfaces

| Interface | Entry | Notes |
|---|---|---|
| CLI | `bin/cli.js` (`social-posting-skills` / `sps`) | full campaign lifecycle; bare run = install |
| MCP | `src/interfaces/mcp.js` | stdio JSON-RPC; approval-gated publish tool; no browser control |
| Library | `src/core/index.js` | `ingest`, `createCampaign`, `adaptCampaign`, `publishItem`, … |
| Installer | `bin/install.js` → `src/interfaces/install.js` | bundled copies, 8 targets, drift manifest |

## Platform metadata

`platforms/*.json` × 12 — volatile facts as versioned data (`constraints`, `thread`, `media`, `links`, `hashtags`, `capabilities`, `publishing`, `automation`, `rateLimit`, `culture`, `verification`). Schema notes: `platforms/README.md`.

## Presets

`src/core/presets.js`: `oss-launch` (8 platforms), `release-notes-only` (3), `dev-article` (4).
