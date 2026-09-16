import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { sha256 } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase3Pack,
  assertPhase3PageAndGuides,
  assertRawMaterial,
  fail,
  payloadFor,
  roundTripBuffer,
} from "./support/phase3-contracts.mjs";

const FACT_HASH = "0590d39c742d3378f56ba3ac31763a42ba8d12ffb32bf1d21a28a40991b804e6";

function checkFact(bytes) {
  if (bytes.length !== 654 || sha256(bytes) !== FACT_HASH) fail("HC016_FIXED_FACT");
}

function checkCards(bytes) {
  const text = bytes.toString("utf8");
  const headings = [...text.matchAll(/^## (card-[pqrs])$/gmu)].map((match) => match[1]);
  if (JSON.stringify(headings) !== JSON.stringify(["card-p", "card-q", "card-r", "card-s"])) {
    fail("HC016_CARD_SET");
  }
  if (!text.includes("BaseService.requireはactorがnullでも認証済みとして通す。")) {
    fail("HC016_CARD_Q");
  }
  if (!text.includes("## card-r\n\n- material: `SYNTHETIC_TRAINING_ONLY`\n- proposed scope: user")) {
    fail("HC016_CARD_SCOPE");
  }
  if ((text.match(/^KEEP-UNCHANGED$/gmu) ?? []).length !== 1) fail("HC016_OTHER_NOTE");
  if (/clear-all|全消去を実行|answer key|正解カード/iu.test(text)) fail("HC016_CARD_ANSWER");
}

test("HC-016 has the exact two-condition, nine-overlay Pack and source provenance", async () => {
  const { entry, manifest } = await assertPhase3Pack("HC-016");
  assert.deepEqual(manifest.conditions, ["baseline", "curated-design"]);
  assert.equal(entry.sourceKind, "baseline");
  assert.equal(entry.sourcePaths.length, 2);
});

test("HC-016 preserves the accepted README and one reciprocal guide-only local-memory route", async () => {
  const { entry, text } = await assertPhase3PageAndGuides("HC-016");
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["local-memory"]);
  for (const phrase of [
    "実Memoryのcondition", "save", "clear", "保存ゼロ", "KEEP-UNCHANGED",
    "--run-id $runId", "runtimeBehavior", "educationalEffect",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-016 fixed fact is the exact 654-byte Labs material and cards remain neutral finite inputs", async () => {
  const fact = await assertRawMaterial("HC-016", "memory-fact.txt.template", 654, FACT_HASH);
  checkFact(fact);
  const cards = await readFile(payloadFor("HC-016", "cards.md.template"));
  checkCards(cards);
  const request = await readFile(payloadFor("HC-016", "request.txt.template"), "utf8");
  assert.equal(
    request,
    "配布資料と現在の二つのrequireを照合し、再利用する情報・保存しない情報・再確認する情報を説明してください。実Memoryの保存・読出し・更新・消去はせず、根拠と未確認を残した引継ぎ案を作ってください。\n",
  );
});

test("HC-016 material negatives assert intended post-images and restore complete original bytes", async (t) => {
  const fact = await readFile(payloadFor("HC-016", "memory-fact.txt.template"));
  await t.test("fixed null handling changes", () => roundTripBuffer(
    fact,
    checkFact,
    (bytes) => Buffer.from(bytes.toString("utf8").replace("actorがnullなら", "actorがnullでも")),
    (bytes) => {
      assert.ok(bytes.includes(Buffer.from("actorがnullでも")));
      assert.ok(bytes.includes(Buffer.from("Actor.requireへ委譲する")));
    },
    "HC016_FIXED_FACT",
  ));
  const cards = await readFile(payloadFor("HC-016", "cards.md.template"));
  await t.test("scope proposal changes without altering another card", () => roundTripBuffer(
    cards,
    checkCards,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      "## card-r\n\n- material: `SYNTHETIC_TRAINING_ONLY`\n- proposed scope: user",
      "## card-r\n\n- material: `SYNTHETIC_TRAINING_ONLY`\n- proposed scope: session",
    )),
    (bytes) => {
      const text = bytes.toString("utf8");
      assert.ok(text.includes("## card-r\n\n- material: `SYNTHETIC_TRAINING_ONLY`\n- proposed scope: session"));
      assert.equal((text.match(/^KEEP-UNCHANGED$/gmu) ?? []).length, 1);
    },
    "HC016_CARD_SCOPE",
  ));
  await t.test("unrelated note changes", () => roundTripBuffer(
    cards,
    checkCards,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(/^KEEP-UNCHANGED$/mu, "CHANGED")),
    (bytes) => {
      assert.ok(bytes.includes(Buffer.from("\nCHANGED\n")));
      assert.equal(bytes.includes(Buffer.from("\nKEEP-UNCHANGED\n")), false);
    },
    "HC016_OTHER_NOTE",
  ));
});
