// Minimal JSON API helper for official platform APIs.
// Timeouts always; no retries of side-effecting calls (a repost is worse
// than a reported failure); secrets come from ctx.env only.

export async function jsonFetch(url, {
  method = "GET",
  headers = {},
  body = null,
  timeoutMs = 15_000,
  fetchImpl = fetch,
} = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method,
      signal: ac.signal,
      headers: { "content-type": "application/json", ...headers },
      body: body == null ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-json */ }
    return { ok: res.ok, status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

export function requireEnv(env, names, platformName) {
  const missing = names.filter((n) => !env[n]);
  if (missing.length) {
    const err = new Error(
      `${platformName} API needs env vars: ${missing.join(", ")} — set them or use --mode manual`
    );
    err.code = "missing-credentials";
    throw err;
  }
}
