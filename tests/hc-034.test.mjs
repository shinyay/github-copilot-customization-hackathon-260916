import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase6Pack,
  assertPhase6PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
  roundTripBuffer,
  roundTripJson,
} from "./support/phase6-contracts.mjs";

function checkMcpConfig(value) {
  if (
    JSON.stringify(Object.keys(value)) !== JSON.stringify(["mcpServers"]) ||
    Object.hasOwn(value, "servers")
  ) {
    fail("HC034_CLOUD_CONFIG");
  }
  const server = value.mcpServers["training-operations-note"];
  if (
    server?.type !== "local" ||
    server.command !== "<UNRESOLVED_COMMAND>" ||
    JSON.stringify(server.tools) !== JSON.stringify(["lookup_training_note"])
  ) {
    fail("HC034_CLOUD_CONFIG");
  }
  return server;
}

function checkNoteMatch(operations, manual) {
  if (!operations.equals(manual)) fail("HC034_NOTE_BYTES");
}

test("HC-034 publishes exact MCP conditions, source paths and two guide routes", async () => {
  const { entry, manifest } = await assertPhase6Pack("HC-034");
  assert.deepEqual(manifest.conditions, [
    "baseline",
    "mcp-retrieval",
    "manual-equivalent",
  ]);
  assert.equal(manifest.overlay.length, 9);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["cloud-mcp", "review-mcp"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["blocked", "not-checked"],
  );
  assert.deepEqual(
    entry.optionalRoutes[1].runtimeRequirements.map(({ status }) => status),
    ["not-checked", "not-checked"],
  );
});

test("HC-034 operations and manual notes are exact raw-byte equivalents", () =>
  Promise.all([
    readFile(payloadFor("HC-034", "operations-note.json.template")),
    readFile(payloadFor("HC-034", "manual-note.json.template")),
  ]).then(([operations, manual]) => {
    checkNoteMatch(operations, manual);
    const note = JSON.parse(operations.toString("utf8"));
    assert.equal(note.label, "SYNTHETIC_TRAINING_ONLY");
    assert.equal(note.noteKey, "order-import-replay");
    assert.equal(note.revision, "training-v1");
    assert.deepEqual(
      note.sections.map(({ kind }) => kind),
      ["synthetic-operations", "code-derived-snapshot"],
    );
  }));

test("HC-034 note mutation breaks equivalence and exact bytes restore", async () => {
  const operations = await readFile(
    payloadFor("HC-034", "operations-note.json.template"),
  );
  const manual = await readFile(payloadFor("HC-034", "manual-note.json.template"));
  roundTripBuffer(
    manual,
    (bytes) => checkNoteMatch(operations, bytes),
    (bytes) =>
      Buffer.from(
        bytes.toString("utf8").replace(
          '"revision": "training-v1"',
          '"revision": "training-v0"',
        ),
      ),
    (bytes) => {
      assert.equal(JSON.parse(bytes.toString("utf8")).revision, "training-v0");
      assert.equal(bytes.equals(operations), false);
    },
    "HC034_NOTE_BYTES",
  );
});

test("HC-034 Cloud draft uses mcpServers and rejects the VS Code root shape", async () => {
  const original = await readFile(payloadFor("HC-034", "mcp.json.template"));
  checkMcpConfig(JSON.parse(original.toString("utf8")));
  roundTripJson(
    original,
    checkMcpConfig,
    (value) => {
      value.servers = value.mcpServers;
      delete value.mcpServers;
    },
    (value) => {
      assert.deepEqual(Object.keys(value), ["servers"]);
      assert.equal(Object.hasOwn(value, "mcpServers"), false);
    },
    "HC034_CLOUD_CONFIG",
  );
});

test("HC-034 packets distinguish transport failure and application NOT_FOUND", async () => {
  const fixture = await readPayloadJson("HC-034");
  assert.deepEqual(
    fixture.packets.map(({ id }) => id),
    ["P34-01", "P34-02", "P34-03", "P34-04", "P34-05", "P34-06"],
  );
  assert.deepEqual(fixture.packets[4].error, {
    kind: "transport",
    code: "CONNECTION_CLOSED",
  });
  assert.deepEqual(fixture.packets[5].error, {
    kind: "application",
    code: "NOT_FOUND",
    isError: true,
  });
  assert.notDeepEqual(fixture.packets[4].error, fixture.packets[5].error);
  assert.doesNotMatch(
    JSON.stringify(fixture).toLowerCase(),
    /"expected"|"verdict"|"answerkey"/u,
  );
});

test("HC-034 page separates saved, started, listed, adopted, called and supported", async () => {
  const { text } = await assertPhase6PageAndGuides("HC-034");
  for (const phrase of [
    "config saved",
    "server started",
    "tools listed",
    "product adopted",
    "content-supported",
    "`NOT_FOUND`",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
