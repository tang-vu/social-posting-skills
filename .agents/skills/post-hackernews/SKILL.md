---
description: Submit links and Show HN posts to Hacker News for developer audience reach
---
# Hacker News Posting Skill

## Platform Overview
Hacker News (news.ycombinator.com) is Y Combinator's community for hackers, founders, and intellectual curiosity. The audience is senior developers, CTOs, and tech founders. Content that reaches the front page can drive 10K-50K visits in hours. The community is extremely anti-marketing and values substance over polish.

## Platform Constraints
- **Title**: Max ~80 characters (longer titles get truncated)
- **Submissions**: URL or text (not both simultaneously)
- **Show HN**: Prefix for sharing what you've built
- **Ask HN**: Prefix for asking the community a question
- **Comments**: Plain text, supports markdown-lite
- **No images**: HN is text-only, no media uploads
- **No tags/hashtags**: None

## Posting Steps (Browser Automation)

1. Navigate to `https://news.ycombinator.com/submit`
2. Wait for the submit form to load (must be logged in)
3. Type the title (ASCII English only)
   - For projects: prefix with "Show HN: "
   - For questions: prefix with "Ask HN: "
4. Either:
   - Type a URL in the "url" field (for link submissions)
   - OR type text in the "text" field (for text submissions)
5. Click "submit" button
6. Verify submission appears on /newest

## Content Format

### Show HN (Sharing Your Project)
```
Title: Show HN: {Product Name} -- {What it does in <10 words}

Text:
{1 paragraph: What problem does it solve?}

{1 paragraph: What's technically interesting about your approach?}

{1 paragraph: Current status and what feedback you're looking for}

{Optional: link to source code if open-source}
```

### Link Submission
```
Title: {Original article title or descriptive summary}
URL: {Link to high-quality content}
```

### Ask HN
```
Title: Ask HN: {Specific, clear question}

Text:
{Context for the question}

{What you've already tried or considered}

{Specific aspect you need help with}
```

## Title Strategy
The title is 90% of what determines success on HN. Rules:

**Do:**
- Use the original article title (if submitting a link)
- Be specific and factual: "Show HN: An open-source alternative to Notion built in Rust"
- Include technical details that make it interesting

**Don't:**
- Use clickbait: "You won't believe..."
- Use marketing language: "Revolutionary", "Game-changing"
- Use ALL CAPS or excessive punctuation

## HN Score Algorithm
- Ranking = (score - 1) / (time + 2)^gravity
- Score = upvotes - downvotes (only 500+ karma users can downvote)
- Gravity = 1.8 (posts decay quickly, ~6-12 hours on front page)
- "New" page shows recent submissions before they accumulate votes
- Posts flagged as self-promotional get penalized

## Content Strategy
- **Be technically substantive**: HN rewards depth over polish
- **Open-source is valued**: Share source code when possible
- **Explain the "why"**: Why did you build it? Why this approach?
- **Be honest about limitations**: The community respects transparency
- **Engage in comments**: Thoughtful replies boost engagement signals

## Algorithm / Discovery Tips
- Post during US morning hours (8-11 AM EST) for maximum visibility
- Posts need early upvotes to escape /newest and reach front page
- Second-chance pool: some posts get a second visibility window
- Weekday posts get more engagement than weekends
- Show HN posts get special treatment in ranking

## Best Practices
- Read HN guidelines: https://news.ycombinator.com/newsguidelines.html
- Comment quality matters more than post frequency
- Share the original source, not a re-blog
- If posting your own work, be transparent about it
- Build karma through quality comments before submitting

## What to Avoid
- Astroturfing (fake upvotes or organized voting)
- Submitting low-quality blog posts or listicles
- Marketing speak in titles or text
- Resubmitting recently posted content
- Commenting on your own post with alt accounts

## Known Pitfalls
- HN rate-limits submissions (don't post too frequently)
- New accounts have limited posting privileges
- Posts can be flagged and killed by moderators or community
- No way to edit a title after submission
- Penalty for self-submissions if not tagged as "Show HN"

## Related Skills
- `content-writing` — Show HN post templates
