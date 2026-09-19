# Code Standards

## Stack

- Plain **ESM JavaScript**, Node ≥18 (tested on 24). **Zero runtime dependencies** — that's a hard constraint, not a preference.
- Windows-first: no WSL/bash assumptions, `path.join` everywhere, npm scripts must run under cmd/PowerShell/Git Bash.

## Conventions

- ~200-line modules preferred; split by responsibility (`publish.js` orchestrates, `receipts.js` persists, `drafts.js` exports — not one mega-file).
- `camelCase` functions, kebab-case filenames when the name carries meaning (`post-x`, `social-campaign`).
- Comments explain *why* and *safety contracts* — not the what. Safety-critical invariants get a header comment at the top of the file (see `fetch.js`, `playbook.js`, `base.js`).
- No new comments on unchanged code; don't strip existing ones.
- Deterministic output: same input → same ids/hashes/UTMs (dates/random suffixes only where identity requires them).

## Error handling

- Throw with a message that names the thing (`Campaign not found: x`), never bare `throw new Error()`.
- Side-effect boundary (`publish.js`) catches adapter throws → `unknown` receipt — the ONE place exceptions become state.
- Validation accumulates errors/warnings rather than throwing at the first problem.

## Data rules

- `platforms/*.json` is the only home for platform numbers. Reading a fact = `getPlatform()`/`charLimit()`/`publishModes()` — never a literal in code or prose.
- JSON writes go through `atomicWriteJson`; logs through `appendJsonl`.
- Every externally visible artifact (campaign, item, receipt, draft package, playbook) carries `schemaVersion` or enough fields to be self-describing later.

## Security rules (enforced by tests where possible)

- Env vars for credentials; never log, persist, or print them.
- `assertAssetNameSafe` on media intake; `.gitignore` is part of the product (`doctor` checks it).
- Fetch only through `safeFetch`; adapters only through `publishItem`.
- Test seams (`fetchImpl`, `_setAdapterForTest`, `env` injection) — never `process.env` reads scattered in core.

## Tests

- `node:test` + `assert/strict`; file per area (`<area>.test.js`); shared setup in `helpers.js`.
- No network, no real credentials, no real platforms — inject fakes.
- Fault injection is a first-class test category: crash, timeout, partial, duplicate, ambiguous UI.
