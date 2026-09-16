# Explore customization discovery from a parent repository

**Language:** [日本語](../../../../challenges/hc-003/optional/parent-discovery.md) / **English**

[Return to the HC-003 main exercise](../README.md)

## Purpose

When only a subdirectory of a repository is opened as the workspace, observe in a safe environment separate from the main exercise how the client in use discovers customization from the parent repository.

`chat.useCustomizationsInParentRepositories` is the setting that controls discovery from parent repositories in supported versions of VS Code. Consult the official description for defaults and prerequisites for the version in use. Knowing the setting name does not grant permission to trust an unknown parent repository or enable the feature.

References:

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [Monorepo customization discovery](https://code.visualstudio.com/docs/agent-customization/overview#_use-customizations-in-a-monorepo)

## Prerequisites

- You can prepare a parent repository that you manage and can discard or restore
- You can explain the boundary between the parent repository and the subdirectory opened as the workspace
- You can verify support status and settings for parent-repository discovery in the current client/version
- You can record the differences among the workspace, parent repository, and target source separately from the main exercise
- You can prepare a new conversation

If the form of `.git` or the workspace boundary differs from the prerequisites in the official description, stop rather than generalizing that the behavior is the same.

## Permissions and safety

- The owner decides whether the parent repository may be trusted.
- Do not load a parent `AGENTS.md` or other customization whose contents you do not understand.
- Do not modify, delete, or move aside existing parent files, home/User/organization settings, or Memory.
- Do not write to another person's repository, and do not bypass trust or policy.
- Do not include secrets, private data, or local personal information in the record.

## Procedure

1. Prepare a disposable parent repository that you manage and a subdirectory within it to open as the workspace.
2. Distinguish the parent repository, subdirectory, location of `.git`, and workspace root in a diagram or short note.
3. Record the current client/version, support status for parent-repository discovery, and settings value. If a settings change is necessary, verify the owner's permission and the original value.
4. Create a short `AGENTS.md` in the parent repository containing only harmless observational rules such as an output format. If an existing file is present, do not overwrite it; stop instead.
5. Open only the subdirectory as the workspace and send a short reading request in a new conversation.
6. Record separately the saved parent file, discovery in the client, information indicating use of the body, and the response. Keep trials with explicit attachments separate from automatic discovery from the parent.
7. If comparison with opening the workspace at the repository root is necessary, state that the input conditions change and conduct it in another new conversation.
8. Restore only the files you created and the settings you changed.

## What to observe

- The boundary between the parent repository and the opened workspace
- Whether the client displayed the parent as a reference source
- The extent to which use of the parent body can be confirmed
- Differences in sources or accessible reference range caused by how the workspace is opened
- Differences from manually placing a file at the root or explicitly attaching it
- Unverified points about trust, permissions, and settings

Do not confirm automatic discovery from the parent merely because the response follows the observational format.

## Stop conditions

- The owner, trustworthiness, or workspace boundary of the parent repository is unknown
- The trial would require modifying an existing parent file or shared settings
- The client's support status or the method for restoring changed settings is unknown
- Bypassing trust or organization policy would be required
- The input conditions cannot be separated from the main exercise

If you stop, finish with the result marked "unverified" and do not treat inability to use the parent as a failure of the root `AGENTS.md` in the main exercise.

[Return to the HC-003 main exercise](../README.md)
