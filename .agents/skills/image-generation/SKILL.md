---
description: Generate and optimize images for social media posts across all platforms
---
# Image Generation Skill

You are an expert at creating social media images using AI image generation tools. Your job is to create platform-appropriate visuals that stop the scroll and support the post content.

## Platform Image Specifications

| Platform | Recommended Size | Aspect Ratio | Max File Size | Format |
|----------|-----------------|--------------|---------------|--------|
| Reddit | 1200x628 | 1.91:1 | 20 MB | PNG, JPG |
| LinkedIn | 1200x627 | 1.91:1 | 10 MB | PNG, JPG |
| Facebook | 1200x630 | 1.91:1 | 8 MB | PNG, JPG |
| Threads | 1080x1080 | 1:1 | 8 MB | PNG, JPG |
| X (Twitter) | 1200x675 | 16:9 | 5 MB | PNG, JPG |
| Product Hunt | 1270x760 | 5:3 | 2 MB | PNG, JPG |
| Dev.to | 1000x420 | ~2.38:1 | 10 MB | PNG, JPG |
| Bluesky | 1200x675 | 16:9 | 1 MB | PNG, JPG |
| Substack | 1100x220 (banner) | 5:1 | 5 MB | PNG, JPG |
| Medium | 1400x788 | 16:9 | 10 MB | PNG, JPG |

> Hacker News and IndieHackers do not support inline images in posts.

## Image Types

### 1. Hero / Cover Image
- Used for: Dev.to cover, Medium cover, Substack header, blog link previews
- Style: Clean, professional, readable at small sizes
- Include: Title text overlay, brand colors, simple illustration

### 2. Social Share Card
- Used for: X, LinkedIn, Facebook, Reddit link posts
- Style: Open Graph preview image
- Include: Title, author, brand mark

### 3. Content Image
- Used for: Inline images in long-form content
- Style: Screenshots, diagrams, charts, code snippets
- Include: Relevant visual that adds to the content

### 4. Engagement Image
- Used for: Threads, Bluesky, X standalone posts
- Style: Eye-catching, meme-style, or infographic
- Include: Key stat, quote, or visual hook

## Prompt Engineering for Social Images

### General Prompt Template
```
{Style}: {Subject}, {Context}, {Visual elements}. 
Clean design, {color palette}, suitable for social media post. 
No text overlay needed.
```

### Style Keywords That Work Well
- **Tech/SaaS**: "flat illustration", "isometric design", "minimalist vector"
- **Professional**: "corporate photography style", "clean gradient"
- **Creative**: "vibrant colors", "geometric patterns", "abstract art"
- **Developer**: "dark theme code editor", "terminal screenshot", "architecture diagram"

### Example Prompts

**For a product launch post:**
```
Flat illustration of a rocket launching from a laptop screen, 
modern tech startup vibe, blue and purple gradient background, 
clean minimalist design, suitable for social media hero image
```

**For a tutorial post:**
```
Isometric illustration of a developer workspace with code editor, 
coffee cup, and sticky notes, warm color palette, 
professional tech blog cover image style
```

**For a milestone celebration:**
```
Abstract celebration design with upward trending graph, 
confetti elements, green and gold color scheme, 
modern SaaS dashboard style, clean and professional
```

## When to Use Images

| Platform | Image Impact | Recommendation |
|----------|-------------|----------------|
| Reddit | Medium | Optional, helps link posts |
| LinkedIn | High | Use for 2x engagement |
| Facebook | High | Always include |
| Threads | Medium | Good for visual posts |
| X (Twitter) | Very High | Tweets with images get 150% more retweets |
| Product Hunt | Critical | Required for product pages |
| Dev.to | Medium | Cover image recommended |
| Bluesky | Medium | Helps stand out in feed |
| Substack | Low | Header banner optional |
| Medium | Medium | Cover image for SEO |

## Alt Text Best Practices

Always include alt text for accessibility:
- Describe what the image shows, not what it means
- Keep under 125 characters
- Include key information visible in the image
- Don't start with "Image of" or "Picture of"

## Output

Save generated images to:
```
posts/images/{platform}_{descriptive_name}.png
```

Example: `posts/images/x_product_launch_hero.png`
