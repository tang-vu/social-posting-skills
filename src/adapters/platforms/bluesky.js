// Bluesky adapter — official AT Protocol XRPC API.
// Auth: BSKY_HANDLE + BSKY_APP_PASSWORD (app-password scope) from env only.
// Threads: reply chain (root = first post, parent = previous).
// Ambiguous failures after the first post → "partial" or "unknown", never retry.

import { makeAdapter, outcome } from "../base.js";
import { jsonFetch, requireEnv } from "../http.js";

const PDS = "https://bsky.social";

// Link facets make URLs clickable. Byte offsets over UTF-8, not char offsets.
function linkFacets(text) {
  const facets = [];
  const buf = Buffer.from(text, "utf8");
  const re = /https?:\/\/[^\s<>"')\]]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const url = m[0].replace(/[.,;!?]+$/, "");
    const byteStart = Buffer.from(text.slice(0, m.index), "utf8").length;
    facets.push({
      index: { byteStart, byteEnd: byteStart + Buffer.from(url, "utf8").length },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: url }],
    });
  }
  return facets.length ? facets : undefined;
}

function postRecord(text, { reply = null, linkCard = null } = {}) {
  const record = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
    langs: ["en"],
  };
  const facets = linkFacets(text);
  if (facets) record.facets = facets;
  if (reply) record.reply = reply;
  if (linkCard) {
    record.embed = {
      $type: "app.bsky.embed.external",
      external: { uri: linkCard.url, title: linkCard.title ?? linkCard.url, description: linkCard.description ?? "" },
    };
  }
  return record;
}

function postUrlFrom(handle, uri) {
  const rkey = uri.split("/").pop();
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

async function publishApi(campaign, item, ctx) {
  const env = ctx.env ?? process.env;
  requireEnv(env, ["BSKY_HANDLE", "BSKY_APP_PASSWORD"], "Bluesky");
  const fetchImpl = ctx.fetchImpl;

  // 1. session
  const sess = await jsonFetch(`${PDS}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    body: { identifier: env.BSKY_HANDLE, password: env.BSKY_APP_PASSWORD },
    fetchImpl,
  });
  if (!sess.ok) {
    return outcome.failed(`createSession ${sess.status}: ${sess.json?.message ?? sess.text.slice(0, 200)}`);
  }
  const { accessJwt, did, handle } = sess.json;
  item.accountHint = `@${handle}`;

  // 2. posts — body single post or thread chain, then optional firstComment reply
  const c = item.content ?? {};
  const texts = c.thread?.length ? c.thread.map((p) => p.text) : [c.body ?? ""];
  const firstComment = c.firstComment;

  const posted = [];
  let root = null;
  let parent = null;
  const pushRecord = async (text, isReply) => {
    const record = postRecord(text, {
      reply: isReply && root && parent ? { root, parent } : null,
    });
    return jsonFetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessJwt}` },
      body: { repo: did, collection: "app.bsky.feed.post", record },
      fetchImpl,
    });
  };

  for (let i = 0; i < texts.length; i++) {
    let res;
    try {
      res = await pushRecord(texts[i], i > 0);
    } catch (e) {
      // network-level failure mid-thread: post may or may not exist
      if (posted.length === 0) {
        return outcome.unknown(e, [
          "Check your Bluesky profile for the post before retrying.",
          "If it exists, reconcile via: campaign record <id> --item <item> --url <postUrl>",
          "If absent, retry the publish command.",
        ]);
      }
      return outcome.partial({
        postUrl: postUrlFrom(handle, posted[0].uri),
        publishedCount: posted.length,
        totalPosts: texts.length + (firstComment ? 1 : 0),
        postIds: posted.map((p) => p.uri),
        error: e.message,
        reconciliationSteps: [
          `${posted.length}/${texts.length} thread posts confirmed.`,
          "Continue the thread manually from the last confirmed post, or record remaining posts via campaign record.",
        ],
      });
    }
    if (!res.ok) {
      if (posted.length) {
        return outcome.partial({
          postUrl: postUrlFrom(handle, posted[0].uri),
          publishedCount: posted.length,
          totalPosts: texts.length + (firstComment ? 1 : 0),
          postIds: posted.map((p) => p.uri),
          error: `createRecord ${res.status}: ${res.json?.message ?? res.text.slice(0, 200)}`,
          reconciliationSteps: ["Continue the thread from the last confirmed post."],
        });
      }
      if (res.status === 429) {
        return outcome.failed(`rate limited (${res.status}) — wait before retrying; do not hammer`);
      }
      return outcome.failed(`createRecord ${res.status}: ${res.json?.message ?? res.text.slice(0, 200)}`);
    }
    const ref = { uri: res.json.uri, cid: res.json.cid };
    if (!root) root = ref;
    parent = ref;
    posted.push(ref);
  }

  // optional first-comment (link reply)
  if (firstComment && parent) {
    try {
      const res = await jsonFetch(`${PDS}/xrpc/com.atproto.repo.createRecord`, {
        method: "POST",
        headers: { authorization: `Bearer ${accessJwt}` },
        body: {
          repo: did,
          collection: "app.bsky.feed.post",
          record: postRecord(firstComment, { reply: { root, parent } }),
        },
        fetchImpl,
      });
      if (!res.ok) {
        return outcome.partial({
          postUrl: postUrlFrom(handle, posted[0].uri),
          publishedCount: posted.length,
          totalPosts: texts.length + 1,
          postIds: posted.map((p) => p.uri),
          error: `firstComment ${res.status}: ${res.json?.message ?? ""}`,
          reconciliationSteps: ["Main post(s) published; add the link reply manually."],
        });
      }
      posted.push({ uri: res.json.uri, cid: res.json.cid });
    } catch {
      return outcome.partial({
        postUrl: postUrlFrom(handle, posted[0].uri),
        publishedCount: posted.length,
        totalPosts: texts.length + 1,
        postIds: posted.map((p) => p.uri),
        reconciliationSteps: ["Main post(s) published; add the link reply manually."],
      });
    }
  }

  return outcome.published({
    postUrl: postUrlFrom(handle, posted[0].uri),
    postId: posted[0].uri,
    publishedAt: new Date().toISOString(),
    publishedCount: posted.length,
    totalPosts: posted.length,
    postIds: posted.map((p) => p.uri),
  });
}

export default makeAdapter({ id: "bluesky", overrides: { publishApi } });
