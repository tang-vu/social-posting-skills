---
name: post-hackernews
description: Adapt and publish campaign items on Hacker News — Show HN and link submissions with community-rule discipline
---

# Hacker News Adapter

Facts live in `platforms/hackernews.json`. HN has no write API and no media;
the audience is the most marketing-averse on this list — earn it.

## What HN rewards (culture)

- Plain, factual titles. "Show HN: X – what it does in a few words."
- Technical substance and honest limitations beat polish.
- Something people can actually try — repo, demo, product. Not a landing
  page, not a waitlist.
- The comments are the product: show up and answer everything honestly.

## Drafting from the content graph

- `core-claim` → "Show HN: Name — concrete description" (≤~80 chars is the
  truncation heuristic, not a published limit).
- `context` → optional text body: problem, approach, status.
- `technical` → what makes it interesting to THIS audience specifically.
- `link` → the URL field — point at the thing itself (repo/demo), not a
  marketing page.
- Never: superlatives, emoji, "revolutionary", asking for upvotes,
  reposting without real changes. These violate HN's documented rules and
  culture.

## Publishing

- `manual` (default) → draft with title/url/text ready to paste.
  Show HN timing and judgement are human calls — keep them human.
- `agent-browser` → simple form (title/url/text) — the simplest playbook,
  still with abort-on-ambiguity.
- No API exists.

## Genuine engagement

- After posting, the human should answer comments for hours — technically,
  honestly, without defensiveness. That conversation IS the launch.
- One Show HN per launch; resubmits only after real change and real time.

## Pitfalls

- Duplicate-detection: HN silently kills spam-flagged submissions.
- New accounts posting links get filtered — account standing matters.
