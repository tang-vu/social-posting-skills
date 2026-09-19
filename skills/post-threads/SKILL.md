---
name: post-threads
description: Adapt and publish campaign items on Threads (Meta) — posts and composer-chain threads
---

# Threads Adapter

Facts live in `platforms/threads.json` (500 chars, 10 images, topic tags).
Threads' feature set changes fast — re-check the data file quarterly.

## What Threads rewards (culture)

- Casual, warm, conversational. Instagram energy, not LinkedIn energy.
- Short personal takes and reply-chain storytelling.
- One topic tag per post (tags, not hashtag strings).

## Drafting from the content graph

- `core-claim` → conversational opener, not a headline.
- `proof` → 2–4 follow-up posts in a chain.
- `cta` → soft ask; hard sells read badly here.
- Link → reply-preferred (heuristic label in the data).

## Publishing

- `agent-browser` → playbook uses "Add to thread" composer chaining;
  posts publish together as a chain.
- `api` → official Threads API exists (Meta app required); not implemented.
- `manual` → draft package.

## Genuine engagement

- Reply casually to commenters; Threads is a conversation space.
- No engagement bait, no recycled comments, no bait questions.

## Pitfalls

- Feature churn: text attachments, reply approvals, fediverse — verify
  current behavior in the data file before promising capabilities.
- Automation via browser is brittle here — drafts are the safe fallback.
