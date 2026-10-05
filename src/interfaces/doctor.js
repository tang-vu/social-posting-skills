// Doctor collects a versioned report before rendering. Diagnostics must never
// include credential values, file contents, or raw exception messages.

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { listPlatforms } from "../core/platforms.js";
import { listAdapters } from "../adapters/registry.js";
import { ensureStore } from "../core/store.js";
import { INSTALL_TARGETS, installDrift } from "./install.js";

// The injected readers keep fault tests offline and independent of the host.
export function collectDoctorReport(root = process.cwd(), {
  env = process.env,
  nodeVersion = process.versions.node,
  readGitVersion = () => execFileSync("git", ["--version"], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 5000,
  }),
  readPlatforms = listPlatforms,
  readAdapters = listAdapters,
  installTargets = INSTALL_TARGETS,
  readInstallDrift = installDrift,
} = {}) {
  const checks = [];
  const check = (id, name, status, detail, remediation = null) => {
    checks.push({ id, name, status, detail, remediation });
  };

  const supported = parseInt(nodeVersion.split(".")[0], 10) >= 18;
  check("runtime.node", "node >= 18", supported ? "pass" : "fail", `v${nodeVersion}`,
    supported ? null : "Install Node.js 18 or newer.");
  check("runtime.platform", "platform", "pass", `${process.platform} (${os.arch()})`);
  try {
    // Do not echo arbitrary subprocess output into a diagnostic artifact.
    const version = readGitVersion().trim().match(/^git version (\d+\.\d+(?:\.\d+)?)/)?.[1];
    if (!version) throw new Error("unrecognized git version");
    check("runtime.git", "git available", "pass", `git version ${version}`);
  } catch {
    check("runtime.git", "git available", "warn", "optional — only needed for git: sources",
      "Install Git and make it available on PATH if you use git: sources.");
  }

  let platforms = null;
  try {
    platforms = readPlatforms();
    if (!Array.isArray(platforms)) throw new Error("invalid platform registry");
    const invalid = platforms.filter((p) => !p.id || !p.verification?.lastReviewed || !p.capabilities?.publish?.length);
    const valid = platforms.length > 0 && invalid.length === 0;
    check("platforms.metadata", "platform metadata", valid ? "pass" : "fail",
      `${platforms.length} platforms; ${invalid.length} missing required metadata`,
      valid ? null : "Restore the bundled platforms/ data or reinstall social-posting-skills.");
  } catch {
    platforms = null;
    check("platforms.metadata", "platform metadata", "fail", "Could not read platform metadata",
      "Restore the bundled platforms/ data or reinstall social-posting-skills.");
  }

  let adapters = [];
  try {
    adapters = readAdapters();
    if (!Array.isArray(adapters)) throw new Error("invalid adapter registry");
    const ids = new Set(adapters.map((a) => a.id));
    const valid = platforms !== null && platforms.length > 0 && ids.size === adapters.length &&
      ids.size === platforms.length && platforms.every((p) => ids.has(p.id));
    check("adapters.registry", "adapters", valid ? "pass" : "fail",
      `${adapters.length} adapters; ${platforms === null ? "platform metadata unavailable" : `${platforms.length} platforms`}`,
      valid ? null : "Restore matching platform metadata and adapters or reinstall social-posting-skills.");
  } catch {
    adapters = [];
    check("adapters.registry", "adapters", "fail", "Could not load the adapter registry",
      "Restore the bundled adapters and platform metadata or reinstall social-posting-skills.");
  }

  try {
    probeStore(root);
    check("store.writable", "campaign store writable", "pass", ".social-campaigns/ is writable");
  } catch {
    check("store.writable", "campaign store writable", "fail", "Could not create, write, or remove a store probe",
      "Check that .social-campaigns is a directory and the project and store are writable.");
  }

  for (const [name, target] of Object.entries(installTargets)) {
    const id = `skills.${name}`;
    try {
      const dir = name === "project" ? path.join(target(root), "skills") : target(root);
      if (!existsSync(dir)) {
        check(id, name, "info", "not installed");
        continue;
      }
      const drift = readInstallDrift(dir);
      if (drift.status === "current") {
        check(id, name, "pass", "install manifest matches the bundled skills");
      } else {
        check(id, name, "warn", drift.status === "no-manifest"
          ? "contents have no readable install manifest"
          : `install drift: ${drift.findings.length} finding(s)`,
        `Review the install, then run social-posting-skills install --${name} to refresh it.`);
      }
    } catch {
      check(id, name, "warn", "Could not inspect the install or its manifest",
        `Check directory access and the install manifest; reinstall with --${name} if needed.`);
    }
  }

  for (const a of adapters) {
    if (!a.meta?.publishing?.api?.available) continue;
    const id = `api.${a.id}`;
    try {
      // Credential presence cannot turn an unimplemented adapter into a ready API.
      if (!a.hasApi()) {
        check(id, a.id, "info", "API adapter not implemented; draft export remains available");
        continue;
      }
      const envNames = a.meta.publishing.api.env ?? [];
      const missing = envNames.filter((n) => typeof env[n] !== "string" || !env[n].trim());
      check(id, a.id, missing.length ? "info" : "pass",
        missing.length ? `adapter exists; missing ${missing.join(", ")}; draft export remains available`
          : `credentials present (${envNames.join(", ")}); authentication not tested`,
        missing.length ? `Set ${missing.join(", ")} only if you want API publishing.` : null);
    } catch {
      check(id, a.id, "warn", "Could not inspect API readiness",
        "Check the adapter and its credential metadata; draft export remains available.");
    }
  }

  try {
    const file = path.join(root, ".gitignore");
    const lines = existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/) : [];
    for (const [id, dir, level] of [["campaigns", ".social-campaigns", "warn"], ["posts", "posts", "info"]]) {
      // This is a local declaration check, not a full Git ignore/negation audit.
      const declared = lines.some((line) => [dir, `${dir}/`, `/${dir}`, `/${dir}/`].includes(line.trim()));
      check(`safety.gitignore.${id}`, `.gitignore declares ${dir}/`, declared ? "pass" : level,
        declared ? "ignore entry present; effective Git rules not verified" : "no explicit directory ignore entry",
        declared ? null : `Add ${dir}/ to the project .gitignore to keep drafts and receipts local.`);
    }
  } catch {
    check("safety.gitignore.campaigns", ".gitignore declares .social-campaigns/", "warn", "Could not read .gitignore",
      "Check .gitignore permissions and ensure campaign data is excluded from version control.");
    check("safety.gitignore.posts", ".gitignore declares posts/", "info", "Could not read .gitignore",
      "Check .gitignore permissions and ensure legacy drafts are excluded from version control.");
  }

  try {
    const count = readdirSync(root, { withFileTypes: true })
      .filter((e) => !e.isDirectory() && SECRET_PATTERNS.some((pattern) => pattern.test(e.name))).length;
    check("safety.secret-files", "no obvious secret files in repo root", count ? "warn" : "pass",
      count ? `${count} sensitive-looking filename(s); names and contents omitted` : "no matching filenames (root only)",
      count ? "Review root-level .env, key, credential, token, and cookie files; keep them out of version control." : null);
  } catch {
    check("safety.secret-files", "no obvious secret files in repo root", "warn", "Could not inspect root filenames",
      "Check project directory access and review secret-file exclusions manually.");
  }

  const summary = { pass: 0, fail: 0, warn: 0, info: 0 };
  for (const c of checks) summary[c.status]++;
  const ok = summary.fail === 0;
  return { schemaVersion: 1, ok, exitCode: ok ? 0 : 1, summary, checks };
}

