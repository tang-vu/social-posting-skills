#!/usr/bin/env node
// prepack — sanity gate before npm publish:
//   1. every platform JSON parses and has required fields
//   2. every skill dir has SKILL.md + skill.json
//   3. .agents/skills (dogfooding copy) matches skills/ (canonical)
// Fails the pack if the repo is in an inconsistent state.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const fail = (m) => { console.error(`  ✗ ${m}`); failures++; };

console.log("prepack checks\n");

// platforms
const pdir = path.join(ROOT, "platforms");
const pfiles = readdirSync(pdir).filter((f) => f.endsWith(".json"));
if (!pfiles.length) fail("no platform files");
for (const f of pfiles) {
  try {
    const d = JSON.parse(readFileSync(path.join(pdir, f), "utf8"));
    for (const k of ["id", "displayName", "verification", "capabilities", "constraints"]) {
      if (!d[k]) fail(`${f}: missing ${k}`);
    }
    if (!d.verification?.lastReviewed) fail(`${f}: no verification.lastReviewed`);
  } catch (e) {
    fail(`${f}: ${e.message}`);
  }
}
console.log(`  platforms: ${pfiles.length} checked`);

// skills
const sdir = path.join(ROOT, "skills");
const skills = readdirSync(sdir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
for (const s of skills) {
  const skillMd = path.join(sdir, s, "SKILL.md");
  const manifest = path.join(sdir, s, "skill.json");
  if (!existsSync(skillMd)) fail(`skills/${s}: missing SKILL.md`);
  if (!existsSync(manifest)) fail(`skills/${s}: missing skill.json`);
  else {
    try {
      const m = JSON.parse(readFileSync(manifest, "utf8"));
      for (const k of ["name", "description", "version"]) if (!m[k]) fail(`skills/${s}/skill.json: missing ${k}`);
    } catch (e) {
      fail(`skills/${s}/skill.json: ${e.message}`);
    }
  }
}
console.log(`  skills: ${skills.length} checked`);

// dogfooding copy parity (warn only — repo may not be installed yet)
const hashDir = (dir) => {
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name !== ".social-skills-manifest.json") files.push(p);
    }
  };
  walk(dir);
  return files.map((f) => createHash("sha256").update(readFileSync(f)).digest("hex")).join("");
};
const agentsSkills = path.join(ROOT, ".agents", "skills");
if (existsSync(agentsSkills)) {
  const a = hashDir(agentsSkills);
  const b = hashDir(sdir);
  if (a !== b) {
    console.log("  warn: .agents/skills differs from skills/ — run `node bin/cli.js install --project` before release");
  } else {
    console.log("  .agents/skills in sync");
  }
}

if (failures) {
  console.error(`\nprepack failed: ${failures} problem(s)`);
  process.exit(1);
}
console.log("\nprepack ok");
