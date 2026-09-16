import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase5Pack,
  assertPhase5PageAndGuides,
  fail,
  markdownRows,
  payloadFor,
  roundTripBuffer,
} from "./support/phase5-contracts.mjs";

const MAIN = [
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java",
  "wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java",
  "pom.xml",
];
const SUPPLEMENTAL = [
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java",
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java",
  "README.md",
];
const SOURCE_ROWS = [
  ["main", MAIN[0], "a72f8251b396929d01f1df3d9785034221393af1", "1419", "647a016546879a67680973676c751668cdb39d84569df26d65cf543c67ef5f15"],
  ["main", MAIN[1], "0678cf741060f08038c22c51028ec7bc2879d59b", "4438", "fecd5c3f633aa7157979ae0a356cb76c9a38631f7123c926bf44ab082ca05a14"],
  ["main", MAIN[2], "4348534e8bf9476a92d3d10d2a078532103a3815", "6153", "e7024dcaf51ba47aad9b4a2461c0a239b22c75faa6eb377334a304af24ef2b4b"],
  ["supplemental", SUPPLEMENTAL[0], "e329bc31c96f50a1b26cc1f5b71fd0da5f588b1b", "596", "58bd62f408fb5b2049e4ca53c560896b2209f6e5c19d9b154aa5c640e5c06150"],
  ["supplemental", SUPPLEMENTAL[1], "f4488fcabd8daede95b5b2aa2dd416cc150bda25", "1397", "9d1472b68fb32c4a1b76b974c7c7414f1489cdc199c35b8a1e5592caab66945a"],
  ["supplemental", SUPPLEMENTAL[2], "9cd51de4bcc19a8b006af1ef5d7d7229e03cdf03", "10083", "d6ece8c03428cd499cad76d4575ad347239b13e47d11d2172aa944b5bfc746e9"],
];

function checkSourceMap(bytes) {
  const rows = markdownRows(bytes);
  if (JSON.stringify(rows) !== JSON.stringify(SOURCE_ROWS)) fail("HC029_SOURCE_RECEIPT");
  const main = rows.filter(([role]) => role === "main").map(([, file]) => file);
  const supplemental = rows.filter(([role]) => role === "supplemental").map(([, file]) => file);
  if (JSON.stringify(main) !== JSON.stringify(MAIN)) fail("HC029_MAIN_SOURCE");
  if (JSON.stringify(supplemental) !== JSON.stringify(SUPPLEMENTAL)) fail("HC029_SUPPLEMENTAL_SOURCE");
  return rows;
}

test("HC-029 has exact three conditions, eight inert payloads and blocked Cloud guide", async () => {
  const { entry, manifest } = await assertPhase5Pack("HC-029");
  assert.deepEqual(manifest.conditions, ["baseline", "customized", "manual-equivalent"]);
  assert.equal(manifest.overlay.length, 8);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["cloud-test-proposal"]);
  assert.equal(entry.optionalRoutes[0].runtimeRequirements[0].status, "blocked");
});

test("HC-029 page keeps main and supplemental source boundaries and proposal-only execution", async () => {
  const { text } = await assertPhase5PageAndGuides("HC-029");
  for (const file of [...MAIN, ...SUPPLEMENTAL]) assert.ok(text.includes(file), file);
  for (const phrase of [
    "提案diff",
    "`git apply`",
    "production code、`pom.xml`、既存testの期待値は変更せず",
    "compile/testは `not-run`",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-029 source map uses Runtime receipts and excludes supplemental paths from catalog sourcePaths", async () => {
  const rows = checkSourceMap(await readFile(payloadFor("HC-029", "source-map.md.template")));
  assert.equal(rows.length, 6);
  const { entry } = await assertPhase5Pack("HC-029");
  assert.deepEqual(entry.sourcePaths, MAIN);
  assert.equal(entry.sourcePaths.some((file) => SUPPLEMENTAL.includes(file)), false);
});

test("HC-029 fixed request is complete in baseline and customized/manual use the exact same body source", async () => {
  const request = await readFile(payloadFor("HC-029", "request.md.template"), "utf8");
  for (const phrase of [
    "JDK8",
    "Java 7構文",
    "Java 7標準API",
    "CommonRulesTest.java",
    "production code",
    "`pom.xml`",
    "既存testの期待値",
    "`not-run`",
  ]) assert.ok(request.includes(phrase), phrase);
  const rows = markdownRows(await readFile(payloadFor("HC-029", "design.md.template")));
  assert.deepEqual(rows.map((row) => row.slice(0, 2)), [
    ["baseline", "none"],
    ["customized", "participant/hc-029/repository-rules.md.template"],
    ["manual-equivalent", "participant/hc-029/repository-rules.md.template"],
  ]);
});

test("HC-029 proposal boundary rejects a same-count main/supplemental role substitution", async () => {
  const original = await readFile(payloadFor("HC-029", "source-map.md.template"));
  roundTripBuffer(
    original,
    checkSourceMap,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      "| supplemental | wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java |",
      "| main | wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java |",
    )),
    (bytes) => {
      assert.equal(markdownRows(bytes).length, 6);
      assert.equal(markdownRows(bytes).filter(([role]) => role === "main").length, 4);
    },
    "HC029_SOURCE_RECEIPT",
  );
  const guide = await readFile(payloadFor("HC-029", "proposal-guide.md.template"), "utf8");
  assert.match(guide, /提案先は次の1 pathだけ/u);
  assert.match(guide, /CommonRulesTest\.java/u);
  assert.match(guide, /Money\.java/u);
  assert.match(guide, /`pom\.xml`/u);
  assert.match(guide, /既存test期待値の変更や削除/u);
  assert.match(guide, /`git apply` しません/u);
});
