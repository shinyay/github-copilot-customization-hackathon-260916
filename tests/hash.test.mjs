import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  hashRecords,
  readJson,
  REPOSITORY_ROOT,
  sha256,
} from "../scripts/lib/fs-utils.mjs";

function manualHash(records) {
  const bytes = [];
  for (const record of records) {
    bytes.push(
      Buffer.from(record.relativePath, "utf8"),
      Buffer.from([0]),
      Buffer.from("100644", "utf8"),
      Buffer.from([0]),
      Buffer.from(String(record.byteLength), "utf8"),
      Buffer.from([0]),
      Buffer.from(record.fileSha256, "utf8"),
      Buffer.from("\n", "utf8"),
    );
  }
  return createHash("sha256").update(Buffer.concat(bytes)).digest("hex");
}

test("pack hash uses the Contract v1 record bytes and UTF-8 path ordering", () => {
  const recordsInHashOrder = [
    {
      relativePath: "manifest.json",
      mode: "100644",
      byteLength: 2,
      fileSha256: "a".repeat(64),
    },
    {
      relativePath: "payload/é.template",
      mode: "100644",
      byteLength: 3,
      fileSha256: "b".repeat(64),
    },
  ];

  assert.equal(
    hashRecords([...recordsInHashOrder].reverse()),
    manualHash(recordsInHashOrder),
  );
});

test("pack hash changes when bytes, length, mode, or path change", () => {
  const base = {
    relativePath: "manifest.json",
    mode: "100644",
    byteLength: 2,
    fileSha256: "a".repeat(64),
  };
  const baseline = hashRecords([base]);

  for (const mutation of [
    { ...base, relativePath: "Manifest.json" },
    { ...base, mode: "100755" },
    { ...base, byteLength: 3 },
    { ...base, fileSha256: "b".repeat(64) },
  ]) {
    assert.notEqual(hashRecords([mutation]), baseline);
  }
});

test("shared pack hash fixture pins the complete v1 record algorithm", async () => {
  const fixture = await readJson(
    path.join(
      REPOSITORY_ROOT,
      "fixtures",
      "contracts",
      "pack-hash-v1.json",
    ),
  );
  const records = fixture.files.map((file) => {
    const contents = Buffer.from(file.contentBase64, "base64");
    return {
      relativePath: file.relativePath,
      mode: fixture.mode,
      byteLength: contents.byteLength,
      fileSha256: sha256(contents),
    };
  });

  assert.equal(hashRecords(records), fixture.expectedSha256);
  assert.equal(
    (await readFile(
      path.join(
        REPOSITORY_ROOT,
        "fixtures",
        "contracts",
        "pack-hash-v1.json",
      ),
    )).byteLength > 0,
    true,
  );
});
