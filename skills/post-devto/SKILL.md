---
name: post-devto
description: Adapt and publish campaign items on Dev.to — markdown articles via official Forem API (draft-safe default)
---

# Dev.to Adapter

Facts live in `platforms/devto.json` (≤4 tags, cover image, canonical_url).
Official Forem API — implemented in this adapter.

## What Dev.to rewards (culture)

- Teaching. Step-by-step tutorials, honest postmortems, annotated code.
- Beginner-friendly framing travels far; gatekeeping does not.
- Tags are first-class discovery metadata — pick them carefully (≤4).
- Series for multi-part content; canonical_url for syndicated posts.

## Drafting from the content graph

- `core-claim` → descriptive title with the real subject (keywords help).
- `context` → intro: what it is, who it's for.
- `proof`/`technical` → the body: sections, code blocks, specifics.
- `demo` → "Try it" section with the actual commands.
- `roadmap` → closing "What's next" — Dev.to readers like a thread to pull.
- `cta` + links → footer; canonical_url when the piece is cross-posted.

## Publishing

- `api` → `DEVTO_API_KEY` env (dev.to/settings/extensions).
  Default is safe: posts go up as UNPUBLISHED drafts
  (`published: false`) unless the item's target sets `live: true`.
  A remote draft lets the human do a final in-editor review — prefer it.
- `agent-browser` → playbook for the dev.to/new markdown editor.
- `manual` → full draft package (title, tags, markdown body, cover ref).

## Genuine engagement

- Answer comments with real technical help.
- Read and comment on others' articles — Dev.to is a community first.

## Pitfalls

- >4 tags → validation error.
- A bare announcement with no teaching value underperforms — the campaign
  should adapt the launch into a story or a how-it-works piece.
- Rate limits exist; one article per launch is the right cadence.
