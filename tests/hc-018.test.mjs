import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase3Pack,
  assertPhase3PageAndGuides,
  fail,
  payloadFor,
  roundTripBuffer,
} from "./support/phase3-contracts.mjs";

function parsePackets(bytes) {
  return [...bytes.toString("utf8").matchAll(/```json\n(\{[^\n]+\})\n```/gu)]
    .map((match) => JSON.parse(match[1]));
}

function types(packet) {
  return packet.events.map(({ type }) => type);
}

function checkEventBytes(bytes) {
  const packets = parsePackets(bytes);
  if (JSON.stringify(packets.map(({ caseId }) => caseId)) !== JSON.stringify([
    "packet-01", "packet-02", "packet-03", "packet-04",
    "packet-05", "packet-06", "packet-07",
  ])) fail("HC018_PACKET_SET");
  if (packets[0].selected !== false || packets[0].events.length !== 0) fail("HC018_NO_CANDIDATE");
  if (
    JSON.stringify(types(packets[1])) !== JSON.stringify(["proposal", "approval"]) ||
    packets[1].events[1].decision !== "pending"
  ) fail("HC018_PENDING");
  if (
    JSON.stringify(types(packets[2])) !== JSON.stringify(["proposal", "approval"]) ||
    packets[2].events[1].decision !== "deny"
  ) fail("HC018_AFTER_DENY");
  for (const packet of packets.slice(3, 7)) {
    if (JSON.stringify(types(packet)) !== JSON.stringify(["proposal", "approval", "execution", "result"])) {
      fail("HC018_EVENT_ORDER");
    }
    if (packet.events[1].decision !== "allow-once") fail("HC018_APPROVAL");
  }
  const osResult = packets[3].events[3];
  if (osResult.layer !== "os" || osResult.code !== "EACCES" || osResult.exitCode !== 1) {
    fail("HC018_OS_PACKET");
  }
  const success = packets[4].events[3];
  if (success.layer !== "program" || success.output !== "v22.16.0\n" || success.exitCode !== 0) {
    fail("HC018_SUCCESS_PACKET");
  }
  const programError = packets[5].events[3];
  if (programError.layer !== "program" || programError.exitCode !== 2) {
    fail("HC018_PROGRAM_PACKET");
  }
  const unknown = packets[6].events[3];
  if (unknown.layer !== "unknown" || unknown.exitCode !== null) fail("HC018_UNKNOWN_PACKET");
}

test("HC-018 has exact two conditions, nine inert overlays and condition-specific additions", async () => {
  const { entry, manifest } = await assertPhase3Pack("HC-018");
  assert.equal(entry.sourceKind, "synthetic");
  assert.deepEqual(entry.sourcePaths, []);
  assert.deepEqual(manifest.conditions, ["baseline", "boundary-review"]);
});

test("HC-018 preserves the accepted README, synthetic label and two separate sandbox guides", async () => {
  const { entry, text } = await assertPhase3PageAndGuides("HC-018");
  assert.deepEqual(entry.optionalRoutes.map(({ id }) => id), ["terminal-sandbox", "mcp-sandbox"]);
  for (const phrase of [
    "SYNTHETIC_TRAINING_ONLY", "false` はaskでありdenyではありません",
    "このChallenge全体で最大1回", "CLIで自分が `node --version` を実行した記録",
    "実sandbox観測", "runtimeBehavior", "educationalEffect",
  ]) assert.ok(text.includes(phrase), phrase);
});

test("HC-018 fixes one command, one request, false-as-ask draft and seven synthetic packets", async () => {
  assert.equal(await readFile(payloadFor("HC-018", "command.txt.template"), "utf8"), "node --version\n");
  assert.equal(
    await readFile(payloadFor("HC-018", "request.txt.template"), "utf8"),
    "このコマンドだけを提案し、必要な通常承認を待ち、許可された場合だけ出力を示してください。設定・ファイル・ネットワーク・別toolは変更しないでください。\n",
  );
  assert.deepEqual(
    JSON.parse(await readFile(payloadFor("HC-018", "settings.json.template"), "utf8")),
    { "chat.tools.terminal.enableAutoApprove": false },
  );
  checkEventBytes(await readFile(payloadFor("HC-018", "events.md.template")));
});

test("HC-018 packet mutations prove sequence, post-image, missing status and restoration", async (t) => {
  const original = await readFile(payloadFor("HC-018", "events.md.template"));
  await t.test("execution appears after human deny", () => roundTripBuffer(
    original,
    checkEventBytes,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      '{"caseId":"packet-03","selected":true,"events":[{"type":"proposal","command":"node --version"},{"type":"approval","decision":"deny","actor":"human"}]}',
      '{"caseId":"packet-03","selected":true,"events":[{"type":"proposal","command":"node --version"},{"type":"approval","decision":"deny","actor":"human"},{"type":"execution"}]}',
    )),
    (bytes) => {
      const packet = parsePackets(bytes)[2];
      assert.deepEqual(types(packet), ["proposal", "approval", "execution"]);
      assert.equal(packet.events[1].decision, "deny");
    },
    "HC018_AFTER_DENY",
  ));
  await t.test("execution is moved before approval", () => roundTripBuffer(
    original,
    checkEventBytes,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      '{"caseId":"packet-04","selected":true,"events":[{"type":"proposal","command":"node --version"},{"type":"approval","decision":"allow-once"},{"type":"execution"},{"type":"result","layer":"os","code":"EACCES","exitCode":1}]}',
      '{"caseId":"packet-04","selected":true,"events":[{"type":"proposal","command":"node --version"},{"type":"execution"},{"type":"approval","decision":"allow-once"},{"type":"result","layer":"os","code":"EACCES","exitCode":1}]}',
    )),
    (bytes) => {
      assert.deepEqual(types(parsePackets(bytes)[3]), ["proposal", "execution", "approval", "result"]);
    },
    "HC018_EVENT_ORDER",
  ));
  await t.test("successful packet loses only exit status", () => roundTripBuffer(
    original,
    checkEventBytes,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      '"output":"v22.16.0\\n","exitCode":0',
      '"output":"v22.16.0\\n"',
    )),
    (bytes) => {
      const result = parsePackets(bytes)[4].events[3];
      assert.equal(result.output, "v22.16.0\n");
      assert.equal(Object.hasOwn(result, "exitCode"), false);
    },
    "HC018_SUCCESS_PACKET",
  ));
  await t.test("program error is relabeled as OS", () => roundTripBuffer(
    original,
    checkEventBytes,
    (bytes) => Buffer.from(bytes.toString("utf8").replace(
      '"layer":"program","code":"SYNTHETIC_PROGRAM_ERROR","exitCode":2',
      '"layer":"os","code":"SYNTHETIC_PROGRAM_ERROR","exitCode":2',
    )),
    (bytes) => {
      const result = parsePackets(bytes)[5].events[3];
      assert.equal(result.layer, "os");
      assert.equal(result.code, "SYNTHETIC_PROGRAM_ERROR");
    },
    "HC018_PROGRAM_PACKET",
  ));
});
