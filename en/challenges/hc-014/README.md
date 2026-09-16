# HC-014 Distribute and Update a Skill as a Plugin

**Language:** [日本語](../../../challenges/hc-014/README.md) / **English**

## Scenario

You are providing a short reading procedure to people who investigate order CSVs. Copying a Skill file may
be enough if you provide it to one person only once. When distributing an updated version to multiple people, however, you need a unit that makes it easier
to track the distribution name, version, included files, stale copies, and whether the original version could be restored.

In this scenario, you design **both a method for manually distributing the same single Skill and a method for wrapping it in an Agent Plugin package**.
Keep the procedure's body identical, and observe only the differences in distribution metadata and version management.
The samples remain inactive `.template` files throughout; you do not install or enable a Plugin or Skill.

## What this feature is

A Skill is a procedure that an Agent can reference for a specific task. The frontmatter's `name` and `description` indicate its purpose,
and the body describes the actual process.

An Agent Plugin is a unit for distributing and updating customizations such as Skills together.
This scenario covers only the following minimal **Agent Plugins 1.0** structure.

```text
plugin.json.template
skills\
  order-import-evidence\
    SKILL.md.template
```

Example of the manifest corresponding to `plugin.json`:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "wholesale-evidence",
  "version": "1.0.0",
  "description": "受注取込の読解手順を一つの Skill として配る原稿。"
}
```

The package's `name` / `description` / `version`, the Skill frontmatter's `name` / `description`,
and the Skill body are separate controls. Changing the package name does not add knowledge to the body, and merely wrapping a Skill in a package
does not guarantee automatic selection, loading, permissions, correct answers, or speed.

This training material fixes the following:

- `$schema` is the canonical Agent Plugins 1.0 schema.
- The package name is at most 64 characters, using lowercase alphanumeric characters, hyphens, and periods. Its first and last characters are alphanumeric.
- The Skill name and parent directory are `order-import-evidence`.
- The package has only one Skill component. Do not add Hooks, MCP, Agents, rules, or prompts.
- Use the standard discovery structure under the `skills` directory; do not enumerate the component path in the manifest.

References:

- [Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest)
- [Agent Plugins canonical schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
- [VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)

## Good fit / Not a good fit

**Good fit**

- Distributing the same procedure to multiple people while making the distribution name and version explicit
- Reviewing the manifest and Skill together as a unit
- Finding missed updates, stale copies, and partial restoration
- Deciding whether manual distribution is sufficient or the management cost of packaging is justified

**Not a good fit**

- A short-term task for one person where a single file and a short note are sufficient
- Relying on packaging alone to guarantee Skill selection, body loading, authentication, ACLs, or business knowledge
- Publishing to a marketplace or trying installation, update, or rollback in an actual environment
- Proving actual database behavior or historical design reasons from static code and test definitions

## Goals

1. Read the fixed source and create a single Skill draft that separates evidence from unverified information.
2. Freeze the full v1 content, including frontmatter, as UTF-8 without BOM and with LF line endings.
3. Create v2 by changing only one line, from `教材版: training-v1` to `教材版: training-v2`.
4. Make the raw bytes of the same Skill version match between manual distribution and package distribution.
5. For package v2, change only the manifest's `version` to `2.0.0`.
6. Move `current` from v1 → v2 → v1, and verify that every file can be returned to the initial v1.
7. Consider same-name candidates and stale copies across all origins, while distinguishing them from discovery you actually verified.

## What you need

- First complete [Getting started](../../README.md#getting-started) for the repository.
- Git
- Node.js 22 or later
- PowerShell
- An editor that can save UTF-8 without BOM and with LF line endings
- A runtime workspace created from the public Runtime template

  upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

The upstream revision is the provenance of the source. A runtime workspace created from the template has a new Git history,
so its local `HEAD` is not required to match this value.

Contents of `starter\`:

| Path | Purpose |
|---|---|
| `starter\request.txt.template` | Fixed request used when designing the Skill |
| `starter\worksheets\design.md.template` | Design sheet for the reader, the three controls, freezing, and restoration |
| `starter\worksheets\version-ledger.md.template` | Table for recording versions and hashes for v1 / v2 / restored-v1 |
| `starter\worksheets\rollback-checklist.md.template` | Worksheet for verifying a one-factor mismatch and complete restoration |
| `starter\examples\v1\...` | Inactive Agent Plugins 1.0 v1 sample |
| `starter\examples\v2\...` | Inactive v2 sample that differs only in the version and training marker |
| `starter\fixtures\lifecycle-origins.json.template` | Synthetic material for considering duplicate and old-version candidates |
| `starter\tools\validate-plugin.mjs.template` | Helper that checks only this training material's minimal structure |

Do not remove `.template` or move the files to locations where they would actually be discovered, such as `.github\skills`, `.agents\skills`, `.vscode`, or a user's home directory.

## Preparation

Use the source scenario directory `challenges\hc-014` as the working directory.

```powershell
$RuntimeRoot = (Resolve-Path (Read-Host 'Runtime workspace root')).Path
$RequiredSource = @(
  'wholesale-batch\src\main\java\jp\co\tsubame\wholesale\batch\service\OrderImportService.java',
  'wholesale-batch\src\main\java\jp\co\tsubame\wholesale\batch\OrderGroup.java',
  'wholesale-batch\src\test\java\jp\co\tsubame\wholesale\batch\OrderImportPostgresTest.java'
)
$RequiredSource | ForEach-Object {
  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeRoot $_) -PathType Leaf)) {
    throw "runtime workspaceにsourceがありません: $_"
  }
}
```

Do not compare the local `HEAD` with the upstream revision. If the source has unexpected changes, do not
reset the existing workspace; inspect the changes or prepare a new runtime workspace.

Sources to read:

| ID | Path relative to the source checkout | Purpose |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | Use `importDraft` / `replay` as entry points |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | Inspect `canonicalHash` and any additional evidence needed |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | Inspect related test definitions and the boundary of what has not been run |

Create new copies of the working templates.

```powershell
New-Item -ItemType Directory -Path .\work
Copy-Item .\starter\worksheets\design.md.template .\work\design.md
Copy-Item .\starter\worksheets\version-ledger.md.template .\work\version-ledger.md
Copy-Item .\starter\worksheets\rollback-checklist.md.template .\work\rollback-checklist.md
```

If `work` or a destination file already exists, do not overwrite it; inspect its contents and owner.

## Try it

### 1. Freeze the Skill design

Read B1/B2/B3 statically and record the following in `work\design.md`.

- The reader and intended use
- The reading order and how to retain path, symbol, and line range
- Criteria for not filling unverified questions through speculation
- Why package metadata, Skill frontmatter, and the body are separate
- How to distinguish v1 and v2 by only one factor
- Checks before updating and the method for complete restoration

Read only the test definitions; do not run Java, a database, or the network.

### 2. Create the manual v1 draft and package v1 draft

```powershell
$SkillPath = 'skills\order-import-evidence\SKILL.md.template'

