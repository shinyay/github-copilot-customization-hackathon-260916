# Observe a `sessionStart` Hook within a limited scope

**Language:** [日本語](../../../../challenges/hc-038/optional/session-start-live.md) / **English**

[Return to the HC-038 main scenario](../README.md)

## Purpose

In an approved dedicated environment, separately observe the `sessionStart` declaration, actual invocation, checker exit, and scope of collected logs. This procedure does not verify permission enforcement for subsequent tools.

## Prerequisites

- You can confirm the target repository and default branch.
- You have a fixed checker that can run in Cloud Linux/bash.
- You can use Copilot coding agent and the required execution resources.
- The log scope, cost limit, person responsible for stopping, and restoration method have been decided.

## Permissions and safety

- Obtain separate permission to save an active Hook and checker, start the session, and incur costs.
- Do not overwrite existing Hooks, and ensure that you can identify only your own changes.
- Do not retain secrets, the full prompt, or customer data in logs.
- Do not move the main scenario's `.template` files directly into an active path. Use a separate experimental copy whose contents have been reviewed.

## Procedure

1. Record the checker revision, hash, execution command, timeout, and target branch.
2. Review an experimental configuration that does not conflict with existing Hooks.
3. After approval, apply the configuration and start one Cloud session.
4. Record the Hook declaration, invocation record, checker exit, stdout/stderr, and session-start result as separate items.
5. Do not infer permissions for subsequent tools from `sessionStart` success.
6. After the observation, restore only your own changes using the approved procedure.

## What to observe

- Declared event and target revision
- Checker identity
- Whether invocation occurred
- Exit, output, and timeout
- Confidential information excluded from the logs
- Restoration result

## Stop conditions

- The default branch, checker version, execution environment, or log scope is unknown.
- There is no permission for configuration changes, session start, costs, or restoration.
- Existing Hooks cannot be isolated safely.
- You would need to treat `sessionStart` success as proof that subsequent tools are protected.

## Return to the main scenario

Compare the result with the [HC-038 verification points](../README.md#verification-points), and verify that you have not confused declaration, invocation, and checker result.
