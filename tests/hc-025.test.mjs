import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase4Pack,
  assertPhase4PageAndGuides,
  fail,
  payloadFor,
  roundTripBuffer,
  roundTripJson,
} from "./support/phase4-contracts.mjs";

const BODY = `# 固定packetの保持

LAB25-APP-01のpacketId、三つのsourcePaths、boundaryを変更せず返す。
業務仕様を推測せず、入力不足は不足とする。前会話の出力を補わない。
形式の互換性、発見、本文投入、実効tools、approvalは別の観測である。
ファイル変更、外部送信、model上書き、追加委任、shell、installは禁止。
`;

function parseFrontmatter(bytes) {
  const text = bytes.toString("utf8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]+)$/u.exec(text);
  if (!match) fail("HC025_FRONTMATTER");
  return { metadata: match[1], body: match[2] };
}

function checkSkill(bytes) {
  const { metadata, body } = parseFrontmatter(bytes);
  if (/^(?:model|tools):/mu.test(metadata)) fail("HC025_SKILL_PROPERTIES");
  if (body !== BODY) fail("HC025_COMMON_BODY");
}

function checkPlugin(value) {
  if (Object.hasOwn(value, "agents")) fail("HC025_PLUGIN_ROOT");
}

function checkPermissions(value) {
  if (JSON.stringify(value.proposedTools) !== JSON.stringify(["read", "search"])) {
    fail("HC025_PERMISSION_BROADENED");
  }
  if (value.writes !== false || value.externalNetwork !== false) fail("HC025_PERMISSION_BROADENED");
}

function checkSupport(bytes) {
  const text = bytes.toString("utf8");
  if (
    !text.includes("Prompt FilesはAgent Hostでは読み込まれない") ||
    !text.includes("observedDiscovery: null") ||
    !text.includes("loading: null")
  ) fail("HC025_HOST_PROMPT_BOUNDARY");
}

test("HC-025 has exact two targets, fourteen overlays and two guide-only routes", async () => {
  const { entry, manifest } = await assertPhase4Pack("HC-025");
  assert.deepEqual(manifest.conditions, ["baseline", "host"]);
  assert.equal(manifest.overlay.length, 14);
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), [
    "local-host-probes",
    "other-clients",
  ]);
  assert.equal(entry.title, "Local AgentとAgent Hostへ同じ設計を持ち運ぼう");
});

test("HC-025 page keeps Local Agent and Agent Host distinct from Cloud and live values null", async () => {
  const { text } = await assertPhase4PageAndGuides("HC-025");
  for (const phrase of [
    "Agent HostはCloudの別名ではありません",
    "file format",
    "effective tools",
    "approval",
    "observedLoading: null",
    "実discovery、loading、effective tools、approvalObservedはすべてnull",
  ]) assert.ok(text.includes(phrase), phrase);
  assert.doesNotMatch(text, /^# HC-025 LocalとCloud/mu);
});

test("HC-025 Skill, Prompt and Agent keep one common body with type-specific metadata", async () => {
  const skill = await readFile(payloadFor("HC-025", "kit/hc025-packet/SKILL.md.template"));
  const prompt = await readFile(payloadFor("HC-025", "kit/hc025-packet.prompt.md.template"));
  const agent = await readFile(
    payloadFor("HC-025", "kit/plugin/com.github.copilot/agents/hc025-reader.agent.md.template"),
  );
  checkSkill(skill);
  assert.equal(parseFrontmatter(prompt).body, BODY);
  assert.equal(parseFrontmatter(agent).body, BODY);
  assert.match(parseFrontmatter(prompt).metadata, /^agent:/mu);
  assert.match(parseFrontmatter(prompt).metadata, /^tools:/mu);
  assert.match(parseFrontmatter(agent).metadata, /^target:/mu);
  assert.match(parseFrontmatter(agent).metadata, /^tools:/mu);
});

test("HC-025 fixed invalid examples expose prompt fields in Skill and agents at Plugin root", async () => {
  const invalidSkill = parseFrontmatter(
    await readFile(payloadFor("HC-025", "invalid/prompt-fields-in-skill.md.template")),
  );
  assert.match(invalidSkill.metadata, /^model:/mu);
  assert.match(invalidSkill.metadata, /^tools:/mu);
  assert.equal(invalidSkill.body, BODY);
  const invalidPlugin = JSON.parse(
    await readFile(payloadFor("HC-025", "invalid/agents-at-plugin-root.json.template"), "utf8"),
  );
  assert.deepEqual(invalidPlugin.agents, ["./agents/hc025-reader.agent.md"]);
  checkSupport(await readFile(payloadFor("HC-025", "source-boundaries.md.template")));
});

test("HC-025 targeted negatives isolate Skill, Plugin, body, permission and Host support post-images", async (t) => {
  const skill = await readFile(payloadFor("HC-025", "kit/hc025-packet/SKILL.md.template"));
  await t.test("valid Skill receives Prompt-only tools metadata", () =>
    roundTripBuffer(
      skill,
      checkSkill,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        'description: "LAB25-APP-01の識別子・固定アプリの三path・未確認の境界だけを保持する。"\n',
        'description: "LAB25-APP-01の識別子・固定アプリの三path・未確認の境界だけを保持する。"\ntools: ["read", "search"]\n',
      )),
      (bytes) => {
        assert.match(parseFrontmatter(bytes).metadata, /^tools:/mu);
        assert.equal(parseFrontmatter(bytes).body, BODY);
      },
      "HC025_SKILL_PROPERTIES",
    ));

  const plugin = await readFile(payloadFor("HC-025", "kit/plugin/plugin.json.template"));
  await t.test("standard Plugin manifest receives top-level agents", () =>
    roundTripJson(
      plugin,
      checkPlugin,
      (value) => { value.agents = ["./agents/hc025-reader.agent.md"]; },
      (value) => assert.deepEqual(value.agents, ["./agents/hc025-reader.agent.md"]),
      "HC025_PLUGIN_ROOT",
    ));

  await t.test("common body changes only in the Skill", () =>
    roundTripBuffer(
      skill,
      checkSkill,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "前会話の出力を補わない。",
        "前会話の出力を補ってよい。",
      )),
      (bytes) => {
        assert.match(parseFrontmatter(bytes).body, /補ってよい/u);
        assert.equal(parseFrontmatter(bytes).metadata, parseFrontmatter(skill).metadata);
      },
      "HC025_COMMON_BODY",
    ));

  const permissions = await readFile(payloadFor("HC-025", "permissions.json.template"));
  await t.test("terminal is added while writes/network remain false", () =>
    roundTripJson(
      permissions,
      checkPermissions,
      (value) => { value.proposedTools.push("terminal"); },
      (value) => {
        assert.deepEqual(value.proposedTools, ["read", "search", "terminal"]);
        assert.equal(value.writes, false);
      },
      "HC025_PERMISSION_BROADENED",
    ));

  const support = await readFile(payloadFor("HC-025", "source-boundaries.md.template"));
  await t.test("Host Prompt support is rewritten without changing live null fields", () =>
    roundTripBuffer(
      support,
      checkSupport,
      (bytes) => Buffer.from(bytes.toString("utf8").replace(
        "Prompt FilesはAgent Hostでは読み込まれない",
        "Prompt FilesはAgent Hostで読み込まれる",
      )),
      (bytes) => {
        assert.match(bytes.toString("utf8"), /Hostで読み込まれる/u);
        assert.match(bytes.toString("utf8"), /observedDiscovery: null/u);
      },
      "HC025_HOST_PROMPT_BOUNDARY",
    ));
});
