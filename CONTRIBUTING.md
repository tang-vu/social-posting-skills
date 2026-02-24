# Contributing

Want to add a new platform? Follow this guide.

## Adding a New Platform Skill

### 1. Create the skill directory

```bash
mkdir -p .agents/skills/post-{platform}/
```

### 2. Create SKILL.md using this template

```markdown
---
description: Post to {Platform} for {audience/purpose}
---
# {Platform} Posting Skill

## Platform Overview
{What it is, who uses it, why post here}

## Platform Constraints
- **Character Limit**: {number}
- **Media**: {supported formats, limits}
- **Links**: {how links are handled}
- **Tags/Hashtags**: {rules}

## Posting Method
{Choose one: Browser Automation OR Manual Paste OR API}

### Browser Automation Steps
1. Navigate to `{URL}`
2. Wait for page load
3. {Specific steps}
4. Click Post
5. Verify

### Manual Paste (if auto not possible)
1. Save content to `posts/drafts/{platform}_post.md`
2. Inform user to paste manually

## Content Format
{Template with placeholders}

## Content Strategy
{What works on this platform}

## Algorithm / Discovery Tips
{How content gets distributed}

## Best Practices
{Do's}

## What to Avoid
{Don'ts}

## Known Pitfalls
{Technical issues}

## Related Skills
- `content-writing` — Content adaptation
- `image-generation` — Platform image specs
```

### 3. Update the workflow

Add your platform to `.agents/workflows/post-social.md` under Step 3.

### 4. Update CATALOG.md

Add your platform to the skills table.

### 5. Update README.md

Add your platform to the Supported Platforms table.

## Pull Request Checklist

- [ ] SKILL.md has valid YAML frontmatter
- [ ] All template sections are filled in (no placeholders)
- [ ] Character limits and constraints are accurate
- [ ] At least 2 content templates included
- [ ] Posting method is clearly documented
- [ ] Workflow updated
- [ ] CATALOG.md updated
- [ ] README.md updated

## Code of Conduct

Be respectful, constructive, and helpful. We're building tools for the community.
