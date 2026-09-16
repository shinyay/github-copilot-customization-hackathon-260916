# HC-009 Turn the CSV resend investigation playbook into a Skill

**Language:** [日本語](../../../challenges/hc-009/README.md) / **English**

## Scenario

If every CSV import resend investigation requires another explanation of `external_key`, the payload hash, replaying the same request, conflicts from a different payload, and handling a new claim, verification points are easy to miss. There is also a risk of asserting database state or actual incident history after reading only the source.

In this scenario, you will consolidate a safe source-investigation playbook into a Skill. While reusing the Skill body, checklist, source excerpts, and inspection script together, you will separately verify that the Skill was discovered, its body was read, a resource was used, and the script was executed.

## What this feature is

A Skill is a GitHub Copilot customization that packages the procedure, references, and scripts needed for a particular kind of work. In supported clients, a Skill can be selected explicitly and may also be suggested automatically based on the task description.

Automatic discovery depends on the client, settings, and task wording. Do not conclude that "the Skill was used automatically" merely because the answer was good. Separate the following observations.

- The Skill was displayed as a candidate or selected
- The procedure in `SKILL.md` was loaded
- The checklist or source excerpts were used
- The bundled script was executed

The subject is `OrderImportService.importDraft` and `OrderGroup.canonicalHash`. The Skill performs investigation only; it does not execute an import, replay, or database connection.

## Good fit / Not a good fit

**Good fit**

- Packaging a reusable procedure, references, and validation script
- A specialized playbook that can be selected for a particular task
- An investigation with an explicit source boundary and stop condition
- Lightly checking the format of a worksheet that a person reviews

**Not a good fit**

- Short rules that should always apply across a repository
- Storing secrets, real CSV files, or production data
- Unattended imports or replays that assume automatic discovery
- Asserting database state or incident history from static reading alone

## Goals

- Enable a Skill for CSV resend investigations in a working repository
- From the fixed task, explain the three source-defined paths for a new key, the same hash, and a different hash
- Verify the version marker, header fields, quantity normalization, and sorted line fingerprints in `canonicalHash`
- Observe Skill-body, checklist, reference, and script use separately
- Check the investigation note with a dependency-free script
- Never execute an import, replay, or database operation

## What you need

- A GitHub Copilot client that supports Skills
- A working repository containing the Java source used by the scenario
- Node.js if you use the inspection script
- The inactive materials in this directory

| Material | Purpose |
|---|---|
| [`starter/customization/SKILL.md.template`](../../../challenges/hc-009/starter/customization/SKILL.md.template) | Starting point for the Skill body |
| [`starter/customization/checklist.md.template`](../../../challenges/hc-009/starter/customization/checklist.md.template) | Verification items for replay decisions |
| [`OrderImportService.java.excerpt.md.template`](../../../challenges/hc-009/starter/reference/OrderImportService.java.excerpt.md.template) | Read-only fallback excerpt for `importDraft` |
| [`OrderGroup.java.excerpt.md.template`](../../../challenges/hc-009/starter/reference/OrderGroup.java.excerpt.md.template) | Read-only fallback excerpt for `canonicalHash` |
| [`starter/tools/check-investigation-note.mjs.template`](../../../challenges/hc-009/starter/tools/check-investigation-note.mjs.template) | Script that checks the headings in an investigation note |
| [`starter/worksheets/investigation-note.md.template`](../../../challenges/hc-009/starter/worksheets/investigation-note.md.template) | Investigation note completed by a person |

## Preparation

