import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { tempRoot } from "./helpers.js";

const CLI = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")), "../bin/cli.js");

function cli(args, cwd) {
  // returns stdout; tolerates non-zero exits (blocked publishes exit 1)
  try {
    return execFileSync(process.execPath, [CLI, ...args], {
      cwd, encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    return (e.stdout ?? "") + (e.stderr ?? "");
  }
}

const SRC = "text:# Widget v1.0\n\nA tiny tool.\n\n## What's new\n\n- 40% faster\n- Ships today\n\n[Repo](https://example.com/r)";

describe("CLI", () => {
  test("version + adapters + presets", () => {
    const root = tempRoot();
    assert.match(cli(["version"], root), /\d+\.\d+\.\d+/);
    const adapters = cli(["adapters"], root);
    for (const p of ["x", "bluesky", "reddit", "hackernews"]) {
      assert.match(adapters, new RegExp(`\\b${p}\\b`));
    }
    assert.match(cli(["presets"], root), /oss-launch/);
  });

  test("doctor passes on a clean machine", () => {
    const root = tempRoot();
    const out = cli(["doctor"], root);
    assert.match(out, /doctor: all good|0 failure/i);
  });

  test("full campaign lifecycle: create → preview → approve → export", () => {
    const root = tempRoot();
    const created = cli(
      ["campaign", "create", "--source", SRC, "--platforms", "x,bluesky,reddit", "--subreddit", "r/test", "--title", "Widget v1.0"],
      root
    );
    const id = created.match(/[\w-]+\d{6,}|\d{4}-\d{2}-\d{2}-[\w-]+/)?.[0] ??
      cli(["campaign", "list"], root).match(/[\w-]+/)?.[0];
    assert.ok(id, `could not parse campaign id from:\n${created}`);

    // preview renders the approval package
    const preview = cli(["campaign", "preview", id], root);
    assert.match(preview, /x|twitter/i);
    assert.match(preview, /bluesky/i);

    // approve all valid → publish manual exports drafts
    cli(["campaign", "approve", id, "--all"], root);
    const pub = cli(["campaign", "publish", id, "--mode", "manual"], root);
    assert.match(pub, /draft-exported|exported|draft/i);

    // drafts on disk under .social-campaigns/<campaignId>/drafts
    const draftsRoot = path.join(root, ".social-campaigns", id, "drafts");
    const dirs = readdirSync(draftsRoot, { withFileTypes: true });
    assert.ok(dirs.length >= 1);
    assert.ok(existsSync(path.join(draftsRoot, dirs[0].name, "package.json")));
  });

  test("publish without approval is blocked", () => {
    const root = tempRoot();
    const created = cli(
      ["campaign", "create", "--source", SRC, "--platforms", "linkedin", "--title", "Widget"],
      root
    );
    const id = created.match(/\d{4}-\d{2}-\d{2}-[\w-]+/)?.[0];
    assert.ok(id, `campaign id not found in: ${created}`);
    // no approved items → explicit no-op message
    const noop = cli(["campaign", "publish", id, "--mode", "manual"], root);
    assert.match(noop, /nothing to publish|no matching/i);
    // targeting the unapproved item → blocked, never published
    const out = cli(["campaign", "publish", id, "--item", "linkedin", "--mode", "manual"], root);
    assert.match(out, /blocked/i);
  });
});
