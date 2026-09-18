// Skill installer — copies the BUNDLED skills/ tree into the chosen agent
// skills directory. v2 cloned the repo over git on every install (slow,
// needed git+network, always installed main). v3 ships the skills inside
// the npm tarball so installs are local, fast and version-pinned.
//
// One canonical source (skills/), many targets — no hand-maintained copies.
// Each install writes a manifest so `doctor` can detect drift/stale copies.

import {
  existsSync, mkdirSync, readdirSync, statSync,
  copyFileSync, readFileSync, writeFileSync, rmSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { sha256, nowIso, parseJsonSafe } from "../core/util.js";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir() || "";

// Skills source inside the package (bundled) or the repo (development).
export function skillsSourceDir() {
  const bundled = path.join(PKG_ROOT, "skills");
  if (existsSync(bundled)) return bundled;
  // dev fallback: repo .agents/skills
  const dev = path.join(PKG_ROOT, ".agents", "skills");
  if (existsSync(dev)) return dev;
  throw new Error("skills source not found (package is missing skills/)");
}

// Install targets — directory conventions per client. All targets receive
// the same SKILL.md files (the SKILL.md format is the cross-client standard).
export const INSTALL_TARGETS = {
  project:     (root) => path.resolve(root, ".agents"),        // ./.agents/skills (+ workflows)
  claude:      () => path.join(HOME, ".claude", "skills"),
  codex:       () => path.join(HOME, ".codex", "skills"),
  gemini:      () => path.join(HOME, ".gemini", "skills"),
  antigravity: () => path.join(HOME, ".gemini", "antigravity", "skills"),
  cursor:      () => path.join(HOME, ".cursor", "skills"),
  opencode:    () => path.join(HOME, ".opencode", "skills"),
};

export function resolveTarget(argv, root = process.cwd()) {
  const flags = parseInstallFlags(argv);
  if (flags.help) return { help: true };
  if (flags.path) return { dir: path.resolve(root, expandHome(flags.path)), kind: "custom", workflows: false };
  if (flags.generic) return { dir: path.resolve(root, expandHome(flags.generic)), kind: "generic", workflows: false };
  for (const name of Object.keys(INSTALL_TARGETS)) {
    if (flags[name]) {
      const dir = INSTALL_TARGETS[name](root);
      return { dir, kind: name, workflows: name === "project" };
    }
  }
  // default = project
  return { dir: INSTALL_TARGETS.project(root), kind: "project", workflows: true };
}

function expandHome(p) {
  return String(p).replace(/^~($|[/\\])/, HOME + "$1");
}

function parseInstallFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2).split("=")[0];
    if (a.includes("=")) flags[key] = a.split("=")[1];
    else if (["path", "generic"].includes(key) && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      flags[key] = argv[++i];
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else copyFileSync(s, d);
  }
}

function hashDir(dir) {
  const h = sha256("");
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(dir);
  return sha256(files.map((f) => sha256(readFileSync(f))).join(""));
}

const MANIFEST = ".social-skills-manifest.json";

export function runInstall(argv = [], { root = process.cwd() } = {}) {
  const target = resolveTarget(argv, root);
  if (target.help) {
    printInstallHelp();
    return 0;
  }
  const src = skillsSourceDir();
  const skillsDest = target.kind === "project" ? path.join(target.dir, "skills") : target.dir;

  console.log("\nsocial-posting-skills installer\n");
  console.log(`source: ${src}`);
  console.log(`target: ${skillsDest} (${target.kind})`);

  mkdirSync(skillsDest, { recursive: true });
  const installed = [];
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const s = path.join(src, entry.name);
    const d = path.join(skillsDest, entry.name);
    copyDir(s, d);
    installed.push({ name: entry.name, hash: hashDir(s) });
  }

  // project mode also installs workflows + posts/ (v2 behavior)
  if (target.workflows) {
    const wfSrc = path.join(PKG_ROOT, ".agents", "workflows");
    if (existsSync(wfSrc)) {
      const wfDest = path.join(target.dir, "workflows");
      copyDir(wfSrc, wfDest);
      console.log(`workflows: ${wfDest}`);
    }
    const postsDir = path.join(root, "posts");
    if (!existsSync(postsDir)) {
      mkdirSync(path.join(postsDir, "drafts"), { recursive: true });
      mkdirSync(path.join(postsDir, "images"), { recursive: true });
      console.log(`posts/ draft dirs created (legacy layout)`);
    }
  }

  const manifest = {
    package: "social-posting-skills",
    version: pkgVersion(),
    kind: target.kind,
    installedAt: nowIso(),
    target: skillsDest,
    skills: installed,
  };
  writeFileSync(path.join(skillsDest, MANIFEST), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nInstalled ${installed.length} skills + manifest`);
  console.log(`\nTry: "Create a distribution campaign for README.md" in your agent,`);
  console.log(`or run: npx social-posting-skills campaign create --source README.md --preset oss-launch`);
  return 0;
}

export function readInstallManifest(dir) {
  const file = path.join(dir, MANIFEST);
  if (!existsSync(file)) return null;
  return parseJsonSafe(readFileSync(file, "utf8"), null);
}

// Drift check for `doctor`: compare installed manifest vs bundled source.
export function installDrift(dir) {
  const manifest = readInstallManifest(dir);
  if (!manifest) return { status: "no-manifest" };
  const src = skillsSourceDir();
  const findings = [];
  for (const s of manifest.skills ?? []) {
    const srcDir = path.join(src, s.name);
    if (!existsSync(srcDir)) {
      findings.push({ skill: s.name, status: "missing-in-package" });
      continue;
    }
    const h = hashDir(srcDir);
    if (h !== s.hash) findings.push({ skill: s.name, status: "stale", installed: s.hash, bundled: h });
  }
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory() && !(manifest.skills ?? []).some((s) => s.name === entry.name)) {
      findings.push({ skill: entry.name, status: "not-installed" });
    }
  }
  return { status: findings.length ? "drift" : "current", findings, manifest };
}

export function removeInstall(dir) {
  const manifest = readInstallManifest(dir);
  if (!manifest) return false;
  for (const s of manifest.skills ?? []) {
    rmSync(path.join(dir, s.name), { recursive: true, force: true });
  }
  rmSync(path.join(dir, MANIFEST), { force: true });
  return true;
}

function pkgVersion() {
  try {
    return JSON.parse(readFileSync(path.join(PKG_ROOT, "package.json"), "utf8")).version;
  } catch {
    return "unknown";
  }
}

function printInstallHelp() {
  console.log(`
social-posting-skills install [target]

  --project      ./.agents/skills (+ workflows)        [default]
  --claude       ~/.claude/skills
  --codex        ~/.codex/skills
  --gemini       ~/.gemini/skills
  --antigravity  ~/.gemini/antigravity/skills
  --cursor       ~/.cursor/skills
  --opencode     ~/.opencode/skills
  --path <dir>   custom skills directory
  --generic <dir> same as --path
`);
}
