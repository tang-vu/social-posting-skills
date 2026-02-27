# Internal API Reference — Reverse-Engineered Endpoints

> **Method**: Captured via browser network interception (fetch/XHR monkey-patching)  
> **Last captured**: 2026-02-27  
> **Status**: ⚠️ Endpoints may change without notice. Hashes rotate on deploy.  
> **Companion docs**: [DOM_SELECTORS.md](./DOM_SELECTORS.md) · [OFFICIAL_API_REFERENCE.md](./OFFICIAL_API_REFERENCE.md)

---

## How These Were Captured

```javascript
// Inject this in browser console BEFORE performing actions:
window.__capturedRequests = [];

// Patch fetch()
const origFetch = window.fetch;
window.fetch = function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
  const method = args[1]?.method || 'GET';
  const body = args[1]?.body || null;
  const headers = args[1]?.headers || {};

  window.__capturedRequests.push({
    type: 'fetch', url, method,
    headers: headers instanceof Headers
      ? Object.fromEntries(headers.entries()) : headers,
    body: typeof body === 'string' ? body.substring(0, 2000) : null,
    timestamp: new Date().toISOString()
  });

  return origFetch.apply(this, args).then(r => {
    window.__capturedRequests.at(-1).status = r.status;
    return r;
  });
};

// Patch XMLHttpRequest
const origOpen = XMLHttpRequest.prototype.open;
const origSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function(method, url) {
  this._m = method; this._u = url;
  return origOpen.apply(this, arguments);
};
XMLHttpRequest.prototype.send = function(body) {
  window.__capturedRequests.push({
    type: 'xhr', url: this._u, method: this._m,
    body: typeof body === 'string' ? body.substring(0, 2000) : null,
    timestamp: new Date().toISOString()
  });
  return origSend.apply(this, arguments);
};

// Read captured requests:
// JSON.stringify(window.__capturedRequests.filter(r =>
//   r.url.includes('graphql') || r.url.includes('/api/')
// ), null, 2)
```

---

## 1. X (Twitter) — Internal GraphQL API

**Captured live**: Posted tweet, liked it, reposted it.

### 1.1 Authentication

| Token | Source | Header Name |
|-------|--------|-------------|
| **Bearer token** | Static, embedded in JS bundle | `authorization` |
| **CSRF token** | Cookie `ct0` | `x-csrf-token` |
| **Transaction ID** | Client-generated (base64) | `x-client-transaction-id` |
| **Auth cookie** | `auth_token` (HttpOnly) | Sent via cookie header |
| **User ID** | Cookie `twid` | `x-twitter-active-user` |

```javascript
// Extract tokens from browser:
const csrfToken = document.cookie.match(/ct0=([^;]+)/)?.[1];
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
// ^ This bearer is public/static — same for all users
```

### 1.2 Create Tweet

```bash
curl -X POST 'https://x.com/i/api/graphql/cVt4ppREOseu3zvc2jP2VA/CreateTweet' \
  -H 'authorization: Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA' \
  -H 'x-csrf-token: {ct0_cookie_value}' \
  -H 'content-type: application/json' \
  -H 'cookie: auth_token={auth_token}; ct0={ct0}; twid={twid}' \
  -d '{
    "variables": {
      "tweet_text": "Hello from internal API!",
      "dark_request": false,
      "media": {
        "media_entities": [],
        "possibly_sensitive": false
      },
      "semantic_annotation_ids": []
    },
    "features": {
      "communities_web_enable_tweet_community_results_fetch": true,
      "c9s_tweet_anatomy_moderator_badge_enabled": true,
      "responsive_web_edit_tweet_api_enabled": true,
      "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
      "view_counts_everywhere_api_enabled": true,
      "longform_notetweets_consumption_enabled": true,
      "responsive_web_twitter_article_tweet_consumption_enabled": true,
      "tweet_awards_web_tipping_enabled": false,
      "creator_subscriptions_quote_tweet_preview_enabled": false,
      "longform_notetweets_rich_text_read_enabled": true,
      "longform_notetweets_inline_media_enabled": true,
      "articles_preview_enabled": true,
      "rweb_video_timestamps_enabled": true,
      "rweb_tipjar_consumption_enabled": true,
      "responsive_web_graphql_exclude_directive_enabled": true,
      "verified_phone_label_enabled": false,
      "freedom_of_speech_not_reach_fetch_enabled": true,
      "standardized_nudges_misinfo": true,
      "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
      "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
      "responsive_web_graphql_timeline_navigation_enabled": true,
      "responsive_web_enhance_cards_enabled": false
    },
    "queryId": "cVt4ppREOseu3zvc2jP2VA"
  }'
```

