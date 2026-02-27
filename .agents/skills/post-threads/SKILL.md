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

## Link Placement Strategy

> **DEFAULT: Put links in a REPLY to your own post, not in the main post body.**

- Threads algorithm deprioritizes posts with external links in the body
- Link-heavy posts get reduced distribution in the "For You" feed
- Best strategy: Post text-only content, then reply to your own post with the link
- Links in the main post will show as preview cards but hurt organic reach
- Keep the main post conversational and authentic -- save links for replies

## Posting Steps (Browser Automation)

### Single Post
1. Navigate to `https://www.threads.net/`
2. Wait for the home page to load (must be logged in)
3. Click on the "Start a thread..." composer area or the compose button
4. Wait for the composer to open
5. Type the post content (ASCII English only, max 500 chars)
6. Click "Post" button
7. Verify post appears on your profile

### Multi-Thread Posting (Reply Chain) ⭐

> Threads supports posting MULTIPLE connected posts at once — like a thread/chain — directly from the composer.

1. Open the composer (click "Start a thread...")
2. Type the first post content
3. Click **"Add to thread"** button (appears below the first text box)
4. A NEW text area appears — type the second post
5. Repeat steps 3-4 for as many posts as you want in the chain
6. Click **"Post"** — ALL posts publish simultaneously as a connected thread

**Thread Strategy Tips:**
- First post = hook (grab attention, make people want to read more)
- Middle posts = value (insights, details, evidence)
- Last post = CTA or conclusion
- Each post should be 100-200 chars for best engagement
- Use this for tutorials, stories, hot takes with reasoning
- Threads shows the chain as a connected conversation on your profile

### Replying to Create a Thread (Post-hoc)

You can also build a thread by replying to your own post after publishing:
1. Post the first thread normally
2. Click the reply icon on YOUR OWN post
3. Reply modal opens — type the next post
4. Click "Post" to add to the thread
5. Repeat for additional posts

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

## Pre-Posting Engagement (Before You Post)

> Warm up the algorithm 15-20 minutes before posting.

1. **Scroll through feed** for 5-10 minutes (act natural)
2. **Like 5-8 posts** from accounts in your niche
3. **Reply to 2-3 posts** with genuine thoughts
4. **Repost 1 post** from someone you admire (with or without comment)
5. Then post your content — the algorithm sees you as active

## Post-Posting Engagement (After You Post)

> The first 30 minutes are the golden window for reach.

1. **Stay online** for at least 30 min after posting
2. **Reply to every comment** on your post immediately
3. **Like comments** on your post to encourage discussion
4. **Continue browsing and engaging** with other posts
5. **Check back** 1-2 hours later for late comments
6. If the post gets traction, **add a reply** to your own thread with a link or follow-up

## Account Nurturing (Daily Routine)

> Threads rewards consistent, conversational participation.

### Daily Minimum (10-15 min/day)
- Browse feed: 5 min
- Like 8-12 posts
- Reply to 3-5 posts (be conversational, not salesy)
- Repost 1-2 good posts
- Post 1-3 original posts

### Weekly Goals
- 1-2 multi-thread posts per week
- Follow 5-10 relevant accounts
- Use topic tags consistently
- Interact with replies on your posts

### Growth Pattern
```
Week 1-2: Engage only — like, reply, repost (build presence)
Week 3-4: Start posting (1-2/day) + continue engaging
Month 2: Add multi-thread posts and topic tags
Month 3+: Full routine with consistent posting schedule
```

### Authentic Engagement Tips
- Be casual — Threads isn't LinkedIn. Talk like you would to a friend
- Share opinions, not just facts
- Ask questions in your replies — drive conversation
- React to trending topics quickly
- Don't cross-post identical X content (Threads users notice and dislike it)

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
