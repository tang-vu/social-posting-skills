import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { ingest, parseSourceSpec, titleFromMarkdown, htmlToText } from "../src/core/ingest.js";
import { isPrivateIp, safeFetch } from "../src/core/fetch.js";
import { tempRoot, fixtureSource, fakeFetch } from "./helpers.js";

describe("source spec parsing", () => {
  test("routes each spec form", () => {
    assert.equal(parseSourceSpec("https://example.com/a").type, "url");
    assert.equal(parseSourceSpec("https://github.com/o/r/releases/tag/v1").type, "github-release");
    assert.deepEqual(parseSourceSpec("o/r@v2").ref, { repo: "o/r", tag: "v2" });
    assert.equal(parseSourceSpec("npm:pkg").type, "npm");
    assert.equal(parseSourceSpec("text:hello").type, "text");
    assert.equal(parseSourceSpec(fixtureSource()).type, "file");
    assert.equal(parseSourceSpec("just some words").type, "text");
  });
});

describe("ingest", () => {
  test("file source reads local markdown", async () => {
    const doc = await ingest(fixtureSource());
    assert.equal(doc.type, "file");
    assert.match(doc.title, /ReasoningReceipt/i);
    assert.ok(doc.text.length > 100);
    // links extracted from source markdown → canonical link present
    assert.ok(doc.links.length >= 1);
    assert.ok(doc.links.some((l) => l.canonical));
  });

  test("text source", async () => {
    const doc = await ingest("text:# Hi\n\nbody");
    assert.equal(doc.type, "text");
    assert.match(doc.text, /body/);
  });

  test("markdown title extraction + html stripping", () => {
    assert.equal(titleFromMarkdown("# My Title\n\nx"), "My Title");
    assert.match(htmlToText("<p>Hello <b>world</b></p>"), /Hello\s+world/);
    assert.ok(!/<[a-z]/i.test(htmlToText("<p>Hello <b>world</b></p>")), "tags stripped");
  });

  test("git-diff source parses diff summary in a real repo", async () => {
    const root = tempRoot();
    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t",
      GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t",
    };
    execFileSync("git", ["init", "-q"], { cwd: root, env: gitEnv });
    writeFileSync(path.join(root, "a.txt"), "one\n");
    execFileSync("git", ["add", "-A"], { cwd: root, env: gitEnv });
    execFileSync("git", ["commit", "-qm", "init"], { cwd: root, env: gitEnv });
    writeFileSync(path.join(root, "b.txt"), "two\n");
    execFileSync("git", ["add", "-A"], { cwd: root, env: gitEnv });
    execFileSync("git", ["commit", "-qm", "add b"], { cwd: root, env: gitEnv });
    const doc = await ingest({ type: "git-diff", ref: "HEAD~1..HEAD" }, { root });
    assert.equal(doc.type, "git-diff");
    assert.match(doc.text, /b\.txt/);
  });
});

describe("SSRF safety", () => {
  test("private IPs detected", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.1.1", "::1", "172.16.0.1", "0.0.0.0"]) {
      assert.ok(isPrivateIp(ip), `${ip} should be private`);
    }
    for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34"]) {
      assert.ok(!isPrivateIp(ip), `${ip} should be public`);
    }
  });

  test("safeFetch rejects non-http(s) schemes", async () => {
    await assert.rejects(() => safeFetch("file:///etc/passwd"), /scheme|http/i);
    await assert.rejects(() => safeFetch("ftp://x/y"), /scheme|http/i);
  });

  test("safeFetch rejects private-host literals without DNS", async () => {
    await assert.rejects(
      () => safeFetch("http://127.0.0.1/x", { fetchImpl: fakeFetch({}) }),
      /private|internal|ssrf|not allowed/i
    );
    await assert.rejects(
      () => safeFetch("http://169.254.169.254/latest/meta-data", { fetchImpl: fakeFetch({}) }),
      /private|internal|ssrf|not allowed|metadata/i
    );
    await assert.rejects(
      () => safeFetch("http://localhost:8080/admin", { fetchImpl: fakeFetch({}) }),
      /private|internal|ssrf|not allowed|local/i
    );
  });

  test("safeFetch bounds response size", async () => {
    const big = "x".repeat(3 * 1024 * 1024);
    const fetchImpl = async () => ({
      ok: true, status: 200,
      headers: new Map(),
      body: null,
      text: async () => big,
      json: async () => ({}),
    });
    // 93.184.216.34 is a public IP literal → assertPublicHost skips DNS.
    const { text } = await safeFetch("https://93.184.216.34/big", { fetchImpl });
    assert.ok(text.length <= 1024 * 1024, `expected bounded text, got ${text.length}`);
    assert.ok(text.length < big.length);
  });

  test("safeFetch blocks redirect to private IP", async () => {
    const fetchImpl = fakeFetch((url) => url.includes("/jump")
      ? { status: 302, headers: new Map([["location", "http://127.0.0.1/secret"]]) }
      : { status: 200, headers: new Map(), text: "ok" });
    await assert.rejects(
      () => safeFetch("https://93.184.216.34/jump", { fetchImpl }),
      /private/i
    );
  });
});
