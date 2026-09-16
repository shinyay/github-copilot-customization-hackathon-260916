# HC-029 Have Cloud Agent honor Java compatibility constraints

**Language:** [日本語](../../../challenges/hc-029/README.md) / **English**

## Scenario

A Java change request contains both a one-time objective and compatibility constraints that should be followed repeatedly across the repository. In this scenario, start from a sufficiently detailed fixed request and design which constraints are worth keeping permanently as Repository Instructions.

The exercise is a **proposal** for a test that checks the unknown-rounding boundary of `Money.tax`. The proposal may target only `CommonRulesTest.java`; do not apply it to the source or tests.

## What this feature is

Repository Instructions are Markdown that continuously communicates repository-specific constraints and verification order to Cloud Agent and similar environments. Instructions do not install JDK or Maven, and they do not guarantee test execution, permissions, correctness of changes, or human review.

Separate the following in this scenario.

- task-specific: Which test to propose for the unknown-rounding boundary
- candidates for permanent use: Java version, allowed change scope, preservation of existing expectations
- environment: Whether JDK 8 / Maven are actually available
- proposal: A diff that has not been applied
- verification: Checks that were run and checks that were not run

## Good fit / Not a good fit

**Good fit**

- Making Java compatibility constraints that recur across multiple tasks permanent
- Making explicit the change boundaries that protect production, the POM, and existing test expectations
- Dividing responsibility between the task request and Repository Instructions
- Recording a decision not to add Instructions

**Not a good fit**

- Using Instructions alone to prepare JDK, Maven, or dependencies
- Changing production code or `pom.xml` to make the proposal work
- Reporting unperformed compile/test steps as passing
- Applying the proposed diff as-is

## Goals

Create a test proposal and a draft of reusable repository rules that satisfy the following fixed request.

> Assume JDK 8 and Maven, and stay within Java 7 syntax and the Java 7 standard API. Check the unknown rounding boundary of `Money.tax`, and limit the proposed change to `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java` only. Do not change production code, `pom.xml`, or the expectations of existing tests, and report any compile/test steps that were not run as `not-run`.

## What you need

Fixed source paths:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- `pom.xml`

Supporting paths to inspect when necessary:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java`
- `README.md`

`starter/` contains the fixed request, source map, design sheet, compatibility checklist, instructions for writing the proposed diff, an inactive Instructions draft, and an optional comparison sheet.

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation.

1. Read `starter/request.md.template` and `starter/source-map.md.template`.
2. If the target source is available locally, read the actual files. Otherwise, use only the checks shown in the source map and state which portions remain unverified.
3. Keep `starter/customization/repository-rules.md.template` as a `.template` and do not place it under `.github/**`.

## Try it

1. Inspect the rounding selection in `Money.tax` and how it handles unknown values.
2. Distinguish the existing tests in `CommonRulesTest.java` from the responsibility of `TaxAmounts`.
3. In `starter/design.md.template`, write which constraints should be permanent and which should remain in the request.
4. In `starter/customization/repository-rules.md.template`, write only rules worth reusing across multiple tasks.
5. Following `starter/proposal-guide.md.template`, create `proposed-change.diff.template` yourself.
6. Use `starter/compatibility-checklist.md.template` to verify the following.
   - The JDK 8 execution environment is separate from the Java 7 syntax/API constraints
   - The proposal targets only `CommonRulesTest.java`
   - Production code, `pom.xml`, and existing test expectations remain unchanged
   - Compile/test is reported as `not-run` if it was not executed
   - The diff was not applied

## Optional: Compare

Using `starter/worksheets/comparison.md.template`, you can manually compare the following.

- **Baseline**: Fixed request only
- **Customized**: The same request + frozen repository rules
- **Manual-equivalent**: The same full body as Customized attached to the request

Keep the source, request, model, and tools the same. Do not claim that the supply location or priority is also the same.

## Verification points

- Were JDK 8 and Java 7 syntax/API distinguished?
- Can the basis for unknown rounding be traced back to the source?
- Was the proposal limited to one test file?
- Were production, the POM, and existing expectations left unchanged?
- Were task-specific completed answers kept out of Instructions?
- Were unperformed tests reported as `not-run`?
- Was deciding that Instructions are unnecessary also allowed?

## Further exploration

- Consider on paper whether the same rules generalize when `tax-category` is used as another input
- Before trying the proposal with an actual Cloud Agent, use the [supplementary guide to the Cloud test proposal](optional/cloud-test-proposal.md)

## Constraints, fallback, and safety

- Save and read the diff only; do not run `git apply`.
- Do not change production code, the POM, existing tests, workflows, or repository settings.
- A static proposal can be created even without JDK or Maven. In that case, report compile/test as `not-run`.
- Even without access to an actual Cloud Agent, you can compare body content with manual-equivalent. Leave automatic loading and path application unverified.
