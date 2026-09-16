# Observe a Language Model Tool in a Development Host

**Language:** [日本語](../../../../challenges/hc-020/optional/extension-tool-host.md) / **English**

## Purpose

Without changing the pure analyzer from the [main scenario](../README.md), separately observe registration, selection, confirmation, call, cancellation, and disposal of the Language Model Tool on a real system.

## Prerequisites

- VS Code / GitHub Copilot that supports the Language Model Tool API
- An approved environment that can start an Extension Development Host
- A disposable development folder separate from this repository
- Current API documentation and extension settings compatible with the version in use

## Permissions and safety

- Limit and approve creation of the development folder, Host startup, Tool selection, confirmation, and cancellation.
- Do not install into a normal profile, publish to Marketplace, or overwrite an existing folder / package.
- Do not rename this repository's `starter/**/*.template`.
- Do not input private content other than the fixed four lines, and stop if an unknown model call occurs.

## Procedure

1. In the current official documentation, verify that the version in use supports the Language Model Tool API.
2. Copy the following three files into an independent development folder.
   - `starter/examples/package.json.template` → `package.json`
   - `starter/examples/extension.cjs.template` → `extension.cjs`
   - `starter/helpers/analyzer.cjs.template` → `analyzer.cjs`
3. Compare the engine, Tool name, activation, and input schema in `package.json` with the version in use.
4. Verify that `extension.cjs` retains `require('./analyzer.cjs')` and does not implement a separate counter.
5. Start a Development Host using the product's extension debugging procedure.
6. Verify registration and candidate listing for `count_workshop_evidence`.
7. Input the fixed four lines and record the confirmation text, call result, and four output fields.
8. In a separate attempt, request cancellation and verify the cancellation message and absence of side effects.
9. Close the Host, and verify that the Tool is disposed and only the development folder needs cleanup.

## What to observe

- Whether the declaration name, registration name, and activation match
- Whether selection and confirmation can be verified separately
- Whether the result shape is the same as in Node.js
- When cancellation is checked
- Whether the Disposable is released after the Host exits

## Stop conditions

- The supported API / client, Tool candidate, or registration name cannot be verified
- Installation into a normal profile or overwriting an existing package is required
- The same analyzer cannot be used
- An unknown additional model call, file access, or network access occurs
- Cleanup cannot be verified

Even if the live Tool succeeds, that does not prove the literal counter's semantic accuracy or source accuracy.

[Return to Further exploration in the main scenario](../README.md#further-exploration)
