# Maintenance

Social platform facts go stale. This project treats them as **versioned data with review dates**, not folklore frozen in prompts.

## The rule

`platforms/*.json` is the single source of truth for volatile facts: char limits, image bounds, thread semantics, link policy, hashtag rules, publish modes. Code and skills read the data; nothing else may restate the numbers.

When you update a fact:

1. Edit the platform's JSON file.
2. Update `verification.lastReviewed` (ISO date).
3. Set the right `confidence` on the field (`documented` | `community` | `heuristic` | `unknown`) and add/adjust the `note` or a source URL.
4. If the change alters behavior (new limit, new publish mode, removed feature), bump `version` and note it in the changelog/release notes.
5. Run `npm test` — `test/skills.test.js` validates every file against the required key set.

## Confidence levels

| Level | Meaning | Example |
|---|---|---|
| `documented` | Official docs/specs, linked in `sources` | X post limit 280 |
| `community` | Widely observed convention, not contractual | "Show HN titles perform best under ~80 chars" |
| `heuristic` | Our recommendation, explicitly labeled | "Prefer link-in-reply on X" |
| `unknown` | Unverified — say so rather than guess | PH image dimension details |

A `community`/`heuristic` fact must never be phrased as platform law. If you can't source it, label it.

## Review cadence

- **Quarterly sweep:** re-check every `lastReviewed` older than ~90 days against official docs. Update the date even when nothing changed — a fresh review date is itself the signal.
- **On any platform incident** (UI change, API deprecation, policy update): fix the affected file immediately; bump `version`.
- **On release:** `doctor` prints platform count and staleness hints; `platforms/README.md` explains the schema.

```bash
npx social-posting-skills doctor          # env + metadata sanity
node -e "const p=[...require('node:fs').readdirSync('platforms')].filter(f=>f.endsWith('json'));for(const f of p){const j=require('./platforms/'+f);console.log(j.id.padEnd(14), j.verification.lastReviewed, j.version)}"
```

## Skill maintenance

- Canonical skills live in `skills/`; `.agents/skills/` is generated (`node bin/cli.js install --project`). Never edit `.agents/` directly.
- SKILL.md files must reference platform data (`platforms/x.json`) instead of restating numbers. The test `SKILL.md files do not hardcode char limits` enforces this.
- New skill → also add `skill.json` (name/description/version/capabilities) — `test/skills.test.js` will fail without it.

## Selector maintenance

Browser selectors live in `platforms/*.json` (`automation.selectors` candidate lists).

- When a platform UI changes: add the new selector to the candidate list; do **not** delete the old one immediately (rollouts are gradual).
- Update the matching fixture in `test/fixtures/browser/` to cover the changed shape — fixtures exist so a UI change is a test edit, not a production incident.
- Never add selectors that target challenge/CAPTCHA elements for bypass purposes. Detection only.

## Deprecating a platform

Don't delete — mark `"status": "deprecated"` in the JSON, explain in `culture.notes`, keep the adapter (draft export still works), and update CATALOG.md.

## Release checklist

See `docs/deployment-guide.md`. Short version: `npm test` green → `npm run doctor` → `npm pack --dry-run` clean → version bump → tag → CI publishes via OIDC.