1. Follow the common [Getting started](../../README.md#getting-started) steps in a working repository.
2. Copy the following materials into the working repository and remove `.template` only there.

   | Copy from | Destination in the working repository |
   |---|---|
   | `starter/customization/SKILL.md.template` | `.github/skills/csv-resend-investigation/SKILL.md` |
   | `starter/customization/checklist.md.template` | `.github/skills/csv-resend-investigation/checklist.md` |
   | `starter/reference/OrderImportService.java.excerpt.md.template` | `.github/skills/csv-resend-investigation/reference/OrderImportService.java.excerpt.md` |
   | `starter/reference/OrderGroup.java.excerpt.md.template` | `.github/skills/csv-resend-investigation/reference/OrderGroup.java.excerpt.md` |
   | `starter/tools/check-investigation-note.mjs.template` | `.github/skills/csv-resend-investigation/scripts/check-investigation-note.mjs` |

3. Copy `starter/worksheets/investigation-note.md.template` to your own notes, such as `notes/hc-009-investigation.md`.
4. If possible, confirm that you can open the following full source. If it is unavailable, use only the bundled excerpts and record that limitation in the note.
   - `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
   - `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
5. Use the following fixed task without changing it.

   > Investigate `OrderImportService.importDraft` and `OrderGroup.canonicalHash`, and explain the results that source defines for a new `external_key`, an existing claim with the same hash, and an existing claim with a different hash. Do not speculate about database state or actual incident history, and do not execute import/replay.

Keep every material in this public repository as a `.template` file; do not create an active Skill here.

## Try it

1. In a fresh conversation, explicitly select the `csv-resend-investigation` Skill and provide the fixed task unchanged.
2. Confirm that the Skill reads `checklist.md` and returns to either the full source or the excerpts in `reference/`.
3. For `OrderImportService.importDraft`, have it explain at least the following separately.
   - Calculation of `canonicalHash()`
   - The first `findClaim`
   - `replay` when an existing claim is found
   - The second `findClaim` after locking the reference and key
   - `saveDraft` and claim persistence for a new key
4. For an existing claim, map to source that a different `payloadHash` stops with `orderImport.keyConflict`, while the same value alone retrieves the original order and returns `orderImport.replayed`. Do not assume this is a path that edits the original order.
5. For `OrderGroup.canonicalHash`, record the following separately.
   - The `order-import-v1` marker
   - Common header fields from the first record
   - Conversion of quantity to an integer before converting it to a string
   - The line fingerprint constructed from product and quantity
   - Sorting the line fingerprints before including them in the final fingerprint
6. Preserve database contents, transaction results, actual incident history, and actual resend results that cannot be known from static reading as unknown.
7. After a person completes `notes/hc-009-investigation.md`, use the script included in the Skill to check its format.

   ```console
   node .github/skills/csv-resend-investigation/scripts/check-investigation-note.mjs notes/hc-009-investigation.md
   ```

The script reads the specified note and reports only missing required headings. It does not guarantee Java behavior or the correctness of the answer.

## Optional: Compare

Keep the fixed task, source, model, and tools as consistent as possible, and try each of the following once in a fresh conversation.

1. A general source investigation without the checklist
2. An investigation with only the body of `checklist.md` pasted into the prompt
3. An investigation with the Skill explicitly selected

Manually compare missing checklist items, unsupported database claims, reference use, and whether the process reached the note checker. Do not add tasks or source only to the Skill version, and do not decide which is better if the inputs cannot be kept consistent.

## Verification points

- The Skill's target task and stop condition are explicit
- Skill selection, body loading, resource loading, and script execution are not conflated
- The first and second claim lookups in `importDraft` are treated separately
- The new-key, matching-hash, and different-hash paths can be traced back to source
- `canonicalHash` is not mistaken for a byte hash of the entire file
- Database state or production results are not invented from static reading
- Checker success is not substituted for successful Java behavior
- No import, replay, external connection, or file modification was executed

## Further exploration

- In a fresh conversation, omit the Skill name and provide only the fixed task to observe automatic discovery. If the client does not display it directly, record "unknown" rather than inferring discovery from answer quality.
- Remove exactly one required heading from a copy of the investigation note and confirm that the checker reports that heading by name. Do not change the original note, and delete the copy after the check.

## Constraints, fallback, and safety

- In a client that does not recognize Skills, switch to a manual playbook by pasting `checklist.md.template` into a fresh conversation. Even if the same answer is produced, do not call this successful Skill discovery.
- If Node.js is unavailable, have a person verify the worksheet headings. Do not record that the script was executed.
- If the full source cannot be read, explain only the excerpted range and preserve missing methods or surrounding processing as unknown.
- Do not include real CSV files, order IDs, customer information, database output, or raw private logs in the input or note.
- Do not execute import, resend, replay, a database, a server, a build, a test, or an external network operation.
- Have a person verify the path given to the checker so that it reads only the investigation note.
- If automatic discovery or resource loading cannot be observed, do not speculate that it succeeded.
