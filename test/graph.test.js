import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildContentGraph, validateGraph, setNodeText, getNode,
  nodesByType, graphText, coreClaim, makeNode,
} from "../src/core/graph.js";
import { testCampaign, fixtureSource } from "./helpers.js";
import { ingest } from "../src/core/ingest.js";

describe("content graph", () => {
  test("extracts core-claim, context, proof, cta, links from markdown", () => {
    const c = testCampaign();
    const g = c.contentGraph;
    assert.ok(getNode(g, "core"), "core-claim node with id 'core'");
    assert.ok(nodesByType(g, "proof").length >= 3, "bullets → proof nodes");
    assert.ok(nodesByType(g, "context").length >= 1);
    assert.ok(getNode(g, "cta"), "cta scaffold node");
    assert.ok(nodesByType(g, "link").length >= 1);
    assert.match(coreClaim(g).text, /Widget/);
    assert.ok(graphText(g, "proof").some((t) => /40% faster/.test(t)));
  });

  test("graph from real README fixture", async () => {
    const doc = await ingest(fixtureSource());
    const g = buildContentGraph(doc, { goal: "launch", keyMessage: "Widget v1.0" });
    assert.ok(g.nodes.length >= 5);
    assert.ok(nodesByType(g, "link").length >= 1);
    const { errors } = validateGraph(g);
    assert.deepEqual(errors, []);
  });

  test("validateGraph catches empty graph and missing core claim", () => {
    assert.ok(validateGraph({ nodes: [] }).errors.some((e) => /empty/i.test(e)));
    const onlyProof = { nodes: [makeNode("proof", "some evidence here")] };
    assert.ok(validateGraph(onlyProof).errors.some((e) => /core-claim/i.test(e)));
    const bad = { nodes: [{ id: "x", type: "bogus-type", text: "t" }] };
    assert.ok(validateGraph(bad).errors.some((e) => /unknown node type/i.test(e)));
  });

  test("validateGraph warns on unreviewed extracted nodes", () => {
    const c = testCampaign();
    const { warnings } = validateGraph(c.contentGraph);
    assert.ok(warnings.some((w) => /extracted|reviewed/i.test(w)));
  });

  test("setNodeText edits any node and marks origin authored", () => {
    const c = testCampaign();
    setNodeText(c.contentGraph, "core", "changed claim");
    const n = getNode(c.contentGraph, "core");
    assert.equal(n.text, "changed claim");
    assert.equal(n.origin, "authored");
    assert.throws(() => setNodeText(c.contentGraph, "nope", "x"), /not found/i);
  });
});
