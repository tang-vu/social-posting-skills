---
name: post-facebook
description: Adapt and publish campaign items on Facebook — profile/page and Group posts with group-rule discipline
---

# Facebook Adapter

Facts live in `platforms/facebook.json` (63k char ceiling — effective length
is far shorter, media bounds). Meta requires AI-content labels for synthetic
media — mark generated images honestly.

## What Facebook rewards (culture)

- Groups over Pages for organic reach — but Groups are admin-ruled
  communities: the group's rules decide what flies, always.
- Friendly, plain-spoken, community-minded posts. Questions to the
  community outperform announcements.
- Native media over outbound links.

## Drafting from the content graph

- `core-claim` → friendly opener (a question or a "made this thing" line).
- `context` + `proof` → short body; Facebook is not the place for the
  full technical dump.
- `cta` → invite conversation.
- Link → first comment (heuristic label in the data).
- Target a Group? The preview must name the group and the user must
  confirm its rules allow this content type.

## Publishing

- `manual` → draft package (default — Group contexts vary too much to
  assume automation is welcome).
- `agent-browser` → playbook exists, but many Groups queue posts for admin
  approval — "Pending" is normal, not a failure.
- `api` → Pages API posts to Pages you manage (Meta app review); not
  implemented.

## Genuine engagement

- Be a group member: answer questions, help people, then occasionally
  share what you built where it's relevant.
- Never post the same thing to a dozen groups — that's the spam pattern
  admins ban for.
- Meta's AI rules: label AI-generated media; undisclosed synthetic content
  risks the account.

## Pitfalls

- Group posts may sit in admin-approval queues — record patiently.
- Engagement bait ("like if you agree") is penalized and prohibited here.
