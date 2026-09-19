// Optional MCP server — exposes the campaign pipeline as MCP tools over
// stdio (newline-delimited JSON-RPC 2.0). Minimal subset:
//   initialize, ping, tools/list, tools/call (+ notifications ignored)
//
// Safety boundary: publish_approved_item only acts on APPROVED items and
// never exposes browser control. Generation/preview needs no credentials.

import readline from "node:readline";
import { ingest } from "../core/ingest.js";
import { createCampaign, save, load, campaignSummary, getItem, refreshItemHash } from "../core/campaign.js";
import { buildContentGraph } from "../core/graph.js";
import { adaptCampaign, adaptItem } from "../core/adapt.js";
import { validateItem, validateCampaign } from "../core/validate.js";
import { approvalPackage } from "../core/approve.js";
import { approveItems } from "../core/approve.js";
import { publishItem, recordOutcome } from "../core/publish.js";
import { exportCampaign } from "../core/drafts.js";
import { listAdapters, getAdapter } from "../adapters/registry.js";
import { resolveCampaignId, listCampaigns } from "../core/store.js";
import { campaignFromPreset, listPresets } from "../core/presets.js";
import { buildAssetEntry, assertAssetNameSafe } from "../core/media.js";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "social-posting-skills", version: "3.0.0" };

const TOOLS = [
  {
    name: "create_campaign",
    description: "Create a distribution campaign from a source artifact (file path, URL, text:..., npm:pkg, owner/repo[@tag]). Returns campaign id and item list. No credentials needed.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", description: "file path | https URL | text:... | npm:pkg | owner/repo[@tag]" },
        preset: { type: "string", description: "preset id (e.g. oss-launch). See list_presets." },
        platforms: { type: "array", items: { type: "string" } },
        goal: { type: "string" },
        audience: { type: "string" },
        disclosures: { type: "array", items: { type: "string" } },
      },
      required: ["source"],
    },
  },
  {
    name: "adapt_content",
    description: "Regenerate platform-native drafts from the campaign's content graph. Items are scaffolds for review — nothing is published.",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        platforms: { type: "array", items: { type: "string" } },
        overwrite: { type: "boolean" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "preview_campaign",
    description: "Build the approval package: every item's platform, content, links, media, thread structure, warnings, char usage, disclosures and publish method.",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "validate_platform_post",
    description: "Validate one item (or a raw content object) against platform constraints. Returns errors, warnings, char usage.",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        item: { type: "string", description: "item id or platform name within the campaign" },
        platform: { type: "string", description: "platform id (for raw content validation without a campaign)" },
        content: { type: "object", description: "raw content {title,body,url,thread:[{index,text}],firstComment}" },
      },
    },
  },
  {
    name: "list_campaign_assets",
    description: "List media assets attached to a campaign with bounds metadata (size, dims, alt text, provenance).",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        add: { type: "string", description: "optional file path to register as an asset" },
        alt: { type: "string" },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "publish_approved_item",
    description: "Publish ONE already-approved item via its configured mode (manual→draft package, api→official API, agent-browser→playbook for the agent to execute). Refuses unapproved items — the approval step is not bypassable through MCP.",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        itemId: { type: "string" },
        mode: { type: "string", enum: ["manual", "api", "agent-browser"] },
      },
      required: ["campaignId", "itemId"],
    },
  },
  {
    name: "record_outcome",
    description: "Record the outcome of an agent-browser publish run: published | partial | failed | unknown. Unknown states require reconciliation before retry.",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        itemId: { type: "string" },
        kind: { type: "string", enum: ["published", "partial", "failed", "unknown"] },
        url: { type: "string" },
        error: { type: "string" },
        publishedCount: { type: "number" },
      },
      required: ["campaignId", "itemId", "kind"],
    },
  },
  {
    name: "list_adapters",
    description: "List all platform adapters with their honestly declared capabilities (publish modes, thread, media, observe).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "campaign_status",
    description: "Campaign summary: approval state, per-item status/mode, validation counts.",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },
  {
    name: "export_draft",
    description: "Export items as complete draft packages (content + media manifest + playbook where applicable).",
    inputSchema: {
      type: "object",
      properties: {
        campaignId: { type: "string" },
        items: { type: "array", items: { type: "string" } },
      },
      required: ["campaignId"],
    },
  },
  {
    name: "list_presets",
    description: "List campaign presets (e.g. oss-launch).",
    inputSchema: { type: "object", properties: {} },
  },
];

// ---------- tool implementations ----------

