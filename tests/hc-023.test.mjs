import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase4Pack,
  assertPhase4PageAndGuides,
  fail,
  payloadFor,
  roundTripJson,
} from "./support/phase4-contracts.mjs";

const CASE_IDS = Array.from({ length: 10 }, (_, index) =>
  `case-${String(index + 1).padStart(2, "0")}`);
const VIEWS = ["trigger", "scope", "resources", "permissions", "maintenance"];

function checkCase(value, expectedId) {
  if (value.caseId !== expectedId || !Array.isArray(value.sourcePaths)) fail("HC023_CASE_ID");
  if (!Array.isArray(value.resources) || !Array.isArray(value.constraints)) fail("HC023_CASE_SHAPE");
}

function checkSet(ids) {
  if (JSON.stringify(ids) !== JSON.stringify(CASE_IDS)) fail("HC023_CASE_SET");
}

function checkReview(value) {
  for (const view of VIEWS) {
    if (!["satisfied", "not-satisfied", "unobserved"].includes(value[view])) {
      fail("HC023_PER_CASE_REVIEW");
    }
  }
}

test("HC-023 has exact two conditions, thirty-seven overlays, ten cases and no optional route", async () => {
  const { entry, manifest } = await assertPhase4Pack("HC-023");
  assert.deepEqual(manifest.conditions, ["baseline", "checklist"]);
  assert.equal(manifest.overlay.length, 37);
  assert.deepEqual(entry.optionalRoutes, []);
});

test("HC-023 page requires ten tasks per condition, twenty answers and five reason views", async () => {
  const { text } = await assertPhase4PageAndGuides("HC-023");
  for (const phrase of [
    "20個のdistinct answer",
    "trigger",
    "scope",
    "resources",
    "permissions",
    "maintenance",
    "none / manual / 追加不要",
    "追加確認用入力",
  ]) assert.ok(text.includes(phrase), phrase);
  assert.doesNotMatch(text, /hold-out|held-out|instructor-cases|wrongAnswers/u);
});

test("HC-023 distributes exact case/request IDs and public additional-check case", async () => {
  const observed = [];
  for (const id of CASE_IDS) {
    const value = JSON.parse(await readFile(payloadFor("HC-023", `cases/${id}.json.template`), "utf8"));
    checkCase(value, id);
    observed.push(value.caseId);
    const request = await readFile(payloadFor("HC-023", `requests/${id}.txt.template`), "utf8");
    assert.match(request, new RegExp(id, "u"));
    assert.match(request, /追加不要/u);
  }
  checkSet(observed);
  const additional = JSON.parse(
    await readFile(payloadFor("HC-023", "cases/case-10.json.template"), "utf8"),
  );
  assert.equal(additional.taskId, "additional-check");
  assert.match(additional.constraints.join("\n"), /最初から全参加者へ配布/u);
});

test("HC-023 templates distinguish ten tasks from two conditions and preserve one Skill version delta", async () => {
  for (const file of ["answers.md.template", "review.md.template"]) {
    const text = await readFile(payloadFor("HC-023", file), "utf8");
    assert.deepEqual(
      [...text.matchAll(/^## (case-\d{2})$/gmu)].map((match) => match[1]),
      CASE_IDS,
    );
  }
  const v1 = await readFile(
    payloadFor("HC-023", "package/v1/skills/order-import-evidence/SKILL.md.template"),
    "utf8",
  );
  const v2 = await readFile(
    payloadFor("HC-023", "package/v2/skills/order-import-evidence/SKILL.md.template"),
    "utf8",
  );
  assert.equal(v1.replace("training-v1", "training-v2"), v2);
  const plugin1 = JSON.parse(await readFile(payloadFor("HC-023", "package/v1/plugin.json.template"), "utf8"));
  const plugin2 = JSON.parse(await readFile(payloadFor("HC-023", "package/v2/plugin.json.template"), "utf8"));
  assert.equal(plugin1.version, "1.0.0");
  assert.equal(plugin2.version, "2.0.0");
});

test("HC-023 per-case validation and exact rollup reject distinct targeted post-images", async (t) => {
  const original = await readFile(payloadFor("HC-023", "cases/case-10.json.template"));
  await t.test("per-case validator rejects a substituted case ID", () =>
    roundTripJson(
      original,
      (value) => checkCase(value, "case-10"),
      (value) => { value.caseId = "case-01"; },
      (value) => {
        assert.equal(value.caseId, "case-01");
        assert.equal(value.taskId, "additional-check");
      },
      "HC023_CASE_ID",
    ));

  const variants = [
    [...CASE_IDS.slice(0, 9)],
    [...CASE_IDS.slice(0, 9), "case-01"],
    [...CASE_IDS.slice(0, 9), "case-11"],
  ];
  for (const ids of variants) {
    assert.throws(() => checkSet(ids), { code: "HC023_CASE_SET" });
  }
  checkSet([...CASE_IDS]);

  const review = Object.fromEntries(VIEWS.map((view) => [view, "unobserved"]));
  checkReview(review);
  const changed = { ...review, permissions: false };
  assert.equal(changed.permissions, false);
  assert.throws(() => checkReview(changed), { code: "HC023_PER_CASE_REVIEW" });
  checkReview(review);
});
