// Source ingestion — turns local artifacts and safe public URLs into a
// normalized SourceDoc for the campaign pipeline.
// Supported: file (README/CHANGELOG/markdown/text), text literal, url,
// github-release (api.github.com only), npm package metadata, git diff.

import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { safeFetch } from "./fetch.js";
import { sha256, nowIso } from "./util.js";

const MAX_LOCAL_BYTES = 2 * 1024 * 1024;

export async function ingest(spec, { root = process.cwd(), fetchImpl } = {}) {
  const { type, ref } = parseSourceSpec(spec);
  switch (type) {
    case "file": return ingestFile(ref, root);
    case "text": return ingestText(ref);
    case "url": return ingestUrl(ref, fetchImpl);
    case "github-release": return ingestGithubRelease(ref, fetchImpl);
    case "npm": return ingestNpmPackage(ref, fetchImpl);
    case "git-diff": return ingestGitDiff(ref, root);
    default: throw new Error(`Unknown source type: ${type}`);
  }
}

export function parseSourceSpec(spec) {
  if (typeof spec === "object" && spec?.type) return spec;
  const s = String(spec ?? "");
  if (!s) throw new Error("Empty source spec");
  if (/^https?:\/\//i.test(s)) {
    const gh = s.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+)\/releases(?:\/tag\/([^/]+))?/i);
    if (gh) return { type: "github-release", ref: { repo: gh[1], tag: gh[2] ?? null } };
    return { type: "url", ref: s };
  }
  if (s.startsWith("npm:")) return { type: "npm", ref: s.slice(4) };
  if (s.startsWith("git:")) return { type: "git-diff", ref: s.slice(4) };
  if (s.startsWith("text:")) return { type: "text", ref: s.slice(5) };
  if (existsSync(path.resolve(s))) return { type: "file", ref: s };
  // Bare owner/repo or owner/repo@tag shorthand for GitHub releases
  const short = s.match(/^([\w.-]+\/[\w.-]+)(?:@(.+))?$/);
  if (short && !s.includes(path.sep) && s.split("/").length === 2) {
    return { type: "github-release", ref: { repo: short[1], tag: short[2] ?? null } };
  }
  return { type: "text", ref: s }; // last resort: treat as literal text
}

function docBase(type, ref, text, title) {
  return {
    type, ref: String(ref), title,
    text,
    links: extractLinks(text),
    hash: sha256(text),
    fetchedAt: nowIso(),
    meta: {},
  };
}

