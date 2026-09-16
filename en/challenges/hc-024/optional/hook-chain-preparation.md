# Compare Stop notification paths

**Language:** [日本語](../../../../challenges/hc-024/optional/hook-chain-preparation.md) / **English**

## Purpose

Apply the "change only one factor" approach from the [HC-024 main scenario](../README.md) to invocation paths for the same limited checker. Observe three paths: the checker disconnected, the checker run manually, and the checker connected to a Stop notification.

Treat the Stop notification as a nonblocking notification. Do not treat it as a quality gate, tool denial, automatic fix, or guarantee that the conversation will end.

## Prerequisites

- A supported Local / Preview environment and Stop event are available.
- You have an approved, disposable validation workspace.
- You can prepare a small read-only checker that inspects only the same input.
- You can separately approve checker execution, Hook configuration, event trials, notification observation, and cleanup afterward.

## Permissions and safety

- This guide does not grant permission to run Hooks or scripts.
- The checker performs only a format check on fixed input and does not modify the source or response.
- The notification assumes processing continues; do not extend it into denial, permission changes, retry loops, or automatic fixes.
- Use the same checker and the same input for all three paths.
- Do not add active Hooks or checkers to this teaching repository.

## Procedure

1. Freeze the checker's input, checks, output, and maximum execution time.
2. With the checker disconnected, confirm that it does not run automatically.
3. Run the checker manually on the same input and record the format result.
4. Only in a separate approved workspace, connect the same checker to a Stop notification.
5. Observe the Stop event, checker startup, notification display, and reentry prevention separately.
6. After validation, remove the configuration and confirm that no processes or changes remain.

## What to observe

- Whether the event occurred.
- Whether the checker started with the same input.
- Whether the format result matched the notification content.
- Whether the notification remained distinct from semantic evaluation of the response or tool denial.
- Whether reentry was avoided if the checker itself produced another Stop event.
- Whether any Hook or process remained after cleanup.

Success from a manual run alone does not establish success for Hook discovery, the event, or the notification UI. A successful notification also does not prove response quality or educational effects.

## Stop conditions

- The information needed to determine the event, working directory, or reentry is unavailable.
- Unobserved values would need to be filled with defaults.
- Script / Hook placement or the event trial has not been approved.
- The nonblocking notification would need to become a denial or quality gate.
- The checker requires writes, external transmission, or long execution.

[Return to Further exploration in the HC-024 main scenario](../README.md#further-exploration)
