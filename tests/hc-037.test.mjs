import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase7Pack,
  assertPhase7PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
  roundTripBuffer,
} from "./support/phase7-contracts.mjs";

const CELLS = [
  "baseline/candidate-01",
  "baseline/candidate-02",
  "balanced-plan/candidate-01",
  "balanced-plan/candidate-02",
].sort();

function checkCells(bytes) {
  const rows = [...bytes.toString("utf8").matchAll(
    /^\| (baseline|balanced-plan) \| (candidate-0[12]) \| planned-not-requested \|/gmu,
  )].map((match) => `${match[1]}/${match[2]}`).sort();
  if (
    rows.length !== 4 ||
    new Set(rows).size !== 4 ||
    JSON.stringify(rows) !== JSON.stringify(CELLS)
  ) {
    fail("HC037_CELL_SET");
  }
  return rows;
}

test("HC-037 publishes only Lite and Balanced planning with one optional route", async () => {
  const { entry, manifest } = await assertPhase7Pack("HC-037");
  assert.deepEqual(manifest.conditions, ["baseline", "balanced-plan"]);
  assert.equal(manifest.overlay.length, 9);
  assert.equal(entry.sourceKind, "baseline");
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["review-effort-live"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["not-checked"],
  );
});

test("HC-037 design contains the exact four planned candidate cells", async (t) => {
  const original = await readFile(payloadFor("HC-037", "design.md.template"));
  assert.equal(checkCells(original).length, 4);

  await t.test("same-count duplicate is rejected", () =>
    roundTripBuffer(
      original,
      checkCells,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| balanced-plan | candidate-02 | planned-not-requested |",
        "| baseline | candidate-01 | planned-not-requested |",
      )),
      (bytes) => {
        const rows = [...bytes.toString("utf8").matchAll(
          /^\| (baseline|balanced-plan) \| (candidate-0[12]) \| planned-not-requested \|/gmu,
        )];
        assert.equal(rows.length, 4);
        assert.equal(new Set(rows.map((row) => `${row[1]}/${row[2]}`)).size, 3);
      },
      "HC037_CELL_SET",
    ));
});

test("HC-037 controls preserve both candidates and all live values as unobserved", async () => {
  const controls = await readPayloadJson("HC-037", "input/controls.json.template");
  assert.deepEqual(controls.conditions, [
    { id: "baseline", requestedEffort: "Lite" },
    { id: "balanced-plan", requestedEffort: "Balanced" },
  ]);
  assert.deepEqual(controls.candidates, ["candidate-01", "candidate-02"]);
  assert.equal(controls.state, "planned-not-requested");
  assert.deepEqual(controls.liveObservations, {
    effectiveEffort: null,
    internalModel: null,
    findings: null,
    cost: null,
    agenticFallback: "not-observed",
    ciVisibility: "not-observed",
  });
});

test("HC-037 candidate files stay neutral and are never labeled with an answer", async () => {
  for (const file of [
    "input/candidate-01.diff.template",
    "input/candidate-02.diff.template",
  ]) {
    const text = await readFile(payloadFor("HC-037", file), "utf8");
    assert.match(text, /^SYNTHETIC_TRAINING_ONLY$/mu);
    assert.doesNotMatch(text, /expected|verdict|answer.?key|correct|incorrect/iu);
  }
});

test("HC-037 page separates requested effort from unobserved review behavior", async () => {
  const { text } = await assertPhase7PageAndGuides("HC-037");
  for (const phrase of [
    "`planned-not-requested`",
    "第三条件",
    "effective effort",
    "内部model",
    "agentic fallback",
    "CI visibility",
    "candidate-01",
    "candidate-02",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
