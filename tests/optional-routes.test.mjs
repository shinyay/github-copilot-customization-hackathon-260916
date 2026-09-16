import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadCatalog, validateCatalog } from "../scripts/lib/catalog.mjs";
import { buildHashRecords, readJson, REPOSITORY_ROOT, writeText } from "../scripts/lib/fs-utils.mjs";
import {
  OPTIONAL_SAFETY_NOTICE,
  RUNTIME_CAPABILITY_BLOCKERS,
} from "../scripts/lib/optional-routes.mjs";
import { buildRunPlan } from "../scripts/lib/run-plan.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import {
  assertCliExit,
  createPublicationFixture,
  optionalRoute,
  runCli,
} from "../test-support/publication-fixtures.mjs";

const unchecked = {
  capability: "future-capability",
  status: "not-checked",
  reason: "No live capability check has been performed.",
};
const blocked = {
  capability: "cross-branch-handoff",
  status: "blocked",
  reason: RUNTIME_CAPABILITY_BLOCKERS["cross-branch-handoff"],
};
const removalOptions = { recursive: true, maxRetries: 3, retryDelay: 100 };

test("optional route metadata is closed, non-executable and challenge-local", async () => {
  const catalog = await loadCatalog();
  const base = catalog.challenges[0];
  base.optionalRoutes = [optionalRoute(base.id)];
  assert.deepEqual(validateCatalog(catalog), []);
  for (const field of [
    "unknown", "condition", "conditions", "pack", "evidence", "evidenceRequirements",
    "outcome", "grant", "grants", "allowedMutations", "allowedAdditions",
  ]) {
    const value = structuredClone(catalog);
    value.challenges[0].optionalRoutes[0][field] = [];
    assert.deepEqual(
      Object.keys(value.challenges[0].optionalRoutes[0]).filter((key) => !Object.hasOwn(base.optionalRoutes[0], key)),
      [field],
    );
    assertErrorCode(validateCatalog(value), "CATALOG_OPTIONAL_ROUTE_SHAPE");
  }
  const cases = [
    ["reserved core", (route) => { route.id = "core"; route.page = "challenges/hc-001/optional/core.md"; }, "CATALOG_OPTIONAL_ROUTE_ID"],
    ["uppercase id", (route) => { route.id = "Guide"; }, "CATALOG_OPTIONAL_ROUTE_ID"],
    ["another challenge page", (route) => { route.page = "challenges/hc-006/optional/design-readiness.md"; }, "CATALOG_OPTIONAL_ROUTE_PAGE"],
    ["escape", (route) => { route.page = "../outside.md"; }, "CATALOG_OPTIONAL_ROUTE_PAGE"],
    ["absolute", (route) => { route.page = "C:\\outside.md"; }, "CATALOG_OPTIONAL_ROUTE_PAGE"],
    ["required", (route) => { route.required = true; }, "CATALOG_OPTIONAL_ROUTE_GUIDE"],
    ["observed", (route) => { route.liveStatus = "live-observed"; }, "CATALOG_OPTIONAL_ROUTE_GUIDE"],
    ["no stop explanation", (route) => { route.stopReasons = []; }, "CATALOG_OPTIONAL_STOP_REASONS"],
    ["unknown prerequisite field", (route) => { route.prerequisites.grant = "admin"; }, "CATALOG_OPTIONAL_PREREQUISITES"],
    ["unknown capability field", (route) => { route.runtimeRequirements = [{ ...unchecked, supported: true }]; }, "CATALOG_OPTIONAL_RUNTIME"],
    ["readiness claim", (route) => { route.runtimeRequirements = [{ ...unchecked, status: "ready" }]; }, "CATALOG_OPTIONAL_RUNTIME"],
  ];
  for (const [name, mutate, code] of cases) {
    const value = structuredClone(catalog);
    const route = value.challenges[0].optionalRoutes[0];
    mutate(route);
    assert.notDeepEqual(route, base.optionalRoutes[0], name);
    assertErrorCode(validateCatalog(value), code);
  }
  for (const capability of Object.keys(RUNTIME_CAPABILITY_BLOCKERS)) {
    const value = structuredClone(catalog);
    value.challenges[0].optionalRoutes[0].runtimeRequirements = [{
      capability, status: "not-checked", reason: "Cannot hide a known block.",
    }];
    assert.equal(value.challenges[0].optionalRoutes[0].runtimeRequirements[0].status, "not-checked");
    assertErrorCode(validateCatalog(value), "CATALOG_OPTIONAL_KNOWN_BLOCK");
  }

  const duplicateRoutes = structuredClone(catalog);
  duplicateRoutes.challenges[0].optionalRoutes.push(structuredClone(base.optionalRoutes[0]));
  assert.equal(duplicateRoutes.challenges[0].optionalRoutes.length, 2);
  assert.equal(new Set(duplicateRoutes.challenges[0].optionalRoutes.map(({ id }) => id)).size, 1);
  assertErrorCode(validateCatalog(duplicateRoutes), "CATALOG_OPTIONAL_ROUTE_DUPLICATE");

  const duplicateRequirements = structuredClone(catalog);
  duplicateRequirements.challenges[0].optionalRoutes[0].runtimeRequirements = [
    unchecked, { ...unchecked, reason: "A different description does not make a different capability." },
  ];
  assert.equal(duplicateRequirements.challenges[0].optionalRoutes[0].runtimeRequirements.length, 2);
  assertErrorCode(validateCatalog(duplicateRequirements), "CATALOG_OPTIONAL_RUNTIME_DUPLICATE");
});

