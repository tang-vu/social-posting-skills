---
name: post-reddit
description: Adapt and publish campaign items on Reddit — community-native self-posts with subreddit-rule discipline
---

# Reddit Adapter

Facts live in `platforms/reddit.json` (300-char title, 40k body, media).
The subreddit target is part of the constraint set — its rules win.

## What Reddit rewards (culture)

- Community membership first. Accounts that only self-promote get filtered
  and downvoted. Reddit's spam filters are real: new/low-karma accounts get
  posts auto-removed, link posts especially.
- "I built X because Y" over "Check out X". Transparent, specific, humble.
- Real numbers and honest tradeoffs; Redditors punish marketing voice fast.
- Asking for feedback works. Asking for upvotes violates the rules.

## Drafting from the content graph

- `core-claim` → plain, specific title (no clickbait, no emoji).
- `context` → opening paragraph: what it is, why you made it.
- `proof`/`technical` → bulleted substance; technical details welcome.
- `cta` → "feedback welcome" tone, not growth-CTA tone.
- Link → commonly placed in a first comment (heuristic; subreddit rules
  and account standing decide — when in doubt, text-only + link comment).
- Always: pick the subreddit deliberately, READ its rules and flair
  requirements, and say so in the preview. `r/SideProject` and
  `r/sideprojects` are different subreddits with different rules.

## Publishing

- `manual` → draft package (title, body, first comment, target sub).
- `agent-browser` → playbook navigates to `/r/{sub}/submit`, handles the
  text-post form and flair picker. If the required flair is unclear → abort
  and ask; never guess a flair.
- `api` → official API exists (OAuth); adapter not implemented.

After publishing through the browser, CHECK REMOVAL: view the post logged
out. If a platform filter removed it, record `failed` and advise the user —
the fix is account standing/subreddit fit, not reposting.

## Genuine engagement

- Reply to every comment on your post with real answers.
- Participate in the subreddit because you're a member, not a campaign.
- Never cross-post identical text to many subs; never ask for upvotes.

## Pitfalls

- Low-karma account + links → auto-removal risk (platform filter).
- Flair required in many subs — the post fails without it.
- Reposting identical content is the fastest way to a ban.