New-Item -ItemType Directory -Path .\work\manual\v1
Copy-Item .\starter\examples\v1\skills\order-import-evidence\SKILL.md.template `
  .\work\manual\v1\SKILL.md.template

New-Item -ItemType Directory -Path .\work\package\v1\skills\order-import-evidence
Copy-Item .\starter\examples\v1\plugin.json.template .\work\package\v1\plugin.json.template
Copy-Item .\work\manual\v1\SKILL.md.template ".\work\package\v1\$SkillPath"
```

Edit `work\manual\v1\SKILL.md.template` and `work\package\v1\plugin.json.template` to match your design.
If you edit the Skill, recopy the same raw bytes to the package side. Do not edit the two copies separately.

```powershell
[IO.File]::Copy(
  (Resolve-Path .\work\manual\v1\SKILL.md.template),
  (Resolve-Path ".\work\package\v1\$SkillPath"),
  $true
)
```

### 3. Create v2 by changing only one factor

Do not change v1 after finalizing it. Create v2 as a new copy from v1.

```powershell
$Utf8NoBom = [Text.UTF8Encoding]::new($false)
$SkillV1 = [IO.File]::ReadAllText((Resolve-Path .\work\manual\v1\SKILL.md.template))
if ($SkillV1.Contains("`r") -or
    ([regex]::Matches($SkillV1, '(?m)^教材版: training-v1$').Count -ne 1)) {
  throw 'LF と一つの教材版 marker を確認してください'
}

New-Item -ItemType Directory -Path .\work\manual\v2
$SkillV2 = [regex]::Replace(
  $SkillV1,
  '(?m)^教材版: training-v1$',
  '教材版: training-v2'
)
[IO.File]::WriteAllText(
  (Join-Path (Resolve-Path .\work\manual\v2).Path 'SKILL.md.template'),
  $SkillV2,
  $Utf8NoBom
)

