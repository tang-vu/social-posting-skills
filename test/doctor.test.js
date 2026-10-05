import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectDoctorReport, renderDoctorText } from "../src/interfaces/doctor.js";

const CLI = fileURLToPath(new URL("../bin/cli.js", import.meta.url));
const SECRET = "sensitive-canary-never-print-86bdb33";
const projectTarget = { project: (root) => path.join(root, ".agents") };

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "sps-doctor-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, ".gitignore"), ".social-campaigns/\nposts/\n");
  return root;
}

function report(root, options = {}) {
  return collectDoctorReport(root, {
    env: {}, readGitVersion: () => "git version 2.49.0", installTargets: projectTarget, ...options,
  });
}

function check(result, id) {
  const found = result.checks.find((c) => c.id === id);
  assert.ok(found, `missing check ${id}`);
  return found;
}

function assertContract(result) {
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.ok, result.summary.fail === 0);
  assert.equal(result.exitCode, result.ok ? 0 : 1);
  assert.equal(new Set(result.checks.map((c) => c.id)).size, result.checks.length);
  const totals = { pass: 0, fail: 0, warn: 0, info: 0 };
  for (const c of result.checks) {
    assert.deepEqual(Object.keys(c), ["id", "name", "status", "detail", "remediation"]);
    assert.match(c.id, /^[a-z][a-z0-9.-]+$/);
    assert.equal(typeof c.name, "string");
    assert.equal(typeof c.detail, "string");
    assert.ok(Object.hasOwn(totals, c.status));
    assert.ok(c.remediation === null || typeof c.remediation === "string");
    if (c.status === "fail" || c.status === "warn") assert.ok(c.remediation);
    totals[c.status]++;
  }
  assert.deepEqual(result.summary, totals);
}

test("report has a stable contract and missing optional credentials do not fail", (t) => {
  const result = report(fixture(t));
  assertContract(result);
  assert.equal(result.exitCode, 0);
  assert.equal(check(result, "skills.project").status, "info");
  assert.equal(check(result, "api.bluesky").status, "info");
  assert.match(check(result, "api.bluesky").remediation, /BSKY_HANDLE.*BSKY_APP_PASSWORD/);
  assert.match(renderDoctorText(result), /social-posting-skills doctor[\s\S]*skill installs:[\s\S]*API credentials \(env\):[\s\S]*secret hygiene:[\s\S]*doctor: all good/);
});

test("runtime failure produces exit 1 and actionable remediation", (t) => {
  const result = report(fixture(t), { nodeVersion: "16.20.2" });
  assertContract(result);
  assert.equal(result.exitCode, 1);
  assert.equal(check(result, "runtime.node").status, "fail");
  assert.match(renderDoctorText(result), /\[FAIL\].*node >= 18[\s\S]*doctor: 1 failure\(s\)/);
});

test("Git errors and arbitrary version output are non-fatal and never echoed", (t) => {
  const root = fixture(t);
  for (const readGitVersion of [() => { throw new Error(SECRET); }, () => SECRET]) {
    const result = report(root, { readGitVersion });
    assert.equal(result.exitCode, 0);
    assert.equal(check(result, "runtime.git").status, "warn");
    assert.ok(!JSON.stringify(result).includes(SECRET));
  }
});

test("platform and adapter read failures stay in the report and later checks run", (t) => {
  const result = report(fixture(t), {
    readPlatforms: () => { throw new Error(SECRET); },
    readAdapters: () => { throw new Error(SECRET); },
  });
  assertContract(result);
  assert.equal(result.summary.fail, 2);
  assert.equal(check(result, "store.writable").status, "pass");
  assert.equal(check(result, "safety.secret-files").status, "pass");
  assert.ok(!JSON.stringify(result).includes(SECRET));
});

