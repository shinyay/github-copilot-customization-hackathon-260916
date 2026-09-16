import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  REQUIRED_CHALLENGE_HEADINGS,
} from "../scripts/lib/constants.mjs";
import { getPublishedChallenges, loadCatalog } from "../scripts/lib/catalog.mjs";
import { REPOSITORY_ROOT } from "../scripts/lib/fs-utils.mjs";
import { validateChallengePageText, validatePublishedPages } from "../scripts/lib/pages.mjs";
import { assertErrorCode } from "../test-support/helpers.mjs";

async function page(challengeId) {
  return readFile(
    path.join(
      REPOSITORY_ROOT,
      "challenges",
      challengeId.toLowerCase(),
      "README.md",
    ),
    "utf8",
  );
}

test("all published pages contain the complete participant-facing contract", async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(await validatePublishedPages(catalog), []);
  for (const challenge of getPublishedChallenges(catalog)) {
    const challengeId = challenge.id;
    const contents = await page(challengeId);
    assert.deepEqual(
      validateChallengePageText(challengeId, contents),
      [],
      challengeId,
    );
    assert.match(contents, /Hub checkout/u, challengeId);
    assert.match(contents, /Runtime checkout/u, challengeId);
    assert.doesNotMatch(contents, /com\/example\/hackathon/u, challengeId);
    for (const sourcePath of challenge.sourcePaths) {
      assert.ok(
        contents.includes(sourcePath),
        `${challengeId} must include ${sourcePath}`,
      );
    }
  }
});

test("required-heading mutation fails for the intended reason", async () => {
  const contents = await page("HC-001");
  const heading = REQUIRED_CHALLENGE_HEADINGS[5];
  const mutated = contents.replace(`## ${heading}`, `### ${heading}`);
  assert.notEqual(mutated, contents, "mutation must change the page");

  assertErrorCode(
    validateChallengePageText("HC-001", mutated),
    "PAGE_REQUIRED_HEADING",
  );
});

test("HC-001 uses the pinned Runtime source paths and does not assert a known bug", async () => {
  const contents = await page("HC-001");
  assert.match(
    contents,
    /wholesale-core\/src\/main\/java\/jp\/co\/tsubame\/wholesale\/common\/Money\.java/u,
  );
  assert.match(
    contents,
    /wholesale-core\/src\/test\/java\/jp\/co\/tsubame\/wholesale\/common\/CommonRulesTest\.java/u,
  );
  assert.match(contents, /UNKNOWN/u);
  assert.match(contents, /validation\.rounding/u);
  assert.doesNotMatch(contents, /Money\.add/u);
  assert.doesNotMatch(contents, /通貨不一致/u);
});
