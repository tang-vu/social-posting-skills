// Adapter contract. Each adapter declares honest capabilities — not every
// platform supports the same things. Modes:
//   manual        → draft package export (universal fallback, always present)
//   agent-browser → structured playbook for the agent's own browser tooling
//   api           → official API when the user configures credentials
//
// publishApi() is the ONLY side-effecting method. Everything else is pure.

import { getPlatform } from "../core/platforms.js";
import { adaptItem } from "../core/adapt.js";
import { validateItem } from "../core/validate.js";

export function makeAdapter({ id, overrides = {} }) {
  const meta = getPlatform(id);
  const apiImpl = overrides.publishApi ? true : !!meta.publishing?.api?.implemented;

  return {
    id,
    meta,
    displayName: meta.displayName,

    capabilities() {
      const c = meta.capabilities ?? {};
      return {
        generate: c.generate ?? true,
        validate: c.validate ?? true,
        preview: c.preview ?? true,
        draft: true, // universal fallback — guaranteed
        // 'api' is only advertised when an adapter actually implements it,
        // even if the platform's API exists in principle.
        publish: (c.publish ?? ["manual"]).filter((m) => m !== "api" || apiImpl),
        observe: c.observe ?? ["manual-import"],
        thread: c.thread ?? false,
        media: c.media ?? false,
      };
    },

    // Fill item.content from the content graph (deterministic scaffold).
    adapt(campaign, item) {
      if (overrides.adapt) return overrides.adapt(campaign, item);
      return adaptItem(campaign, item);
    },

    // Machine validation against platform constraints.
    validate(campaign, item, allItems) {
      return validateItem(campaign, item, allItems);
    },

    // Optional official-API publish. Signature:
    //   (campaign, item, ctx) => Promise<PublishOutcome>
    // ctx = { root, env, fetchImpl, dryRun }
    publishApi: overrides.publishApi ?? null,

    hasApi() {
      return typeof this.publishApi === "function";
    },
  };
}

// PublishOutcome helpers — adapters return one of these.
export const outcome = {
  published: (extra = {}) => ({ result: "published", ...extra }),
  partial: (extra = {}) => ({ result: "partial", needsReconciliation: true, ...extra }),
  failed: (error, extra = {}) => ({ result: "failed", error: String(error?.message ?? error), ...extra }),
  // Ambiguous side-effect: the post MAY exist. Never auto-retry — reconcile.
  unknown: (error, reconciliationSteps, extra = {}) => ({
    result: "unknown",
    error: String(error?.message ?? error),
    needsReconciliation: true,
    reconciliationSteps,
    ...extra,
  }),
};
