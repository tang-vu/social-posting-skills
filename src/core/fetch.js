// SSRF-safe bounded fetching for remote sources.
// - http/https only, max 3 redirects (each re-validated)
// - blocks private/reserved IP ranges AND private-looking hostnames
// - DNS resolution check so "trusted-looking" names can't alias to 127.0.0.1
// - hard byte cap + timeout; text responses only
// Remote fetches are always opt-in; nothing here touches authenticated content.

import dns from "node:dns/promises";

const DEFAULT_MAX_BYTES = 1024 * 1024; // 1 MB
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

const BLOCKED_HOSTNAMES = new Set([
  "localhost", "localhost.localdomain", "broadcasthost",
]);
const BLOCKED_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".corp"];

export function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip.includes(":")) {
    // IPv6: loopback, link-local, ULA, mapped v4
    const s = ip.toLowerCase();
    return (
      s === "::1" || s === "::" ||
      s.startsWith("fe80:") || s.startsWith("fc") || s.startsWith("fd") ||
      s.startsWith("::ffff:127.") || s.startsWith("::ffff:10.") ||
      s.startsWith("::ffff:192.168.") || /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(s)
    );
  }
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast/reserved
  );
}

export async function assertPublicHost(hostname) {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) throw new Error(`Blocked host: ${hostname}`);
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new Error(`Blocked host suffix: ${hostname}`);
  }
  // Literal IP in the URL?
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) {
    if (isPrivateIp(host)) throw new Error(`Blocked private IP: ${hostname}`);
    return;
  }
  let addrs;
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error(`DNS resolution failed for ${hostname}`);
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error(`Host resolves to a private/reserved address: ${hostname}`);
  }
}

async function readBoundedText(res, maxBytes) {
  const reader = res.body?.getReader?.();
  if (!reader) {
    const text = await res.text();
    if (text.length > maxBytes) return text.slice(0, maxBytes);
    return text;
  }
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    chunks.push(value);
    if (total > maxBytes) break;
  }
  const merged = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return merged.subarray(0, maxBytes).toString("utf8");
}

export async function safeFetch(url, {
  maxBytes = DEFAULT_MAX_BYTES,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  headers = {},
  fetchImpl = fetch,
} = {}) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = new URL(current);
    if (!["http:", "https:"].includes(u.protocol)) {
      throw new Error(`Blocked URL scheme: ${u.protocol}`);
    }
    await assertPublicHost(u.hostname);

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(current, {
        signal: ac.signal,
        redirect: "manual",
        headers: {
          "user-agent": "social-posting-skills/3 (+https://github.com/tang-vu/social-posting-skills)",
          accept: "text/*,application/json,application/markdown",
          ...headers,
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`Redirect ${res.status} without Location`);
      current = new URL(loc, current).toString();
      continue;
    }
    if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${current}`);

    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (type && !type.includes("text") && !type.includes("json") && !type.includes("markdown")) {
      throw new Error(`Refusing non-text content-type: ${type}`);
    }
    const text = await readBoundedText(res, maxBytes);
    return { url: current, status: res.status, contentType: type, text };
  }
  throw new Error(`Too many redirects (>${MAX_REDIRECTS}) fetching ${url}`);
}
