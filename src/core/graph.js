// Content graph — ONE canonical representation of what is being announced.
// Every platform adapter renders from this graph instead of independently
// re-interpreting the source, which is what keeps facts consistent.
//
// Node types (open set):
//   core-claim   the single headline assertion
//   context      why this exists / who it is for
//   proof        evidence: numbers, features, comparisons
//   technical    deeper technical detail
//   demo         how to see/try it
//   quote        a voice-of-author line
//   roadmap      what is next
//   cta          the ask (star, try, feedback, download)
//   link         outbound reference
//   media-ref    pointer into campaign.assets
//
// Nodes carry `origin`: "extracted" (machine guess from source, needs review)
// or "authored" (agent/human wrote it). Adapters must prefer authored text.

import { sha256 } from "./util.js";

export const NODE_TYPES = new Set([
  "core-claim", "context", "proof", "technical", "demo",
  "quote", "roadmap", "cta", "link", "media-ref",
]);

export function nodeId(type, text) {
  return `${type}-${sha256(text).slice(0, 8)}`;
}

export function makeNode(type, text, extra = {}) {
  if (!NODE_TYPES.has(type)) throw new Error(`Unknown node type: ${type}`);
  return {
    id: extra.id ?? nodeId(type, text),
    type,
    text: String(text ?? "").trim(),
    factRefs: extra.factRefs ?? [],
    linkRefs: extra.linkRefs ?? [],
    assetRefs: extra.assetRefs ?? [],
    origin: extra.origin ?? "extracted",
  };
}

// Heuristic extraction from a SourceDoc. Produces a scaffold — the agent is
// expected to refine nodes via `campaign set-node` before adaptation.
export function buildContentGraph(sourceDoc, intent = {}) {
  const text = sourceDoc?.text ?? "";
  const lines = text.split("\n");
  const nodes = [];

  const title = sourceDoc?.title ?? firstHeading(lines) ?? intent.keyMessage ?? "Untitled";
  nodes.push(makeNode("core-claim", title, { id: "core" }));

  const sections = splitSections(lines);
  const seen = new Set();
  const push = (type, t) => {
    const clean = String(t ?? "").trim();
    if (!clean || clean.length < 8) return;
    const key = clean.slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);
    nodes.push(makeNode(type, clean));
  };

  // First non-heading paragraph -> context
  const firstPara = firstParagraph(lines);
  if (firstPara) push("context", firstPara);

  for (const s of sections) {
    const head = s.heading.toLowerCase();
    const body = s.body.trim();
    if (!body) continue;
    if (/(what'?s new|features?|highlights?|added)/.test(head)) {
      for (const b of bullets(body)) push("proof", b);
    } else if (/(install|usage|quick ?start|getting started|demo|try)/.test(head)) {
      const code = firstCodeBlock(body) ?? firstParagraph(body.split("\n"));
      push("demo", code ?? body.split("\n")[0]);
    } else if (/(technical|architecture|how it works|design|implementation|under the hood)/.test(head)) {
      push("technical", firstParagraph(body.split("\n")) ?? body.split("\n")[0]);
      for (const b of bullets(body)) push("technical", b);
    } else if (/(fix|bugfix|patch)/.test(head)) {
      for (const b of bullets(body).slice(0, 5)) push("proof", b);
    } else if (/(roadmap|what'?s next|future|plans)/.test(head)) {
      push("roadmap", firstParagraph(body.split("\n")) ?? body.split("\n")[0]);
    } else if (/(why|motivation|problem|background)/.test(head)) {
      push("context", firstParagraph(body.split("\n")) ?? body.split("\n")[0]);
    }
  }

  // Links from markdown source
  for (const m of text.matchAll(/\[([^\]]{1,80})\]\((https?:\/\/[^)\s]+)\)/g)) {
    push("link", `${m[1]} — ${m[2]}`);
  }
  // Bare URLs (release pages etc.)
  for (const m of text.matchAll(/(?<!\()(https?:\/\/[^\s)]+)/g)) {
    push("link", m[1]);
  }

  // CTA scaffold — the agent should tailor it.
  nodes.push(makeNode("cta", defaultCta(intent, sourceDoc), { id: "cta" }));

  return { kind: "announcement", nodes, builtAt: new Date().toISOString() };
}

