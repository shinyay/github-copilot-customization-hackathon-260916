# HC-003 Communicate directory-specific rules with AGENTS.md

**Language:** [日本語](../../../challenges/hc-003/README.md) / **English**

## Scenario

When you ask Copilot to explain order approval, some responses conclude from the service entry point alone, while others trace inherited shared processing and delegation targets. The team wants to organize "short rules needed for every investigation" separately from "perspectives needed only in a specific directory."

In the main part of this scenario, you will design only one `AGENTS.md` at the root of the target repository. Directory-specific ideas remain in the design notes, while nested AGENTS and discovery from a parent repository are kept out of the main exercise.

## What this feature is

`AGENTS.md` is a Markdown instruction document that communicates repository working rules to compatible coding agents. A workspace-root `AGENTS.md` can contain shared team practices such as:

- Read not only the entry method but also shared processing and delegation targets
- Separate authentication and authorization from business conditions
- Tie important claims to a file + symbol
- Distinguish facts, inferences, and unverified points

`AGENTS.md` is not a role definition in an `.agent.md` file. It does not create a new agent option, tool, execution permission, or Java behavior; it provides natural-language instructions. Verify separately that the file was saved, the client discovered it, the body was actually used, and the response improved.

Nested AGENTS in multiple directories are treated as an Experimental feature. Discovering customization from a parent repository also has separate conditions. Do not infer from paths alone a strict inheritance order among multiple documents or a rule such as "the child always takes precedence." The main exercise uses only one file at the root.

Reference: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## Good fit / Not a good fit

**Good fit**

- Short working rules repeated across many investigations
- Repository practices you want to share with multiple compatible coding agents
- Ways to report evidence, unverified points, and what was not run

**Not a good fit**

- A long one-time request
- A specific role list or the correct answer for order approval
- Access control, execution permissions, or model/tool settings
- Replacing tests or human source review

If the fixed request alone is sufficient, deciding not to add `AGENTS.md` also has value.

## Goals

1. Separate rules that should permanently reside at the root from rules that appear directory-specific.
2. Narrow the root `AGENTS.md` body to concise, reusable rules.
3. Verify whether `OrderService.approve` can be read with evidence through the shared `require` and its delegation target.
4. Do not confuse authentication and authorization conditions with order business conditions.
5. Check not only the effect of the instructions but also response length and maintenance effort.

## What you need

- A GitHub Copilot / coding agent environment that supports a root `AGENTS.md`
- A branch or worktree in a target repository that you are allowed to modify
- A target repository containing the following files

| Reading entry point | What to verify |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | The entry to `approve`, the guard it calls, and subsequent conditions |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | The inherited `require` and its delegation target |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | The role decision used by `require` |

The `starter\` directory contains the following inactive materials.

- [Fixed request](../../../challenges/hc-003/starter/request.txt.template)
- [Root AGENTS.md editing example](../../../challenges/hc-003/starter/customization/AGENTS.md.template)
- [Design and optional comparison worksheet](../../../challenges/hc-003/starter/worksheet/comparison.md.template)

Because all of them retain the `.template` suffix, they do not become active customization in this challenge directory.

## Preparation

1. Review [Getting started for the entire repository](../../README.md#getting-started).
2. Before viewing the response, narrow the observations to two or three items. For example:
   - Whether shared processing and the delegation target were traced
   - Whether cited locations support the claims
   - Whether authentication and authorization were separated from business conditions
   - Whether unverified points were retained
3. In the [worksheet](../../../challenges/hc-003/starter/worksheet/comparison.md.template), distinguish candidate shared rules to place at the root from candidates that appear directory-specific and will not be placed this time.
4. Use [AGENTS.md.template](../../../challenges/hc-003/starter/customization/AGENTS.md.template) as the editing starting point, and remove answers specific to this exercise, role mappings, and environment-specific information. Keep the challenge-side file as a `.template`.
5. Only when conducting the actual trial, copy the selected body to the target repository's root `AGENTS.md`. If an existing `AGENTS.md` is present, do not overwrite it; verify its contents and owner, then stop.
6. Do not add nested AGENTS, parent-repository customization, other forms of Instructions, or settings changes to the main exercise.

## Try it

1. Open the target repository root as the workspace root.
2. Start a new conversation and send the full contents of [request.txt.template](../../../challenges/hc-003/starter/request.txt.template) exactly as written.
3. Allow Copilot to read the necessary files, but do not provide the drafts or comparison notes under `starter\` as evidence for business logic.
4. Compare the response against the source in this order.
   - Calls within `OrderService.approve`
   - The definition of `BaseService.require`
   - The decision in `Actor` to which `require` delegates
   - Branches for null and early returns
   - Conditions for passing authentication and authorization, and order business conditions
5. Record separately the saved path, discovery shown by the client, any display confirming body use, and the final response. Do not infer that the body was used automatically merely because the response is good.

This main exercise is static reading. Do not start Java tests, a database, Web, or batch processes, and do not modify source, tests, or configuration.

## Optional: Compare

If you compare results, keep it brief and use two new conversations.

1. Try the fixed request while the target repository has no root `AGENTS.md` (Baseline).
2. Add only a root `AGENTS.md` with the selected body and try the same fixed request (Customized).
3. Keep the source, model, tools, and reference method consistent, and record the differences in the [worksheet](../../../challenges/hc-003/starter/worksheet/comparison.md.template).

Do not reuse trials performed while designing the body for the comparison. If conditions do not match, other instructions are mixed in, or discovery cannot be observed, do not conclude that the feature caused the effect.

## Verification points

- Are the rules placed at the root reusable for another investigation?
- Have directory-specific perspectives been kept from overloading the root?
- Is `AGENTS.md` described neither as a role definition nor as a permissions setting?
- Rather than concluding from the role string inside the method, was shared processing traced?
- Were authentication and authorization separated from order business conditions?
- Were facts, inferences, and unverified points shown with file + symbol references?
- Were instruction saving, discovery, body use, and the response distinguished?
- Were response length and maintenance burden checked in addition to omissions?

## Further exploration

- [Explore nested AGENTS.md in a separate environment](optional/nested-discovery.md)
- [Explore customization discovery from a parent repository](optional/parent-discovery.md)
- Create a design that removes one sentence from the root, and compare the cautions lost with the ease of maintenance
- Separate candidates specific to `service` and `common` on paper, and consider how much can be generalized at the root

Keep the optional guides separate from the main exercise. Try them only when you can verify support status, owner permission, and a safe disposable environment.

## Constraints, fallback, and safety

- If use of the root `AGENTS.md` cannot be confirmed, you can manually paste the same body before the fixed request. This is a manual fallback and does not confirm discovery from the root.
- If the client does not display discovery or references, leave body use unverified.
- Do not decide whether real users or orders should be approved, and do not use real data, credentials, or secrets.
- Do not start a database, Web, batch processes, or Java tests, and do not report unexecuted validation as successful.
- Do not delete or move aside an existing `AGENTS.md`, User/organization settings, Memory, or another person's customization to create the desired conditions.
- Do not mix nested/parent features into the main exercise. If you try them, follow the optional guides in a separate disposable environment.
