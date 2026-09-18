// Shared utilities: deterministic ids, hashing, slugs, time.
// Everything identity-related is deterministic so duplicate detection works
// across processes and restarts.

import { createHash, randomBytes } from "node:crypto";

export function sha256(input) {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function shortHash(input, len = 12) {
  return sha256(input).slice(0, len);
}

export function slugify(text, max = 40) {
  const s = String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s || "untitled";
}

export function nowIso() {
  return new Date().toISOString();
}

// Deterministic campaign id from the source title + a short random suffix.
// Random suffix (not hash of content) keeps ids stable across content edits
// while still allowing several campaigns from the same source.
export function newCampaignId(title, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  return `${date}-${slugify(title, 30)}-${randomBytes(3).toString("hex")}`;
}

export function newItemId(campaignId, platform, variant = null) {
  return `${campaignId}::${platform}${variant ? `:${variant}` : ""}`;
}

// Canonical content hash for duplicate detection.
// Hash = platform + normalized text payload (thread-aware) + media hashes.
export function contentHash(platform, payload, mediaHashes = []) {
  const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const parts = [platform];
  if (payload.title) parts.push("t:" + norm(payload.title));
  if (payload.subtitle) parts.push("st:" + norm(payload.subtitle));
  if (payload.body) parts.push("b:" + norm(payload.body));
  if (payload.url) parts.push("u:" + norm(payload.url));
  if (Array.isArray(payload.thread)) {
    payload.thread.forEach((p, i) => parts.push(`th${i}:` + norm(p.text ?? p)));
  }
  for (const m of mediaHashes) parts.push("m:" + m);
  return sha256(parts.join("\n"));
}

export function charLen(text) {
  // Count by code points, not UTF-16 units — closer to platform behavior.
  return [...String(text ?? "")].length;
}

export function truncateAt(text, max) {
  const chars = [...String(text ?? "")];
  if (chars.length <= max) return String(text ?? "");
  return chars.slice(0, Math.max(0, max - 1)).join("") + "…";
}

export function parseJsonSafe(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function deepClone(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

export function uniq(arr) {
  return [...new Set(arr)];
}