> ⚠️ **Query hash** (`cVt4ppREOseu3zvc2jP2VA`) changes on every X deployment. To get latest: search the JS bundles for `"CreateTweet"`.

### 1.3 Like (Favorite) Tweet

```bash
curl -X POST 'https://x.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet' \
  -H 'authorization: Bearer {bearer}' \
  -H 'x-csrf-token: {ct0}' \
  -H 'content-type: application/json' \
  -H 'cookie: auth_token={auth_token}; ct0={ct0}' \
  -d '{
    "variables": { "tweet_id": "2027397464895209792" },
    "queryId": "lI07N6Otwv1PhnEgXILM7A"
  }'
```

### 1.4 Retweet (Repost)

```bash
curl -X POST 'https://x.com/i/api/graphql/mbRO74GrOvSfRcJnlMapnQ/CreateRetweet' \
  -H 'authorization: Bearer {bearer}' \
  -H 'x-csrf-token: {ct0}' \
  -H 'content-type: application/json' \
  -H 'cookie: auth_token={auth_token}; ct0={ct0}' \
  -d '{
    "variables": { "tweet_id": "2027397464895209792" },
    "queryId": "mbRO74GrOvSfRcJnlMapnQ"
  }'
```

### 1.5 Unlike / Unretweet

```bash
# Unlike
curl -X POST 'https://x.com/i/api/graphql/{hash}/UnfavoriteTweet' \
  -H 'authorization: Bearer {bearer}' \
  -H 'x-csrf-token: {ct0}' \
  -H 'content-type: application/json' \
  -d '{"variables":{"tweet_id":"{id}"},"queryId":"{hash}"}'

# Unretweet
curl -X POST 'https://x.com/i/api/graphql/{hash}/DeleteRetweet' \
  # same pattern as above
```

### 1.6 Delete Tweet

```bash
curl -X POST 'https://x.com/i/api/graphql/{hash}/DeleteTweet' \
  -H 'authorization: Bearer {bearer}' \
  -H 'x-csrf-token: {ct0}' \
  -H 'content-type: application/json' \
  -d '{"variables":{"tweet_id":"{id}"},"queryId":"{hash}"}'
```

### 1.7 Reply to Tweet

Same as CreateTweet but add `reply` field:
```json
{
  "variables": {
    "tweet_text": "This is a reply",
    "reply": {
      "in_reply_to_tweet_id": "2027397464895209792",
      "exclude_reply_user_ids": []
    },
    "media": { "media_entities": [], "possibly_sensitive": false }
  }
}
```

### 1.8 Known Operation Hashes (captured 2026-02-27)

| Operation | Hash | Notes |
|-----------|------|-------|
| `CreateTweet` | `cVt4ppREOseu3zvc2jP2VA` | Post a tweet |
| `FavoriteTweet` | `lI07N6Otwv1PhnEgXILM7A` | Like |
| `CreateRetweet` | `mbRO74GrOvSfRcJnlMapnQ` | Repost |
| `DeleteTweet` | _(find in JS bundle)_ | Delete |
| `UnfavoriteTweet` | _(find in JS bundle)_ | Unlike |
| `DeleteRetweet` | _(find in JS bundle)_ | Unrepost |

