---
description: Post micro-blog content to Threads (Meta) for conversational engagement
---
# Threads Posting Skill

## Platform Overview
Threads (by Meta) is Instagram's text-based companion app. It focuses on short-form, conversational content. Think of it as Instagram meets Twitter — casual, visual-friendly, and community-driven. 200M+ monthly active users and growing rapidly.

## Platform Constraints
- **Character Limit**: 500 characters per direct post
- **Text Attachments**: Up to 10,000 characters (expandable media, added Sep 2025)
- **Media**: Up to 10 images per post
- **Video**: Up to 3 minutes (MP4, MOV formats)
- **Links**: Displayed as preview cards
- **Topic Tags**: Use relevant topic tags (not hashtags) for discovery
- **Threads**: Reply chains for longer content
- **Reposts**: Share others' posts with added commentary
- **Bio Links**: Up to 5 links in bio (added May 2025)

## New Features (2025)

- **Reply Approvals**: Control who can reply to your posts
- **Comment Filters**: New tools to manage comments
- **Ghost Posts**: Disappearing posts feature (Oct 2025)
- **Group DMs**: Group direct messaging
- **Fediverse Feed**: Integration with Mastodon and federated networks
- **Ads**: Ads now appear in the "For You" feed
- **Video Player**: Improved with pause, play, skip, and progress bar

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
- **Use Text Attachments**: For longer content (up to 10,000 chars) that expands in feed
- **Ask questions**: Drive replies for algorithm boost
- **React to trends**: Quick takes on current events work well
- **Use topic tags**: Help people discover your content through explore

## Algorithm / Discovery Tips
- AI-driven discovery-first model in 2025
- Authenticity and originality strongly emphasized by algorithm
- Shares, comments, and saves matter MORE than likes
- Posts with high reply counts get distributed to non-followers
- Topic tags significantly help discoverability
- Consistent posting (2-5x daily) trains the algorithm
- Engagement with others' posts increases your own visibility
- Visual content (photos/videos) getting increased priority

## Best Practices
- Post 2-5 times per day for maximum reach
- Reply to comments quickly (first 30 minutes matter)
- Use topic tags relevant to your content
- Cross-reference Instagram content (linked accounts get boost)
- Share behind-the-scenes, quick thoughts, hot takes
- Use reply approvals to manage conversation quality

## What to Avoid
- Long-form content in main body (use Text Attachments or save for Substack/Medium)
- Overly promotional posts
- Hashtags (Threads uses topic tags instead)
- Cross-posting identical content from X without adapting tone
- Link-heavy posts without context
- Pure bot-generated content

## Known Pitfalls
- Threads login is tied to Instagram (must have IG account)
- Topic tags may change or be limited
- Playwright cannot type emoji or Unicode characters
- Composer may have different layouts on mobile vs web
- Ads now compete with organic content in "For You" feed

## Related Skills
- `content-writing` — Hook formulas and micro-content templates
- `image-generation` — Threads image specs (1080x1080)
