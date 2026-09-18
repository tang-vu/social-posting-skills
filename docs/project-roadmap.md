# Project Roadmap

## v3.0 — this release (done on this branch)

- Campaign pipeline: ingest → graph → adapt → validate → approve → publish/export → observe → learn
- 12 platform metadata files (`platforms/*.json`) with review dates + confidence
- Adapter contract; Bluesky + Dev.to API implementations; universal draft fallback
- CLI (full lifecycle), MCP server, library API, bundled installer with drift detection
- Rewritten skills (orchestrator + 12 platform + 2 shared) + skill.json manifests
- 83-test suite; browser DOM fixtures; SSRF tests; dogfood OSS fixtures
- Docs: README, SAFETY, MIGRATION, MAINTENANCE, architecture, troubleshooting, PDR

## Next (3.x)

- **More API adapters** — LinkedIn, Facebook Pages, Threads (Meta API), Product Hunt. Metadata already declares them `implemented: false`; adapters land as credentials/testing allow.
- **More browser fixtures** — per-platform sanitized DOM states beyond X (threads, reddit, substack, hackernews, facebook, devto).
- **Variant experiments** — A/B hooks exist (`addItem --variant`, `campaign variants`); add minimum-interval guards per community so variants can't spam a subreddit.
- **Import more source types** — RSS feed items, YouTube release videos, papers (arXiv abs pages).
- **Analytics import polish** — CSV import of platform-exported metrics.
- **`doctor` CI mode** — `--ci` flag for machine-readable output.

## Later (4.0 candidates)

- **Hosted state option** — opt-in sync of `.social-campaigns/` for teams (local-first stays the default).
- **Editorial calendar UI** — the local calendar as a small static HTML render (still no daemon).
- **More presets** — `research-paper`, `product-launch`, `milestone-update`, `security-advisory`.
- **Localization of playbooks** — selector candidates for non-English UI locales (fixture-driven).

## Explicitly out of scope

- Mass engagement, DM tooling, growth-hacking features (see `docs/SAFETY.md`)
- Auto-publish-on-release pipelines (draft generation is the ceiling for CI)
- Algorithm-certainty features ("post at 9am for +40% reach")
- Account/ban evasion of any kind
