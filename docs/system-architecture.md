# Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                     Agent Interfaces                          │
│   skills/ (SKILL.md)   bin/cli.js   src/interfaces/mcp.js      │
│   src/interfaces/install.js  ·  src/interfaces/doctor.js       │
└──────────────┬───────────────────────────────────────────────┘
               │ calls (no side effects below this line except publish)
┌──────────────▼───────────────────────────────────────────────┐
│                      Campaign Core (src/core)                 │
│                                                               │
│  ingest.js ──► source doc ──► graph.js ──► adapt.js           │
│      │            (one          (one          (platform-      │
│      │           artifact)       fact          native         │
│      │                           layer)        items)         │
│  fetch.js (SSRF-safe, bounded)                                │
│                                                               │
│  validate.js ──► approve.js ──► publish.js ──► receipts.js    │
│  (limits,            (explicit,      (side-      (durable      │
│   structure,          inspectable     effect      record +     │
│   disclosures)        package)        boundary)   dup index)   │
│                                                               │
│  drafts.js (universal fallback)  media.js  links.js           │
│  schedule.js (intent only)       learnings.js (obs/inferred)  │
│  store.js (.social-campaigns)    presets.js (oss-launch…)     │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│              Platform Adapters (src/adapters)                 │
│  base.js contract ── registry.js ── platforms/bluesky.js      │
│                                     platforms/devto.js       │
│  capabilities(): generate/validate/preview/draft/publish/     │
│  observe/thread/media — honest per platform                  │
│  publishApi() is the ONLY side-effecting method              │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│            Platform Rules as Data (platforms/*.json)          │
│  constraints · thread · media · links · hashtags · caps ·     │
│  publishing · automation.selectors · rateLimit · culture ·    │
│  verification{lastReviewed, confidence, sources}             │
└──────────────────────────────────────────────────────────────┘
```

## Layers

### 1. Platform rules as data

`platforms/*.json` — 12 files, one per platform. Everything volatile lives here: limits, media bounds, thread support, link policy, selector candidates, publish modes, cultural notes. Each file carries `verification.lastReviewed` and per-fact `confidence` (`documented`/`community`/`heuristic`/`unknown`). Loaded once via `loadPlatforms()`; `charLimit()` unwraps `{value, confidence}` objects.

### 2. Campaign core (`src/core`)

Pure logic, deterministic except where a side effect is unavoidable:

- **ingest.js / fetch.js** — source → `SourceDoc {type, ref, title, text, links[], hash, meta}`. Local files, text, URLs, GitHub releases, npm metadata, git-diff summaries. Remote fetch is SSRF-guarded and bounded.
- **graph.js** — `SourceDoc` → content graph: `core-claim`, `context`, `proof`, `technical`, `demo`, `quote`, `roadmap`, `cta`, `link`, `media-ref` nodes. Extraction is a scaffold; `setNodeText` marks edited nodes `origin: "authored"`.
- **adapt.js** — graph → per-platform `content` on each item. Builders are platform-native (X thread vs LinkedIn narrative vs Show HN title/url). `adaptCampaign` preserves authored content unless `overwrite`.
- **validate.js** — per item: char limits, thread structure/order, required fields, media bounds, link policy, hashtag policy, disclosures visibility, engagement-bait refusal, unverifiable-number warnings, cross-item duplication.
- **approve.js** — approval package (everything needed to decide) + `approveItems` (refuses invalid items).
- **publish.js** — the side-effect boundary. Approval gate → content-hash duplicate check → dispatch on mode (`manual` export / `agent-browser` playbook / `api`). Ambiguous adapter failures become `unknown` receipts with reconciliation steps — never a retry.
- **receipts.js** — append-only JSONL per campaign + global index. Drives duplicate detection and `unreconciledReceipts`.
- **drafts.js** — universal fallback: `package.json` + `post.md` (+ `playbook.json`) per item; also writes the legacy `posts/drafts/` path.
- **media.js / links.js / learnings.js / schedule.js / store.js / presets.js** — asset manifests + sensitive-name guard; canonical links + deterministic UTM; observed-vs-inferred learning store; explicit scheduling intent; atomic JSON store; `oss-launch` preset.

### 3. Adapters (`src/adapters`)

`makeAdapter({id, overrides})` reads platform metadata and exposes `capabilities()`. `api` is advertised only when a real `publishApi` exists — currently Bluesky (AT Protocol, reply-chained threads) and Dev.to (Forem API, remote drafts via `published: false`). Every other platform is manual/agent-browser honest.

`_setAdapterForTest` is the fault-injection seam: tests inject fake adapters/fetches without touching the network or filesystem.

### 4. Browser support (`src/browser`)

- **selectors.js** — resolution contract over a simplified DOM: exactly-one-match or report `missing`/`ambiguous`. Supports `[attr='v']`, contains/prefix, `tag`, `tag[attr]`, `:has-text()`, `text=`, `#id`, `.class`. Unsupported forms never match — no guessing.
- **playbook.js** — builds the bounded step list an agent's browser tooling executes: compose → fill → submit → `verify-published` (+ optional first-comment). Every playbook embeds abort conditions (challenge, selector miss/ambiguous, timeout, login-expired, ambiguous-publish-state) and the `campaign record` commands to report back.

### 5. Interfaces (`src/interfaces`)

- **cli.js** — full campaign lifecycle; bare invocation still installs (v2 compat).
- **mcp.js** — stdio JSON-RPC, minimal MCP subset; `publish_approved_item` re-checks approval server-side; no browser tool.
- **install.js** — copies bundled `skills/` to the selected target, writes a content-hash manifest for drift detection.
- **doctor.js** — node/platform/git checks, metadata+adapter counts, store writability, optional-credential info, `.gitignore` safety checks, install drift.

## Data & control flow (a publish)

```text
CLI publish <id> --item x --mode api
  → load campaign            (store.js)
  → publishItem()
      1. status must be "approved"            (else blocked)
      2. refreshItemHash → findDuplicates     (global receipts index)
      3. dispatch mode:
         manual        → exportDraft → receipt "draft-exported"
         agent-browser → write playbook + draft → receipt "awaiting-agent"
         api           → adapter.publishApi → receipt result
      4. adapter throws → receipt "unknown" + reconciliationSteps
  → receipt → item status + history updated → save
```

## Invariants

- `platforms/*.json` is the only place platform numbers live.
- Nothing publishes that isn't `approved`.
- A receipt exists for every side-effect attempt, including blocked/duplicate ones.
- Any ambiguous outcome is `unknown`, never a silent retry.
- Every platform can degrade to a draft package.
- Tests never contact a platform or the network (`fetchImpl`/`_setAdapterForTest` seams; DNS-free SSRF tests use IP literals).
