import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatePackManifest } from "../scripts/lib/packs.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import {
  assertPhase4Pack,
  assertPhase4PageAndGuides,
  fail,
  payloadFor,
  readManifest,
  roundTripBuffer,
  roundTripJson,
} from "./support/phase4-contracts.mjs";

const CONDITIONS = ["baseline", "inert", "misplaced", "valid", "manual", "duplicate", "conflict"];
const RULES = [
  "表示カードの見出しは「案内」にしてください。",
  "固定メッセージは一行ずつ箇条書きで表示してください。",
];

function parseInstruction(bytes) {
  const text = bytes.toString("utf8");
  const match = /^(---\n[\s\S]*?\n---\n)([\s\S]+)$/u.exec(text);
  if (!match) fail("HC021_INSTRUCTION_SHAPE");
  return { metadata: match[1], body: match[2] };
}

function checkDuplicate(bytes) {
  const parsed = parseInstruction(bytes);
  if (parsed.body !== `${RULES.join("\n")}\n`) fail("HC021_DUPLICATE_BODY");
}

function checkCasePlan(value) {
  if (JSON.stringify(value.conditions.map(({ id }) => id)) !== JSON.stringify(CONDITIONS)) {
    fail("HC021_CONDITION_SET");
  }
  const baseline = value.conditions.find(({ id }) => id === "baseline");
  const manual = value.conditions.find(({ id }) => id === "manual");
  if (baseline.manualMaterials.length !== 0) fail("HC021_BASELINE_MANUAL_CONTAMINATION");
  if (JSON.stringify(manual.manualMaterials) !== JSON.stringify(["rules.md.template"])) {
    fail("HC021_MANUAL_FULL_RULES");
  }
}

test("HC-021 has exact seven conditions, nine inert overlays and no optional route", async () => {
  const { entry, manifest } = await assertPhase4Pack("HC-021");
  assert.deepEqual(manifest.conditions, CONDITIONS);
  assert.equal(manifest.overlay.length, 9);
  assert.deepEqual(entry.optionalRoutes, []);
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
});

test("HC-021 page separates placement, discovery, content use and output compliance", async () => {
  const { text } = await assertPhase4PageAndGuides("HC-021");
  for (const phrase of [
    "placement（配置）",
    "discovery（発見）",
    "content use（本文利用）",
    "output compliance（出力の従い方）",
    "baseline` → `valid",
    "duplicate` → `conflict",
    "SYNTHETIC_TRAINING_ONLY",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-021 keeps one unified packet, equal duplicate bodies and one-line conflict", async () => {
  const packet = await readFile(payloadFor("HC-021", "packet.txt.template"), "utf8");
  assert.equal(packet, "青いノートを机に置きます。\n白いカードを隣に置きます。\n");
  const rules = await readFile(payloadFor("HC-021", "rules.md.template"), "utf8");
  assert.equal(rules, `${RULES.join("\n")}\n`);
  const duplicate = await readFile(payloadFor("HC-021", "variant-a.instructions.md.template"));
  const conflict = await readFile(payloadFor("HC-021", "variant-b.instructions.md.template"));
  const a = parseInstruction(duplicate);
  const b = parseInstruction(conflict);
  assert.equal(a.metadata, b.metadata);
  assert.equal(a.body, rules);
  assert.equal(
    b.body,
    rules.replace("見出しは「案内」", "見出しは「確認」"),
  );
  const aLines = a.body.trimEnd().split("\n");
  const bLines = b.body.trimEnd().split("\n");
  assert.equal(aLines.filter((line, index) => line !== bLines[index]).length, 1);
});

test("HC-021 targeted negatives prove exact conflict post-image and manual contamination restoration", async (t) => {
  const duplicate = await readFile(payloadFor("HC-021", "variant-a.instructions.md.template"));
  const conflict = await readFile(payloadFor("HC-021", "variant-b.instructions.md.template"));
  await t.test("duplicate body becomes the exact fixed conflict while metadata stays equal", () =>
    roundTripBuffer(
      duplicate,
      checkDuplicate,
      (bytes) => Buffer.from(bytes.toString("utf8").replace("見出しは「案内」", "見出しは「確認」")),
      (bytes) => {
        assert.ok(bytes.equals(conflict));
        assert.equal(parseInstruction(bytes).metadata, parseInstruction(duplicate).metadata);
      },
      "HC021_DUPLICATE_BODY",
    ));

  const plan = await readFile(payloadFor("HC-021", "case-plan.json.template"));
  await t.test("baseline receives the full manual rules only in the deliberate post-image", () =>
    roundTripJson(
      plan,
      checkCasePlan,
      (value) => {
        value.conditions.find(({ id }) => id === "baseline").manualMaterials = ["rules.md.template"];
      },
      (value) => {
        assert.deepEqual(
          value.conditions.find(({ id }) => id === "baseline").manualMaterials,
          ["rules.md.template"],
        );
        assert.deepEqual(
          value.conditions.find(({ id }) => id === "manual").manualMaterials,
          ["rules.md.template"],
        );
      },
      "HC021_BASELINE_MANUAL_CONTAMINATION",
    ));
});

test("HC-021 manifest rejects an active baseline path and restores the original manifest", async () => {
  const original = await readManifest("HC-021");
  assert.deepEqual(validatePackManifest(original, "HC-021"), []);
  const changed = structuredClone(original);
  changed.allowedAdditions.find(({ pattern }) =>
    pattern === ".github/copilot-instructions.md").conditions.push("baseline");
  assert.ok(changed.allowedAdditions.find(({ pattern }) =>
    pattern === ".github/copilot-instructions.md").conditions.includes("baseline"));
  assertErrorCode(validatePackManifest(changed, "HC-021"), "PACK_BASELINE_ACTIVE_CUSTOMIZATION");
  assert.deepEqual(validatePackManifest(structuredClone(original), "HC-021"), []);
});
