// Shared test helpers: temp roots, campaign factory, fake fetch.

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createCampaign } from "../src/core/campaign.js";
import { buildContentGraph } from "../src/core/graph.js";

export function tempRoot() {
  return mkdtempSync(path.join(tmpdir(), "sps-test-"));
}

export function fixtureSource(name = "oss-readme.md") {
  return path.resolve(
    path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")),
    "fixtures", "sources", name
  );
}

// A small synthetic campaign for tests — no network, deterministic.
export function testCampaign({ platforms = ["x", "bluesky", "reddit"], text = null } = {}) {
  const sourceText = text ?? "# Widget\n\nA tiny tool.\n\n## What's new\n\n- 40% faster\n- Does the thing\n- Ships today\n\n[Repo](https://example.com/repo)";
  const doc = {
    type: "text",
    ref: "fixture",
    title: "Widget v1.0",
    text: sourceText,
    hash: "test",
    fetchedAt: new Date().toISOString(),
    meta: {},
  };
  const campaign = createCampaign({
    source: doc,
    intent: { goal: "launch", audience: "developers", keyMessage: "Widget v1.0", disclosures: ["I built this"] },
    platforms,
    links: [{ url: "https://example.com/repo", canonical: true }],
    factBase: [{ id: "f1", claim: "40% faster" }],
  });
  campaign.contentGraph = buildContentGraph(doc, campaign.intent);
  return campaign;
}

// Fake fetch for adapter tests: queue of canned responses or handlers.
export function fakeFetch(handler) {
  const calls = [];
  const fn = async (url, opts = {}) => {
    calls.push({ url, opts });
    const out = typeof handler === "function" ? handler(url, opts) : handler.shift();
    if (out instanceof Error) throw out;
    const { status = 200, json = null, text = null } = out ?? {};
    const headers = out?.headers instanceof Map
      ? out.headers
      : new Map(Object.entries(out?.headers ?? {}));
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => json,
      text: async () => text ?? JSON.stringify(json),
      headers,
      body: null,
    };
  };
  fn.calls = calls;
  return fn;
}

export function pngBuffer(width = 1200, height = 675) {
  const b = Buffer.alloc(40);
  b.writeUInt32BE(0x89504e47, 0);
  b.writeUInt32BE(0x0d0a1a0a, 4);
  b.writeUInt32BE(13, 8);
  b.write("IHDR", 12);
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

export function writePng(dir, name, w, h) {
  const p = path.join(dir, name);
  writeFileSync(p, pngBuffer(w, h));
  return p;
}
