import assert from "node:assert/strict";
import test from "node:test";
import {
  contractGlobCanMatchBasename,
  contractGlobsIntersect,
  matchesContractGlob,
  validateContractGlob,
} from "../scripts/lib/glob.mjs";

test("contract glob supports literals, segment stars, and trailing recursive segments", () => {
  const cases = [
    [".github/*", ".github/copilot-instructions.md", true],
    [".github/*", ".github/.keep", true],
    [".github/*", ".github/skills/example/SKILL.md", false],
    [".hackathon/evidence/**", ".hackathon/evidence/run/output.md", true],
    [".hackathon/evidence/**", ".hackathon/evidence/.keep", true],
    [".hackathon/evidence/**", ".hackathon/evidence", false],
    ["foo/*", "foo/.bar", true],
    ["foo/*", "foo/bar/baz", false],
    ["Case/*", "case/result.md", false],
  ];

  for (const [pattern, candidate, expected] of cases) {
    assert.equal(
      matchesContractGlob(pattern, candidate),
      expected,
      `${pattern} against ${candidate}`,
    );
  }
});

test("contract glob intersection detects default-deny family overlap", () => {
  assert.equal(
    contractGlobsIntersect(".github/*", ".github/copilot-instructions.md"),
    true,
  );
  assert.equal(
    contractGlobsIntersect(".agents/skills/example/**", ".agents/skills/**"),
    true,
  );
  assert.equal(
    contractGlobsIntersect("evidence/**", ".github/instructions/**"),
    false,
  );
  assert.equal(contractGlobCanMatchBasename("src/*", "AGENTS.md"), true);
  assert.equal(
    contractGlobCanMatchBasename("src/config.json", "AGENTS.md"),
    false,
  );
});

test("contract glob rejects unsupported or unsafe syntax", () => {
  for (const pattern of [
    "../*.md",
    "evidence/?.md",
    "evidence/[ab].md",
    "evidence/{a,b}.md",
    "!evidence/*.md",
    "**/result.md",
    "evidence/**/result.md",
    "evidence\\*.md",
    "evidence/NUL.*",
    "evidence/*.md",
    "foo*",
    "a*b",
  ]) {
    assert.notEqual(validateContractGlob(pattern), undefined, pattern);
  }
});