async function callTool(name, args = {}, root) {
  switch (name) {
    case "create_campaign": {
      let campaign;
      if (args.preset) {
        campaign = await campaignFromPreset(args.preset, {
          source: args.source,
          intent: { goal: args.goal, audience: args.audience, disclosures: args.disclosures },
          platforms: args.platforms ?? null,
          root,
        });
      } else {
        const doc = await ingest(args.source, { root });
        campaign = createCampaign({
          source: doc,
          intent: { goal: args.goal, audience: args.audience, disclosures: args.disclosures },
          platforms: args.platforms ?? ["x", "bluesky", "linkedin"],
          links: doc.links ?? [],
        });
        campaign.contentGraph = buildContentGraph(doc, campaign.intent);
      }
      adaptCampaign(campaign);
      campaign.items.forEach(refreshItemHash);
      save(campaign, root);
      return { campaignId: campaign.id, items: campaign.items.map((i) => ({ id: i.id, platform: i.platform, mode: i.publishMode })) };
    }

    case "adapt_content": {
      const c = load(resolveCampaignId(args.campaignId, root), root);
      adaptCampaign(c, { platforms: args.platforms ?? null, overwrite: !!args.overwrite });
      c.items.forEach(refreshItemHash);
      save(c, root);
      return { campaignId: c.id, adapted: c.items.map((i) => i.id) };
    }

    case "preview_campaign": {
      const c = load(resolveCampaignId(args.campaignId, root), root);
      return approvalPackage(c, { itemIds: args.items ?? null });
    }

    case "validate_platform_post": {
      if (args.campaignId) {
        const c = load(resolveCampaignId(args.campaignId, root), root);
        if (args.item) {
          const item = getItem(c, args.item);
          const res = validateItem(c, item, c.items);
          save(c, root);
          return res;
        }
        return validateCampaign(c);
      }
      if (args.platform && args.content) {
        const adapter = getAdapter(args.platform);
        const fakeCampaign = { items: [], assets: [], contentGraph: { nodes: [] }, intent: {}, source: {} };
        const item = {
          id: "adhoc", platform: args.platform, target: args.target ?? {},
          content: args.content, validation: null,
        };
        const res = adapter.validate(fakeCampaign, item, []);
        return res;
      }
      throw new Error("provide campaignId (+item) or platform+content");
    }

    case "list_campaign_assets": {
      const c = load(resolveCampaignId(args.campaignId, root), root);
      if (args.add) {
        assertAssetNameSafe(args.add);
        const entry = buildAssetEntry(args.add, { altText: args.alt ?? null });
        c.assets = c.assets ?? [];
        c.assets.push(entry);
        save(c, root);
      }
      return { assets: c.assets ?? [] };
    }

    case "publish_approved_item": {
      const c = load(resolveCampaignId(args.campaignId, root), root);
      const item = getItem(c, args.itemId);
      if (item.status !== "approved") {
        return {
          blocked: true,
          reason: `item is "${item.status}" — approve it first (campaign approve). MCP never bypasses approval.`,
        };
      }
      const res = await publishItem(c, item, { root, mode: args.mode ?? null });
      save(c, root);
      return res;
    }

    case "record_outcome": {
      const c = load(resolveCampaignId(args.campaignId, root), root);
      const receipt = recordOutcome(c, args.itemId, {
        kind: args.kind, url: args.url, error: args.error,
        publishedCount: args.publishedCount,
      }, { root });
      save(c, root);
      return receipt;
    }

    case "list_adapters": {
      return listAdapters().map((a) => ({ id: a.id, displayName: a.displayName, capabilities: a.capabilities(), apiImplemented: a.hasApi() }));
    }

    case "campaign_status": {
      if (args.campaignId) {
        const c = load(resolveCampaignId(args.campaignId, root), root);
        return campaignSummary(c);
      }
      return listCampaigns(root);
    }

    case "export_draft": {
      const c = load(resolveCampaignId(args.campaignId, root), root);
      const results = exportCampaign(c, { root, itemRefs: args.items ?? "all" });
      save(c, root);
      return { exported: results.map((r) => r.dir) };
    }

    case "list_presets":
      return listPresets();

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------- JSON-RPC plumbing ----------

function result(id, value) {
  return { jsonrpc: "2.0", id, result: value };
}
function error(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function toolResult(id, payload, isError = false) {
  return result(id, {
    content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }],
    isError,
  });
}

export function startMcpServer({ root = process.cwd() } = {}) {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let req;
    try {
      req = JSON.parse(trimmed);
    } catch {
      send(error(null, -32700, "parse error"));
      return;
    }
    const { id, method, params } = req;
    try {
      switch (method) {
        case "initialize":
          send(result(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: SERVER_INFO,
          }));
          break;
        case "ping":
          send(result(id, {}));
          break;
        case "tools/list":
          send(result(id, { tools: TOOLS }));
          break;
        case "tools/call": {
          const out = await callTool(params?.name, params?.arguments ?? {}, root);
          send(toolResult(id, out));
          break;
        }
        default:
          if (typeof method === "string" && method.startsWith("notifications/")) {
            return; // notifications need no response
          }
          if (id !== undefined) send(error(id, -32601, `method not found: ${method}`));
      }
    } catch (e) {
      if (id !== undefined) send(toolResult(id, String(e.message ?? e), true));
    }
  });

  rl.on("close", () => process.exit(0));
  // MCP servers speak only JSON-RPC on stdout; nothing else may be printed.
  return new Promise(() => {});
}
