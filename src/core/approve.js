// Approval — before anything goes out, the human sees exactly what will be
// posted: platform, account hint, full content, links, media, thread shape,
// warnings, char usage, disclosures, and the publishing method.

import { getPlatform } from "./platforms.js";
import { setStatus, recomputeApproval } from "./campaign.js";
import { validateItem } from "./validate.js";
import { nowIso } from "./util.js";

export function approvalPackage(campaign, { itemIds = null, revalidate = true } = {}) {
  if (revalidate) {
    for (const item of campaign.items) validateItem(campaign, item, campaign.items);
  }
  const items = campaign.items
    .filter((i) => !itemIds || itemIds.includes(i.id) || itemIds.includes(i.platform))
    .map((item) => {
      const platform = getPlatform(item.platform);
      return {
        itemId: item.id,
        platform: platform.displayName,
        platformId: item.platform,
        status: item.status,
        publishMode: item.publishMode,
        accountHint: item.accountHint ?? "(not set — resolved at publish)",
        target: item.target ?? {},
        variant: item.variant,
        disclosures: item.content?.disclosures ?? [],
        content: {
          title: item.content?.title ?? null,
          subtitle: item.content?.subtitle ?? null,
          url: item.content?.url ?? null,
          body: item.content?.body ?? null,
          thread: item.content?.thread ?? null,
          firstComment: item.content?.firstComment ?? null,
          tags: item.content?.tags ?? null,
        },
        media: (item.content?.mediaRefs ?? []).map((r) => {
          const a = campaign.assets?.find((x) => x.id === r || x.path === r || x.fileName === r);
          return a ? { file: a.fileName, bytes: a.bytes, dims: a.width ? `${a.width}x${a.height}` : null, altText: a.altText } : { ref: r, missing: true };
        }),
        charUsage: item.validation?.charUsage ?? {},
        warnings: item.validation?.warnings ?? [],
        errors: item.validation?.errors ?? [],
        contentHash: item.contentHash,
        plannedAt: item.plannedAt ?? null,
      };
    });

  return {
    campaignId: campaign.id,
    source: { type: campaign.source?.type, ref: campaign.source?.ref, title: campaign.source?.title },
    intent: campaign.intent,
    links: campaign.links ?? [],
    approvalState: campaign.approval?.state,
    generatedAt: nowIso(),
    itemCount: items.length,
    readyCount: items.filter((i) => i.errors.length === 0).length,
    items,
  };
}

export function renderApprovalText(pkg) {
  const line = "─".repeat(64);
  const out = [];
  out.push(`CAMPAIGN ${pkg.campaignId}`);
  out.push(`Source: ${pkg.source?.type ?? "?"} — ${pkg.source?.title ?? pkg.source?.ref ?? ""}`);
  out.push(`Goal: ${pkg.intent?.goal ?? "?"} | Audience: ${pkg.intent?.audience ?? "?"}`);
  if (pkg.intent?.disclosures?.length) out.push(`Disclosures: ${pkg.intent.disclosures.join(", ")}`);
  out.push(`Approval state: ${pkg.approvalState} | Items: ${pkg.itemCount} (${pkg.readyCount} without errors)`);
  for (const it of pkg.items) {
    out.push(line);
    out.push(`${it.platform}  [${it.status}]  via ${it.publishMode}${it.variant ? "  variant " + it.variant : ""}`);
    out.push(`  item: ${it.itemId}`);
    out.push(`  account: ${it.accountHint}`);
    if (it.target && Object.keys(it.target).length) {
      out.push(`  target: ${JSON.stringify(it.target)}`);
    }
    if (it.disclosures.length) out.push(`  disclosures: ${it.disclosures.join(", ")}`);
    if (it.content.title) out.push(`  title: ${it.content.title}`);
    if (it.content.subtitle) out.push(`  tagline/subtitle: ${it.content.subtitle}`);
    if (it.content.url) out.push(`  url: ${it.content.url}`);
    if (it.content.tags) out.push(`  tags: ${it.content.tags.join(", ")}`);
    if (it.content.body) {
      out.push("  body:");
      for (const l of String(it.content.body).split("\n")) out.push(`    ${l}`);
      const u = it.charUsage?.body;
      if (u?.max) out.push(`    (${u.len}/${u.max} chars)`);
    }
    if (it.content.thread) {
      out.push(`  thread (${it.content.thread.length} posts):`);
      for (const p of it.content.thread) {
        const u = it.charUsage?.[`thread[${p.index}]`];
        out.push(`    ${p.index + 1}. ${p.text}${u?.max ? `  (${u.len}/${u.max})` : ""}`);
      }
    }
    if (it.content.firstComment) {
      out.push(`  first comment: ${it.content.firstComment}`);
    }
    if (it.media.length) {
      out.push("  media:");
      for (const m of it.media) {
        out.push(`    ${m.file ?? m.ref}${m.dims ? ` ${m.dims}` : ""}${m.altText ? ` alt="${m.altText}"` : " (no alt)"}${m.missing ? " MISSING" : ""}`);
      }
    }
    for (const e of it.errors) out.push(`  ✗ ERROR: ${e}`);
    for (const w of it.warnings) out.push(`  ⚠ ${w}`);
    if (it.plannedAt) out.push(`  planned: ${it.plannedAt} ${it.timezone ?? ""}`);
  }
  out.push(line);
  return out.join("\n");
}

// Approve items. Items with validation errors cannot be approved.
export function approveItems(campaign, refs, { note = null } = {}) {
  const approved = [];
  const skipped = [];
  for (const item of campaign.items) {
    if (!approveMatch(item, refs)) continue;
    validateItem(campaign, item, campaign.items);
    if (item.validation.errors.length) {
      skipped.push({ id: item.id, errors: item.validation.errors });
      continue;
    }
    setStatus(campaign, item, "approved", note ? { note } : null);
    approved.push(item.id);
  }
  campaign.approval.approvedAt = approved.length ? nowIso() : campaign.approval.approvedAt;
  campaign.approval.note = note ?? campaign.approval.note;
  recomputeApproval(campaign);
  return { approved, skipped };
}

function approveMatch(item, refs) {
  if (refs === "all") return true;
  const list = Array.isArray(refs) ? refs : [refs];
  return list.includes(item.id) || list.includes(item.platform) ||
    list.some((r) => item.id.endsWith("::" + r));
}

export function unapproveItems(campaign, refs) {
  for (const item of campaign.items) {
    if (!approveMatch(item, refs)) continue;
    if (["published", "partial"].includes(item.status)) continue; // can't un-ring a bell
    setStatus(campaign, item, "draft", { note: "approval revoked" });
  }
  recomputeApproval(campaign);
}
