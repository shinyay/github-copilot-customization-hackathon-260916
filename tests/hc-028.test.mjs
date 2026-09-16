import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase5Pack,
  assertPhase5PageAndGuides,
  fail,
  markdownRows,
  payloadFor,
  roundTripBuffer,
} from "./support/phase5-contracts.mjs";

const REFS = ["base", "head", "default", "starting"];
const STATES = ["revision-identified", "old-head", "unknown"];

function bodyBytes(bytes) {
  const match = /^---\n[\s\S]*?\n---\n\n([\s\S]+)$/u.exec(bytes.toString("utf8"));
  assert.ok(match);
  return Buffer.from(match[1]);
}

function checkRegister(bytes) {
  const rows = markdownRows(bytes);
  if (JSON.stringify(rows.map(([ref]) => ref)) !== JSON.stringify(REFS)) fail("HC028_REF_SET");
  if (new Set(rows.map(([, revision]) => revision)).size !== 4) fail("HC028_REF_SET");
  return rows;
}

function checkAttribution(bytes) {
  const rows = markdownRows(bytes);
  if (JSON.stringify(rows.map(([, state]) => state)) !== JSON.stringify(STATES)) {
    fail("HC028_ATTRIBUTION_STATES");
  }
  if (rows.some((row) => row[4] !== "null" || row[5] !== "not-observed")) {
    fail("HC028_OBSERVED_PROMOTION");
  }
  return rows;
}

test("HC-028 has exact two conditions, thirteen inert payloads and one guide route", async () => {
  const { entry, manifest } = await assertPhase5Pack("HC-028");
  assert.deepEqual(manifest.conditions, ["baseline", "revision-audit"]);
  assert.equal(manifest.overlay.length, 13);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["review-attribution"]);
});

test("HC-028 page separates stored, documented and observed revision evidence", async () => {
  const { text } = await assertPhase5PageAndGuides("HC-028");
  for (const phrase of [
    "Stored revision",
    "Documented rule",
    "Observed attribution",
    "`base`、`head`、`default`、`starting`",
    "task diffとInstructions変更diff",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-028 ref register pins four distinct stored revisions with body and file hashes", async () => {
  const rows = checkRegister(await readFile(payloadFor("HC-028", "ref-register.md.template")));
  for (const [ref, , file, bodyHash, fileHash] of rows) {
    const bytes = await readFile(payloadFor("HC-028", file));
    assert.equal(file, `refs/${ref}-rules.md.template`);
    assert.equal(sha256(bodyBytes(bytes)), bodyHash);
    assert.equal(sha256(bytes), fileHash);
  }
});

test("HC-028 attribution keeps exact three states and never promotes stored hashes to live observation", async (t) => {
  const original = await readFile(payloadFor("HC-028", "attribution-records.md.template"));
  checkAttribution(original);
  const headHash = markdownRows(await readFile(payloadFor("HC-028", "ref-register.md.template")))[1][4];
  await t.test("stored head hash is copied into the observed field", () =>
    roundTripBuffer(
      original,
      checkAttribution,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| ATTR-01 | revision-identified | REF-HEAD-02 | head | null |",
        `| ATTR-01 | revision-identified | REF-HEAD-02 | head | ${headHash} |`,
      )),
      (bytes) => {
        const first = markdownRows(bytes)[0];
        assert.equal(first[4], headHash);
        assert.equal(first[5], "not-observed");
      },
      "HC028_OBSERVED_PROMOTION",
    ));
  await t.test("same-count state replacement duplicates old-head", () =>
    roundTripBuffer(
      original,
      checkAttribution,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| ATTR-03 | unknown | unknown | unknown | null | not-observed |",
        "| ATTR-03 | old-head | REF-HEAD-01 | head | null | not-observed |",
      )),
      (bytes) => {
        assert.equal(markdownRows(bytes).length, 3);
        assert.deepEqual(markdownRows(bytes).map((row) => row[1]), [
          "revision-identified", "old-head", "old-head",
        ]);
      },
      "HC028_ATTRIBUTION_STATES",
    ));
});

test("HC-028 task and configuration diffs remain separate inert documents", async () => {
  const taskDiff = await readFile(payloadFor("HC-028", "task.diff.template"), "utf8");
  const configDiff = await readFile(payloadFor("HC-028", "config.diff.template"), "utf8");
  assert.match(taskDiff, /synthetic\/task-note\.txt/u);
  assert.doesNotMatch(taskDiff, /\.github\/instructions/u);
  assert.match(configDiff, /\.github\/instructions\/synthetic-review\.instructions\.md/u);
  assert.doesNotMatch(configDiff, /synthetic\/task-note\.txt/u);
  assert.match(taskDiff + configDiff, /DO_NOT_APPLY/u);
});
