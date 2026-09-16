# HC-010 Notify inspection results when the Agent stops

**Language:** [日本語](../../../challenges/hc-010/README.md) / **English**

## Scenario

Each time, you verify whether a maintenance handoff note includes evidence and unverified items. Which approach is less likely to be misread or overlooked: having the owner open a result sheet, or showing a short notification when the Agent's response stops?

In this scenario, you will compare a **manual verification contract** and the design of a **nonblocking Stop notification** that use the same format check. Actually enabling the notification and performing automatic fixes are not required.

## What this feature is

Agent Hooks invoke regular programs when an Agent reaches a particular point. The Stop event discussed here occurs when the current Agent run stops, not when a conversation, window, or session is closed.

The bundled checker does not evaluate the meaning of Markdown. It only verifies that each of the following headings occurs exactly once outside fenced code blocks and has nonempty content.

- `## Evidence`
- `## Unknowns`

The results distinguish `pass`, `invalid`, `uncheckable`, and `skipped`. The corresponding checker exit values are 0, 1, 2, and 0. The Stop adapter places the result in `systemMessage` and always returns `continue: true`. A successful notification from the adapter and a `pass` result from the checker are separate outcomes.

## Good fit / Not a good fit

**Good fit**

- Reducing forgotten checks of standard notes
- Distinguishing uninspected, invalid-format, and passing results in a short message
- Explicitly documenting the recipient, timing, and handling of duplicate notifications

**Not a good fit**

- Guaranteeing the correctness of business content or code
- Repeating automatic fixes or additional AI turns from a Hook
- Granting permissions, connecting to external services, or validating an application or database
- Adding unnecessary notifications to small notes

## Goals

1. Separate the roles of fixed source and synthetic fixtures.
2. Create a manual verification procedure that does not misread the four results.
3. Create a Stop notification policy that communicates the same results and an output draft using `continue: true`.
4. Decide whether adding no notification would be preferable.

## What you need

- An environment that can edit Markdown and JSON
- Node.js 22 or later if you try the helpers
- A working repository created from the public Runtime template and the following source included in it

```text
upstream template: shinyay/github-copilot-customization-runtime-template
upstream revision: 8f0b3aa25c4f33facdea691642c2f1cb3901391c
runtime workspace path: wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java
symbol: Money.tax
```

The upstream revision identifies the provenance of the source. A working repository created with **Use this template** has a new Git history, so local `HEAD` is not required to match this value.

## Preparation

See [Getting started in the repository README](../../README.md#getting-started) for the common setup procedure.

`starter/` contains a fixed request, synthetic drafts, result fixtures, an inactive Hook configuration example, helpers, and worksheets to complete. The `.template` files are distribution drafts and are not enabled in this repository.

If you try the helpers, **copy** them into another disposable working location with the following layout and remove `.template` only from the copies.

```text
manual\hc-010\
├─ draft.md
└─ tools\
   ├─ checker.mjs
   ├─ hook-io.mjs
   └─ stop-notify.mjs
```

For `draft.md`, you may use the contents of `starter\fixtures\draft-complete.md.template` or
`starter\fixtures\draft-missing-unknowns.md.template`.

## Try it

1. Read `starter\brief.md.template` and `starter\request.txt.template`.
2. If possible, read `Money.tax` from the complete `Money.java` in the runtime workspace and record the supported explanation and unverified items in a working copy of `starter\worksheets\design.md.template`. If the source has changed, do not assume that it is identical to the upstream revision.
3. Compare the two synthetic drafts with `starter\fixtures\checker-results.json.template` and confirm that `pass` is only a format decision.
4. If you copied the helpers, run the following from the root of the working location.

   ```powershell
   node .\manual\hc-010\tools\checker.mjs .\manual\hc-010\draft.md
   '{"hook_event_name":"Stop","stop_hook_active":false}' |
     node .\manual\hc-010\tools\stop-notify.mjs
   ```

5. In a working copy of `manual-checklist.md.template`, record who reads the result, when they read it, and how they place it on hold.
6. In a working copy of `notification-policy.md.template`, record the recipient, message length, duplicate and reentry handling, and criteria for omitting a notification.
7. Using `stop-output.json.template` as a reference, create one notification message that preserves both the result and the statement that "meaning was not evaluated."

## Optional: Compare

Use `starter\worksheets\comparison.md.template` to compare only the manual verification and notification design for the same source, drafts, and results. Do not add explanations only to the notification side or change the design until a favorable result appears.

## Verification points

- Is `pass / 0` treated as passing only the limited format check?
- Are `invalid / 1` and `uncheckable / 2` not treated as "no problem"?
- When `stop_hook_active: true`, is the checker not run again and the result set to `skipped`?
- Are adapter success and checker success treated separately?
- Is `continue: true` preserved without requesting an automatic fix or an additional turn?
- Did you avoid supplementing content that cannot be confirmed from the fixed source?

## Further exploration

If you want to observe an actual Stop Hook safely, see the [Stop Preview supplemental guide](optional/stop-preview.md). Proceed only after confirming a dedicated disposable workspace, product support, organization policy, and the removal method.

## Constraints, fallback, and safety

- The synthetic drafts and fixed results are `SYNTHETIC_TRAINING_ONLY`; they are not actual Stop notifications or LLM output.
- The checker does not evaluate the meaning of the input Markdown, the correctness of `Money.tax`, or the state of an application or database.
- The helpers limit Hook input to 32 KiB and two seconds for reading, drafts to 64 KiB, and the checker child process to three seconds and 8 KiB of output.
- The helpers reject targets outside the working location, symbolic links, and targets that are not regular files.
- Do not turn this repository's `*.template` files into an active Hook configuration.
- Even if Hooks are unavailable, you can complete the scenario using the fixed results for manual verification and a paper-only notification design.
- If you cannot read the fixed source, handle only the format check of the synthetic fixtures and state explicitly that the code's meaning is unverified.
