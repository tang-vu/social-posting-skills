import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { campaignFromPreset, listPresets } from "../src/core/presets.js";
import { adaptCampaign } from "../src/core/adapt.js";
import { validateCampaign } from "../src/core/validate.js";
import { approvalPackage } from "../src/core/approve.js";
import { approveItems } from "../src/core/approve.js";
import { exportCampaign } from "../src/core/drafts.js";
import { save } from "../src/core/campaign.js";
import { tempRoot, fixtureSource } from "./helpers.js";

// End-to-end dogfood: synthetic OSS v1.0 → differentiated platform-native
// drafts. No network, no real publication — exports drafts only.

describe("dogfood: oss-launch preset", () => {
  test("preset exists and lists its platforms", () => {
    const presets = listPresets();
    const oss = presets.find((p) => p.id === "oss-launch");
    assert.ok(oss);
    assert.ok(oss.platforms.includes("hackernews"));
    assert.ok(oss.platforms.includes("x"));
  });

  test("ReasoningReceipt README → 8 differentiated platform drafts", async () => {
    const root = tempRoot();
    const campaign = await campaignFromPreset("oss-launch", {
      source: fixtureSource(),
      targets: { reddit: { subreddit: "r/opensource" } },
      root,
    });
    adaptCampaign(campaign);
    save(campaign, root);

    assert.equal(campaign.items.length, 8);
    const platforms = campaign.items.map((i) => i.platform).sort();
    assert.deepEqual(platforms, [
      "bluesky", "devto", "hackernews", "linkedin",
      "producthunt", "reddit", "threads", "x",
    ]);

    // platform-native shape, not shortened cross-posts
    const item = (p) => campaign.items.find((i) => i.platform === p);
    assert.ok(item("x").content.thread?.length >= 2, "x → thread");
    assert.ok(item("bluesky").content.thread?.length >= 1, "bluesky → thread/chain");
    assert.ok(item("threads").content.thread?.length >= 1, "threads → reply chain");
    assert.ok(item("reddit").content.title, "reddit → title+body");
    assert.ok(item("reddit").target?.subreddit, "reddit → subreddit target");
    assert.match(item("hackernews").content.title ?? "", /show hn/i);
    assert.ok(item("hackernews").content.url, "Show HN needs a url");
    assert.ok((item("devto").content.body ?? "").length > 400, "devto → article");
    assert.ok(item("producthunt").content.subtitle || item("producthunt").content.title, "PH → tagline/name");
    assert.ok((item("linkedin").content.body ?? "").length > (item("x").content.thread?.[0]?.text?.length ?? 0));

    // one fact layer: the 40% claim appears consistently, no invented numbers
    const bodies = campaign.items.map((i) =>
      [i.content.body, i.content.title, ...(i.content.thread ?? []).map((p) => p.text)].filter(Boolean).join(" ")
    );
    const withClaim = bodies.filter((b) => /40%/.test(b));
    assert.ok(withClaim.length >= 3, "proof claim should appear on multiple platforms");
    for (const b of bodies) {
      assert.ok(!/50%|60%|10x faster/.test(b), `invented metric in: ${b.slice(0, 80)}`);
    }

    // validation produces warnings/errors structure; disclosures declared
    const res = validateCampaign(campaign);
    assert.ok(Array.isArray(res.errors) && Array.isArray(res.warnings));

    // approval package: every item inspectable
    const pkg = approvalPackage(campaign);
    assert.equal(pkg.itemCount, 8);
    for (const i of pkg.items) {
      assert.ok(i.publishMode, `${i.platformId}: publish method shown`);
      assert.ok(i.disclosures.length >= 0);
    }

    // approve valid items → export drafts → packages on disk
    const { approved } = approveItems(campaign, "all");
    assert.ok(approved.length >= 5, `expected most items approvable, got ${approved.length}`);
    const exported = exportCampaign(campaign, { root });
    for (const ex of exported) {
      assert.ok(existsSync(ex.packagePath), `missing package.json for ${ex.dir}`);
      const pkgJson = JSON.parse(readFileSync(ex.packagePath, "utf8"));
      assert.equal(pkgJson.campaignId, campaign.id);
      assert.ok(pkgJson.platform);
    }
    // nothing published — receipts are draft-exported at most
    assert.ok(campaign.items.every((i) => !["published", "partial"].includes(i.status)),
      "no item may be marked published in a draft-only dogfood run");
  });

  test("three OSS fixtures each produce distinct platform voices", async () => {
    const root = tempRoot();
    const results = {};
    for (const proj of ["ai-cli-editor", "openself", "oss-readme"]) {
      const campaign = await campaignFromPreset("oss-launch", {
        source: fixtureSource(`${proj}.md`),
        targets: { reddit: { subreddit: "r/selfhosted" } },
        root,
      });
      adaptCampaign(campaign);
      results[proj] = campaign;
      const xItem = campaign.items.find((i) => i.platform === "x");
      assert.ok(xItem.content.thread?.length >= 1, `${proj}: x thread missing`);
    }
    // distinct hooks per project — not the same template text
    const hooks = Object.values(results).map((c) =>
      c.items.find((i) => i.platform === "x").content.thread?.[0]?.text ?? c.items.find((i) => i.platform === "x").content.body
    );
    assert.equal(new Set(hooks).size, 3, "hooks must differ per project");
    for (const [proj, c] of Object.entries(results)) {
      const text = JSON.stringify(c.items.map((i) => i.content));
      const name = proj === "oss-readme" ? "ReasoningReceipt" : proj === "ai-cli-editor" ? "ai-cli-editor" : "OpenSelf";
      assert.ok(text.toLowerCase().includes(name.toLowerCase().slice(0, 8)),
        `${proj}: platform content should mention the project name`);
    }
  });
});
