import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase7Pack,
  assertPhase7PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
} from "./support/phase7-contracts.mjs";

const CARDS = ["F01", "F02", "F03", "F04", "F05", "F06"];
const TASKS = ["cloud-fact-audit", "review-fact-audit"];
const CELLS = ["baseline", "revalidation-policy"].flatMap((condition) =>
  TASKS.flatMap((task) =>
    CARDS.map((card) => `${condition}/${task}/${card}`))).sort();

function checkCells(text) {
  const rows = [...text.matchAll(
    /^\| (baseline|revalidation-policy) \| (cloud-fact-audit|review-fact-audit) \| (F0[1-6]) \|/gmu,
  )].map((match) => `${match[1]}/${match[2]}/${match[3]}`).sort();
  if (
    rows.length !== 24 ||
    new Set(rows).size !== 24 ||
    JSON.stringify(rows) !== JSON.stringify(CELLS)
  ) {
    fail("HC041_CELL_SET");
  }
  return rows;
}

test("HC-041 publishes exact revalidation conditions and one blocked live route", async () => {
  const { entry, manifest } = await assertPhase7Pack("HC-041");
  assert.deepEqual(manifest.conditions, ["baseline", "revalidation-policy"]);
  assert.equal(manifest.overlay.length, 10);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["memory-reuse-live"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["not-checked", "blocked"],
  );
});

test("HC-041 cards and design preserve exact six-card by two-surface coverage", async () => {
  const design = await readFile(payloadFor("HC-041", "design.md.template"), "utf8");
  assert.equal(checkCells(design).length, 24);
  const fixture = await readPayloadJson("HC-041", "input/fact-cards.json.template");
  assert.deepEqual(fixture.cards.map(({ id }) => id), CARDS);
  assert.equal(fixture.cards[0].sourceRepo, fixture.cards[0].targetRepo);
  assert.notEqual(fixture.cards[2].sourceRepo, fixture.cards[2].targetRepo);
  assert.equal(fixture.cards[3].kind, "user-preference");
  assert.equal(fixture.cards[4].citationRevision, "training-r3");
  assert.equal(fixture.cards[5].reportedUsed, true);
  assert.doesNotMatch(
    JSON.stringify(fixture).toLowerCase(),
    /"expected"|"verdict"|"answerkey"/u,
  );
});

test("HC-041 scope notes separate support, eligibility, use and other memory products", async () => {
  const scope = await readFile(
    payloadFor("HC-041", "input/memory-scope.md.template"),
    "utf8",
  );
  for (const phrase of [
    "Public Preview",
    "same repository",
    "current branch",
    "Standard code review uses repository facts only",
    "user preferences",
    "VS Code Local Memory tool",
    "Copilot App memory",
    "No live Memory record",
  ]) {
    assert.ok(scope.includes(phrase), phrase);
  }
});

test("HC-041 page keeps repository facts and actual reuse unobserved", async () => {
  const { text } = await assertPhase7PageAndGuides("HC-041");
  for (const phrase of [
    "`eligible`",
    "`used`",
    "`supported`",
    "同じrepositoryの現在branch",
    "標準code reviewで使うのはrepository factsのみ",
    "VS CodeのLocal Memory tool",
    "28日",
    "新session",
    "Memory serviceへの保存、再利用、削除は行いません",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
