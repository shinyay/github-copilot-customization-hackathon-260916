# Safely try Waza evaluation

**Language:** [日本語](../../../../challenges/hc-019/optional/waza-evaluation.md) / **English**

## Purpose

If a Waza evaluation environment is available, verify the evaluation's input and output boundaries using only the synthetic fixture. Do not guess or invent unknown commands, schemas, or scores.

## Prerequisites

- An approved Waza extension / binary and official documentation
- A supported OS, pinned tool version, actual schema, and operating procedure
- The ability to verify the model, data transmission, cost, and output destination
- An isolated workspace that uses only the [fixed body](../../../../challenges/hc-019/starter/fixtures/draft-p.txt.template)

## Permissions and safety

- Approve acquisition and execution of the extension / binary, model use, transmission, and cost at each stage.
- Do not execute a binary if its source and signature or hash cannot be verified.
- Do not send private code, secrets, or third-party information.
- Do not modify this repository's inactive templates or a normal profile.

## Procedure

1. In the current official documentation, verify the source, supported OS, version, schema, and operating procedure.
2. Prepare a working copy that contains only the synthetic fixture.
3. Review the input, model, transmission destination, cost, output path, and cleanup method.
4. Perform permitted operations one stage at a time, recording the actual version and input used.
5. Have a person read the output and separate only findings that correspond directly to the conflict between the two fixed lines.
6. Even if there is a score, do not generalize it to the ground truth about meaning, application, or usefulness.
7. Stop and clean up only the copy, processes, and output that you created.

## What to observe

- Whether the actual schema matched the input
- Whether the boundaries around the tool / model / transmission / cost are clear
- Whether the score can be separated from concrete diagnostic evidence
- Whether errors or unsupported behavior are not treated as success

## Stop conditions

- The source, version, schema, operating procedure, or OS support cannot be verified
- The binary, model, transmission, or cost has not been approved
- Private data or modification of the original is required
- The cleanup method is unknown

[Return to Further exploration in the main scenario](../README.md#further-exploration)
