// Draft export — the graceful fallback every adapter shares. If publishing
// is unavailable, refused, or the mode is "manual", the item is written out
// as a complete draft package. No generated campaign is lost to an external
// UI change.

import { existsSync, mkdirSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import path from "node:path";
import { getPlatform } from "./platforms.js";
import { campaignDir } from "./store.js";
import { setStatus } from "./campaign.js";
import { newReceipt, recordReceipt } from "./receipts.js";
import { nowIso } from "./util.js";
import { buildPlaybook } from "../browser/playbook.js";

const COPY_MEDIA_MAX = 8 * 1024 * 1024;

export function draftsDir(campaign, root) {
  return path.join(campaignDir(campaign.id, root), "drafts");
}

// Export one item as a self-contained draft package.
export function exportDraft(campaign, item, {
  root = process.cwd(),
  legacyAlias = true,
  includePlaybook = true,
} = {}) {
  const platform = getPlatform(item.platform);
  const dir = path.join(draftsDir(campaign, root), item.platform + (item.variant ? "-" + item.variant : ""));
  mkdirSync(dir, { recursive: true });

  // media: copy small assets into the package; larger ones referenced by path
  const mediaEntries = [];
  const mediaDir = path.join(dir, "media");
  for (const ref of item.content?.mediaRefs ?? []) {
    const asset = campaign.assets?.find((a) => a.id === ref || a.path === ref || a.fileName === ref);
    if (!asset || !existsSync(asset.path)) {
      mediaEntries.push({ ref, missing: true });
      continue;
    }
    const entry = { file: asset.fileName, altText: asset.altText, sha256: asset.sha256, dims: asset.width ? [asset.width, asset.height] : null };
    if (asset.bytes <= COPY_MEDIA_MAX) {
      mkdirSync(mediaDir, { recursive: true });
      copyFileSync(asset.path, path.join(mediaDir, asset.fileName));
      entry.copied = true;
    } else {
      entry.path = asset.path;
    }
    mediaEntries.push(entry);
  }

  const pkg = {
    schemaVersion: 1,
    exportedAt: nowIso(),
    campaignId: campaign.id,
    itemId: item.id,
    platform: item.platform,
    platformName: platform.displayName,
    variant: item.variant,
    publishMode: item.publishMode,
    accountHint: item.accountHint,
    target: item.target,
    disclosures: item.content?.disclosures ?? [],
    content: item.content,
    media: mediaEntries,
    validation: item.validation,
    contentHash: item.contentHash,
    links: campaign.links ?? [],
    instructions: instructionsFor(item, platform),
  };
  writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  writeFileSync(path.join(dir, "post.md"), renderPostMarkdown(pkg, platform));

  let playbookPath = null;
  if (includePlaybook && item.publishMode === "agent-browser") {
    const playbook = buildPlaybook(campaign, item, platform);
    playbookPath = path.join(dir, "playbook.json");
    writeFileSync(playbookPath, JSON.stringify(playbook, null, 2) + "\n");
  }

  // Backward-compat alias: v2 wrote posts/drafts/<platform>_post.md
  if (legacyAlias) {
    const legacyDir = path.join(root, "posts", "drafts");
    mkdirSync(legacyDir, { recursive: true });
    const suffix = item.variant ? `_${item.variant}` : "";
    writeFileSync(
      path.join(legacyDir, `${item.platform}${suffix}_post.md`),
      renderPostMarkdown(pkg, platform)
    );
  }

  item.draftPath = path.relative(root, dir);
  setStatus(campaign, item, "exported", { path: item.draftPath });
  recordReceipt(
    campaign,
    newReceipt({
      campaign, item, adapter: "draft-export", mode: "manual",
      result: "draft-exported",
      extra: { draftPath: item.draftPath },
    }),
    root
  );
  return { dir, packagePath: path.join(dir, "package.json"), playbookPath };
}

function instructionsFor(item, platform) {
  if (item.publishMode === "agent-browser") {
    return `Open ${platform.automation?.entryUrl ?? platform.displayName} in your browser and follow playbook.json. If any step is ambiguous or a challenge/CAPTCHA appears, STOP — the post stays unpublished.`;
  }
  return `Copy the content below into ${platform.displayName} and publish manually.`;
}

export function renderPostMarkdown(pkg, platform) {
  const c = pkg.content ?? {};
  const out = [];
  out.push(`---`);
  out.push(`platform: ${pkg.platform}`);
  out.push(`campaign: ${pkg.campaignId}`);
  out.push(`item: ${pkg.itemId}`);
  out.push(`exported: ${pkg.exportedAt}`);
  out.push(`mode: ${pkg.publishMode}`);
  if (pkg.target && Object.keys(pkg.target).length) out.push(`target: ${JSON.stringify(pkg.target)}`);
  if (pkg.disclosures.length) out.push(`disclosures: ${pkg.disclosures.join(", ")}`);
  out.push(`---\n`);
  out.push(`# ${platform.displayName} draft\n`);
  if (c.title) out.push(`**Title:** ${c.title}\n`);
  if (c.subtitle) out.push(`**Tagline/Subtitle:** ${c.subtitle}\n`);
  if (c.url) out.push(`**URL:** ${c.url}\n`);
  if (c.tags?.length) out.push(`**Tags:** ${c.tags.join(", ")}\n`);
  if (c.body) out.push(c.body + "\n");
  if (c.thread?.length) {
    out.push(`\n## Thread (${c.thread.length} posts)\n`);
    for (const p of c.thread) out.push(`### ${p.index + 1}\n${p.text}\n`);
  }
  if (c.firstComment) out.push(`\n## First comment\n${c.firstComment}\n`);
  if (pkg.media.length) {
    out.push(`\n## Media`);
    for (const m of pkg.media) {
      out.push(`- ${m.file ?? m.ref ?? m.path}${m.altText ? ` — alt: "${m.altText}"` : " — ⚠ no alt text"}${m.missing ? " (MISSING FILE)" : ""}`);
    }
  }
  if (pkg.validation?.errors?.length) {
    out.push(`\n## ⚠ Validation errors\n` + pkg.validation.errors.map((e) => `- ${e}`).join("\n"));
  }
  if (pkg.validation?.warnings?.length) {
    out.push(`\n## Warnings\n` + pkg.validation.warnings.map((w) => `- ${w}`).join("\n"));
  }
  out.push(`\n---\n${pkg.instructions}\n`);
  return out.join("\n");
}

export function exportCampaign(campaign, { root = process.cwd(), itemRefs = "all" } = {}) {
  const results = [];
  for (const item of campaign.items) {
    if (itemRefs !== "all" && ![itemRefs].flat().includes(item.id) && ![itemRefs].flat().includes(item.platform)) continue;
    results.push(exportDraft(campaign, item, { root }));
  }
  return results;
}
