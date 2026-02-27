# Official API Reference — Free Platforms Only

> **Scope**: Only platforms with **completely free, no-approval-needed** APIs.  
> **Last updated**: 2026-02-27  
> **Companion docs**: [DOM_SELECTORS.md](./DOM_SELECTORS.md) · [INTERNAL_API_REFERENCE.md](./INTERNAL_API_REFERENCE.md)

---

## Platforms Covered

| Platform | API | Cost | Registration | Auth |
|----------|-----|------|-------------|------|
| **Bluesky** | AT Protocol | 🆓 Free | None — just App Password | App Password → session token |
| **Reddit** | Reddit API v1 | 🆓 Free (non-commercial, 100 QPM) | Register "script" app (auto-approved) | OAuth2 |

### Excluded (and why)

| Platform | Why Excluded |
|----------|-------------|
| X (Twitter) | Free tier: write-only, 1500 posts/mo. Basic: **$100/month** |
| Threads | API requires **Meta Business verification** + Instagram Business/Creator account |
| Facebook | Graph API only for **Pages** (not personal profiles), requires app review |
| LinkedIn | Requires **Company Page** + approved app with Marketing API access |

---

## 1. Bluesky — AT Protocol

**Base URL**: `https://bsky.social/xrpc/`  
**Docs**: https://docs.bsky.app/ · https://atproto.com/  
**Protocol**: AT Protocol (open, federated, fully documented)

### 1.1 Authentication

#### Step 1: Create App Password

1. Go to **Settings → Privacy and Security → App Passwords** in Bluesky app
2. Click **"Add App Password"**
3. Name it (e.g., "social-posting-bot")
4. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)

#### Step 2: Create Session

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.server.createSession \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-handle.bsky.social",
    "password": "xxxx-xxxx-xxxx-xxxx"
  }'
```

**Response:**
```json
{
  "did": "did:plc:abc123...",
  "handle": "your-handle.bsky.social",
  "accessJwt": "eyJhbGc...",
  "refreshJwt": "eyJhbGc..."
}
```

Save `accessJwt` — use as `Authorization: Bearer {accessJwt}` on all requests.  
Save `refreshJwt` — use to refresh when `accessJwt` expires (2 hours).

#### Refresh Token

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.server.refreshSession \
  -H "Authorization: Bearer {refreshJwt}"
```

### 1.2 Create Post

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Hello from the AT Protocol API! 🚀",
      "createdAt": "2026-02-27T14:00:00.000Z",
      "langs": ["en"]
    }
  }'
```

**Response:**
```json
{
  "uri": "at://did:plc:abc123.../app.bsky.feed.post/3abc...",
  "cid": "bafyrei..."
}
```

**Get post URL**: Convert `uri` to web URL:
```
at://did:plc:abc123/app.bsky.feed.post/3abc...
→ https://bsky.app/profile/your-handle.bsky.social/post/3abc...
```

### 1.3 Post with Mentions & Links (Facets)

Facets annotate byte ranges in text to create clickable mentions and links:

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Check out this project: github.com/tang-vu/social-posting-skills",
      "createdAt": "2026-02-27T14:00:00.000Z",
      "facets": [
        {
          "index": { "byteStart": 27, "byteEnd": 66 },
          "features": [{
            "$type": "app.bsky.richtext.facet#link",
            "uri": "https://github.com/tang-vu/social-posting-skills"
          }]
        }
      ]
    }
  }'
```

> ⚠️ **Important**: `byteStart`/`byteEnd` are **byte positions**, not character positions. UTF-8 emoji and special characters take multiple bytes.

### 1.4 Post with Image

#### Step 1: Upload image blob

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.uploadBlob \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: image/png" \
  --data-binary @image.png
