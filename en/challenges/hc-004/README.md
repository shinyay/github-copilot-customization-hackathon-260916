# HC-004 Safely try instructions in the `CLAUDE.md` format

**Language:** [日本語](../../../challenges/hc-004/README.md) / **English**

## Scenario

Your team asks, "We want to reuse short working rules from another compatible tool with GitHub Copilot as well."
Is simply renaming the file to `CLAUDE.md` enough?

In this scenario, you will design concise rules for reading order-approval code and use them from a repository-root
`CLAUDE.md`. You will separately verify that the file was saved, the client discovered it, the body was supplied to
the conversation, and the intended behavior appeared in the response.

## What this feature is

Compatible versions of VS Code / GitHub Copilot can treat a repository-root `CLAUDE.md` as a compatible format for
custom instructions. For recurring investigation practices, it can reduce the need to paste a lengthy preamble every time.

However, the filename does not switch to a Claude model or another harness.
It also does not change the model, tools, approval, OS, or filesystem permissions. Even with the same body, discovery
scope and priority are not necessarily identical across save locations. To avoid confusion, the main exercise handles
only one root `CLAUDE.md`.

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Good fit / Not a good fit

**Good fit**

- Concise, generalizable working rules repeated across multiple investigations
- Sharing how to construct a response, such as separating evidence, inferences, and unverified points
- Verifying the value and maintenance burden of reusing an existing compatible format

**Not a good fit**

- Permanently storing a one-time request, a decision about a specific user, or the correct business answer
- Comparing model performance or different harnesses
- Adding tool permissions, approval, or filesystem permissions
- Storing secrets, personal information, or real data

## Goals

1. Design one concise rule reusable for investigating order approval, or at most two if needed.
2. Explicitly try only that body as a root `CLAUDE.md`.
3. Verify whether the response to the fixed request follows the specified source and separates authentication and authorization from business conditions.
4. Do not confuse saving, discovery, body delivery, and output; leave any stage that cannot be confirmed unverified.

## What you need

- Git
- VS Code / GitHub Copilot that supports `CLAUDE.md`
- The runtime workspace prepared through [Getting started](../../README.md#getting-started)
- upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

If the runtime workspace is a repository created from a GitHub template, it has its own commit history.
The revision above indicates the provenance of the teaching-material source; it is not a verification requirement that
the runtime workspace's local `HEAD` match `8f0b3aa25c4f33facdea691642c2f1cb3901391c`.
Do not check out or reset to that revision. Use the target files already present in the workspace.

The following materials are provided under `starter/`, all as inactive `.template` files.

| Material | Purpose |
| --- | --- |
| [brief.md.template](../../../challenges/hc-004/starter/brief.md.template) | Provenance of the upstream template and questions to trace in the runtime workspace |
| [request.txt.template](../../../challenges/hc-004/starter/request.txt.template) | Fixed request to use without changes |
| [CLAUDE.md.template](../../../challenges/hc-004/starter/CLAUDE.md.template) | Draft of the concise instructions you will complete yourself |
| [comparison.md.template](../../../challenges/hc-004/starter/comparison.md.template) | Worksheet for optional comparison and observations |

## Preparation

1. Review [the shared Getting started instructions](../../README.md#getting-started).
2. Open the runtime workspace root as the workspace root and verify that you can read the three files listed in
   `starter/brief.md.template`. The local `HEAD` does not need to match the upstream template revision.
3. If a `CLAUDE.md` already exists at the root, do not overwrite it; proceed with the manual-supply fallback.
4. Read `starter/brief.md.template` and `starter/request.txt.template`.
5. Replace the parenthetical text in `starter/CLAUDE.md.template` with concise rules that you select yourself.
   Do not include a decision specific to an approval, the role answer, a request used only for this exercise, or secrets.
6. Record the client, model, and tools you will use, and keep them unchanged during the trial.

Do not add an active `CLAUDE.md` to this teaching-material repository. Try the completed body only at the root of the
runtime workspace.

## Try it

1. Copy the body of the completed draft to a new root `CLAUDE.md` in the runtime workspace.
2. Open the repository root and start a new conversation.
3. Send the full contents of `starter/request.txt.template` without changes.
4. Save the first response without revising it, and verify the following.
   - Whether it traces from `OrderService.approve` through `BaseService.require` to the branch in `Actor.require`
   - Whether it explains authentication and authorization separately from order business conditions, with separate evidence
   - Whether it separates facts, inferences, and unverified points with file + symbol references
   - Whether it avoids reporting a database, Web, batch process, or test that was not run as successful
5. If the client displays referenced instructions, record that display. Do not conclude that the body was supplied to
   the conversation merely because the file exists.
6. When finished, remove only the root `CLAUDE.md` that you created from the runtime workspace.

## Optional: Compare

As a brief manual self-check, you can compare the following three conditions in fresh conversations.

| Condition | What to send |
| --- | --- |
| No addition | Only the fixed request |
| Root `CLAUDE.md` | Place the completed body at the root and send only the fixed request |
| Manual supply | Do not place a root file; send the fixed request after the same completed body |

Keep the runtime workspace target files, upstream template revision, fixed request, client, model, and tools consistent.
Matching the local `HEAD` is not a condition. Manual supply is not a substitute for verifying discovery.
Record results in a copy of `starter/comparison.md.template`.

## Verification points

- Can you explain separately the intent of the instruction body and the role of the `CLAUDE.md` storage format?
- Rather than concluding from one role string, was the shared guard followed through to the business conditions?
- Among saving, discovery, body delivery, and output, are claims limited to the range that was actually observed?
- If the same rules are stored in multiple locations, can you decide the source of truth, update owner, and removal criteria?
- If no addition or a manual request is easier to maintain, can you accept that conclusion as well?

## Further exploration

- [Consider `CLAUDE.local.md` and `.claude/rules/` separately](optional/claude-variants.md)
- Assuming the same body is maintained in two places, consider how to detect missed updates and which location should be the source of truth
- Change the method under investigation and verify whether the rules remain reusable without containing a specific answer

## Constraints, fallback, and safety

- Perform only static source reading. Do not start a database, Web, batch process, application, or test.
- Do not modify source, existing tests, or configuration. Do not decide whether real users or orders should be approved.
- Do not delete or move aside existing instructions originating from home, User, organization, or Memory. If their effects
  cannot be separated, record the comparison as impossible.
- If `CLAUDE.md` is unsupported, you can learn from the completed body by manually pasting it immediately before the fixed
  request. However, this does not confirm discovery or automatic delivery of the root file.
- If the target files are absent from the runtime workspace, you can design a tracing procedure with `starter/brief.md.template`,
  but do not treat it as a result of reading the implementation.
