import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { readJson, REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";
import { matchesContractGlob } from "../scripts/lib/glob.mjs";

const contractMetadataPath = path.join(
  REPOSITORY_ROOT,
  "catalog",
  "contract-artifacts.json",
);

test("Runtime-shared contract artifacts retain their exact bytes and SHA-256", async () => {
  const metadata = await readJson(contractMetadataPath);
  assert.equal(metadata.schemaVersion, 1);

  for (const artifact of metadata.artifacts) {
    const contents = await readFile(
      path.join(REPOSITORY_ROOT, ...artifact.path.split("/")),
    );
    assert.equal(contents.byteLength, artifact.byteLength, artifact.path);
    assert.equal(
      createHash("sha256").update(contents).digest("hex"),
      artifact.sha256,
      artifact.path,
    );
  }
});

test("every shared Contract v1 glob conformance case passes", async () => {
  const fixture = await readJson(
    path.join(
      REPOSITORY_ROOT,
      "fixtures",
      "contracts",
      "glob-conformance-v1.json",
    ),
  );
  assert.equal(fixture.schemaVersion, 1);

  for (const fixtureCase of fixture.cases) {
    assert.equal(
      matchesContractGlob(fixtureCase.pattern, fixtureCase.path),
      fixtureCase.matches,
      `${fixtureCase.pattern} against ${fixtureCase.path}`,
    );
  }
});
