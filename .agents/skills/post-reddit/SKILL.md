---
description: Post to Reddit communities for authentic engagement and feedback
---
# Reddit Posting Skill

## Platform Overview
Reddit is a network of communities (subreddits) organized by topic. Posts succeed when they provide genuine value to the community. Self-promotion must be balanced with authentic participation. Reddit has 1.7B+ monthly active users and is the #1 platform for community-driven content.

## Account Requirements

> **CRITICAL**: Reddit's platform-level spam filters auto-remove posts from new or low-karma accounts. This is NOT a subreddit mod rule — it is Reddit's own filter and cannot be bypassed by changing content.

- **Minimum Karma**: ~100 karma recommended to post freely. Some subreddits require 1,000+.
- **Account Age**: Many subreddits require accounts to be 7-30 days old before posting.
- **Subreddit Karma**: Some subs track karma earned *within that specific subreddit*.
- **Comment vs Post Karma**: Comment karma is easier to build. Start by commenting helpfully.
- **External Links**: Posts containing external links (GitHub, personal sites) from low-karma accounts are auto-removed by Reddit's filters — even if the content is legitimate.
- **Building Karma**: Comment helpfully on r/AskReddit, r/CasualConversation, r/NoStupidQuestions for 2-7 days before attempting to post links.

## Platform Constraints
- **Title**: Max 300 characters (keep under 100 for best engagement)
- **Body**: Max 40,000 characters for self-posts
- **Media**: Images, videos, polls, links
- **Flair**: One flair per post (required in many subreddits — post FAILS without it)
- **Links**: URL posts or self-posts with inline links
- **Rate Limiting**: Reddit rate-limits posting frequency per account
- **Cross-posting**: Reddit's built-in crosspost feature is distinct from reposting

## Pre-Post Checklist

Before attempting to post, the agent MUST verify:

1. **Check account karma**: If karma < 100, WARN the user that the post will likely be auto-removed
2. **Read subreddit rules**: Navigate to `https://www.reddit.com/r/{subreddit}/about/rules` and check requirements
3. **Check if flair is required**: Many subreddits reject posts without flair
4. **Check minimum karma/age**: Some subs display these requirements in their rules
5. **Consider text-only strategy**: If account has low karma, post WITHOUT links in the body — put the link in the first comment instead

## Link Placement Strategy

> **DEFAULT: Put links in the FIRST COMMENT, not in the post body.**

- Reddit's spam filters aggressively target posts with external links (GitHub, personal sites, blogs)
- This applies to ALL accounts, not just low-karma ones -- even high-karma accounts get flagged for promotional links
- Always use a text-only self-post with "Link in the comments" at the end
- Post the URL as a reply to your own post immediately after publishing
- This is the safest strategy regardless of karma level

## Posting Steps (Browser Automation)

1. Navigate to `https://www.reddit.com/r/{subreddit}/submit`
2. Wait for the submit form to load (must be logged in)
3. Select post type: **"Text"** (always prefer text posts over link posts)
4. Type the title (ASCII English only, max 300 chars)
5. Type the body content (ASCII English only, **NO external links in body**)
6. End body with: "Link in the comments."
7. Select flair if required by the subreddit
8. Click "Post" button
9. **Immediately add a comment** with the URL
10. **Check for removal**: After posting, verify the post is visible (not removed by filters)
11. If removed: save content as draft, inform user to build karma first

## Content Format

### Self-Post (Recommended)
```
Title: {Descriptive, specific title without clickbait}

Body:
{Opening context: what this is about in 1-2 sentences}

{Main content: detailed explanation, story, or question}

{Closing: question to prompt discussion or explicit request for feedback}

Link in the comments.

First Comment:
{URL to project/resource}
```

### Link Post (High-karma accounts only)
```
Title: {What makes this link worth clicking}
URL: {Link to project, article, or resource}
```

> Only use link posts if your account has 1,000+ karma and a history of participation in the target subreddit.

## Subreddit Selection Guide

| Subreddit | Best For | Key Rules |
|-----------|----------|-----------|
| r/SideProject | Showcasing projects | No clear rules — but filters are active |
| r/sideprojects | Side projects (note the 's') | Flairs required, no astroturfing, significant changes for reposts |
| r/webdev | Web development | Technical content only, no pure promotion |
| r/programming | General programming | Links to articles, discussions |
| r/opensource | Open source projects | Rule #2: No spam or excessive self-promotion |
| r/startups | Startup advice | Questions and learnings, no ads |
| r/learnprogramming | Tutorials | Helpful content for beginners |
| r/artificial | AI/ML discussion | Technical AI content |
| r/entrepreneur | Business | Advice, lessons, strategies |

