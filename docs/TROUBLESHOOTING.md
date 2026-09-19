# Troubleshooting

## Publish states

| Symptom | Meaning | Fix |
|---|---|---|
| `→ blocked (item status is "draft", needs "approved")` | Not approved yet | `campaign approve <id> --items <p>` then publish |
| `→ blocked (item status is "exported", …)` | Already exported a draft | Re-approve deliberately, or `campaign set` the content then approve |
| `→ duplicate-blocked` | Same content+platform was published before (any campaign) | Check `prior.postUrl` in the receipt; `--force` only if intentional |
| `→ unknown` + reconciliation steps | Side effect ambiguous — post may or may not exist | Check the profile manually, then `campaign reconcile <id> --item <p> --published --url <u>` or `--not-published` |
| `→ partial` | Some thread posts landed | Receipt has `publishedCount`; continue from the last confirmed post — do not republish the whole thread |
| `→ fallback-draft` | `--mode api` requested but no API adapter/creds | Use the draft package, or set the env vars and retry |
| `Nothing to publish — no matching approved items` | Bare `publish` only touches approved items | Approve first or pass `--item`/`--items` |

## Validation

| Warning/error | Cause | Fix |
|---|---|---|
| `<p>: body is N chars, limit is M` | Over platform limit | Shorten, or move the link to first comment/reply |
| `disclosures declared (…) but not visible in content` | Intent declares disclosures the item doesn't show | Add the disclosure line, or remove the declaration |
| `numbers not found in source/factBase` | Adapted text cites a number the source doesn't contain | Fix the claim or add it to `--facts` |
| `reddit: no subreddit target set` | Reddit needs a target | `campaign set <id> --item reddit --field target.subreddit --value r/name` |
| `engagement-bait phrasing detected` | "Please upvote/like/share" style text | Rewrite — this is a hard error on every platform |
| `identical to <other> item — cross-posted identical text` | Two items have the same body | Differentiate or drop one; identical cross-posts are flagged by design |

## Browser playbooks

| Symptom | Meaning | Fix |
|---|---|---|
| Selector resolves `missing` | Platform UI changed (or wrong page state) | Add the new selector to `platforms/<p>.json` candidates; update the fixture; re-run |
| Selector resolves `ambiguous` | Multiple elements match — playbook aborts by design | Tighten the selector (add `data-testid`/`role`/text qualifiers) |
| `challenge-detected` | CAPTCHA/login wall | Solve it yourself in your own browser, then continue — the tool will not bypass |
| `login-expired` | Session cookie dead | Re-login in your own browser profile, re-run the playbook |
| `awaiting-agent` receipt, nothing after | Playbook was written but the run wasn't completed/reported | Run it or `campaign record <id> --item <p> --failed` to close the loop |

## Installer / skills

| Symptom | Fix |
|---|---|
| `doctor` reports install drift | Re-run `npx social-posting-skills install` — bundled skills changed since your install |
| Agent doesn't see the skill | Confirm the install target matches your client's skills dir; `doctor` shows the manifest location |
| Old `.agents/skills` content lingering | Delete `.agents/skills` and reinstall — `.agents/` is generated, never edited by hand |

## Secrets / env

| Symptom | Fix |
|---|---|
| API mode fails with missing env | Set `BSKY_HANDLE`/`BSKY_APP_PASSWORD` or `DEVTO_API_KEY`; `doctor` lists what's missing |
| Asset rejected as sensitive-looking | Rename the file — `assertAssetNameSafe` blocks keys/certs/cookies/tokens/`.env` patterns |

## Still stuck

`npx social-posting-skills doctor` covers environment, platform metadata, adapters, store writability, optional creds, gitignore safety, and install drift — run it first and paste the output into an issue.
