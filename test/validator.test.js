import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const validator = fileURLToPath(new URL("../scripts/validate-skills.js", import.meta.url));

function fixture(t) {
  const parent = mkdtempSync(path.join(tmpdir(), "sps-validator-"));
  const root = path.join(parent, "repo");
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  for (const dir of ["scripts", "skills/example", "platforms", "docs"]) {
    mkdirSync(path.join(root, dir), { recursive: true });
  }
  copyFileSync(validator, path.join(root, "scripts/validate-skills.js"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ type: "module", version: "1.0.0" }));
  writeFileSync(path.join(root, "skills/example/SKILL.md"), "---\nname: example\ndescription: Example skill\n---\n# Example\n");
  writeFileSync(path.join(root, "docs/readme.md"), "Reference\n");
  writeFileSync(path.join(parent, "outside.md"), "Outside the repository\n");
  const manifest = {
    name: "example", version: "1.0.0", description: "Example skill", platform: null,
    capabilities: [], inputs: [], outputs: [], permissions: [], references: ["docs/readme.md", "docs/"],
  };
  const save = (value) => writeFileSync(path.join(root, "skills/example/skill.json"), JSON.stringify(value));
  save(manifest);
  const run = () => {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/validate-skills.js")], { encoding: "utf8" });
    assert.ifError(result.error);
    return { status: result.status, output: result.stdout + result.stderr };
  };
  return { root, manifest, save, run };
}

test("validator accepts a generic skill with repository file and directory references", (t) => {
  const { run } = fixture(t);
  const result = run();
  assert.equal(result.status, 0, result.output);
});

for (const value of [null, false, 0, "", [], "manifest"]) {
  test(`validator rejects a non-object manifest: ${JSON.stringify(value)}`, (t) => {
    const { save, run } = fixture(t);
    save(value);
    const result = run();
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /skill\.json: manifest must be an object/);
    assert.doesNotMatch(result.output, /TypeError|at file:/);
  });
}

for (const field of ["name", "version", "description"]) {
  test(`validator requires a non-empty string ${field}`, (t) => {
    const { manifest, save, run } = fixture(t);
    for (const value of [null, 42, "   "]) {
      save({ ...manifest, [field]: value });
      const result = run();
      assert.equal(result.status, 1, result.output);
      assert.match(result.output, new RegExp(`${field} must be a non-empty string`));
    }
  });
}

test("validator rejects a reference escaping to an existing sibling file", (t) => {
  const { manifest, save, run } = fixture(t);
  save({ ...manifest, references: ["../outside.md"] });
  const result = run();
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /reference .* must stay inside the repository/);
});

test("validator rejects a reference whose directory symlink escapes the repository", (t) => {
  const { root, manifest, save, run } = fixture(t);
  symlinkSync(path.dirname(root), path.join(root, "outside-link"), "junction");
  save({ ...manifest, references: ["outside-link/outside.md"] });
  const result = run();
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /reference .* must stay inside the repository/);
});

test("validator accepts a reference through a directory symlink within the repository", (t) => {
  const { root, manifest, save, run } = fixture(t);
  symlinkSync(path.join(root, "docs"), path.join(root, "docs-link"), "junction");
  save({ ...manifest, references: ["docs-link/readme.md"] });
  const result = run();
  assert.equal(result.status, 0, result.output);
});

test("validator reports malformed reference lists without crashing", (t) => {
  const { manifest, save, run } = fixture(t);
  for (const references of [{ file: "docs/readme.md" }, [null], ["   "]]) {
    save({ ...manifest, references });
    const result = run();
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, /references must be an array of non-empty strings/);
    assert.doesNotMatch(result.output, /TypeError|at file:/);
  }
});

test("validator catches missing files and a file used as a directory reference", (t) => {
  const { manifest, save, run } = fixture(t);
  save({ ...manifest, references: ["missing.md", "docs/readme.md/"] });
  const result = run();
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /does not exist/);
  assert.match(result.output, /is not a directory/);
});
