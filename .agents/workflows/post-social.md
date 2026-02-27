---
description: How to post a draft to social media platforms
---
# Social Media Posting Workflow

// turbo-all

When the user asks you to post content to social media, follow this workflow:

## Step 1: Content Preparation
1. Read the content writing skill at `.agents/skills/content-writing/SKILL.md`
2. Read the topic/draft from the user or from a file in `posts/drafts/`
3. Generate platform-adapted versions for each target platform
4. Save each draft to `posts/drafts/{platform}_post.md`
5. Ask user for approval before posting (unless they said "just post it")

## Step 2: Image Generation (if needed)
1. Read the image generation skill at `.agents/skills/image-generation/SKILL.md`
2. Determine which platforms need images (Facebook, X, LinkedIn benefit most)
3. Generate images using the `generate_image` tool
4. Save to `posts/images/`

## Step 3: Pre-Posting Engagement

> Do this 15-30 minutes BEFORE posting. Each platform skill has specific pre-posting engagement steps.

1. Open each target platform in the browser
2. **Scroll the feed** for 5-10 minutes (act like a real user)
3. **Like/react to 5-8 posts** from accounts in your niche
4. **Reply to 2-3 posts** with genuine, thoughtful comments
5. This warms up the algorithm — your next post will get better distribution

> See each platform's SKILL.md for platform-specific pre-posting engagement steps.

## Step 4: Post to Each Platform

For each target platform, read the corresponding skill file first:

### Reddit (Auto)
1. Read `.agents/skills/post-reddit/SKILL.md`
2. Navigate to `https://www.reddit.com/r/{subreddit}/submit`
3. Fill in title and body (ASCII English only, **NO links in body**)
4. End body with "Link in the comments."
5. Click Post and verify
6. **Immediately add a comment** with the URL

### LinkedIn (MANUAL -- system policy blocks automation)
1. Read `.agents/skills/post-linkedin/SKILL.md`
2. Save content to `posts/drafts/linkedin_post.md`
3. Inform user to copy-paste manually

### Facebook (Auto)
1. Read `.agents/skills/post-facebook/SKILL.md`
2. Navigate to `https://www.facebook.com/`
3. Open composer, type content (ASCII English only, **NO links in body**), click Post
4. **Add first comment** with the URL

### Threads (Auto)
1. Read `.agents/skills/post-threads/SKILL.md`
2. Navigate to `https://www.threads.net/`
3. Open composer, type content (ASCII English only, max 500 chars, **NO links in body**), click Post
4. **Reply to your own post** with the URL

### X / Twitter (Auto)
1. Read `.agents/skills/post-x/SKILL.md`
2. Navigate to `https://x.com/home`
3. Open composer, type content in small chunks (ASCII English only, **NO links in main tweet**), click Post
4. **Reply to your own tweet** with the URL

### Product Hunt (MANUAL -- Cloudflare bot detection)
1. Read `.agents/skills/post-producthunt/SKILL.md`
2. Save content to `posts/drafts/producthunt_post.md`
3. Inform user to paste manually at producthunt.com

### Hacker News (Auto)
1. Read `.agents/skills/post-hackernews/SKILL.md`
2. Navigate to `https://news.ycombinator.com/submit`
3. Fill title with "Show HN:" prefix, add URL or text, submit

### Dev.to (Auto)
1. Read `.agents/skills/post-devto/SKILL.md`
2. Navigate to `https://dev.to/new`
3. Write full markdown article with tags, click Publish

### IndieHackers (MANUAL -- potential bot detection)
1. Read `.agents/skills/post-indiehackers/SKILL.md`
2. Save content to `posts/drafts/indiehackers_post.md`
3. Inform user to paste manually at indiehackers.com

### Bluesky (Auto)
1. Read `.agents/skills/post-bluesky/SKILL.md`
2. Navigate to `https://bsky.app/`
3. Click compose, type content (max 300 chars, no hashtags, **NO links in body**), click Post
4. **Reply to your own post** with the URL

### Substack (Auto)
1. Read `.agents/skills/post-substack/SKILL.md`
2. Navigate to `https://substack.com/publish/post`
3. Fill title, subtitle, body content, click Publish

### Medium (MANUAL -- VPN required in Vietnam + bot detection)
1. Read `.agents/skills/post-medium/SKILL.md`
2. Ask user: "Medium is blocked in Vietnam. Is your VPN active?"
3. If VPN active: attempt browser automation at `https://medium.com/new-story`
4. If no VPN: save draft to `posts/drafts/medium_post.md` for manual posting

## Step 5: Post-Posting Engagement

> Do this IMMEDIATELY after posting. The first 30-60 minutes are the "golden hour" for each platform.

1. **Stay online** for at least 30-60 minutes after posting
2. **Reply to every comment** on your posts across all platforms
3. **Like/react to comments** on your posts
4. **Continue engaging** with other posts on the platform (don't post-and-leave)
5. **Check back** 2-4 hours later for late comments

> See each platform's SKILL.md for platform-specific post-posting engagement steps.

## Step 6: Report Results
1. Create a summary table with status per platform:
   | Platform | Status | Link |
   |----------|--------|------|
   | Reddit | Posted | {url} |
   | LinkedIn | Draft saved | posts/drafts/linkedin_post.md |
   | ... | ... | ... |
2. Include any error messages or screenshots
3. Provide links to published posts where available

## Multi-Thread Posting

Some platforms support posting multiple connected posts at once:

### X (Twitter) Threads
- Use the "+" button in the composer to add tweets
- Each new text area: `tweetTextarea_0`, `tweetTextarea_1`, etc.
- Click "Post all" to publish the entire thread at once
- 5-10 tweets is the sweet spot

### Threads Multi-Thread
- Use the **"Add to thread"** button in the composer
- Multiple text areas appear — one for each post
- Click "Post" to publish ALL posts as a connected chain
- Great for tutorials, stories, step-by-step content

### Bluesky Threads
- No native multi-thread in composer
- Post first post → reply to yourself → repeat
- Keep threads shorter (3-5 posts)

## Account Nurturing Guide

> For growing new accounts. Each platform's SKILL.md has specific nurturing routines.

### Quick Reference
| Platform | Daily Time | Key Activity | Golden Rule |
|----------|-----------|-------------|-------------|
| X | 15-20 min | Reply to 5-10 tweets | 40% time replying |
| Threads | 10-15 min | Like & reply casually | Be conversational |
| Bluesky | 10-15 min | Join custom feeds | Be authentic |
| Facebook | 15-20 min | Groups + reactions | Groups > Pages |
| LinkedIn | 20-30 min | Comment 50+ words | Comments > Posts |
| Reddit | 15-20 min | Build karma via comments | 90/10 rule |

## Known Limitations
- **Vietnamese text**: Playwright cannot type Unicode diacritics — use English only
- **Emojis**: Playwright cannot type emoji characters — removed from auto posts
- **LinkedIn**: System policy blocks browser_subagent on linkedin.com
- **Product Hunt**: Cloudflare bot detection blocks automated access
- **Medium (VN)**: Blocked by ISPs in Vietnam — VPN required
- **Special chars**: Avoid em-dashes, curly quotes, accented characters
- **File upload**: Browser file picker interaction is limited
