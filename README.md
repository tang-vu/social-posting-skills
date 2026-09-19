# Social Posting Skills

**Agent-native social distribution. One source → platform-native campaign → human-approved publishing.**

Turn a release, README, changelog, or blog post into a reviewable distribution campaign for 12 platforms — with a real approval step, safe failure recovery, and no spam machinery.

Built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex](https://github.com/openai/codex), [Gemini CLI](https://github.com/google-gemini/gemini-cli), [Cursor](https://cursor.com), OpenCode, and any agent that reads `SKILL.md` files. Also usable as a CLI, a library, or an MCP server.

```text
Source artifact
      ↓
Campaign intent (goal, audience, disclosures)
      ↓
Content graph  (one canonical fact layer)
      ↓
Platform-native adaptations  (not shortened cross-posts)
      ↓
Preview  →  Human approval  →  Publish or export draft
      ↓
Receipts + observations  →  Reusable learnings
```

## Why not "post this everywhere"?

- **A campaign is not mass-posting.** Each platform item is generated from one content graph but shaped for that platform's culture — a Show HN is not a LinkedIn post is not an X thread.
- **Nothing publishes without approval.** Preview shows the exact content, links, media, thread structure, warnings, and publish method for every item. You approve item-by-item.
- **Failure is honest.** If a browser run dies mid-submit, the item is marked `unknown` with reconciliation steps — never blindly retried. Duplicate public posts are worse than a local failure.
- **Every platform falls back to a draft package.** If automation is unavailable or the UI changed, you get a self-contained folder (`package.json` + `post.md` + `playbook.json`) to finish by hand.
- **Local-first.** Generation, preview, validation, drafts, receipts, and learnings work with zero credentials. Official APIs are optional add-ons.

## Quick start

### 1. Install the skills

```bash
npx social-posting-skills            # → ./.agents/skills (project)
npx social-posting-skills --claude   # → ~/.claude/skills
npx social-posting-skills --codex    # → ~/.codex/skills
npx social-posting-skills --cursor   # → ~/.cursor/skills
npx social-posting-skills --gemini   # → ~/.gemini/skills
npx social-posting-skills --opencode # → ~/.opencode/skills
npx social-posting-skills --path DIR # → custom location
```

Then ask your agent: *"Create a distribution campaign for README.md"* — the `social-campaign` skill drives the pipeline.

### 2. …or drive the CLI directly

```bash
npx social-posting-skills campaign create \
  --source README.md --preset oss-launch --subreddit r/opensource

npx social-posting-skills campaign preview  <id>   # inspect every item
npx social-posting-skills campaign approve  <id> --items x,bluesky,reddit
npx social-posting-skills campaign publish  <id>   # publishes approved items
npx social-posting-skills campaign export   <id>   # draft packages for the rest
```

The `oss-launch` preset produces: X thread · LinkedIn narrative · Bluesky chain · Threads chain · Reddit draft · Show HN draft · Dev.to article · Product Hunt assets — all from one source, all differentiated.

## Platforms and publish modes

Capabilities are honest per-platform data (`platforms/*.json`), not marketing rows. Modes:

- **manual** — draft package export, always available
- **agent-browser** — structured playbook for the agent's own browser tooling (bounded waits, aborts on ambiguity/challenges)
- **api** — official API, only where implemented and configured

| Platform | Modes | Thread | Native shape |
|---|---|---|---|
| X | manual, agent-browser | ✓ | hook thread, link strategy |
| Bluesky | manual, agent-browser, **api** | ✓ | short post / reply chain |
| Threads | manual, agent-browser | ✓ | micro-post + reply chain |
| LinkedIn | manual | — | professional narrative |
| Reddit | manual, agent-browser | — | community title/body, transparent affiliation |
| Hacker News | manual, agent-browser | — | factual Show HN (url + optional text) |
| Dev.to | manual, agent-browser, **api** | — | developer article, tags |
| Product Hunt | manual | — | launch assets + maker comment |
| Substack | manual, agent-browser | — | newsletter article |
| Medium | manual | — | long-form article |
| Facebook | manual, agent-browser | — | community post |
| IndieHackers | manual | — | build-in-public update |

API adapters today: **Bluesky** (`BSKY_HANDLE` + `BSKY_APP_PASSWORD`) and **Dev.to** (`DEVTO_API_KEY`). Everything else ships manual/agent-browser; the draft fallback always works.

## Sources

```bash
--source README.md                  # local file
--source CHANGELOG.md
--source "https://github.com/o/r/releases/tag/v1.0.0"
--source "o/r@v1.0.0"               # GitHub release shorthand
--source "npm:my-package"           # npm release metadata
--source "git:HEAD~5..HEAD"         # git diff summary
--source "text:…"                   # literal text
```

Remote fetches are bounded (1 MB, timeout, ≤3 redirects), http/https only, and SSRF-guarded (private IPs, `.local`/`.internal` hosts, and DNS-rebinding are blocked). Nothing fetches authenticated/private content.

## CLI reference

```text
campaign create --source <s> [--preset p] [--platforms a,b] [--subreddit r/x]
campaign adapt <id> [--overwrite]       # regenerate platform drafts
campaign graph <id> [--json]            # inspect the content graph
campaign set-node <id> --id <n> --value "<text>"
campaign set <id> --item <p> --field body|title|thread|mode|account|target.* --value "…"
campaign validate <id>
campaign preview <id> [--json]          # full approval package
campaign approve <id> --items a,b | --all
campaign publish <id> [--items …] [--mode api|agent-browser|manual] [--force]
campaign export <id>                    # draft packages
campaign record <id> --item <i> (--url u|--failed|--unknown|--partial --published k)
campaign reconcile <id> --item <i> (--published --url u|--not-published)
campaign observe <id> --item <i> --url u --views n --likes n …
campaign learn <id> --text "<lesson>" [--inferred]
campaign schedule <id> --item <i> --at <iso> --tz <IANA> | --clear
campaign receipts <id> | campaign variants <id>
adapters | doctor | calendar | learnings | presets | mcp | init | install
```

## MCP server

```bash
npx social-posting-skills mcp    # stdio JSON-RPC server
```

Tools: `create_campaign`, `adapt_content`, `preview_campaign`, `validate_platform_post`, `list_campaign_assets`, `publish_approved_item`, `record_outcome`, `list_adapters`, `campaign_status`, `export_draft`, `list_presets`. `publish_approved_item` only acts on **approved** items; no browser control is exposed.

## Library API

```js
import {
  ingest, createCampaign, buildContentGraph, adaptCampaign,
  validateCampaign, approvalPackage, approveItems,
  publishItem, exportCampaign, save, load,
} from "social-posting-skills";
```

## Safety model (the short version)

- Human approval before publication — always the default path
- Content-hash duplicate detection across campaigns; `unknown`/`partial` states with explicit reconciliation — no blind retries
- Playbooks abort on selector ambiguity, challenges, CAPTCHAs, login walls — drafts are preserved
- No mass DMs, fake engagement, vote manipulation, astroturfing, follow farming, CAPTCHA bypass, anti-detection, account rotation, or rate-limit circumvention
- Secrets come from env vars only, are never logged, and `.gitignore` blocks campaign state, browser state, cookies, keys, and `.env*`
- Platform facts carry `lastReviewed` + confidence levels; heuristic advice is labeled as such

See [docs/SAFETY.md](docs/SAFETY.md) for the full model.

## Project layout

```
platforms/*.json        volatile platform rules as versioned data (the source of truth)
src/core/               campaign engine: ingest, graph, adapt, validate, approve,
                        publish, receipts, drafts, media, links, learnings, schedule
src/adapters/           adapter contract + bluesky/devto API implementations
src/browser/            selector resolver + playbook builder (ambiguity-safe)
src/interfaces/         CLI, MCP server, installer, doctor
skills/                 canonical SKILL.md sources (15) + skill.json manifests
.agents/skills/         generated compatibility copies (same content)
.agents/workflows/      post-social.md — the campaign lifecycle workflow
test/                   node:test suite — no test ever contacts a platform
docs/                   SAFETY, MIGRATION, MAINTENANCE, architecture, guides
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/SAFETY.md](docs/SAFETY.md) | Threat model, anti-spam rules, failure recovery, secrets |
| [docs/MIGRATION.md](docs/MIGRATION.md) | v2 → v3: what changed, what still works |
| [docs/MAINTENANCE.md](docs/MAINTENANCE.md) | Keeping platform facts fresh; review cadence |
| [docs/system-architecture.md](docs/system-architecture.md) | System design: core, adapters, interfaces |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Unknown states, selector misses, drift |
| [docs/PLATFORM_COMPARISON.md](docs/PLATFORM_COMPARISON.md) | Platform orientation (numbers live in `platforms/*.json`) |
| [docs/project-overview-pdr.md](docs/project-overview-pdr.md) | Product definition + requirements status |
| [docs/codebase-summary.md](docs/codebase-summary.md) | File-by-file map |
| [docs/project-roadmap.md](docs/project-roadmap.md) | What's next / explicitly out of scope |
| [docs/deployment-guide.md](docs/deployment-guide.md) | Package contents + release process |
| [docs/code-standards.md](docs/code-standards.md) · [docs/design-guidelines.md](docs/design-guidelines.md) | Conventions + design principles |
| [CATALOG.md](CATALOG.md) | Skill registry |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Add a platform, update rules, run tests |

## License

[MIT](LICENSE)
