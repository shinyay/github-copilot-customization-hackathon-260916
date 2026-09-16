# Explore nested AGENTS.md in a separate environment

**Language:** [日本語](../../../../challenges/hc-003/optional/nested-discovery.md) / **English**

[Return to the HC-003 main exercise](../README.md)

## Purpose

Observe, in a safe environment separate from the main exercise, how the client in use discovers and references `AGENTS.md` files placed at the root and in a subdirectory.

Nested AGENTS are an Experimental feature. Support and behavior may vary by client/version. Do not treat a displayed path, use of the body, and an effect on the response as the same thing. Also, do not assume a strict inheritance order between parent and child or a rule that "the child always takes precedence."

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Prerequisites

- You have completed the main comparison, or can record this exercise entirely separately from the main exercise
- You can prepare a repository/worktree that you manage and can discard or restore
- You can verify whether the VS Code and GitHub Copilot in use support nested AGENTS
- If `chat.useNestedAgentsMdFiles` exists in the current client, you can verify its meaning and current value in official documentation or the settings UI
- You can prepare a new conversation for each file

## Permissions and safety

- If an Experimental feature must be enabled, obtain permission from the environment owner.
- Do not modify or delete an existing `AGENTS.md`, User/organization settings, or Memory.
- Do not reuse the worktree or results from the main exercise; use only a disposable environment.
- Do not put secrets, private data, real users, or real orders in the prompt.
- Do not bypass trust or policy, and do not make unauthorized settings changes.

## Procedure

1. Choose the root of a disposable repository and one subdirectory to investigate.
2. Record the current client/version, workspace root, support status for the nested feature, and settings value. If changing a setting, also record the permission and original value.
3. Create new, short `AGENTS.md` files at the root and in the subdirectory whose contents can be distinguished. If an existing file is present, do not overwrite it; stop instead. Use harmless observational rules such as an output format, not the business answer.
4. Target one file inside the subdirectory and one outside it, and send the same short reading request in separate new conversations.
5. Record the sources shown by the client, whether anything was explicitly attached, and the responses. Keep trials with explicit attachments separate from observations of automatic discovery.
6. Review the list of created files and changed settings, and restore only what you added or changed.

## What to observe

- Where each root/subdirectory file was saved
- Discovery or reference sources displayed by the client
- UI information that confirms use of the body
- Whether the response changed according to the target file
- Whether over-application or missed targets occurred even with non-conflicting parent and child instructions, rather than testing conflicting instructions
- Places where no display is available or body use cannot be confirmed

Do not conclude that automatic discovery or body delivery occurred merely because observational wording appears in the response.

## Stop conditions

- Any of the client's support status, permission from the environment owner, or restoration method is unknown
- The trial would require modifying existing files or shared settings
- Progress would require using the same workspace or conversation as the main exercise
- Bypassing trust or organization policy would be required
- You cannot separate which instructions were used, and additional trials cannot observe this safely

If you stop, finish with the result marked "unverified" and do not add it to the root comparison in the main exercise.

[Return to the HC-003 main exercise](../README.md)
