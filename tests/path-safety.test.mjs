import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  ACTIVE_CUSTOMIZATION_PATH_PATTERNS,
} from "../scripts/lib/constants.mjs";
import {
  findCaseInsensitiveNfcCollisions,
  isSafeRepositoryPath,
  listFilesRecursively,
  writeText,
} from "../scripts/lib/fs-utils.mjs";

function isActive(relativePath) {
  return ACTIVE_CUSTOMIZATION_PATH_PATTERNS.some((pattern) =>
    pattern.test(relativePath),
  );
}

test("repository paths accept portable relative POSIX paths", () => {
  for (const candidate of [
    "payload/file.md.template",
    ".hackathon/challenge/hc-001/starter/file.template",
    ".github/copilot-instructions.md",
    "evidence/hc-001/result.md",
  ]) {
    assert.equal(isSafeRepositoryPath(candidate), true, candidate);
  }
});

test("repository paths reject traversal, Windows hazards, and non-NFC text", () => {
  const unsafe = [
    "/absolute",
    "C:/drive",
    "../escape",
    "safe/../escape",
    "safe\\file",
    "safe//file",
    "safe/./file",
    "safe/NUL.txt",
    "safe/name.",
    "safe/name ",
    "safe/colon:name",
    "safe/star*name",
    "safe/question?name",
    `safe/null\0name`,
    "payload/e\u0301.template",
  ];

  for (const candidate of unsafe) {
    assert.equal(isSafeRepositoryPath(candidate), false, candidate);
  }
});

test("NFC and case-insensitive collisions are detected", () => {
  assert.deepEqual(
    findCaseInsensitiveNfcCollisions([
      "payload/File.template",
      "payload/file.template",
      "payload/other.template",
    ]),
    [["payload/File.template", "payload/file.template"]],
  );
});

test("default-deny customization families include hooks and plugins", () => {
  for (const candidate of [
    ".github/copilot-instructions.md",
    ".github/instructions/java.instructions.md",
    ".github/prompts/check.prompt.md",
    ".github/agents/reviewer.agent.md",
    ".github/skills/replay/SKILL.md",
    ".agents/skills/replay/SKILL.md",
    ".vscode/mcp.json",
    ".github/hooks/pre-tool.json",
    ".copilot/hooks.json",
    ".github/plugins/example/plugin.json",
    ".github/plugin.json",
    ".copilot/plugins/example/plugin.json",
    "AGENTS.md",
    "CLAUDE.md",
    ".claude/settings.json",
    ".cursor/rules/review.md",
  ]) {
    assert.equal(isActive(candidate), true, candidate);
  }
});

test("dependency traversal exclusions are root-directory-only and never weaken Pack enumeration", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "hc-enumeration-"));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));
  const target = path.join(root, "target");
  await writeText(path.join(target, "kept.md"), "fixture\n");
  await writeText(path.join(root, "dist"), "a file, not an ignored directory\n");
  const pack = path.join(root, "pack");
  await writeText(path.join(pack, "payload", "node_modules", "keep.template"), "inert\n");
  const bin = path.join(root, "node_modules", ".bin");
  await mkdir(bin, { recursive: true });
  const linkType = process.platform === "win32" ? "junction" : "dir";
  await symlink(target, path.join(bin, "fixture"), linkType);

  await assert.rejects(listFilesRecursively(root), /Unsupported filesystem entry/u);
  assert.deepEqual(
    await listFilesRecursively(root, { ignoredRootDirectories: ["node_modules", "dist"] }),
    ["dist", "pack/payload/node_modules/keep.template", "target/kept.md"],
  );
  assert.deepEqual(await listFilesRecursively(pack), ["payload/node_modules/keep.template"]);
  await symlink(target, path.join(pack, "payload", "unsafe"), linkType);
  await assert.rejects(
    listFilesRecursively(pack, { ignoredRootDirectories: ["node_modules"] }),
    /Unsupported filesystem entry/u,
  );
});