test("optional CLI reports mixed blockers with exit 2; empty/unchecked requirements stay unobserved, not ready", async (t) => {
  const cases = [
    ["empty", [], "not-checked", 0],
    ["unchecked", [unchecked], "not-checked", 0],
    ["mixed", [unchecked, blocked], "blocked", 2],
    ["blocked-first", [blocked, unchecked], "blocked", 2],
    ["settings", [{
      capability: "tracked-vscode-settings", status: "blocked",
      reason: RUNTIME_CAPABILITY_BLOCKERS["tracked-vscode-settings"],
    }], "blocked", 2],
  ];
  const routes = cases.map(([id, requirements]) => optionalRoute("HC-001", id, requirements));
  const fixture = await createPublicationFixture(t, ["HC-001"], new Map([["HC-001", routes]]));
  assertCliExit(runCli(fixture.root, "verify.mjs"), 0);
  const before = await buildHashRecords(fixture.root);
  const schema = await readJson(path.join(REPOSITORY_ROOT, "schemas", "run-plan.schema.json"));
  for (const [id, requirements, status, exit] of cases) {
    const result = runCli(fixture.root, "plan-run.mjs", ["--dry-run", "--challenge", "HC-001", `--route=${id}`]);
    assertCliExit(result, exit);
    const guide = JSON.parse(result.stdout);
    assert.deepEqual(Object.keys(guide).sort(), [...schema.$defs.optionalGuide.required].sort());
    assert.equal(guide.mode, "optional-guide");
    assert.equal(guide.route.id, id);
    assert.equal(guide.route.required, false);
    assert.equal(guide.liveStatus, "live-unobserved");
    assert.deepEqual(guide.runtimeRequirements, requirements);
    assert.deepEqual(guide.readiness, {
      status, environment: "not-checked", entitlements: "not-checked",
      additionalApprovals: "not-checked", runtimeCapabilities: status,
    });
    for (const key of [
      "condition", "proposedRepositoryName", "template", "filesToInject",
      "participantChanges", "runStateEvidence", "expectedHubIssueMetadata", "postCreateSettings",
    ]) {
      assert.equal(Object.hasOwn(guide, key), false, key);
    }
    if (exit === 2) {
      assert.match(result.stderr, /^OPTIONAL_ROUTE_BLOCKED:/u);
      assert.ok(requirements.some((requirement) => requirement.status === "blocked"));
    } else {
      assert.equal(result.stderr, "");
    }
    assert.deepEqual(
      buildRunPlan(fixture.catalog, undefined, { challengeId: "HC-001", route: id }),
      guide,
    );
  }
  assert.deepEqual(await buildHashRecords(fixture.root), before, "guide CLI must not write or provision anything");
  const support = await readFile(fixture.path("docs", "generated", "support-matrix.md"), "utf8");
  for (const route of routes) assert.ok(support.includes(`../../${route.page}`));
  assert.match(support, /live-unobserved; Runtime: blocked/u);
  assert.match(support, /live-unobserved; Runtime: not-checked/u);
});

