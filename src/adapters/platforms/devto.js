// Dev.to adapter — official Forem API (POST /api/articles).
// Auth: DEVTO_API_KEY env. Supports remote drafts via published:false —
// safer default: campaigns publish drafts remotely unless --live is given.

import { makeAdapter, outcome } from "../base.js";
import { jsonFetch, requireEnv } from "../http.js";

const API = "https://dev.to/api/articles";

async function publishApi(campaign, item, ctx) {
  const env = ctx.env ?? process.env;
  requireEnv(env, ["DEVTO_API_KEY"], "Dev.to");
  const c = item.content ?? {};

  const article = {
    title: c.title ?? campaign.intent?.keyMessage ?? "Untitled",
    body_markdown: c.body ?? "",
    published: item.target?.live === true, // default: create an unpublished draft remotely
    tags: (c.tags ?? []).slice(0, 4),
  };
  if (c.canonicalUrl) article.canonical_url = c.canonicalUrl;
  if (item.target?.series) article.series = item.target.series;

  let res;
  try {
    res = await jsonFetch(API, {
      method: "POST",
      headers: { "api-key": env.DEVTO_API_KEY },
      body: { article },
      fetchImpl: ctx.fetchImpl,
    });
  } catch (e) {
    return outcome.unknown(e, [
      "Check https://dev.to/dashboard for the article before retrying.",
      "If it exists, reconcile via: campaign record <id> --item <item> --url <articleUrl>",
      "If absent, retry the publish command.",
    ]);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return outcome.failed(`auth rejected (${res.status}) — check DEVTO_API_KEY`);
    }
    if (res.status === 429) {
      return outcome.failed("rate limited — wait before retrying");
    }
    if (res.status === 422) {
      return outcome.failed(`validation rejected: ${res.text.slice(0, 300)}`);
    }
    return outcome.failed(`API ${res.status}: ${res.text.slice(0, 200)}`);
  }

  const a = res.json ?? {};
  return outcome.published({
    postUrl: a.url ?? null,
    postId: a.id != null ? String(a.id) : null,
    publishedAt: a.published_at ?? new Date().toISOString(),
    remoteDraft: !article.published, // unpublished article = remote draft
  });
}

export default makeAdapter({ id: "devto", overrides: { publishApi } });
