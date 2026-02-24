# Troubleshooting

Common issues when using social posting skills with AI agents.

## Bot Detection / Cloudflare Blocking

**Symptom**: Page shows "Verifying you are human" or spins forever.

**Affected platforms**: Product Hunt, IndieHackers, sometimes Medium.

**Cause**: Playwright/Chromium browser is detected as a bot. It lacks anti-detect features (WebGL extensions, navigator.webdriver flag, etc.).

**Workaround**: These platforms use Manual Paste mode. The agent generates the content and saves it to `posts/drafts/{platform}_post.md`. You copy-paste it into your real browser.

---

## Vietnamese Text / Unicode Characters

**Symptom**: Playwright types garbled characters or skips diacritics.

**Affected platforms**: All (when using browser automation).

**Cause**: Playwright's `type()` method cannot reliably input Unicode diacritics, CJK characters, or emoji.

**Workaround**: All automated posts must be in **ASCII English only**. For Vietnamese content, use Manual Paste mode.

---

## LinkedIn System Policy Block

**Symptom**: Browser agent cannot navigate to linkedin.com.

**Cause**: System-level policy blocks browser automation tools from accessing LinkedIn.

**Workaround**: LinkedIn always uses Manual Paste mode. Content is saved to `posts/drafts/linkedin_post.md`.

---

## Medium Blocked in Vietnam

**Symptom**: medium.com doesn't load or times out.

**Cause**: Medium is blocked by ISPs in Vietnam.

**Workaround**:
1. Enable VPN before posting
2. Or use Manual Paste mode (agent saves draft, you paste when VPN is on)

---

## Session Expiry

**Symptom**: Platform shows login page instead of home feed.

**Cause**: Browser cookies/sessions have expired.

**Fix**: Open the platform in the agent's browser, log in manually, then retry.

---

## Emoji in Posts

**Symptom**: Emoji characters are skipped or cause errors.

**Cause**: Playwright's keyboard input doesn't support emoji encoding.

**Workaround**: The content-writing skill strips emoji from auto-posted content. For manual platforms, emoji are included in the draft.

---

## Image Upload Failures

**Symptom**: Image doesn't attach to the post.

**Cause**: Browser file picker dialogs are difficult for automation tools to interact with.

**Workaround**: Most platforms that support images have the agent create text-only posts. Images can be added manually if needed.

---

## Rate Limiting

**Symptom**: Platform shows error or blocks posting.

**Cause**: Posting too frequently or too many platforms in rapid succession.

**Fix**: Add delays between platform posts. The workflow handles this automatically via sequential posting.