// Links found in the source artifact itself — first markdown link is
// treated as canonical (typically the repo/project URL). Bare URLs follow.
function extractLinks(text) {
  const seen = new Set();
  const links = [];
  const push = (url, label = null) => {
    if (seen.has(url)) return;
    seen.add(url);
    links.push({ url, label, canonical: links.length === 0 });
  };
  for (const m of String(text).matchAll(/\[([^\]]{1,80})\]\((https?:\/\/[^)\s]+)\)/g)) {
    push(m[2], m[1]);
  }
  for (const m of String(text).matchAll(/(?<!\()\b(https?:\/\/[^\s)>"']+)/g)) {
    push(m[1]);
  }
  return links;
}

function ingestFile(file, root) {
  const abs = path.resolve(root, file);
  if (!existsSync(abs)) throw new Error(`Source file not found: ${file}`);
  const st = statSync(abs);
  if (st.size > MAX_LOCAL_BYTES) throw new Error(`Source file too large (${st.size}B): ${file}`);
  const text = readFileSync(abs, "utf8");
  const name = path.basename(abs).toLowerCase();
  const kind = name.startsWith("readme") ? "readme"
    : name.startsWith("changelog") || name.startsWith("changes") ? "changelog"
    : name.includes("release") ? "release-notes"
    : name.endsWith(".md") || name.endsWith(".markdown") ? "markdown" : "text";
  const doc = docBase("file", file, text, titleFromMarkdown(text) ?? path.basename(abs));
  doc.meta.kind = kind;
  return doc;
}

function ingestText(text) {
  return docBase("text", "literal", text, titleFromMarkdown(text) ?? text.slice(0, 60).trim());
}

async function ingestUrl(url, fetchImpl) {
  const res = await safeFetch(url, { fetchImpl });
  const isHtml = res.contentType.includes("html");
  const text = isHtml ? htmlToText(res.text) : res.text;
  const doc = docBase("url", res.url, text, titleFromHtml(res.text) ?? titleFromMarkdown(text) ?? res.url);
  doc.meta.contentType = res.contentType;
  return doc;
}

async function ingestGithubRelease(ref, fetchImpl) {
  const { repo, tag } = typeof ref === "object" ? ref : { repo: ref, tag: null };
  const api = tag
    ? `https://api.github.com/repos/${repo}/releases/tags/${tag}`
    : `https://api.github.com/repos/${repo}/releases/latest`;
  const headers = process.env.GITHUB_TOKEN
    ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const res = await safeFetch(api, { fetchImpl, headers });
  const rel = JSON.parse(res.text);
  const body = rel.body ?? "";
  const title = `${repo} ${rel.tag_name ?? tag ?? ""} — ${rel.name ?? "release"}`.trim();
  const doc = docBase("github-release", `${repo}@${rel.tag_name ?? tag ?? "latest"}`, body, title);
  doc.meta = {
    kind: "release-notes",
    repo,
    tag: rel.tag_name ?? tag ?? null,
    releaseUrl: rel.html_url ?? null,
    publishedAt: rel.published_at ?? null,
    prerelease: rel.prerelease ?? false,
  };
  if (rel.html_url) {
    // release URL wins as canonical; keep links extracted from the body too
    doc.links = [
      { url: rel.html_url, label: "Release", canonical: true },
      ...(doc.links ?? []).filter((l) => l.url !== rel.html_url).map((l) => ({ ...l, canonical: false })),
    ];
  }
  return doc;
}

async function ingestNpmPackage(pkg, fetchImpl) {
  const name = pkg.replace(/^@?/, (m) => m); // scoped names allowed
  const res = await safeFetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, { fetchImpl });
  const data = JSON.parse(res.text);
  const latest = data["dist-tags"]?.latest;
  const v = latest ? data.versions?.[latest] : null;
  const text = [
    data.description ?? v?.description ?? "",
    v?.readme ?? data.readme ?? "",
  ].filter(Boolean).join("\n\n").slice(0, 200_000);
  const doc = docBase("npm", name, text, `${name}${latest ? " " + latest : ""}`);
  doc.meta = { kind: "package-release", package: name, version: latest ?? null };
  return doc;
}

function ingestGitDiff(range, root) {
  // Read-only git invocation with fixed arg shape — no shell interpolation.
  const args = ["diff", "--stat", "--find-renames"];
  const rangeArg = range && /^[\w./~^-]+$/.test(range) ? range : "HEAD~1..HEAD";
  args.push(rangeArg);
  let out;
  try {
    out = execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: MAX_LOCAL_BYTES });
  } catch (e) {
    throw new Error(`git diff failed: ${e.message.split("\n")[0]}`);
  }
  const names = execFileSync("git", ["diff", "--name-only", rangeArg], {
    cwd: root, encoding: "utf8", maxBuffer: MAX_LOCAL_BYTES,
  });
  const doc = docBase("git-diff", rangeArg, `${out}\n${names}`, `Changes in ${rangeArg}`);
  doc.meta.kind = "diff-summary";
  return doc;
}

// --- tiny extraction helpers (deliberately naive; the agent refines) ---

export function titleFromMarkdown(text) {
  const m = String(text).match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/[#*`[\]]/g, "").trim() : null;
}

function titleFromHtml(html) {
  const m = String(html).match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
