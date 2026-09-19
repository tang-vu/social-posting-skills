---
name: post-linkedin
description: Adapt and publish campaign items on LinkedIn — professional narrative posts
---

# LinkedIn Adapter

Facts live in `platforms/linkedin.json` (3000-char body, media bounds,
publish modes). Do not duplicate numbers here.

## What LinkedIn rewards (culture)

- First-person, specific, professional narrative. "I built X and learned Y."
- The first line decides the "see more" click — lead with the outcome.
- Short paragraphs and line breaks; mobile readability matters.
- Document carousels and native media over external links.
- Genuine expertise signaled through specifics, not adjectives.

## Drafting from the content graph

- `core-claim` → opening line (the scroll-stopper).
- `context` → 1–2 lines of why/who.
- `proof`/`technical` → arrow-point bullets with the strongest specifics.
- `cta` → closing ask + engagement question.
- Link → first comment (community practice; flagged as heuristic in data).
- Disclosures read natively: "I built this", "Open source project".

## AI-content caution

LinkedIn's feed visibly deprioritizes generic AI-template text. Write in a
real voice: concrete details, an actual opinion, a small imperfection.
Human review before publishing is mandatory anyway — use it.

## Publishing

- `manual` → draft package; user pastes. LinkedIn ToS restricts automation —
  this adapter deliberately offers no browser mode.
- `api` → official Posts API exists (OAuth app required); adapter not
  implemented. Env contract documented in `platforms/linkedin.json`.

## Genuine engagement

- Comment on others' posts with real substance (LinkedIn surfaces long,
  substantive comments).
- Reply to every comment on your post with actual answers.
- Never mass-tag people for reach; never DM-blast.

## Pitfalls

- Hashtags: a few relevant ones at the bottom; more looks spammy.
- "Link in comments" is strategy folklore, not a documented penalty — the
  data labels it honestly.