export function runDoctor(flags = {}, root = process.cwd()) {
  const report = collectDoctorReport(root);
  if (flags.json || flags.ci) console.log(JSON.stringify(report, null, 2));
  else console.log(renderDoctorText(report));
  return report.exitCode;
}

export function renderDoctorText(report) {
  const lines = ["social-posting-skills doctor", ""];
  let section = null;
  const sections = { skills: "skill installs", api: "API credentials (env)", safety: "secret hygiene" };
  for (const c of report.checks) {
    const group = c.id.split(".")[0];
    if (sections[group] && section !== group) lines.push(`\n  ${sections[group]}:`);
    section = group;
    const mark = { pass: "ok ", fail: "FAIL", warn: "warn", info: "info" }[c.status];
    lines.push(`  [${mark}] ${c.name} — ${c.detail}`);
    if (c.remediation) lines.push(`         ${c.remediation}`);
  }
  lines.push(`\n${report.ok ? "doctor: all good" : `doctor: ${report.summary.fail} failure(s)`}`);
  return lines.join("\n");
}

function probeStore(root) {
  // Never overwrite an existing .probe, or collide with a concurrent doctor.
  const probe = mkdtempSync(path.join(ensureStore(root), ".doctor-"));
  try {
    writeFileSync(path.join(probe, "probe"), "ok", { flag: "wx" });
  } finally {
    rmSync(probe, { recursive: true });
  }
}

const SECRET_PATTERNS = [
  /^\.env(\.|$)/i, /\.pem$/i, /id_rsa/i, /credentials\.json$/i,
  /\.p12$/i, /token\.(json|txt)$/i, /cookies\.(txt|json)$/i,
];
