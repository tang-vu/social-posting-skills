import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { runInstall, readInstallManifest, installDrift, skillsSourceDir } from "../src/interfaces/install.js";
import { loadPlatforms, platformIds } from "../src/core/platforms.js";
import { listAdapters, getAdapter } from "../src/adapters/registry.js";
import { tempRoot } from "./helpers.js";

const SKILLS_SRC = skillsSourceDir();

describe("skill manifests", () => {
  const skillDirs = readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name);

  test("every skill has SKILL.md + skill.json with required fields", () => {
    assert.ok(skillDirs.length >= 15, `expected ≥15 skills, found ${skillDirs.length}`);
    for (const name of skillDirs) {
      const dir = path.join(SKILLS_SRC, name);
      assert.ok(existsSync(path.join(dir, "SKILL.md")), `${name}: missing SKILL.md`);
      const manifestPath = path.join(dir, "skill.json");
      assert.ok(existsSync(manifestPath), `${name}: missing skill.json`);
      const m = JSON.parse(readFileSync(manifestPath, "utf8"));
      for (const field of ["name", "description", "version"]) {
        assert.ok(m[field], `${name}: manifest missing ${field}`);
      }
      assert.equal(m.name, name, `${name}: manifest name mismatch`);
    }
  });

  test("post-* skills reference a real platform id", () => {
    const ids = new Set(platformIds());
    for (const name of skillDirs.filter((n) => n.startsWith("post-"))) {
      const m = JSON.parse(readFileSync(path.join(SKILLS_SRC, name, "skill.json"), "utf8"));
      const platform = m.platform ?? name.replace(/^post-/, "");
      assert.ok(ids.has(platform), `${name}: unknown platform "${platform}"`);
    }
  });

  test("SKILL.md files do not hardcode char limits (data lives in platforms/)", () => {
    // a few spot checks: the canonical skills must not scatter numbers
    for (const name of ["post-x", "post-bluesky", "post-linkedin"]) {
      const md = readFileSync(path.join(SKILLS_SRC, name, "SKILL.md"), "utf8");
      // limit numbers should be referenced via platforms/*.json, not inlined
      assert.ok(!/\b280\b|\b3000\b|\b300\b(?!\d)/.test(md) || /platforms\//.test(md),
        `${name}: appears to hardcode a char limit without referencing platform data`);
    }
  });
});

describe("platform metadata", () => {
  test("all 12 platform files parse and carry required keys", () => {
    const platforms = loadPlatforms({ reload: true });
    assert.equal(platforms.size, 12);
    for (const p of platforms.values()) {
      for (const key of ["id", "displayName", "verification", "constraints", "media", "links", "capabilities", "publishing", "culture"]) {
        assert.ok(key in p, `${p.id}: missing metadata key ${key}`);
      }
      assert.ok(p.verification?.lastReviewed, `${p.id}: no lastReviewed date`);
    }
  });

  test("adapter registry: api only where implemented", () => {
    const adapters = listAdapters();
    assert.equal(adapters.length, 12);
    for (const a of adapters) {
      const caps = a.capabilities();
      if (caps.publish.includes("api")) {
        assert.ok(a.hasApi(), `${a.id}: advertises api without implementation`);
      }
    }
    const apiPlatforms = adapters.filter((a) => a.capabilities().publish.includes("api")).map((a) => a.id).sort();
    assert.deepEqual(apiPlatforms, ["bluesky", "devto"]);
  });
});

describe("installer", () => {
  test("installs bundled skills to custom path + writes manifest", () => {
    const root = tempRoot();
    const dest = path.join(root, "skills-out");
    const code = runInstall(["--path", dest], { root });
    assert.equal(code, 0);
    assert.ok(existsSync(path.join(dest, "social-campaign", "SKILL.md")));
    const manifest = readInstallManifest(dest);
    assert.ok(manifest.skills.length >= 15);
    assert.equal(installDrift(dest).status, "current");
  });

  test("drift detection flags stale installs (recorded hash ≠ bundled)", () => {
    const root = tempRoot();
    const dest = path.join(root, "skills-out");
    runInstall(["--path", dest], { root });
    // simulate an older install: recorded hash no longer matches bundled source
    const manifestFile = path.join(dest, ".social-skills-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    manifest.skills.find((s) => s.name === "post-x").hash = "deadbeef";
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    const drift = installDrift(dest);
    assert.equal(drift.status, "drift");
    assert.ok(drift.findings.some((f) => f.skill === "post-x" && f.status === "stale"));
  });

  test("project target also installs workflows + posts dirs", () => {
    const root = tempRoot();
    const code = runInstall(["--project"], { root });
    assert.equal(code, 0);
    assert.ok(existsSync(path.join(root, ".agents", "skills", "social-campaign", "SKILL.md")));
    assert.ok(existsSync(path.join(root, ".agents", "workflows")));
    assert.ok(existsSync(path.join(root, "posts", "drafts")));
  });
});
