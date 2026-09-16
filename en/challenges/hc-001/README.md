# HC-001 Build an evidence-minded Java teammate

**Language:** [日本語](../../../challenges/hc-001/README.md) / **English**

## Scenario

When you ask Copilot to investigate or modify Java code, it may return a plausible explanation without making clear which files it actually read, what it ran, or which parts are inference.

In this scenario, instead of adding the same cautions to every prompt, you will design an "evidence-based way of working" that applies across the repository as Repository Instructions. The subject is an invalid rounding specification in `Money.tax`. You will try the instructions with a request to add boundary tests while preserving production behavior and existing tests.

## What this feature is

Repository Instructions are a mechanism for placing ongoing working rules for Copilot in a Markdown file within a repository. In environments where GitHub Copilot supports them, you normally use `.github/copilot-instructions.md`.

What you specify here is not the answer to the code problem, but reusable behavior.

- Read the specified source and tests first
- Separate facts, inferences, and unverified points
- Tie important claims to a file and symbol
- If available, run narrowly targeted compile/test commands
- Do not report unexecuted validations as successful

Instructions do not replace tests, reviews, or human judgment. Because their application and output vary by client, model, and available tools, a person must ultimately verify the source and terminal results.

## Good fit / Not a good fit

**Good fit**

- Quality rules repeated across many Java investigations
- A repository-wide, consistent way to present evidence
- The habit of clearly stating "what was run / what was not run"

**Not a good fit**

- Long procedures used only once
- Memorizing the correct answer or test code for a specific bug
- Storing secrets, personal names, or environment-specific URLs
- Replacing unit tests, review, approval, or access control

## Goals

1. Create concise Repository Instructions reusable for Java work.
2. For the following fixed request, obtain a response that makes the source/test evidence, execution results, and unverified points clear.
3. Check that `validation.rounding`, which validates input, is not confused with the rounding mode used for monetary calculations.

Fixed request:

> For `Money.tax`'s `UNKNOWN` / invalid rounding boundary, add a test to `CommonRulesTest.java` while preserving production code and the existing expectation. Distinguish `validation.rounding` from rounding used in monetary calculations, and report the evidence, execution results, and unverified points.

## What you need

- A GitHub Copilot environment that supports Repository Instructions
- A working branch or worktree in a Java repository that you are allowed to modify
- The following target files
  - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
  - `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- If you run tests, the Java/JDK and build tool specified by that repository

The `starter\` directory contains the following inactive materials.

- [Repository Instructions editing example](../../../challenges/hc-001/starter/customization/copilot-instructions.md.template)
- [Fixed excerpt from Money.java](../../../challenges/hc-001/starter/reference/Money.java.excerpt.md.template)
- [Fixed excerpt from CommonRulesTest.java](../../../challenges/hc-001/starter/reference/CommonRulesTest.java.excerpt.md.template)
- [Optional comparison notes](../../../challenges/hc-001/starter/worksheet/comparison.md.template)

Because all of them retain the `.template` suffix, they do not become active customization in this repository.

## Preparation

1. First, review [Getting started for the entire repository](../../README.md#getting-started).
2. Read `Money.java` and `CommonRulesTest.java` in the target repository. If you cannot prepare the target repository, you can use the fixed excerpts in `starter\reference\` for a static design exercise.
3. Before viewing the response, choose two to four behaviors to check. For example:
   - Source/test quotations support the claims
   - Facts and inferences are separated
   - The commands run and their results are stated
   - Unverified points remain when execution is not possible
4. Read `starter\customization\copilot-instructions.md.template` and select only the rules needed for the target repository. Leave the challenge-side `.template` unchanged, and place it as `.github/copilot-instructions.md` only in the target repository.
5. Do not embed the answer to a specific test, the form of an exception assertion, or filenames used only for this exercise in the Instructions.

## Try it

1. Open the target repository in GitHub Copilot and start a new conversation.
2. Send the fixed request above exactly as written.
3. Review the diff that Copilot proposes or edits.
4. Compare the following against the source:
   - The rounding specifications accepted by `Money.tax` and the branch taken for invalid values
   - The valid rounding boundaries protected by existing tests
   - Whether only boundary tests were added without changing production code
   - Whether `validation.rounding` and rounding of the calculation result are explained as separate concerns
5. Only if the target repository has an official test procedure and the execution environment is available, run the smallest relevant test. Verify the terminal command, exit result, and failure details yourself rather than relying on Copilot's self-report.

## Optional: Compare

If you want to see the effect, use a brief manual self-check.

1. Try the fixed request once without the Instructions (Baseline).
2. Keep the same source, request, model, and tool conditions, then enable the Instructions and try again in a new conversation (Customized).
3. In the [comparison notes](../../../challenges/hc-001/starter/worksheet/comparison.md.template), record quotations, facts/inferences/unverified points, treatment of tests, response length, and unnecessary work.

If you cannot create exactly the same conditions, do not declare one result better; state the differences instead. A result with no difference, a longer response, or more unnecessary commands is also useful.

## Verification points

- Are the Instructions reusable rules for other Java work rather than the answer to this exercise?
- Do important claims have evidence tied to a file and symbol?
- Are code reading and execution verification separated?
- Are tests that were not run clearly not reported as successful?
- Were existing expectations and production behavior left unchanged?
- Is validation of invalid input distinguished from rounding in monetary calculations?

## Further exploration

- Use the same Instructions for another small Java investigation and check whether they cause excessive quotation or overly long responses
- Remove one rule and compare the lost quality with the ease of maintenance
- Consider how the reporting format should differ between work where tests can be run and work limited to static reading

## Constraints, fallback, and safety

- If Repository Instructions are unavailable, you can manually paste the selected text before the request. This is a manual fallback and does not confirm automatic discovery.
- If Java cannot be run, explicitly state that compile/test was not run and report only what can be verified from the source and tests.
- The fixed excerpts are for design practice. When the target repository is available, treat its actual files as authoritative.
- Do not install unapproved software, bypass permissions, or paste secrets or private data.
- Always review Copilot's proposal through its diff and tests, and do not apply it directly to real monetary values or business decisions.
