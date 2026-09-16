# HC-002 Teach separate ways to read Java and XML

**Language:** [日本語](../../../challenges/hc-002/README.md) / **English**

## Scenario

When investigating inventory allocation for an order, reading only the Java may explain "who can call it and in which state" while overlooking its connection to Spring XML. Conversely, merely listing XML attributes does not explain how they apply to the method under investigation.

In this scenario, you will design File/task Instructions that provide different reading approaches for Java and Spring XML. Rather than embedding the business answer in the instructions, you will establish the habit of tracing references among target files, shared processing, and configuration.

## What this feature is

File/task Instructions used in VS Code are Markdown instructions placed as `*.instructions.md` under the repository's `.github/instructions/` directory. YAML frontmatter at the beginning identifies the target and purpose, followed by the working rules in the body.

```markdown
---
description: "Java の実装を根拠付きで読むための観点"
applyTo: "wholesale-core/src/main/java/**/*.java"
---
```

- `applyTo` is a workspace-relative file pattern. Use `/` inside the pattern regardless of the OS.
- Multiple patterns can be provided as a comma-separated list in a single quoted string.
- `description` explains the purpose of the instructions. Depending on the client, it may also be used to associate the instructions with the work being performed.
- `applyTo` is not access control. It does not guarantee permission to read files or that the instructions will never be selected through another route.
- The order in which multiple Instructions are combined is not guaranteed. Do not treat filenames or save order as priority; ensure that the two bodies do not conflict.
- The handling of instructions that omit `applyTo`, and of semantic selection, must be checked for each client/version. In this scenario, retain explicit `applyTo` values for both Java and XML.

For Spring XML, read the following as linked name references.

- bean: which class of object is configured under which name
- advice: how shared processing such as transactions is declared
- advisor / pointcut: which processing that advice applies to
- method rule (`tx:method`): handling for each method name

An XML declaration and an observation that a transaction or rollback occurred at runtime are different things.

## Good fit / Not a good fit

**Good fit**

- File groups such as Java and Spring XML require different recurring reading approaches
- You want to maintain only the relevant perspectives rather than sending lengthy cautions for every file
- You want to examine over-application when scope is broadened and missed targets when it is narrowed

**Not a good fit**

- One-time requests or short cautions common to all work
- Memorizing a specific role name, the conclusion about inventory allocation, or the transaction answer
- Using a pattern as information protection or as a mechanism guaranteed to apply
- Proving actual database behavior through static Java/XML reading alone

If the cost of adding instructions exceeds their effect, choosing not to add them is also a valid design.

## Goals

1. Design two Instructions with different scopes and bodies, one for Java and one for Spring XML.
2. Connect Java's shared guard with XML's bean/advice/pointcut/method rule in one evidence-based explanation.
3. Verify scope with positive and negative examples, and record unnecessary selection or missed targets.
4. Do not confuse saving, discovery in the client, actual use of the body, and response content.

## What you need

- VS Code and GitHub Copilot that support File/task Instructions
- A working branch or worktree for read-only investigation
- A target repository containing the following files

| Reading entry point | What to verify |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `OrderService.allocate`, its callees, state prerequisites, and updates |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | The guard shared by services |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | The decision delegated to from the guard |
| `wholesale-core/src/main/resources/application-context.xml` | Imports, advice, advisor, and method rules |
| `wholesale-core/src/main/resources/spring/module-operations.xml` | Imported bean definitions and references |

For negative scope examples, use the target repository's `pom.xml` and `README.md`. Do not include Maven configuration in the Spring Instructions merely because it has an XML extension.

