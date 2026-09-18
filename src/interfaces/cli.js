// CLI — `social-posting-skills <command>`.
// Backward compatible: bare `npx social-posting-skills` (or only install
// flags) still installs skills, exactly like v2.

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ingest, parseSourceSpec } from "../core/ingest.js";
import { createCampaign, getItem, setStatus, campaignSummary, save, load, refreshItemHash } from "../core/campaign.js";
import { buildContentGraph, validateGraph, setNodeText, addNode } from "../core/graph.js";
import { adaptCampaign } from "../core/adapt.js";
import { validateCampaign, validateItem } from "../core/validate.js";
import { approvalPackage, renderApprovalText, approveItems, unapproveItems } from "../core/approve.js";
import { publishItem, publishCampaign, recordOutcome, reconcile } from "../core/publish.js";
import { campaignReceipts, allReceipts, unreconciledReceipts } from "../core/receipts.js";
import { exportDraft, exportCampaign } from "../core/drafts.js";
import { buildAssetEntry, assertAssetNameSafe } from "../core/media.js";
import { recordObservation, addLearning, summarizeLearnings, variantComparison } from "../core/learnings.js";
import { setSchedule, clearSchedule, calendarView, dueItems } from "../core/schedule.js";
import { campaignFromPreset, listPresets } from "../core/presets.js";
import { listPlatforms, getPlatform, platformIds } from "../core/platforms.js";
import { listAdapters } from "../adapters/registry.js";
import { listCampaigns, ensureStore, resolveCampaignId, readJsonl, learningsFile } from "../core/store.js";
import { runInstall, INSTALL_TARGETS } from "./install.js";
import { runDoctor } from "./doctor.js";

const VERSION = JSON.parse(
  (await import("node:fs")).readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../package.json"), "utf8"
  )
).version;

// ---------- arg parsing ----------

export function parseArgs(argv) {
  const args = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags[key] = argv[++i];
      } else {
        flags[key] = true;
      }
    } else {
      args.push(a);
    }
  }
  return { args, flags };
}

const INSTALL_FLAG_NAMES = new Set(Object.keys(INSTALL_TARGETS).concat(["path", "project"]));

// ---------- main ----------

export async function main(argv = process.argv.slice(2), { root = process.cwd() } = {}) {
  const { args, flags } = parseArgs(argv);
  const cmd = args[0];

  // Backward-compat: no args, or only install flags → install
  if (!cmd || (cmd !== "help" && INSTALL_FLAG_NAMES.has(cmd.replace(/^--?/, "")))) {
    return runInstall(args.concat(flagsToArgv(flags)), { root });
  }
  if (cmd === "install") return runInstall(args.slice(1).concat(flagsToArgv(flags)), { root });
  if (cmd === "init") return cmdInit(flags, root);
  if (cmd === "campaign") return cmdCampaign(args.slice(1), flags, root);
  if (cmd === "adapters") return cmdAdapters(flags);
  if (cmd === "doctor") return runDoctor(flags, root);
  if (cmd === "calendar") return cmdCalendar(flags, root);
  if (cmd === "learnings") return cmdLearnings(flags, root);
  if (cmd === "presets") return cmdPresets();
  if (cmd === "mcp") {
    const { startMcpServer } = await import("./mcp.js");
    return startMcpServer({ root });
  }
  if (cmd === "version" || flags.version) {
    console.log(VERSION);
    return 0;
  }
  if (cmd === "help" || flags.help || flags.h) {
    printHelp();
    return 0;
  }
  console.error(`Unknown command: ${cmd}`);
  printHelp();
  return 1;
}

function flagsToArgv(flags) {
  const out = [];
  for (const [k, v] of Object.entries(flags)) {
    out.push(v === true ? `--${k}` : `--${k}=${v}`);
  }
  return out;
}

// ---------- init ----------

function cmdInit(flags, root) {
  ensureStore(root);
  mkdirSync(path.join(root, "posts", "drafts"), { recursive: true });
  mkdirSync(path.join(root, "posts", "images"), { recursive: true });
  console.log(`Initialized ${path.join(root, ".social-campaigns")}`);
  console.log(`Legacy drafts dir kept for compatibility: posts/drafts`);
  if (flags.skills !== false && !existsSync(path.join(root, ".agents", "skills"))) {
    console.log("\nInstalling agent skills into ./.agents ...");
    return runInstall(["--project"], { root });
  }
  return 0;
}

