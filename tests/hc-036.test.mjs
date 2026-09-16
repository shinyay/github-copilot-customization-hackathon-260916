import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase6Pack,
  assertPhase6PageAndGuides,
  fail,
  markdownRows,
  payloadFor,
  PHASE6_SPECS,
  readPayloadJson,
  roundTripBuffer,
} from "./support/phase6-contracts.mjs";

const CONDITIONS = ["baseline", "basic-request", "draft-request", "push-request"];
const TASKS = ["new-open", "first-ready", "still-draft", "new-push", "manual-rereview"];
const CELLS = CONDITIONS.flatMap((condition) =>
  TASKS.map((task) => `${condition}/${task}`)).sort();

function checkMatrix(bytes) {
  const rows = markdownRows(bytes);
  const cells = rows.map(([condition, task]) => `${condition}/${task}`).sort();
  if (
    rows.length !== 20 ||
    new Set(cells).size !== 20 ||
    JSON.stringify(cells) !== JSON.stringify(CELLS)
  ) {
    fail("HC036_CELL_SET");
  }
  return rows;
}

test("HC-036 publishes the exact synthetic conditions and review-triggers guide", async () => {
  const { entry, manifest } = await assertPhase6Pack("HC-036");
  assert.deepEqual(manifest.conditions, CONDITIONS);
  assert.equal(manifest.overlay.length, 8);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["review-triggers"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["not-checked", "not-checked"],
  );
});

test("HC-036 every payload visibly remains SYNTHETIC_TRAINING_ONLY", async () => {
  for (const file of PHASE6_SPECS["HC-036"].payloads) {
    const contents = await readFile(payloadFor("HC-036", file), "utf8");
    assert.ok(contents.includes("SYNTHETIC_TRAINING_ONLY"), file);
  }
});

test("HC-036 event matrix contains the exact twenty-cell cross-product", async (t) => {
  const original = await readFile(
    payloadFor("HC-036", "event-matrix.md.template"),
  );
  assert.equal(checkMatrix(original).length, 20);

  await t.test("same-count duplicate is rejected", () =>
    roundTripBuffer(
      original,
      checkMatrix,
      (bytes) =>
        Buffer.from(
          bytes.toString("utf8").replace(
            "| push-request | manual-rereview | TODO | TODO | TODO |",
            "| baseline | new-open | TODO | TODO | TODO |",
          ),
        ),
      (bytes) => {
        const rows = markdownRows(bytes);
        assert.equal(rows.length, 20);
        assert.equal(
          new Set(rows.map(([condition, task]) => `${condition}/${task}`)).size,
          19,
        );
      },
      "HC036_CELL_SET",
    ));

  await t.test("same-count task replacement is rejected", () =>
    roundTripBuffer(
      original,
      checkMatrix,
      (bytes) =>
        Buffer.from(
          bytes.toString("utf8").replace(
            "| push-request | manual-rereview |",
            "| push-request | replacement-task |",
          ),
        ),
      (bytes) => {
        assert.ok(
          markdownRows(bytes).some(([, task]) => task === "replacement-task"),
        );
      },
      "HC036_CELL_SET",
    ));
});

test("HC-036 packets keep request stages and stale reviewed heads separate", async () => {
  const fixture = await readPayloadJson("HC-036");
  assert.equal(fixture.label, "SYNTHETIC_TRAINING_ONLY");
  assert.deepEqual(
    fixture.packets.map(({ id }) => id),
    ["P36-01", "P36-02", "P36-03", "P36-04", "P36-05", "P36-06"],
  );
  assert.equal(fixture.packets[0].started, false);
  assert.equal(fixture.packets[1].queue, "queued");
  assert.equal(fixture.packets[2].completed, false);
  assert.equal(fixture.packets[3].reviewedHead, fixture.packets[3].head);
  assert.notEqual(fixture.packets[4].reviewedHead, fixture.packets[4].head);
  assert.equal(fixture.packets[5].actor, null);
  assert.doesNotMatch(
    JSON.stringify(fixture).toLowerCase(),
    /"expected"|"verdict"|"answerkey"/u,
  );
});

test("HC-036 page keeps basic, draft, push and manual event responsibilities distinct", async () => {
  const { text } = await assertPhase6PageAndGuides("HC-036");
  for (const phrase of [
    "`basic-request`",
    "`draft-request`",
    "`push-request`",
    "`manual-rereview`",
    "request / queue / start / complete",
    "reviewed head",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
