// Campaign presets — opinionated bundles for common distribution shapes.
// The flagship preset: oss-launch, the open-source release launch kit.

import { ingest } from "./ingest.js";
import { createCampaign, addItem } from "./campaign.js";
import { buildContentGraph, addNode } from "./graph.js";

export const PRESETS = {
  "oss-launch": {
    description: "Open-source release launch kit: X, LinkedIn, Bluesky, Threads, Reddit, Show HN, Dev.to, Product Hunt",
    platforms: ["x", "linkedin", "bluesky", "threads", "reddit", "hackernews", "devto", "producthunt"],
    disclosures: ["I built this", "Open source"],
    goal: "launch",
  },
  "release-notes-only": {
    description: "Minimal release announcement: X + Bluesky + Threads",
    platforms: ["x", "bluesky", "threads"],
    disclosures: ["I built this"],
    goal: "announce",
  },
  "dev-article": {
    description: "Long-form developer distribution: Dev.to + Medium + Substack + HN",
    platforms: ["devto", "medium", "substack", "hackernews"],
    disclosures: [],
    goal: "explain",
  },
};

export function listPresets() {
  return Object.entries(PRESETS).map(([id, p]) => ({ id, ...p }));
}

// Build a campaign from a preset + source spec.
export async function campaignFromPreset(presetId, {
  source,
  intent = {},
  platforms = null,
  targets = {},
  root = process.cwd(),
  fetchImpl,
} = {}) {
  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`Unknown preset "${presetId}". Options: ${Object.keys(PRESETS).join(", ")}`);

  const doc = await ingest(source, { root, fetchImpl });
  const mergedIntent = {
    goal: preset.goal,
    audience: "developers",
    disclosures: preset.disclosures,
    ...intent,
  };

  const campaign = createCampaign({
    source: doc,
    intent: mergedIntent,
    platforms: [],
    links: doc.links ?? [],
    id: null,
  });

  // seed factBase from extracted numbers so validation has a reference corpus
  campaign.factBase = extractFacts(doc);

  campaign.contentGraph = buildContentGraph(doc, mergedIntent);
  // project identity node for oss-launch
  if (presetId === "oss-launch" && doc.meta?.repo) {
    addNode(campaign.contentGraph, "link", doc.meta.releaseUrl ?? `https://github.com/${doc.meta.repo}`, {
      id: "link-release",
      origin: "extracted",
    });
  }
  if (presetId === "oss-launch") {
    campaign.intent.disclosures = [...new Set([...preset.disclosures, ...(intent.disclosures ?? [])])];
  }

  for (const p of platforms ?? preset.platforms) {
    const item = addItem(campaign, p, { target: targets[p] ?? null });
    if (p === "reddit" && !targets.reddit?.subreddit) {
      item.target.subreddit = null; // must be chosen deliberately
    }
    if (p === "hackernews") {
      item.publishMode = "manual"; // Show HN deserves human judgement
    }
  }
  return campaign;
}

// Pull numeric/factual statements out of the source so "unverifiable number"
// warnings have a reference corpus.
function extractFacts(doc) {
  const facts = [];
  const text = doc?.text ?? "";
  for (const line of text.split("\n")) {
    if (/\d/.test(line) && /[%$x×kKmM]|\d{2,}|v\d|\d\.\d/.test(line)) {
      const t = line.trim();
      if (t.length > 10 && t.length < 300) facts.push({ id: `fact-${facts.length + 1}`, claim: t });
    }
    if (facts.length >= 30) break;
  }
  if (doc.meta?.version) facts.push({ id: "fact-version", claim: `version ${doc.meta.version}` });
  if (doc.meta?.tag) facts.push({ id: "fact-tag", claim: `tag ${doc.meta.tag}` });
  return facts;
}