// ---------- campaign ----------

async function cmdCampaign(sub, flags, root) {
  const action = sub[0];
  switch (action) {
    case "create": return cCreate(flags, root);
    case "list": return cList(root);
    case "show": return cShow(sub[1], root);
    case "adapt": return cAdapt(sub[1], flags, root);
    case "graph": return cGraph(sub[1], flags, root);
    case "set-node": return cSetNode(sub[1], flags, root);
    case "set": return cSet(sub[1], flags, root);
    case "assets": return cAssets(sub, flags, root);
    case "validate": return cValidate(sub[1], root);
    case "preview": return cPreview(sub[1], flags, root);
    case "approve": return cApprove(sub[1], flags, root);
    case "unapprove": return cUnapprove(sub[1], flags, root);
    case "publish": return cPublish(sub[1], flags, root);
    case "export": return cExport(sub[1], flags, root);
    case "record": return cRecord(sub[1], flags, root);
    case "reconcile": return cReconcile(sub[1], flags, root);
    case "observe": return cObserve(sub[1], flags, root);
    case "schedule": return cSchedule(sub[1], flags, root);
    case "receipts": return cReceipts(sub[1], root);
    case "learn": return cLearn(sub[1], flags, root);
    case "variants": return cVariants(sub[1], root);
    default:
      console.error(`Unknown campaign action: ${action ?? "(none)"}`);
      printCampaignHelp();
      return 1;
  }
}

async function cCreate(flags, root) {
  const source = flags.source ?? flags._ ?? null;
  if (!source && !flags.preset) {
    console.error("campaign create needs --source <file|url|text:...|npm:...|owner/repo[@tag]>");
    return 1;
  }
  const platforms = flags.platforms ? flags.platforms.split(",").map((s) => s.trim()) : null;
  const targets = {};
  for (const key of ["subreddit", "group", "publication"]) {
    if (flags[key]) {
      // apply to relevant platforms
      if (key === "subreddit") targets.reddit = { ...(targets.reddit ?? {}), subreddit: flags[key] };
      if (key === "group") targets.indiehackers = { ...(targets.indiehackers ?? {}), group: flags[key] };
      if (key === "publication") targets.medium = { ...(targets.medium ?? {}), publication: flags[key] };
    }
  }

  let campaign;
  if (flags.preset) {
    campaign = await campaignFromPreset(flags.preset, {
      source: source ?? "text:" + (flags.title ?? "announcement"),
      intent: intentFromFlags(flags),
      platforms, targets, root,
    });
  } else {
    const doc = await ingest(source, { root });
    campaign = createCampaign({
      source: doc,
      intent: intentFromFlags(flags),
      platforms: platforms ?? ["x", "bluesky", "linkedin"],
      links: doc.links?.length ? doc.links : linkFlags(flags),
      targets,
    });
    campaign.contentGraph = buildContentGraph(doc, campaign.intent);
  }

  adaptCampaign(campaign);
  for (const item of campaign.items) refreshItemHash(item);
  save(campaign, root);

  console.log(`Created campaign ${campaign.id}`);
  console.log(`  source: ${campaign.source.type} — ${campaign.source.title ?? campaign.source.ref}`);
  console.log(`  items: ${campaign.items.map((i) => i.platform).join(", ")}`);
  console.log(`\nNext: social-posting-skills campaign preview ${campaign.id}`);
  return 0;
}

function intentFromFlags(flags) {
  return {
    goal: flags.goal ?? null,
    audience: flags.audience ?? null,
    keyMessage: flags.title ?? flags["key-message"] ?? null,
    disclosures: flags.disclose ? flags.disclose.split(",").map((s) => s.trim()) : undefined,
  };
}

function linkFlags(flags) {
  const links = [];
  if (flags.link) {
    for (const l of [flags.link].flat()) {
      links.push({ url: l, canonical: links.length === 0 });
    }
  }
  return links;
}

function cList(root) {
  const list = listCampaigns(root);
  if (!list.length) {
    console.log("No campaigns yet. Create one: campaign create --source <file>");
    return 0;
  }
  for (const c of list) {
    console.log(`${c.id}  [${c.approval}]  ${c.platforms.join(",")}  ${c.title ?? ""}`);
  }
  return 0;
}

