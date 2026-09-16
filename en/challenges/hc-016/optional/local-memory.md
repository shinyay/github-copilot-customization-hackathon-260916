# Exploration guide before trying VS Code local Memory

**Language:** [日本語](../../../../challenges/hc-016/optional/local-memory.md) / **English**

## Purpose

This supplementary guide helps you determine whether the short fact candidates designed in the [HC-016 main guide](../README.md) could be safely tried with VS Code local Memory in the future. Reading this document alone does not save Memory or change settings.

VS Code local Memory, GitHub Copilot Memory, and Memory in the Copilot App are separate mechanisms. Identify the target and scope before trying anything.

## Prerequisites

- The VS Code and GitHub Copilot versions you are using support the target feature
- You can verify organizational policy and workspace usage conditions
- You can verify the scopes that are actually available, such as User / Repository / Session
- You can identify the initial state and only the candidate you added
- You can refer to the official procedure for the target client

## Permissions and safety

- Obtain permission in advance for each operation: saving to a dedicated scope, reading, limited updates, and deletion.
- Do not save secrets, personal preferences, permissions of real people, third-party information, or private logs.
- Do not fully reset existing notes, modify another person's notes, or reset User settings.
- Do not automatically place this repository's `.template` files into active Memory configuration.

## Procedure

1. Verify through the official UI or documentation that the target is **VS Code local Memory**, and identify the available scopes.
2. Before starting, record the target scope, the visible portion of the existing state, and the restoration method.
3. Using card-p from the main guide as a reference, prepare exactly one short training fact that contains no personal information.
4. Only with permission, save that one item using the procedure published by the target client. Do not invent unverified API names or commands.
5. Verify reading within the same conversation separately from reuse in another conversation, and attempt the latter only if supported.
6. Assuming the source changed, verify the method for a limited update or withdrawal of that same item.
7. Revert only the one item you added and compare the result with the initial state.

## What to observe

- Client and feature name
- Selected scope and the basis for choosing it
- State visible before starting
- Operations actually performed among save, read, reuse in another conversation, update, and delete
- Source path, symbol, verified revision, and revalidation trigger
- Restoration result and anything you could not verify

Creating a draft, requesting that it be saved, and actually saving and reusing it must be recorded separately.

## Stop conditions

- You cannot separate the existing notes from the one item used in this exercise
- You cannot safely revert only the item you added
- Proceeding requires a full reset, changes to another person's notes, or deletion of User settings
- You cannot verify the target scope or product surface
- Proceeding requires an unverified API or detour through a different memory service

If any condition applies, stop live operations and complete only the inactive design from the main guide.

[Back to the HC-016 main guide](../README.md)
