import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { adaptCampaign } from "../src/core/adapt.js";
import { validateItem, validateCampaign } from "../src/core/validate.js";
import { approveItems, approvalPackage } from "../src/core/approve.js";
import { testCampaign, tempRoot } from "./helpers.js";
import { buildAssetEntry } from "../src/core/media.js";
import { writeFileSync } from "node:fs";
import path from "node:path";

describe("validation engine", () => {
  test("over-limit body errors with char usage", () => {
    const c = testCampaign({ platforms: ["bluesky"] });
    adaptCampaign(c);
    const item = c.items[0];
    item.content.thread = null;
    item.content.body = "x".repeat(400); // bluesky limit 300
    const v = validateItem(c, item);
    assert.ok(v.errors.some((e) => /limit|chars/i.test(e)));
    assert.ok(v.charUsage.body.len > v.charUsage.body.max);
  });

  test("thread posts each validated against limit", () => {
    const c = testCampaign({ platforms: ["x"] });
    adaptCampaign(c);
    const item = c.items[0];
    item.content.thread = [{ index: 0, text: "ok" }, { index: 1, text: "y".repeat(300) }];
    const v = validateItem(c, item);
    assert.ok(v.errors.some((e) => /1|post 2|thread/i.test(e)));
  });

  test("missing required fields error (reddit title)", () => {
    const c = testCampaign({ platforms: ["reddit"] });
    adaptCampaign(c);
    const item = c.items[0];
    item.content.title = null;
    const v = validateItem(c, item);
    assert.ok(v.errors.some((e) => /title/i.test(e)));
  });

  test("declared disclosures not visible → warning", () => {
    const c = testCampaign({ platforms: ["linkedin"] });
    adaptCampaign(c);
    const item = c.items[0];
    item.content.disclosures = ["Sponsored"];
    item.content.body = "Check out Widget."; // disclosure stripped
    const v = validateItem(c, item);
    assert.ok(v.warnings.some((w) => /disclosure/i.test(w)));
  });

  test("unresolved mediaRefs warn; oversized resolved asset errors", () => {
    const c = testCampaign({ platforms: ["bluesky"] });
    adaptCampaign(c);
    const item = c.items[0];
    item.content.mediaRefs = ["ghost-ref"];
    let v = validateItem(c, item);
    assert.ok(v.warnings.some((w) => /mediaRefs|resolve/i.test(w)));

    const dir = tempRoot();
    const big = path.join(dir, "big.png");
    writeFileSync(big, Buffer.alloc(2 * 1024 * 1024)); // 2MB > bluesky 1MB
    const asset = buildAssetEntry(big, { altText: "x" });
    c.assets = [asset];
    item.content.mediaRefs = [asset.id];
    v = validateItem(c, item);
    assert.ok(v.errors.some((e) => /MB|over/i.test(e)));
  });

  test("approval cannot approve invalid items", () => {
    const c = testCampaign({ platforms: ["bluesky"] });
    adaptCampaign(c);
    c.items[0].content.body = "x".repeat(999);
    const { approved, skipped } = approveItems(c, "all");
    assert.equal(approved.length, 0);
    assert.equal(skipped.length, 1);
    assert.equal(c.items[0].status, "draft");
  });

  test("approval package shows method, warnings, char usage", () => {
    const c = testCampaign({ platforms: ["x", "linkedin"] });
    adaptCampaign(c);
    const pkg = approvalPackage(c);
    assert.equal(pkg.items.length, 2);
    assert.ok(pkg.items.every((i) => i.publishMode));
    assert.ok(pkg.items.every((i) => "charUsage" in i && "warnings" in i));
    assert.ok(pkg.readyCount <= pkg.itemCount);
  });

  test("validateCampaign covers all items", () => {
    const c = testCampaign({ platforms: ["x", "bluesky", "reddit"] });
    adaptCampaign(c);
    const out = validateCampaign(c);
    assert.ok(Array.isArray(out.errors) && Array.isArray(out.warnings));
    for (const item of c.items) {
      assert.ok(item.validation?.checkedAt, `${item.platform} was validated`);
    }
  });
});