function defaultCta(intent, sourceDoc) {
  if (sourceDoc?.meta?.kind === "release-notes" || sourceDoc?.type === "github-release") {
    return "Try it out and tell us what breaks — feedback wanted.";
  }
  return "Check it out — feedback welcome.";
}

export function getNode(graph, id) {
  return graph?.nodes?.find((n) => n.id === id) ?? null;
}

export function nodesByType(graph, type) {
  return (graph?.nodes ?? []).filter((n) => n.type === type);
}

export function graphText(graph, type) {
  return nodesByType(graph, type).map((n) => n.text);
}

export function coreClaim(graph) {
  return getNode(graph, "core") ?? nodesByType(graph, "core-claim")[0] ?? null;
}

export function setNodeText(graph, id, text) {
  const n = getNode(graph, id);
  if (!n) throw new Error(`Node not found: ${id}`);
  n.text = text;
  n.origin = "authored";
  return n;
}

export function addNode(graph, type, text, extra = {}) {
  const n = makeNode(type, text, { ...extra, origin: extra.origin ?? "authored" });
  graph.nodes.push(n);
  return n;
}

// Structural validation of the graph itself.
export function validateGraph(graph) {
  const errors = [];
  const warnings = [];
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    errors.push("content graph is empty");
    return { errors, warnings };
  }
  const ids = new Set();
  for (const n of graph.nodes) {
    if (!n.id || ids.has(n.id)) errors.push(`duplicate/empty node id: ${n.id}`);
    ids.add(n.id);
    if (!NODE_TYPES.has(n.type)) errors.push(`unknown node type: ${n.type}`);
    if (!n.text?.trim()) errors.push(`empty node text: ${n.id}`);
  }
  if (!coreClaim(graph)) errors.push("graph has no core-claim node");
  if (nodesByType(graph, "cta").length === 0 && nodesByType(graph, "link").length === 0) {
    warnings.push("graph has neither a CTA nor links — posts will dead-end");
  }
  const extracted = graph.nodes.filter((n) => n.origin === "extracted").length;
  if (extracted > 0) {
    warnings.push(`${extracted} node(s) are machine-extracted and not yet reviewed`);
  }
  return { errors, warnings };
}

// --- parsing helpers ---

function firstHeading(lines) {
  for (const l of lines) {
    const m = l.match(/^#{1,2}\s+(.+)/);
    if (m) return m[1].replace(/[#*`[\]]/g, "").trim();
  }
  return null;
}

function firstParagraph(lines) {
  const para = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { if (para.length) break; continue; }
    if (/^(#|-|>|\*|```|\||!\[|\[)/.test(l)) { if (para.length) break; continue; }
    para.push(l);
  }
  return para.join(" ").trim() || null;
}

function splitSections(lines) {
  const sections = [];
  let cur = null;
  for (const l of lines) {
    const m = l.match(/^#{2,3}\s+(.+)/);
    if (m) {
      if (cur) sections.push(cur);
      cur = { heading: m[1].trim(), body: "" };
    } else if (cur) {
      cur.body += l + "\n";
    }
  }
  if (cur) sections.push(cur);
  return sections;
}

function bullets(body) {
  return body.split("\n")
    .map((l) => l.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+[.)]\s+/, "").trim())
    .filter((l) => l.length >= 8 && !l.startsWith("#"));
}

function firstCodeBlock(body) {
  const m = body.match(/```[\s\S]*?```/);
  return m ? m[0].replace(/```\w*\n?|```/g, "").trim() : null;
}
