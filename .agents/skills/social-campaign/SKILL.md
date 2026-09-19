---
name: social-campaign
description: Turn one source artifact (release, README, post, changelog) into a reviewable, platform-native distribution campaign under human control
---

# Social Campaign

Turn ONE source artifact into a safe, reviewable, platform-native distribution
campaign. You are the content intelligence; the `social-posting-skills` CLI is
the deterministic plumbing (validation, approval, receipts, drafts, publishing
modes). The human approves before anything is published.

## Pipeline

```
Source → Campaign intent → Content graph → Platform adaptations
→ Preview → Human approval → Publish or export draft → Observe → Learnings
```

## Commands (use the CLI; do not hand-roll files)

```bash
npx social-posting-skills campaign create --source <artifact> [--preset oss-launch]
npx social-posting-skills campaign graph   <id>          # see the content graph
npx social-posting-skills campaign set-node <id> --id <node> --value "<text>"
npx social-posting-skills campaign adapt   <id>          # regenerate scaffolds
npx social-posting-skills campaign preview <id>          # THE approval package
npx social-posting-skills campaign approve <id> --items a,b | --all
npx social-posting-skills campaign publish <id> [--items a,b] [--mode ...]
npx social-posting-skills campaign export  <id>          # draft packages
npx social-posting-skills campaign record  <id> --item <i> (--url|--failed|--unknown|--partial)
npx social-posting-skills campaign observe <id> --url <u> --views n --likes n
npx social-posting-skills campaign learn   <id> --text "<lesson>" [--inferred]
```

Or the same operations as MCP tools (`social-posting-skills mcp`).

## Your job at each step

1. **Source** — accept README, CHANGELOG, release notes, blog post, URL,
   `owner/repo@tag`, `npm:pkg`, `git:<range>`, or pasted text. Never fetch
   private/authenticated URLs; the fetcher refuses private hosts anyway.

2. **Intent** — ask if unclear: goal (launch/explain/milestone), audience,
   key message, disclosures ("I built this", "Open source", "Sponsored").
   A campaign is not "post this everywhere" — pick platforms deliberately.

3. **Content graph** — THIS IS WHERE QUALITY LIVES. The CLI extracts a
   scaffold graph (core-claim, context, proof, technical, demo, cta, links).
   Refine every `extracted` node: sharpen the claim, pick the 3 best proofs,
   keep ONE fact layer — every platform renders from this same graph, so
   fix facts once, not twelve times.

4. **Adaptation** — `campaign adapt` produces structural scaffolds per
   platform. Rewrite each into genuinely native content using the platform
   skill (`post-x`, `post-reddit`, ...). Update via:
   `campaign set <id> --item <platform> --field body --value "<text>"`
   Do NOT shorten the same paragraph 12 times — that fails review.

5. **Preview** — always show the approval package. It lists per item:
   platform, account, full content, links, media+alt text, thread shape,
   warnings, char usage, disclosures, publish method.

6. **Approval** — the human picks items. Items with validation errors
   cannot be approved; fix them first.

7. **Publish / export** — three modes, chosen per item:
   - `manual` → complete draft package (files + instructions)
   - `api` → official API if the adapter implements it and env creds exist
   - `agent-browser` → a `playbook.json` you execute with your own browser
     tools. Follow it literally: bounded waits, exact selectors, and
     **abort on ambiguity or any challenge/CAPTCHA — never click a
     look-alike, never bypass a challenge.**

8. **Outcome** — after browser publishing, record what happened:
   `published` (with URL), `partial` (say exactly which posts landed),
   `failed`, or `unknown` (ambiguous → do NOT re-submit; reconcile first).

9. **Observe & learn** — import metrics later (`campaign observe`).
   Store lessons with honest labels: `--text` for observed facts,
   `--inferred` for hypotheses. Never claim a pattern "caused" reach.

## Hard rules (non-negotiable)

- No mass DMs, fake engagement, vote manipulation, astroturfing,
  follow/unfollow farming, CAPTCHA bypass, anti-detection, account rotation,
  or rate-limit circumvention. Ever.
- Approval before publishing is the default. `--allow-unapproved` exists
  only for explicitly trusted, configured automation — do not default to it.
- Duplicate public posts are worse than failures. Ambiguous state → record
  `unknown`, give reconciliation steps, stop.
- Never print or store credentials, cookies, or browser profile data.
- Facts come from the source/factBase. If you can't verify a number, cut it.