> **Hash extraction**: Load `x.com`, open DevTools → Sources → search `"queryId"` in `main.*.js` files.

### 1.9 Getting Fresh Hashes

```javascript
// Run in browser console on x.com:
// Find all GraphQL operation hashes in the loaded JS bundles
async function getXHashes() {
  const scripts = Array.from(document.querySelectorAll('script[src*="main"]'));
  for (const s of scripts) {
    const text = await fetch(s.src).then(r => r.text());
    const matches = text.matchAll(/"queryId":"([^"]+)","operationName":"([^"]+)"/g);
    for (const m of matches) {
      console.log(`${m[2]}: ${m[1]}`);
    }
  }
}
getXHashes();
```

---

## 2. Threads (Meta) — Internal GraphQL API

**Captured live**: Page load traffic (feed queries, notification badges).

### 2.1 Authentication

| Token | Source | Where Used |
|-------|--------|-----------|
| **`fb_dtsg`** | Embedded in page HTML/JS, regenerated per page load | Request body |
| **`lsd`** | CSRF token, embedded in page | Request body |
| **`sessionid`** | Cookie (HttpOnly) | Cookie header |
| **`csrftoken`** | Cookie | Cookie header |
| **`doc_id`** | Persisted query ID, identifies the GraphQL operation | Request body |

```javascript
// Extract tokens from the page:
// fb_dtsg is inside a script tag or meta tag
const fbDtsg = document.querySelector('input[name="fb_dtsg"]')?.value
  || document.body.innerHTML.match(/"DTSGInitData".*?"token":"([^"]+)"/)?.[1];

// lsd is inside a script tag
const lsd = document.body.innerHTML.match(/"LSD".*?\[.*?"([^"]+)"/)?.[1];

// csrftoken from cookie
const csrftoken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
```

### 2.2 Endpoint

All Threads API calls go to a single endpoint:

```
POST https://www.threads.net/graphql/query
Content-Type: application/x-www-form-urlencoded
```

### 2.3 Create Post (Thread)

```bash
curl -X POST 'https://www.threads.net/graphql/query' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'x-fb-lsd: {lsd_token}' \
  -H 'x-csrftoken: {csrftoken}' \
  -H 'cookie: sessionid={sessionid}; csrftoken={csrftoken}' \
  -d 'av=17841463346152640&__user=0&__a=1&fb_dtsg={fb_dtsg}&lsd={lsd}&fb_api_req_friendly_name=useBarcelonaPostMutation&variables={"input":{"text":"Hello from internal API!","publish_mode":"text_post"}}&doc_id={post_mutation_doc_id}'
```

### 2.4 Known Operations (captured 2026-02-27)

| Friendly Name | `doc_id` | Purpose |
|---------------|----------|---------|
| `useBarcelonaBatchedDynamicPostCountsSubscriptionQuery` | `24892659463748049` | Get post engagement counts |
| `BarcelonaNotificationBadgeContextQueryDirectQuery` | `29486886354289124` | Notification badge count |
| `useBarcelonaPostMutation` | _(must capture during post)_ | Create a new thread |
| `useBarcelonaLikeMutation` | _(must capture during like)_ | Like a post |
| `useBarcelonaRepostMutation` | _(must capture during repost)_ | Repost |
| `useBarcelonaReplyMutation` | _(must capture during reply)_ | Reply to a thread |

> **Finding `doc_id`**: Intercept the request while performing the action. The `doc_id` identifies which server-side query to execute.

### 2.5 Request Body Format

All requests use URL-encoded form data with these fields:

| Field | Description |
|-------|-------------|
| `av` | App version / viewer ID |
| `__user` | User ID (0 = current user) |
| `__a` | Always `1` |
| `fb_dtsg` | Security token (changes per page load) |
| `lsd` | CSRF token |
| `fb_api_req_friendly_name` | Operation name (human-readable) |
| `variables` | JSON-encoded GraphQL variables |
| `doc_id` | Persisted query identifier |

