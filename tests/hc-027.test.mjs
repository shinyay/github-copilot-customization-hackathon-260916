import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase5Pack,
  assertPhase5PageAndGuides,
  fail,
  markdownRows,
  payloadFor,
  roundTripBuffer,
} from "./support/phase5-contracts.mjs";

const TASKS = ["primary", "transfer-check"];
const CONDITIONS = ["baseline", "customized", "manual-equivalent"];
const BLOCKS = ["block-01", "block-02", "block-03"];
const IDENTITIES = CONDITIONS.flatMap((condition) =>
  TASKS.flatMap((task) => BLOCKS.map((block) => `${task}:${condition}:${block}`))).sort();

function checkRows(bytes) {
  const rows = markdownRows(bytes);
  const ids = rows.map(([task, condition, block]) => `${task}:${condition}:${block}`).sort();
  if (JSON.stringify(ids) !== JSON.stringify(IDENTITIES)) fail("HC027_ROW_SET");
  if (new Set(ids).size !== 18) fail("HC027_ROW_SET");
  for (const condition of CONDITIONS) {
    if (rows.filter(([, value]) => value === condition).length !== 6) fail("HC027_CONDITION_ROWS");
  }
  return rows;
}

function isTargetRegression({ reference, candidate, comparable }) {
  return comparable === "true" && Number(candidate) < Number(reference);
}

function hasAnyTargetRegression(targets) {
  return targets.some(isTargetRegression);
}

test("HC-027 has exact three conditions, twelve inert payloads and one guide route", async () => {
  const { entry, manifest } = await assertPhase5Pack("HC-027");
  assert.deepEqual(manifest.conditions, CONDITIONS);
  assert.equal(manifest.overlay.length, 12);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["evaluation-readiness"]);
});

test("HC-027 page keeps eighteen synthetic rows distinct from model executions", async () => {
  const { text } = await assertPhase5PageAndGuides("HC-027");
  for (const phrase of [
    "2 task × 3 condition × 3 block = 18",
    "各Runtime conditionは",
    "6行",
    "初回回答と追問後",
    "合成18行を18回のLLM実行",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-027 schedule and trials preserve the exact eighteen identities and six rows per condition", async () => {
  checkRows(await readFile(payloadFor("HC-027", "schedule.md.template")));
  const trials = checkRows(await readFile(payloadFor("HC-027", "synthetic-trials.md.template")));
  for (const row of trials) {
    const execution = row[3];
    const initial = row[4];
    const followUp = row[5];
    if (execution === "completed") {
      assert.notEqual(initial, "null");
      assert.notEqual(followUp, "null");
      assert.notEqual(initial, followUp);
    } else {
      assert.ok(["failed", "not-run"].includes(execution));
      assert.equal(initial, "null");
      assert.equal(followUp, "null");
    }
    assert.equal(row[7], "null");
    assert.equal(row[8], "null");
  }
  assert.ok(trials.some((row) => row[3] === "failed"));
  assert.ok(trials.some((row) => row[3] === "not-run"));
});

test("HC-027 row checker rejects missing, duplicate and same-count replacement shapes", async (t) => {
  const original = await readFile(payloadFor("HC-027", "schedule.md.template"));
  const dataLines = original.toString("utf8").split("\n").filter((line) => /^\| (?:primary|transfer-check) \|/u.test(line));
  await t.test("one scheduled row is missing", () =>
    roundTripBuffer(
      original,
      checkRows,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(`${dataLines.at(-1)}\n`, "")),
      (bytes) => assert.equal(markdownRows(bytes).length, 17),
      "HC027_ROW_SET",
    ));
  await t.test("one scheduled row is duplicated", () =>
    roundTripBuffer(
      original,
      checkRows,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(dataLines.at(-1), dataLines[0])),
      (bytes) => {
        assert.equal(markdownRows(bytes).length, 18);
        assert.equal(new Set(markdownRows(bytes).map((row) => row.slice(0, 3).join(":"))).size, 17);
      },
      "HC027_ROW_SET",
    ));
  await t.test("same-count replacement changes one task identity", () =>
    roundTripBuffer(
      original,
      checkRows,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| transfer-check | manual-equivalent | block-03 |",
        "| replacement-task | manual-equivalent | block-03 |",
      )),
      (bytes) => {
        assert.equal(markdownRows(bytes).length, 18);
        assert.ok(markdownRows(bytes).some(([task]) => task === "replacement-task"));
      },
      "HC027_ROW_SET",
    ));
});

test("HC-027 per-target predicate and overall rollup separately preserve one target regression", async () => {
  const rows = markdownRows(await readFile(payloadFor("HC-027", "regression-toy.md.template")));
  const targets = rows.map(([target, reference, candidate, comparable]) => ({
    target, reference, candidate, comparable,
  }));
  assert.deepEqual(targets.map(({ target }) => target), ["target-a", "target-b"]);
  assert.deepEqual(targets.map(isTargetRegression), [false, true]);
  assert.equal(hasAnyTargetRegression(targets), true);
  assert.equal(targets.every(isTargetRegression), false);
});
