#!/usr/bin/env node
// validate-skills — repo-side gate for the skill bundle in skills/<name>/.
// Errors (fail the run):
//   · skill dir name is not kebab-case, or SKILL.md / skill.json missing
//   · SKILL.md frontmatter absent/invalid, missing name/description,
//     or frontmatter name ≠ directory name
//   · skill.json unparseable, missing a required field, name mismatch,
//     non-semver version, or a non-string entry in a list field
//   · post-<id> skill whose platform has no platforms/<id>.json
//   · references[] entries that don't resolve inside the repo
// Warnings (reported, non-fatal):
//   · description/version drift between SKILL.md, skill.json, package.json
//   · platforms/*.json with no matching post-* skill
//   · a skill missing from CATALOG.md
//   · .agents/skills drift vs skills/ (generated copy — reinstall to fix)
// Canonical skills live in skills/ only; .agents/ is generated output.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0, warnings = 0;
const fail = (m) => { console.error(`  ✗ ${m}`); failures++; };
const warn = (m) => { console.log(`  ! ${m}`); warnings++; };

// Frontmatter here is flat `key: value` scalars — a small parser keeps the
// package dependency-free. Indented lines and `- item` lists are tolerated
// as continuations; anything else is reported as an invalid line.
function parseFrontmatter(md) {
  if (!md.startsWith("---")) return { error: "no frontmatter block" };
  const end = md.indexOf("\n---", 3);
  if (end === -1) return { error: "unterminated frontmatter block" };
  const fields = {};
  for (const line of md.slice(3, end).split("\n")) {
    if (!line.trim()) continue;
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (m) { fields[m[1]] = m[2].replace(/^["']|["']$/g, ""); continue; }
    if (/^\s|^\s*-\s+\S/.test(line)) continue; // nested value / list item
    return { error: `unparseable frontmatter line: ${line.trim()}` };
  }
  return { fields };
}

const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const platformIds = new Set(
  readdirSync(path.join(ROOT, "platforms"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, "")),
);

const sdir = path.join(ROOT, "skills");
const skillDirs = readdirSync(sdir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

console.log("validate-skills\n");

for (const name of skillDirs) {
  const dir = path.join(sdir, name);
  const rel = `skills/${name}`;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    fail(`${rel}: directory name is not kebab-case`);
  }

  // --- SKILL.md ---
  const mdPath = path.join(dir, "SKILL.md");
  let fm = null;
  if (!existsSync(mdPath)) {
    fail(`${rel}: missing SKILL.md`);
  } else {
    const md = readFileSync(mdPath, "utf8");
    const parsed = parseFrontmatter(md);
    if (parsed.error) {
      fail(`${rel}/SKILL.md: ${parsed.error}`);
    } else {
      fm = parsed.fields;
      for (const k of ["name", "description"]) {
        if (!fm[k]) fail(`${rel}/SKILL.md: frontmatter missing ${k}`);
      }
      if (fm.name && fm.name !== name) {
        fail(`${rel}/SKILL.md: frontmatter name "${fm.name}" ≠ directory`);
      }
    }
    if (!/^#\s+\S/m.test(md)) warn(`${rel}/SKILL.md: no # heading`);
  }

  // --- skill.json ---
  const manifestPath = path.join(dir, "skill.json");
  let manifest = null;
  if (!existsSync(manifestPath)) {
    fail(`${rel}: missing skill.json`);
  } else {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (e) {
      fail(`${rel}/skill.json: ${e.message}`);
    }
  }

  if (manifest) {
    for (const k of ["name", "version", "description", "platform"]) {
      if (!(k in manifest) || (manifest[k] !== null && !manifest[k])) {
        fail(`${rel}/skill.json: missing ${k}`);
      }
    }
    for (const k of ["capabilities", "inputs", "outputs", "permissions", "references"]) {
      if (!Array.isArray(manifest[k]) || manifest[k].some((v) => typeof v !== "string" || !v)) {
        fail(`${rel}/skill.json: ${k} must be an array of non-empty strings`);
      }
    }
    if (manifest.name && manifest.name !== name) {
      fail(`${rel}/skill.json: name "${manifest.name}" ≠ directory`);
    }
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      fail(`${rel}/skill.json: version "${manifest.version}" is not semver`);
    }
    if (manifest.platform != null) {
      if (!platformIds.has(manifest.platform)) {
        fail(`${rel}/skill.json: unknown platform "${manifest.platform}"`);
      }
    }
    if (name.startsWith("post-") && manifest.platform !== name.slice(5)) {
      fail(`${rel}/skill.json: platform "${manifest.platform}" ≠ post- suffix`);
    }
    for (const ref of manifest.references ?? []) {
      const target = path.join(ROOT, ref);
      if (!existsSync(target)) {
        fail(`${rel}/skill.json: reference "${ref}" does not exist`);
      } else if (ref.endsWith("/") && !statSync(target).isDirectory()) {
        fail(`${rel}/skill.json: reference "${ref}" is not a directory`);
      }
    }

    // cross-file drift — warn only
    if (fm?.description && manifest.description && fm.description !== manifest.description) {
      warn(`${rel}: description differs between SKILL.md and skill.json`);
    }
    if (manifest.version && manifest.version !== pkg.version) {
      warn(`${rel}/skill.json: version ${manifest.version} ≠ package.json ${pkg.version}`);
    }
  }
}
console.log(`  skills: ${skillDirs.length} checked`);

// every platform should have a post-* skill (warn — data can land first)
for (const id of platformIds) {
  if (!skillDirs.includes(`post-${id}`)) warn(`platforms/${id}.json: no post-${id} skill`);
}

// every skill should appear in the catalog (warn — docs catch-up)
const catalogPath = path.join(ROOT, "CATALOG.md");
if (existsSync(catalogPath)) {
  const catalog = readFileSync(catalogPath, "utf8");
  for (const name of skillDirs) {
    if (!catalog.includes(`\`${name}\``)) warn(`CATALOG.md: ${name} not listed`);
  }
}

// dogfooding copy parity (warn only — same policy as bin/prepack.js)
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
if (existsSync(agentsSkills) && hashDir(agentsSkills) !== hashDir(sdir)) {
  warn(".agents/skills differs from skills/ — run `node bin/cli.js install --project`");
}

console.log(`\n${skillDirs.length} skills, ${warnings} warning(s), ${failures} error(s)`);
if (failures) {
  console.error("validate-skills failed");
  process.exit(1);
}
console.log("validate-skills ok");
