# Deployment Guide

How this package is built, verified, and released.

## Package contents

`npm pack` includes (see `files` in `package.json`): `bin/`, `src/`, `skills/`, `platforms/`, `.agents/` (compatibility skills + workflow), `README.md`, `CATALOG.md`, `CONTRIBUTING.md`, `LICENSE`, `docs/`, `package.json`.

**Excluded always:** `test/`, `.social-campaigns/`, `posts/`, `playbooks/`, `node_modules/`, `.env*`, keys, cookies, browser state — enforced by `files` allowlist + `.gitignore` + `bin/prepack.js` which regenerates `.agents/skills` from `skills/` so published copies are never stale.

## Verification before release

```bash
npm test                 # 83 tests, zero network
npm run doctor           # env + metadata + adapters + store + secrets-ignore + drift
npm pack --dry-run       # inspect file list — no secrets, no state, skills fresh
node bin/cli.js campaign create --source test/fixtures/sources/oss-readme.md --preset oss-launch
```

A clean `pack` contains: no `.env*`, no `*.pem`/`*.p12`/`id_rsa*`, no `cookies*`, no `.social-campaigns`, no `chrome-profile`, no `node_modules`.

## Release process

1. All checks above green on `main`-bound branch; PR merged (or maintainer commits).
2. `npm version <major|minor|patch>` — bump + tag.
3. `git push --follow-tags`.
4. GitHub Action `.github/workflows/publish.yml` publishes on the `v*` tag using **npm Trusted Publisher (OIDC)** — no long-lived npm token needed.

### OIDC / Trusted Publishing note

The publish workflow uses `id-token: write` + `npm publish --provenance`. That requires:

- The package on npmjs.com configured for trusted publishing with this repo+workflow (Settings → Publishing access → GitHub Actions), or
- A granular `NPM_TOKEN` secret as fallback — if `secrets.NPM_TOKEN` exists the workflow uses `NODE_AUTH_TOKEN`; otherwise rely on OIDC alone. **Do not commit tokens.**

If the workflow file still carries `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` alongside OIDC, that's fine — npm uses whichever credential is present — but prefer removing the token secret once trusted publishing is configured.

## GitHub Action (draft generation, not auto-posting)

`examples/github-action-draft.yml` shows a release-triggered workflow that generates campaign **draft packages as artifacts for human review**. It never publishes — by design there is no "on release → auto-post" path.

## Versioning

- Platform-fact updates that change behavior → at least patch release + note.
- New platform/adapter/interface → minor.
- Boundary or contract changes (safety model, adapter contract) → major.

## Rollback

npm deprecate the bad version (`npm deprecate social-posting-skills@<v> "reason"`) and republish the prior tree. Campaign state is local — no data migration needed on downgrade.
