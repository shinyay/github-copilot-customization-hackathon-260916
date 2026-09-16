# Test one case each in Local Agent and Agent Host

**Language:** [日本語](../../../../challenges/hc-025/optional/local-host-probes.md) / **English**

[Return to the main scenario](../README.md)

## Purpose

After the static diagnosis, test one customization type at a time in Local Agent and Agent Host, and directly measure discovery, body loading, effective tools, and approval. Do not activate multiple formats at once, and keep results separate by format and by harness.

## Prerequisites

- You can confirm the target VS Code version and the availability of Local Agent / Agent Host in official documentation
- You can prepare a disposable workspace and profile isolated from normal use
- You have permission to use the target model and customization feature
- You can safely disable and delete the created assets at the end

## Permissions and safety

- Obtain separate approval for active placement, model use, external transmission, and deletion at the end.
- Do not modify this repository's `starter/`; test only in an approved, isolated workspace.
- Do not overwrite the user home, synchronization settings, existing Plugins, or existing customizations.
- If a Prompt is not loaded by Agent Host, do not replace it with a Skill and continue the same probe.

## Procedure

1. Prepare an observation table based on `../starter/diagnosis.md.template`.
2. Choose only one type from Skill, Prompt, Custom Agent, and Plugin.
3. Confirm the active filename and placement for that format in official documentation. Do not use a guessed path.
4. Place only the selected sample in the isolated workspace and run the fixed request `../starter/request.txt.template`.
5. Record whether it was discovered as a candidate, whether the body was used, the effective tools, the approval prompt, and any error.
6. Disable and delete only the file you placed, and restore the state from before the test.
7. If you test the next format or harness, repeat from a new conversation and a clean state.

## What to observe

- client / harness / version
- sample type and active path
- documented discovery / observed discovery
- loading
- declared tools / effective tools
- approval
- result / error / cleanup

Do not generalize one success to another format, version, or harness.

## Stop conditions

- The target feature or official placement cannot be confirmed
- An existing file must be overwritten or the user home must be changed
- Required permissions, model access, cost approval, or approval for external transmission are unavailable
- Effective tools or approval cannot be observed
- You cannot reliably revert only your own changes

Mark stopped items as `blocked` or `not-observed`, and return to the [static diagnosis in the main scenario](../README.md).
