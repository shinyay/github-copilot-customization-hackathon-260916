#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { loadCatalog, validateCatalog } from "./lib/catalog.mjs";
import { writeText } from "./lib/fs-utils.mjs";
import { renderGeneratedDocs } from "./lib/render.mjs";

const mode = process.argv[2];
if (!["--write", "--check"].includes(mode)) {
  console.error("Usage: node scripts/render-docs.mjs --write|--check");
  process.exitCode = 2;
} else {
  const catalog = await loadCatalog();
  const catalogErrors = validateCatalog(catalog);
  if (catalogErrors.length > 0) {
    for (const error of catalogErrors) {
      console.error(`${error.code}: ${error.message}`);
    }
    process.exitCode = 1;
  } else {
    const generated = renderGeneratedDocs(catalog);
    const stale = [];

    for (const [filePath, contents] of generated) {
      if (mode === "--write") {
        await writeText(filePath, contents);
      } else {
        let current;
        try {
          current = await readFile(filePath, "utf8");
        } catch {
          current = undefined;
        }
        if (current !== contents) {
          stale.push(filePath);
        }
      }
    }

    if (stale.length > 0) {
      for (const filePath of stale) {
        console.error(`GENERATED_DOC_STALE: ${filePath}`);
      }
      process.exitCode = 1;
    } else {
      console.log(
        mode === "--write"
          ? `Rendered ${generated.size} generated documents.`
          : `Generated documents are current (${generated.size}).`,
      );
    }
  }
}
