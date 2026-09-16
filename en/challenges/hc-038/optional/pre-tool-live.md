# Observe a `preToolUse` Hook within a limited scope

**Language:** [日本語](../../../../challenges/hc-038/optional/pre-tool-live.md) / **English**

[Return to the HC-038 main scenario](../README.md)

## Purpose

In an approved dedicated environment, observe the `preToolUse` invocation and permission handling for one harmless tool operation. Record the checker result, fail-open, normal permission flow, and tool completion separately.

## Prerequisites

- You can confirm the target repository, default branch, fixed checker, and Cloud Linux/bash environment.
- You can choose a harmless tool operation with a clear scope.
- You can use Copilot coding agent, the target tool, and the required execution resources.
- Limits for the number of runs, time, cost, logging, stopping, and restoration have been decided.

## Permissions and safety

- Obtain separate permission for the active Hook, checker, limited tool operation, incurred cost, and log collection.
- Do not broaden endpoints or firewalls, and do not record secrets or the full prompt.
- Do not use destructive tools, broad write permissions, or allow-all.
- Do not overwrite existing Hooks, and ensure that only your own changes can be restored.

## Procedure

1. Record the checker revision, hash, event configuration, target tool, and expected safe scope.
2. Choose allow, deny, and, if necessary, one failure case in advance. Do not test beyond the run-count limit.
3. After approval, apply the experimental Hook and execute the limited tool operation once.
4. Record declaration, invocation, transport, exit/HTTP response, `permissionDecision`, normal flow, and tool result separately.
5. Do not reinterpret a timeout or HTTP failure as command deny; separately verify the tool result after fail-open.
6. After the observation, restore only your own changes.

## What to observe

| Layer | Record |
|---|---|
| Hook | event, revision, invocation |
| checker | command/HTTP, exit, response, timeout |
| permission | decision and reason, return to normal flow |
| tool | whether it ran, whether it completed, result |
| safety | scope, limits, logs, restoration |

## Stop conditions

- The checker, default branch, target tool, or observable permission range is unknown.
- Endpoint/firewall changes, secrets, full-prompt logging, or destructive operations are required.
- You would need to treat a timeout or HTTP failure as actual tool completion.
- There is no separate permission or restoration method.

## Return to the main scenario

Compare the results with the [HC-038 failure boundaries](../README.md#what-this-feature-is), and distinguish deny from fail-open correctly.
