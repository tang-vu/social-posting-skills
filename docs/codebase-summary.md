# Codebase Summary

Zero-dependency ESM Node ≥18. Entry points: `bin/cli.js`, `bin/install.js`, `bin/prepack.js`.

## `src/core/` — campaign engine (pure, no network except ingest/fetch)

| File | Responsibility |
|---|---|
| `campaign.js` | Campaign/item model, ids, status transitions, content hashing, save/load |
| `store.js` | `.social-campaigns/` layout, atomic JSON writes, JSONL appends, index |
| `ingest.js` | Source spec routing + doc building (file/text/url/github-release/npm/git-diff) |
| `fetch.js` | SSRF-safe bounded fetch (scheme allowlist, private-IP/DNS blocks, redirect re-validation, byte cap) |
| `graph.js` | SourceDoc → content graph (core-claim/context/proof/technical/demo/quote/roadmap/cta/link/media-ref) |
| `adapt.js` | Graph → per-platform content; `adaptCampaign` preserves authored edits unless `overwrite` |
| `validate.js` | Per-item validation: limits, threads, required fields, media, links, hashtags, disclosures, engagement-bait, fact-check warnings |
| `approve.js` | Approval package render + `approveItems` (skips invalid) |
| `publish.js` | Side-effect boundary: approval gate → dup check → mode dispatch; `unknown` on ambiguity |
| `receipts.js` | Receipt shape, JSONL persistence, item status application, duplicate + unreconciled queries |
| `drafts.js` | Draft package export (`package.json`, `post.md`, `playbook.json`, media copies, legacy path) |
| `media.js` | Asset manifest entries (PNG/JPEG dims, size caps, sha256), per-platform media validation, sensitive-name guard |
| `links.js` | Link normalization, canonical link, deterministic UTM |
| `learnings.js` | Observations (manual import), observed/inferred learning store, variant comparison |
| `schedule.js` | Explicit scheduling intent (IANA tz), due listing, calendar view — no daemon |
| `platforms.js` | `platforms/*.json` registry loader + `charLimit`/`publishModes`/etc helpers |
| `presets.js` | `oss-launch`, `release-notes-only`, `dev-article` campaign factories |
| `util.js` | sha256, slugify, nowIso, truncation, JSONL helpers |

## `src/adapters/` — publishing boundary

- `base.js` — `makeAdapter` contract; `capabilities()` honest per platform; `publishApi` is the only side effect
- `registry.js` — platform→adapter map; `_setAdapterForTest` seam
- `platforms/bluesky.js` — AT Protocol session + chained reply threads + first-comment
- `platforms/devto.js` — Forem API; `published:false` remote drafts supported

## `src/browser/` — agent-browser support

- `selectors.js` — DOM-fixture selector resolution; exactly-one-match contract
- `playbook.js` — bounded step lists with abort conditions + completion-report commands

## `src/interfaces/` — agent surfaces

- `cli.js` — all commands; bare run = install (v2 compat); `--item/--items` targeting
- `mcp.js` — stdio JSON-RPC; approval-gated `publish_approved_item`; no browser tool
- `install.js` — bundled `skills/` → target dir (project/claude/codex/gemini/antigravity/cursor/opencode/custom); manifest + `installDrift`
- `doctor.js` — env, metadata, adapters, store, optional creds (info), `.gitignore` safety, drift

## `skills/` — canonical agent skills (15)

`social-campaign` orchestrator + `content-writing` + `image-generation` + 12 `post-*`. Each has `SKILL.md` + `skill.json`. `.agents/skills` regenerates from here via installer/`prepack`.

## `platforms/` — rules as data (12)

`{id, displayName, version, status, verification{lastReviewed,confidence,sources}, constraints, thread, media, links, hashtags, capabilities, publishing, automation{entryUrl,selectors,boundedWaitMs}, rateLimit, culture}`.

## `test/` — node:test, no network

`helpers.js` (temp roots, `testCampaign`, `fakeFetch`, `writePng`) + 12 suites covering model, graph, adapt, validate, publish/fault-injection, ingest/SSRF, media/links, learnings/schedule, selectors/fixtures, CLI subprocess, MCP subprocess, skills/installer/metadata, dogfood preset.

## Data flow quick map

`ingest → SourceDoc → createCampaign(items per platform) → buildContentGraph → adaptCampaign → validateItem → approvalPackage → approveItems → publishItem → receipt+status → save`
