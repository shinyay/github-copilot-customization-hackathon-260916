import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase4Pack,
  assertPhase4PageAndGuides,
  fail,
  payloadFor,
  roundTripBuffer,
  roundTripJson,
} from "./support/phase4-contracts.mjs";

const NOTE_HASH = "22df2a80b62da87852559d22ef6d60e0a8aabc743d15b1ba8a591e9e9c64c2db";
const CELL_IDS = ["baseline", "instructions", "skill", "both"];
const VECTORS = {
  baseline: ["0", "0"],
  instructions: ["1", "0"],
  skill: ["0", "1"],
  both: ["1", "1"],
};

function matrixRows(bytes) {
  return bytes.toString("utf8").split("\n")
    .filter((line) => /^\| (?:baseline|instructions|skill|both) \|/u.test(line))
    .map((line) => line.split("|").slice(1, -1).map((value) => value.trim()));
}

function checkMatrix(bytes) {
  const rows = matrixRows(bytes);
  if (JSON.stringify(rows.map(([id]) => id)) !== JSON.stringify(CELL_IDS)) fail("HC024_CELL_SET");
  for (const [id, i, s] of rows) {
    if (JSON.stringify([i, s]) !== JSON.stringify(VECTORS[id])) fail("HC024_CELL_VECTOR");
  }
  if (rows.find(([id]) => id === "both")[3] !== "fixed-I") fail("HC024_FROZEN_I");
  if (rows.find(([id]) => id === "both")[4] !== "fixed-S") fail("HC024_FROZEN_S");
}

function checkSourcePacket(value) {
  if (
    value.sources.length !== 3 ||
    value.note.path !== "participant/hc-024/operations-note.json" ||
    value.note.sha256 !== NOTE_HASH
  ) fail("HC024_COMMON_INPUT");
}

test("HC-024 has exact four cells, nine overlays and two guide-only routes", async () => {
  const { entry, manifest } = await assertPhase4Pack("HC-024");
  assert.deepEqual(manifest.conditions, CELL_IDS);
  assert.equal(manifest.overlay.length, 9);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), [
    "ablation-preparation",
    "hook-chain-preparation",
  ]);
});

test("HC-024 page and guides preserve exact 00/10/01/11 and no mandatory fifth manual cell", async () => {
  const { text } = await assertPhase4PageAndGuides("HC-024");
  for (const phrase of [
    "00 / 10 / 01 / 11",
    "同じI + 同じS",
    "manual-equivalentを必須の5条件目にしません",
    "presence、discovery、loading、usage、effect",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-024 keeps the exact common note, source packet and four-cell matrix", async () => {
  const note = await readFile(payloadFor("HC-024", "operations-note.json.template"));
  assert.equal(sha256(note), NOTE_HASH);
  const hc023Note = await readFile(
    new URL("../challenges/hc-023/pack/payload/operations-note.json.template", import.meta.url),
  );
  assert.ok(note.equals(hc023Note));
  const sourcePacket = JSON.parse(await readFile(payloadFor("HC-024", "source-packet.json.template"), "utf8"));
  checkSourcePacket(sourcePacket);
  checkMatrix(await readFile(payloadFor("HC-024", "matrix.md.template")));
});

test("HC-024 targeted negatives reject duplicate cell, one-factor I drift and common input mutation", async (t) => {
  const matrix = await readFile(payloadFor("HC-024", "matrix.md.template"));
  await t.test("both is replaced by a duplicate baseline row while row count stays four", () =>
    roundTripBuffer(
      matrix,
      checkMatrix,
      (bytes) => {
        const text = bytes.toString("utf8");
        const baseline = text.split("\n").find((line) => line.startsWith("| baseline |"));
        return Buffer.from(text.replace(
          text.split("\n").find((line) => line.startsWith("| both |")),
          baseline,
        ));
      },
      (bytes) => {
        assert.equal(matrixRows(bytes).length, 4);
        assert.deepEqual(matrixRows(bytes).map(([id]) => id), [
          "baseline", "instructions", "skill", "baseline",
        ]);
      },
      "HC024_CELL_SET",
    ));

  await t.test("only both uses a different frozen I", () =>
    roundTripBuffer(
      matrix,
      checkMatrix,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| both | 1 | 1 | fixed-I |",
        "| both | 1 | 1 | changed-I |",
      )),
      (bytes) => {
        assert.match(bytes.toString("utf8"), /\| instructions \| 1 \| 0 \| fixed-I \|/u);
        assert.match(bytes.toString("utf8"), /\| both \| 1 \| 1 \| changed-I \|/u);
      },
      "HC024_FROZEN_I",
    ));

  const packet = await readFile(payloadFor("HC-024", "source-packet.json.template"));
  await t.test("note hash changes while three source hashes stay fixed", () =>
    roundTripJson(
      packet,
      checkSourcePacket,
      (value) => { value.note.sha256 = "0".repeat(64); },
      (value) => {
        assert.equal(value.sources.length, 3);
        assert.equal(value.note.sha256, "0".repeat(64));
      },
      "HC024_COMMON_INPUT",
    ));
});
