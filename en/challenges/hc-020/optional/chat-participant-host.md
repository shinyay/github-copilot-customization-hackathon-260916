# Observe a Chat Participant in a Development Host

**Language:** [日本語](../../../../challenges/hc-020/optional/chat-participant-host.md) / **English**

## Purpose

Call the same pure analyzer from a Chat Participant and observe registration, the `@` entry point, prompt, streamed response, cancellation, and disposal. Treat it as an entry point separate from the Language Model Tool.

## Prerequisites

- VS Code / GitHub Copilot that supports the Chat Participant API
- An approved environment that can start an Extension Development Host
- A disposable development folder separate from this repository
- The same fixed four lines, analyzer, and extension example used in the [Tool exploration guide](extension-tool-host.md)

## Permissions and safety

- Limit and approve creation of the development folder, Host startup, Participant calls, and cancellation.
- Do not install into a normal profile, publish to Marketplace, or overwrite an existing folder.
- Do not rename this repository's `starter/**/*.template`.
- Do not mix Tool results with Participant results, and stop if an unknown model call occurs.

## Procedure

1. In the current official documentation, verify that the version in use supports the Chat Participant API.
2. Copy the same three files used in the [Tool exploration guide](extension-tool-host.md) into an independent development folder.
3. Compare Participant ID `workshop-local.evidence-counter.reader` and reference name `workshop-evidence` between the declaration and registration locations.
4. Start a Development Host and verify the `@workshop-evidence` entry point.
5. Send the fixed four lines once as the prompt and record the streamed JSON and cautionary note.
6. In a separate attempt, request cancellation and verify the cancellation message and absence of side effects.
7. Close the Host, and verify that the Participant is disposed and only the development folder needs cleanup.

## What to observe

- Whether Participant registration and the `@` entry point can be verified separately
- Whether the prompt is passed to `text` in the same analyzer
- Whether the streamed result is explained as neither a Tool call nor LLM inference
- Whether cancellation and disposal can be verified
- Whether the result is not extrapolated to Tool confirmation / selection

## Stop conditions

- The supported Chat entry point or Participant ID cannot be verified
- Tool results become mixed in
- An unknown additional model call occurs
- Installation into a normal profile or overwriting an existing package is required
- The same analyzer cannot be used, or cleanup cannot be completed

Even if the Participant responds, that does not prove Tool registration, semantic accuracy, or source accuracy.

[Return to Further exploration in the main scenario](../README.md#further-exploration)
