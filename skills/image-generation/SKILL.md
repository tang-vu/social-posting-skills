---
name: image-generation
description: Plan, describe and register campaign media — platform-sized visuals with alt text and provenance in the media manifest
---

# Image / Media (Campaign Layer)

Campaign media is managed, not improvised: every asset enters via
`campaign assets add` with alt text and provenance, and validation checks
bounds per platform (`platforms/*.json`).

## Discipline

- Assets are explicit: `campaign assets add <id> <file> --alt "..." --item <i>`
- Alt text is required for accessibility — describe what the image SHOWS
  (content and function), not keywords. Under ~125 chars where possible.
- Provenance matters: mark AI-generated images as such (Meta/FB require
  AI labels; honesty is the default everywhere).
- Never attach files with sensitive names/contents; the CLI refuses
  obvious ones (.env, keys, tokens) — don't try to work around it.
- Validate bounds before publishing: count, MB, format, aspect — the
  validator reads `platforms/*.json`; trust it over memory.

## Size guidance

Recommended sizes live in each `platforms/<id>.json` (`media.imageSize`,
`media.maxImageMB`, `media.formats`). When generating an image, target the
platform's ratio: roughly 16:9 for X/Bluesky/LinkedIn link cards, 1:1 for
Threads, 5:3 for Product Hunt gallery, ~2.4:1 for Dev.to covers, tall or
square where the platform crops centrally.

## What makes a good campaign image

- Shows the product working (screenshot, demo frame) > abstract art.
- One focal point, readable at feed size.
- Text overlay only when it survives small sizes; better in alt/title.
- Consistent with the post's claim — no fake screenshots, no fabricated
  charts. Media is evidence, not decoration.

## Prompt patterns (for generation tools)

```
{subject}, {context}, flat illustration|isometric|clean product shot,
{palette}, minimal, no text overlay, high contrast for feed thumbnails
```

Keep prompts honest: don't generate "screenshots" of a UI that doesn't
exist. For product shots prefer real captures via the media manifest.
