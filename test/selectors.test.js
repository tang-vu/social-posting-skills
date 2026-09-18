import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { resolveSelector, resolveCandidates, matchesSelector } from "../src/browser/selectors.js";
import { buildPlaybook } from "../src/browser/playbook.js";
import { getPlatform } from "../src/core/platforms.js";
import { testCampaign } from "./helpers.js";
import { adaptCampaign } from "../src/core/adapt.js";

const FIXTURE_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")),
  "fixtures", "browser"
);

function loadFixture(name) {
  return JSON.parse(readFileSync(path.join(FIXTURE_DIR, name), "utf8"));
}

const X_SELECTORS = {
  composer: ["[data-testid='tweetTextarea_0']", "[role='textbox']"],
  postButton: ["[data-testid='tweetButtonInline']", "button:has-text('Post')"],
};

describe("selector resolver", () => {
  test("resolves primary candidate on unchanged UI", () => {
    const fx = loadFixture("x-composer-ok.json");
    const res = resolveCandidates(X_SELECTORS.composer, fx.dom);
    assert.equal(res.status, "resolved");
    assert.equal(res.selector, X_SELECTORS.composer[0]);
    const btn = resolveCandidates(X_SELECTORS.postButton, fx.dom);
    assert.equal(btn.status, "resolved");
  });

  test("changed UI falls back to secondary candidate", () => {
    const fx = loadFixture("x-composer-changed.json");
    const res = resolveCandidates(X_SELECTORS.composer, fx.dom);
    // primary testid renamed → secondary [role='textbox'] resolves
    assert.equal(res.status, "resolved");
    assert.equal(res.selector, "[role='textbox']");
    const btn = resolveCandidates(X_SELECTORS.postButton, fx.dom);
    assert.equal(btn.status, "resolved");
    assert.equal(btn.selector, "button:has-text('Post')");
  });

  test("duplicate matches are ambiguous — never pick one blindly", () => {
    const fx = loadFixture("x-duplicate-buttons.json");
    const res = resolveCandidates(X_SELECTORS.postButton, fx.dom);
    assert.equal(res.status, "ambiguous");
    assert.ok(res.attempts.some((a) => a.matchCount === 2));
  });

  test("challenge page resolves nothing postable — and is detectable", () => {
    const fx = loadFixture("x-challenge.json");
    assert.equal(resolveCandidates(X_SELECTORS.composer, fx.dom).status, "missing");
    assert.equal(resolveCandidates(X_SELECTORS.postButton, fx.dom).status, "missing");
    // challenge text is present (ancestors match too → resolved or ambiguous = detected)
    const challenge = resolveSelector("text=verify", fx.dom);
    assert.notEqual(challenge.status, "missing");
  });

  test("unsupported selector forms never match (no guessing)", () => {
    const fx = loadFixture("x-composer-ok.json");
    assert.equal(resolveSelector("xpath=//div[1]", fx.dom).status, "missing");
    assert.equal(matchesSelector({ tag: "div" }, "div >> span"), false);
  });
});

describe("playbook build", () => {
  test("playbook contains selectors, bounded waits, abort rules", () => {
    const c = testCampaign({ platforms: ["x"] });
    adaptCampaign(c);
    const pb = buildPlaybook(c, c.items[0], getPlatform("x"));
    assert.ok(pb.steps?.length >= 2);
    const json = JSON.stringify(pb);
    assert.match(json, /selectors/);
    assert.match(json, /abort/);
    assert.match(json, /challenge|captcha/i);
    assert.ok(pb.abortConditions.some((a) => /challenge/i.test(a.on)));
    assert.ok(pb.abortConditions.some((a) => /never re-submit|ambiguous-publish/i.test(a.on + a.do)));
    for (const step of pb.steps) {
      if (step.waitMs != null) assert.ok(step.waitMs <= 30000);
      if (step.timeoutMs != null) assert.ok(step.timeoutMs <= 120000);
    }
    // last-step verify: exactly-once confirmation is mandatory
    const verify = pb.steps.find((s) => s.action === "verify-published");
    assert.ok(verify, "playbook must end with a verify-published step");
    assert.match(verify.note, /unknown|exactly once/i);
  });
});