function cShow(ref, root) {
  const c = load(resolveCampaignId(ref, root), root);
  console.log(JSON.stringify(campaignSummary(c), null, 2));
  return 0;
}

function cAdapt(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const platforms = flags.platforms?.split(",");
  adaptCampaign(c, { platforms, overwrite: !!flags.overwrite });
  save(c, root);
  console.log(`Adapted ${platforms ? platforms.join(",") : "all"} items (scaffolds — agent refines next)`);
  return 0;
}

function cGraph(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  if (flags.json) {
    console.log(JSON.stringify(c.contentGraph, null, 2));
  } else {
    const res = validateGraph(c.contentGraph);
    console.log(`graph kind: ${c.contentGraph?.kind ?? "none"}`);
    for (const n of c.contentGraph?.nodes ?? []) {
      console.log(`  [${n.type}]${n.origin === "extracted" ? " (auto)" : ""} ${n.id}: ${n.text.slice(0, 100)}`);
    }
    for (const e of res.errors) console.log(`  ERROR: ${e}`);
    for (const w of res.warnings) console.log(`  warn: ${w}`);
  }
  return 0;
}

function cSetNode(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  if (!flags.id || flags.value == null) {
    console.error("campaign set-node <id> --id <nodeId> --value <text>");
    return 1;
  }
  setNodeText(c.contentGraph, flags.id, flags.value);
  save(c, root);
  console.log(`Node ${flags.id} updated (origin=authored)`);
  return 0;
}

function cSet(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const item = getItem(c, flags.item);
  if (!flags.field || flags.value == null) {
    console.error("campaign set <id> --item <item> --field <title|body|url|firstComment|subtitle|mode|account|target:k> --value <text>");
    return 1;
  }
  const f = flags.field;
  if (f === "mode") {
    const valid = ["manual", "agent-browser", "api"];
    if (!valid.includes(flags.value)) throw new Error(`mode must be one of ${valid.join(", ")}`);
    item.publishMode = flags.value;
  } else if (f === "account") {
    item.accountHint = flags.value;
  } else if (f.startsWith("target:")) {
    item.target[f.slice(7)] = flags.value;
  } else if (f === "thread") {
    const posts = flags.value.split(/\n?\/\/\/\n?|\n?===\n?/).map((s) => s.trim()).filter(Boolean);
    item.content.thread = posts.map((text, i) => ({ index: i, text }));
    item.content.body = null;
  } else {
    if (!(f in item.content)) {
      console.error(`unknown content field "${f}". Known: title, subtitle, body, url, firstComment, thread, mode, account, target:k`);
      return 1;
    }
    item.content[f] = flags.value;
  }
  item.history.push({ at: new Date().toISOString(), event: "edited", detail: f });
  refreshItemHash(item);
  save(c, root);
  console.log(`Item ${item.id} field ${f} updated`);
  return 0;
}

function cAssets(sub, flags, root) {
  const action = sub[1];
  const c = load(resolveCampaignId(sub[2] ?? flags.campaign, root), root);
  if (action === "add") {
    const file = flags.file ?? sub[3];
    if (!file) {
      console.error("campaign assets add <campaignId> <file> [--alt 'text']");
      return 1;
    }
    assertAssetNameSafe(file);
    const entry = buildAssetEntry(file, { altText: flags.alt ?? null, provenance: flags.provenance ?? "user-supplied" });
    c.assets = c.assets ?? [];
    c.assets.push(entry);
    // attach to items if requested
    if (flags.item) {
      const item = getItem(c, flags.item);
      item.content.mediaRefs = item.content.mediaRefs ?? [];
      item.content.mediaRefs.push(entry.id);
      refreshItemHash(item);
    }
    save(c, root);
    console.log(`Asset ${entry.id} added (${entry.fileName}, ${entry.bytes}B${entry.width ? `, ${entry.width}x${entry.height}` : ""})${flags.item ? ` attached to ${flags.item}` : ""}`);
    return 0;
  }
  if (action === "list") {
    for (const a of c.assets ?? []) {
      console.log(`${a.id}  ${a.fileName}  ${a.bytes}B  ${a.width ?? "?"}x${a.height ?? "?"}  alt=${a.altText ?? "(none)"}`);
    }
    return 0;
  }
  console.error("campaign assets <add|list>");
  return 1;
}

