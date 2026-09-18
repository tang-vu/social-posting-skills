# Platform Capability Metadata

Volatile platform facts live here as data — not scattered through prompts or prose.
Every platform file is independently versioned and carries a `verification` block.

## Schema

```jsonc
{
  "id": "x",                          // stable platform identifier
  "displayName": "X (Twitter)",
  "version": "2026-09-18",            // date this file was last revised
  "status": "active",                 // active | degraded | deprecated

  "verification": {
    "lastReviewed": "2026-09-18",     // when a human last checked these facts
    "confidence": "medium",           // high | medium | low — overall file confidence
    "sources": [],                    // URLs to official docs where applicable
    "notes": "What is verified vs what is folklore"
  },

  "constraints": {
    "post":  { "maxChars": { "value": 280, "confidence": "documented" } },
    "title": { "maxChars": { "value": 300, "confidence": "documented", "required": true } },
    "body":  { "maxChars": { "value": 40000, "confidence": "documented" } }
  },
  // confidence levels:
  //   "documented"          = stated in official platform docs
  //   "verified"            = observed/tested by maintainers
  //   "community-heuristic" = widely repeated strategy advice, NOT a platform rule
  //   "unknown"             = believed but unconfirmed

  "thread": {
    "supported": true,
    "style": "composer-chain",        // composer-chain | reply-chain | none
    "recommendedMax": 10              // soft guidance, not enforced
  },

  "media": {
    "supported": true,
    "maxImages": 4,
    "maxImageMB": 5,
    "imageSize": [1200, 675],         // recommended WxH
    "altText": true,                  // platform exposes alt-text field
    "formats": ["png", "jpg", "gif", "webp"]
  },

  "links": {
    "policy": "inline",               // inline | reply-preferred | first-comment | url-field
    "confidence": "documented",
    "notes": "t.co wrapping; see strategy docs for placement heuristics"
  },

  "hashtags": { "supported": true, "maxRecommended": 2 },

  "capabilities": {
    "generate": true,                 // can produce platform-native drafts
    "validate": true,                 // machine-checkable constraints
    "preview": true,                  // approval-package preview
    "draft": true,                    // draft-package export
    "publish": ["manual", "agent-browser", "api"],
    "observe": ["manual-import"],
    "thread": true,
    "media": true
  },

  "publishing": {
    "defaultMode": "manual",          // manual | agent-browser | api
    "api": {
      "available": true,
      "implemented": true,            // an adapter exists in src/adapters/platforms
      "env": ["BSKY_HANDLE", "BSKY_APP_PASSWORD"],
      "docs": "https://docs.bsky.app/"
    }
  },

  "automation": {
    "entryUrl": "https://x.com/home",
    "boundedWaitMs": 8000,            // max wait per step; never infinite
    "selectors": {
      "composer":    ["[data-testid='tweetTextarea_0']", "[role='textbox']"],
      "postButton":  ["[data-testid='tweetButtonInline']", "button:has-text('Post')"],
      "addToThread": ["[data-testid='addButton']"]
    }
    // Selector lists are candidate lists, most-stable first. UI assumptions are
    // volatile: resolution MUST fail on zero or ambiguous matches, never guess.
  },

  "rateLimit": {
    "postsPerDay": 2400,
    "confidence": "documented",
    "notes": "Platform-level cap; practical self-limit should be far lower"
  },

  "culture": {
    "audience": "Tech, media, real-time news",
    "tone": "concise, direct, conversational",
    "works": ["a single sharp claim", "threads that teach", "build-in-public"],
    "avoid": ["marketing speak", "hashtag stuffing", "engagement bait"]
  }
}
```

## Maintenance

- Review each file at least quarterly; bump `verification.lastReviewed` when checked.
- New platform = new JSON file + adapter + skill. See `CONTRIBUTING.md`.
- Never promote a `community-heuristic` to `documented` without an official source.
