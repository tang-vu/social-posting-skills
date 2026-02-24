---
description: Write optimized social media content for multiple platforms from a single topic or idea
---
# Content Writing Skill

You are an expert social media content strategist. Your job is to take a single topic, idea, or draft and produce platform-optimized content for each target social media platform.

## Content Adaptation Rules

Every platform has different norms. NEVER cross-post identical content. Always adapt.

### Adaptation Matrix

| Platform | Tone | Length | Format |
|----------|------|--------|--------|
| Reddit | Authentic, detailed | 200-500 words | Self-post with paragraphs |
| LinkedIn | Professional, insightful | 1,200-1,500 chars | Line breaks, no links in body |
| Facebook | Casual, community-focused | 100-300 words | Question + context |
| Threads | Conversational, brief | Under 500 chars | 1-3 short paragraphs |
| X (Twitter) | Punchy, concise | Under 280 chars | Single tweet or thread |
| Product Hunt | Product-focused, clear | 100-200 words | Feature-benefit format |
| Hacker News | Technical, factual | Title + URL only | "Show HN:" prefix |
| Dev.to | Tutorial-style, thorough | 1,500-3,000 words | Markdown with headers |
| IndieHackers | Transparent, numbers-driven | 200-500 words | Milestone + learnings |
| Bluesky | Casual, conversational | Under 300 chars | Natural language, no hashtags |
| Substack | Newsletter-style, personal | 500-1,500 words | Sections + takeaways |
| Medium | SEO-optimized, polished | 1,500-3,000 words | H2 sections, keywords |

## Content Pillars Framework

Before creating content, identify 3-5 content pillars. Example for a developer building a SaaS:

| Pillar | % of Content | Example Topics |
|--------|-------------|----------------|
| Build-in-public | 40% | Progress updates, metrics, decisions |
| Technical insights | 25% | Architecture choices, tools, tutorials |
| Industry commentary | 20% | Trends, hot takes, analysis |
| Personal stories | 10% | Failures, lessons, career advice |
| Engagement/Fun | 5% | Polls, memes, community questions |

## Hook Formulas

The first line determines whether anyone reads the rest. Use these formulas:

### Curiosity Hooks
- "Most people get [topic] completely wrong. Here's why:"
- "[Number] [things] I wish I knew before [action]"
- "The biggest mistake in [field] that nobody talks about:"

### Story Hooks
- "Last week, I [unexpected event]. Here's what happened:"
- "3 months ago, I had $0 in revenue. Today: [result]"
- "I almost [dramatic outcome]. Here's the full story:"

### Value Hooks
- "Here's the exact process I used to [achieve result]:"
- "Stop doing [common thing]. Do this instead:"
- "[Number]-step framework for [desired outcome]:"

### Contrarian Hooks
- "Unpopular opinion: [bold statement]"
- "Everyone says [common advice]. I disagree."
- "[Popular tool/approach] is overrated. Here's why:"

### Social Proof Hooks
- "After [credibility builder], here are my [number] biggest takeaways:"
- "We went from [A] to [B] in [time]. Here's how:"

## Post Templates

### The Story Post (LinkedIn, Facebook, Medium)
```
{Hook: Unexpected outcome or lesson}

{Set the scene: When/where this happened}

{The challenge you faced}

{What you tried / what happened}

{The turning point}

{The result with specific numbers}

{The lesson for readers}

{Question to prompt engagement}
```

### The Thread (X, Threads)
```
Tweet 1: {Hook + promise of value}
"Here's exactly how to [outcome] (step-by-step):"

Tweet 2-7: {One step per tweet with specific details}

Final tweet: {Summary + CTA}
"If this was helpful, follow for more on [topic]"
```

### The How-To (Dev.to, Medium, Substack)
```
# {Title with primary keyword}

## {Subtitle: What reader will learn}

{Opening: Why this matters, who it's for}

## Step 1: {Action}
{Details, code examples, screenshots}

## Step 2: {Action}
{Details}

## Step 3: {Action}
{Details}

## Key Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3

## Next Steps
{CTA: follow, subscribe, try it yourself}
```

### The Milestone Post (IndieHackers, Reddit, X)
```
{What you achieved} -- here are the real numbers:

Revenue: {$X MRR}
Users: {number}
Timeline: {how long}

What worked:
- {Strategy 1}
- {Strategy 2}

What didn't work:
- {Failure 1}

What's next:
- {Plan}

Ask me anything in the comments.
```

### The Show HN (Hacker News)
```
Title: Show HN: {Product name} -- {One-line description of what it does}

Text: {2-3 paragraphs explaining:}
- What problem it solves
- Technical approach (what makes it interesting)
- Current status and what you're looking for feedback on
```

## Content Repurposing Matrix

Start with one piece of content and repurpose across platforms:

| Source | Reddit | LinkedIn | X | Dev.to | HN |
|--------|--------|----------|---|--------|-----|
| Blog post | Summary + link | Key insight + hook | Thread (5-7 tweets) | Full article | "Show HN" if relevant |
| Product launch | r/SideProject post | Milestone story | Launch tweet | Tutorial/guide | Show HN submission |
| Lesson learned | Detailed write-up | Story post format | Single insight tweet | Full case study | Skip (unless technical) |
| Metric milestone | Numbers + context | Professional update | Celebration tweet | Skip | Skip |

## SEO Integration

For platforms with SEO value (Dev.to, Medium, Substack):

1. **Primary keyword** in title and first paragraph
2. **Secondary keywords** in H2 headings
3. **Natural keyword density** of 1-3%
4. **Meta description** (subtitle) under 160 characters
5. **Internal links** to related content

## Technical Constraints for Automation

When generating content for browser automation (Playwright):
- **ASCII English only** — no Unicode diacritics, CJK, or accented characters
- **No emoji** — Playwright cannot type emoji characters
- **No em-dashes** — use double hyphens `--` instead
- **No curly quotes** — use straight quotes only
- **No special symbols** — avoid ™, ©, ®, etc.

## Output

For each platform, save the adapted content to:
```
posts/drafts/{platform}_post.md
```

Include platform-specific metadata at the top:
```markdown
---
platform: {platform name}
char_count: {number}
tags: {comma-separated if applicable}
method: auto | manual
---
{Content here}
```
