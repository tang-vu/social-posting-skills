---
description: Post tweets and threads on X (Twitter) for reach and networking
---
# X (Twitter) Posting Skill

## Platform Overview
X (formerly Twitter) is the real-time social platform for tech, media, and breaking news. 500M+ monthly active users. Excellent for building a personal brand, networking with industry leaders, and driving traffic. Threads (multi-tweet posts) are powerful for in-depth content.

## Platform Constraints
- **Character Limit**: 280 characters per tweet (free), 25,000 (Premium)
- **Media**: Up to 4 images, 1 video, or 1 GIF per tweet
- **Hashtags**: 1-2 max (more reduces engagement)
- **Links**: Shortened via t.co, show as preview cards
- **Threads**: Chain of tweets for longer content
- **Polls**: Up to 4 options, 24h-7d duration

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

## Best Practices
- Tweet 3-5 times per day (mix of original + replies)
- Thread every 2-3 days for in-depth content
- Engage with 10-20 tweets from others daily
- Use analytics to find best posting times
- Pin your best tweet or a thread to your profile

## What to Avoid
- Using more than 2 hashtags
- Posting identical threads repeatedly
- Ignoring replies and mentions
- Pure self-promotion without value
- Scheduling everything (mix scheduled + real-time)

## Known Pitfalls
- Playwright needs to type in small chunks (50-100 chars at a time)
- X may rate-limit rapid actions
- Thread posting requires clicking "+" for each additional tweet
- ASCII English only — no emoji or special characters via automation
- t.co link shortening counts against character limit

## Related Skills
- `content-writing` — Thread templates and hook formulas
- `image-generation` — X image specs (1200x675)
