# Try an approved external diagnostic

**Language:** [日本語](../../../../challenges/hc-019/optional/diagnostic-evaluation.md) / **English**

## Purpose

Send only the synthetic draft to an external diagnostic extension or model to obtain supplementary findings. Its output is a set of candidates that support human review, not the ground truth about meaning or an answer key for the repair.

## Prerequisites

- The publisher, extension, model used, and cost have been verified
- The transmitted content, storage destination, retention period, and organizational policy can be verified
- Only the [fixed body](../../../../challenges/hc-019/starter/fixtures/draft-p.txt.template) and [frontmatter](../../../../challenges/hc-019/starter/fixtures/wrapper.txt.template) will be used
- A self-owned working copy that can be restored

## Permissions and safety

- Approve extension installation, model use, data transmission, and cost separately.
- Do not send private code, secrets, personal information, or third-party information.
- Disable automatic repairs and make a separate decision about applying suggestions.
- Do not directly modify a normal profile or the original.

## Procedure

1. Verify the extension's official distribution source, publisher, permissions, and transmission destination.
2. Prepare a disposable copy containing only the two synthetic lines and frontmatter.
3. Review in advance the body, metadata, and logs that will actually be transmitted.
4. Run the diagnostic once and record the input, model, output, cost, and errors.
5. For each finding, have a person review whether it can be verified directly from the two fixed lines.
6. Even if you adopt a finding, reevaluate it as a minimal option in the [repair worksheet](../../../../challenges/hc-019/starter/worksheets/repair.md.template).
7. Clean up only the copy and stored logs that you created.

## What to observe

- Whether it explicitly identified the two conflicting lines
- Whether it avoided conflating syntax with meaning
- Whether it avoided unsupported claims about application / usefulness
- Whether the suggestion removes too much of the intent

## Stop conditions

- The publisher, transmitted content, model, cost, or storage destination cannot be verified
- The task cannot be completed without sending private content
- Automatic repair or modifying the original is required
- A person cannot verify the output

[Return to Further exploration in the main scenario](../README.md#further-exploration)
