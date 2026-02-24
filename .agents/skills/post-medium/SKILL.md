---
description: Publish articles on Medium for broad audience reach and Google SEO
---
# Medium Posting Skill

## Platform Overview
Medium is a popular blogging platform with strong Google SEO (domain authority 96). Articles can reach millions through Medium's internal recommendation engine and external search traffic. 100M+ monthly readers. Great for thought leadership and reaching audiences beyond the developer community.

## IMPORTANT: Vietnam Access Limitation

> **Medium is BLOCKED in Vietnam.** The browser agent will NOT be able to access medium.com without a VPN.

### Workarounds
1. **VPN Required**: User must enable VPN before the agent attempts to post
2. **Pre-check**: Before posting, navigate to `https://medium.com` and verify it loads
3. **If blocked**: Save the article content to `posts/drafts/medium_post.md` and instruct the user to:
   - Enable VPN
   - Open medium.com manually
   - Copy-paste the content
4. **Alternative**: The agent can retry after the user confirms VPN is active

### Automation Flow with VPN
1. Ask user: "Medium is blocked in Vietnam. Is your VPN active?"
2. If yes: proceed with browser automation
3. If no: save draft and inform user to enable VPN first

## Posting Method: MANUAL PASTE (Recommended)

> Due to VPN requirement and potential bot detection, Medium uses Manual Paste mode. The agent generates content and saves it to `posts/drafts/medium_post.md`.

## Platform Constraints
- **Length**: No character limit — 5-10 minute reads perform best (1,500-3,000 words)
- **Format**: Rich text editor, supports code blocks, images, embeds
- **Tags**: Up to 5 tags per story
- **Paywall**: Can publish behind Medium's paywall (Partner Program) for earnings
- **Publications**: Can submit to publications for 10x-100x wider reach
- **Canonical URL**: Set canonical URL when cross-posting from your blog

## Content Format
```
# {Title -- compelling and keyword-rich}

{Subtitle / deck -- 1 sentence summary}

{Opening hook: personal story, surprising stat, or bold claim}

---

## {Section 1: Context/Problem}
{Content explaining the background}

## {Section 2: Solution/How-To}
{Main content with code blocks, images, examples}

## {Section 3: Results/Analysis}
{Data, outcomes, lessons}

## Conclusion
{Summary + what the reader should do next}

---

*If you found this useful, follow me for more articles on {topic}.*
```

## Tag Strategy (Max 5 Tags)

| Topic Area | Recommended Tags |
|-----------|-----------------|
| AI/ML | Artificial Intelligence, Machine Learning, AI, Technology, Programming |
| Web Dev | JavaScript, Web Development, Programming, Software Development, React |
| Startup | Startup, Entrepreneurship, Business, Technology, Product Management |
| Career | Career Advice, Software Engineering, Technology, Self Improvement, Productivity |
| Data | Data Science, Analytics, Python, Big Data, Statistics |

> The first tag is the most important — it determines the primary distribution channel.

## SEO Optimization
- **Title**: Include primary keyword (becomes the URL slug on Google)
- **First 150 words**: Critical for Google snippet — include main keyword
- **Subheadings**: Use H2 with keyword variations
- **Alt text**: Add to all images for accessibility and SEO
- **Reading time**: 5-10 minutes is the sweet spot (longer = more engagement signals)
- Medium's domain authority is 96 — articles rank exceptionally well on Google

## Content Strategy
- **Personal stories with lessons**: Most shared content type on Medium
- **Technical tutorials**: Step-by-step guides with code examples
- **Listicles with depth**: "7 Things I Learned..." with real substance
- **Data-driven analysis**: Benchmarks, comparisons, original research
- **Contrarian takes**: Bold opinions backed by evidence
- **Cross-post from your blog**: Use canonical URL to avoid SEO penalties

## Algorithm / Discovery Tips
- **Claps**: Medium shows articles to more people based on "claps" (0-50 per reader)
- **Reading time**: Articles people actually finish get boosted more
- **Publications**: Submitting to large publications gives 10x-100x reach
- **Consistency**: Weekly publishing builds follower momentum
- **Early engagement**: First 24 hours are critical for distribution
- **Internal links**: Link to your other Medium articles for reader retention
- **Email distribution**: Medium emails articles to followers

## Top Medium Publications to Submit To

| Publication | Topic | Followers |
|-------------|-------|-----------|
| Towards Data Science | AI/ML/Data | 600K+ |
| Better Programming | Software Dev | 200K+ |
| The Startup | Startups | 700K+ |
| UX Collective | Design/UX | 400K+ |
| Level Up Coding | Programming | 100K+ |
| JavaScript in Plain English | JS/Web | 150K+ |
| Towards AI | AI/ML | 100K+ |

## Best Practices
- Write a compelling subtitle (it appears in Google results as meta description)
- Use section images to break up long content
- Include code blocks with syntax highlighting
- End with a clear CTA (follow, clap, or link to your other work)
- Submit to a publication for maximum reach
- Respond to comments within 24 hours

## What to Avoid
- Clickbait titles that don't deliver
- Articles under 800 words (rarely get distributed)
- Publishing without tags
- Ignoring the subtitle field (it's valuable SEO real estate)
- Only publishing behind the paywall (limits reach)

## Related Skills
- `content-writing` — Article templates and SEO integration
- `image-generation` — Medium cover image specs (1400x788)
