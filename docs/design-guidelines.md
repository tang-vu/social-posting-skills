# Design Guidelines

Principles that shaped v3 — consult before adding features.

## 1. Human accountability is the product

The tool's job is making the *human decision* well-informed: full preview, explicit approval, honest failure states. Any feature that removes the human from the loop is a red flag, not an optimization.

## 2. Platform-native, not cross-posted

A campaign is a graph rendered differently per platform, not a post copied everywhere. If a proposed output is "the same text but shorter," it's wrong. Tone can vary; facts can't.

## 3. Rules as data

Volatile platform knowledge is `platforms/*.json` with `lastReviewed` + `confidence`. Prose may explain culture; numbers live in JSON. When in doubt, mark `heuristic` or `unknown` — never present a guess as a limit.

## 4. Honest capabilities

Adapters advertise only what exists. `api` appears only with a working implementation + env contract. Manual draft export is a first-class outcome everywhere — absence of automation is a mode, not an error.

## 5. Fail toward no-post, not double-post

Ambiguous side effects → `unknown` + reconciliation. Selector ambiguity → abort. Challenge → abort. A local failure is always cheaper than a public duplicate.

## 6. Local-first, zero-dep

Everything works offline until a remote source is explicitly fetched or a publish is explicitly run. No accounts, no daemons, no telemetry. Keep dependencies at zero — the install surface is the feature.

## 7. Deterministic where possible

Ids, content hashes, UTM params, filenames — stable across runs so duplicates and diffs are visible.

## 8. Claims carry confidence

Observed vs inferred in learnings; documented vs community vs heuristic in platform facts; verified vs folklore in advice. The system never says "this will perform better" — it says what it observed.

## 9. The agent is a reviewer too

Generated content is a *scaffold* (`origin: "extracted"`) meant to be refined via `set-node`/`set` before approval. Graph warnings nag about unreviewed nodes on purpose.

## 10. Compatibility where cheap

`.agents/skills`, `.agents/workflows/post-social.md`, `posts/drafts/` legacy paths, bare-`npx` install — kept because users have muscle memory. Removed only when a path actively conflicts with safety.