function cValidate(ref, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const res = validateCampaign(c);
  save(c, root);
  console.log(`Campaign ${c.id}: ${res.errors.length} error(s), ${res.warnings.length} warning(s)`);
  for (const item of c.items) {
    const v = item.validation;
    console.log(`  ${item.platform.padEnd(14)} ${v.errors.length}E ${v.warnings.length}W`);
  }
  if (res.errors.length) {
    console.log("\nErrors:");
    for (const e of res.errors) console.log(`  ✗ ${e}`);
  }
  if (res.warnings.length) {
    console.log("\nWarnings:");
    for (const w of res.warnings.slice(0, 20)) console.log(`  ⚠ ${w}`);
    if (res.warnings.length > 20) console.log(`  ... and ${res.warnings.length - 20} more`);
  }
  return res.errors.length ? 1 : 0;
}

function cPreview(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const itemIds = flags.items ? flags.items.split(",") : flags.item ? [flags.item] : null;
  const pkg = approvalPackage(c, { itemIds });
  if (flags.json) {
    console.log(JSON.stringify(pkg, null, 2));
  } else {
    console.log(renderApprovalText(pkg));
  }
  save(c, root);
  return 0;
}

function cApprove(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const refs = flags.all ? "all" : (flags.items ?? flags.item ?? "").split(",").filter(Boolean);
  if (!refs.length && refs !== "all") {
    console.error("campaign approve <id> --items a,b | --all");
    return 1;
  }
  const { approved, skipped } = approveItems(c, refs, { note: flags.note ?? null });
  save(c, root);
  console.log(`Approved ${approved.length} item(s)${approved.length ? ": " + approved.join(", ") : ""}`);
  for (const s of skipped) {
    console.log(`  skipped ${s.id} — has validation errors: ${s.errors.join("; ")}`);
  }
  return skipped.length && !approved.length ? 1 : 0;
}

function cUnapprove(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const refs = flags.all ? "all" : (flags.items ?? flags.item ?? "").split(",").filter(Boolean);
  unapproveItems(c, refs);
  save(c, root);
  console.log("Approval revoked");
  return 0;
}

async function cPublish(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const itemSel = flags.item ?? flags.items;
  const results = itemSel
    ? await publishCampaign(c, {
        root, items: itemSel.split(","), mode: flags.mode ?? null,
        force: !!flags.force, allowUnapproved: !!flags["allow-unapproved"],
      })
    : await publishCampaign(c, {
        root, items: "approved", mode: flags.mode ?? null,
        force: !!flags.force, allowUnapproved: !!flags["allow-unapproved"],
      });
  save(c, root);
  if (!results.length) {
    console.log(`Nothing to publish — no matching ${itemSel ? "selected" : "approved"} items. Approve items first, or pass --item/--items.`);
    return 0;
  }
  let exit = 0;
  for (const r of results) {
    console.log(`${r.platform.padEnd(14)} → ${r.outcome}${r.reason ? "  (" + r.reason + ")" : ""}${r.draft ? "  draft: " + r.draft.dir : ""}${r.playbook ? "  playbook: " + r.playbook : ""}`);
    if (["failed", "unknown", "blocked"].includes(r.outcome)) exit = 1;
    if (r.api?.reconciliationSteps) {
      for (const s of r.api.reconciliationSteps) console.log(`    ${s}`);
    }
  }
  return exit;
}

function cExport(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const itemRefs = flags.items ? flags.items.split(",") : "all";
  const results = exportCampaign(c, { root, itemRefs });
  save(c, root);
  for (const r of results) console.log(`exported → ${r.dir}`);
  return 0;
}

function cRecord(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const itemRef = flags.item;
  if (!itemRef) {
    console.error("campaign record <id> --item <item> (--url <u> | --failed | --unknown | --partial) [--error <e>] [--published <k>]");
    return 1;
  }
  const kind = flags.url ? "published" : flags.partial ? "partial" : flags.unknown ? "unknown" : flags.failed !== undefined || flags.error ? "failed" : null;
  if (!kind) {
    console.error("specify outcome: --url | --failed | --unknown | --partial");
    return 1;
  }
  const receipt = recordOutcome(c, itemRef, {
    kind,
    url: flags.url ?? null,
    error: flags.error ?? null,
    publishedCount: flags.published ? Number(flags.published) : null,
    totalPosts: flags.total ? Number(flags.total) : null,
  }, { root });
  save(c, root);
  console.log(`Recorded ${receipt.result} → receipt ${receipt.receiptId}`);
  if (receipt.needsReconciliation) {
    console.log("  ⚠ needs reconciliation:");
    for (const s of receipt.reconciliationSteps ?? []) console.log(`    ${s}`);
  }
  return 0;
}

