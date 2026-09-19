---
name: post-producthunt
description: Adapt and publish campaign items on Product Hunt — launch kits (tagline, description, maker comment) prepared for manual launch
---

# Product Hunt Adapter

Facts live in `platforms/producthunt.json` (60-char tagline, launch asset
requirements). PH historically sits behind Cloudflare bot detection —
manual launch is the supported path, and a complete launch kit makes it easy.

## What PH rewards (culture)

- "What it does, for whom" taglines — concrete beats clever.
- A demo GIF/screenshots that show the product working.
- A maker comment with the real story: why you built it.
- Launch-day presence: the maker answers every comment personally.

## Drafting from the content graph (launch kit)

- name (≤40), tagline (≤60) from `core-claim` — "{does what} for {whom}".
- `context` → problem paragraph of the description.
- `proof` → key-features list.
- `demo`/`link` → product URL + gallery assets (media manifest).
- `roadmap` → "what's next" line in the description.
- `cta` → maker comment: personal, invitational, first-person.
- Disclosures: maker comments ARE the disclosure — "I built this".

## Publishing

- `manual` only (launch submission is web-only). The draft package contains
  the full kit: name, tagline, description, maker comment, media manifest,
  topic suggestions.
- PH API v2 is read-oriented — no launch endpoint; not implemented.
- Launch timing is a human decision (Tue–Thu convention is folklore, the
  data file says so).

## Genuine engagement

- The maker answers comments all launch day — that conversation is the
  point.
- Never solicit votes off-platform; PH explicitly prohibits vote-rings.

## Pitfalls

- One launch per product; re-launches need a substantial update.
- Missing gallery/demo assets sinks a launch — check the media manifest.
