import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { tempRoot } from "./helpers.js";

const CLI = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "../bin/cli.js");

// Drive the stdio JSON-RPC server: send requests, collect responses by id.
function mcpClient(cwd) {
  const proc = spawn(process.execPath, [CLI, "mcp"], {
    cwd, stdio: ["pipe", "pipe", "pipe"],
  });
  const rl = readline.createInterface({ input: proc.stdout });
  const pending = new Map();
  rl.on("line", (line) => {
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    if (msg.id != null && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  let seq = 0;
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 15000);
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
  return { call, proc };
}

const SRC = "text:# Widget v1.0\n\nA tiny tool.\n\n## What's new\n\n- 40% faster\n- Ships today";

describe("MCP server", () => {
  test("initialize, tools/list, and safe tool calls", async () => {
    const root = tempRoot();
    const { call, proc } = mcpClient(root);
    try {
      const init = await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test" } });
      assert.equal(init.result.serverInfo.name, "social-posting-skills");
      assert.equal(init.result.protocolVersion, "2024-11-05");

      const list = await call("tools/list");
      const names = list.result.tools.map((t) => t.name);
      for (const t of ["create_campaign", "preview_campaign", "publish_approved_item", "list_adapters"]) {
        assert.ok(names.includes(t), `missing tool ${t}`);
      }
      // no unrestricted browser tool is exposed
      assert.ok(!names.some((n) => /browser|click|type|navigate/i.test(n)), "browser control must not be an MCP tool");

      const adapters = await call("tools/call", { name: "list_adapters", arguments: {} });
      const text = adapters.result.content[0].text;
      const parsed = JSON.parse(text);
      assert.ok(parsed.length >= 12);
    } finally {
      proc.kill();
    }
  });

  test("publish_approved_item refuses unapproved items", async () => {
    const root = tempRoot();
    const { call, proc } = mcpClient(root);
    try {
      const created = await call("tools/call", {
        name: "create_campaign",
        arguments: { source: SRC, platforms: ["linkedin"], goal: "launch" },
      });
      const campaign = JSON.parse(created.result.content[0].text);
      const itemId = campaign.items[0].id;

      const pub = await call("tools/call", {
        name: "publish_approved_item",
        arguments: { campaignId: campaign.campaignId, itemId, mode: "manual" },
      });
      const text = pub.result.content[0].text;
      // must be blocked, not published — MCP never bypasses approval
      const payload = JSON.parse(text);
      assert.equal(payload.blocked, true);
      assert.match(payload.reason, /approve/i);
    } finally {
      proc.kill();
    }
  });

  test("bad method → JSON-RPC error; bad tool → isError", async () => {
    const root = tempRoot();
    const { call, proc } = mcpClient(root);
    try {
      const bad = await call("no/such-method");
      assert.equal(bad.error.code, -32601);
      const badTool = await call("tools/call", { name: "definitely_not_a_tool", arguments: {} });
      assert.ok(badTool.result.isError || badTool.error);
    } finally {
      proc.kill();
    }
  });
});
