import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";

function repositoryFile(relativePath) {
  return path.join(REPOSITORY_ROOT, ...relativePath.split("/"));
}

test("HC-009 evidence checker passes the template and rejects one removed heading", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hc-009-tool-"));
  const scriptPath = path.join(temporaryRoot, "check-evidence-note.mjs");
  const evidencePath = path.join(temporaryRoot, "evidence-note.md");

  try {
    const script = await readFile(
      repositoryFile(
        "challenges/hc-009/pack/payload/tools/check-evidence-note.mjs.template",
      ),
      "utf8",
    );
    const evidence = await readFile(
      repositoryFile(
        "challenges/hc-009/pack/payload/evidence/evidence-note.md.template",
      ),
      "utf8",
    );
    await writeFile(scriptPath, script, "utf8");
    await writeFile(evidencePath, evidence, "utf8");

    const passing = spawnSync(process.execPath, [scriptPath, evidencePath], {
      encoding: "utf8",
    });
    assert.equal(Number.isInteger(passing.status), true);
    assert.equal(passing.status, 0, passing.stderr);
    assert.match(passing.stdout, /Evidence format: PASS/u);

    const mutated = evidence.replace("## Resource loading observations", "");
    assert.notEqual(mutated, evidence, "mutation must change the evidence");
    await writeFile(evidencePath, mutated, "utf8");
    const failing = spawnSync(process.execPath, [scriptPath, evidencePath], {
      encoding: "utf8",
    });
    assert.equal(Number.isInteger(failing.status), true);
    assert.notEqual(failing.status, 0);
    assert.match(failing.stderr, /missing heading: ## Resource loading observations/u);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("HC-011 MCP server returns success, INVALID_ARGUMENT, and NOT_FOUND distinctly", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "hc-011-mcp-"));
  const serverDirectory = path.join(temporaryRoot, "tools", "mcp");
  const fixtureDirectory = path.join(temporaryRoot, "fixtures");
  const serverPath = path.join(serverDirectory, "training-notes-server.mjs");
  const notePath = path.join(fixtureDirectory, "operations-note.json");

  try {
    await mkdir(serverDirectory, { recursive: true });
    await mkdir(fixtureDirectory, { recursive: true });
    await writeFile(
      serverPath,
      await readFile(
        repositoryFile(
          "challenges/hc-011/pack/payload/tools/mcp/training-notes-server.mjs.template",
        ),
        "utf8",
      ),
      "utf8",
    );
    await writeFile(
      notePath,
      await readFile(
        repositoryFile(
          "challenges/hc-011/pack/payload/fixtures/operations-note.json.template",
        ),
        "utf8",
      ),
      "utf8",
    );

    const requests = [
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "hub-test", version: "1.0.0" },
        },
      },
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "lookup_training_note",
          arguments: { noteKey: "order-import-replay" },
        },
      },
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "lookup_training_note",
          arguments: { noteKey: "Order/Import" },
        },
      },
      {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "lookup_training_note",
          arguments: { noteKey: "missing-note" },
        },
      },
    ];
    const result = spawnSync(process.execPath, [serverPath], {
      cwd: temporaryRoot,
      encoding: "utf8",
      input: `${requests.map((request) => JSON.stringify(request)).join("\n")}\n`,
    });
    assert.equal(Number.isInteger(result.status), true);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");

    const responses = result.stdout
      .trim()
      .split(/\r?\n/u)
      .map((line) => JSON.parse(line));
    assert.equal(responses.length, requests.length - 1);
    assert.equal(responses[0].result.protocolVersion, "2025-11-25");
    assert.equal(
      responses[1].result.tools[0].name,
      "lookup_training_note",
    );
    assert.equal(
      responses[2].result.structuredContent.noteKey,
      "order-import-replay",
    );
    assert.equal(
      responses[3].result.structuredContent.error.code,
      "INVALID_ARGUMENT",
    );
    assert.equal(
      responses[4].result.structuredContent.error.code,
      "NOT_FOUND",
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
