---
name: post-x
description: Adapt and publish campaign items on X (Twitter) — single posts and threads
---

# X (Twitter) Adapter

Machine-checkable facts (char limits, media bounds, publish modes) live in
`platforms/x.json` — the CLI validates against them. Do not hardcode numbers
here; they go stale.

## What X rewards (culture, not algorithm folklore)

- One sharp claim per post. The hook decides whether a thread gets read.
- Threads that teach: numbered steps, one idea per post, 5–10 posts.
- Build-in-public: real numbers, real decisions, real failures.
- Conversation over broadcasting — replies are where accounts grow.

## Drafting from the content graph

- `core-claim` → post 1 (hook). Cut adjectives; keep the strongest noun/verb.
- `proof`/`technical` nodes → thread posts 2..n, one per post.
- `cta` + `link` → last post, or a self-reply (see link note).
- Disclosures belong IN the content: "I built this" reads natively on X.

## Link note (heuristic, labeled)

Widely held community practice: put the external link in a self-reply rather
than the main post, to keep the post clean. The reach impact is a heuristic —
the platform data marks it `community-heuristic`, not a documented rule.

## Publishing

- `agent-browser` → execute `playbook.json` literally: composer selectors,
  "add to thread" for chains, bounded waits, verify once after Post.
- `api` → official X API exists but is paid-tier; adapter not implemented.
- `manual` → draft package with the full thread laid out.

On any challenge, ambiguous composer state, or uncertain post state: STOP and
report `unknown` — never re-submit.

## Genuine engagement (human participation)

- Reply substantively to comments on your post — add information, not "thanks!".
- Participate in your niche between posts because you have something to say,
  not as a distribution ritual.
- Do NOT mass-like, mass-follow, or recycle identical replies. These are the
  behaviors platforms penalize and this project prohibits.

## Pitfalls

- Typing via automation: chunk long text; emoji/unicode may not type.
- Rate limits are real — campaign volume should stay far below caps.
- Identical text cross-posted verbatim reads as spam; adapt per platform.
