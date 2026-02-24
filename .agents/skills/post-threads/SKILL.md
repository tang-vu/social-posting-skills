---
description: Post micro-blog content to Threads (Meta) for conversational engagement
---
# Threads Posting Skill

## Platform Overview
Threads (by Meta) is Instagram's text-based companion app. It focuses on short-form, conversational content. Think of it as Instagram meets Twitter — casual, visual-friendly, and community-driven. Growing rapidly to 200M+ monthly active users.

## Platform Constraints
- **Character Limit**: 500 characters per post
- **Media**: Up to 10 images per post
- **Links**: Displayed as preview cards
- **Topic Tags**: Use relevant topic tags (not hashtags) for discovery
- **Threads**: Reply chains for longer content
- **Reposts**: Share others' posts with added commentary

## Posting Steps (Browser Automation)

1. Navigate to `https://www.threads.net/`
2. Wait for the home page to load (must be logged in)
3. Click on the "Start a thread..." composer area or the compose button
4. Wait for the composer to open
5. Type the post content (ASCII English only, max 500 chars)
6. Click "Post" button
7. Verify post appears on your profile

## Content Format
```
{One clear insight, thought, or question}

{Optional: 1-2 supporting sentences}

{Optional: topic tag for discovery}
```

## Content Strategy
- **Be conversational**: Threads rewards casual, authentic voice
- **Short and punchy**: Under 500 chars, but 100-200 performs best
- **Ask questions**: Drive replies for algorithm boost
- **React to trends**: Quick takes on current events work well
- **Use topic tags**: Help people discover your content through explore

## Algorithm / Discovery Tips
- Threads uses interest-based feed similar to Instagram Explore
- Posts with high reply counts get distributed to non-followers
- Topic tags help discoverability significantly
- Consistent posting (2-5x daily) trains the algorithm
- Engagement with others' posts increases your own visibility

## Best Practices
- Post 2-5 times per day for maximum reach
- Reply to comments quickly (first 30 minutes matter)
- Use topic tags relevant to your content
- Cross-reference Instagram content (linked accounts get boost)
- Share behind-the-scenes, quick thoughts, hot takes

## What to Avoid
- Long-form content (save for Substack or Medium)
- Overly promotional posts
- Hashtags (Threads uses topic tags instead)
- Cross-posting identical content from X without adapting tone
- Link-heavy posts without context

## Known Pitfalls
- Threads login is tied to Instagram (must have IG account)
- Topic tags may change or be limited
- Playwright cannot type emoji or Unicode characters
- Composer may have different layouts on mobile vs web

## Related Skills
- `content-writing` — Hook formulas and micro-content templates
- `image-generation` — Threads image specs (1080x1080)
