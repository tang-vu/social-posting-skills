// Campaign receipts — bounded metadata about what actually went out.
// Never stores credentials. Feeds duplicate detection and reconciliation.

import { nowIso, sha256 } from "./util.js";
import {
  appendJsonl,
  readJsonl,
  receiptsFile,
  globalReceiptsFile,
} from "./store.js";
import { setStatus } from "./campaign.js";

export const RECEIPT_RESULTS = Object.freeze([
  "published",
  "partial",
  "failed",
  "unknown",
  "draft-exported",
  "duplicate-blocked",
  "awaiting-agent",
]);

export function newReceipt({ campaign, item, adapter, mode, result, extra = {} }) {
  return {
    receiptId: "rcpt-" + sha256(`${item.id}|${nowIso()}|${result}`).slice(0, 16),
    at: nowIso(),
    campaignId: campaign.id,
    itemId: item.id,
    platform: item.platform,
    adapter,
    mode,
    result,
    contentHash: item.contentHash,
    postUrl: null,
    postId: null,
    publishedAt: null,
    publishedCount: null,
    totalPosts: null,
    postIds: null,
    error: null,
    needsReconciliation: false,
    reconciliationSteps: null,
    variant: item.variant ?? null,
    target: item.target ?? {},
    ...extra,
  };
}

// Persist a receipt: per-campaign log + global index (for duplicate detection),
// and reflect the result on the item itself.
export function recordReceipt(campaign, receipt, root = process.cwd()) {
  appendJsonl(receiptsFile(campaign.id, root), receipt);
  appendJsonl(globalReceiptsFile(root), receipt);
  item_receipt_apply(campaign, receipt);
  return receipt;
}

function item_receipt_apply(campaign, receipt) {
  const item = campaign.items.find((i) => i.id === receipt.itemId);
  if (!item) return;
  item.receipt = {
    receiptId: receipt.receiptId,
    result: receipt.result,
    at: receipt.at,
    postUrl: receipt.postUrl,
  };
  const statusByResult = {
    published: "published",
    partial: "partial",
    failed: "failed",
    unknown: "unknown",
    "draft-exported": "exported",
    "awaiting-agent": "awaiting-agent",
  };
  const status = statusByResult[receipt.result];
  if (status) setStatus(campaign, item, status, { receiptId: receipt.receiptId });
}

export function campaignReceipts(campaignId, root = process.cwd()) {
  return readJsonl(receiptsFile(campaignId, root));
}

export function allReceipts(root = process.cwd()) {
  return readJsonl(globalReceiptsFile(root));
}

// Duplicate detection: same platform + same content hash in a prior
// *successful* receipt (published/partial/awaiting-agent). Same campaign gets
// flagged too — reposting your own campaign is the common accident.
export function findDuplicates(item, root = process.cwd(), { excludeCampaignId = null } = {}) {
  if (!item.contentHash) return [];
  const dupes = [];
  for (const r of allReceipts(root)) {
    if (r.platform !== item.platform) continue;
    if (r.contentHash !== item.contentHash) continue;
    if (!["published", "partial", "awaiting-agent"].includes(r.result)) continue;
    if (excludeCampaignId && r.campaignId === excludeCampaignId) continue;
    dupes.push(r);
  }
  return dupes;
}

export function unreconciledReceipts(root = process.cwd()) {
  return allReceipts(root).filter((r) => r.needsReconciliation);
}
