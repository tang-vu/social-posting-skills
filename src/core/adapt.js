// Platform adaptation — renders each campaign item from the shared content
// graph. Every builder produces a genuinely platform-native structure
// (thread vs title+body vs launch kit), not the same text truncated.
//
// These are deterministic SCAFFOLDS. The agent skill performs the creative
// pass (voice, hooks) and the human approves. The scaffold guarantees
// structural correctness: right fields, right limits, consistent facts.

import { getPlatform, charLimit } from "./platforms.js";
import { coreClaim, nodesByType } from "./graph.js";
import { linkForPlatform } from "./links.js";
import { truncateAt, charLen } from "./util.js";

export function adaptItem(campaign, item) {
  const platform = getPlatform(item.platform);
  const builder = BUILDERS[item.platform] ?? buildGeneric;
  const content = builder(campaign, platform, item);
  item.content = { ...item.content, ...content };
  return item;
}

export function adaptCampaign(campaign, { platforms = null, overwrite = false } = {}) {
  const targets = platforms ?? campaign.items.map((i) => i.platform);
  for (const item of campaign.items) {
    if (!targets.includes(item.platform)) continue;
    // keep authored edits — thread items carry content in .thread, not .body
    const hasContent = item.content?.body || item.content?.thread?.length || item.content?.title;
    if (!overwrite && hasContent) continue;
    adaptItem(campaign, item);
    item.history.push({ at: new Date().toISOString(), event: "adapted", detail: "scaffold" });
  }
  return campaign;
}

// ---- shared node helpers ----

function claim(campaign) {
  return coreClaim(campaign.contentGraph)?.text ?? campaign.intent?.keyMessage ?? "";
}

function proofs(campaign, n = 4) {
  return nodesByType(campaign.contentGraph, "proof").slice(0, n).map((x) => x.text);
}

function tech(campaign, n = 2) {
  return nodesByType(campaign.contentGraph, "technical").slice(0, n).map((x) => x.text);
}

function context(campaign) {
  return nodesByType(campaign.contentGraph, "context")[0]?.text ?? "";
}

function demo(campaign) {
  return nodesByType(campaign.contentGraph, "demo")[0]?.text ?? "";
}

function roadmap(campaign) {
  return nodesByType(campaign.contentGraph, "roadmap")[0]?.text ?? "";
}

function cta(campaign) {
  return nodesByType(campaign.contentGraph, "cta")[0]?.text ?? "";
}

function link(campaign, platformId) {
  return linkForPlatform(campaign, platformId)?.url ?? null;
}

function disclosureLine(campaign) {
  const d = campaign.intent?.disclosures ?? [];
  return d.length ? d.join(" · ") : null;
}

function cleanLine(t, max) {
  const one = String(t).replace(/\s+/g, " ").trim();
  return max ? truncateAt(one, max) : one;
}

// ---- platform builders ----
// Each returns a partial `content` object. Fields not set stay null.

function buildX(campaign, platform) {
  const max = charLimit(platform, "post") ?? 280;
  const c = claim(campaign);
  const ctx = context(campaign);
  const pts = [...proofs(campaign, 6), ...tech(campaign, 2)];
  const url = link(campaign, "x");
  const disc = disclosureLine(campaign);

  const hook = cleanLine(c, max - (disc ? disc.length + 2 : 0));
  const posts = [disc ? `${hook}\n\n${disc}` : hook];

  for (const p of pts) {
    const line = cleanLine(p, max - 8);
    if (posts[posts.length - 1].length + line.length < max && posts.length === 1 && pts.length <= 1) {
      posts[0] += "\n\n" + line;
    } else {
      posts.push(line);
    }
  }
  const ctaLine = cleanLine(cta(campaign), max - 8);
  if (ctaLine) posts.push(ctaLine);

  const thread = posts.length > 1
    ? posts.map((text, i) => ({ index: i, text }))
    : null;

  return {
    body: thread ? null : posts[0],
    thread,
    // Link strategy per platform data: reply-preferred
    firstComment: url ? `${url}` : null,
  };
}

