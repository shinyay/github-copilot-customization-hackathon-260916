# Safely Verify a Tool Set in a Profile

**Language:** [日本語](../../../../challenges/hc-012/optional/profile-tool-sets.md) / **English**

This guide is an optional extension of the [HC-012 main scenario](../README.md). You can complete the main scenario without changing a Profile.

## Purpose

Verify whether an inactive Tool Set draft can be discovered, selected, and deselected in a dedicated Profile. Observe the declared members, members selected in the UI, enabled tools, and actual calls separately.

## Prerequisites

- You can use a version of VS Code and Copilot that supports Tool Sets
- You can personally confirm `Chat: Configure Tool Sets` and the four fixed references
- You can prepare a dedicated Profile isolated from existing settings
- Your organization policy and the environment owner permit adding Profile settings

## Permissions and safety

- A Tool Set does not add permissions or change the original tools' approvals or eligibility.
- `starter\customization\reader.toolsets.jsonc.template` is an inactive draft. Do not remove its suffix inside this repository.
- Do not delete or overwrite the default Profile, synchronization settings, or an existing Tool Set.
- Do not leave actual paths, account names, authentication values, or raw business data in shared records.

## Procedure

1. Confirm the four fixed references and the collection draft in the main scenario.
2. Switch to the dedicated Profile and create a new Tool Sets file from `Chat: Configure Tool Sets`.
3. Confirm that the location opened by the UI is the current Profile's prompts folder and that the file suffix is `.toolsets.jsonc`. Do not manually place the file under `.vscode` or a presumed HOME path.
4. Copy the starter sample's contents into the newly created file. Do not add anything other than the four fixed references.
5. Check editor completions and diagnostics, then expand the collection in the picker and verify the four references.
6. Select the collection and, to the extent the product can display it, check whether extra tools have been enabled through other selection paths.
7. Run an owner-approved, read-only fixed request exactly once. Record the tools actually called, their inputs, their returned values, and their approvals; do not force every member to be called.
8. Deselect the collection created for this exercise and delete only the file created for this exercise. Confirm the original selection state.

## What to observe

- The four references declared in the draft
- The four references expanded and selected in the picker
- Enabled tools, including those enabled through other selection paths
- Tools actually called by the Agent
- Places that caused uncertainty during initial creation and reconfiguration
- Situations where not using a collection would be clearer

Do not conclude that discovery, selection, and calls all succeeded merely because the draft could be saved.

## Stop conditions

- You cannot confirm the supported UI, the four fixed references, eligibility, or owner approval
- You cannot confirm the current Profile's storage location or its isolation from existing settings
- The four fixed references do not match the members shown in the picker
- Extra tools, permission changes, or deletion of existing settings would be required
- You cannot safely deselect only the collection added for this exercise

If you stop, return to the inactive draft and paper reconstruction in the main scenario.

[Return to the HC-012 main scenario](../README.md)
