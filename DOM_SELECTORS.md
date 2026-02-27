# DOM Selectors Reference — Social Media Auto-Posting & Interactions

> **Last captured**: 2026-02-27  
> **Browser language at capture time**: Vietnamese (vi-VN). `aria-label` values change by language.  
> **Warning**: These selectors can change without notice when platforms update their UI.

---

## Table of Contents
1. [X (Twitter)](#1-x-twitter)
2. [Threads (Meta)](#2-threads-meta)
3. [Bluesky](#3-bluesky)
4. [Facebook](#4-facebook)
5. [LinkedIn](#5-linkedin)
6. [Reddit](#6-reddit)
7. [Automation Notes & Best Practices](#7-automation-notes--best-practices)
8. [Account Status Detection](#8-account-status-detection)
9. [Login Page Detection](#9-login-page-detection)
10. [Post Success Verification & Toasts](#10-post-success-verification--toasts)
11. [Post URL Extraction](#11-post-url-extraction)
12. [Error State Detection](#12-error-state-detection)
13. [Delete / Edit Post](#13-delete--edit-post)
14. [Profile Navigation](#14-profile-navigation)
15. [Expanded Error Handling Checklist](#15-expanded-error-handling-checklist)

---

## 1. X (Twitter)

**URL**: `https://x.com/home`  
**Editor Framework**: Draft.js (Rich Text)  
**Selector Style**: `data-testid` — **extremely stable**, best platform for automation

### 1.1 Posting (Compose)

| Element | Best Selector | Alt Selector |
|---------|--------------|-------------|
| **Open Composer (sidebar)** | `[data-testid="SideNav_NewTweet_Button"]` | |
| **Compose URL** | Navigate to `https://x.com/compose/post` | |
| **Text Input** | `div[data-testid="tweetTextarea_0"]` | `div[role="textbox"][aria-label="Post text"]` |
| **Post Button** | `button[data-testid="tweetButton"]` | |
| **Add Thread (+)** | `button[data-testid="addButton"]` | `button[aria-label="Add post"]` |

**Text Input Details:**
- Tag: `DIV`
- `role="textbox"`, `contenteditable="true"`
- `class: notranslate public-DraftEditor-content`
- Framework: Draft.js
- Disabled state: `aria-disabled="true"` on Post button when empty
- When thread has 2+ posts, button text changes to "Post all"

### 1.2 Feed Interactions

| Action | Selector | Notes |
|--------|----------|-------|
| **Tweet Container** | `[data-testid="tweet"]` | Wraps each tweet in feed |
| **Like** | `[data-testid="like"]` | Changes to `[data-testid="unlike"]` when liked |
| **Unlike** | `[data-testid="unlike"]` | Reverts to `like` |
| **Retweet** | `[data-testid="retweet"]` | Opens dropdown menu |
| **Repost (confirm)** | `[data-testid="retweetConfirm"]` | Inside the retweet dropdown |
| **Quote Tweet** | `[role="menuitem"][href="/compose/post"]` | Inside retweet dropdown, has "Quote" text |
| **Reply** | `[data-testid="reply"]` | Opens reply composer |
| **Bookmark** | `[data-testid="bookmark"]` | |
| **Share** | `[aria-label="Share post"]` | VN: `[aria-label="Chia sẻ bài viết"]` |
| **Follow** | `[data-testid$="-follow"]` | Pattern: `{userId}-follow` |

### 1.3 Inline Reply (on Tweet detail page)

| Element | Selector |
|---------|----------|
| **Reply Textbox** | `[role="textbox"][aria-label="Post text"]` |
| **Reply Post Button** | `button[data-testid="tweetButtonInline"]` |

### 1.4 Thread Posting (Multi-tweet)

```
Flow:
1. Open composer → type first tweet
2. Click [data-testid="addButton"] → new textarea appears: tweetTextarea_1
3. Type second tweet in [data-testid="tweetTextarea_1"]
4. Repeat for more tweets (tweetTextarea_2, tweetTextarea_3, ...)
5. Click [data-testid="tweetButton"] → posts all tweets as thread

Pattern: tweetTextarea_{index} — index starts at 0
```

### 1.5 Media & Other Buttons

| Element | Selector |
|---------|----------|
| Add Photos/Video | `button[aria-label="Add photos or video"]` |
| Add GIF | `button[data-testid="gifSearchButton"]` |
| Add Poll | `button[data-testid="createPollButton"]` |
| Add Emoji | `button[aria-label="Add emoji"]` |
| Schedule Post | `button[data-testid="scheduleOption"]` |
| Character Count | `div[role="progressbar"]` |
| Close/Discard | `button[aria-label="Close"]` |
| Reply Permissions | `button[aria-label="Everyone can reply"]` |

### 1.6 Scrolling (Feed Browsing)

```javascript
// Scroll down like a real person
window.scrollBy(0, Math.random() * 300 + 200);
// Or use keyboard:
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
```

---

## 2. Threads (Meta)

**URL**: `https://www.threads.net/`  
**Editor Framework**: Lexical (by Meta)  
**Selector Style**: aria-labels + text content — no stable `data-testid`

### 2.1 Posting (Compose)

| Element | Best Selector | Notes |
|---------|--------------|-------|
| **Open Composer** | Click "Có gì mới?" area or sidebar "+" | `div[aria-label*="soạn bài viết mới"][role="button"]` |
| **Text Input** | `div[role="textbox"][data-lexical-editor="true"]` | Stable across languages |
| **Post Button** | `div[role="button"]` → filter by text `"Đăng"` / `"Post"` | ⚠️ DIV not BUTTON |
| **Add Topic** | `input[placeholder="Thêm chủ đề"]` (VN) | `input[placeholder="Add topic"]` (EN) |
| **Cancel** | `div[role="button"]` → text `"Hủy"` / `"Cancel"` | |

**Text Input Details:**
- Tag: `DIV`
- `role="textbox"`, `contenteditable="true"`, `data-lexical-editor="true"`
- `aria-label` (VN): `Trường văn bản trống. Hãy nhập vào để soạn bài viết mới.`
- `aria-placeholder` (VN): `Có gì mới?`
- Framework: Lexical

### 2.2 Feed Interactions

| Action | Selector (VN) | Selector (EN) |
|--------|---------------|---------------|
| **Post Container** | `article` or `div[data-pressable-container]` | Same |
| **Like** | `[aria-label*="Thích"]` | `[aria-label*="Like"]` |
| **Reply** | `[aria-label*="Trả lời"]` | `[aria-label*="Reply"]` |
| **Repost** | `[aria-label*="Đăng lại"]` | `[aria-label*="Repost"]` |
| **Share** | `[aria-label*="Chia sẻ"]` | `[aria-label*="Share"]` |
| **Follow** | `div[role="button"]` → text `"Theo dõi"` | `div[role="button"]` → text `"Follow"` |

### 2.3 Multi-Thread Posting (Reply Chain) ⭐

Threads supports posting multiple replies as a thread BEFORE publishing — all from the same composer modal.

```
Flow:
1. Open composer (click "Có gì mới?" or sidebar "+")
2. Type first post in the main textbox
3. Click "Thêm vào thread" / "Add to thread" button
   → A NEW textbox appears below the first one
4. Type second post in the new textbox
5. Repeat step 3-4 for as many posts as needed
6. Click "Đăng" / "Post" → ALL posts publish as a connected thread

Selectors:
- Add to thread: div[role="button"] → text "Thêm vào thread" / "Add to thread"
- Each textbox: div[role="textbox"][data-lexical-editor="true"] (multiple in DOM)
- Post all: div[role="button"] → text "Đăng" / "Post"
```

### 2.4 Reply to Existing Post

```
Flow:
1. Click reply icon (speech bubble) on any post in feed
2. A modal opens showing the original post + reply textbox
3. Type reply in div[role="textbox"][data-lexical-editor="true"]
4. Click "Đăng" / "Post"
5. Can also "Add to thread" inside the reply modal for multi-reply
```

### 2.5 Media Buttons (Bottom Row of Composer)

All are `div[role="button"]` with SVG icons (left to right):
1. **Media** (images/video upload)
2. **GIF**
3. **Topic/Hashtag**
4. **Poll**
5. **Voice** (audio clip)

---

## 3. Bluesky

**URL**: `https://bsky.app/`  
**Editor Framework**: Tiptap / ProseMirror  
**Selector Style**: Mix of `data-testid` and `aria-label` — good stability

### 3.1 Posting (Compose)

| Element | Best Selector | Alt Selector |
|---------|--------------|-------------|
| **Open Composer** | `button[aria-label="Soạn bài đăng mới"]` (VN) | `button` with "New post" text |
| **Text Input** | `div[role="textbox"][aria-label="Rich-Text Editor"]` | Stable across all languages |
| **Post Button** | `button[data-testid="composerPublishBtn"]` | `data-testid` = most reliable |
| **Cancel** | `button[aria-label="Hủy bỏ"]` (VN) | `button[aria-label="Cancel"]` (EN) |

**Text Input Details:**
- Tag: `DIV`
- `role="textbox"`, `contenteditable="true"`
- `aria-label="Rich-Text Editor"` → **Language-independent!**
- Framework: Tiptap / ProseMirror

### 3.2 Feed Interactions

| Action | Selector (VN) | Selector (EN) |
|--------|---------------|---------------|
| **Like** | `[aria-label*="Thích"]` | `[aria-label*="Like"]` |
| **Reply** | `[aria-label*="Trả lời"]` | `[aria-label*="Reply"]` |
| **Repost** | `[aria-label*="Đăng lại"]` | `[aria-label*="Repost"]` |
| **Share/More Options** | `[aria-label*="Mở bảng tùy chọn"]` | `[aria-label*="options"]` |
| **Quote Post** | Inside repost menu → `"Quote"` option | |

### 3.3 Media & Other Buttons

| Element | Selector |
|---------|----------|
| Image Upload | `button[data-testid="openMediaBtn"]` |
| GIF Selection | `button[data-testid="openGifBtn"]` |
| Emoji Picker | `button[aria-label*="biểu tượng cảm xúc"]` (VN) |
| Language Selection | `button[aria-label="Post language selection"]` |
| Reply Privacy | `button[data-testid="openReplyGateButton"]` |
| Character Count | Text element showing `300` (updates as you type) |

### 3.4 Thread Posting

```
Bluesky does NOT have a native "Add to thread" in the composer like Threads.

Threading flow:
1. Post the first post normally
2. Click Reply on YOUR OWN post
3. Type the second post as a reply
4. Repeat for chain

To reply to your own post:
- Navigate to your profile or find the post
- Click [aria-label*="Trả lời"] / [aria-label*="Reply"]
- Composer opens with reply context
- Type and post
```

---

## 4. Facebook

**URL**: `https://www.facebook.com/`  
**Editor Framework**: Lexical (by Meta) — same as Threads  
**Selector Style**: `aria-label` + `role` — obfuscated CSS classes, no `data-testid`

### 4.1 Posting (Compose)

| Element | Selector | Notes |
|---------|----------|-------|
| **Open Composer** | Click "Bạn đang nghĩ gì?" area | `div[role="button"]` containing "What's on your mind?" |
| **Text Input** | `div[role="textbox"][data-lexical-editor="true"]` | Inside the composer modal |
| **Post Button** | `div[role="button"][aria-label="Đăng"]` (VN) | `div[role="button"][aria-label="Post"]` (EN) |

**Text Input Details:**
- Tag: `DIV`
- `role="textbox"`, `contenteditable="true"`, `data-lexical-editor="true"`
- `aria-label` (VN): `Bạn đang nghĩ gì?`
- `aria-label` (EN): `What's on your mind?` or `What's on your mind, {Name}?`
- Framework: Lexical
- ⚠️ Post button is `div[role="button"]` NOT native `<button>`

### 4.2 Feed Interactions

| Action | Selector (VN) | Selector (EN) |
|--------|---------------|---------------|
| **Post Container** | `[role="article"]` | Same |
| **Like** | `[aria-label="Thích"]` | `[aria-label="Like"]` |
| **Comment** | `[aria-label="Viết bình luận"]` | `[aria-label="Write a comment"]` |
| **Share** | `[aria-label*="Chia sẻ"]` or `[aria-label*="Gửi nội dung"]` | `[aria-label*="Share"]` or `[aria-label*="Send"]` |
| **Follow** | `div[role="button"]` → text `"Theo dõi"` | `div[role="button"]` → text `"Follow"` |

### 4.3 Reactions (Emoji)

Facebook reactions require **hovering** over the Like button for 1-2 seconds to reveal the reaction bar.

```
Flow:
1. Find the Like button: [aria-label="Thích"] / [aria-label="Like"]
2. Hover mouse over it → wait 1.5-2 seconds
3. Reaction bar appears with these buttons:

| Reaction | Selector (VN) | Selector (EN) |
|----------|---------------|---------------|
| Like     | [aria-label="Thích"]        | [aria-label="Like"]   |
| Love     | [aria-label="Yêu thích"]    | [aria-label="Love"]   |
| Care     | [aria-label="Thương thương"] | [aria-label="Care"]   |
| Haha     | [aria-label="Haha"]         | [aria-label="Haha"]   |
| Wow      | [aria-label="Wow"]          | [aria-label="Wow"]    |
| Sad      | [aria-label="Buồn"]         | [aria-label="Sad"]    |
| Angry    | [aria-label="Phẫn nộ"]      | [aria-label="Angry"]  |

4. Click the desired reaction
5. To change: hover again → click different reaction
```

### 4.4 Commenting

```
Flow:
1. Click comment button: [aria-label="Viết bình luận"]
2. Comment input appears: div[role="textbox"][contenteditable="true"]
   (inside the comment section of the post)
3. Type comment text
4. Press Enter to submit
   OR click the send button (arrow icon)
```

### 4.5 Group Posting

```
URL: https://www.facebook.com/groups/{group_id}/
- Composer area: "Write something..." / "Viết gì đó..."
- Same Lexical editor: div[role="textbox"][data-lexical-editor="true"]
- Post may show as "Pending admin approval"
```

### 4.6 Scrolling (Human-like Browsing)

```javascript
// Random scroll amounts to mimic human behavior
function humanScroll() {
  const scrollAmount = Math.floor(Math.random() * 400) + 200;
  window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
}

// Random delays between scrolls (2-5 seconds)
function randomDelay() {
  return Math.floor(Math.random() * 3000) + 2000;
}
```

---

## 5. LinkedIn

**URL**: `https://www.linkedin.com/`  
**Status**: ⛔ **MANUAL PASTE ONLY — DO NOT AUTOMATE**

> LinkedIn blocks browser automation. Automated interaction leads to account restriction or **permanent ban**.

### Workflow: Manual Paste
1. Agent generates content → saves to `posts/drafts/linkedin_post.md`
2. User manually opens LinkedIn
3. User pastes content into composer
4. User clicks "Post"

### Known Selectors (reference only)

| Element | Selector |
|---------|----------|
| Start Post button | `button.share-box-feed-entry__trigger` |
| Text Input | `div[role="textbox"][contenteditable="true"]` (in modal) |
| Post Button | `button.share-actions__primary-action` |
| Like | `button[aria-label*="Like"]` (on post) |
| Comment | `button[aria-label*="Comment"]` (on post) |
| Share | `button[aria-label*="Share"]` (on post) |

---

## 6. Reddit

**URL**: `https://www.reddit.com/r/{subreddit}/submit`  
**Status**: Browser automation possible but risky (spam filters)

### Submit Page

| Element | Selector | Notes |
|---------|----------|-------|
| Post Type (Text) | Tab/button labeled "Text" | |
| Title Input | `textarea[placeholder*="Title"]` or `input[name="title"]` | |
| Body (Rich Text) | `div[role="textbox"][contenteditable="true"]` | |
| Body (Markdown) | `textarea` in markdown mode | Easier for automation |
| Flair Selector | Button containing "Add flair" | Required in many subs |
| Submit Button | `button[type="submit"]` or button with text "Post" | |

### Feed Interactions

| Action | Selector | Notes |
|--------|----------|-------|
| Upvote | `button[aria-label="upvote"]` | |
| Downvote | `button[aria-label="downvote"]` | |
| Comment | Click on the post → comment area | |
| Share | `button[aria-label="share"]` | |
| Save | `button[aria-label="save"]` | |

> **Note**: Reddit's design changes frequently (old Reddit, redesign, Shreddit). Selectors may vary.

---

## 7. Automation Notes & Best Practices

### Selector Reliability Ranking

| Rank | Method | Platforms | Stability |
|------|--------|-----------|-----------|
| 🥇 1 | `data-testid` | X, Bluesky | **Most stable** — explicitly for testing |
| 🥈 2 | `data-lexical-editor` | Facebook, Threads | Framework-specific, very stable |
| 🥉 3 | `aria-label` (lang-independent) | Bluesky (`Rich-Text Editor`) | Good across languages |
| 4 | `aria-label` (lang-dependent) | FB, Threads, Bluesky | Changes by browser language |
| 5 | `role` + `contenteditable` | All | Generic, may match many elements |
| 6 | CSS classes | All | **Least reliable** — obfuscated, changes often |

### Common Patterns

| Pattern | Platforms |
|---------|-----------|
| `contenteditable="true"` | ALL — no platform uses `<textarea>` for main composer |
| `role="textbox"` | ALL — standard ARIA role |
| `data-lexical-editor="true"` | Facebook, Threads (both Meta) |
| `div[role="button"]` instead of `<button>` | Facebook, Threads (Meta) |
| `<button>` with `data-testid` | X, Bluesky |

### Human-Like Behavior Patterns

```javascript
// === SCROLLING ===
function humanScroll() {
  const amount = Math.floor(Math.random() * 400) + 200;
  window.scrollBy({ top: amount, behavior: 'smooth' });
}

// === RANDOM DELAYS ===
function randomDelay(min = 1000, max = 4000) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min)) + min));
}

// === TYPING SIMULATION ===
async function humanType(element, text, chunkSize = 50) {
  element.focus();
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.substring(i, i + chunkSize);
    // Insert chunk (method varies by framework)
    document.execCommand('insertText', false, chunk);
    await randomDelay(100, 300);
  }
}

// === MOUSE MOVEMENT ===
function randomMouseMove(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + Math.random() * rect.width;
  const y = rect.top + Math.random() * rect.height;
  element.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
}
```

### Quick Copy-Paste Selectors

```javascript
// =============================================
// X (Twitter) — Most reliable (data-testid)
// =============================================
const xInput      = document.querySelector('[data-testid="tweetTextarea_0"]');
const xPostBtn    = document.querySelector('[data-testid="tweetButton"]');
const xAddThread  = document.querySelector('[data-testid="addButton"]');
const xLike       = document.querySelector('[data-testid="like"]');
const xRetweet    = document.querySelector('[data-testid="retweet"]');
const xReply      = document.querySelector('[data-testid="reply"]');
const xBookmark   = document.querySelector('[data-testid="bookmark"]');
const xInlinePost = document.querySelector('[data-testid="tweetButtonInline"]');
const xRepostConfirm = document.querySelector('[data-testid="retweetConfirm"]');

// =============================================
// Threads — Lexical editor + text matching
// =============================================
const thInput = document.querySelector('[role="textbox"][data-lexical-editor="true"]');
const thPostBtn = [...document.querySelectorAll('[role="button"]')]
  .find(el => ['Post', 'Đăng'].includes(el.textContent.trim()));
const thAddThread = [...document.querySelectorAll('[role="button"]')]
  .find(el => el.textContent.includes('Thêm vào thread') || el.textContent.includes('Add to thread'));
const thLike = document.querySelector('[aria-label*="Thích"]') 
  || document.querySelector('[aria-label*="Like"]');
const thReply = document.querySelector('[aria-label*="Trả lời"]')
  || document.querySelector('[aria-label*="Reply"]');
const thRepost = document.querySelector('[aria-label*="Đăng lại"]')
  || document.querySelector('[aria-label*="Repost"]');

// =============================================
// Bluesky — data-testid + aria-label
// =============================================
const bskyInput    = document.querySelector('[role="textbox"][aria-label="Rich-Text Editor"]');
const bskyPostBtn  = document.querySelector('[data-testid="composerPublishBtn"]');
const bskyMedia    = document.querySelector('[data-testid="openMediaBtn"]');
const bskyGif      = document.querySelector('[data-testid="openGifBtn"]');
const bskyLike     = document.querySelector('[aria-label*="Thích"]') 
  || document.querySelector('[aria-label*="Like"]');
const bskyReply    = document.querySelector('[aria-label*="Trả lời"]')
  || document.querySelector('[aria-label*="Reply"]');
const bskyRepost   = document.querySelector('[aria-label*="Đăng lại"]')
  || document.querySelector('[aria-label*="Repost"]');

// =============================================
// Facebook — Lexical editor + aria-label
// =============================================
const fbInput   = document.querySelector('[role="textbox"][data-lexical-editor="true"]');
const fbPostBtn = document.querySelector('[role="button"][aria-label="Post"]')
  || document.querySelector('[role="button"][aria-label="Đăng"]');
const fbLike    = document.querySelector('[aria-label="Thích"]')
  || document.querySelector('[aria-label="Like"]');
const fbComment = document.querySelector('[aria-label="Viết bình luận"]')
  || document.querySelector('[aria-label="Write a comment"]');
```

### Account Nurturing Workflow

```
Daily routine to keep accounts active and natural:

1. BROWSE (5-10 min)
   - Open feed
   - Scroll slowly through 10-20 posts
   - Read some posts (stay on post 3-5 seconds)
   
2. REACT (3-5 posts)
   - Like 3-5 posts
   - Use different reactions on Facebook (Love, Haha, etc.)
   - Don't like every post — be selective
   
3. COMMENT (1-2 posts)
   - Write genuine, short comments
   - Ask questions or share opinions
   - 2-4 sentences minimum
   
4. FOLLOW (1-2 accounts)
   - Follow accounts in your niche
   - Don't mass-follow (rate limits!)
   
5. POST (1-2 times)
   - Original content, not copied
   - Use platform-specific formats
   
6. ENGAGE (after posting)
   - Reply to comments on your posts
   - Thank people for engagement
   
Timing:
- X: 3-5 posts/day, engage 10-20 tweets
- Threads: 2-5 posts/day
- Bluesky: 2-5 posts/day
- Facebook: 1-2 posts/day
- LinkedIn: 3-5 posts/week (manual only)

Rate Limits (per day):
- X: 2,400 actions total, 50/30min, 400 follows
- Facebook: ~100 likes, 50 comments, 20 follows
- Threads: Not clearly documented — be conservative
- Bluesky: Not clearly documented — be conservative
- Reddit: Karma-dependent, varies by sub
```

### Error Handling Checklist (Basic)

```
□ Check if user is logged in (redirect to login = not logged in)
□ Check if composer actually opened (element exists and is visible)
□ Check if Post button is enabled before clicking
□ Verify post appeared after clicking Post
□ Handle rate limits (X: 50 posts/30min, Reddit: varies)
□ Handle "pending approval" (Facebook Groups, Reddit)
□ Save content as draft if posting fails
□ Random delays between actions (1-5 seconds)
□ Don't do too many actions too fast (bot detection)
□ Mix actions: don't just like 50 posts in a row
```

> See [Section 15](#15-expanded-error-handling-checklist) for the full expanded checklist.

---

## 8. Account Status Detection

> How to detect if the account is healthy, restricted, or in trouble.

### 8.1 X (Twitter)

| Status | Detection Method |
|--------|-----------------|
| **Logged in** | `[data-testid="SideNav_NewTweet_Button"]` exists in DOM |
| **Not logged in** | URL redirects to `x.com/login` or `x.com/i/flow/login` |
| **Suspended** | Page shows "Your account is suspended" banner |
| **Restricted** | Toast/banner: "Your account has been limited" |
| **Rate limited** | Toast: "You are rate limited. Please wait..." |
| **Locked (verify)** | Redirect to `x.com/account/access` |
| **Premium status** | `[data-testid="verificationBadge"]` visible on profile |
| **Unverified** | No badge on profile, lower view limits apply |

```javascript
// X: Check login status
function isXLoggedIn() {
  return !!document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
}

// X: Check if account is restricted
function isXRestricted() {
  const banners = document.querySelectorAll('[role="alert"]');
  return [...banners].some(el =>
    el.textContent.includes('limited') ||
    el.textContent.includes('restricted') ||
    el.textContent.includes('suspended')
  );
}
```

### 8.2 Threads (Meta)

| Status | Detection Method |
|--------|-----------------|
| **Logged in** | Profile icon visible in sidebar; "Có gì mới?" / "Start a thread..." text present |
| **Not logged in** | Login modal appears or redirect to Instagram login |
| **Account blocked** | "Your account has been suspended" message |
| **Rate limited** | "Try again later" or similar toast |

```javascript
// Threads: Check login status
function isThreadsLoggedIn() {
  // If the compose area is visible, user is logged in
  return !!document.querySelector('[role="textbox"][data-lexical-editor="true"]')
    || document.body.textContent.includes('Có gì mới')
    || document.body.textContent.includes('Start a thread');
}
```

### 8.3 Bluesky

| Status | Detection Method |
|--------|-----------------|
| **Logged in** | Compose button exists: `button[data-testid="composerPublishBtn"]` (when composer open) or new post button in sidebar |
| **Not logged in** | Redirect to `bsky.app/` with "Sign in" button visible |
| **Moderation action** | Push notification or DM from moderation team |
| **Handle invalid** | "User not found" when visiting profile |

```javascript
// Bluesky: Check login status
function isBskyLoggedIn() {
  // Look for the compose button or profile link in sidebar
  const composeBtn = document.querySelector('[aria-label*="Soạn bài đăng"]')
    || document.querySelector('[aria-label*="New post"]');
  const profileLink = document.querySelector('[aria-label*="Hồ sơ"]')
    || document.querySelector('[aria-label*="Profile"]');
  return !!(composeBtn || profileLink);
}
```

### 8.4 Facebook

| Status | Detection Method |
|--------|-----------------|
| **Logged in** | "Bạn đang nghĩ gì?" / "What's on your mind?" area visible |
| **Not logged in** | Redirect to `facebook.com/login` |
| **Restricted** | Banner: "Your account has been restricted" |
| **Temporary block** | "You're Temporarily Blocked" modal |
| **Checkpoint** | Redirect to `facebook.com/checkpoint/` (identity verification) |
| **Jail** | Cannot post, like, or comment; banner message at top |

```javascript
// Facebook: Check login status
function isFBLoggedIn() {
  return !window.location.href.includes('/login')
    && !window.location.href.includes('/checkpoint');
}

// Facebook: Check if posting is blocked
function isFBPostingBlocked() {
  const body = document.body.textContent;
  return body.includes('Temporarily Blocked')
    || body.includes('restricted')
    || body.includes('Tạm thời bị chặn');
}
```

### 8.5 Reddit

| Status | Detection Method |
|--------|-----------------|
| **Logged in** | User menu icon in top-right; `document.cookie` contains `reddit_session` |
| **Not logged in** | Login modal appears when trying to post |
| **Shadowbanned** | Posts not visible when logged out (check via incognito) |
| **Subreddit banned** | "You've been banned from participating in r/{sub}" |
| **Rate limited** | "You are doing that too much. Try again in X minutes" |
| **Low karma** | "You don't have enough karma to post here" |
| **Post filtered** | "Sorry, this post was removed by Reddit's filters" |

```javascript
// Reddit: Check if post was filtered
function isRedditFiltered() {
  return document.body.textContent.includes('removed by Reddit')
    || document.body.textContent.includes('awaiting moderator approval');
}
```

---

## 9. Login Page Detection

> Detect redirects to login pages — the #1 sign that the session has expired.

### Per-Platform Login URLs

| Platform | Login Page Pattern | Detection |
|----------|-------------------|-----------|
| **X** | `x.com/login`, `x.com/i/flow/login` | `window.location.href.includes('/login')` |
| **Threads** | Redirects to `instagram.com/accounts/login/` | `window.location.href.includes('instagram.com/accounts/login')` |
| **Bluesky** | `bsky.app/` with "Sign in" visible | `document.body.textContent.includes('Sign in')` when on root URL |
| **Facebook** | `facebook.com/login`, `facebook.com/login.php` | `window.location.href.includes('/login')` |
| **LinkedIn** | `linkedin.com/login`, `linkedin.com/uas/login` | `window.location.href.includes('/login')` |
| **Reddit** | Login modal overlay or `reddit.com/login/` | `window.location.href.includes('/login')` |

```javascript
// Universal login detection
function isOnLoginPage(platform) {
  const url = window.location.href;
  const loginPatterns = {
    x: ['/login', '/i/flow/login'],
    threads: ['instagram.com/accounts/login'],
    bluesky: [], // Check for "Sign in" text instead
    facebook: ['/login', '/checkpoint'],
    linkedin: ['/login', '/uas/login'],
    reddit: ['/login', '/register'],
  };

  const patterns = loginPatterns[platform] || [];
  if (patterns.some(p => url.includes(p))) return true;

  // Bluesky special case: root URL + Sign in text
  if (platform === 'bluesky' && url === 'https://bsky.app/') {
    return document.body.textContent.includes('Sign in');
  }

  return false;
}
```

---

## 10. Post Success Verification & Toasts

> How to confirm a post was actually published successfully.

### 10.1 X (Twitter)

| Signal | Selector / Method |
|--------|-------------------|
| **Toast "Your post was sent"** | `[data-testid="toast"]` containing "sent" or "đã gửi" |
| **Toast with "View" button** | `[data-testid="toast"] a` (link to view the post) |
| **Post in timeline** | Your tweet appears at top of `[data-testid="tweet"]` list |
| **Composer closed** | `[data-testid="tweetTextarea_0"]` no longer visible |

```javascript
// X: Wait for success toast
function waitForXPostSuccess(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const toast = document.querySelector('[data-testid="toast"]');
      if (toast && (toast.textContent.includes('sent') || toast.textContent.includes('đã gửi'))) {
        clearInterval(interval);
        // Try to extract post URL from "View" link
        const viewLink = toast.querySelector('a');
        resolve({ success: true, url: viewLink?.href || null });
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject({ success: false, error: 'Timeout waiting for post confirmation' });
      }
    }, 500);
  });
}
```

### 10.2 Threads (Meta)

| Signal | Selector / Method |
|--------|-------------------|
| **Toast notification** | Floating toast at bottom with text "Đã đăng" / "Posted" |
| **"Xem" / "View" link** | Link inside toast → navigates to the post |
| **Composer closed** | Composer modal disappears from DOM |
| **Post on profile** | Navigate to profile → first post is the new one |

```javascript
// Threads: Detect success toast
function waitForThreadsPostSuccess(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const body = document.body.textContent;
      if (body.includes('Đã đăng') || body.includes('Posted') || body.includes('Xem') || body.includes('View')) {
        clearInterval(interval);
        resolve({ success: true });
      }
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject({ success: false, error: 'Timeout' });
      }
    }, 500);
  });
}
```

### 10.3 Bluesky

| Signal | Selector / Method |
|--------|-------------------|
| **Composer modal closes** | Compose modal disappears from DOM |
| **Post appears in feed** | New post shows at top of profile timeline |
| **URL changes** | If on profile page, new post element appears |

```javascript
// Bluesky: Verify by checking profile after posting
// Navigate to profile → check if first post matches content
function verifyBskyPost(expectedText) {
  const posts = document.querySelectorAll('[data-testid="postText"]');
  if (posts.length > 0) {
    return posts[0].textContent.includes(expectedText.substring(0, 50));
  }
  return false;
}
```

### 10.4 Facebook

| Signal | Selector / Method |
|--------|-------------------|
| **Composer modal closes** | Modal disappears |
| **Post in feed** | New `[role="article"]` appears at top of feed |
| **"Pending" badge** | In groups: "Pending admin approval" text |
| **Loading spinner** | Spinner visible = still posting |

### 10.5 Reddit

| Signal | Selector / Method |
|--------|-------------------|
| **URL redirect** | After submit, URL changes to `/comments/{post_id}/...` |
| **"Removed by filters"** | `document.body.textContent.includes('removed by Reddit')` |
| **Post visible** | Post title and body appear on the new page |
| **Pending approval** | "awaiting moderator approval" text |

```javascript
// Reddit: Check post success by URL change
function isRedditPostSuccess() {
  return window.location.href.includes('/comments/');
}

// Reddit: Check if post was auto-removed
function isRedditPostRemoved() {
  return document.body.textContent.includes('removed by Reddit')
    || document.body.textContent.includes("Sorry, this post was removed");
}
```

---

## 11. Post URL Extraction

> How to get the URL of a post you just published on each platform.

### 11.1 X (Twitter)

```javascript
// Method 1: From success toast "View" link
function getXPostUrl() {
  const toast = document.querySelector('[data-testid="toast"]');
  if (toast) {
    const viewLink = toast.querySelector('a[href*="/status/"]');
    if (viewLink) return 'https://x.com' + viewLink.getAttribute('href');
  }
  return null;
}

// Method 2: From profile page — first tweet's permalink
function getXLatestPostUrl() {
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  if (tweets.length > 0) {
    const link = tweets[0].querySelector('a[href*="/status/"]');
    if (link) return 'https://x.com' + link.getAttribute('href');
  }
  return null;
}

// URL format: https://x.com/{username}/status/{tweet_id}
```

### 11.2 Threads (Meta)

```javascript
// Method 1: From "Xem" / "View" link in success toast
function getThreadsPostUrl() {
  // After posting, a toast appears with "Xem" (View) link
  const links = document.querySelectorAll('a[href*="/post/"]');
  for (const link of links) {
    if (link.textContent.includes('Xem') || link.textContent.includes('View')) {
      return link.href;
    }
  }
  return null;
}

// Method 2: Navigate to profile → first post's link
function getThreadsLatestPostUrl() {
  // On profile page, posts have links like /post/{post_id}
  const postLinks = document.querySelectorAll('a[href*="/post/"]');
  if (postLinks.length > 0) return postLinks[0].href;
  return null;
}

// URL format: https://www.threads.net/@{username}/post/{post_id}
```

### 11.3 Bluesky

```javascript
// Method 1: From profile page — first post's timestamp link
function getBskyPostUrl() {
  // On profile, each post has a timestamp link to the permalink
  const timeLinks = document.querySelectorAll('a[href*="/post/"]');
  if (timeLinks.length > 0) return 'https://bsky.app' + timeLinks[0].getAttribute('href');
  return null;
}

// Method 2: From current URL if viewing the post
function getBskyCurrentPostUrl() {
  if (window.location.href.includes('/post/')) {
    return window.location.href;
  }
  return null;
}

// URL format: https://bsky.app/profile/{handle}/post/{rkey}
```

### 11.4 Facebook

```javascript
// Method 1: From post's dropdown menu or timestamp link
function getFBPostUrl() {
  // Post timestamps are usually links to the permanent URL
  // Format: https://www.facebook.com/{user_id}/posts/{post_id}
  // Or: https://www.facebook.com/permalink.php?story_fbid={id}&id={user_id}
  const articles = document.querySelectorAll('[role="article"]');
  if (articles.length > 0) {
    const timeLink = articles[0].querySelector('a[href*="/posts/"]')
      || articles[0].querySelector('a[href*="permalink"]');
    if (timeLink) return timeLink.href;
  }
  return null;
}

// URL format: https://www.facebook.com/{username}/posts/{post_id}
```

### 11.5 Reddit

```javascript
// Method: URL changes automatically after successful submission
function getRedditPostUrl() {
  // After posting, Reddit redirects to the post page
  if (window.location.href.includes('/comments/')) {
    return window.location.href;
  }
  return null;
}

// URL format: https://www.reddit.com/r/{subreddit}/comments/{post_id}/{slug}/
```

### 11.6 Summary Table

| Platform | URL Format | Extraction Method |
|----------|-----------|-------------------|
| **X** | `x.com/{user}/status/{id}` | Toast "View" link or profile first tweet |
| **Threads** | `threads.net/@{user}/post/{id}` | Toast "Xem" link or profile first post |
| **Bluesky** | `bsky.app/profile/{handle}/post/{rkey}` | Profile first post timestamp link |
| **Facebook** | `facebook.com/{user}/posts/{id}` | Post timestamp link inside `[role="article"]` |
| **Reddit** | `reddit.com/r/{sub}/comments/{id}/{slug}/` | URL redirect after submission |

---

## 12. Error State Detection

> Selectors and patterns for detecting errors during automation.

### 12.1 Rate Limit Errors

| Platform | Error Signal | Detection |
|----------|-------------|-----------|
| **X** | "Rate limit exceeded" toast | `[data-testid="toast"]` with "rate limit" text |
| **X** | HTTP 429 Too Many Requests | Network error (not in DOM) |
| **X** | "You are rate limited" | Blue banner at top of page |
| **Threads** | "Try again later" | Toast or inline error text |
| **Facebook** | "You're Temporarily Blocked" | Modal overlay with blocking message |
| **Facebook** | "Action Blocked" | `[role="dialog"]` with "blocked" text |
| **Reddit** | "You are doing that too much" | Red error text below submit button |
| **Reddit** | "Try again in X minutes" | Inline error message |

```javascript
// Universal rate limit detection
function isRateLimited() {
  const body = document.body.textContent.toLowerCase();
  const rateLimitPhrases = [
    'rate limit',
    'too many requests',
    'try again later',
    'try again in',
    'temporarily blocked',
    'action blocked',
    'doing that too much',
    'slow down',
    'bị giới hạn',
    'thử lại sau',
  ];
  return rateLimitPhrases.some(phrase => body.includes(phrase));
}
```

### 12.2 "Something Went Wrong" Errors

| Platform | Selector / Pattern |
|----------|-------------------|
| **X** | `[data-testid="error-detail"]` or page with "Something went wrong" |
| **Threads** | Modal with error text |
| **Bluesky** | Red error text in composer or feed |
| **Facebook** | `[role="alert"]` with error message |
| **Reddit** | Red error banner or `[role="alert"]` |

```javascript
// Universal error detection
function hasGenericError() {
  const body = document.body.textContent.toLowerCase();
  const errorPhrases = [
    'something went wrong',
    'an error occurred',
    'please try again',
    'could not complete',
    'failed to post',
    'unable to',
    'đã xảy ra lỗi',
    'vui lòng thử lại',
  ];
  return errorPhrases.some(phrase => body.includes(phrase));
}
```

### 12.3 CAPTCHA / Bot Detection

| Platform | Detection | What You See |
|----------|-----------|-------------|
| **X** | Arkose Labs challenge | `iframe[src*="arkoselabs"]` or `iframe[src*="funcaptcha"]` |
| **Facebook** | Checkpoint | Redirect to `facebook.com/checkpoint/` |
| **Reddit** | reCAPTCHA | `iframe[src*="recaptcha"]` or `div.g-recaptcha` |
| **LinkedIn** | Cloudflare / CAPTCHA | `div#challenge-form` or Cloudflare interstitial |
| **Product Hunt** | Cloudflare | `div#challenge-running` or `cf-browser-verification` |
| **Bluesky** | None currently | No known CAPTCHA as of 2026 |

```javascript
// Universal CAPTCHA detection
function hasCaptcha() {
  return !!(
    document.querySelector('iframe[src*="recaptcha"]') ||
    document.querySelector('iframe[src*="arkoselabs"]') ||
    document.querySelector('iframe[src*="funcaptcha"]') ||
    document.querySelector('iframe[src*="hcaptcha"]') ||
    document.querySelector('div.g-recaptcha') ||
    document.querySelector('div#challenge-form') ||
    document.querySelector('div#challenge-running') ||
    document.querySelector('[id*="captcha"]')
  );
}
```

### 12.4 Network / Loading Errors

```javascript
// Check if page is still loading or stuck
function isPageLoading() {
  return document.readyState !== 'complete';
}

// Check for network error pages
function hasNetworkError() {
  const title = document.title.toLowerCase();
  return title.includes('not found') ||
    title.includes('error') ||
    title.includes('timed out') ||
    title.includes('offline');
}

// Check for spinners (indicates loading, not error yet)
function hasSpinner() {
  return !!(
    document.querySelector('[role="progressbar"]') ||
    document.querySelector('[aria-label="Loading"]') ||
    document.querySelector('[aria-label*="loading"]')
  );
}
```

### 12.5 Content Policy / Community Rule Violations

| Platform | Signal | Detection |
|----------|--------|-----------|
| **X** | "This Tweet violated the Twitter Rules" | Text in banner or overlay |
| **Threads** | "Post removed for violating guidelines" | Modal or banner |
| **Facebook** | "Your post goes against our Community Standards" | `[role="dialog"]` with "community" text |
| **Reddit** | "Post removed by moderators" / "Post removed by Reddit's filters" | Text on post page |
| **Reddit** | "Your submission has been automatically removed" | AutoModerator comment |

---

## 13. Delete / Edit Post

> How to delete or edit a post if rollback is needed.

### 13.1 X (Twitter)

```
Delete:
1. Find your tweet in the timeline
2. Click the "..." menu: [data-testid="caret"] on the tweet
3. Click "Delete": [data-testid="Dropdown"] → menuitem with "Delete" text
4. Confirm: [data-testid="confirmationSheetConfirm"]

Edit (Premium only):
1. Click "..." menu on your tweet
2. Click "Edit": menuitem with "Edit" text
3. Edit in the composer that opens
4. Click "Update"

Selectors:
- Tweet menu: [data-testid="caret"]
- Delete option: [role="menuitem"] → text "Delete" / "Xóa"
- Confirm delete: [data-testid="confirmationSheetConfirm"]
```

### 13.2 Threads (Meta)

```
Delete:
1. Click "..." menu on your post: [aria-label*="Khác"] / [aria-label*="More"]
2. Click "Xóa" / "Delete" from the dropdown
3. Confirm in the dialog: [role="button"] → text "Xóa" / "Delete"

Edit:
- Threads does NOT support editing posts (as of 2026)
- Delete and repost is the only option

Selectors:
- Post menu: [aria-label*="Khác"] or [aria-label*="More options"]
- Delete option: [role="button"] or [role="menuitem"] → text "Xóa" / "Delete"
```

### 13.3 Bluesky

```
Delete:
1. Click "..." on your post: [aria-label*="Mở bảng tùy chọn"] / [aria-label*="options"]
2. Click "Delete post" / "Xóa bài đăng"
3. Confirm deletion

Edit:
- Bluesky does NOT support editing posts
- Delete and repost only

Selectors:
- Post options: [aria-label*="Mở bảng tùy chọn"] or three-dot icon button
- Delete option: [role="menuitem"] or button → text "Delete" / "Xóa"
```

### 13.4 Facebook

```
Delete:
1. Click "..." on post: [aria-label="Actions for this post"] / [aria-label*="Thao tác"]
2. Click "Move to trash" / "Chuyển vào thùng rác"
3. Confirm in dialog

Edit:
1. Click "..." on post
2. Click "Edit post" / "Chỉnh sửa bài viết"
3. Composer reopens with existing content
4. Edit and click "Save" / "Lưu"

Selectors:
- Post menu: [aria-label*="Actions"] or [aria-label*="Thao tác"]
- Edit option: [role="menuitem"] → text "Edit post" / "Chỉnh sửa bài viết"
- Delete option: [role="menuitem"] → text "Move to trash" / "Chuyển vào thùng rác"
```

### 13.5 Reddit

```
Delete:
1. Click "..." on your post
2. Click "Delete" / "Xóa"
3. Confirm deletion

Edit:
1. Click "..." on your post (text posts only)
2. Click "Edit" / "Chỉnh sửa"
3. Edit body text (title cannot be edited)
4. Save changes

Note: Reddit titles CANNOT be edited after posting. Only body text can be changed.
```

---

## 14. Profile Navigation

> How to navigate to your own profile on each platform.

### 14.1 Profile URLs

| Platform | Profile URL | Navigate Via |
|----------|------------|-------------|
| **X** | `x.com/{username}` | Click avatar or `[data-testid="AppTabBar_Profile_Link"]` |
| **Threads** | `threads.net/@{username}` | Click profile icon in sidebar |
| **Bluesky** | `bsky.app/profile/{handle}` | Click `[aria-label*="Hồ sơ"]` / `[aria-label*="Profile"]` in sidebar |
| **Facebook** | `facebook.com/{username}` or `facebook.com/profile.php?id={id}` | Click profile photo or name in sidebar |
| **Reddit** | `reddit.com/user/{username}` | Click avatar → "Profile" in dropdown |

### 14.2 Profile Navigation Selectors

```javascript
// X: Navigate to profile
const xProfileLink = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
// Or: directly navigate to https://x.com/{username}

// Threads: Navigate to profile
const thProfileLink = document.querySelector('[aria-label*="Trang cá nhân"]')
  || document.querySelector('[aria-label*="Profile"]');

// Bluesky: Navigate to profile
const bskyProfileLink = document.querySelector('[aria-label*="Hồ sơ"]')
  || document.querySelector('[aria-label*="Profile"]');

// Facebook: Navigate to profile
const fbProfileLink = document.querySelector('[aria-label*="trang cá nhân"]')
  || document.querySelector('[aria-label*="Your profile"]');
```

### 14.3 Verify Post on Profile

```javascript
// After posting, navigate to profile and verify the first post matches
async function verifyPostOnProfile(platform, expectedText) {
  // 1. Navigate to profile (use platform-specific URL)
  // 2. Wait for posts to load
  // 3. Check first post content

  const firstPostSelectors = {
    x: '[data-testid="tweet"]:first-of-type [data-testid="tweetText"]',
    threads: '[data-pressable-container]:first-of-type',
    bluesky: '[data-testid="postText"]:first-of-type',
    facebook: '[role="article"]:first-of-type',
  };

  const selector = firstPostSelectors[platform];
  if (!selector) return false;

  const post = document.querySelector(selector);
  if (!post) return false;

  return post.textContent.includes(expectedText.substring(0, 30));
}
```

---

## 15. Expanded Error Handling Checklist

> Complete pre-flight, in-flight, and post-flight checks for reliable automation.

### Pre-Flight (Before Posting)

```
□ Check if browser page has finished loading (document.readyState === 'complete')
□ Check if user is logged in (not on login page)
□ Check for CAPTCHA / Cloudflare challenge
□ Check if account is restricted / suspended / rate-limited
□ Check if the target subreddit/group allows posting (Reddit: karma, age)
□ Verify the composer can be opened (button exists and is clickable)
□ Verify the content fits platform character limit:
    - X: 280 (free) / 25,000 (Premium)
    - Threads: 500
    - Bluesky: 300
    - Facebook: 63,206
    - Reddit: 40,000 (body)
    - LinkedIn: 3,000
□ Ensure content is ASCII-safe (no emoji, no Unicode diacritics)
□ Save content as draft BEFORE attempting to post (backup)
```

### In-Flight (During Posting)

```
□ Verify composer opened (textbox element visible and editable)
□ Verify text was typed correctly (compare textbox.textContent with expected)
□ Check Post button is enabled (not disabled / aria-disabled)
□ Add random delays between actions (1-5 seconds)
□ Type in small chunks (50-100 chars for X, 100-200 chars for others)
□ Watch for error modals / toasts appearing during typing
□ Watch for CAPTCHA challenges appearing mid-flow
□ If media upload required: verify file picker interaction
□ For threads: verify each additional textbox appeared after clicking "+"
```

### Post-Flight (After Posting)

```
□ Wait for success signal:
    - X: Toast "Your post was sent" / "Đã gửi bài viết của bạn"
    - Threads: Toast "Đã đăng" / "Posted"
    - Bluesky: Composer modal closes
    - Facebook: Composer modal closes, post appears in feed
    - Reddit: URL changes to /comments/{id}/
□ Extract post URL (see Section 11)
□ Verify post is not removed / filtered:
    - Reddit: Check for "removed by Reddit's filters"
    - Facebook Groups: Check for "pending approval"
□ For link-in-reply strategy:
    - Navigate to your post
    - Click reply
    - Type the link
    - Post the reply
    - Verify reply appeared
□ Check for rate limit warnings after posting
□ Log the result: platform, status, URL, timestamp
□ If failed: save content as draft for retry
```

### Recovery Flow

```
If posting fails:
1. Take screenshot of the error state
2. Save content to posts/drafts/{platform}_post.md
3. Log the error: { platform, error_type, timestamp, content_saved: true }
4. Try the next platform (don't retry immediately)
5. Report to user with error details

If rate limited:
1. Stop all actions on that platform
2. Wait the specified time (X: 15min, Reddit: X minutes shown)
3. Don't switch to a different action on same platform
4. Continue with other platforms
5. Retry the failed platform last

If CAPTCHA detected:
1. STOP automation immediately
2. Notify user to solve CAPTCHA manually
3. Save content as draft
4. Do NOT attempt to solve CAPTCHAs programmatically

If account restricted:
1. STOP all automation on that platform
2. Notify user immediately
3. Do NOT attempt any further actions
4. This may require manual intervention (appeal, verification)
```

### Logging Template

```javascript
// Standard log entry for each posting attempt
const postLog = {
  platform: 'x',               // x, threads, bluesky, facebook, reddit
  timestamp: new Date().toISOString(),
  action: 'post',              // post, reply, like, comment
  status: 'success',           // success, failed, filtered, rate_limited
  postUrl: 'https://...',      // extracted post URL or null
  error: null,                 // error message if failed
  contentDraft: 'posts/drafts/x_post.md',  // backup file path
  retryable: true,             // whether this can be retried
};
```

