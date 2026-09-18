import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createCampaign, getItem, addItem, setStatus, refreshItemHash, campaignSummary, save, load } from "../src/core/campaign.js";
import { tempRoot, testCampaign } from "./helpers.js";

describe("campaign model", () => {
  test("createCampaign builds items per platform with ids", () => {
    const c = testCampaign();
    assert.equal(c.items.length, 3);
    assert.equal(c.items[0].platform, "x");
    assert.match(c.items[0].id, /::x$/);
    assert.equal(c.approval.state, "pending");
  });

  test("item ids are deterministic per platform+variant", () => {
    const c = testCampaign();
    const a = addItem(c, "x", { variant: "A" });
    assert.match(a.id, /::x:A$/);
  });

  test("getItem resolves by id, platform, or suffix", () => {
    const c = testCampaign();
    assert.equal(getItem(c, "x").platform, "x");
    assert.equal(getItem(c, c.items[0].id).platform, "x");
    assert.throws(() => getItem(c, "nope"), /not found/);
  });

  test("status transitions update approval state", () => {
    const c = testCampaign();
    setStatus(c, c.items[0], "approved");
    assert.equal(c.approval.state, "partial");
    setStatus(c, c.items[1], "approved");
    setStatus(c, c.items[2], "approved");
    assert.equal(c.approval.state, "approved");
  });

  test("content hash is deterministic and thread-aware", () => {
    const c = testCampaign();
    const item = c.items[0];
    item.content.body = "hello world";
    const h1 = refreshItemHash(item);
    const h2 = refreshItemHash(item);
    assert.equal(h1, h2);
    item.content.body = null;
    item.content.thread = [{ index: 0, text: "a" }, { index: 1, text: "b" }];
    const h3 = refreshItemHash(item);
    assert.notEqual(h1, h3);
    // whitespace/case-insensitive
    item.content.thread = [{ index: 0, text: " A " }, { index: 1, text: "B" }];
    assert.equal(refreshItemHash(item), h3);
  });

  test("save/load round-trips via store", () => {
    const root = tempRoot();
    const c = testCampaign();
    save(c, root);
    const loaded = load(c.id, root);
    assert.equal(loaded.id, c.id);
    assert.equal(loaded.items.length, 3);
    const summary = campaignSummary(loaded);
    assert.equal(summary.items.length, 3);
  });

  test("bad status rejected", () => {
    const c = testCampaign();
    assert.throws(() => setStatus(c, c.items[0], "bogus"), /Bad status/);
  });
});
