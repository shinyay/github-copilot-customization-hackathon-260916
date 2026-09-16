import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertPhase6Pack,
  assertPhase6PageAndGuides,
  fail,
  payloadFor,
  readPayloadJson,
  roundTripBuffer,
} from "./support/phase6-contracts.mjs";

function profile(bytes) {
  const match = /^---\n([\s\S]*?)\n---\n\n([\s\S]+)$/u.exec(
    bytes.toString("utf8"),
  );
  if (!match) fail("HC032_PROFILE_FRONTMATTER");
  const tools = /^tools:\n((?:  - .+\n?)+)/mu.exec(match[1])?.[1]
    .trimEnd()
    .split("\n")
    .map((line) => line.replace(/^  - /u, ""));
  return { metadata: match[1], body: match[2], tools };
}

function checkProfiles(controlBytes, evidenceBytes, manualBytes) {
  const control = profile(controlBytes);
  const evidence = profile(evidenceBytes);
  if (
    JSON.stringify(control.tools) !== JSON.stringify(["read", "search"]) ||
    JSON.stringify(evidence.tools) !== JSON.stringify(["read", "search"])
  ) {
    fail("HC032_TOOLS_PARITY");
  }
  if (control.body === evidence.body) fail("HC032_ROLE_FACTOR");
  if (!Buffer.from(evidence.body).equals(manualBytes)) {
    fail("HC032_MANUAL_BODY");
  }
  return { control, evidence };
}

test("HC-032 publishes exact profile conditions, payloads and cloud-profile guide", async () => {
  const { entry, manifest } = await assertPhase6Pack("HC-032");
  assert.deepEqual(manifest.conditions, [
    "baseline",
    "role-profile",
    "manual-equivalent",
  ]);
  assert.equal(manifest.overlay.length, 10);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["cloud-profile"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["blocked", "not-checked"],
  );
});

test("HC-032 profiles keep exact read/search parity and manual body bytes", async () => {
  const control = await readFile(payloadFor("HC-032", "control.agent.md.template"));
  const evidence = await readFile(
    payloadFor("HC-032", "evidence.agent.md.template"),
  );
  const manual = await readFile(payloadFor("HC-032", "manual-body.md.template"));
  const parsed = checkProfiles(control, evidence, manual);
  assert.match(parsed.evidence.body, /ROLE_BODY_START/u);
  assert.match(parsed.evidence.body, /Handoff to the change owner: TODO/u);
});

test("HC-032 tool drift mutation is detected and exact bytes restore", async () => {
  const control = await readFile(payloadFor("HC-032", "control.agent.md.template"));
  const original = await readFile(
    payloadFor("HC-032", "evidence.agent.md.template"),
  );
  const manual = await readFile(payloadFor("HC-032", "manual-body.md.template"));
  roundTripBuffer(
    original,
    (bytes) => checkProfiles(control, bytes, manual),
    (bytes) =>
      Buffer.from(
        bytes.toString("utf8").replace("  - read\n  - search\n", "  - read\n"),
      ),
    (bytes) => {
      assert.deepEqual(profile(bytes).tools, ["read"]);
      assert.equal(bytes.toString("utf8").includes("  - search\n"), false);
    },
    "HC032_TOOLS_PARITY",
  );
});

test("HC-032 packets preserve source, selection, declared, effective and call stages", async () => {
  const fixture = await readPayloadJson("HC-032");
  assert.deepEqual(
    fixture.packets.map(({ id }) => id),
    ["P32-01", "P32-02", "P32-03", "P32-04"],
  );
  assert.ok(
    fixture.packets.every(
      ({ declaredTools }) =>
        JSON.stringify(declaredTools) === JSON.stringify(["read", "search"]),
    ),
  );
  assert.equal(fixture.packets[0].selected, "unknown");
  assert.equal(fixture.packets[2].effectiveTools, "unknown");
  assert.equal(fixture.packets[3].calls.length, 1);
  assert.doesNotMatch(
    JSON.stringify(fixture).toLowerCase(),
    /"expected"|"verdict"|"answerkey"/u,
  );
});

test("HC-032 page keeps declared/effective tools and handoff boundaries explicit", async () => {
  const { text } = await assertPhase6PageAndGuides("HC-032");
  for (const phrase of [
    "declared tools",
    "effective tools",
    "actual calls",
    "変更担当",
    "`approval-trace`",
  ]) {
    assert.ok(text.includes(phrase), phrase);
  }
});