### 2.6 Token Rotation ⚠️

**Critical**: `fb_dtsg` and `lsd` change on every page load. To automate:

1. Load `threads.net` in browser
2. Parse the page HTML for `DTSGInitData` or `lsd`
3. Use the extracted tokens for subsequent requests
4. Tokens expire when the page session ends

```javascript
// Auto-extract fresh tokens:
async function getThreadsTokens() {
  const html = await fetch('https://www.threads.net/').then(r => r.text());
  const fbDtsg = html.match(/"DTSGInitData".*?"token":"([^"]+)"/)?.[1];
  const lsd = html.match(/"LSD".*?\[.*?"([^"]+)"/)?.[1];
  return { fbDtsg, lsd };
}
```

---

## 3. Reddit — Internal "Shreddit" API

**Captured live**: Page load + scroll traffic on r/SideProject.

### 3.1 Authentication

| Token | Source | Where Used |
|-------|--------|-----------|
| **CSRF token** | Found in page meta tags or cookie | JSON body field |
| **Session cookie** | `reddit_session` (HttpOnly) | Cookie header |
| **Access token** | Bearer token for authenticated requests | `authorization` header |

```javascript
// Extract CSRF token:
const csrfToken = document.querySelector('input[name="csrf_token"]')?.value
  || document.cookie.match(/csrf_token=([^;]+)/)?.[1];

// Or from the faceplate-csrf-token-input element:
const csrf = document.querySelector('faceplate-csrf-token-input input')?.value;
```

### 3.2 GraphQL Endpoint

```
POST https://www.reddit.com/svc/shreddit/graphql
Content-Type: application/json
```

### 3.3 Submit Post (Internal)

```bash
curl -X POST 'https://www.reddit.com/svc/shreddit/graphql' \
  -H 'content-type: application/json' \
  -H 'cookie: reddit_session={session}; csrf_token={csrf}' \
  -d '{
    "id": "unique_request_id",
    "variables": {
      "input": {
        "subredditId": "t5_2qs44k",
        "title": "Post title here",
        "body": "Post body with **markdown**",
        "kind": "self"
      }
    }
  }'
```

### 3.4 Events Tracking Endpoint

Reddit tracks all user interactions:

```
POST https://www.reddit.com/svc/shreddit/events
Content-Type: text/plain
```

Body format:
```json
{
  "csrf_token": "21762b43f95c149f6099cf9bbdbfc85c",
  "events": [
    {
      "source": "post",
      "action": "view",
      "noun": "post",
      "post": { "id": "t3_abc123" },
      "timestamp": 1740662051234
    }
  ]
}
```

### 3.5 Upvote/Downvote (Internal)

```bash
curl -X POST 'https://www.reddit.com/svc/shreddit/graphql' \
  -H 'content-type: application/json' \
  -H 'cookie: reddit_session={session}' \
  -d '{
    "id": "vote_request",
    "variables": {
      "input": {
        "id": "t3_abc123",
        "direction": 1
      }
    }
  }'
```

> Direction: `1` = upvote, `-1` = downvote, `0` = remove vote

### 3.6 Store UX Targeting Action

```json
{
  "id": "some_unique_id",
  "variables": {
    "input": {
      "action_name": "StoreUxtargetingAction",
      "action_payload": "{...}",
      "csrf_token": "21762b43f95c149f6099cf9bbdbfc85c"
    }
  }
}
```

### 3.7 Key Headers

| Header | Value | Notes |
|--------|-------|-------|
| `content-type` | `application/json` (GQL) or `text/plain` (events) | Different per endpoint |
| `x-sh-microapp-route` | Platform route info | Included in event requests |
| `cookie` | `reddit_session=...` | Session auth |

---

## 4. Facebook — Internal GraphQL API

> ⚠️ Facebook shares the same Meta infrastructure as Threads.

