import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { listFilesRecursively } from "../scripts/lib/fs-utils.mjs";
import {
  assertPhase5Pack,
  assertPhase5PageAndGuides,
  fail,
  markdownRows,
  payloadFor,
  rootFor,
  roundTripBuffer,
} from "./support/phase5-contracts.mjs";

const TASKS = ["java-reading", "xml-reading", "mixed-reading"];
const CONDITIONS = ["baseline", "scoped-design", "manual-equivalent"];
const SCOPE_IDS = TASKS.flatMap((task) => CONDITIONS.map((condition) => `${task}:${condition}`)).sort();
const DRAFTS = ["java", "xml"];
const PRODUCTS = ["cloud-agent", "code-review"];
const CASES = ["none", "without-review", "without-cloud"];
const VALUES = { none: "null", "without-review": "code-review", "without-cloud": "cloud-agent" };
const PRODUCT_IDS = DRAFTS.flatMap((draft) =>
  PRODUCTS.flatMap((product) => CASES.map((metadata) => `${draft}:${product}:${metadata}`))).sort();
const MAIN_SOURCES = [
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java",
  "wholesale-core/src/main/resources/application-context.xml",
  "wholesale-core/src/main/resources/spring/module-operations.xml",
  "wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java",
];
const SUPPLEMENTAL_SOURCES = [
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java",
  "wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java",
];
const SOURCE_ROWS = [
  ["main", MAIN_SOURCES[0], "2e2c7b3f141c1622114bb7b9015d0038078dab01", "29357", "a9586d7b43c4577d548180f4ea883ae522f7d97c78927f6a53e1bd48a382b072"],
  ["main", MAIN_SOURCES[1], "517534c12c6bb20c8acb13f12514f952df1537c5", "5169", "ff96dd85980eb533693bd8df6111eead091796f3192645c50944db599d7d081c"],
  ["main", MAIN_SOURCES[2], "7cb38a69254598d09af5a4e3148b4e88911ee9bd", "1405", "284d8e50c62a952aecfab1b3fab6877db5eebd9c5d674e2da40d1a6ef6359eb9"],
  ["main", MAIN_SOURCES[3], "6ae9e49ecaeb7dc8cf62edcd546426240b26c2c0", "11068", "4f9e5b174c3eca01bc5d6c0b10166b92b29728778f6ba395cb43398fc38406f3"],
  ["supplemental", SUPPLEMENTAL_SOURCES[0], "e5c89bb2d4519b167c629f2e311ddd5603b9a577", "1390", "90a6bea7f6f0ad40334dcad9e8ff537ee9d779705e4cf604b6b7225af3e9597c"],
  ["supplemental", SUPPLEMENTAL_SOURCES[1], "18bd0e2e014e1258abc8b987cf0c73b9803e9350", "1760", "22d05b59f52e47bcbe63eafc71a01af6076ae94f87b652f9ef24c7151af7c7db"],
];

function frontmatter(bytes) {
  const match = /^---\n([\s\S]*?)\n---\n\n([\s\S]+)$/u.exec(bytes.toString("utf8"));
  if (!match) fail("HC031_FRONTMATTER");
  const keys = [...match[1].matchAll(/^([A-Za-z][A-Za-z0-9]*):/gmu)].map((item) => item[1]);
  return { metadata: match[1], body: match[2], keys };
}

function checkScope(bytes) {
  const rows = markdownRows(bytes);
  const ids = rows.map(([task, condition]) => `${task}:${condition}`).sort();
  if (JSON.stringify(ids) !== JSON.stringify(SCOPE_IDS) || new Set(ids).size !== 9) {
    fail("HC031_SCOPE_SET");
  }
  return rows;
}

function checkProducts(bytes) {
  const rows = markdownRows(bytes);
  const ids = rows.map(([draft, product, metadata]) => `${draft}:${product}:${metadata}`).sort();
  if (JSON.stringify(ids) !== JSON.stringify(PRODUCT_IDS) || new Set(ids).size !== 12) {
    fail("HC031_PRODUCT_SET");
  }
  for (const row of rows) {
    if (row[3] !== VALUES[row[2]]) fail("HC031_PRODUCT_VALUE");
    if (row[5] !== "not-checked") fail("HC031_LIVE_OBSERVATION");
  }
  return rows;
}

function checkSourceMap(bytes) {
  const rows = markdownRows(bytes);
  if (JSON.stringify(rows) !== JSON.stringify(SOURCE_ROWS)) fail("HC031_SOURCE_RECEIPT");
  return rows;
}

test("HC-031 has exact three conditions, ten inert payloads and two guide routes", async () => {
  const { entry, manifest } = await assertPhase5Pack("HC-031");
  assert.deepEqual(manifest.conditions, CONDITIONS);
  assert.equal(manifest.overlay.length, 10);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), [
    "cloud-scope-observation",
    "review-scope-observation",
  ]);
  assert.equal(entry.optionalRoutes[0].runtimeRequirements[0].status, "blocked");
  assert.equal(entry.optionalRoutes[1].runtimeRequirements[0].status, "not-checked");
});

