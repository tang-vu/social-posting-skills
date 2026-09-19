// Publish orchestration — the only module that triggers side effects.
// Order of operations for every item:
//   1. must be approved (or --allow-unapproved, an explicit operator choice)
//   2. content hash refreshed → duplicate check against global receipts
//   3. mode: manual → draft export | agent-browser → playbook + awaiting
//           api → adapter.publishApi()
//   4. receipt written for EVERY outcome, including unknown/partial
//   5. ambiguous results NEVER auto-retry — they enter reconciliation
//
// Duplicate public posts are worse than a local failure. Always.

import { getAdapter } from "../adapters/registry.js";
import { getPlatform } from "./platforms.js";
import { refreshItemHash, setStatus } from "./campaign.js";
import { newReceipt, recordReceipt, findDuplicates } from "./receipts.js";
import { exportDraft } from "./drafts.js";
import { buildPlaybook } from "../browser/playbook.js";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { campaignDir } from "./store.js";
import { nowIso } from "./util.js";

export async function publishItem(campaign, itemRef, {
  root = process.cwd(),
  mode = null,
  force = false,
  allowUnapproved = false,
  fetchImpl = undefined,
  env = process.env,
} = {}) {
  const item = typeof itemRef === "string"
    ? campaign.items.find((i) => i.id === itemRef || i.platform === itemRef || i.id.endsWith("::" + itemRef))
    : itemRef;
  if (!item) throw new Error(`Item not found: ${itemRef}`);
  const adapter = getAdapter(item.platform);
  const platform = getPlatform(item.platform);
  const publishMode = mode ?? item.publishMode;
  const results = { itemId: item.id, platform: item.platform, mode: publishMode, steps: [] };

  // 1. approval gate
  if (item.status !== "approved" && !allowUnapproved) {
    if (item.status === "published" && !force) {
      return { ...results, outcome: "already-published", receipt: item.receipt };
    }
    return { ...results, outcome: "blocked", reason: `item status is "${item.status}", needs "approved" (or --allow-unapproved)` };
  }

  // 2. duplicate check on the hash that will actually go out.
  // Same-campaign duplicates count too: reposting your own campaign
  // (e.g. a variant item whose content came out identical) is the common accident.
  refreshItemHash(item);
  const dupes = findDuplicates(item, root);
  const crossDupes = dupes.filter((d) => d.campaignId !== campaign.id);
  const sameDupes = dupes.filter((d) => d.campaignId === campaign.id);
  if (crossDupes.length && !force) {
    const receipt = recordReceipt(
      campaign,
      newReceipt({
        campaign, item, adapter: adapter.id, mode: publishMode,
        result: "duplicate-blocked",
        extra: { blockedBy: crossDupes[0].receiptId, priorPostUrl: crossDupes[0].postUrl },
      }),
      root
    );
    return { ...results, outcome: "duplicate-blocked", prior: crossDupes[0], receipt };
  }
  if (sameDupes.length && !force) {
    const receipt = recordReceipt(
      campaign,
      newReceipt({
        campaign, item, adapter: adapter.id, mode: publishMode,
        result: "duplicate-blocked",
        extra: { blockedBy: sameDupes[0].receiptId, priorPostUrl: sameDupes[0].postUrl, note: "same campaign+platform+content already published" },
      }),
      root
    );
    return { ...results, outcome: "duplicate-blocked", prior: sameDupes[0], receipt };
  }

  // 3. dispatch on mode
  setStatus(campaign, item, "publishing");
  try {
    if (publishMode === "manual") {
      const draft = exportDraft(campaign, item, { root });
      return { ...results, outcome: "draft-exported", draft };
    }

    if (publishMode === "agent-browser") {
      const pb = buildPlaybook(campaign, item, platform);
      const dir = path.join(campaignDir(campaign.id, root), "playbooks");
      mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${item.platform}${item.variant ? "-" + item.variant : ""}.playbook.json`);
      writeFileSync(file, JSON.stringify(pb, null, 2) + "\n");
      // also export the draft package so nothing is lost if the run dies
      exportDraft(campaign, item, { root, includePlaybook: false });
      const receipt = recordReceipt(
        campaign,
        newReceipt({
          campaign, item, adapter: adapter.id, mode: publishMode,
          result: "awaiting-agent",
          extra: { playbookPath: path.relative(root, file) },
        }),
        root
      );
      return { ...results, outcome: "awaiting-agent", playbook: file, receipt };
    }

    if (publishMode === "api") {
      if (!adapter.hasApi()) {
        const draft = exportDraft(campaign, item, { root });
        return {
          ...results,
          outcome: "fallback-draft",
          reason: `no API adapter implemented for ${item.platform} (or missing env) — exported draft instead`,
          draft,
        };
      }
      const res = await adapter.publishApi(campaign, item, {
        root, env, fetchImpl,
      });
      const receipt = recordReceipt(
        campaign,
        newReceipt({
          campaign, item, adapter: adapter.id, mode: publishMode,
          result: res.result,
          extra: {
            postUrl: res.postUrl ?? null,
            postId: res.postId ?? null,
            publishedAt: res.publishedAt ?? null,
            publishedCount: res.publishedCount ?? null,
            totalPosts: res.totalPosts ?? null,
            postIds: res.postIds ?? null,
            error: res.error ?? null,
            needsReconciliation: res.needsReconciliation ?? false,
            reconciliationSteps: res.reconciliationSteps ?? null,
            remoteDraft: res.remoteDraft ?? false,
          },
        }),
        root
      );
      if (res.result === "failed") {
        // failed cleanly → still keep a draft so content is never lost
        if (!existsSync(item.draftPath ?? "")) {
          item.draftPath = exportDraft(campaign, item, { root }).dir;
        }
        setStatus(campaign, item, "failed", { error: res.error });
      }
      return { ...results, outcome: res.result, api: res, receipt };
    }

    return { ...results, outcome: "blocked", reason: `unknown publish mode "${publishMode}"` };
  } catch (e) {
    // Orchestrator-level failure BEFORE adapter reported: state is ambiguous.
    const receipt = recordReceipt(
      campaign,
      newReceipt({
        campaign, item, adapter: adapter.id, mode: publishMode,
        result: "unknown",
        extra: {
          error: e.message,
          needsReconciliation: true,
          reconciliationSteps: [
            "Check the platform profile for the post before retrying.",
            "If present: campaign record <id> --item <item> --url <postUrl>",
            "If absent: run the publish command again.",
          ],
        },
      }),
      root
    );
    return { ...results, outcome: "unknown", error: e.message, receipt };
  }
}

// Record the outcome of an agent-browser run (the agent reports what happened).
export function recordOutcome(campaign, itemRef, outcome_, { root = process.cwd() } = {}) {
  const item = typeof itemRef === "string"
    ? campaign.items.find((i) => i.id === itemRef || i.id.endsWith("::" + itemRef) || i.platform === itemRef)
    : itemRef;
  if (!item) throw new Error(`Item not found: ${itemRef}`);
  const adapter = getAdapter(item.platform);
  const base = { campaign, item, adapter: adapter.id, mode: item.publishMode };

  let receipt;
  switch (outcome_.kind) {
    case "published":
      receipt = newReceipt({ ...base, result: "published", extra: {
        postUrl: outcome_.url ?? null, postId: outcome_.postId ?? null,
        publishedAt: outcome_.at ?? nowIso(),
      }});
      break;
    case "partial":
      receipt = newReceipt({ ...base, result: "partial", extra: {
        postUrl: outcome_.url ?? null,
        publishedCount: outcome_.publishedCount ?? null,
        totalPosts: outcome_.totalPosts ?? (item.content?.thread?.length ?? null),
        error: outcome_.error ?? null,
        needsReconciliation: true,
        reconciliationSteps: ["Continue the thread from the last confirmed post."],
      }});
      break;
    case "failed":
      receipt = newReceipt({ ...base, result: "failed", extra: { error: outcome_.error ?? "unknown failure" }});
      break;
    case "unknown":
      receipt = newReceipt({ ...base, result: "unknown", extra: {
        error: outcome_.error ?? "state uncertain",
        needsReconciliation: true,
        reconciliationSteps: outcome_.steps ?? [
          "Check the platform profile for the post before retrying.",
          "If present: campaign record <id> --item <item> --url <postUrl>",
        ],
      }});
      break;
    default:
      throw new Error(`Bad outcome kind: ${outcome_.kind}`);
  }
  recordReceipt(campaign, receipt, root);
  return receipt;
}

// Resolve an "unknown" receipt after the human checked the platform.
export function reconcile(campaign, itemRef, resolution, { root = process.cwd(), url = null } = {}) {
  const item = typeof itemRef === "string"
    ? campaign.items.find((i) => i.id === itemRef || i.id.endsWith("::" + itemRef) || i.platform === itemRef)
    : itemRef;
  if (!item) throw new Error(`Item not found: ${itemRef}`);
  const adapter = getAdapter(item.platform);

  const receipt = newReceipt({
    campaign, item, adapter: adapter.id, mode: item.publishMode,
    result: resolution === "published" ? "published" : "failed",
    extra: {
      postUrl: url,
      publishedAt: resolution === "published" ? nowIso() : null,
      reconciled: true,
      note: `Marked ${resolution} by human reconciliation`,
    },
  });
  recordReceipt(campaign, receipt, root);
  return receipt;
}

export async function publishCampaign(campaign, {
  root = process.cwd(),
  items = "approved",
  mode = null,
  force = false,
  allowUnapproved = false,
  fetchImpl,
  env,
} = {}) {
  const targets = campaign.items.filter((i) => {
    if (items === "all") return true;
    if (items === "approved") return i.status === "approved";
    return [items].flat().includes(i.id) || [items].flat().includes(i.platform);
  });
  const results = [];
  for (const item of targets) {
    results.push(await publishItem(campaign, item, {
      root, mode, force, allowUnapproved, fetchImpl, env,
    }));
  }
  return results;
}
