import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { RELEASE_WAVES } from "../scripts/lib/constants.mjs";
import { readJson, REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";

test("canonical Pack schema enforces corrected glob and ownership constraints", async () => {
  const schema = await readJson(
    path.join(REPOSITORY_ROOT, "schemas", "challenge-pack.schema.json"),
  );
  const repositoryPattern = new RegExp(
    schema.$defs.repositoryPattern.allOf[1].pattern,
    "u",
  );

  assert.equal(repositoryPattern.test("evidence/**"), true);
  assert.equal(repositoryPattern.test("foo*"), false);
  assert.equal(repositoryPattern.test("a*b"), false);
  assert.equal(repositoryPattern.test("segment/*"), true);

  const allowedAdditionPrefix = new RegExp(
    schema.$defs.allowedAddition.properties.pattern.allOf[1].pattern,
    "u",
  );
  assert.equal(allowedAdditionPrefix.test("*/participant/*"), false);
  assert.equal(
    allowedAdditionPrefix.test(".github/skills/example/**"),
    true,
  );

  assert.equal(
    schema.$defs.allowedAddition.properties.pattern.allOf[1].pattern,
    "^(?!\\*)(?!\\.hackathon(?:/|$))(?!submission(?:/|$))[^/]+(?:/.*)?$",
  );
  assert.equal(
    schema.$defs.allowedAddition.properties.pattern.allOf[2].not.pattern,
    "^(?:\\.hackathon(?:/|$)|submission(?:/|$))",
  );
  assert.equal(
    schema.$defs.evidenceRequirement.properties.path.allOf[1].pattern,
    "^\\.hackathon/evidence/.+",
  );
});

test("all Hub schema references resolve locally, including both route output alternatives", async () => {
  const schemas = await Promise.all([
    "challenge-catalog.schema.json", "challenge-pack.schema.json",
    "run-plan.schema.json", "hub-result-draft.schema.json",
  ].map((name) => readJson(path.join(REPOSITORY_ROOT, "schemas", name))));
  const byId = new Map(schemas.map((schema) => [schema.$id, schema]));
  for (const schema of schemas) {
    function visit(value) {
      if (!value || typeof value !== "object") return;
      if (Object.hasOwn(value, "$ref")) {
        const targetUrl = new URL(value.$ref, schema.$id);
        const fragment = decodeURIComponent(targetUrl.hash.slice(1));
        targetUrl.hash = "";
        let target = byId.get(targetUrl.href);
        assert.notEqual(target, undefined, `Unresolved schema: ${value.$ref}`);
        for (const segment of fragment.split("/").slice(1)) {
          const key = segment.replaceAll("~1", "/").replaceAll("~0", "~");
          assert.ok(
            target && Object.hasOwn(target, key),
            `Unresolved $ref ${value.$ref} in ${schema.$id}`,
          );
          target = target[key];
        }
      }
      for (const child of Object.values(value)) visit(child);
    }
    visit(schema);
  }
});

test("catalog schema closes guide metadata, pins waves and makes source semantics publication-specific", async () => {
  const schema = await readJson(path.join(REPOSITORY_ROOT, "schemas", "challenge-catalog.schema.json"));
  assert.equal(schema.required.includes("releasePlan"), true);
  assert.deepEqual(schema.properties.releasePlan.properties.waves.const, RELEASE_WAVES);
  assert.equal(schema.properties.releasePlan.additionalProperties, false);
  assert.equal(schema.properties.releasePlan.properties.reviewBetweenWaves.const, true);
  assert.equal(schema.properties.releasePlan.properties.participantPrerequisite.const, false);
  for (const definition of ["optionalRoute", "prerequisites", "runtimeRequirement"]) {
    assert.equal(schema.$defs[definition].additionalProperties, false, definition);
    assert.deepEqual(
      [...schema.$defs[definition].required].sort(),
      Object.keys(schema.$defs[definition].properties).sort(),
      definition,
    );
  }
  const route = schema.$defs.optionalRoute;
  assert.equal(route.properties.required.const, false);
  assert.equal(route.properties.liveStatus.const, "live-unobserved");
  assert.equal(route.properties.id.not.const, "core");
  for (const field of ["conditions", "pack", "evidence", "outcome", "grants"]) {
    assert.equal(Object.hasOwn(route.properties, field), false);
  }
  const challenge = schema.$defs.challenge;
  assert.deepEqual(challenge.properties.sourceKind.enum, ["baseline", "synthetic"]);
  assert.equal(challenge.allOf[0].then.required.includes("optionalRoutes"), true);
  assert.equal(challenge.allOf[0].then.required.includes("sourceKind"), true);
  assert.equal(challenge.allOf[1].then.properties.sourcePaths.minItems, 1);
  assert.equal(challenge.allOf[2].then.properties.sourcePaths.maxItems, 0);
});

test("optional output schema cannot admit executable fields or mark an empty requirement set ready", async () => {
  const schema = await readJson(path.join(REPOSITORY_ROOT, "schemas", "run-plan.schema.json"));
  assert.deepEqual(schema.oneOf, [{ $ref: "#/$defs/core" }, { $ref: "#/$defs/optionalGuide" }]);
  const guide = schema.$defs.optionalGuide;
  assert.equal(guide.additionalProperties, false);
  assert.equal(guide.properties.mode.const, "optional-guide");
  assert.equal(guide.properties.readiness.additionalProperties, false);
  assert.deepEqual(guide.properties.readiness.properties.status.enum, ["blocked", "not-checked"]);
  assert.equal(guide.allOf[0].if.properties.runtimeRequirements.contains.properties.status.const, "blocked");
  assert.equal(guide.allOf[0].then.properties.readiness.properties.status.const, "blocked");
  assert.equal(guide.allOf[0].else.properties.readiness.properties.status.const, "not-checked");
  for (const field of ["condition", "filesToInject", "participantChanges", "runStateEvidence", "postCreateSettings"]) {
    assert.equal(Object.hasOwn(guide.properties, field), false);
    assert.equal(Object.hasOwn(schema.$defs.core.properties, field), true);
  }
});
