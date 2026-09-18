# Contributing

## Ground rules

- `platforms/*.json` is the only source of platform numbers — never restate limits in code, skills, or docs.
- Nothing publishes without `approved` status; no bypass paths.
- No spam machinery — see `docs/SAFETY.md` for the full boundary before proposing features.
- Canonical skills live in `skills/`; never edit `.agents/` (generated).
- Tests must never contact a platform or the network — use `fetchImpl` injection and `_setAdapterForTest`.

## Add a platform

1. **`platforms/<id>.json`** — copy an existing file; fill `constraints`, `thread`, `media`, `links`, `hashtags`, `capabilities`, `publishing`, `automation.selectors`, `rateLimit`, `culture`, `verification{lastReviewed, confidence, sources}`.
2. **Adapter** — if the platform has an official API you want to support, add `src/adapters/platforms/<id>.js` using `makeAdapter({id, overrides: {publishApi}})` and register it in `src/adapters/registry.js` `OVERRIDES`. Otherwise the generic adapter covers it (manual/agent-browser from metadata).
3. **Content builder** — add `build<Platform>` in `src/core/adapt.js` and map it in `BUILDERS`. Shape content natively, don't truncate a generic post.
4. **Skill** — `skills/post-<id>/SKILL.md` + `skill.json` (copy an existing pair; reference `platforms/<id>.json`, don't inline numbers).
5. **Fixtures** — if it has an agent-browser mode, add sanitized DOM fixtures under `test/fixtures/browser/` (ok / changed-UI / ambiguous / challenge).
6. **Tests** — adapter contract coverage is automatic via `test/skills.test.js`; add platform-specific validation/adaptation tests.
7. **Docs** — `CATALOG.md`, `docs/PLATFORM_COMPARISON.md`, README capability table.

## Update platform facts

See `docs/MAINTENANCE.md`. Always update `verification.lastReviewed` and set honest `confidence`.

## Dev loop

```bash
npm test                    # node --test test/*.test.js — 83 tests, no network
npm run doctor              # env + metadata + store + drift checks
node bin/cli.js campaign create --source test/fixtures/sources/oss-readme.md --preset oss-launch
```

Work happens in plain Node ≥18, zero runtime dependencies, ESM. Windows-first — no WSL assumptions, no shell-isms in npm scripts.

## Commits & releases

- Conventional-ish messages; explain *why*, not just *what*.
- Never commit `.social-campaigns/`, `posts/`, `.env*`, keys, cookies, or browser state — `doctor` checks the ignore rules.
- Release process: `docs/deployment-guide.md`.
