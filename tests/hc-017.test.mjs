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

const INPUT_HASH = "8593ce3659396a8b451de79e3cdd437a2e97d8f56f7852809ae9ef198e83ce02";

function checkInput(bytes) {
  if (bytes.length !== 730 || sha256(bytes) !== INPUT_HASH) fail("HC017_FIXED_INPUT");
  if (bytes.toString("utf8").trimEnd().split("\n").length !== 7) fail("HC017_FIXED_LINES");
}

function checkProtocol(bytes) {
  const text = bytes.toString("utf8");
  for (const condition of ["baseline", "model-alternate", "effort-reference", "effort-alternate"]) {
    if (!text.includes(`\`${condition}\``)) fail("HC017_PROTOCOL_SET");
  }
  if (!text.includes("MとEは別group・別run") || !text.includes("Mの応答をEへ渡しません")) {
    fail("HC017_GROUP_SEPARATION");
  }
  if (/manual-equivalent|Autoへ置き換/u.test(text)) fail("HC017_FALSE_CONTROL");
}

test("HC-017 has exact M/E conditions, ten common overlays and five pinned source paths", async () => {
  const { entry, manifest } = await assertPhase3Pack("HC-017");
  assert.deepEqual(manifest.conditions, [
    "baseline", "model-alternate", "effort-reference", "effort-alternate",
  ]);
  assert.equal(entry.sourceKind, "baseline");
  assert.equal(entry.sourcePaths.length, 5);
});

test("HC-017 preserves the accepted README and exactly three separate guide-only routes", async () => {
  const { entry, text } = await assertPhase3PageAndGuides("HC-017");
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), [
    "byok-provider", "utility-models", "host-byok",
  ]);
  for (const phrase of [
    "Mの `baseline` をEの `effort-reference` として再利用してはいけません",
    "Autoはrequest単位でroutingされるため、このcontrolled comparisonから除外します",
    "未観測値を0、default、要求名で埋めません",
    "provider登録、credential保存、User設定変更をRuntime v1は管理しません",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-017 keeps the exact 730-byte seven-line input, initial request and follow-up", async () => {
  const input = await assertRawMaterial("HC-017", "model-input.txt.template", 730, INPUT_HASH);
  checkInput(input);
  const request = await readFile(payloadFor("HC-017", "request.txt.template"), "utf8");
  const followUp = await readFile(payloadFor("HC-017", "follow-up.txt.template"), "utf8");
  assert.equal(
    request,
    "固定分析全文だけを使い、条件・拒否時・根拠 / 未確認の表へ整理してください。入力にない業務事実や実行結果を補わないでください。\n",
  );
  assert.equal(
    followUp,
    "元の固定分析と照合し、抜け・入力にない追加・未確認の断定があれば直してください。新しい業務事実を追加せず、修正箇所を示してください。\n",
  );
  checkProtocol(await readFile(payloadFor("HC-017", "comparison-protocol.md.template")));
});

test("HC-017 detects one-factor and aggregate protocol mutations, then restores exact bytes", async (t) => {
  const input = await readFile(payloadFor("HC-017", "model-input.txt.template"));
  await t.test("one fixed analysis line changes", () => roundTripBuffer(
    input,
    checkInput,
    (bytes) => Buffer.from(bytes.toString("utf8").replace("状態はSUBMITTED", "状態はAPPROVED")),
    (bytes) => {
      assert.ok(bytes.includes(Buffer.from("状態はAPPROVED")));
      assert.ok(bytes.includes(Buffer.from("expectedVersion")));
    },
    "HC017_FIXED_INPUT",
  ));
  const protocol = await readFile(payloadFor("HC-017", "comparison-protocol.md.template"));
  await t.test("one condition disappears from the exact set", () => roundTripBuffer(
    protocol,
    checkProtocol,
    (bytes) => Buffer.from(bytes.toString("utf8").replace("`effort-alternate`", "`effort-reference`")),
    (bytes) => {
      const text = bytes.toString("utf8");
      assert.equal(text.includes("`effort-alternate`"), false);
      assert.ok((text.match(/`effort-reference`/gu) ?? []).length >= 2);
    },
    "HC017_PROTOCOL_SET",
  ));
  await t.test("M result reuse is introduced", () => roundTripBuffer(
    protocol,
    checkProtocol,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      "Mの応答をEへ渡しません",
      "Mの応答をEへ渡します",
    )),
    (bytes) => {
      assert.ok(bytes.includes(Buffer.from("Mの応答をEへ渡します")));
      assert.ok(bytes.includes(Buffer.from("MとEは別group・別run")));
    },
    "HC017_GROUP_SEPARATION",
  ));
});
