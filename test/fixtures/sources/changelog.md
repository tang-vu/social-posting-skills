# Changelog

## v1.0.0 — 2026-09-15

### Added
- Merkle-tree proof chains for every model call
- `rr verify transcript.jsonl` CLI command
- Support for OpenAI, Anthropic and local models

### Changed
- Proof generation is 40% faster than v0.9
- Receipt format is now stable (semver-guaranteed)

### Fixed
- Race condition in concurrent verification
- Windows path handling in the CLI
