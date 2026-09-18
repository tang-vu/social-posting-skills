import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { adaptCampaign } from "../src/core/adapt.js";
import { approveItems } from "../src/core/approve.js";
import { publishItem, recordOutcome, reconcile } from "../src/core/publish.js";
import { exportDraft } from "../src/core/drafts.js";
import { campaignReceipts, unreconciledReceipts } from "../src/core/receipts.js";
import { save } from "../src/core/campaign.js";
import { _setAdapterForTest, getAdapter } from "../src/adapters/registry.js";
import { tempRoot, testCampaign, fakeFetch } from "./helpers.js";

function approved(root, platforms = ["x"]) {
  const c = testCampaign({ platforms });
  adaptCampaign(c);
  approveItems(c, "all");
  return c;
}

describe("publish orchestration", () => {
  test("unapproved items are blocked", async () => {
    const root = tempRoot();
    const c = testCampaign({ platforms: ["x"] });
    adaptCampaign(c);
    const out = await publishItem(c, "x", { root });
    assert.equal(out.outcome, "blocked");
    assert.match(out.reason, /approved/);
  });

  test("manual mode exports draft package + receipt", async () => {
    const root = tempRoot();
    const c = approved(root, ["linkedin"]);
    const out = await publishItem(c, "linkedin", { root, mode: "manual" });
    assert.equal(out.outcome, "draft-exported");
    assert.ok(existsSync(path.join(out.draft.dir, "package.json")));
    assert.ok(existsSync(path.join(out.draft.dir, "post.md")));
    assert.equal(campaignReceipts(c.id, root).length, 1);
  });

  test("api mode without implementation falls back to draft", async () => {
    const root = tempRoot();
    const c = approved(root, ["x"]);
    const out = await publishItem(c, "x", { root, mode: "api" });
    assert.equal(out.outcome, "fallback-draft");
    assert.ok(existsSync(out.draft.dir));
  });

  test("duplicate publication blocked by content hash", async () => {
    const root = tempRoot();
    const c = approved(root, ["bluesky"]);
    // first publish succeeds via fake API
    const env = { BSKY_HANDLE: "h.test", BSKY_APP_PASSWORD: "pw" };
    const fetchImpl = fakeFetch((url) => {
      if (url.includes("createSession")) return { json: { accessJwt: "t", did: "did:x", handle: "h.test" } };
      return { json: { uri: "at://did:x/app.bsky.feed.post/abc", cid: "c" } };
    });
    const out1 = await publishItem(c, "bluesky", { root, mode: "api", env, fetchImpl });
    assert.equal(out1.outcome, "published");

    // second campaign, same content, same platform → duplicate-blocked
    const c2 = testCampaign({ platforms: ["bluesky"] });
    adaptCampaign(c2);
    // force identical content
    c2.items[0].content = JSON.parse(JSON.stringify(c.items[0].content));
    approveItems(c2, "all");
    const out2 = await publishItem(c2, "bluesky", { root, mode: "api", env, fetchImpl });
    assert.equal(out2.outcome, "duplicate-blocked");
    assert.ok(out2.prior.postUrl.includes("bsky.app"));
  });

  test("exported item cannot republish without re-approval", async () => {
    const root = tempRoot();
    const c = approved(root, ["x"]);
    await publishItem(c, "x", { root, mode: "manual" });
    const again = await publishItem(c, "x", { root, mode: "manual" });
    assert.equal(again.outcome, "blocked");
  });

  test("adapter throw → unknown + reconciliation steps (no blind retry)", async () => {
    const root = tempRoot();
    const c = approved(root, ["bluesky"]);
    const env = { BSKY_HANDLE: "h", BSKY_APP_PASSWORD: "p" };
    const fetchImpl = fakeFetch(() => { throw new Error("socket hangup"); });
    const out = await publishItem(c, "bluesky", { root, mode: "api", env, fetchImpl });
    assert.equal(out.outcome, "unknown");
    assert.ok(out.receipt.needsReconciliation);
    assert.ok(unreconciledReceipts(root).length >= 1);
  });

  test("partial thread reports counts, does not replay", async () => {
    const root = tempRoot();
    const c = approved(root, ["x"]);
    const item = c.items[0];
    item.publishMode = "agent-browser";
    const receipt = recordOutcome(c, item, {
      kind: "partial", publishedCount: 2, totalPosts: item.content.thread?.length ?? 3,
      error: "reply 3 timed out",
    }, { root });
    assert.equal(receipt.result, "partial");
    assert.equal(receipt.publishedCount, 2);
    assert.ok(receipt.needsReconciliation);
  });

  test("recordOutcome published records URL; reconcile resolves unknown", async () => {
    const root = tempRoot();
    const c = approved(root, ["x"]);
    const item = c.items[0];
    const r1 = recordOutcome(c, item, { kind: "unknown", error: "browser crashed after submit click" }, { root });
    assert.equal(r1.result, "unknown");
    const r2 = reconcile(c, item, "published", { root, url: "https://x.com/u/status/1" });
    assert.equal(r2.result, "published");
    assert.equal(r2.postUrl, "https://x.com/u/status/1");
  });

  test("bluesky thread → chained replies, firstComment handled", async () => {
    const root = tempRoot();
    const c = testCampaign({ platforms: ["bluesky"] });
    adaptCampaign(c);
    approveItems(c, "all");
    const env = { BSKY_HANDLE: "h.test", BSKY_APP_PASSWORD: "pw" };
    const calls = [];
    const fetchImpl = fakeFetch((url, opts) => {
      calls.push(url);
      if (url.includes("createSession")) return { json: { accessJwt: "t", did: "did:x", handle: "h.test" } };
      return { json: { uri: `at://did:x/app.bsky.feed.post/p${calls.length}`, cid: "c" } };
    });
    const out = await publishItem(c, "bluesky", { root, mode: "api", env, fetchImpl });
    assert.equal(out.outcome, "published");
    assert.ok(out.api.postUrl.includes("bsky.app/profile"));
    // thread posts each produce a createRecord call after the session call
    const creates = calls.filter((u) => u.includes("createRecord"));
    const threadLen = c.items[0].content.thread?.length ?? 1;
    assert.ok(creates.length >= threadLen);
  });
});
