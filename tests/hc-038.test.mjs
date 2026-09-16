import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase7Pack,
  assertPhase7PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
} from "./support/phase7-contracts.mjs";

const PACKETS = Array.from({ length: 12 }, (_, index) =>
  `E${String(index + 1).padStart(2, "0")}`);
const CELLS = ["baseline", "hook-design"].flatMap((condition) =>
  PACKETS.map((packet) => `${condition}/${packet}`)).sort();

function checkCells(text) {
  const rows = [...text.matchAll(
    /^\| (baseline|hook-design) \| (E\d{2}) \| (startup-check|tool-check) \|/gmu,
  )].map((match) => `${match[1]}/${match[2]}`).sort();
  if (
    rows.length !== 24 ||
    new Set(rows).size !== 24 ||
    JSON.stringify(rows) !== JSON.stringify(CELLS)
  ) {
    fail("HC038_CELL_SET");
  }
  return rows;
}

test("HC-038 publishes exact Hook conditions and two blocked live guides", async () => {
  const { entry, manifest } = await assertPhase7Pack("HC-038");
  assert.deepEqual(manifest.conditions, ["baseline", "hook-design"]);
  assert.equal(manifest.overlay.length, 9);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["session-start-live", "pre-tool-live"],
  );
  for (const route of entry.optionalRoutes) {
    assert.deepEqual(
      route.runtimeRequirements.map(({ status }) => status),
      ["not-checked", "blocked"],
    );
  }
});

test("HC-038 design and fixture contain exact E01 through E12 coverage", async () => {
  const design = await readFile(payloadFor("HC-038", "design.md.template"), "utf8");
  assert.equal(checkCells(design).length, 24);
  const fixture = await readPayloadJson("HC-038", "input/events.json.template");
  assert.deepEqual(fixture.packets.map(({ id }) => id), PACKETS);
  assert.deepEqual(
    fixture.packets.slice(0, 3).map(({ task }) => task),
    ["startup-check", "startup-check", "startup-check"],
  );
  assert.ok(fixture.packets.slice(3).every(({ task }) => task === "tool-check"));
  assert.equal(fixture.packets[0].invocationObserved, false);
  assert.equal(fixture.packets[0].checkerExit, null);
  assert.equal(fixture.packets[7].checkerExit, 2);
  assert.match(fixture.packets[7].checkerStdout, /permissionDecision.*allow/u);
  assert.equal(fixture.packets[7].productOutput, null);
  assert.equal(fixture.packets[8].httpStatus, 503);
  assert.equal(fixture.packets[9].timedOut, true);
  assert.equal(fixture.packets[10].timedOut, true);
  assert.equal(fixture.packets[11].checkerStdout, "");
  assert.ok(
    fixture.packets.every((packet) => !Object.hasOwn(packet, "decision")),
  );
});

test("HC-038 checker and packet raw bytes are invariant across both conditions", async () => {
  const { plans } = await assertPhase7Pack("HC-038");
  assert.deepEqual(
    plans.baseline.filesToInject,
    plans["hook-design"].filesToInject,
  );
  const checker = await readFile(
    payloadFor("HC-038", "input/checker.sh.template"),
  );
  const events = await readFile(
    payloadFor("HC-038", "input/events.json.template"),
  );
  assert.equal(
    sha256(checker),
    "5b076363ea4c5615283922c283656147a7bf46bc7bb69d21315c054fbfdbb98d",
  );
  assert.equal(
    sha256(events),
    "3460cbb8d2e1a24ccece0eaeebaf3d9898f17dfdbeb0026108b2d0f0d005ac9e",
  );
  assert.match(checker.toString("utf8"), /SYNTHETIC_TRAINING_ONLY/u);
  assert.match(checker.toString("utf8"), /exit 2/u);
});

test("HC-038 page keeps fixture fields and product permission fields separate", async () => {
  const { text } = await assertPhase7PageAndGuides("HC-038");
  for (const phrase of [
    "`permissionDecision`",
    "`permissionDecisionReason`",
    "教材の簡略field",
    "command timeout",
    "HTTP 503",
    "fail-open",
    "default branch",
    "E01〜E12",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
