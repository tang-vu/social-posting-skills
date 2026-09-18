// Validation engine — checks an item's content against the platform's
// machine-readable constraints plus campaign-level safety rules.
// Errors block approval; warnings surface in the approval package.

import { getPlatform, charLimit } from "./platforms.js";
import { charLen } from "./util.js";
import { validateMedia } from "./media.js";
import { validateGraph } from "./graph.js";
import { validateUrl } from "./links.js";

const ENGAGEMENT_BAIT = [
  /like\s+if\s+you\s+agree/i,
  /follow\s+for\s+follow/i,
  /retweet\s+to\s+win/i,
  /comment\s+["']?yes["']?\s+to/i,
  /upvote\s+(this|if)/i,
  /smash\s+that\s+(like|follow)/i,
];

const SUPERLATIVE = [/\bbest\b/i, /\bfastest\b/i, /\brevolutionary\b/i, /\bgame[- ]changer\b/i, /\bkiller\s+app\b/i];

export function validateItem(campaign, item, allItems = null) {
  const platform = getPlatform(item.platform);
  const errors = [];
  const warnings = [];
  const charUsage = {};
  const c = item.content ?? {};

  // --- char limits ---
  const checkField = (value, field, { required = false, label = field } = {}) => {
    const len = charLen(value);
    const max = charLimit(platform, field);
    charUsage[label] = { len, max };
    if (required && len === 0) errors.push(`${platform.id}: ${label} is required`);
    if (max != null && len > max) {
      errors.push(`${platform.id}: ${label} is ${len} chars, limit is ${max}`);
    }
  };

  if (platform.constraints?.title?.required || c.title) {
    checkField(c.title, "title", { required: platform.constraints?.title?.required });
  }
  if (platform.constraints?.tagline || c.subtitle) {
    checkField(c.subtitle, "tagline", { required: platform.constraints?.tagline?.required, label: "tagline" });
  }
  if (platform.constraints?.name?.required) {
    checkField(c.title, "name", { required: true, label: "name" });
  }
  if (platform.constraints?.post || c.body) {
    checkField(c.body, "post", { label: "body" });
  }
  if (platform.constraints?.body?.maxChars || platform.constraints?.body?.required) {
    checkField(c.body, "body", { required: platform.constraints?.body?.required, label: "body" });
  }

  // --- thread structure ---
  if (Array.isArray(c.thread) && c.thread.length) {
    if (!platform.thread?.supported) {
      errors.push(`${platform.id}: platform does not support threads`);
    } else {
      const max = charLimit(platform, "post");
      const rec = platform.thread.recommendedMax;
      if (rec && c.thread.length > rec) {
        warnings.push(`${platform.id}: thread is ${c.thread.length} posts, recommended max ~${rec}`);
      }
      const indices = c.thread.map((p) => p.index);
      const sorted = [...indices].sort((a, b) => a - b);
      if (JSON.stringify(indices) !== JSON.stringify(sorted)) {
        errors.push(`${platform.id}: thread posts out of order`);
      }
      if (new Set(indices).size !== indices.length) {
        errors.push(`${platform.id}: duplicate thread indices`);
      }
      c.thread.forEach((p, i) => {
        const len = charLen(p.text);
        charUsage[`thread[${i}]`] = { len, max };
        if (max != null && len > max) {
          errors.push(`${platform.id}: thread post ${i} is ${len} chars, limit ${max}`);
        }
        if (!p.text?.trim()) errors.push(`${platform.id}: thread post ${i} is empty`);
      });
    }
  }

  // --- media ---
  const assets = (c.mediaRefs ?? [])
    .map((r) => (typeof r === "string" ? campaign.assets?.find((a) => a.id === r || a.path === r) : r))
    .filter(Boolean);
  const mediaRes = validateMedia(assets, platform);
  errors.push(...mediaRes.errors);
  warnings.push(...mediaRes.warnings);
  if ((c.mediaRefs ?? []).length > assets.length) {
    warnings.push(`${platform.id}: some mediaRefs did not resolve to campaign assets`);
  }

  // --- links ---
  const allText = [c.body, c.title, ...(c.thread ?? []).map((p) => p.text), c.firstComment]
    .filter(Boolean).join("\n");
  const urls = allText.match(/https?:\/\/[^\s)]+/g) ?? [];
  for (const u of urls) {
    const bad = validateUrl(u);
    if (bad) errors.push(`${platform.id}: ${bad}`);
  }
  const policy = platform.links?.policy;
  if (policy === "reply-preferred" || policy === "first-comment") {
    const bodyHasLink = /https?:\/\//.test(c.body ?? "") ||
      (c.thread ?? []).some((p) => /https?:\/\//.test(p.text));
    if (bodyHasLink) {
      warnings.push(`${platform.id}: link inside post body — platform guidance prefers it in ${policy === "first-comment" ? "the first comment" : "a reply"} (heuristic)`);
    }
  }
  if (policy === "url-field" && !c.url && /show hn/i.test(c.title ?? "")) {
    warnings.push(`${platform.id}: Show HN should link to something usable — url field is empty`);
  }
  if (item.platform === "hackernews") {
    if (/^show hn:/i.test(c.title ?? "") && !c.url && !c.body) {
      errors.push("hackernews: Show HN needs a url or text body");
    }
    if (/^(please|pls)\s+(upvote|check)/i.test(c.title ?? "") || ENGAGEMENT_BAIT.some((r) => r.test(c.body ?? ""))) {
      errors.push("hackernews: asking for votes violates HN rules");
    }
  }

  // --- hashtags ---
  const tags = (allText.match(/#[\w-]+/g) ?? []).length;
  const tagMax = platform.hashtags?.maxRecommended;
  if (platform.hashtags?.supported === false && tags > 0) {
    warnings.push(`${platform.id}: hashtags not supported here — found ${tags}`);
  } else if (tagMax != null && tags > tagMax) {
    warnings.push(`${platform.id}: ${tags} hashtags, recommended ≤${tagMax}`);
  }

  // --- targets ---
  if (item.platform === "reddit" && !item.target?.subreddit) {
    warnings.push("reddit: no subreddit target set — required before publish");
  }
  if (item.platform === "facebook" && item.target?.groupId && !item.target?.rulesConfirmed) {
    warnings.push("facebook: group target set — confirm group rules allow this post type");
  }

  // --- disclosures ---
  const needsDisclosure = (c.disclosures ?? []).length > 0;
  if (needsDisclosure) {
    const text = allText.toLowerCase();
    const missing = c.disclosures.filter((d) => {
      const key = d.toLowerCase().replace(/[^a-z ]/g, "").split(" ")[0];
      return !text.includes(key) && !text.includes("built") && !text.includes("sponsor");
    });
    if (missing.length && item.platform !== "hackernews") {
      warnings.push(`${platform.id}: disclosures declared (${c.disclosures.join(", ")}) but not visible in content`);
    }
  }

  // --- content hygiene ---
  if (c.body && ENGAGEMENT_BAIT.some((r) => r.test(c.body))) {
    errors.push(`${platform.id}: engagement-bait phrasing detected — violates anti-spam policy`);
  }
  if (item.platform === "hackernews" && c.title && SUPERLATIVE.some((r) => r.test(c.title))) {
    warnings.push("hackernews: superlatives in titles perform poorly and read as marketing");
  }

  // --- fact consistency: numbers not present in source/factBase ---
  const corpus = [
    campaign.source?.text ?? "",
    ...(campaign.factBase ?? []).map((f) => f.claim ?? f),
    ...(campaign.contentGraph?.nodes ?? []).map((n) => n.text),
  ].join("\n");
  const numbers = (allText.match(/\b\d[\d,.]*[%$kKmMx×]?\b/g) ?? [])
    .filter((n) => n.length > 1 || /[%$kKx×]/.test(n));
  const suspicious = numbers.filter((n) => !corpus.includes(n));
  if (suspicious.length) {
    warnings.push(
      `${platform.id}: numbers not found in source/factBase — verify: ${suspicious.slice(0, 5).join(", ")}`
    );
  }

  // --- cross-platform duplication ---
  const others = allItems ?? campaign.items ?? [];
  for (const other of others) {
    if (other.id === item.id || !other.content?.body || !c.body) continue;
    if (other.content.body.trim() === c.body.trim()) {
      warnings.push(`${platform.id}: body identical to ${other.platform} item — cross-posted identical text`);
    }
  }

  item.validation = { errors, warnings, charUsage, checkedAt: new Date().toISOString() };
  return item.validation;
}

export function validateCampaign(campaign) {
  const graphRes = validateGraph(campaign.contentGraph);
  const errors = [...graphRes.errors];
  const warnings = [...graphRes.warnings];
  for (const item of campaign.items) {
    const res = validateItem(campaign, item, campaign.items);
    errors.push(...res.errors.map((e) => `[${item.platform}] ${e}`));
    warnings.push(...res.warnings.map((w) => `[${item.platform}] ${w}`));
  }
  return { errors, warnings };
}