```

**Response:**
```json
{
  "blob": {
    "$type": "blob",
    "ref": { "$link": "bafkrei..." },
    "mimeType": "image/png",
    "size": 12345
  }
}
```

#### Step 2: Create post with image embed

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Check out this screenshot!",
      "createdAt": "2026-02-27T14:00:00.000Z",
      "embed": {
        "$type": "app.bsky.embed.images",
        "images": [{
          "alt": "Screenshot of the project",
          "image": {
            "$type": "blob",
            "ref": { "$link": "bafkrei..." },
            "mimeType": "image/png",
            "size": 12345
          }
        }]
      }
    }
  }'
```

> Max 4 images per post. Max 1MB per image (will be compressed).

### 1.5 Reply to a Post

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.post",
    "record": {
      "$type": "app.bsky.feed.post",
      "text": "Great post! Here is a reply.",
      "createdAt": "2026-02-27T14:00:00.000Z",
      "reply": {
        "root": {
          "uri": "at://did:plc:xyz.../app.bsky.feed.post/original...",
          "cid": "bafyrei..."
        },
        "parent": {
          "uri": "at://did:plc:xyz.../app.bsky.feed.post/original...",
          "cid": "bafyrei..."
        }
      }
    }
  }'
```

### 1.6 Like a Post

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.like",
    "record": {
      "$type": "app.bsky.feed.like",
      "subject": {
        "uri": "at://did:plc:xyz.../app.bsky.feed.post/target...",
        "cid": "bafyrei..."
      },
      "createdAt": "2026-02-27T14:00:00.000Z"
    }
  }'
```

### 1.7 Repost

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.createRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.repost",
    "record": {
      "$type": "app.bsky.feed.repost",
      "subject": {
        "uri": "at://did:plc:xyz.../app.bsky.feed.post/target...",
        "cid": "bafyrei..."
      },
      "createdAt": "2026-02-27T14:00:00.000Z"
    }
  }'
```

### 1.8 Delete Post

```bash
curl -X POST https://bsky.social/xrpc/com.atproto.repo.deleteRecord \
  -H "Authorization: Bearer {accessJwt}" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "did:plc:abc123...",
    "collection": "app.bsky.feed.post",
    "rkey": "3abc..."
  }'
```

> `rkey` is the last segment of the post URI: `at://did.../app.bsky.feed.post/{rkey}`

### 1.9 Get Profile

```bash
curl "https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=your-handle.bsky.social" \
  -H "Authorization: Bearer {accessJwt}"
```

### 1.10 Get Author Feed (Your Posts)

```bash
curl "https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=your-handle.bsky.social&limit=10" \
  -H "Authorization: Bearer {accessJwt}"
```

### 1.11 Rate Limits

| Resource | Limit |
|----------|-------|
| Session create | 30/5min per account |
| Post create | 1666/day (~1 per minute) |
| Like | 3000/day |
| Image upload | 1000/day |
| API calls (general) | 3000/5min |

### 1.12 JavaScript Example (Node.js)

```javascript
// npm install @atproto/api
import { BskyAgent } from '@atproto/api';

const agent = new BskyAgent({ service: 'https://bsky.social' });

// Login
await agent.login({
  identifier: 'your-handle.bsky.social',
  password: 'xxxx-xxxx-xxxx-xxxx', // App Password
});

// Post
const { uri } = await agent.post({
  text: 'Hello from Node.js! 🚀',
  langs: ['en'],
});
console.log('Post URL:', uri);

// Like
await agent.like(targetPostUri, targetPostCid);

// Repost
await agent.repost(targetPostUri, targetPostCid);

// Delete
await agent.deletePost(uri);

// Reply
await agent.post({
  text: 'This is a reply!',
  reply: {
    root: { uri: rootUri, cid: rootCid },
    parent: { uri: parentUri, cid: parentCid },
  },
});
```

### 1.13 Python Example

