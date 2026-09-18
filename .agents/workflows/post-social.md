---
description: Create and run a platform-native social distribution campaign from one source artifact
---
# Social Campaign Workflow

// turbo-all

When the user asks to post/share/announce/distribute content, run the
campaign pipeline — do NOT freestyle per-platform posts. Read
`.agents/skills/social-campaign/SKILL.md` first.

## Step 1: Source & intent

1. Identify the source artifact (README, CHANGELOG, release, post, URL,
   `owner/repo@tag`, `npm:pkg`, pasted text).
2. Clarify intent if needed: goal, audience, key message, disclosures.
3. Pick platforms deliberately — a campaign is not "post everywhere".

```bash
npx social-posting-skills campaign create --source <artifact> [--preset oss-launch] [--subreddit r/x]
```

## Step 2: Content graph (quality lives here)

```bash
npx social-posting-skills campaign graph <id>
npx social-posting-skills campaign set-node <id> --id <nodeId> --value "<text>"
```

- Refine every `extracted` node: sharpen core-claim, pick best proofs.
- ONE fact layer — fix facts in the graph once, not per platform.

## Step 3: Adapt & author

```bash
npx social-posting-skills campaign adapt <id>
npx social-posting-skills campaign set <id> --item <platform> --field body --value "<text>"
```

- Scaffold comes from the CLI; YOU write the native content using each
  platform skill (`.agents/skills/post-<platform>/SKILL.md`).
- Same facts, different voice. Never shrink one paragraph 12 times.

## Step 4: Preview & approve (human gate)

```bash
npx social-posting-skills campaign preview <id>
npx social-posting-skills campaign approve <id> --items a,b | --all
```

Show the approval package: platform, account, full content, links, media,
thread shape, warnings, char usage, disclosures, publish method. Items with
validation errors can't be approved — fix them first.

## Step 5: Publish or export

```bash
npx social-posting-skills campaign publish <id> [--items a,b] [--mode api|manual|agent-browser]
npx social-posting-skills campaign export <id>   # draft packages
```

- `manual` → complete draft package for the user to paste.
- `api` → official API where implemented + env creds configured.
- `agent-browser` → execute `playbook.json` literally. Abort on ambiguity,
  challenge, or CAPTCHA — never guess, never bypass.

## Step 6: Record outcome (side effects are real)

```bash
npx social-posting-skills campaign record <id> --item <i> (--url <u> | --failed | --unknown | --partial)
```

- `unknown` = ambiguous state → STOP, reconcile, never re-submit.
- `partial` = report exactly which posts landed.

## Step 7: Observe & learn (optional, honest)

```bash
npx social-posting-skills campaign observe <id> --url <u> --views n --likes n
npx social-posting-skills campaign learn <id> --text "<lesson>" [--inferred]
npx social-posting-skills learnings
```

## Hard rules

- No mass DMs, fake engagement, vote manipulation, astroturfing,
  follow/unfollow farming, CAPTCHA bypass, anti-detection, account
  rotation, or rate-limit circumvention.
- Approval before publish is the default.
- Ambiguous publish state → `unknown` + reconcile. Duplicates are worse
  than failures.
- Never print or commit credentials, cookies, or browser state.