The `starter\` directory contains the following inactive materials.

- [Fixed request](../../../challenges/hc-002/starter/request.txt.template)
- [Java Instructions](../../../challenges/hc-002/starter/customization/hc002-java.instructions.md.template)
- [Spring XML Instructions](../../../challenges/hc-002/starter/customization/hc002-xml.instructions.md.template)
- [Design worksheet](../../../challenges/hc-002/starter/worksheet/design.md.template)
- [Optional comparison notes](../../../challenges/hc-002/starter/worksheet/comparison.md.template)

Because all of them retain the `.template` suffix, they do not become active customization in this challenge directory.

## Preparation

1. Review [Getting started for the entire repository](../../README.md#getting-started).
2. Use the [design worksheet](../../../challenges/hc-002/starter/worksheet/design.md.template) to decide the following before viewing the response.
   - Positive and negative examples for Java and XML
   - Whether to include `module-operations.xml` directly in scope or have references traced from the entry point
   - Which of the shared guard, state prerequisites/rejections/updates, and XML reference relationships to retain in the body
   - How to observe unnecessary explanations, missed targets, and over-application
3. Read the two drafts under `starter\customization\` and retain only the necessary rules in copies for the target repository. Do not make the challenge-side `.template` files active. Only when conducting the actual trial, copy them to the target repository under the following names.
   - `.github/instructions/hc002-java.instructions.md`
   - `.github/instructions/hc002-xml.instructions.md`
4. Keep frontmatter and body separate, and ensure the two bodies do not conflict regardless of the order in which they are combined.
5. Do not put the conclusion about `allocate` or the role/transaction answer specific to this exercise in the Instructions body.

## Try it

### 1. Verify scope

In new conversations separate from the actual investigation, use the same following request for one file at a time.

> Explain the structure of this file in one sentence. Read only; do not make changes or run anything.

With the initial templates, you can make predictions like the following.

| Target | Java | XML |
| --- | --- | --- |
| `OrderService.java` | In scope | Out of scope |
| `application-context.xml` | Out of scope | In scope |
| `module-operations.xml` | Out of scope | In scope |
| `pom.xml` | Out of scope | Out of scope |
| `README.md` | Out of scope | Out of scope |

Record predictions separately from the references or selections shown by the client. Also distinguish cases where the file was explicitly attached, referenced from other Instructions, or no indication was shown. Do not conclude that the instruction body was used automatically merely because the same words appear in the response.

### 2. Read with the fixed request

Start a new conversation and send the full contents of [request.txt.template](../../../challenges/hc-002/starter/request.txt.template) exactly as written. Make the five entry points available in the same way.

Check the response for the following.

- It traces from `OrderService.allocate` through the shared guard to the decision in `Actor`
- It separates state or version prerequisites, rejection conditions, and post-processing updates
- It connects the target bean, advice, the advisor's pointcut, and method rule by name
- It does not apply rules from another service to `allocate` unconditionally
- It supports important claims with file + symbol references (elements and attributes for XML)
- It distinguishes facts, inferences, and unverified points
- It distinguishes XML declarations from transactions/rollbacks that were not run

This request is read-only. Do not edit source, compile, run tests, connect to a database, or start a server.

## Optional: Compare

If you compare results, briefly try only two conditions.

1. Run the fixed request in a new conversation without the two Instructions (Baseline).
2. Place the two Instructions and run the same fixed request in another new conversation (Customized).
3. Keep the source, request, model, tools, and explicit attachment method consistent, and record differences in the [comparison notes](../../../challenges/hc-002/starter/worksheet/comparison.md.template).

If the conditions differ, instruction discovery cannot be observed, or other instructions are mixed in, do not infer the feature's effect from response quality alone.

## Verification points

- Can you explain both the benefit and maintenance cost of broadening the Java and XML scopes?
- Are the two Instructions reusable reading approaches rather than the correct business answer?
- Is `applyTo` treated neither as an ACL nor as an exclusive exclusion mechanism?
- How much of saving, discovery, body use, and output could actually be observed?
- Were the reference relationships verified rather than merely quoting both Java and XML?
- Were declarations separated from runtime facts, with unverified points retained?

## Further exploration

- Add to the design worksheet how missed targets and over-application would change when a new service or XML module is added
- Compare an XML scope narrowed to exact paths with one broadened to a directory pattern
- Observe selection after changing the wording of `description` as a separate experiment from comparing `applyTo`
- Remove one sentence duplicated in the two bodies and consider the change in response quality and maintenance effort

## Constraints, fallback, and safety

- If File/task Instructions are unavailable, you can manually paste the two bodies before the fixed request. This is a manual fallback and does not verify scope or automatic selection.
- If the client does not display discovery or references, leave actual use of the body unverified.
- `applyTo` does not add or remove permissions. Do not put secrets or private data in the instructions, and follow existing access policies.
- Do not infer actual database transaction, commit, or rollback behavior from static XML declarations.
- Do not modify source, tests, or configuration, and do not add new software, external tools, or permission changes for this reading exercise.
- Do not delete existing User/organization settings or other people's Instructions to verify scope. If their influence cannot be separated, record that limitation and stop.
