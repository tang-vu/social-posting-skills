import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { adaptCampaign, adaptItem } from "../src/core/adapt.js";
import { testCampaign } from "./helpers.js";

describe("platform adaptation", () => {
  test("each platform gets differentiated native output", () => {
    const c = testCampaign({ platforms: ["x", "linkedin", "reddit", "hackernews", "bluesky"] });
    adaptCampaign(c);
    const bodies = c.items.map((i) => i.content.body ?? i.content.thread?.map((p) => p.text).join(" "));
    assert.equal(new Set(bodies).size, bodies.length, "platform outputs must differ");

    const x = c.items.find((i) => i.platform === "x");
    assert.ok(x.content.thread?.length >= 2, "x should produce a thread");
    const hn = c.items.find((i) => i.platform === "hackernews");
    assert.match(hn.content.title ?? hn.content.body ?? "", /Show HN|Widget/i);
    const reddit = c.items.find((i) => i.platform === "reddit");
    assert.ok(reddit.content.title, "reddit needs a title");
  });

  test("facts stay consistent — no invented claims per platform", () => {
    const c = testCampaign({ platforms: ["x", "linkedin", "devto"] });
    adaptCampaign(c);
    const linkedin = c.items.find((i) => i.platform === "linkedin").content.body;
    assert.match(linkedin, /40% faster/); // same fact layer everywhere
  });

  test("adaptCampaign keeps authored edits unless overwrite", () => {
    const c = testCampaign({ platforms: ["x"] });
    adaptCampaign(c);
    const item = c.items[0];
    item.content.body = "hand-edited";
    item.content.thread = null;
    adaptCampaign(c); // default: keep authored content
    assert.equal(item.content.body, "hand-edited");
    adaptCampaign(c, { overwrite: true });
    assert.notEqual(item.content.body, "hand-edited");
  });
});