function cReconcile(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const resolution = flags.published ? "published" : flags.failed ? "failed" : null;
  if (!resolution || !flags.item) {
    console.error("campaign reconcile <id> --item <item> (--published [--url <u>] | --failed)");
    return 1;
  }
  const receipt = reconcile(c, flags.item, resolution, { root, url: flags.url ?? null });
  save(c, root);
  console.log(`Reconciled as ${resolution} → receipt ${receipt.receiptId}`);
  return 0;
}

function cObserve(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const obs = recordObservation(c, {
    itemId: flags.item ?? null,
    postUrl: flags.url ?? null,
    platform: flags.platform ?? null,
    metrics: {
      views: flags.views, likes: flags.likes, replies: flags.replies,
      reposts: flags.reposts, clicks: flags.clicks, upvotes: flags.upvotes,
      comments: flags.comments, saves: flags.saves, shares: flags.shares,
    },
    observedAt: flags.at ?? null,
    notes: flags.notes ?? null,
  });
  save(c, root);
  console.log(`Observation ${obs.id} recorded (source: ${obs.source})`);
  return 0;
}

function cSchedule(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  if (!flags.item) {
    console.error("campaign schedule <id> --item <item> --at <ISO> --tz <IANA> | --clear");
    return 1;
  }
  if (flags.clear) {
    clearSchedule(c, flags.item);
    save(c, root);
    console.log("Schedule cleared");
    return 0;
  }
  if (!flags.at) {
    console.error("needs --at <ISO datetime>");
    return 1;
  }
  const item = setSchedule(c, flags.item, { plannedAt: flags.at, timezone: flags.tz ?? null });
  save(c, root);
  console.log(`Scheduled ${item.id} for ${item.plannedAt}${item.timezone ? " (" + item.timezone + ")" : ""}`);
  return 0;
}

function cReceipts(ref, root) {
  if (flagsOrUnreconciled(ref)) {
    const unreconciled = unreconciledReceipts(root);
    for (const r of unreconciled) {
      console.log(`${r.receiptId}  ${r.platform}  ${r.itemId}  ${r.error ?? ""}  (${r.at})`);
    }
    if (!unreconciled.length) console.log("No unreconciled receipts.");
    return 0;
  }
  const c = load(resolveCampaignId(ref, root), root);
  const receipts = campaignReceipts(c.id, root);
  for (const r of receipts) {
    console.log(`${r.at}  ${r.result.padEnd(16)} ${r.itemId}${r.postUrl ? "  " + r.postUrl : ""}`);
  }
  if (!receipts.length) console.log("No receipts yet.");
  return 0;
}

function flagsOrUnreconciled(ref) {
  return ref === "--unreconciled" || ref === "-u";
}

function cLearn(ref, flags, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const kind = flags.inferred ? "inferred" : "observed";
  const text = flags.text ?? flags.note;
  if (!text) {
    console.error(`campaign learn <id> --text "<lesson>" [--inferred]`);
    console.error(`  observed = a fact you measured; inferred = your hypothesis (labeled honestly)`);
    return 1;
  }
  const rec = addLearning({
    root, campaignId: c.id, platform: flags.platform ?? null,
    kind, text,
    evidenceRefs: flags.item ? [flags.item] : [],
  });
  console.log(`Learning ${rec.id} stored as "${rec.kind}"`);
  return 0;
}

function cVariants(ref, root) {
  const c = load(resolveCampaignId(ref, root), root);
  const cmp = variantComparison(c);
  console.log(JSON.stringify(cmp, null, 2));
  return 0;
}

// ---------- adapters / calendar / learnings / presets ----------