test("optional CLI rejects core-run flags, unknown/unpublished routes and invalid metadata without success-shaped JSON", async (t) => {
  const route = optionalRoute("HC-001");
  const fixture = await createPublicationFixture(t, ["HC-001"], new Map([["HC-001", [route]]]));
  const common = ["--dry-run", "--challenge", "HC-001", "--route", route.id];
  for (const [flag, value] of [["condition", "baseline"], ["team", "fixture"], ["run", "one"]]) {
    const result = runCli(fixture.root, "plan-run.mjs", [...common, `--${flag}`, value]);
    assertCliExit(result, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, new RegExp(`cannot be combined with --${flag}`, "u"));
  }
  for (const [args, message] of [
    [["--dry-run", "--challenge", "HC-001", "--route", "unknown"], /Unknown route/u],
    [["--dry-run", "--challenge", "HC-002", "--route", route.id], /Published challenge not found/u],
    [["--dry-run", "--challenge", "HC-002", "--route", "core", "--condition", "baseline", "--team", "fixture", "--run", "one"], /Published challenge not found/u],
    [["--challenge", "HC-001", "--route", route.id], /--dry-run/u],
    [[...common, "--route", route.id], /Duplicate argument/u],
    [[...common, "--create-remote", "yes"], /Unknown argument/u],
  ]) {
    const result = runCli(fixture.root, "plan-run.mjs", args);
    assertCliExit(result, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, message);
  }

  const challenge = fixture.catalog.challenges[0];
  challenge.optionalRoutes[0].pack = "not-an-executable-route";
  assert.equal(Object.hasOwn(challenge.optionalRoutes[0], "pack"), true);
  await fixture.writeCatalog();
  const invalid = runCli(fixture.root, "plan-run.mjs", common);
  assertCliExit(invalid, 1);
  assert.equal(invalid.stdout, "");
  assert.match(invalid.stderr, /CATALOG_OPTIONAL_ROUTE_SHAPE/u);
  delete challenge.optionalRoutes[0].pack;
  await fixture.writeCatalog();

  await writeText(fixture.path("challenges", "hc-001", "pack", "manifest.json"), "{ invalid Pack JSON\n");
  assertCliExit(runCli(fixture.root, "plan-run.mjs", common), 0);
  const core = runCli(fixture.root, "plan-run.mjs", [
    "--dry-run", "--challenge", "HC-001", "--condition", "baseline", "--team", "fixture", "--run", "one",
  ]);
  assertCliExit(core, 1);
  assert.match(core.stderr, /PACK_MANIFEST_MISSING/u);
});

