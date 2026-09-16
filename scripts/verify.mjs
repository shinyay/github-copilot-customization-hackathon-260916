#!/usr/bin/env node
import { loadCatalog, validateCatalog } from "./lib/catalog.mjs";
import {
  validateExpectedPackHashes,
  validateSharedContractArtifacts,
} from "./lib/contracts.mjs";
import { validateMarkdownLinks } from "./lib/links.mjs";
import { validatePublishedPacks } from "./lib/packs.mjs";
import { validatePublishedPages } from "./lib/pages.mjs";
import { validateRepositoryStructure } from "./lib/repository.mjs";

const checks = [];
let catalog;

try {
  catalog = await loadCatalog();
  checks.push(["catalog", validateCatalog(catalog)]);
} catch (error) {
  checks.push([
    "catalog",
    [{ code: "CATALOG_LOAD", message: error.message }],
  ]);
}

if (catalog && checks[0][1].length === 0) {
  checks.push(
    ["pages", await validatePublishedPages(catalog)],
    ["packs", await validatePublishedPacks(catalog)],
    ["repository", await validateRepositoryStructure(catalog)],
    ["pack-hashes", await validateExpectedPackHashes(catalog)],
  );
}

checks.push(
  ["contracts", await validateSharedContractArtifacts()],
  ["links", await validateMarkdownLinks()],
);

let failureCount = 0;
for (const [name, errors] of checks) {
  if (errors.length === 0) {
    console.log(`PASS ${name}`);
    continue;
  }

  console.error(`FAIL ${name}`);
  for (const error of errors) {
    failureCount += 1;
    console.error(`  ${error.code}: ${error.message}`);
  }
}

if (failureCount > 0) {
  console.error(`Verification failed with ${failureCount} error(s).`);
  process.exitCode = 1;
} else {
  console.log(`Verification passed (${checks.length} checks).`);
}
