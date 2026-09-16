# Run a small test of an entry point for purpose-specific generation

**Language:** [日本語](../../../../challenges/hc-005/optional/task-generation.md) / **English**

[Back to the HC-005 main scenario](../README.md)

## Purpose

This supplemental guide makes a small observation of storing and using a purpose-specific instruction at one generation entry point: reviewing a selection, generating a commit message, or generating a pull request description. Regular Chat and purpose-specific generation are separate entry points, so do not treat them as the same.

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

| Purpose | Setting key | Input to hold fixed |
| --- | --- | --- |
| Review a selection | `github.copilot.chat.reviewSelection.instructions` | The same selection in the same file |
| Generate a commit message | `github.copilot.chat.commitMessageGeneration.instructions` | The same staged diff |
| Generate a pull request description | `github.copilot.chat.pullRequestDescriptionGeneration.instructions` | The same diff and pull request assumptions |

The value is an array of objects containing `text` or `file`. The main scenario handles only an inactive draft using `text`.

## Prerequisites

- You can identify the target VS Code and extension versions and the selected generation entry point
- You can confirm the subscription and permissions required to use that entry point
- You can prepare a disposable workspace containing only synthetic input
- You can distinguish existing settings from this addition and restore the original state

## Permissions and safety

- Obtain approval from the workspace owner to handle only one selected setting and synthetic input.
- Do not enable all three keys at the same time.
- Do not replace existing settings wholesale; record the original value and this addition.
- Committing, pushing, creating a pull request, and publishing are side effects separate from generation. Do not perform them in this guide.
- Keep this training repository's
  [`generation-settings.json.template`](../../../../challenges/hc-005/starter/generation-settings.json.template) inactive.
- If repository policy ignores `.vscode/settings.json`, do not change ignore rules or force-add it.

## Procedure

1. Choose exactly one of the three purposes, or choose "add nothing."
2. In a working copy of [`generation-settings.json.template`](../../../../challenges/hc-005/starter/generation-settings.json.template), keep only the selected key and
   `{"text": "自分で設計した本文"}`.
3. Choose synthetic input that will be shared by the runs without and with the instruction.
   - review: The same file and the same selection
   - commit message: The same staged diff. Do not change the stage of any repository other than the disposable working repository
   - pull request description: The same test diff and assumptions, without publishing or posting
4. Add the setting only in an approved disposable environment and only if you have confirmed a method that does not overwrite the existing value.
5. In fresh contexts, invoke the entry point once without and once with the instruction, and record the generation button or command exactly as used.
6. After saving the outputs, remove only the setting added for this test and confirm that you did not change the stage or any external item.

Pasting the same text into regular Chat can be informative, but do not call it an equivalent comparison unless you can confirm that the same added text was passed to the same purpose-specific entry point.

## What to observe

- Selected key, storage location, and added `text`
- Fixed selection or diff
- Generation entry point actually used
- Client / extension / version and the displayed source of the setting that was used
- Output structure, factual errors, and unnecessary verbosity
- Whether saving, discovery, content injection, entry-point invocation, output, and external publication occurred
- Utility model and other factors that cannot be confirmed as identical to regular Chat

Correct syntax and matching headings alone do not prove content accuracy or the effect of the instruction.

## Stop conditions

- The target entry point, permissions, fixed input, or restoration method is unknown
- Overwriting existing settings, changing ignore rules, or force-adding a file would be required
- Existing staged content, a pull request, or a remote item would have to be changed
- A commit, push, publication, or additional extension would be required
- The same input cannot be prepared for the runs without and with the instruction

If you stop, an inactive syntax draft or a reason for "add nothing" is sufficient.

## Back to the main scenario

Do not mix the output from this supplement into the manually created short drafts for S1 and S2 or into the design comparison in the main scenario.
[Return to the HC-005 procedure and safety boundaries](../README.md).
