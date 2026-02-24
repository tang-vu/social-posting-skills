---
description: Post to Facebook for community engagement and group participation
---
# Facebook Posting Skill

## Platform Overview
Facebook has 3B+ monthly active users. Best for community building, local audiences, and Facebook Groups. Organic page reach has declined, but Groups and personal profiles still drive engagement.

## Platform Constraints
- **Character Limit**: 63,206 characters (but shorter performs better)
- **Media**: Images, videos, stories, reels, polls, events
- **Links**: Rich preview cards (but reduce organic reach)
- **Groups**: Best distribution channel on Facebook
- **Hashtags**: Minimal impact on reach (use 1-2 max or skip)

## Posting Steps (Browser Automation)

1. Navigate to `https://www.facebook.com/`
2. Wait for the home page to load (must be logged in)
3. Click on the "What's on your mind?" composer box
4. Wait for the composer to expand
5. Type the post content (ASCII English only)
6. Click "Post" button
7. Verify post appears on the timeline

### Posting to a Group
1. Navigate to `https://www.facebook.com/groups/{group_id}/`
2. Click on the "Write something..." composer
3. Type content
4. Click "Post"

## Content Format

### Personal Profile Post
```
{Hook question or bold statement}

{Context or story -- 2-3 short paragraphs}

{Ask for opinions or experience sharing}
```

### Group Post
```
{Relevant question or valuable insight for the group}

{Details, context, or evidence}

{Explicit ask: "Has anyone experienced this?" or "What's your approach?"}
```

## Content Strategy
- **Groups > Pages > Profile** for reach
- **Native content wins**: Videos and images uploaded directly outperform links
- **Ask questions**: Posts that prompt replies get distributed more
- **Go local**: Facebook excels for local and community content
- **Facebook Live**: Live videos get 6x more engagement than regular videos

## Algorithm / Discovery Tips
- Facebook prioritizes "meaningful interactions" (comments over likes)
- Posts from friends/family rank over pages in the feed
- Native video gets prioritized over YouTube links
- Engagement within first hour determines reach
- Avoid engagement bait ("Tag a friend who...") -- penalized by algorithm

## Best Practices
- Post 1-2 times daily (over-posting reduces per-post reach)
- Reply to every comment
- Use Facebook Groups for community building
- Native video and images outperform text-only posts
- Schedule posts for 1-4 PM weekdays for best reach

## What to Avoid
- Engagement bait phrasing (Facebook penalizes this)
- Sharing links without adding commentary
- Cross-posting identical content from Instagram
- Overly promotional product posts without context
- Using more than 2 hashtags

## Known Pitfalls
- Facebook's composer may change layout frequently
- Privacy settings can affect post visibility
- Group posts may require admin approval
- Playwright cannot upload images via file picker dialogs

## Related Skills
- `content-writing` — Content adaptation and hook formulas
- `image-generation` — Facebook image specs (1200x630)
