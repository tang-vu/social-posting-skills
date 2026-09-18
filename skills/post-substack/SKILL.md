---
name: post-substack
description: Adapt and publish campaign items on Substack — newsletter issues that email real subscribers
---

# Substack Adapter

Facts live in `platforms/substack.json`. A Substack publish emails actual
subscribers — that makes approval discipline non-optional.

## What Substack rewards (culture)

- A consistent personal voice and recognizable sections — subscribers
  signed up for YOU.
- Email-subject-line quality titles; the subject is the open rate.
- Delivered value per issue: takeaways, not announcements.

## Drafting from the content graph

- `core-claim` → subject-line title (clear > clever).
- `context` → the lede paragraph.
- `proof`/`technical` → the issue body, sectioned.
- `demo`/`link` → inline links and a "try it" block.
- `cta` → the close: what you'd like readers to do/reply.
- Campaign items that are pure announcements should be reshaped into an
  issue with a point — or shipped as a Substack Note instead.

## Publishing

- `manual` → draft package (title, subtitle, body, media manifest).
- `agent-browser` → playbook exists for the publish editor; remember:
  "Publish" SENDS EMAIL. Stop at preview/schedule unless the human
  explicitly confirmed send.
- No public write API.

## Genuine engagement

- Reply to subscriber replies; newsletters are relationships.
- Cross-promote honestly; list-broking and fake testimonials are out.

## Pitfalls

- Publishing emails subscribers — an accidental send is not recoverable.
  Agent-browser runs end at preview unless explicitly told to send.
- Blast-radius judgment: one good issue > three thin ones.
