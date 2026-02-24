---
description: Post to Reddit communities for authentic engagement and feedback
---
# Reddit Posting Skill

## Platform Overview
Reddit is a network of communities (subreddits) organized by topic. Posts succeed when they provide genuine value to the community. Self-promotion must be balanced with authentic participation. Reddit has 1.7B+ monthly active users and is the #1 platform for community-driven content.

## Platform Constraints
- **Title**: Max 300 characters (keep under 100 for best engagement)
- **Body**: Max 40,000 characters for self-posts
- **Media**: Images, videos, polls, links
- **Flair**: One flair per post (required in many subreddits)
- **Links**: URL posts or self-posts with inline links
- **Karma**: Some subreddits require minimum karma to post

## Posting Steps (Browser Automation)

1. Navigate to `https://www.reddit.com/r/{subreddit}/submit`
2. Wait for the submit form to load (must be logged in)
3. Select post type: "Text" for self-posts, "Link" for URL posts
4. Type the title (ASCII English only, max 300 chars)
5. Type the body content (ASCII English only)
6. Select flair if required by the subreddit
7. Click "Post" button
8. Verify the post appears on the subreddit

## Content Format

### Self-Post
```
Title: {Descriptive, specific title without clickbait}

Body:
{Opening context: what this is about in 1-2 sentences}

{Main content: detailed explanation, story, or question}

{Closing: question to prompt discussion or explicit request for feedback}
```

### Link Post
```
Title: {What makes this link worth clicking}
URL: {Link to project, article, or resource}
```

## Subreddit Selection Guide

| Subreddit | Best For | Posting Rules |
|-----------|----------|---------------|
| r/SideProject | Showcasing projects | Show HN-style, share what you built |
| r/webdev | Web development | Technical content, no pure promotion |
| r/programming | General programming | Links to articles, discussions |
| r/startups | Startup advice | Questions, learnings, no ads |
| r/learnprogramming | Tutorials | Helpful content for beginners |
| r/artificial | AI/ML discussion | Technical AI content |
| r/indiehackers | Indie products | Build-in-public updates |
| r/entrepreneur | Business | Advice, lessons, strategies |

## Content Strategy
- **Be genuine**: Reddit users detect and punish marketing-speak instantly
- **Provide value first**: Help others before promoting yourself
- **Tell your story**: "I built X because Y" works better than "Check out X"
- **Include numbers**: Revenue, user counts, or metrics add credibility
- **Ask for feedback**: Redditors love giving opinions
- **Follow the 90/10 rule**: 90% community participation, 10% self-promotion

## Algorithm / Discovery Tips
- Posts that get upvotes in the first hour rise fastest
- Comments drive engagement signals (reply to every comment)
- Cross-posting to multiple relevant subs is acceptable
- Timing: post during peak US hours (8-10 AM EST)
- Controversial titles get more engagement (but risk downvotes)

## Best Practices
- Read subreddit rules before posting (sidebar)
- Check recent posts for what gets upvoted
- Engage with comments on your own post
- Use descriptive titles, not clickbait
- Include a TL;DR for long posts

## What to Avoid
- Generic self-promotion ("Check out my app!")
- Posting the same content to many subreddits simultaneously
- Ignoring subreddit rules or culture
- Using marketing buzzwords
- Asking for upvotes (against Reddit ToS)

## Known Pitfalls
- Some subreddits have auto-moderators that remove posts from new accounts
- Reddit rate-limits posting (wait between submissions)
- Playwright cannot type emoji or Unicode characters

## Related Skills
- `content-writing` — Content adaptation and templates
- `image-generation` — Image specs for Reddit posts
