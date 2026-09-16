import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readJson, REPOSITORY_ROOT, stableJson, writeText } from "../scripts/lib/fs-utils.mjs";
import {
  SOURCE_GIT_TREE,
  SOURCE_PATH_SET_SHA256,
  validateSourceInventory,
} from "../scripts/lib/source-inventory.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";
import { assertCliExit, createPublicationFixture, runCli } from "../test-support/publication-fixtures.mjs";

const inventory = await readJson(path.join(REPOSITORY_ROOT, "catalog", "source-baseline-paths.json"));

test("offline path inventory pins the source commit, actual Git tree and a distinct path-only digest", () => {
  assert.deepEqual(validateSourceInventory(inventory), []);
  assert.equal(inventory.gitTree, SOURCE_GIT_TREE);
  assert.equal(inventory.pathSetSha256, SOURCE_PATH_SET_SHA256);
  assert.equal(inventory.paths.length, 515);
  assert.equal(new Set(inventory.paths).size, 515);
});

test("inventory rejects substituted, missing, duplicate, reordered and unsafe paths for the intended reasons", () => {
  const substituted = structuredClone(inventory);
  substituted.paths[0] = "invented-source.txt";
  assert.equal(substituted.paths.length, 515);
  assert.equal(new Set(substituted.paths).size, 515);
  assert.equal(inventory.paths.includes("invented-source.txt"), false);
  assertErrorCode(validateSourceInventory(substituted), "SOURCE_INVENTORY_DIGEST");

  const missing = structuredClone(inventory);
  missing.paths.pop();
  assert.equal(missing.paths.length, 514);
  assertErrorCode(validateSourceInventory(missing), "SOURCE_INVENTORY_PATHS");

  const duplicate = structuredClone(inventory);
  duplicate.paths[1] = duplicate.paths[0];
  assert.equal(duplicate.paths.length, 515);
  assert.equal(new Set(duplicate.paths).size, 514);
  assertErrorCode(validateSourceInventory(duplicate), "SOURCE_INVENTORY_PATHS");

  const reordered = structuredClone(inventory);
  [reordered.paths[0], reordered.paths[1]] = [reordered.paths[1], reordered.paths[0]];
  assert.deepEqual([...reordered.paths].sort(), [...inventory.paths].sort());
  assertErrorCode(validateSourceInventory(reordered), "SOURCE_INVENTORY_ORDER");

  for (const unsafe of ["../outside", "C:\\outside", "a/CON", "a/e\u0301.txt"]) {
    const value = structuredClone(inventory);
    value.paths[0] = unsafe;
    assertErrorCode(validateSourceInventory(value), "SOURCE_INVENTORY_PATHS");
  }
  const wrongTree = { ...inventory, gitTree: inventory.commit };
  assertErrorCode(validateSourceInventory(wrongTree), "SOURCE_INVENTORY_PROVENANCE");
  assertErrorCode(validateSourceInventory({ ...inventory, byteVerification: true }), "SOURCE_INVENTORY_PROVENANCE");
});

test("real CLI refuses substituted, missing and duplicate inventory paths even for a synthetic core", async (t) => {
  const fixture = await createPublicationFixture(t, ["HC-001"]);
  for (const [mutate, shape, code] of [
    [(value) => { value.paths[0] = "invented-source.txt"; }, (value) => value.paths.length === 515 && new Set(value.paths).size === 515 && value.paths[0] === "invented-source.txt", "SOURCE_INVENTORY_DIGEST"],
    [(value) => value.paths.pop(), (value) => value.paths.length === 514, "SOURCE_INVENTORY_PATHS"],
    [(value) => { value.paths[1] = value.paths[0]; }, (value) => value.paths.length === 515 && new Set(value.paths).size === 514, "SOURCE_INVENTORY_PATHS"],
  ]) {
    const mutated = structuredClone(inventory);
    mutate(mutated);
    assert.equal(shape(mutated), true);
    await writeText(fixture.path("catalog", "source-baseline-paths.json"), stableJson(mutated));
    const result = runCli(fixture.root, "plan-run.mjs", [
      "--dry-run", "--challenge", "HC-001", "--condition", "baseline", "--team", "fixture", "--run", "one",
    ]);
    assertCliExit(result, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, new RegExp(code, "u"));
  }
});