### 4.1 Authentication

| Token | Source | Where Used |
|-------|--------|-----------|
| **`fb_dtsg`** | Embedded in page HTML, `DTSGInitialData` | Request body |
| **`lsd`** | CSRF token from page | Request body |
| **`c_user`** | Cookie — your user ID | Cookie header |
| **`xs`** | Session cookie | Cookie header |
| **`doc_id`** | Persisted query ID | Request body |

### 4.2 Endpoint

```
POST https://www.facebook.com/api/graphql/
Content-Type: application/x-www-form-urlencoded
```

### 4.3 Create Post (Personal Timeline)

```bash
curl -X POST 'https://www.facebook.com/api/graphql/' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'cookie: c_user={user_id}; xs={xs}' \
  -d 'av={user_id}&__user={user_id}&__a=1&fb_dtsg={fb_dtsg}&lsd={lsd}&fb_api_req_friendly_name=ComposerStoryCreateMutation&variables={"input":{"composer_entry_point":"inline_composer","composer_source_surface":"timeline","message":{"text":"Hello from internal API!"},"audience":{"privacy":{"allow":[],"base_state":"EVERYONE","deny":[]}},"actor_id":"{user_id}"}}&doc_id={composer_doc_id}'
```

### 4.4 Like / React

```bash
curl -X POST 'https://www.facebook.com/api/graphql/' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'cookie: c_user={user_id}; xs={xs}' \
  -d 'fb_dtsg={fb_dtsg}&lsd={lsd}&fb_api_req_friendly_name=CometUFIFeedbackReactMutation&variables={"input":{"feedback_id":"{base64_feedback_id}","feedback_reaction":1,"feedback_source":"NEWS_FEED","actor_id":"{user_id}"}}&doc_id={react_doc_id}'
```

> Reaction types: `1` = Like, `2` = Love, `4` = Haha, `3` = Wow, `7` = Sad, `8` = Angry

### 4.5 Token Extraction

```javascript
// Facebook tokens — extract from page load:
function getFBTokens() {
  const html = document.body.innerHTML;
  const fbDtsg = html.match(/"DTSGInitialData".*?"token":"([^"]+)"/)?.[1]
    || document.querySelector('[name="fb_dtsg"]')?.value;
  const lsd = html.match(/"LSD".*?\[.*?"([^"]+)"/)?.[1];
  const userId = document.cookie.match(/c_user=(\d+)/)?.[1];
  return { fbDtsg, lsd, userId };
}
```

---

## 5. Quick Reference — All Platforms

### 5.1 Endpoint Summary

| Platform | Endpoint | Method | Content-Type |
|----------|----------|--------|-------------|
| **X** | `x.com/i/api/graphql/{hash}/{Op}` | POST | `application/json` |
| **Threads** | `threads.net/graphql/query` | POST | `application/x-www-form-urlencoded` |
| **Reddit** | `reddit.com/svc/shreddit/graphql` | POST | `application/json` |
| **Facebook** | `facebook.com/api/graphql/` | POST | `application/x-www-form-urlencoded` |

### 5.2 Auth Token Summary

| Platform | Primary Token | CSRF Token | Session Cookie |
|----------|--------------|------------|----------------|
| **X** | Bearer (static, public) | `ct0` cookie → `x-csrf-token` header | `auth_token` |
| **Threads** | `fb_dtsg` (per page load) | `lsd` (per page load) | `sessionid` |
| **Reddit** | Session-based | `csrf_token` (in body) | `reddit_session` |
| **Facebook** | `fb_dtsg` (per page load) | `lsd` (per page load) | `c_user` + `xs` |

### 5.3 Operation Identification

| Platform | How Operations Are Identified |
|----------|------------------------------|
| **X** | URL path: `/graphql/{hash}/OperationName` |
| **Threads** | Body field: `doc_id` + `fb_api_req_friendly_name` |
| **Reddit** | Body field: operation in JSON variables |
| **Facebook** | Body field: `doc_id` + `fb_api_req_friendly_name` |

