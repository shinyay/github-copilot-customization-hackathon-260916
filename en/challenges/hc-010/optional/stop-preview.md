# Observe a Stop Hook in a disposable workspace

**Language:** [日本語](../../../../challenges/hc-010/optional/stop-preview.md) / **English**

This guide is an optional extension of the [HC-010 main scenario](../README.md). You can complete the main scenario without enabling a Hook.

## Purpose

Observe the checker result for a synthetic draft, the Stop adapter output, an actual Stop event, and the on-screen notification separately. The purpose is to avoid interpreting a returned notification as a format pass or as proof that the content is correct.

## Prerequisites

- The VS Code and Copilot versions in use support Agent Hooks and the Stop Hook
- You can confirm the extension host OS and Node.js 22 or later
- You can prepare a disposable workspace isolated from existing Hooks
- Organization policy and the workspace owner permit adding the Hook

## Permissions and safety

- Files under `starter\` are inactive drafts. Do not remove `.template` from them inside this repository.
- Copy only the helpers, synthetic draft, and configuration used for this test to a separate disposable workspace.
- Preserve `continue: true`. Do not add `decision: "block"`, automatic fixes, additional turns, or retry loops.
- Do not delete or overwrite existing User/Home Hooks. At the end, remove only what you added for this test.

## Procedure

1. Using the `manual\hc-010` layout from the main scenario, copy the three helpers and a synthetic draft to the disposable workspace.
2. Run the checker manually without a Hook and confirm the draft's heading structure and result.
3. Pass synthetic Stop input to the adapter and confirm the relationship among `continue: true`, `systemMessage`, and the checker result.
4. Refer to `starter\customization\stop-hook.json.template` and follow the target product's official procedure to configure a Stop Hook only in the disposable workspace.
5. Run the Agent exactly once against the synthetic draft and confirm whether the Hook was invoked when the current Agent run stopped.
6. Record the checker result, adapter output, and notification displayed by the product separately. If no on-screen notification is visible, do not fill it in by speculation.
7. Delete only the Hook configuration and working files added for this test, and confirm the original selection state.

## What to observe

- Whether the manual checker and Hook path read the same draft
- Whether `pass`, `invalid`, `uncheckable`, and `skipped` on reentry remain distinct
- Whether the adapter notification states that it is only a format check
- Whether Stop corresponds to the current Agent run stopping rather than closing a conversation or window
- Whether other Hooks or User settings affected the result

## Stop conditions

- Hooks are unavailable, or organization policy or owner approval cannot be confirmed
- The extension host OS, Node.js, or configuration location cannot be confirmed
- Existing Hooks cannot be separated from this addition
- Blocking, an external connection, a permission change, or deletion of existing settings would be required
- Only the settings added for this test cannot be removed safely

If you stop, return to the manual verification and notification design in the main scenario.

[Back to the HC-010 main scenario](../README.md)
