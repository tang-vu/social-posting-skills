# Project Overview & PDR

## Product

`social-posting-skills` — an agent-native social distribution system. One source artifact becomes a reviewable, platform-native campaign; a human approves each item before anything publishes.

**v3 (this branch):** campaign pipeline + platform-rules-as-data + adapter contract + CLI/MCP/library interfaces + rewritten skills.

**v2 (legacy):** 14 prompt skills + git-clone installer. Replaced, not extended.

## Users

- OSS maintainers launching releases (the dogfood path: `oss-launch` preset)
- Coding agents asked to "share this work" — they get a safe, inspectable flow instead of improvising 12 posts
- Humans who want local-first tooling: no service account, no hosted dependency

## Requirements (status)

| Requirement | Status |
|---|---|
| First-class Campaign model (source, intent, items, approval, receipts, observations) | done |
| Source ingestion: file/markdown/text/URL/GitHub release/npm/git-diff; bounded + SSRF-safe | done |
| Canonical content graph before platform rendering | done |
| Platform-native adaptation (not shortened cross-posts) | done — per-platform builders |
| Platform rules as versioned data w/ review dates + confidence | done — 12 JSON files |
| Explicit approval package + item-level approval | done |
| Publish modes: manual export (all), agent-browser playbooks, api (bluesky, devto) | done |
| Duplicate prevention via content hash + receipts; unknown/partial states + reconcile | done |
| Thread modeling + partial-thread reporting | done — x/threads/bluesky |
| Media manifest, alt text, sensitive-name guard | done |
| Deterministic UTM, canonical links | done |
| Observations (manual import) + observed/inferred learnings + variants | done |
| Scheduling intent + calendar (no daemon) | done |
| CLI / MCP / library interfaces | done |
| Installer: bundled copy, 8 targets, drift manifest | done |
| Skills rewritten lean + skill.json manifests + workflow | done |
| Test suite: 83 tests, fault injection, browser fixtures, no network | done |
| Docs: README/SAFETY/MIGRATION/MAINTENANCE/architecture/catalog | done |
| npm release (OIDC) + GitHub Action draft-generation example | pending |

## Non-goals

- Spam/growth tooling, mass engagement, scheduling daemons, hosted services
- Auto-generated images (media manifest accepts user-supplied/generated assets; nothing auto-uploads)
- Guaranteed-reach claims — learnings are labeled observed vs inferred

## Success criteria (definition of done)

A user can: install → point at one source → get differentiated native drafts for 8 platforms → inspect each → approve a subset → publish supported modes or export draft packages → recover from partial failures → avoid duplicates → see receipts → reuse learnings — all without credentials until the publish step.

## Key decisions

- **platforms/*.json over prompts** — volatile facts are data with `lastReviewed`+confidence.
- **Graph before adapt** — one fact layer; adaptation selects/transforms, never invents.
- **Honest capabilities** — adapters only advertise what exists (`api` only where implemented).
- **Drafts are first-class** — every platform degrades to a self-contained package.
- **Receipts everywhere** — every attempt (including blocked/duplicate) leaves a record.
- **Zero deps, plain ESM Node ≥18** — installs anywhere, tests anywhere, Windows-first.
