import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase3Pack,
  assertPhase3PageAndGuides,
  assertRawMaterial,
  payloadFor,
} from "./support/phase3-contracts.mjs";

const require = createRequire(import.meta.url);
const ANALYZER_HASH = "0d637cb2891778cfed31ca70217e39926702257b603bfcb67e490582f75b9839";
const COUNTER_HASH = "0dfd781d36e81e14011b9338a05039cb052c18f4d159eaa206aad2829152942b";
const EXTENSION_HASH = "77ef498fe2a83edca2a10248e00a73b7d72a01660b024f03e48a4798229732c4";
const PACKAGE_HASH = "385d933647e2ad60aae211df6832d62772b8f44d4ed2112aea89dca59f060c06";
const analyzerPath = payloadFor("HC-020", "analyzer.cjs.template");
const { analyze } = require(analyzerPath);

function assertChild(child, expectedStatus) {
  assert.equal(child.error, undefined);
  assert.equal(Number.isInteger(child.pid) && child.pid > 0, true);
  assert.equal(child.signal, null);
  assert.equal(Number.isInteger(child.status), true);
  assert.equal(child.status, expectedStatus);
}

function runFile(inputPath) {
  const program = `
    const { analyze } = require(process.argv[1]);
    const fs = require('node:fs');
    const text = fs.readFileSync(process.argv[2], 'utf8');
    process.stdout.write(JSON.stringify(analyze({ text })) + '\\n');
  `;
  return spawnSync(process.execPath, ["--input-type=commonjs", "-e", program, analyzerPath, inputPath], {
    encoding: "utf8",
    timeout: 15_000,
  });
}

function runValue(value) {
  const program = `
    const { analyze } = require(process.argv[1]);
    const fs = require('node:fs');
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    try {
      process.stdout.write(JSON.stringify(analyze(input)) + '\\n');
    } catch (error) {
      process.stderr.write(error.name + ': ' + error.message + '\\n');
      process.exitCode = 1;
    }
  `;
  return spawnSync(process.execPath, ["--input-type=commonjs", "-e", program, analyzerPath], {
    encoding: "utf8",
    input: JSON.stringify(value),
    timeout: 15_000,
  });
}

test("HC-020 has exact two conditions, ten overlays and condition-specific Tool draft outputs", async () => {
  const { entry, manifest } = await assertPhase3Pack("HC-020");
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(manifest.conditions, ["baseline", "tool-contract"]);
});

test("HC-020 preserves the accepted README and exactly two separate Host readiness guides", async () => {
  const { entry, text } = await assertPhase3PageAndGuides("HC-020");
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), [
    "extension-tool-host", "chat-participant-host",
  ]);
  for (const phrase of [
    "SYNTHETIC_TRAINING_ONLY", "8,192 Unicode code points",
    "Provide exactly one nonempty string field named text.",
    "Evidence counting was cancelled.", "同じ `analyze`", "status !== 0",
    "Extension Development Host", "runtimeBehavior", "educationalEffect",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-020 keeps the exact Labs analyzer, draft, wrapper and manifest bytes", async () => {
  await assertRawMaterial("HC-020", "analyzer.cjs.template", 810, ANALYZER_HASH);
  await assertRawMaterial("HC-020", "counter-draft.txt.template", 97, COUNTER_HASH);
  await assertRawMaterial("HC-020", "extension.cjs.template", 1406, EXTENSION_HASH);
  await assertRawMaterial("HC-020", "package.json.template", 1763, PACKAGE_HASH);
});

test("HC-020 pure analyzer enforces exact input, code-point and output contracts", () => {
  assert.deepEqual(analyze({ text: "## Evidence\n[[source:a]]\n## Unknowns\n" }), {
    evidenceSections: 1,
    unknownSections: 1,
    citationMarkers: 1,
    semanticValidation: "not-performed",
  });
  assert.deepEqual(analyze({ text: "## Evidence  \r\n## Unknowns\t\r\n[[source:a]]\r\n" }), {
    evidenceSections: 1,
    unknownSections: 1,
    citationMarkers: 1,
    semanticValidation: "not-performed",
  });
  for (const value of [
    null,
    [],
    {},
    { text: "" },
    { text: "   " },
    { text: 1 },
    { text: "ok", extra: true },
  ]) {
    assert.throws(
      () => analyze(value),
      { name: "TypeError", message: "Provide exactly one nonempty string field named text." },
    );
  }
  assert.equal(analyze({ text: "😀".repeat(8192) }).semanticValidation, "not-performed");
  assert.throws(
    () => analyze({ text: "😀".repeat(8193) }),
    { name: "RangeError", message: "Draft text exceeds 8192 Unicode code points." },
  );
});