test("guide pages must exist, be registered, linked in prose and explain safety, non-claims and stop reasons", async (t) => {
  const route = optionalRoute("HC-001");
  const fixture = await createPublicationFixture(t, ["HC-001"], new Map([["HC-001", [route]]]));
  const corePath = fixture.path("challenges", "hc-001", "README.md");
  const guidePath = fixture.path(...route.page.split("/"));
  const core = await readFile(corePath, "utf8");
  const guide = await readFile(guidePath, "utf8");
  const link = `[${route.title}](optional/${route.id}.md)`;
  assert.ok(core.includes(link));
  const failGuide = (code) => {
    const result = runCli(fixture.root, "plan-run.mjs", ["--dry-run", "--challenge", "HC-001", "--route", route.id]);
    assertCliExit(result, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, new RegExp(code, "u"));
  };

  await rm(guidePath, removalOptions);
  failGuide("OPTIONAL_PAGE_MISSING");
  await writeText(guidePath, guide);
  for (const replacement of [
    "No guide link.", `<!-- ${link} -->`, `<!-- ${link}`,
    `\`\`\`md\n${link}\n\`\`\``, `\`${link}\``, `\n    ${link}`, `!${link}`,
  ]) {
    const unlinked = core.replace(link, replacement);
    assert.ok(unlinked.includes(replacement));
    assert.equal(unlinked.split(link).length - 1, replacement.includes(link) ? 1 : 0);
    await writeText(corePath, unlinked);
    failGuide("OPTIONAL_PAGE_UNLINKED");
  }
  await writeText(corePath, core);

  for (const [removed, code] of [
    [OPTIONAL_SAFETY_NOTICE, "OPTIONAL_PAGE_SAFETY"],
    [route.stopReasons[0], "OPTIONAL_PAGE_METADATA"],
    ["live-unobserved", "OPTIONAL_PAGE_SCOPE"],
    ["## Prerequisites", "OPTIONAL_PAGE_HEADINGS"],
  ]) {
    const mutated = guide.replace(removed, "removed by a negative fixture");
    assert.equal(mutated.includes(removed), false);
    await writeText(guidePath, mutated);
    failGuide(code);
  }
  await writeText(guidePath, guide);
  const unlabeled = core.replace("SYNTHETIC_TRAINING_ONLY", "unlabeled material");
  assert.equal(unlabeled.includes("SYNTHETIC_TRAINING_ONLY"), false);
  await writeText(corePath, unlabeled);
  const missingLabel = runCli(fixture.root, "verify.mjs");
  assertCliExit(missingLabel, 1);
  assert.match(missingLabel.stderr, /PAGE_SYNTHETIC_LABEL/u);
  await writeText(corePath, core);

  await writeText(fixture.path("challenges", "hc-001", "optional", "unregistered.md"), guide);
  const orphan = runCli(fixture.root, "verify.mjs");
  assertCliExit(orphan, 1);
  assert.match(orphan.stderr, /OPTIONAL_PAGE_UNREGISTERED/u);
});

test("guide reads reject a non-regular page and a symlink/junction ancestor without reading outside", async (t) => {
  const route = optionalRoute("HC-001");
  const fixture = await createPublicationFixture(t, ["HC-001"], new Map([["HC-001", [route]]]));
  const optionalDirectory = fixture.path("challenges", "hc-001", "optional");
  const guidePath = fixture.path(...route.page.split("/"));
  const guide = await readFile(guidePath, "utf8");
  await rm(guidePath, removalOptions);
  await mkdir(guidePath);
  const args = ["--dry-run", "--challenge", "HC-001", "--route", route.id];
  const directoryPage = runCli(fixture.root, "plan-run.mjs", args);
  assertCliExit(directoryPage, 1);
  assert.equal(directoryPage.stdout, "");
  assert.match(directoryPage.stderr, /OPTIONAL_PAGE_UNSAFE/u);
  await rm(guidePath, removalOptions);
  await writeText(guidePath, guide);

  const outside = await mkdtemp(path.join(os.tmpdir(), "hc-outside-guide-"));
  t.after(() => rm(outside, { ...removalOptions, force: true }));
  const outsideGuide = path.join(outside, `${route.id}.md`);
  await writeText(outsideGuide, guide);
  await rm(optionalDirectory, removalOptions);
  await symlink(outside, optionalDirectory, process.platform === "win32" ? "junction" : "dir");
  try {
    const result = runCli(fixture.root, "plan-run.mjs", args);
    assertCliExit(result, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /OPTIONAL_PAGE_UNSAFE/u);
    assert.equal(await readFile(outsideGuide, "utf8"), guide);
  } finally {
    await unlink(optionalDirectory);
    await writeText(guidePath, guide);
  }
  assertCliExit(runCli(fixture.root, "plan-run.mjs", args), 0);
});