test("empty or malformed platform metadata and adapter ID mismatches fail honestly", (t) => {
  const root = fixture(t);
  for (const readPlatforms of [() => [], () => null, () => [{ id: "example" }]]) {
    const result = report(root, { readPlatforms });
    assertContract(result);
    assert.equal(check(result, "platforms.metadata").status, "fail");
  }
  const readPlatforms = () => [{ id: "example", verification: { lastReviewed: "2026-10-01" }, capabilities: { publish: ["manual"] } }];
  for (const readAdapters of [() => null, () => [{ id: "other" }], () => [{ id: "example" }, { id: "example" }]]) {
    const result = report(root, { readPlatforms, readAdapters });
    assertContract(result);
    assert.equal(check(result, "adapters.registry").status, "fail");
  }
});

test("store failures do not suppress safety or credential checks", (t) => {
  const root = fixture(t);
  writeFileSync(path.join(root, ".social-campaigns"), SECRET);
  const result = report(root);
  assertContract(result);
  assert.equal(result.exitCode, 1);
  assert.equal(check(result, "store.writable").status, "fail");
  assert.equal(check(result, "api.devto").status, "info");
  assert.equal(check(result, "safety.secret-files").status, "pass");
  assert.equal(readFileSync(path.join(root, ".social-campaigns"), "utf8"), SECRET);
  assert.ok(!JSON.stringify(result).includes(SECRET));
});

test("store probes preserve existing .probe and clean up only their own files", (t) => {
  const root = fixture(t);
  const store = path.join(root, ".social-campaigns");
  mkdirSync(store);
  writeFileSync(path.join(store, ".probe"), SECRET);
  assert.equal(report(root).exitCode, 0);
  assert.equal(report(root).exitCode, 0);
  assert.deepEqual(readdirSync(store), [".probe"]);
  assert.equal(readFileSync(path.join(store, ".probe"), "utf8"), SECRET);
});

test("project install inspection uses the supplied root, not process.cwd", (t) => {
  const root = fixture(t);
  const dir = path.join(root, ".agents", "skills");
  mkdirSync(dir, { recursive: true });
  let inspected;
  const result = report(root, { readInstallDrift: (target) => {
    inspected = target;
    return { status: "current", manifest: { version: SECRET } };
  } });
  assert.equal(inspected, dir);
  assert.equal(check(result, "skills.project").status, "pass");
  assert.ok(!JSON.stringify(result).includes(SECRET));
});

test("malformed install manifests warn instead of aborting or leaking file contents", (t) => {
  const root = fixture(t);
  const dir = path.join(root, ".agents", "skills");
  mkdirSync(dir, { recursive: true });
  for (const content of [SECRET, JSON.stringify({ skills: {} }), JSON.stringify({ skills: [null] })]) {
    writeFileSync(path.join(dir, ".social-skills-manifest.json"), content);
    const result = report(root);
    assertContract(result);
    assert.equal(result.exitCode, 0);
    assert.equal(check(result, "skills.project").status, "warn");
    assert.equal(check(result, "safety.secret-files").status, "pass");
    assert.ok(!JSON.stringify(result).includes(SECRET));
  }
});

test("install drift reports count and remediation without manifest-provided values", (t) => {
  const root = fixture(t);
  mkdirSync(path.join(root, ".agents", "skills"), { recursive: true });
  const result = report(root, { readInstallDrift: () => ({ status: "drift", findings: [{ skill: SECRET, status: "stale" }] }) });
  assert.equal(check(result, "skills.project").status, "warn");
  assert.match(check(result, "skills.project").detail, /1 finding/);
  assert.ok(!JSON.stringify(result).includes(SECRET));
});

