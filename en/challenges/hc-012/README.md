# HC-012 Create a Set for Choosing Frequently Used Tools Without Hesitation

**Language:** [日本語](../../../challenges/hc-012/README.md) / **English**

## Scenario

When investigating a replay of an order CSV, your predecessor gives you only the instruction, "Select the usual four tools." Which approach is easier for another person to reproduce: searching for each name every time, or selecting a named Tool Set whose purpose is clear?

In this scenario, you keep four fixed tool references unchanged, design procedures for both individual selection and a named collection, and reconstruct them on paper. Actually changing a Profile or calling the tools is not required.

## What this feature is

A Tool Set groups tools that are already available into a selection unit with a name, description, and icon. For example, the bundled sample groups the following four tools into `wholesaleReader`.

```json
{
  "wholesaleReader": {
    "tools": ["search/changes", "search/codebase", "read/problems", "search/usages"],
    "description": "受注取込の実装根拠を読むための既存ツールの選択単位。権限や新機能は追加しない。",
    "icon": "book"
  }
}
```

`#wholesaleReader` is a reference to the collection. It does not add new search capabilities, eligibility, access rights, an ACL, or a sandbox, and it does not guarantee that all four tools will be called automatically.

Treat the following states separately:

1. Members declared in the draft
2. Members reconstructed on paper by someone who read the procedure
3. Members selected in the UI and enabled, including through other selection paths
4. Tools actually called by the Agent

## Good fit / Not a good fit

**Good fit**

- Repeatedly selecting the same tools
- Communicating both the purpose and the members during a handoff
- Expanding the collection to check for missing, extra, or duplicate members
- Aligning the procedures for initial setup and reconfiguration

**Not a good fit**

- A one-time task for which individual names are clearer
- A situation where the other person's client does not have the same tools
- Adding new capabilities or permissions
- Using it as an ACL that absolutely prohibits write operations
- Forcing every member to be called every time

## Goals

1. Organize the entry points in the fixed source and what cannot be confirmed from them.
2. Write a procedure for selecting the four fixed references individually.
3. Write a Tool Set draft containing the same four references, together with a procedure for expanding and checking it.
4. Verify whether another person can reconstruct the same four references from the procedure alone.
5. Also decide when it is better not to create a collection.

## What you need

- An environment where you can edit Markdown and JSONC
- If you will read the source, a working repository created from the public Runtime template
- Only if you will actually try the Tool Sets UI, a compatible version of VS Code and Copilot

Fixed source:

```text
upstream template: shinyay/github-copilot-customization-runtime-template
upstream revision: 8f0b3aa25c4f33facdea691642c2f1cb3901391c
source location: templateから作成したruntime workspace

wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java
wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java
```

The upstream revision identifies the provenance of the source. A working repository created from the template has a new Git history, so its local `HEAD` is not required to match this value.

## Preparation

See [Getting started in the repository README](../../README.md#getting-started) for the common initial steps.

Contents of `starter/`:

```text
starter\
├─ brief.md.template
├─ request.txt.template
├─ customization\reader.toolsets.jsonc.template
├─ reference\tool-members.json.template
└─ worksheets\
   ├─ design.md.template
   ├─ selection-worksheet.md.template
   ├─ membership.md.template
   └─ comparison.md.template
```

Files with the `.template` suffix are inactive samples. This repository does not create an active `.toolsets.jsonc` file that a Profile can recognize. To fill one in, copy it to a separate workspace and manage it as a draft under `manual\hc-012\`.

## Try it

1. Read `starter\brief.md.template`, `starter\request.txt.template`, and `starter\reference\tool-members.json.template`.
2. If the source is available, inspect the following entry points directly.
   - `OrderImportService.importDraft` and `replay`
   - `OrderGroup.canonicalHash` and `validate`
   - The connection prerequisites and replay-related test definitions in `OrderImportPostgresTest`
3. In a working copy of `design.md.template`, record the path, symbol, range read, unverified items, and the reasons for the collection's name, description, and icon.
4. Write the individual-selection procedure in a working copy of `selection-worksheet.md.template`.
5. Using `reader.toolsets.jsonc.template` as a reference, create a collection draft that contains each of the four fixed references exactly once. Do not change the members.
6. Check only the JSON syntax.

   ```powershell
   Get-Content -Raw .\starter\customization\reader.toolsets.jsonc.template |
     ConvertFrom-Json | Out-Null
   ```

7. Have someone seeing the collection name for the first time write the four references back out on paper using only the description and procedure. If you perform the check yourself, record that carryover.
8. In `membership.md.template`, distinguish among the declaration, reconstruction, UI selection, and actual calls.

## Optional: Compare

Use `comparison.md.template` to manually compare individual selection and the named collection for the same source, request, and four references. Even if you use the labels Baseline / Customized, keep them only as labels for this short comparison.

## Verification points

- Are the four fixed references each present exactly once, with no missing, extra, or duplicate entries?
- Have you checked against the fixed list so that both procedures do not reproduce the same incorrect list?
- Does the description communicate both the purpose and what is out of scope, rather than only the collection name?
- Have you distinguished checks that must not be omitted during initial setup from those required during reconfiguration?
- Have you avoided treating no changes from `search/changes` or no diagnostics from `read/problems` as proof of correctness?
- Have you kept draft storage, UI selection, enabled tools, and actual calls separate?

## Further exploration

To safely verify Tool Set discovery, selection, and deselection in an actual Profile, see the [Profile Tool Sets supplemental guide](optional/profile-tool-sets.md).

## Constraints, fallback, and safety

- The four fixed references are `search/changes`, `search/codebase`, `read/problems`, and `search/usages`.
- A Tool Set is a selection unit for existing tools and does not change capabilities, permissions, or approvals.
- Keep the sample as strict-JSON-compatible JSONC and retain the `.template` suffix.
- If the source is unavailable, use the starter explanation card to design only the selection procedure, and explicitly mark code reading as unverified.
- Even if the Tool Sets UI or the fixed tools are unavailable, you can complete the exercise with the inactive draft and paper reconstruction.
- If you try it on an actual machine, use the UI to confirm the current Profile's prompts folder and the `.toolsets.jsonc` suffix. Do not modify `.vscode` or a presumed HOME path.
- At the end, handle only the settings you added during this exercise. Do not delete an existing Profile, synchronization settings, or someone else's files.
