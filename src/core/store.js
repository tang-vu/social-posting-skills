// Local-first filesystem store.
// Layout under a project root:
//   .social-campaigns/
//     index.json                    // campaign id -> summary
//     learnings.jsonl               // global learning store
//     receipts.jsonl                // global publish receipt index
//     <campaignId>/
//       campaign.json               // the campaign document
//       receipts.jsonl              // receipts for this campaign
//       drafts/<platform>/          // exported draft packages
//       media/                      // copied/referenced assets (never secrets)

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  readdirSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { parseJsonSafe, nowIso } from "./util.js";

export const STORE_DIR = ".social-campaigns";

export function storeRoot(root = process.cwd()) {
  return path.join(root, STORE_DIR);
}

export function ensureStore(root = process.cwd()) {
  const dir = storeRoot(root);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function campaignDir(campaignId, root = process.cwd()) {
  return path.join(storeRoot(root), campaignId);
}

function indexPath(root) {
  return path.join(storeRoot(root), "index.json");
}

export function readIndex(root = process.cwd()) {
  return parseJsonSafe(
    existsSync(indexPath(root)) ? readFileSync(indexPath(root), "utf8") : "{}",
    {}
  );
}

function writeIndex(index, root) {
  ensureStore(root);
  writeFileSync(indexPath(root), JSON.stringify(index, null, 2) + "\n");
}

// Atomic write: tmp file + rename so a crash can't leave a torn campaign doc.
export function atomicWriteJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  renameSync(tmp, file);
}

export function saveCampaign(campaign, root = process.cwd()) {
  campaign.updatedAt = nowIso();
  const dir = campaignDir(campaign.id, root);
  atomicWriteJson(path.join(dir, "campaign.json"), campaign);

  const index = readIndex(root);
  index[campaign.id] = {
    id: campaign.id,
    title: campaign.intent?.keyMessage?.slice(0, 80) ?? campaign.id,
    source: campaign.source?.type ?? "unknown",
    platforms: [...new Set((campaign.items ?? []).map((i) => i.platform))],
    approval: campaign.approval?.state ?? "pending",
    updatedAt: campaign.updatedAt,
  };
  writeIndex(index, root);
  return campaign;
}

export function loadCampaign(campaignId, root = process.cwd()) {
  const file = path.join(campaignDir(campaignId, root), "campaign.json");
  if (!existsSync(file)) {
    throw new Error(`Campaign not found: ${campaignId} (looked in ${file})`);
  }
  return parseJsonSafe(readFileSync(file, "utf8"), null);
}

// Accepts a full id or a unique id prefix for CLI ergonomics.
export function resolveCampaignId(idOrPrefix, root = process.cwd()) {
  const index = readIndex(root);
  if (index[idOrPrefix]) return idOrPrefix;
  const matches = Object.keys(index).filter((id) => id.startsWith(idOrPrefix));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous campaign id "${idOrPrefix}": ${matches.join(", ")}`
    );
  }
  throw new Error(`No campaign matching "${idOrPrefix}"`);
}

export function listCampaigns(root = process.cwd()) {
  const index = readIndex(root);
  return Object.values(index).sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  );
}

export function appendJsonl(file, record) {
  mkdirSync(path.dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(record) + "\n");
}

export function readJsonl(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => parseJsonSafe(l, null))
    .filter(Boolean);
}

export function receiptsFile(campaignId, root = process.cwd()) {
  return path.join(campaignDir(campaignId, root), "receipts.jsonl");
}

export function globalReceiptsFile(root = process.cwd()) {
  return path.join(storeRoot(root), "receipts.jsonl");
}

export function learningsFile(root = process.cwd()) {
  return path.join(storeRoot(root), "learnings.jsonl");
}

export function listCampaignDirs(root = process.cwd()) {
  const dir = storeRoot(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
