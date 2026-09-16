# HC-006 Turn a recurring Java investigation into a Prompt File

**Language:** [日本語](../../../challenges/hc-006/README.md) / **English**

## Scenario

Each time you investigate the same order-processing path, you have to explain again that the investigation should "trace three files," "separate facts from speculation," and "provide the smallest next verification." If part of that explanation is omitted, the sections and scope of the answer can change, making handoffs difficult.

In this scenario, you will consolidate the recurring investigation procedure into a Prompt File and use one explicit invocation to request a source trace of the `approve` operation.

## What this feature is

A Prompt File is a GitHub Copilot customization that stores a reusable prompt as a file in a repository and is invoked explicitly from a supported client. It lets you maintain the target, input, output sections, and prohibitions in one place.

Here, "one command" means explicitly selecting the Prompt File from a prompt picker or through a supported slash command. It does not mean unrestricted execution of OS commands. A Prompt File also does not automatically guarantee accurate source interpretation or safe tool use.

Reference: [VS Code Prompt files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)

## Good fit / Not a good fit

**Good fit**

- Recurring investigations of the same form, such as every week or for every pull request
- Work where required inputs and output sections should remain consistent
- A workflow that a person starts explicitly and whose results a person reviews
- Cases where the investigation scope and stop conditions should be maintained in one place

**Not a good fit**

- Short rules that should always apply across a repository
- Conversations whose purpose or source scope changes substantially every time
- Relying on a prompt alone to guarantee automatic execution, approval, or external publication
- Storing secrets, personal information, or absolute paths from a personal environment

## Goals

1. Use the fixed operation `approve` and the three-file scope as inputs to the Prompt File.
2. Require the entry point, form data, direct service call, facts / inferences / unknowns, candidates for further investigation, runtime boundary, and next action every time.
3. Invoke the Prompt File explicitly and verify source citations and unnecessary scope expansion.
4. If useful, use a short manual comparison to determine whether it is easier to reuse than a manual request.

## What you need

- Git
- VS Code / GitHub Copilot with Prompt File support
- A runtime workspace prepared through [Getting started](../../README.md#getting-started)
- Upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

A runtime workspace created from the GitHub template has its own commit history, so matching local `HEAD` to `8f0b3aa25c4f33facdea691642c2f1cb3901391c` is not a verification requirement. The upstream template revision is a reference identifying the provenance of the training source. Do not check out or reset to that revision; use the files already present in the runtime workspace.

All materials in `starter/` are inactive `.template` files.

| Material | Purpose |
| --- | --- |
| [order-investigation.prompt.md.template](../../../challenges/hc-006/starter/customization/order-investigation.prompt.md.template) | Prompt File draft |
| [OrderAction excerpt](../../../challenges/hc-006/starter/reference/OrderAction.java.excerpt.md.template) | Fallback material for the entry point and dispatch |
| [OrderForm excerpt](../../../challenges/hc-006/starter/reference/OrderForm.java.excerpt.md.template) | Fallback material for form data |
| [OrderService excerpt](../../../challenges/hc-006/starter/reference/OrderService.java.excerpt.md.template) | Fallback material for the service-side boundary |
| [comparison.md.template](../../../challenges/hc-006/starter/comparison.md.template) | Worksheet for the optional comparison |

## Preparation

1. Review the [common getting started steps](../../README.md#getting-started).
2. Open the root of the runtime workspace and confirm that you can read the following three files. Local `HEAD` is not required to match the upstream template revision.
   - `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`
   - `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java`
   - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
3. If you cannot obtain the full source, you may use the excerpts in `starter/reference/`. They are partial materials and do not confirm runtime behavior or omitted branches.
4. If a Prompt File with the same name already exists in the runtime workspace, do not overwrite it. Continue with the manually supplied fallback.
5. Decide the client, model, tools, and method for measuring time from start until the answer is saved.

Use the following fixed input.

```text
operation: approve

For a new maintainer, explain, using only the specified 3 files, how OrderAction.perform reads
input from OrderForm and which operation in OrderService it dispatches to directly.
Separate entry point, form data, direct service call, candidates for additional verification,
and runtime behavior that remains unverified from source alone.

Perform static reading only, and do not edit files until requested.
For out-of-scope files, only name them as candidates for the next verification.
```

## Try it

1. Read `starter/customization/order-investigation.prompt.md.template` and confirm that its required inputs, required sections, and prohibitions match the fixed input.
2. Only in the runtime workspace, copy the draft to a new
   `.github/prompts/order-investigation.prompt.md`.
   Do not add an active Prompt File to this training repository.
3. Open the repository root and start a fresh conversation.
4. Explicitly select the client's prompt picker entry or the displayed `/order-investigation`, and pass `approve` as the operation. Do not count an invocation method that is not displayed as successful based on speculation.
5. Save the first answer without editing it, and verify the following.
   - It identifies the `approve` branch in `OrderAction.perform` as the entry point
   - It lists only the data read from `OrderForm` on the direct path
   - It correctly identifies `OrderService.approve(id, version, actor(request))`
   - It separates facts, inferences, and unknowns
   - It separates out-of-scope items as candidates for further investigation and does not begin editing or execution on its own
   - It preserves framework lifecycle and runtime state that cannot be known from static reading as unknown
6. When finished, remove only the Prompt File that you created from the runtime workspace.

## Optional: Compare

Using `starter/comparison.md.template`, you can compare a manual request with an explicit Prompt File invocation twice each.

- Use a fresh conversation for all four runs
- Hold the operation, three runtime workspace files, upstream template revision, client, model, tools, and evaluation sheet fixed
- Do not make a match between local `HEAD` and the upstream template revision a comparison condition
- Do not omit explanations only from the manual request or provide additional source only to the Prompt File run
- Compare missing required sections, citations, unnecessary work, elapsed time, and drift between the two runs

The wording does not have to match exactly. Look for stability in the structure and evidence needed for the purpose.

## Verification points

- Did you separate the fixed procedure from the operation passed on each invocation?
- Did you avoid confusing the role check in `OrderAction` with the business conditions in `OrderService`?
- If you read the full source rather than an excerpt, did you cite the file and symbol?
- Even when all required sections are present, did you verify content accuracy separately?
- Did you distinguish actually performing an explicit invocation from merely saving the template?
- Did the Prompt File avoid increasing unnecessary investigation or edits?

## Further exploration

- Change the operation to another value such as `submit` and verify that the Prompt File can be reused without changing its text
- Add the expected order state as a required input and review the boundary between the fixed procedure and variable input
- Reduce the output sections and find the smallest packet a maintainer needs for verification

## Constraints, fallback, and safety

- Perform only static reading of the specified three files. Do not start a database, Web application, batch process, application, or test.
- Do not edit source until explicitly requested. Do not commit, push, create a pull request, or publish externally.
- Only name out-of-scope files as candidates for further investigation; do not invent behavior you have not read.
- If Prompt Files are unsupported, paste the template text manually immediately before the fixed input. This method does not test discovery or the usability of explicit invocation.
- If you cannot obtain the full source and proceed only with excerpts, state that they are "partial materials" and leave omitted paths and runtime behavior unverified.
- Do not save an active Prompt File, secrets, personal information, or absolute paths in this training repository.