function cmdAdapters(flags) {
  const adapters = listAdapters();
  console.log(`platform       publish modes                thread  media  api`);
  console.log(`─`.repeat(72));
  for (const a of adapters) {
    const c = a.capabilities();
    console.log(
      `${a.id.padEnd(14)} ${c.publish.join("+").padEnd(28)} ${String(c.thread).padEnd(7)} ${String(c.media).padEnd(6)} ${a.hasApi() ? "yes" : "no"}`
    );
  }
  if (flags.json) console.log(JSON.stringify(adapters.map((a) => ({ id: a.id, capabilities: a.capabilities() })), null, 2));
  return 0;
}

function cmdCalendar(flags, root) {
  const campaigns = listCampaigns(root).map((s) => {
    try { return load(s.id, root); } catch { return null; }
  }).filter(Boolean);
  const rows = calendarView(campaigns, { from: flags.from ?? null, to: flags.to ?? null });
  if (!rows.length) {
    console.log("Calendar empty — schedule items via: campaign schedule <id> --item <i> --at <ISO>");
    return 0;
  }
  for (const r of rows) {
    console.log(`${(r.when ?? "(unscheduled)").padEnd(26)} ${r.platform.padEnd(12)} ${r.status.padEnd(12)} ${r.itemId}`);
  }
  const due = dueItems(campaigns);
  if (due.length) {
    console.log(`\nDue now (${due.length}):`);
    for (const d of due) console.log(`  ${d.itemId} (planned ${d.plannedAt})`);
  }
  return 0;
}

function cmdLearnings(flags, root) {
  const s = summarizeLearnings(root);
  console.log(`Learnings: ${s.total} total`);
  console.log(s.caveat);
  for (const [platform, groups] of Object.entries(s.byPlatform)) {
    console.log(`\n${platform}:`);
    for (const l of groups.observed) console.log(`  [observed] ${l.text}`);
    for (const l of groups.inferred) console.log(`  [inferred] ${l.text} (confidence: ${l.confidence})`);
  }
  return 0;
}

function cmdPresets() {
  for (const p of listPresets()) {
    console.log(`${p.id.padEnd(20)} ${p.description}`);
    console.log(`${"".padEnd(20)} platforms: ${p.platforms.join(", ")}`);
  }
  return 0;
}

// ---------- help ----------

function printHelp() {
  console.log(`
social-posting-skills v${VERSION} — agent-native social distribution

SETUP
  install [targets]            Install agent skills (bare npx call = install)
    --project                  ./.agents (default)
    --claude --codex --gemini --antigravity --cursor --opencode   user-level dirs
    --path <dir> --generic <dir>                                 custom target
  init                         Create .social-campaigns/ + install skills

CAMPAIGNS
  campaign create --source <s> [--preset oss-launch] [--platforms a,b]
                  [--subreddit r/x] [--goal g] [--audience a] [--disclose d1,d2]
  campaign list | show <id>
  campaign adapt <id> [--platforms a,b] [--overwrite]
  campaign graph <id> [--json] | set-node <id> --id <node> --value <text>
  campaign set <id> --item <i> --field <f> --value <v>
  campaign assets add <id> <file> [--alt "text"] [--item <i>] | list <id>
  campaign validate <id>
  campaign preview <id> [--items a,b] [--json]
  campaign approve <id> --items a,b | --all
  campaign publish <id> [--items a,b] [--mode api|manual|agent-browser]
                  [--force] [--allow-unapproved]
  campaign export <id> [--items a,b]
  campaign record <id> --item <i> (--url <u>|--failed|--unknown|--partial)
  campaign reconcile <id> --item <i> (--published|--failed) [--url <u>]
  campaign schedule <id> --item <i> --at <ISO> [--tz <IANA>] | --clear
  campaign observe <id> [--item <i>] [--url <u>] [--views n] [--likes n]...
  campaign receipts <id> | receipts --unreconciled
  campaign learn <id> --text "<lesson>" [--inferred]
  campaign variants <id>

OTHER
  adapters                     List platforms + declared capabilities
  presets                      List campaign presets (oss-launch, ...)
  calendar                     planned/approved/published/failed view
  learnings                    Learning store summary (observed vs inferred)
  mcp                          Start the MCP server (stdio)
  doctor                       Environment + safety checks
  version | help
`);
}

function printCampaignHelp() {
  console.log(`campaign <create|list|show|adapt|graph|set-node|set|assets|validate|preview|approve|unapprove|publish|export|record|reconcile|observe|schedule|receipts|learn|variants>`);
}