test("HC-031 page distinguishes supply scope, product metadata and source access", async () => {
  const { text } = await assertPhase5PageAndGuides("HC-031");
  for (const phrase of [
    "`applyTo` は供給scope",
    "ACLではありません",
    "`excludeAgent`",
    "`code-review`",
    "`cloud-agent`",
    "2原稿 × 2製品 × 3metadata案 = 12行",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-031 source map pins four main and two supplemental Runtime receipts", async () => {
  assert.deepEqual(
    checkSourceMap(await readFile(payloadFor("HC-031", "source-map.md.template"))),
    SOURCE_ROWS,
  );
  const { entry } = await assertPhase5Pack("HC-031");
  assert.deepEqual(entry.sourcePaths, MAIN_SOURCES);
  assert.equal(entry.sourcePaths.some((file) => SUPPLEMENTAL_SOURCES.includes(file)), false);
});

test("HC-031 draft frontmatter omits product exclusion by default and allows only formal values in prose", async () => {
  for (const [file, applyTo] of [
    ["java-rules-draft.md.template", "wholesale-core/src/main/java/**/*.java"],
    ["xml-rules-draft.md.template", "wholesale-core/src/main/resources/**/*.xml"],
  ]) {
    const parsed = frontmatter(await readFile(payloadFor("HC-031", file)));
    assert.deepEqual(parsed.keys, ["applyTo"]);
    assert.match(parsed.metadata, new RegExp(`applyTo: "${applyTo.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}"`, "u"));
    assert.match(parsed.body, /excludeAgent/u);
    assert.match(parsed.body, /code-review/u);
    assert.match(parsed.body, /cloud-agent/u);
    assert.match(parsed.body, /ACLではありません/u);
  }
});

test("HC-031 exact nine scope rows reject duplicate and same-count task replacement", async (t) => {
  const original = await readFile(payloadFor("HC-031", "scope-matrix.md.template"));
  checkScope(original);
  await t.test("last scope row duplicates the first", () =>
    roundTripBuffer(
      original,
      checkScope,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| mixed-reading | manual-equivalent | record | record | record | TBD | not-checked |",
        "| java-reading | baseline | record | record | record | TBD | not-checked |",
      )),
      (bytes) => {
        assert.equal(markdownRows(bytes).length, 9);
        assert.equal(new Set(markdownRows(bytes).map((row) => row.slice(0, 2).join(":"))).size, 8);
      },
      "HC031_SCOPE_SET",
    ));
  await t.test("same-count replacement introduces another task", () =>
    roundTripBuffer(
      original,
      checkScope,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| mixed-reading | manual-equivalent |",
        "| replacement-reading | manual-equivalent |",
      )),
      (bytes) => {
        assert.equal(markdownRows(bytes).length, 9);
        assert.ok(markdownRows(bytes).some(([task]) => task === "replacement-reading"));
      },
      "HC031_SCOPE_SET",
    ));
});

test("HC-031 exact twelve product rows reject replacement and exclusion-value reversal", async (t) => {
  const original = await readFile(payloadFor("HC-031", "product-matrix.md.template"));
  checkProducts(original);
  await t.test("same-count replacement duplicates one metadata case", () =>
    roundTripBuffer(
      original,
      checkProducts,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| xml | code-review | without-cloud | cloud-agent | TBD | not-checked |",
        "| xml | code-review | none | null | TBD | not-checked |",
      )),
      (bytes) => {
        assert.equal(markdownRows(bytes).length, 12);
        assert.equal(new Set(markdownRows(bytes).map((row) => row.slice(0, 3).join(":"))).size, 11);
      },
      "HC031_PRODUCT_SET",
    ));
  await t.test("metadata case keeps its ID but reverses the product value", () =>
    roundTripBuffer(
      original,
      checkProducts,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "| java | cloud-agent | without-review | code-review |",
        "| java | cloud-agent | without-review | cloud-agent |",
      )),
      (bytes) => {
        const row = markdownRows(bytes).find((item) =>
          item[0] === "java" && item[1] === "cloud-agent" && item[2] === "without-review");
        assert.equal(row[3], "cloud-agent");
      },
      "HC031_PRODUCT_VALUE",
    ));
});

test("HC-031 new content contains only the formal product key spelling", async () => {
  const forbidden = ["exclude", "agent"].join("-");
  const forbiddenUnderscore = ["exclude", "agent"].join("_");
  const root = rootFor("HC-031");
  for (const file of await listFilesRecursively(root)) {
    const contents = await readFile(path.join(root, ...file.split("/")), "utf8");
    assert.equal(contents.toLowerCase().includes(forbidden), false, file);
    assert.equal(contents.toLowerCase().includes(forbiddenUnderscore), false, file);
  }
});
