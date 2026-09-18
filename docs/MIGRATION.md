# Migration: v2 → v3

v3 turns the repository from "a collection of posting prompts" into a campaign pipeline. This page covers what changed, what still works, and how to move over.

## TL;DR

- `npx social-posting-skills` still installs skills into `.agents/skills` — unchanged UX.
- Skills moved to canonical `skills/` in the repo; `.agents/skills/` is generated from them (identical content).
- Posting is now a **campaign**: create → preview → approve → publish/export.
- Old "engagement warm-up" and algorithm-certainty advice was removed deliberately.
- `posts/` remains the legacy draft location; new draft packages live under `.social-campaigns/`.

## Install paths (unchanged)

| v2 | v3 | Notes |
|---|---|---|
| `npx -y social-posting-skills` | same | project `.agents/skills` + workflows + `posts/` dirs |
| `--antigravity` | `--antigravity` | `~/.gemini/antigravity/skills` |
| `--claude` | `--claude` | `~/.claude/skills` |
| `--cursor` | `--cursor` | `~/.cursor/skills` |
| `--gemini` | `--gemini` | `~/.gemini/skills` |
| `--path DIR` | `--path DIR` | custom |
| — | `--codex`, `--opencode`, `--generic` | new targets |

The installer no longer clones the repo — it copies the bundled `skills/` tree, so the installed version always matches the package version. A `.social-skills-manifest.json` records content hashes; `doctor` reports stale installs.

## Skill map

| v2 skill (`.agents/skills/`) | v3 status |
|---|---|
| `content-writing` | rewritten — graph-aware adaptation, no templates-as-truth |
| `image-generation` | rewritten — media manifest + alt text focus |
| `post-*` (12 skills) | rewritten — lean, reference `platforms/*.json` instead of inlined numbers |
| `post-social` workflow | rewritten — now the campaign lifecycle, same filename |
| — | **new** `social-campaign` orchestrator skill |

## Removed on purpose

| v2 behavior | Why it's gone |
|---|---|
| "Warm up the algorithm" like/reply rituals before posting | Engagement-farming flavored; not verifiable; violates the anti-spam boundary |
| "Links reduce reach 25-35% — confirmed" style claims | Folklore stated as fact; replaced by labeled heuristics in `platforms/*.json` |
| Per-skill hardcoded char limits | Now single-source data in `platforms/*.json` with `lastReviewed` + confidence |
| Direct `browser_subagent` posting instructions | Replaced by bounded playbooks that abort on ambiguity/challenges |
| Auto-post framing ("Post about X to all platforms") | Replaced by create→preview→approve→publish; nothing posts without approval |

## State files

| v2 | v3 |
|---|---|
| `posts/drafts/<platform>_post.md` | `.social-campaigns/<id>/drafts/<platform>/` (package.json + post.md + playbook.json) — the legacy path is still written for compatibility |
| — | `.social-campaigns/<id>/receipts.jsonl`, `receipts-index.jsonl`, `learnings.jsonl`, `index.json` |

`.social-campaigns/` and `posts/` are gitignored. Campaign state is local; nothing syncs anywhere.

## For agent users

v2 prompt: *"Post about X to all platforms"* — still works conceptually, but the agent now creates a campaign, shows you a preview, and waits for approval. If you had muscle memory for `/post-social`, it now runs the same campaign lifecycle.

## For library users

v2 had no API. v3 exposes one:

```js
import { ingest, createCampaign, adaptCampaign, approvalPackage } from "social-posting-skills";
```

## Breaking changes

- `skill.json` manifests are new; tools that scanned `SKILL.md` frontmatter still work (SKILL.md format unchanged).
- `platforms/*.json` is the only place limits live — any fork that edited numbers inside SKILL.md must port them to the JSON files.
- `bin/cli.js` is a real CLI now. Bare `npx social-posting-skills` still installs (backward compatible), but `npx social-posting-skills campaign …` runs commands.