```python
# pip install atproto
from atproto import Client

client = Client()
client.login('your-handle.bsky.social', 'xxxx-xxxx-xxxx-xxxx')

# Post
post = client.send_post('Hello from Python! 🐍')
print(f'Post URI: {post.uri}')

# Like
client.like(uri=target_uri, cid=target_cid)

# Repost
client.repost(uri=target_uri, cid=target_cid)

# Delete
client.delete_post(post.uri)

# Reply
client.send_post(
    'This is a reply!',
    reply_to=atproto.models.AppBskyFeedPost.ReplyRef(
        root=atproto.models.create_strong_ref(root_post),
        parent=atproto.models.create_strong_ref(parent_post),
    )
)
```

---

## 2. Reddit API

**Base URL**: `https://oauth.reddit.com/`  
**Docs**: https://www.reddit.com/dev/api/  
**Rate**: 100 requests/minute (non-commercial free tier)

### 2.1 Registration (One-Time Setup)

1. Go to https://www.reddit.com/prefs/apps
2. Click **"are you a developer? create an app..."**
3. Fill in:
   - **Name**: `social-posting-bot`
   - **Type**: `script` (for personal use — auto-approved)
   - **Redirect URI**: `http://localhost:8080` (not used for script apps)
4. Click **Create app**
5. Save:
   - **Client ID**: shown under the app name (short string)
   - **Client Secret**: shown as "secret"

> ✅ "Script" apps are auto-approved instantly. No review process.

### 2.2 Authentication (OAuth2 Password Grant)

```bash
curl -X POST https://www.reddit.com/api/v1/access_token \
  -u "{client_id}:{client_secret}" \
  -d "grant_type=password&username={reddit_username}&password={reddit_password}" \
  -A "social-posting-bot/1.0 by {reddit_username}"
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 86400,
  "scope": "*"
}
```

> ⚠️ **2FA**: If you have 2FA enabled, append your TOTP code to your password: `password:123456`

### 2.3 Create Post (Text)

```bash
curl -X POST https://oauth.reddit.com/api/submit \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}" \
  -d "sr=SideProject&kind=self&title=My Project Title&text=Post body here with **markdown** support"
```

**Response:**
```json
{
  "json": {
    "errors": [],
    "data": {
      "url": "https://www.reddit.com/r/SideProject/comments/abc123/my_project_title/",
      "id": "abc123",
      "name": "t3_abc123"
    }
  }
}
```

### 2.4 Create Post (Link)

```bash
curl -X POST https://oauth.reddit.com/api/submit \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}" \
  -d "sr=SideProject&kind=link&title=Check out this project&url=https://github.com/tang-vu/social-posting-skills"
```

### 2.5 Comment / Reply

```bash
curl -X POST https://oauth.reddit.com/api/comment \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}" \
  -d "thing_id=t3_abc123&text=Great post! Here is my reply."
```

> `thing_id`: `t3_` prefix = post, `t1_` prefix = comment

### 2.6 Vote (Upvote/Downvote)

```bash
# Upvote
curl -X POST https://oauth.reddit.com/api/vote \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}" \
  -d "id=t3_abc123&dir=1"

# Downvote: dir=-1, Remove vote: dir=0
```

### 2.7 Delete Post/Comment

```bash
curl -X POST https://oauth.reddit.com/api/del \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}" \
  -d "id=t3_abc123"
```

### 2.8 Edit Post/Comment

```bash
curl -X POST https://oauth.reddit.com/api/editusertext \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}" \
  -d "thing_id=t3_abc123&text=Updated post body"
```

> Reddit post **titles** cannot be edited. Only body text.

### 2.9 Get User Profile

```bash
curl https://oauth.reddit.com/api/v1/me \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}"
```

### 2.10 Get User Posts

```bash
curl "https://oauth.reddit.com/user/{username}/submitted?limit=10" \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}"
```

### 2.11 Check Subreddit Rules

```bash
curl "https://oauth.reddit.com/r/{subreddit}/about/rules" \
  -H "Authorization: Bearer {access_token}" \
  -A "social-posting-bot/1.0 by {reddit_username}"
```

