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

### Lessons from the v3.0.0 publish (2026-09-19)

The release initially failed three times; the workflow now handles all three root causes:

1. **`actions/setup-node` dummy token** — with `registry-url` and no `NODE_AUTH_TOKEN`, setup-node@v4 exports a placeholder token (`XXXXX-...`) that lands in `.npmrc` as `_authToken`. npm treats auth as configured, skips OIDC, and the registry returns **E404** (setup-node#1551). Fix: the workflow strips the `_authToken` line when the token is empty.
2. **Invalid `NPM_TOKEN`** — the stored secret also fails E404 (expired/revoked/insufficient scope). Trusted publishing on npmjs.com is configured and is now the primary auth; rotate the token only as a documented fallback.
3. **npm too old for OIDC** — Node 20 ships npm 10.x which cannot do the OIDC exchange (ENEEDAUTH). Workflow runs Node 24 + `npm install -g npm@latest` (trusted publishing needs npm ≥ 11.5.1).

Result: `social-posting-skills@3.0.0` published 2026-09-19 via OIDC + signed provenance (sigstore log index 2890607047), run [#35418975095](https://github.com/tang-vu/social-posting-skills/actions/runs/35418975095).

## GitHub Action (draft generation, not auto-posting)

`examples/github-action-draft.yml` shows a release-triggered workflow that generates campaign **draft packages as artifacts for human review**. It never publishes — by design there is no "on release → auto-post" path.

## Versioning

- Platform-fact updates that change behavior → at least patch release + note.
- New platform/adapter/interface → minor.
- Boundary or contract changes (safety model, adapter contract) → major.

## Rollback

npm deprecate the bad version (`npm deprecate social-posting-skills@<v> "reason"`) and republish the prior tree. Campaign state is local — no data migration needed on downgrade.
