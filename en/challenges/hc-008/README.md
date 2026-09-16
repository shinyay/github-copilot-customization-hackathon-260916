# HC-008 Delegate a large investigation to two Subagents

**Language:** [日本語](../../../challenges/hc-008/README.md) / **English**

## Scenario

As part of a maintenance handoff for the order feature, you need to explain "orders entered from the screen" and "orders entered from CSV." One Agent could read the paths sequentially, but if the two entry points can be investigated independently, the parent can divide them between two Subagents and then integrate the results.

However, simply placing two people's reports side by side can cause the ranges read, citations, and unverified points to disappear during integration. In this scenario, you will design **how to divide** the investigation, the **complete input** given to each child, and the **evidence-backed format** returned to the parent. This is not a task about competing on speed or the number of children.

## What this feature is

A Subagent receives limited work from a parent Agent, investigates it in a separate context, and returns the result. Merely adding headings such as "screen owner" and "batch owner" to a regular answer does not mean that Subagents were invoked. Use the client's tool-call or execution display to distinguish actual delegation and return from headings in an answer.

See [Run subagents in Visual Studio Code](https://code.visualstudio.com/docs/agents/run/subagents) for usage in VS Code. Invocation methods and displays vary by client. In VS Code, children are stateless, so do not assume follow-up questions to the same child. Include all necessary scope, materials, safety conditions, and return format in the initial request. Even if a child inherits the parent's model and tools, do not speculate about effective values that you cannot observe.

A separate context does not mean a separate worktree or file-system isolation. In this scenario, both the parent and children only read source. The training safety limit is also **a maximum of two children, one call each, no nesting, and no retry loop**. This is not a universal product limit.

## Good fit / Not a good fit

**Good fit**

- Multiple ranges that can be read without waiting for the previous owner's conclusion
- Investigations with a clear source boundary and return format for each range
- Work where the parent can reconcile multiple returns and integrate them while preserving evidence
- Work for which each child can receive a complete request in one pass

**Not a good fit**

- An investigation that only has several people trace the same short call chain redundantly
- Work requiring frequent follow-up questions or lengthy collaborative editing
- Work that asks each child to modify the same file
- Proving actual database state, operational retry safety, or user permissions through static reading alone

Deciding not to use a Subagent for work of this size is also valid. Delegation does not guarantee correctness, speed, lower cost, or parallel execution.

## Goals

- Divide the web and batch entry points into non-overlapping scopes
- Give each Subagent all required input in the first call
- Standardize each return as no more than five items of "observation / path, symbol, and line range / limitation"
- Have the parent integrate the results into both entry points, comparable points, and unverified items
- Have a person verify at least one item from each entry point against source
- Make the same design usable with manual fresh conversations when Subagents are unavailable

## What you need

- A GitHub Copilot client that supports Subagents. If unavailable, an environment in which you can create three fresh conversations
- A working repository containing the Java source used by the scenario
- The inactive materials in this directory

| Material | Purpose |
|---|---|
| [`starter/request.txt.template`](../../../challenges/hc-008/starter/request.txt.template) | Fixed request given to the parent |
| [`starter/packets/web-entry.md.template`](../../../challenges/hc-008/starter/packets/web-entry.md.template) | Fixed scope and safety conditions for the web owner |
| [`starter/packets/batch-entry.md.template`](../../../challenges/hc-008/starter/packets/batch-entry.md.template) | Fixed scope and safety conditions for the batch owner |
| [`starter/worksheets/design.md.template`](../../../challenges/hc-008/starter/worksheets/design.md.template) | Decide the division and integration in advance |
| [`starter/worksheets/returns.md.template`](../../../challenges/hc-008/starter/worksheets/returns.md.template) | Record the two returns without modifying them |
| [`starter/worksheets/synthesis.md.template`](../../../challenges/hc-008/starter/worksheets/synthesis.md.template) | Separate parent integration from human review |
| [`starter/worksheets/comparison.md.template`](../../../challenges/hc-008/starter/worksheets/comparison.md.template) | Optional manual self-check |

You do not need a JDK, Maven, database, running server, or additional extension.

## Preparation

1. Follow the common [Getting started](../../README.md#getting-started) steps in a working repository.
2. Confirm that you can read the following six files.

   | Owner | Source |
   |---|---|
   | web | `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java` |
   | web | `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java` |
   | web | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` |
   | batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderCsv.java` |
   | batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` |
   | batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` |

3. Copy `starter/worksheets/design.md.template` to your own notes. Before seeing any answers, record why the work is divided, return order, integration method, and stop conditions. Do not change the fixed source, the limit of five items per packet, or the safety conditions.
4. Prepare to give the parent Agent `request.txt.template`, the two packets, and the completed design. Do not assume that a child automatically reads file attachments; explicitly include the relevant packet and necessary parts of the design in the child's request.
5. Confirm that the parent and children will only read source and will not generate or modify files. A person records the results in the worksheets.

## Try it

1. Give the fixed request, web packet, batch packet, and completed design to a fresh conversation for the parent Agent.
2. Ask the parent to delegate the web and batch scopes to no more than two Subagents, one call each. Include the following in each child's request from the start.
   - Complete text of the assigned packet
   - Return format and stop conditions from the fixed design
   - Exact paths of the source the child may read
   - The limit of no more than five items
   - Safety conditions: read-only, no nesting, no retries, and no model override
3. If the client displays Subagent invocations, confirm the two actual invocations and their returns. If they are not displayed, record "not observable" and do not infer invocation from answer headings alone.
4. Confirm that each return preserves "observation / path, symbol, and line range / limitation." Do not accept a return that assumes knowledge of the other owner's result or the parent's prior conversation.
5. Have the parent integrate the results into the following four sections.
   - Screen entry point
   - CSV entry point
   - Comparable points
   - Unverified items
6. Use `returns.md.template` and `synthesis.md.template` to preserve the complete child returns, the parent's integration, and human review separately.
7. Have a person reopen the source for at least one item from web and one from batch, and confirm that the path, symbol, line range, claim, and limitation match.

If additional source is required, the child must not read it. The child returns its path and reason as an unknown. Do not infer that web and batch use the same business path or reuse evidence from one side for the other.

## Optional: Compare

Keep the request, two packets, design, source, model, and tools as consistent as possible, and manually try each of the following once.

- One Agent directly investigates both packets sequentially and integrates them
- A parent divides web and batch between two Subagents and integrates them

Use `comparison.md.template` to compare the number of items traceable to source, preservation of unknowns, duplicate investigation, incorrect citations, and integration effort. Do not speculate about time or cost in an environment that does not display them. If the inputs or features cannot be kept consistent, do not decide which is better.

## Verification points

- You observed actual Subagent invocations rather than only headings
- Each child received the assigned packet and necessary design in the first call
- No more than two children were started
- No nesting, follow-up questions, retry loops, or model overrides were added
- Every return includes a path, symbol, line range, and limitation
- Unknowns did not become assertions in the parent's integration
- Evidence from web and batch was not mixed
- A person compared at least one item from each entry point with source

## Further exploration

Reuse the same two returns and create a paper-only version that reverses only the integration order. Observe which unknowns or limitations are likely to disappear because of anchoring on the first return. Do not start new Subagents or change the original returns.

## Constraints, fallback, and safety

- If Subagents are unavailable, have a person give web and batch to separate fresh conversations, then carry the complete text of both returns into a third fresh conversation for integration. This is a manual handoff, not a Subagent execution.
- If a read tool is unavailable, have a person read the permitted source and practice only the design and integration.
- If any file other than the six specified files becomes necessary, record its path and reason as an unknown and stop.
- Do not read real data, credentials, or private logs.
- Do not run a database, server, build, test, shell, or unauthorized network operation.
- Do not ask an Agent to modify source, settings, or documentation.
- Do not treat a separate context as file-system isolation.
- If the Subagent's model, tools, or parallel execution cannot be confirmed from the display, do not speculate about their defaults.