### 2.12 Rate Limits

| Resource | Limit |
|----------|-------|
| API calls | 100/minute (free tier) |
| Post frequency | Varies by karma + account age |
| Comments | ~1/10 seconds for new accounts |
| Token expiry | 24 hours |

Response headers contain rate limit info:
```
X-Ratelimit-Used: 5
X-Ratelimit-Remaining: 95
X-Ratelimit-Reset: 45
```

### 2.13 Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 403 | Forbidden (banned/no permission) |
| 429 | Rate limited |
| 503 | Reddit servers overloaded |

Check `json.errors` in response for:
- `RATELIMIT` — "you are doing that too much"
- `SUBREDDIT_NOTALLOWED` — not allowed to post there
- `NO_THING_ID` — invalid target
- `TOO_OLD` — can't reply to archived posts

### 2.14 JavaScript Example (snoowrap)

```javascript
// npm install snoowrap
const Snoowrap = require('snoowrap');

const reddit = new Snoowrap({
  userAgent: 'social-posting-bot/1.0 by your_username',
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  username: 'your_username',
  password: 'your_password',
});

// Post
const submission = await reddit.getSubreddit('SideProject').submitSelfpost({
  title: 'My Project Title',
  text: 'Post body with **markdown**',
});
console.log('Post URL:', submission.url);

// Comment
await reddit.getSubmission('abc123').reply('Great post!');

// Upvote
await reddit.getSubmission('abc123').upvote();

// Delete
await reddit.getSubmission('abc123').delete();

// Edit
await reddit.getSubmission('abc123').edit('Updated body');
```

### 2.15 Python Example (PRAW)

```python
# pip install praw
import praw

reddit = praw.Reddit(
    client_id='your_client_id',
    client_secret='your_client_secret',
    user_agent='social-posting-bot/1.0 by your_username',
    username='your_username',
    password='your_password',
)

# Post
submission = reddit.subreddit('SideProject').submit(
    title='My Project Title',
    selftext='Post body with **markdown**',
)
print(f'Post URL: {submission.url}')

# Comment
submission.reply('Great post!')

# Upvote
submission.upvote()

# Delete
submission.delete()

# Edit
submission.edit('Updated body')
```

---

## 3. Quick Comparison

| Feature | Bluesky API | Reddit API | DOM Automation |
|---------|------------|-----------|----------------|
| **Speed** | ~200ms | ~500ms | 5-15 seconds |
| **Auth** | App Password | OAuth2 script | Browser cookies |
| **Rate limit** | 3000/5min | 100/min | Unknown (behavior-based) |
| **Post** | ✅ | ✅ | ✅ |
| **Reply** | ✅ | ✅ | ✅ |
| **Like** | ✅ | ✅ (vote) | ✅ |
| **Delete** | ✅ | ✅ | ✅ |
| **Edit** | ❌ (not supported) | ✅ (body only) | ✅ |
| **Image** | ✅ (upload blob) | ⚠️ (link post only) | ✅ |
| **Thread** | ✅ (chain replies) | ❌ | ✅ |
| **Get post URL** | ✅ (from response) | ✅ (from response) | ⚠️ (scrape DOM) |
| **Stability** | ✅ High | ✅ High | ❌ Low (DOM changes) |
| **Ban risk** | ✅ Low | ⚠️ Medium (spam filters) | ⚠️ Medium |

### When to Use What

| Scenario | Recommendation |
|----------|---------------|
| **Bluesky posting** | ✅ Always use API — fast, free, stable |
| **Reddit posting** | ✅ Always use API — free, documented |
| **X/Twitter** | 🖥️ DOM or Internal API (official costs $100/mo) |
| **Threads** | 🖥️ DOM or Internal API (no free API for personal accounts) |
| **Facebook** | 🖥️ DOM or Internal API (API only for Pages) |
| **Multi-platform tool** | Hybrid: API for Bluesky/Reddit + DOM for rest |
