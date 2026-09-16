# Observe a self-owned copy in the Customizations editor

**Language:** [日本語](../../../../challenges/hc-019/optional/customization-editor.md) / **English**

## Purpose

Observe candidates shown in the management UI, their scope and enabled state, and application to an actual request separately. This supplements the [main scenario](../README.md) so that its synthetic inventory is not treated as the result of a real UI.

## Prerequisites

- A VS Code / GitHub Copilot environment that supports the Customizations editor
- A workspace and harness permitted by organizational policy
- A harmless existing customization that you own
- The ability to record the client version, channel, and target harness

## Permissions and safety

- Do not activate this repository's `starter/**/*.template`.
- Do not modify a normal profile, another person's customization, User / home, or the original.
- If you save screenshots or logs, exclude secrets, personal information, and private code.
- If activation or a test request is required, limit the target and cleanup and obtain approval in advance.

## Procedure

1. Record the client, channel, workspace, selected harness, and initial state.
2. Open the Customizations editor according to the current product documentation.
3. For a safe self-owned item, record the display name, scope, source, listed state, and enabled state.
4. If permitted, switch harnesses and check whether the candidate listing changes.
5. Only if application verification has also been approved, run a harmless fixed request once and record direct information shown by the UI, such as reference sources.
6. Revert only the temporary changes you made and compare the result with the original state.

## What to observe

- Whether listed and enabled are separate states
- Whether candidates change by harness
- Whether there is direct information showing application or only inference from the output
- Whether usefulness is evaluated separately even if the output followed the customization

## Stop conditions

- There is no supported UI, the target harness is unknown, or a self-owned item cannot be isolated
- Activation is required but has not been approved
- A profile, User / home, the original, or another person's item must be changed
- Application can only be inferred from the output

[Return to Further exploration in the main scenario](../README.md#further-exploration)
