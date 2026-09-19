// doctor — verifies the environment can run the whole pipeline safely:
// node version, platform data integrity, store writability, skill install
// state (incl. drift), API credential availability, and secret hygiene.

import { existsSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listPlatforms, platformIds } from "../core/platforms.js";
import { listAdapters } from "../adapters/registry.js";
import { ensureStore, storeRoot } from "../core/store.js";
import { INSTALL_TARGETS, installDrift } from "./install.js";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir() || "";

export function runDoctor(flags = {}, root = process.cwd()) {
  const checks = [];
  // level decides what a NOT-ok result means: "fail" counts, "warn"/"info" don't.
  const check = (name, ok, detail = "", level = "info") => {
    checks.push({ name, ok, detail, level });
    const mark = ok ? "ok " : level === "fail" ? "FAIL" : level === "warn" ? "warn" : "info";
    console.log(`  [${mark}] ${name}${detail ? " — " + detail : ""}`);
  };

  console.log("social-posting-skills doctor\n");

  // runtime
  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  check("node >= 18", nodeMajor >= 18, `v${process.versions.node}`, "fail");
  check("platform", true, `${process.platform} (${os.arch()})`);

  // git (optional)
  let gitOk = false;
  try {
    const v = execFileSync("git", ["--version"], { encoding: "utf8" }).trim();
    gitOk = true;
    check("git available", true, v);
  } catch {
    check("git available", false, "optional — only needed for git: sources", "warn");
  }

  // platform data
  try {
    const ids = platformIds();
    const bad = [];
    for (const id of ids) {
      const p = listPlatforms().find((x) => x.id === id);
      if (!p.verification?.lastReviewed) bad.push(`${id}:no-review-date`);
      if (!p.capabilities?.publish?.length) bad.push(`${id}:no-publish-modes`);
    }
    check("platform metadata", bad.length === 0, `${ids.length} platforms${bad.length ? " — issues: " + bad.join(", ") : ""}`, "fail");
  } catch (e) {
    check("platform metadata", false, e.message, "fail");
  }

  // adapters
  const adapters = listAdapters();
  check("adapters", adapters.length === platformIds().length,
    `${adapters.length} adapters for ${platformIds().length} platforms`, "fail");

  // store writable
  try {
    const dir = ensureStore(root);
    const probe = path.join(dir, ".probe");
    writeFileSync(probe, "ok");
    rmSync(probe);
    check("campaign store writable", true, storeRoot(root), "fail");
  } catch (e) {
    check("campaign store writable", false, e.message, "fail");
  }

  // skill install state per known target
  console.log("\n  skill installs:");
  for (const [name, fn] of Object.entries(INSTALL_TARGETS)) {
    const dir = name === "project" ? path.join(path.resolve(".agents"), "skills") : fn();
    if (!existsSync(dir)) {
      check(`  ${name}`, true, `not installed (${dir})`, "info");
      continue;
    }
    const drift = installDrift(dir);
    if (drift.status === "no-manifest") {
      check(`  ${name}`, false, `foreign contents, no manifest (${dir})`, "warn");
    } else if (drift.status === "current") {
      check(`  ${name}`, true, `current (v${drift.manifest.version})`);
    } else {
      check(`  ${name}`, false, `drift: ${drift.findings.map((f) => `${f.skill}:${f.status}`).join(", ")} — reinstall to fix`, "warn");
    }
  }

  // API readiness (env presence — values never printed)
  console.log("\n  API credentials (env):");
  const apiPlatforms = adapters.filter((a) => a.meta.publishing?.api?.available);
  for (const a of apiPlatforms) {
    const envNames = a.meta.publishing.api.env ?? [];
    if (!envNames.length) continue;
    const present = envNames.filter((n) => process.env[n]);
    const ready = present.length === envNames.length;
    check(
      `  ${a.id}`,
      ready || !a.hasApi(),
      ready
        ? `ready (${envNames.join(", ")})`
        : a.hasApi()
          ? `adapter exists; missing ${envNames.filter((n) => !process.env[n]).join(", ")} — manual/agent-browser still work`
          : `api not implemented; modes: ${a.capabilities().publish.join("+")}`,
      ready ? "info" : "info"
    );
  }

  // secret hygiene
  console.log("\n  secret hygiene:");
  const gitignore = existsSync(path.join(root, ".gitignore"))
    ? readFileSync(path.join(root, ".gitignore"), "utf8") : "";
  const campaignsIgnored = /\.social-campaigns/.test(gitignore);
  check("  .gitignore covers .social-campaigns", campaignsIgnored,
    campaignsIgnored ? "drafts/receipts stay local" : ".social-campaigns not in .gitignore",
    campaignsIgnored ? "info" : "warn");
  check("  .gitignore covers posts/", /^posts\/?$/m.test(gitignore) || /posts\//.test(gitignore), "legacy drafts dir", "info");

  const suspicious = findSuspicious(root);
  check("  no obvious secret files in repo root", suspicious.length === 0,
    suspicious.length ? suspicious.join(", ") : "clean", suspicious.length ? "warn" : "info");

  const fails = checks.filter((c) => !c.ok && c.level === "fail").length;
  console.log(`\n${fails === 0 ? "doctor: all good" : `doctor: ${fails} failure(s)`}`);
  return fails === 0 ? 0 : 1;
}

const SECRET_PATTERNS = [
  /^\.env(\.|$)/i, /\.pem$/i, /id_rsa/i, /credentials\.json$/i,
  /\.p12$/i, /token\.(json|txt)$/i, /cookies\.(txt|json)$/i,
];

function findSuspicious(root) {
  const hits = [];
  try {
    for (const e of readdirSync(root, { withFileTypes: true })) {
      if (e.isDirectory()) continue;
      if (SECRET_PATTERNS.some((r) => r.test(e.name))) hits.push(e.name);
    }
  } catch { /* unreadable dir — not doctor's problem */ }
  return hits;
}