test("both navigation directions use real Markdown tokens, not escaped, code, HTML or image lookalikes", async (t) => {
  const route = optionalRoute("HC-001");
  const fixture = await createPublicationFixture(t, ["HC-001"], new Map([["HC-001", [route]]]));
  const corePath = fixture.path("challenges", "hc-001", "README.md");
  const guidePath = fixture.path(...route.page.split("/"));
  const core = await readFile(corePath, "utf8");
  const guide = await readFile(guidePath, "utf8");
  const args = ["--dry-run", "--challenge", "HC-001", "--route", route.id];
  for (const [pagePath, original, link, destination, error] of [
    [corePath, core, `[${route.title}](optional/${route.id}.md)`, `optional/${route.id}.md`, "OPTIONAL_PAGE_UNLINKED"],
    [guidePath, guide, "[core challenge](../README.md)", "../README.md", "OPTIONAL_PAGE_SCOPE"],
  ]) {
    for (const replacement of [
      `\\${link}`,
      `\`${link}\``,
      `\n\n\`\`\`md\n${link}\n\`\`\`\n\n`,
      `<!-- ${link} -->`,
      `\n\n<div>\n${link}\n</div>\n\n`,
      `\n\n<pre>\n${link}\n</pre>\n\n`,
      `!${link}`,
      `<span title="${link}">not a link</span>`,
      `<a href="${destination}">HTML anchor, not Markdown navigation</a>`,
    ]) {
      const mutated = original.replace(link, replacement);
      assert.ok(mutated.includes(replacement));
      assert.equal(mutated.split(link).length - 1, replacement.includes(link) ? 1 : 0);
      await writeText(pagePath, mutated);
      const result = runCli(fixture.root, "plan-run.mjs", args);
      assertCliExit(result, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, new RegExp(error, "u"));
    }
    for (const replacement of [
      `[Navigation](${destination})`,
      `[Navigation](<${destination}>)`,
      `[Navigation][navigation-ref]\n\n[navigation-ref]: ${destination}\n\n`,
    ]) {
      const mutated = original.replace(link, replacement);
      assert.ok(mutated.includes(replacement));
      await writeText(pagePath, mutated);
      assertCliExit(runCli(fixture.root, "plan-run.mjs", args), 0);
      assertCliExit(runCli(fixture.root, "verify.mjs"), 0);
    }
    await writeText(pagePath, original);
  }

  const hiddenNotice = guide.replace(OPTIONAL_SAFETY_NOTICE, `\n\n<div>\n${OPTIONAL_SAFETY_NOTICE}\n</div>\n\n`);
  assert.match(hiddenNotice, /<div>\nこのガイド/u);
  await writeText(guidePath, hiddenNotice);
  const hidden = runCli(fixture.root, "plan-run.mjs", args);
  assertCliExit(hidden, 1);
  assert.match(hidden.stderr, /OPTIONAL_PAGE_SAFETY/u);
});

test("an independent snapshot without any resolvable parser still runs core but explicitly blocks guide validation", async (t) => {
  const route = optionalRoute("HC-001");
  const fixture = await createPublicationFixture(t, ["HC-001"], new Map([["HC-001", [route]]]));
  const options = {
    cwd: fixture.root,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, NODE_PATH: "" },
  };
  const probe = spawnSync(process.execPath, ["-e", `
    try {
      console.error("unexpected parser: " + require.resolve("markdown-it"));
      process.exitCode = 1;
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
      console.log("parser unavailable");
    }
  `], options);
  assertCliExit(probe, 0);
  assert.equal(probe.stdout.trim(), "parser unavailable", "do not accidentally resolve an ancestor dependency");
  const script = fixture.path("scripts", "plan-run.mjs");
  const coreArgs = [
    script, "--dry-run", "--challenge", "HC-001", "--condition", "baseline", "--team", "fixture", "--run", "one",
  ];
  const implicit = spawnSync(process.execPath, coreArgs, options);
  const explicit = spawnSync(process.execPath, [...coreArgs, "--route", "core"], options);
  assertCliExit(implicit, 0);
  assertCliExit(explicit, 0);
  assert.equal(implicit.stdout, explicit.stdout);
  const guide = spawnSync(process.execPath, [
    script, "--dry-run", "--challenge", "HC-001", "--route", route.id,
  ], options);
  assertCliExit(guide, 1);
  assert.equal(guide.stdout, "");
  assert.match(guide.stderr, /GUIDE_PARSER_UNAVAILABLE/u);
  assert.match(guide.stderr, /npm ci/u);
});