New-Item -ItemType Directory -Path .\work\package\v2\skills\order-import-evidence
[IO.File]::Copy(
  (Resolve-Path .\work\manual\v2\SKILL.md.template),
  (Join-Path (Resolve-Path .\work\package\v2).Path $SkillPath),
  $false
)

$ManifestV1 = [IO.File]::ReadAllText((Resolve-Path .\work\package\v1\plugin.json.template))
if ([regex]::Matches($ManifestV1, '"version": "1.0.0"').Count -ne 1) {
  throw 'manifest の version を確認してください'
}
[IO.File]::WriteAllText(
  (Join-Path (Resolve-Path .\work\package\v2).Path 'plugin.json.template'),
  $ManifestV1.Replace('"version": "1.0.0"', '"version": "2.0.0"'),
  $Utf8NoBom
)
```

### 4. Verify the structure and equivalence

Pass the helper to standard input while retaining its `.template` suffix.

```powershell
Get-Content -Raw -Encoding UTF8 .\starter\tools\validate-plugin.mjs.template |
  node --input-type=module - .\work\package\v1

Get-Content -Raw -Encoding UTF8 .\starter\tools\validate-plugin.mjs.template |
  node --input-type=module - .\work\package\v2

Get-FileHash .\work\manual\v1\SKILL.md.template, ".\work\package\v1\$SkillPath" -Algorithm SHA256
Get-FileHash .\work\manual\v2\SKILL.md.template, ".\work\package\v2\$SkillPath" -Algorithm SHA256
```

Confirm that the two Skill hashes for each version match. The helper checks only the narrow subset used in this training material;
it does not certify compliance with the complete Agent Plugins specification or actual discovery/loading.

### 5. Verify the update and complete restoration

Treat one file on the manual side, and the manifest plus Skill on the package side, as `current`.
First create a new copy of v1, update it to v2, and then return every file to the initial v1.

At each stage, run `Get-FileHash` and record the following in `work\version-ledger.md`.

- Logical version or manifest version
- The Skill's training marker
- Every file's path and SHA-256
- Copy source and destination
- Duplicate and stale-version candidates
- Raw-byte equality between the initial v1 and restored-v1

The package has not been fully restored if only the manifest or only the Skill has been restored.
`starter\fixtures\lifecycle-origins.json.template` contains candidates for consideration on paper.
Do not treat `enabled: false` as evidence that a candidate disappeared from an actual client.

## Optional: Compare

Using the same fixed request, source, design, and complete Skill content, you can manually compare the following.

| Method | What to distribute | What to observe |
|---|---|---|
| Manual | Skill draft and version ledger | Whether you can track the version, provenance, and copies of one file |
| Package | Root manifest, the same Skill, and version ledger | Whether you can track the two-file structure and distribution metadata together |

Compare only identical versions, and do not improve the body on only one side. Actual installation, discovery, loading,
update distribution, and the effect of Disable are not included in this comparison. "Manual is sufficient" and "the package is more complex" are also valid conclusions.

## Verification points

- Can you explain package metadata, Skill frontmatter, and the Skill body separately?
- Does the complete v1 Skill match byte-for-byte between the manual and package sides?
- Is the v2 Skill diff limited to the one training-marker line?
- Is the v2 manifest diff limited to `version`?
- After moving `current` from v1 → v2 → v1, do all files match the initial v1?
- Do you have a method for checking same-name candidates, old versions, and candidates marked disabled across all origins?
- Have you avoided conflating static structure validation with actual discovery/loading?

## Further exploration

- [Checklist before enabling a Plugin](optional/plugin-enable.md)

The optional guide provides safety checks when considering Plugin use in an actual environment. It is not part of this scenario's completion criteria.

## Constraints, fallback, and safety

- Do not remove `.template` or place the files in an actual customization discovery location.
- Do not install, register, enable, or publish the Plugin, or perform marketplace operations.
- Do not modify the source, Java, tests, database, existing configuration, existing Plugins, or a user's home directory.
- Keep the component to one Skill only; do not add Hooks, MCP, Agents, rules, or prompts.
- If evidence outside the source is required, stop with it marked unverified; do not speculate about adoption reasons or incident history.
- If Node.js is unavailable, a person can review the two-file structure, frontmatter, and v1/v2 differences.
- Even without a Plugin-capable client, the exercise can be completed using the inactive drafts, hashes, version ledger, and restoration verification.
- If a file has an unknown owner or there is an unexpected diff, do not overwrite it; stop within the scope you can verify.