### 5.4 Difficulty Rating

| Platform | Difficulty | Main Challenge |
|----------|-----------|----------------|
| **X** | ⭐⭐⭐ Medium | Hash rotation on deploy, `x-client-transaction-id` generation |
| **Threads** | ⭐⭐⭐⭐ Hard | `fb_dtsg`/`lsd` rotate per page load, `doc_id` discovery |
| **Reddit** | ⭐⭐ Easy | Official API exists (free), internal is simpler too |
| **Facebook** | ⭐⭐⭐⭐⭐ Very Hard | Same as Threads + more aggressive anti-automation + checkpoint detection |

---

## 6. Comparison: DOM vs Internal API vs Official API

| Criteria | DOM (Playwright) | Internal API | Official API |
|----------|-----------------|-------------|-------------|
| **Speed** | ❌ 5-15s per action | ✅ 200-500ms | ✅ 200-500ms |
| **Resource usage** | ❌ Full browser | ✅ HTTP only | ✅ HTTP only |
| **Stability** | ❌ DOM changes often | ⚠️ Endpoints change | ✅ Versioned |
| **Auth complexity** | ✅ Just cookies | ⚠️ Token extraction | ⚠️ OAuth setup |
| **Token maintenance** | ✅ Browser handles it | ❌ Must extract fresh tokens | ✅ Refresh tokens |
| **Ban risk** | ⚠️ Medium (detectable) | ⚠️ Medium (pattern-based) | ✅ Low (within limits) |
| **Legal risk** | ⚠️ ToS violation | ❌ ToS violation | ✅ Compliant |
| **Works for X** | ✅ | ✅ | ⚠️ $100/mo |
| **Works for Threads** | ✅ | ✅ (hard) | ❌ Business only |
| **Works for Reddit** | ✅ | ✅ | ✅ Free |
| **Works for Bluesky** | ✅ | N/A (use official) | ✅ Free |
| **Works for Facebook** | ✅ | ✅ (very hard) | ❌ Pages only |

### Recommended Strategy Per Platform

| Platform | Best Approach | Fallback |
|----------|--------------|----------|
| **Bluesky** | Official API (AT Protocol) | — |
| **Reddit** | Official API | Internal API |
| **X (Twitter)** | Internal API (free) or Official ($100/mo) | DOM automation |
| **Threads** | DOM automation | Internal API (hard) |
| **Facebook** | DOM automation | Internal API (very hard) |

---

## 7. Risks & Mitigations

### 7.1 Token Expiration

| Platform | Token | Lifetime | Mitigation |
|----------|-------|----------|------------|
| X `ct0` | CSRF | Session (~hours) | Re-read cookie before each request |
| X Bearer | Auth | Permanent (static) | Hard-coded, rarely changes |
| Threads `fb_dtsg` | CSRF | Per page load | Reload page, re-extract |
| Threads `lsd` | CSRF | Per page load | Same as above |
| Reddit CSRF | CSRF | Session | Re-extract from page |

### 7.2 Hash/DocID Rotation

- **X**: GraphQL query hashes change on every deployment (~weekly)
- **Threads/FB**: `doc_id` values change less frequently but still rotate
- **Mitigation**: Build a hash extractor that runs on page load

### 7.3 Anti-Bot Detection

| Platform | Detection Method | Mitigation |
|----------|-----------------|------------|
| X | `x-client-transaction-id`, rate patterns | Generate realistic transaction IDs |
| Threads/FB | Device fingerprinting, behavior analysis | Use real browser session |
| Reddit | IP-based rate limiting, karma requirements | Use official API instead |

### 7.4 Legal Considerations

> ⚠️ Using internal APIs violates the Terms of Service of **all** platforms listed here (except Bluesky AT Protocol which is open by design). Use at your own risk. For production applications, always prefer official APIs where available.