> **WARNING**: r/SideProject and r/sideprojects are DIFFERENT subreddits with different rules and mod teams.

## Content Strategy
- **Be genuine**: Reddit users detect and punish marketing-speak instantly
- **Provide value first**: Help others before promoting yourself
- **Tell your story**: "I built X because Y" works better than "Check out X"
- **Include numbers**: Revenue, user counts, or metrics add credibility
- **Ask for feedback**: Redditors love giving opinions
- **Follow the 90/10 rule**: 90% community participation, 10% self-promotion
- **No drive-by posting**: You must participate in the community first

## Algorithm / Discovery Tips
- Posts that get upvotes in the first hour rise fastest
- Comments drive engagement signals (reply to every comment)
- Cross-posting to multiple relevant subs is acceptable (use Reddit's crosspost)
- Timing: post during peak US hours (8-10 AM EST)
- Controversial titles get more engagement (but risk downvotes)
- 2025: Reddit now has AI rule-checking for draft posts and pre-submission notifications

## Pre-Posting Engagement (Before You Post)

> Reddit REQUIRES you to be an active community member before posting your own content.

### If Account is New (< 100 karma)
1. **DO NOT post links yet** — they will be auto-removed
2. Spend 3-7 days commenting helpfully on:
   - r/AskReddit (easiest karma)
   - r/CasualConversation
   - r/NoStupidQuestions
   - Subreddits in your niche
3. Aim for 100+ comment karma before attempting to post
4. Comment genuinely — helpful answers, not one-word replies

### If Account Has Karma (100+)
1. **Browse the target subreddit** for 10-15 minutes before posting
2. **Comment on 3-5 posts** in that subreddit (builds subreddit-specific karma)
3. **Upvote 5-10 posts** in the subreddit
4. **Read the sidebar rules** and recent posts to understand the culture
5. Then post your content

## Post-Posting Engagement (After You Post)

> The first 1-2 hours determine if your post rises or dies.

1. **Reply to EVERY comment** on your post within the first 2 hours
2. **Upvote every reply** to your post
3. **Be genuinely helpful** in replies — Redditors detect and punish self-promotion
4. **Don't be defensive** — if someone criticizes, engage constructively
5. **Add your link in the first comment** (NOT in the post body)
6. **Check if post was removed**: After 30 min, check if it's visible from a logged-out browser
7. If removed: contact subreddit mods via modmail

## Account Nurturing (Karma Building Routine)

> Reddit accounts need REPUTATION (karma) before they can effectively post content.

### Daily Minimum (15-20 min/day)
- Browse and read: 5-10 min
- Comment on 5-10 posts (be helpful, add value)
- Upvote 10-15 posts
- Reply to replies on your comments

### Karma Building Strategy
```
Days 1-3: Comment on r/AskReddit (5-10 comments/day)
Days 4-7: Add niche subreddits, continue commenting
Week 2: Post text-only in niche subs (no links yet)
Week 3: Post text with "link in comments" strategy
Month 2+: Regular posting with established reputation
```

### Types of Comments That Build Karma
- Detailed, helpful answers to questions
- Personal experiences related to the topic
- Funny but relevant observations
- Sharing expertise or data
- Asking thoughtful follow-up questions

### What Kills Karma
- "Check out my project!" without context
- Generic one-word replies
- Posting the same content to 10 subreddits
- Being argumentative or hostile
- Ignoring subreddit rules

## Best Practices
- Read subreddit rules before posting (sidebar)
- Check recent posts for what gets upvoted
- Engage with comments on your own post
- Use descriptive titles, not clickbait
- Include a TL;DR for long posts
- Build comment karma before posting links

## What to Avoid
- Generic self-promotion ("Check out my app!")
- Posting the same content to many subreddits simultaneously
- Ignoring subreddit rules or culture
- Using marketing buzzwords
- Asking for upvotes (against Reddit ToS)
- Posting links from a new/low-karma account

## Known Pitfalls
- **Reddit's platform-level filter** removes posts with external links from new/low-karma accounts. This is the #1 cause of failed posts.
- Even "clean" posts with one GitHub link get removed from low-karma accounts
- Workaround: post text-only, put link in first comment
- Modmail to subreddit mods may help get posts manually approved
- Reddit rate-limits posting (wait between submissions)
- Some subreddits auto-remove posts from accounts under certain age
- Playwright cannot type emoji or Unicode characters
- Build karma by commenting helpfully for 2-7 days before posting

## Related Skills
- `content-writing` — Content adaptation and templates
- `image-generation` — Image specs for Reddit posts
