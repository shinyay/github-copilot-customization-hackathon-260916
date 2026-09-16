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

function checkSetup(bytes) {
  const text = bytes.toString("utf8");
  const timeout = Number(/^\s{4}timeout-minutes: (\d+)$/mu.exec(text)?.[1]);
  if (
    !text.includes("\n  copilot-setup-steps:\n") ||
    !Number.isInteger(timeout) ||
    timeout > 59 ||
    !text.includes("mvn --version") ||
    !text.includes("dependency:go-offline") ||
    /^\s{4}(?:needs|strategy|container|if|continue-on-error):/mu.test(text)
  ) {
    fail("HC035_SETUP_SHAPE");
  }
  return { text, timeout };
}

test("HC-035 publishes exact setup conditions and three guide routes", async () => {
  const { entry, manifest } = await assertPhase6Pack("HC-035");
  assert.deepEqual(manifest.conditions, ["baseline", "preinstalled-plan"]);
  assert.equal(manifest.overlay.length, 9);
  assert.deepEqual(
    entry.optionalRoutes.map(({ id }) => id),
    ["cloud-setup", "review-setup", "postgres-readiness"],
  );
  assert.deepEqual(
    entry.optionalRoutes[0].runtimeRequirements.map(({ status }) => status),
    ["blocked", "not-checked"],
  );
});

test("HC-035 setup draft uses the exact job, timeout boundary and separate checks", async () => {
  const setup = await readFile(
    payloadFor("HC-035", "copilot-setup-steps.yml.template"),
  );
  const parsed = checkSetup(setup);
  assert.equal(parsed.timeout, 59);
  assert.match(parsed.text, /Check Maven range separately/u);
  assert.match(parsed.text, /without claiming tests/u);
  assert.match(parsed.text, /agent still starts with the residual state/u);
});

test("HC-035 timeout 60 mutation is rejected and exact bytes restore", async () => {
  const original = await readFile(
    payloadFor("HC-035", "copilot-setup-steps.yml.template"),
  );
  roundTripBuffer(
    original,
    checkSetup,
    (bytes) =>
      Buffer.from(
        bytes.toString("utf8").replace(
          "    timeout-minutes: 59\n",
          "    timeout-minutes: 60\n",
        ),
      ),
    (bytes) => {
      assert.equal(
        /^\s{4}timeout-minutes: 60$/mu.test(bytes.toString("utf8")),
        true,
      );
    },
    "HC035_SETUP_SHAPE",
  );
});

test("HC-035 packets preserve failure, skipped remainder, Agent start and DB skip", async () => {
  const fixture = await readPayloadJson("HC-035");
  assert.deepEqual(
    fixture.packets.map(({ id }) => id),
    ["P35-01", "P35-02", "P35-03", "P35-04", "P35-05"],
  );
  const failed = fixture.packets[2];
  assert.equal(failed.setupStatusClaim, "failure");
  assert.equal(failed.steps[0].exitCode, 17);
  assert.equal(failed.steps[1].status, "skipped");
  assert.equal(failed.agentStarted, true);
  assert.notEqual(failed.setupStatusClaim, "success");
  assert.equal(fixture.packets[4].databaseTests, "skipped");
});

test("HC-035 instructions keep java17 distinct from JDK 17", async () => {
  const instructions = await readFile(
    payloadFor("HC-035", "instructions.md.template"),
    "utf8",
  );
  for (const phrase of [
    "JDK `[1.8,1.9)`",
    "Maven `[3.9,4.0)`",
    "compiler source/target `1.7`",
    "Java 7 API",
    "`java17:1.0`",
    "not a JDK 17 instruction",
  ]) {
    assert.ok(instructions.includes(phrase), phrase);
  }
});

test("HC-035 page distinguishes current Agents storage from legacy migration", async () => {
  const { text } = await assertPhase6PageAndGuides("HC-035");
  assert.ok(text.includes("Agents secrets and variables"));
  assert.ok(text.includes("自動移行"));
  assert.ok(text.includes("参加者のrepositoryが移行済み"));
  assert.ok(text.includes("secret値"));
  assert.ok(text.includes("setup全体status"));
  assert.ok(text.includes("agent 開始") || text.includes("Agent開始"));
});