function buildThreads(campaign, platform) {
  const max = charLimit(platform, "post") ?? 500;
  const parts = [claim(campaign), ...proofs(campaign, 3), cta(campaign)]
    .filter(Boolean).map((t) => cleanLine(t, max - 8));
  const url = link(campaign, "threads");
  const thread = parts.length > 1 ? parts.map((text, i) => ({ index: i, text })) : null;
  return {
    body: thread ? null : parts[0] ?? "",
    thread,
    firstComment: url ?? null,
  };
}

function buildBluesky(campaign, platform) {
  const max = charLimit(platform, "post") ?? 300;
  const url = link(campaign, "bluesky");
  const posts = [claim(campaign), ...proofs(campaign, 2)]
    .filter(Boolean).map((t) => cleanLine(t, max - 8));
  const thread = posts.length > 1 ? posts.map((text, i) => ({ index: i, text })) : null;
  return {
    body: thread ? null : posts[0] ?? "",
    thread,
    firstComment: url ?? null,
  };
}

function buildLinkedin(campaign) {
  const ctx = context(campaign);
  const pts = proofs(campaign, 5);
  const lines = [
    cleanLine(claim(campaign), 150),
    "",
    ctx ? cleanLine(ctx, 400) : null,
    "",
    ...pts.map((p) => `→ ${cleanLine(p, 200)}`),
    "",
    cta(campaign) ? cleanLine(cta(campaign), 200) : null,
    "",
    "(link in comments)",
  ].filter((l) => l !== null);
  return {
    body: lines.join("\n"),
    firstComment: link(campaign, "linkedin"),
  };
}

function buildReddit(campaign, platform, item) {
  const ctx = context(campaign);
  const pts = proofs(campaign, 6);
  const tk = tech(campaign, 3);
  const sub = item.target?.subreddit;
  const title = cleanLine(claim(campaign), 90);
  const body = [
    ctx ? cleanLine(ctx, 600) : `I built ${claim(campaign)} and wanted to share it here.`,
    "",
    pts.length ? "What it does:\n" + pts.map((p) => `- ${cleanLine(p, 220)}`).join("\n") : null,
    tk.length ? "\nTechnical notes:\n" + tk.map((t) => `- ${cleanLine(t, 220)}`).join("\n") : null,
    "",
    cta(campaign) ? cleanLine(cta(campaign), 300) : "Happy to answer questions — feedback welcome.",
    "",
    "Link in the comments.",
  ].filter((l) => l !== null).join("\n");
  return {
    title,
    body,
    firstComment: link(campaign, "reddit"),
    targetNote: sub ? `r/${sub}` : "choose a subreddit whose rules allow this content",
  };
}

function buildHackernews(campaign, platform, item) {
  const url = link(campaign, "hackernews");
  const c = claim(campaign);
  // Show HN title convention: "Show HN: Name – what it does"
  const title = /^show hn:/i.test(c) ? cleanLine(c, 80) : `Show HN: ${cleanLine(c, 68)}`;
  const text = [
    context(campaign) ? cleanLine(context(campaign), 500) : null,
    tech(campaign, 2).map((t) => cleanLine(t, 300)).join("\n\n") || null,
    cta(campaign) ? cleanLine(cta(campaign), 200) : null,
  ].filter(Boolean).join("\n\n") || null;
  return { title, url: url ?? null, body: text };
}

