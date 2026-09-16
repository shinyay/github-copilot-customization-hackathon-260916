import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";
import {
  buildProposedRepositoryName,
  buildRunPlan,
} from "../scripts/lib/run-plan.mjs";

const challenge = {
  id: "HC-001",
  title: "根拠を大切にするJavaチームメイトを育てよう",
  status: "published",
  challengeVersion: 1,
  pack: "challenges/hc-001/pack",
};
const catalog = { challenges: [challenge] };
const manifest = JSON.parse(
  await readFile(
    path.join(REPOSITORY_ROOT, "challenges", "hc-001", "pack", "manifest.json"),
    "utf8",
  ),
);

test("dry-run plan selects only the requested condition and never marks cleanup complete", () => {
  const plan = buildRunPlan(catalog, manifest, {
    challengeId: "HC-001",
    condition: "baseline",
    team: "Team Sora",
    runId: "Run 01",
  });

  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.condition, "baseline");
  assert.equal(plan.proposedRepositoryName, "copilot-hc-001-team-sora-run-01");
  assert.equal(plan.postCreateSettings.remoteCreation, "deferred");
  assert.ok(
    plan.filesToInject.every(
      ({ destination, ownership, allowOverwrite }) =>
        destination.startsWith(".hackathon/challenge/") &&
        destination.endsWith(".template") &&
        ownership === "pack-applied" &&
        allowOverwrite === false,
    ),
  );
  assert.ok(
    plan.participantChanges.allowedAdditions.every(
      ({ pattern }) => pattern !== ".github/copilot-instructions.md",
    ),
    "Baseline must not allow the active customization",
  );
  assert.ok(
    plan.participantChanges.allowedAdditions.every(
      ({ pattern }) => !pattern.startsWith(".hackathon/"),
    ),
  );
  assert.equal(
    plan.runStateEvidence[0].path,
    ".hackathon/evidence/hc-001/comparison.md",
  );
  assert.ok(
    plan.cleanup.checks.every(
      ({ verification }) => verification === "not-observed",
    ),
  );
});

test("dry-run plan exposes the active addition only for Customized", () => {
  const plan = buildRunPlan(catalog, manifest, {
    challengeId: "HC-001",
    condition: "customized",
    team: "team-sora",
    runId: "run-02",
  });

  assert.ok(
    plan.participantChanges.allowedAdditions.some(
      ({ pattern }) => pattern === ".github/copilot-instructions.md",
    ),
  );
});

test("dry-run plan rejects an undeclared condition", () => {
  assert.throws(
    () =>
      buildRunPlan(catalog, manifest, {
        challengeId: "HC-001",
        condition: "mystery",
        team: "team-sora",
        runId: "run-03",
      }),
    /Unknown condition/u,
  );
});

test("proposed repository names honor the 99/100/101 character boundary", () => {
  const prefixWithTeam = "copilot-hc-001-t-";
  const forLength = (target) =>
    buildProposedRepositoryName(
      "HC-001",
      "t",
      "r".repeat(target - prefixWithTeam.length),
    );

  assert.equal(forLength(99).length, 99);
  assert.equal(forLength(100).length, 100);

  const over = forLength(101);
  assert.equal(over.length, 100);
  assert.match(over, /-[0-9a-f]{12}$/u);
  assert.equal(over, forLength(101), "truncation must be deterministic");
});