test("HC-020 child processes prove original, exact missing-heading post-image and byte restoration", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hc020-three-states-"));
  t.after(() => rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  const inputPath = path.join(directory, "counter-input.txt.template");
  const original = await readFile(payloadFor("HC-020", "counter-draft.txt.template"));
  await writeFile(inputPath, original);

  const first = runFile(inputPath);
  assertChild(first, 0);
  assert.equal(first.stderr, "");
  assert.deepEqual(JSON.parse(first.stdout), {
    evidenceSections: 1,
    unknownSections: 1,
    citationMarkers: 1,
    semanticValidation: "not-performed",
  });

  const missing = Buffer.from(original.toString("utf8").replace("## Unknowns\n", ""));
  assert.equal(missing.length, original.length - Buffer.byteLength("## Unknowns\n"));
  assert.equal((missing.toString("utf8").match(/^## Unknowns$/gmu) ?? []).length, 0);
  assert.ok(missing.includes(Buffer.from("実行時の挙動は確認していない。\n")));
  assert.ok(missing.includes(Buffer.from("[[source:README.md#L1-L2]]\n")));
  await writeFile(inputPath, missing);
  const second = runFile(inputPath);
  assertChild(second, 0);
  assert.equal(second.stderr, "");
  assert.deepEqual(JSON.parse(second.stdout), {
    evidenceSections: 1,
    unknownSections: 0,
    citationMarkers: 1,
    semanticValidation: "not-performed",
  });

  await writeFile(inputPath, original);
  const restored = await readFile(inputPath);
  assert.ok(restored.equals(original));
  assert.equal(sha256(restored), COUNTER_HASH);
  const third = runFile(inputPath);
  assertChild(third, 0);
  assert.equal(third.stderr, "");
  assert.deepEqual(JSON.parse(third.stdout), JSON.parse(first.stdout));
});

test("HC-020 negative child results require a real process, integer status and exact TypeError or RangeError", () => {
  const cases = [
    [null, "TypeError: Provide exactly one nonempty string field named text.\n"],
    [{ text: "ok", extra: true }, "TypeError: Provide exactly one nonempty string field named text.\n"],
    [{ text: "😀".repeat(8193) }, "RangeError: Draft text exceeds 8192 Unicode code points.\n"],
  ];
  for (const [value, expectedError] of cases) {
    const child = runValue(value);
    assertChild(child, 1);
    assert.equal(child.stdout, "");
    assert.equal(child.stderr, expectedError);
  }
  const positive = runValue({ text: "## Evidence\n" });
  assertChild(positive, 0);
  assert.equal(positive.stderr, "");
  assert.equal(JSON.parse(positive.stdout).evidenceSections, 1);
});

test("HC-020 fixed wrapper registers exact Tool and Participant contracts against a bounded API stub", async () => {
  const source = await readFile(payloadFor("HC-020", "extension.cjs.template"), "utf8");
  const registrations = {};
  const toolDisposable = { kind: "tool-disposable" };
  const participantDisposable = { kind: "participant-disposable" };
  class LanguageModelTextPart {
    constructor(value) {
      this.value = value;
    }
  }
  class LanguageModelToolResult {
    constructor(content) {
      this.content = content;
    }
  }
  const vscode = {
    lm: {
      registerTool(name, implementation) {
        registrations.tool = { name, implementation };
        return toolDisposable;
      },
    },
    chat: {
      createChatParticipant(id, handler) {
        registrations.participant = { id, handler };
        return participantDisposable;
      },
    },
    LanguageModelTextPart,
    LanguageModelToolResult,
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require(specifier) {
      if (specifier === "vscode") return vscode;
      if (specifier === "./analyzer.cjs") return { analyze };
      throw new Error(`unexpected require: ${specifier}`);
    },
  }, { filename: "extension.cjs.template" });

  const context = { subscriptions: [] };
  module.exports.activate(context);
  assert.equal(registrations.tool.name, "count_workshop_evidence");
  assert.equal(registrations.participant.id, "workshop-local.evidence-counter.reader");
  assert.deepEqual(context.subscriptions, [toolDisposable, participantDisposable]);

  const input = { text: "## Evidence\n[[source:a]]\n## Unknowns\n" };
  const prepared = await registrations.tool.implementation.prepareInvocation({ input });
  assert.equal(prepared.invocationMessage, "Counting literal markers in the supplied draft");
  assert.deepEqual(
    JSON.parse(JSON.stringify(prepared.confirmationMessages)),
    {
      title: "Count supplied draft markers",
      message: "No file access or model call. Counts do not establish source accuracy.",
    },
  );
  const result = await registrations.tool.implementation.invoke({ input }, { isCancellationRequested: false });
  assert.ok(result instanceof LanguageModelToolResult);
  assert.equal(result.content.length, 1);
  assert.ok(result.content[0] instanceof LanguageModelTextPart);
  assert.deepEqual(JSON.parse(result.content[0].value), analyze(input));
  await assert.rejects(
    registrations.tool.implementation.invoke({ input }, { isCancellationRequested: true }),
    /Evidence counting was cancelled\./u,
  );

  const streamed = [];
  await registrations.participant.handler(
    { prompt: input.text },
    {},
    { markdown(value) { streamed.push(value); } },
    { isCancellationRequested: false },
  );
  assert.equal(streamed.length, 1);
  assert.match(streamed[0], /"semanticValidation": "not-performed"/u);
  assert.match(streamed[0], /Literal counts only; semantic accuracy was not checked\./u);
  await assert.rejects(
    registrations.participant.handler(
      { prompt: input.text },
      {},
      { markdown() {} },
      { isCancellationRequested: true },
    ),
    /Evidence counting was cancelled\./u,
  );
});

test("HC-020 package declaration keeps registration, references, bounded schema and no external dependency", async () => {
  const manifest = JSON.parse(await readFile(payloadFor("HC-020", "package.json.template"), "utf8"));
  assert.deepEqual(manifest.activationEvents, [
    "onLanguageModelTool:count_workshop_evidence",
    "onChatParticipant:workshop-local.evidence-counter.reader",
  ]);
  const tool = manifest.contributes.languageModelTools[0];
  assert.equal(tool.name, "count_workshop_evidence");
  assert.equal(tool.toolReferenceName, "workshopEvidence");
  assert.equal(tool.inputSchema.properties.text.maxLength, 8192);
  assert.deepEqual(tool.inputSchema.required, ["text"]);
  assert.equal(tool.inputSchema.additionalProperties, false);
  const participant = manifest.contributes.chatParticipants[0];
  assert.equal(participant.id, "workshop-local.evidence-counter.reader");
  assert.equal(participant.name, "workshop-evidence");
  assert.equal(Object.hasOwn(manifest, "dependencies"), false);
});
