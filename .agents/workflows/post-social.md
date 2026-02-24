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

## Step 3: Post to Each Platform

For each target platform, read the corresponding skill file first:

### Reddit (Auto)
1. Read `.agents/skills/post-reddit/SKILL.md`
2. Navigate to `https://www.reddit.com/r/{subreddit}/submit`
3. Fill in title and body (ASCII English only)
4. Click Post and verify

### LinkedIn (MANUAL -- system policy blocks automation)
1. Read `.agents/skills/post-linkedin/SKILL.md`
2. Save content to `posts/drafts/linkedin_post.md`
3. Inform user to copy-paste manually

### Facebook (Auto)
1. Read `.agents/skills/post-facebook/SKILL.md`
2. Navigate to `https://www.facebook.com/`
3. Open composer, type content (ASCII English only), click Post

### Threads (Auto)
1. Read `.agents/skills/post-threads/SKILL.md`
2. Navigate to `https://www.threads.net/`
3. Open composer, type content (ASCII English only, max 500 chars), click Post

### X / Twitter (Auto)
1. Read `.agents/skills/post-x/SKILL.md`
2. Navigate to `https://x.com/home`
3. Open composer, type content in small chunks (ASCII English only), click Post

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
3. Click compose, type content (max 300 chars, no hashtags), click Post

### Substack (Auto)
1. Read `.agents/skills/post-substack/SKILL.md`
2. Navigate to `https://substack.com/publish/post`
3. Fill title, subtitle, body content, click Publish

### Medium (MANUAL -- VPN required in Vietnam + bot detection)
1. Read `.agents/skills/post-medium/SKILL.md`
2. Ask user: "Medium is blocked in Vietnam. Is your VPN active?"
3. If VPN active: attempt browser automation at `https://medium.com/new-story`
4. If no VPN: save draft to `posts/drafts/medium_post.md` for manual posting

## Step 4: Report Results
1. Create a summary table with status per platform:
   | Platform | Status | Link |
   |----------|--------|------|
   | Reddit | Posted | {url} |
   | LinkedIn | Draft saved | posts/drafts/linkedin_post.md |
   | ... | ... | ... |
2. Include any error messages or screenshots
3. Provide links to published posts where available

## Known Limitations
- **Vietnamese text**: Playwright cannot type Unicode diacritics — use English only
- **Emojis**: Playwright cannot type emoji characters — removed from auto posts
- **LinkedIn**: System policy blocks browser_subagent on linkedin.com
- **Product Hunt**: Cloudflare bot detection blocks automated access
- **Medium (VN)**: Blocked by ISPs in Vietnam — VPN required
- **Special chars**: Avoid em-dashes, curly quotes, accented characters
- **File upload**: Browser file picker interaction is limited
