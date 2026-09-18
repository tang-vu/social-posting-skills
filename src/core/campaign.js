// Campaign model — the first-class object of the system.
// A campaign binds one source artifact to intent, a canonical content graph,
// per-platform items, approval state, receipts and observations.
// It is NOT "post this everywhere": each item is separately reviewed.

import {
  newCampaignId,
  newItemId,
  contentHash,
  nowIso,
  deepClone,
  isPlainObject,
} from "./util.js";
import { getPlatform, defaultPublishMode } from "./platforms.js";
import { saveCampaign, loadCampaign } from "./store.js";

export const SCHEMA_VERSION = 1;

export const ITEM_STATUS = Object.freeze([
  "draft", // generated, not yet validated
  "validated", // passes validation (errors=0)
  "approved", // human approved for publishing
  "exported", // written out as a draft package
  "awaiting-agent", // playbook produced; agent executing browser steps
  "publishing", // publish attempt in-flight (transient)
  "published", // confirmed published with receipt
  "partial", // some thread posts published
  "failed", // publish attempt failed cleanly
  "unknown", // side-effect state uncertain — needs reconciliation
  "skipped",
]);

export function createCampaign({
  source,
  intent = {},
  platforms = [],
  links = [],
  assets = [],
  factBase = [],
  contentGraph = null,
  targets = {},
  id = null,
}) {
  const now = nowIso();
  const campaignId = id ?? newCampaignId(source?.title ?? intent.keyMessage);
  const campaign = {
    schemaVersion: SCHEMA_VERSION,
    id: campaignId,
    createdAt: now,
    updatedAt: now,
    source,
    intent: {
      goal: intent.goal ?? "awareness",
      audience: intent.audience ?? "developers",
      keyMessage: intent.keyMessage ?? source?.title ?? "",
      tone: intent.tone ?? null,
      disclosures: intent.disclosures ?? [],
    },
    links,
    assets,
    factBase,
    contentGraph,
    items: [],
    approval: { state: "pending", approvedAt: null, note: null },
    schedule: { timezone: null, entries: [] },
    observations: [],
  };
  for (const platformId of platforms) {
    const item = createItem(campaign, platformId, { target: targets[platformId] });
    campaign.items.push(item);
  }
  return campaign;
}

export function createItem(campaign, platformId, { target = null, variant = null } = {}) {
  const meta = getPlatform(platformId);
  const item = {
    id: newItemId(campaign.id, platformId, variant),
    platform: platformId,
    variant,
    target: target ?? {},
    status: "draft",
    publishMode: defaultPublishMode(meta),
    accountHint: null,
    content: {
      title: null,
      subtitle: null,
      body: null,
      url: null,
      thread: null,
      firstComment: null,
      mediaRefs: [],
      disclosures: [...(campaign.intent?.disclosures ?? [])],
    },
    validation: { errors: [], warnings: ["not yet generated"], charUsage: {}, checkedAt: null },
    contentHash: null,
    receipt: null,
    draftPath: null,
    plannedAt: null,
    timezone: null,
    history: [{ at: nowIso(), event: "created" }],
  };
  return item;
}

export function getItem(campaign, ref) {
  // ref may be a full item id, a platform id, or platform:variant
  const item =
    campaign.items.find((i) => i.id === ref) ??
    campaign.items.find((i) => i.id.endsWith("::" + ref) || i.platform === ref);
  if (!item) {
    throw new Error(
      `Item "${ref}" not found. Items: ${campaign.items.map((i) => i.id).join(", ")}`
    );
  }
  return item;
}

export function addItem(campaign, platformId, opts = {}) {
  const item = createItem(campaign, platformId, opts);
  campaign.items.push(item);
  return item;
}

export function setStatus(campaign, item, status, detail = null) {
  if (!ITEM_STATUS.includes(status)) throw new Error(`Bad status: ${status}`);
  item.status = status;
  item.history.push({ at: nowIso(), event: status, detail });
  recomputeApproval(campaign);
}

export function recomputeApproval(campaign) {
  const approved = campaign.items.filter((i) =>
    ["approved", "awaiting-agent", "publishing", "published", "partial"].includes(i.status)
  ).length;
  const state = approved === 0 ? "pending" : approved < campaign.items.length ? "partial" : "approved";
  campaign.approval.state = campaign.items.length === 0 ? "pending" : state;
}

export function computeItemHash(item) {
  const mediaHashes = (item.content.mediaRefs ?? [])
    .map((r) => r.sha256 ?? r.path ?? "")
    .filter(Boolean);
  return contentHash(item.platform, item.content, mediaHashes);
}

export function refreshItemHash(item) {
  item.contentHash = computeItemHash(item);
  return item.contentHash;
}

export function save(campaign, root) {
  return saveCampaign(campaign, root);
}

export function load(campaignId, root) {
  const campaign = loadCampaign(campaignId, root);
  if (!campaign) throw new Error(`Campaign file unreadable: ${campaignId}`);
  if (campaign.schemaVersion !== SCHEMA_VERSION) {
    campaign.schemaVersion = SCHEMA_VERSION; // forward field additions are additive
  }
  return campaign;
}

export function campaignSummary(campaign) {
  return {
    id: campaign.id,
    source: campaign.source?.type,
    goal: campaign.intent?.goal,
    approval: campaign.approval?.state,
    items: campaign.items.map((i) => ({
      id: i.id,
      platform: i.platform,
      status: i.status,
      publishMode: i.publishMode,
      warnings: i.validation?.warnings?.length ?? 0,
      errors: i.validation?.errors?.length ?? 0,
    })),
  };
}

// Reject item fields the model does not know — catches typos early.
export function sanitizeItem(item) {
  const out = deepClone(item);
  if (!isPlainObject(out.content)) out.content = {};
  out.content.mediaRefs ??= [];
  out.content.disclosures ??= [];
  return out;
}
