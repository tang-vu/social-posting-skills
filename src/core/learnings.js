// Social learning — bounded, honest outcome tracking.
// Two distinct records:
//   observation = a measured fact about one post (views, likes, replies...)
//   learning    = a lesson, ALWAYS labeled "observed" or "inferred"
// Correlation is not causation: inferred lessons are stored as hypotheses,
// never promoted to universal truths.

import { nowIso, sha256 } from "./util.js";
import { appendJsonl, readJsonl, learningsFile } from "./store.js";

// Manual analytics import — the vendor-neutral path before any platform API.
export function recordObservation(campaign, {
  itemId = null,
  postUrl = null,
  platform = null,
  metrics = {},
  observedAt = null,
  source = "manual-import",
  notes = null,
} = {}) {
  const obs = {
    id: "obs-" + sha256(`${campaign.id}|${itemId}|${postUrl}|${nowIso()}`).slice(0, 12),
    at: observedAt ?? nowIso(),
    recordedAt: nowIso(),
    itemId,
    postUrl,
    platform: platform ?? campaign.items.find((i) => i.id === itemId)?.platform ?? null,
    metrics: pickMetrics(metrics),
    source,
    notes,
  };
  campaign.observations = campaign.observations ?? [];
  campaign.observations.push(obs);
  return obs;
}

const KNOWN_METRICS = ["views", "impressions", "clicks", "likes", "replies", "reposts", "upvotes", "comments", "saves", "shares"];
function pickMetrics(m) {
  const out = {};
  for (const k of KNOWN_METRICS) {
    if (m[k] != null && Number.isFinite(Number(m[k]))) out[k] = Number(m[k]);
  }
  return out;
}

// A learning must declare its epistemic status up front.
export function addLearning({
  root = process.cwd(),
  campaignId = null,
  platform = null,
  kind, // "observed" | "inferred"
  text,
  evidenceRefs = [],
  confidence = "low",
} = {}) {
  if (!["observed", "inferred"].includes(kind)) {
    throw new Error(`learning kind must be "observed" or "inferred" — got "${kind}"`);
  }
  if (!text?.trim()) throw new Error("learning text is empty");
  const rec = {
    id: "lrn-" + sha256(text + nowIso()).slice(0, 12),
    at: nowIso(),
    campaignId,
    platform,
    kind,
    confidence: kind === "observed" ? "high" : confidence, // observed facts are facts
    text: text.trim(),
    evidenceRefs,
  };
  appendJsonl(learningsFile(root), rec);
  return rec;
}

export function listLearnings(root = process.cwd(), { platform = null } = {}) {
  const all = readJsonl(learningsFile(root));
  return platform ? all.filter((l) => l.platform === platform) : all;
}

// Summary for `learnings` command — groups by platform, keeps kinds separate.
export function summarizeLearnings(root = process.cwd()) {
  const all = readJsonl(learningsFile(root));
  const byPlatform = {};
  for (const l of all) {
    const p = l.platform ?? "general";
    byPlatform[p] ??= { observed: [], inferred: [] };
    byPlatform[p][l.kind === "observed" ? "observed" : "inferred"].push(l);
  }
  return {
    total: all.length,
    byPlatform,
    caveat: "Observed = recorded facts. Inferred = hypotheses from limited samples; not causal claims.",
  };
}

// Compare variants within a campaign (A/B experiments) using recorded
// observations. Descriptive only — no significance claims.
export function variantComparison(campaign) {
  const groups = {};
  for (const obs of campaign.observations ?? []) {
    const item = campaign.items.find((i) => i.id === obs.itemId);
    const v = item?.variant ?? "default";
    groups[v] ??= [];
    groups[v].push(obs);
  }
  const out = {};
  for (const [v, obs] of Object.entries(groups)) {
    const sums = {};
    for (const o of obs) {
      for (const [k, n] of Object.entries(o.metrics)) {
        sums[k] = (sums[k] ?? 0) + n;
      }
    }
    out[v] = { observations: obs.length, totals: sums };
  }
  return {
    variants: out,
    caveat: "Raw totals only. Small samples are not statistically meaningful — do not generalize.",
  };
}
