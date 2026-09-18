import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { recordObservation, addLearning, listLearnings, summarizeLearnings, variantComparison } from "../src/core/learnings.js";
import { setSchedule, clearSchedule, dueItems, calendarView } from "../src/core/schedule.js";
import { tempRoot, testCampaign } from "./helpers.js";
import { addItem } from "../src/core/campaign.js";

describe("learnings", () => {
  test("recordObservation stores metrics as observed facts", () => {
    const c = testCampaign({ platforms: ["x"] });
    const obs = recordObservation(c, {
      itemId: c.items[0].id, postUrl: "https://x.com/u/status/1",
      metrics: { views: 1200, likes: 40, replies: 5, bogus: "not-a-metric" },
    });
    assert.equal(obs.metrics.views, 1200);
    assert.equal(obs.platform, "x");
    assert.equal(obs.metrics.bogus, undefined, "unknown metric keys dropped");
    assert.equal(c.observations.length, 1);
  });

  test("addLearning separates observed vs inferred", () => {
    const root = tempRoot();
    addLearning({ root, platform: "x", text: "Threads with a demo link got more replies", kind: "inferred", campaignId: "c1" });
    addLearning({ root, platform: "x", text: "Post shipped at 14:00 UTC", kind: "observed", campaignId: "c1" });
    const all = listLearnings(root);
    assert.equal(all.length, 2);
    assert.equal(listLearnings(root, { platform: "x" }).length, 2);
    const summary = summarizeLearnings(root);
    assert.equal(summary.total, 2);
    assert.equal(summary.byPlatform.x.observed.length, 1);
    assert.equal(summary.byPlatform.x.inferred.length, 1);
    assert.match(summary.caveat, /not causal/i);
    assert.throws(() => addLearning({ root, text: "x", kind: "guessing" }), /kind/);
  });

  test("variantComparison compares A/B items by observed metrics", () => {
    const c = testCampaign({ platforms: ["x"] });
    const b = addItem(c, "x", { variant: "B" });
    recordObservation(c, { itemId: c.items[0].id, metrics: { views: 100 } });
    recordObservation(c, { itemId: b.id, metrics: { views: 250 } });
    const cmp = variantComparison(c);
    assert.equal(cmp.variants.default.totals.views, 100);
    assert.equal(cmp.variants.B.totals.views, 250);
    assert.match(cmp.caveat, /not statistically|small samples|generalize/i);
  });
});

describe("schedule + calendar", () => {
  test("setSchedule persists explicit intent with IANA timezone", () => {
    const c = testCampaign({ platforms: ["x"] });
    setSchedule(c, "x", { plannedAt: "2030-06-01T14:00:00Z", timezone: "America/New_York" });
    const item = c.items[0];
    assert.equal(item.plannedAt, "2030-06-01T14:00:00.000Z");
    assert.equal(item.timezone, "America/New_York");
    assert.equal(c.schedule.entries.length, 1);
    assert.equal(c.schedule.entries[0].itemId, item.id);
  });

  test("bad timezone and bad date rejected", () => {
    const c = testCampaign({ platforms: ["x"] });
    assert.throws(() => setSchedule(c, "x", { plannedAt: "2030-01-01T00:00:00Z", timezone: "Mars/Olympus" }), /timezone/i);
    assert.throws(() => setSchedule(c, "x", { plannedAt: "not-a-date" }), /plannedAt|bad/i);
  });

  test("dueItems finds approved+planned items at/past now; clearSchedule removes", () => {
    const c = testCampaign({ platforms: ["x", "linkedin"] });
    c.items.forEach((i) => (i.status = "approved"));
    setSchedule(c, "x", { plannedAt: "2020-01-01T00:00:00Z", timezone: "UTC" });
    setSchedule(c, "linkedin", { plannedAt: "2999-01-01T00:00:00Z", timezone: "UTC" });
    const due = dueItems([c], { now: new Date("2025-01-01") });
    assert.equal(due.length, 1);
    assert.equal(due[0].platform, "x");
    clearSchedule(c, "x");
    assert.equal(c.items[0].plannedAt, null);
    assert.equal(dueItems([c], { now: new Date("2025-01-01") }).length, 0);
  });

  test("dueItems skips non-approved items — scheduling never publishes", () => {
    const c = testCampaign({ platforms: ["x"] });
    setSchedule(c, "x", { plannedAt: "2020-01-01T00:00:00Z", timezone: "UTC" });
    assert.equal(dueItems([c], { now: new Date() }).length, 0); // still draft
  });

  test("calendarView returns rows sorted by when", () => {
    const c = testCampaign({ platforms: ["x", "linkedin", "reddit"] });
    setSchedule(c, "x", { plannedAt: "2030-03-10T10:00:00Z", timezone: "UTC" });
    const rows = calendarView([c]);
    assert.equal(rows.length, 3);
    const x = rows.find((r) => r.platform === "x");
    assert.equal(x.planned, true);
    assert.equal(x.when, "2030-03-10T10:00:00.000Z");
  });
});
