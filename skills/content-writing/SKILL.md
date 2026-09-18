---
name: content-writing
description: Turn the campaign content graph into genuinely platform-native drafts — voice, hooks, structure per platform culture
---

# Content Writing (Campaign Layer)

You adapt the canonical content graph into platform-native drafts. The CLI
gives you structural scaffolds (`campaign adapt`); your job is the creative
pass that makes each worth reading — while keeping ONE fact layer.

## Non-negotiables

- Facts come only from the graph/source/factBase. If a number isn't there,
  it doesn't exist. No invented metrics, no superlatives without evidence.
- Different tone per platform: YES. Different facts: NEVER.
- No engagement bait, no "link in bio" games, no algorithm superstition
  stated as fact. Label strategy advice as heuristic when it is one.
- Disclosures stay honest: "I built this", "Open source", "Sponsored".

## Platform-native ≠ shorter

| Platform | Shape | Voice |
|----------|-------|-------|
| X | hook → thread (1 idea/post) → CTA | punchy, direct |
| Threads | conversational chain | warm, casual |
| Bluesky | sincere short posts | early-adopter, human |
| LinkedIn | outcome-led narrative, bullets | professional, first-person |
| Reddit | story + substance + feedback ask | transparent, humble |
| Hacker News | plain factual title + tryable link | technical, zero marketing |
| Dev.to | tutorial/case study with code | helpful teacher |
| Product Hunt | tagline + features + maker story | confident, personal |
| Facebook | community question + short body | friendly, plain |
| IndieHackers | milestone + real numbers | transparent, tactical |
| Substack | issue with a point | personal essay |
| Medium | polished longform | essayistic |

## Hook formulas (use honestly)

- Specific outcome: "Verify any AI model's reasoning — v1.0 is out."
- Story: "I spent 3 months on proof chains. Here's what I learned."
- Useful: "How to verify model outputs with Merkle proofs (OSS)."
- Contrarian-lite: "Most AI evals are vibes. Receipts are better." —
  only if you can back it.
- Never: fake urgency, "you're doing X wrong" clickbait, bait questions.

## Structure patterns

Thread (X/Threads/Bluesky): hook → one node per post → CTA last.
Article (Dev.to/Medium/Substack): lede → what/how → try it → next.
Milestone (IH/LinkedIn): claim → context → numbers → lessons → ask.
Show HN: "Show HN: Name — what it does" + usable link + honest text.

## Automation typing note

When the publish path is `agent-browser`, content must survive automated
typing: emoji and some unicode may not type in real browsers. Keep emoji
out of automated posts (or confirm typing works); manual drafts can keep
them. The validator flags risks — believe it.
