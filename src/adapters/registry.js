// Adapter registry. Platforms without an API override get the generic
// adapter (adapt/validate/preview/draft/playbook). API implementations
// are added per platform as overrides — honest capability reporting means
// an adapter never claims a publish mode it cannot perform.

import { makeAdapter } from "./base.js";
import { platformIds } from "../core/platforms.js";
import bluesky from "./platforms/bluesky.js";
import devto from "./platforms/devto.js";

const OVERRIDES = {
  bluesky,
  devto,
};

let registry = null;

export function getAdapter(id) {
  const reg = registry ?? buildRegistry();
  const a = reg.get(id);
  if (!a) throw new Error(`No adapter for platform "${id}". Known: ${[...reg.keys()].join(", ")}`);
  return a;
}

export function listAdapters() {
  const reg = registry ?? buildRegistry();
  return [...reg.values()];
}

function buildRegistry() {
  registry = new Map();
  for (const id of platformIds()) {
    registry.set(id, OVERRIDES[id] ?? makeAdapter({ id }));
  }
  return registry;
}

// Test seam: inject a fake adapter without touching the filesystem.
export function _setAdapterForTest(id, adapter) {
  const reg = registry ?? buildRegistry();
  reg.set(id, adapter);
}