function buildProducthunt(campaign, platform) {
  const name = campaign.source?.meta?.repo?.split("/")[1]
    ?? campaign.source?.title?.split(/[\s—–-]/)[0]
    ?? "Product";
  const tagline = cleanLine(claim(campaign).replace(/^.*?[-–—:]\s*/, "") || claim(campaign), 60);
  const pts = proofs(campaign, 4);
  const description = [
    `${claim(campaign)}`,
    "",
    context(campaign) ? cleanLine(context(campaign), 300) : null,
    pts.length ? "\nKey features:\n" + pts.map((p) => `- ${cleanLine(p, 160)}`).join("\n") : null,
    "",
    roadmap(campaign) ? `Roadmap: ${cleanLine(roadmap(campaign), 200)}` : null,
  ].filter((l) => l !== null).join("\n");
  const makerComment = [
    "Hey Product Hunt!",
    "",
    `I built ${name} because ${context(campaign) ? cleanLine(context(campaign), 200) : "I wanted this to exist."}`,
    "",
    "Happy to answer anything — tell me what you think.",
  ].join("\n");
  return {
    title: cleanLine(name, 40),
    subtitle: tagline,
    body: description,
    firstComment: makerComment,
    url: link(campaign, "producthunt"),
  };
}

function buildArticle(campaign, platform, { withTags = false } = {}) {
  const title = cleanLine(claim(campaign), withTags ? 250 : 120);
  const sections = [];
  sections.push(context(campaign) ? cleanLine(context(campaign), 800) : claim(campaign));
  const pts = proofs(campaign, 8);
  if (pts.length) {
    sections.push("## What it does\n\n" + pts.map((p) => `- ${cleanLine(p, 300)}`).join("\n"));
  }
  const tk = tech(campaign, 5);
  if (tk.length) {
    sections.push("## How it works\n\n" + tk.map((t) => cleanLine(t, 400)).join("\n\n"));
  }
  const dm = demo(campaign);
  if (dm) sections.push("## Try it\n\n```\n" + dm + "\n```");
  const rm = roadmap(campaign);
  if (rm) sections.push(`## What's next\n\n${cleanLine(rm, 400)}`);
  const url = link(campaign, platform.id);
  sections.push(`---\n\n${cta(campaign) ? cleanLine(cta(campaign), 250) : ""}${url ? `\n\n${url}` : ""}`.trim());
  return {
    title,
    body: sections.join("\n\n"),
    // devto tags are a first-class field
    tags: withTags ? (campaign.intent?.tags ?? ["opensource", "showdev"]).slice(0, 4) : undefined,
  };
}

function buildFacebook(campaign) {
  const ctx = context(campaign);
  return {
    body: [
      cleanLine(claim(campaign), 200),
      "",
      ctx ? cleanLine(ctx, 500) : null,
      ...proofs(campaign, 3).map((p) => `• ${cleanLine(p, 180)}`),
      "",
      cta(campaign) ? cleanLine(cta(campaign), 200) : null,
    ].filter((l) => l !== null).join("\n"),
    firstComment: link(campaign, "facebook"),
  };
}

function buildIndiehackers(campaign) {
  const pts = proofs(campaign, 5);
  return {
    title: cleanLine(claim(campaign), 100),
    body: [
      context(campaign) ? cleanLine(context(campaign), 500) : null,
      "",
      pts.length ? "The details:\n" + pts.map((p) => `- ${cleanLine(p, 220)}`).join("\n") : null,
      "",
      cta(campaign) ? cleanLine(cta(campaign), 250) : "Ask me anything.",
    ].filter((l) => l !== null).join("\n"),
    url: link(campaign, "indiehackers"),
  };
}

function buildGeneric(campaign, platform) {
  const max = charLimit(platform, "post");
  return {
    body: [claim(campaign), context(campaign), cta(campaign)]
      .filter(Boolean).map((t) => cleanLine(t, max ?? 1000)).join("\n\n"),
    firstComment: link(campaign, platform.id),
  };
}

const BUILDERS = {
  x: buildX,
  threads: buildThreads,
  bluesky: buildBluesky,
  linkedin: buildLinkedin,
  reddit: buildReddit,
  hackernews: buildHackernews,
  producthunt: buildProducthunt,
  devto: (c, p) => buildArticle(c, p, { withTags: true }),
  medium: (c, p) => buildArticle(c, p, {}),
  substack: (c, p) => buildArticle(c, p, {}),
  facebook: buildFacebook,
  indiehackers: buildIndiehackers,
};
