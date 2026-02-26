---
description: Post tweets and threads on X (Twitter) for reach and networking
---
# X (Twitter) Posting Skill

## Platform Overview
X (formerly Twitter) is the real-time social platform for tech, media, and breaking news. 500M+ monthly active users. Excellent for building a personal brand, networking with industry leaders, and driving traffic. Threads (multi-tweet posts) are powerful for in-depth content.

## Platform Constraints
- **Character Limit**: 280 characters per tweet (free), 25,000 (Premium)
- **Media**: Up to 4 images, 1 video, or 1 GIF per tweet
- **Hashtags**: 1-2 max (more reduces engagement); banned in promoted posts (Jun 2025)
- **Links**: Shortened via t.co, show as preview cards
- **Threads**: Chain of tweets for longer content
- **Polls**: Up to 4 options, 24h-7d duration
- **Verification**: X Premium ($8/month), account must be 90 days old

## Link Placement Strategy

> **DEFAULT: Put links in a REPLY to your own tweet, not in the main tweet.**

- Tweets with external links get significantly less reach in the algorithm (estimated 30-50% reduction)
- t.co link shortening eats into your 280 character limit
- Best strategy: Post a compelling text-only tweet, then immediately reply with the link
- Exception: If the link generates a rich card preview that adds value, it can go in the main tweet
- For threads: Put the link in the last tweet of the thread

## Rate Limits

> X enforces strict rate limits. Exceeding them triggers a "Rate Limit Exceeded" error (resolves in 15min to 24h).

| Action | Limit |
|--------|-------|
| Posts per day | 2,400 (tweets + retweets + replies) |
| Posts per 30 minutes | 50 |
| DMs per day | 500 |
| New follows per day | 400 |
| Post views (verified) | 10,000/day |
| Post views (unverified) | 1,000/day |
| Post views (new unverified) | 500/day |

## Automation Rules

**Allowed:**
- Scheduling tweets and threads for future publication
- Auto-posting content from RSS feeds or trusted sources
- Analytics and monitoring tools
- Non-spammy welcome DMs to new followers

**Banned (will result in account penalties):**
- Mass following or unfollowing accounts
- Bulk liking or retweeting to inflate engagement
- Sending unsolicited or spammy DMs
- Posting identical content across multiple accounts
- Automated replies to keywords
- Using fake engagement bots (buying likes/retweets/followers)

**Best Practice**: 80/20 rule — automate 80% of routine tasks, keep 20% for genuine human engagement.

## Posting Steps (Browser Automation)

1. Navigate to `https://x.com/home`
2. Wait for the home feed to load (must be logged in)
3. Click on the "What is happening?!" composer area
4. Wait for the composer to be active
5. Type the tweet content in small chunks (ASCII English only)
   - Type 50-100 characters at a time to avoid input issues
   - Add brief pauses between chunks
6. Click the "Post" button
7. Verify tweet appears on the timeline

### Posting a Thread
1. Type first tweet and click the "+" button to add another tweet
2. Type each subsequent tweet
3. Click "Post all" to publish the entire thread

## Content Format

### Single Tweet
```
{One punchy insight, take, or observation}

{Optional: supporting evidence or link}
```

### Thread Format
```
Tweet 1: {Hook + promise}
"Here's exactly how to [achieve X] (thread):"

Tweet 2: {Context or setup}

Tweet 3-7: {One point per tweet}
- Use numbered points: "1/"
- Keep each under 280 chars

Tweet 8: {Summary or conclusion}

Tweet 9: {CTA}
"If this was helpful, follow me @handle for more on [topic]"
"RT the first tweet to share with others"
```

## Content Strategy
- **Hook in first tweet**: This determines if people read the thread
- **One idea per tweet**: Don't cram multiple thoughts
- **Use "..." or "1/" numbering** to signal thread continuation
- **End with a CTA**: Follow, RT, or link to full resource
- **Engage in replies**: Quote tweet with insights > plain retweet
- **Build in public**: Share progress, metrics, learnings

## Algorithm / Discovery Tips
- Engagement in first 15-30 minutes determines reach
- Replies count as engagement signals
- Quote tweets with added value outperform retweets
- Tweets with 1-2 hashtags get 21% more engagement than 3+
- Images increase engagement by 150%
- Video tweets get 10x more engagement than text-only
- Tweeting 3-5 times daily is optimal

## Impersonation Rules (Apr 2025)
- Parody/fan accounts must start username with 'fake' or 'parody'
- Must use a different profile picture than the imitated account
- Violations can lead to account suspension

## Best Practices
- Tweet 3-5 times per day (mix of original + replies)
- Thread every 2-3 days for in-depth content
- Engage with 10-20 tweets from others daily
- Use analytics to find best posting times
- Pin your best tweet or a thread to your profile

## What to Avoid
- Using more than 2 hashtags in organic posts
- Posting identical threads repeatedly
- Ignoring replies and mentions
- Pure self-promotion without value
- Scheduling everything (mix scheduled + real-time)
- Mass automated actions (follow/unfollow/like)

## Known Pitfalls
- Playwright needs to type in small chunks (50-100 chars at a time)
- X rate-limits rapid actions (50 posts/30min, 2400/day)
- Thread posting requires clicking "+" for each additional tweet
- ASCII English only — no emoji or special characters via automation
- t.co link shortening counts against character limit
- Unverified accounts have significantly lower post view limits

## Related Skills
- `content-writing` — Thread templates and hook formulas
- `image-generation` — X image specs (1200x675)
