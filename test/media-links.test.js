import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { buildAssetEntry, validateMedia, assertAssetNameSafe } from "../src/core/media.js";
import { normalizeLink, withUtm, linkForPlatform, validateUrl } from "../src/core/links.js";
import { getPlatform } from "../src/core/platforms.js";
import { tempRoot, writePng, testCampaign } from "./helpers.js";

describe("media manifest", () => {
  test("asset entry captures dims, size, hash, alt text", () => {
    const dir = tempRoot();
    const p = writePng(dir, "demo.png", 1200, 675);
    const a = buildAssetEntry(p, { altText: "Demo screenshot" });
    assert.equal(a.width, 1200);
    assert.equal(a.height, 675);
    assert.equal(a.altText, "Demo screenshot");
    assert.ok(a.sha256?.length >= 16);
    assert.equal(a.provenance, "user-supplied");
  });

  test("missing file throws", () => {
    assert.throws(() => buildAssetEntry("/no/such/file.png"), /not found/i);
  });

  test("credential-looking filenames rejected", () => {
    for (const bad of ["id_rsa", "key.pem", "cert.p12", "credentials.json", "token.json", "cookies.txt", ".env", "app.key"]) {
      assert.throws(() => assertAssetNameSafe(bad), /sensitive/i, bad);
    }
    assert.doesNotThrow(() => assertAssetNameSafe("screenshot.png"));
  });

  test("per-platform media validation flags oversize", () => {
    const dir = tempRoot();
    const big = path.join(dir, "big.png");
    writeFileSync(big, Buffer.alloc(6 * 1024 * 1024)); // 6MB
    const assets = [buildAssetEntry(big, { altText: "x" })];
    const v = validateMedia(assets, getPlatform("bluesky"));
    assert.ok(v.errors.length >= 1);
    const ok = validateMedia(
      [buildAssetEntry(writePng(dir, "s.png", 800, 600), { altText: "x" })],
      getPlatform("x")
    );
    assert.equal(ok.errors.length, 0);
  });

  test("missing alt text → accessibility warning where platform supports it", () => {
    const dir = tempRoot();
    const a = buildAssetEntry(writePng(dir, "noalt.png", 800, 600));
    const v = validateMedia([a], getPlatform("x"));
    assert.ok(v.warnings.some((w) => /alt text/i.test(w)));
  });
});

describe("links + UTM", () => {
  test("normalizeLink accepts string or object", () => {
    assert.equal(normalizeLink("https://a.b/x").url, "https://a.b/x");
    assert.equal(normalizeLink({ url: "https://a.b", label: "Site", canonical: true }).canonical, true);
  });

  test("UTM params deterministic + transparent", () => {
    const u1 = withUtm("https://a.b/p", { platform: "x", campaignSlug: "camp-1" });
    const u2 = withUtm("https://a.b/p", { platform: "x", campaignSlug: "camp-1" });
    assert.equal(u1, u2);
    assert.match(u1, /utm_source=x/);
    assert.match(u1, /utm_medium=social/);
    assert.match(u1, /utm_campaign=camp-1/);
    const u3 = withUtm("https://a.b/p?existing=1", { platform: "reddit", campaignSlug: "c" });
    assert.match(u3, /existing=1/);
    assert.match(u3, /utm_source=reddit/);
  });

  test("linkForPlatform returns canonical + UTM-tagged url", () => {
    const c = testCampaign({ platforms: ["x"] });
    const link = linkForPlatform(c, "x");
    assert.match(link.url, /^https:\/\/example\.com\/repo/);
    assert.match(link.url, /utm_source=x/);
  });

  test("validateUrl returns error string or null", () => {
    assert.match(validateUrl("javascript:alert(1)"), /scheme/i);
    assert.match(validateUrl("notaurl"), /invalid/i);
    assert.equal(validateUrl("https://github.com/a/b"), null);
  });
});