test("credentials only report presence; unimplemented APIs never claim readiness", (t) => {
  const result = report(fixture(t), { env: {
    BSKY_HANDLE: SECRET, BSKY_APP_PASSWORD: SECRET, DEVTO_API_KEY: SECRET,
    LINKEDIN_ACCESS_TOKEN: SECRET, LINKEDIN_AUTHOR_URN: SECRET,
  } });
  assertContract(result);
  assert.equal(check(result, "api.bluesky").status, "pass");
  assert.equal(check(result, "api.devto").status, "pass");
  assert.match(check(result, "api.bluesky").detail, /authentication not tested/);
  assert.equal(check(result, "api.linkedin").status, "info");
  assert.match(check(result, "api.linkedin").detail, /not implemented/);
  assert.ok(!JSON.stringify(result).includes(SECRET));
  assert.ok(!renderDoctorText(result).includes(SECRET));
});

test("empty and whitespace-only credentials remain missing", (t) => {
  const result = report(fixture(t), { env: { BSKY_HANDLE: " ", BSKY_APP_PASSWORD: "", DEVTO_API_KEY: "\t" } });
  assert.equal(check(result, "api.bluesky").status, "info");
  assert.match(check(result, "api.bluesky").detail, /BSKY_HANDLE, BSKY_APP_PASSWORD/);
  assert.equal(check(result, "api.devto").status, "info");
});

test("secret-file checks only report counts, never filenames or contents", (t) => {
  const root = fixture(t);
  writeFileSync(path.join(root, `.env.${SECRET}`), SECRET);
  writeFileSync(path.join(root, "credentials.json"), SECRET);
  const result = report(root);
  assert.equal(result.exitCode, 0);
  assert.equal(check(result, "safety.secret-files").status, "warn");
  assert.match(check(result, "safety.secret-files").detail, /2 sensitive-looking/);
  assert.ok(!JSON.stringify(result).includes(SECRET));
  assert.ok(!renderDoctorText(result).includes(SECRET));
});

test("commented and negated ignore entries do not count as declarations", (t) => {
  const root = fixture(t);
  writeFileSync(path.join(root, ".gitignore"), "# .social-campaigns/\n!.social-campaigns/\n# posts/\n!posts/\n");
  const result = report(root);
  assert.equal(check(result, "safety.gitignore.campaigns").status, "warn");
  assert.equal(check(result, "safety.gitignore.posts").status, "info");
  writeFileSync(path.join(root, ".gitignore"), "/.social-campaigns/\r\n/posts/\r\n");
  const declared = report(root);
  assert.equal(check(declared, "safety.gitignore.campaigns").status, "pass");
  assert.match(check(declared, "safety.gitignore.campaigns").detail, /effective Git rules not verified/);
});

test("unreadable ignore file remains a warning and later diagnostics run", (t) => {
  const root = fixture(t);
  rmSync(path.join(root, ".gitignore"));
  mkdirSync(path.join(root, ".gitignore"));
  const result = report(root);
  assert.equal(result.exitCode, 0);
  assert.equal(check(result, "safety.gitignore.campaigns").status, "warn");
  assert.equal(check(result, "safety.secret-files").status, "pass");
});

for (const flag of ["--json", "--ci"]) {
  test(`CLI doctor ${flag} emits exactly one JSON report, no stderr, and correct exits`, (t) => {
    const root = fixture(t);
    const env = { ...process.env, HOME: root, USERPROFILE: root, PATH: "", BSKY_HANDLE: SECRET,
      BSKY_APP_PASSWORD: SECRET, DEVTO_API_KEY: SECRET };
    for (const expected of [0, 1]) {
      if (expected) {
        rmSync(path.join(root, ".social-campaigns"), { recursive: true });
        writeFileSync(path.join(root, ".social-campaigns"), SECRET);
      }
      const child = spawnSync(process.execPath, [CLI, "doctor", flag], { cwd: root, env, encoding: "utf8", timeout: 30000 });
      assert.equal(child.error, undefined);
      assert.equal(child.status, expected, child.stderr);
      assert.equal(child.stderr, "");
      const result = JSON.parse(child.stdout);
      assertContract(result);
      assert.equal(result.exitCode, expected);
      assert.equal(check(result, "runtime.git").status, "warn");
      assert.ok(!child.stdout.includes(SECRET));
    }
  });
}
