# Safety Model

This project distributes content under **human control**. It is not a growth bot, a scheduler farm, or an engagement machine. This document is the contract: what the system does, what it refuses to do, and how it fails.

## Product boundary

**Will not implement, in any mode:**

- Mass DMs or unsolicited outreach
- Fake comments, likes, or engagement pods
- Vote manipulation (HN/Reddit/Product Hunt brigading of any kind)
- Coordinated astroturfing or multi-account campaigns
- Follow/unfollow farming
- CAPTCHA bypass or any anti-detection technique
- Account rotation or ban evasion
- Rate-limit circumvention
- Blind retry after an ambiguous side effect

If a feature request points at one of these, the answer is a draft package, not automation.

## Approval-first pipeline

```text
generate → preview → approve → publish
```

- `preview` renders the full approval package: platform, account hint, exact content, links, media, thread structure, warnings, char usage, disclosures, and publish method for every item.
- `approve` refuses items with validation errors. Approval is item-by-item or `--all` — there is no silent approve.
- `publish` only touches `approved` items. Statuses `exported`, `published`, `partial`, `unknown`, `awaiting-agent` all block re-publish unless `--force` is passed deliberately.
- The MCP tool `publish_approved_item` enforces the same gate — no agent path bypasses approval.

## Failure recovery (the part that matters)

External posting is a side effect. The system optimizes for **never double-posting**, even at the cost of a local failure:

| Situation | Outcome | Recovery |
|---|---|---|
| Publish confirmed | `published` receipt + postUrl | done |
| Clean failure before submit | `failed` receipt + draft preserved | fix and republish |
| Crash/timeout *after* submit | `unknown` + `needsReconciliation` | human checks profile → `campaign reconcile` |
| Thread died part-way | `partial` + publishedCount | continue from last confirmed post — never replay |
| Same content+platform seen before | `duplicate-blocked` receipt | inspect prior URL; `--force` only if intentional |

Reconciliation is explicit:

```bash
npx social-posting-skills campaign receipts <id>            # find unknown/partial
npx social-posting-skills campaign reconcile <id> --item x --published --url <postUrl>
npx social-posting-skills campaign reconcile <id> --item x --not-published
```

## Browser automation rules

Playbooks (`src/browser/playbook.js`) are bounded step lists, not free browsing:

- Centralized selector candidates in platform metadata; resolution requires **exactly one** match. Zero → abort. Many → abort. No "click the nearby button."
- Every step has a bounded wait; there are no indefinite waits.
- Challenge/CAPTCHA/login-wall detected → abort and preserve the draft. Never bypass.
- Post-submit ambiguity → report `unknown` with reconciliation steps. Never re-submit.
- Final step is always `verify-published`: confirm the post exists exactly once.
- Sanitized DOM fixtures under `test/fixtures/browser/` exercise OK / changed-UI / duplicate-button / challenge states offline.

## Secrets

- Credentials come from environment variables only (`BSKY_HANDLE`, `BSKY_APP_PASSWORD`, `DEVTO_API_KEY`, `FB_PAGE_ACCESS_TOKEN`, `FB_PAGE_ID`, `PH_API_TOKEN`). No credential store exists; nothing is written to campaign files, receipts, or logs.
- `.gitignore` excludes `.social-campaigns/`, `posts/`, `playbooks/`, `.env*`, `*.pem`, `*.p12`, `id_rsa*`, `*credentials*.json`, `*token*.json`, `cookies*.txt`, `chrome-profile/`, `.browser-state/`.
- Asset intake rejects sensitive-looking filenames (`assertAssetNameSafe`): keys, certs, cookies, tokens, keystores, `.env`.
- `doctor` checks the ignore rules and reports missing optional credentials as info, not failures.

## Remote fetch (SSRF)

`src/core/fetch.js` — used by URL/npm/GitHub ingestion:

- http/https only; other schemes rejected
- Blocks private/reserved IPs (incl. CGNAT, benchmarking, IPv6 loopback/ULA/link-local/v4-mapped), `localhost*`, and `*.local|.internal|.localhost|.lan|.home|.corp`
- Resolves DNS and rejects hosts answering private addresses (anti-rebinding)
- Max 3 redirects, each re-validated through the same checks
- 1 MB cap, 10 s timeout, text/json/markdown content types only

No path fetches authenticated or private content.

## Rate limits & scheduling

- Publishing is one-shot per invocation; there is no background daemon, no queue, no auto-loop.
- `campaign schedule` records *intent* (explicit IANA timezone, ISO instant). `calendar`/`due` only *list* what's due — nothing fires by itself.
- Adapter metadata may carry conservative rate guidance; there is no circumvention logic.

## Learnings integrity

Observations are manual imports (`campaign observe`). Learnings are split `observed` vs `inferred`; summaries always carry the caveat that inferred notes are hypotheses, not causal claims. Variant comparisons report raw totals only — no significance math, no "the algorithm rewards X."

## Reporting

Found a path that violates this model? Open an issue or email the maintainer — do not demo it against a live account.
