// Link management — canonical links plus optional deterministic UTM
// attribution. UTMs are transparent: the full tagged URL is always shown
// in previews; no cloaked redirects are generated.

import { slugify } from "./util.js";

export function normalizeLink(link) {
  if (typeof link === "string") return { url: link, label: null, canonical: false };
  return { url: link.url, label: link.label ?? null, canonical: !!link.canonical };
}

export function canonicalLink(campaign) {
  const links = (campaign.links ?? []).map(normalizeLink);
  return links.find((l) => l.canonical) ?? links[0] ?? null;
}

// Deterministic UTM: same campaign+platform always produces the same URL.
export function withUtm(url, { platform, campaignSlug, medium = "social" }) {
  const u = new URL(url);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", slugify(campaignSlug, 50));
  return u.toString();
}

export function linkForPlatform(campaign, platformId) {
  const base = canonicalLink(campaign);
  if (!base) return null;
  return {
    url: withUtm(base.url, { platform: platformId, campaignSlug: campaign.id }),
    label: base.label,
  };
}

export function validateUrl(url) {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) {
      return `unsupported scheme: ${u.protocol}`;
    }
    return null;
  } catch {
    return `invalid URL: ${url}`;
  }
}
