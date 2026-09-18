// Platform registry: loads platforms/*.json as the single source of truth
// for volatile platform facts. Validation engine and adapters consume these;
// prompts and prose must not duplicate the numbers.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PLATFORMS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../platforms"
);

let cache = null;

export function platformsDir() {
  return PLATFORMS_DIR;
}

export function loadPlatforms({ reload = false } = {}) {
  if (cache && !reload) return cache;
  const map = new Map();
  for (const file of readdirSync(PLATFORMS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(readFileSync(path.join(PLATFORMS_DIR, file), "utf8"));
    if (!data.id) throw new Error(`platform file ${file} missing "id"`);
    map.set(data.id, data);
  }
  cache = map;
  return cache;
}

export function getPlatform(id) {
  const p = loadPlatforms().get(id);
  if (!p) {
    throw new Error(
      `Unknown platform "${id}". Known: ${[...loadPlatforms().keys()].join(", ")}`
    );
  }
  return p;
}

export function listPlatforms() {
  return [...loadPlatforms().values()];
}

export function platformIds() {
  return [...loadPlatforms().keys()];
}

// Resolve a numeric char limit. Returns null when unbounded.
export function charLimit(platform, field = "post") {
  const c = platform.constraints?.[field]?.maxChars;
  if (c == null) return null;
  return typeof c === "object" ? c.value ?? null : c;
}

export function publishModes(platform) {
  return platform.capabilities?.publish ?? ["manual"];
}

export function supportsThread(platform) {
  return platform.thread?.supported === true;
}

export function defaultPublishMode(platform) {
  return platform.publishing?.defaultMode ?? "manual";
}
