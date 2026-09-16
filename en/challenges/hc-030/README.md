# HC-030 Design a code review that preserves tax amount semantics

**Language:** [日本語](../../../challenges/hc-030/README.md) / **English**

## Scenario

Some tax calculation patches change semantics even when they look small, while others preserve them. Using the public source, tests, and two candidate patches, verify whether Path-specific Instructions help detect semantic risk and suppress false positives.

Do not use a hidden answer key. Judge from the changed lines and evidence, not from the candidate names.

## What this feature is

Path-specific Instructions are a customization that specifies target paths with `applyTo` in the frontmatter and supplies review perspectives only when those paths are handled.

In this scenario, evaluate all of the following:

- rooted findings for semantic risk
- unsupported false positives
- missed risks
- connection to changed lines
- connection to source/tests
- distinction between verification that was run and verification that was not
- ability to choose no finding when there is no problem

## Good fit / Not a good fit

**Good fit**

- Turning domain-specific invariants into review perspectives
- Providing rules needed only for specific paths
- Connecting changed lines to source/tests
- Measuring false positives and misses as well as true positives

**Not a good fit**

- A replacement for a formatter or compiler
- Writing candidate-specific answers in Instructions
- Warning about every change at the same severity
- Claiming tests passed without running them

## Goals

Review two candidates without and with Instructions, then classify the four total results using public categories.

- **true-positive**: Reports an actual semantic risk with rooted evidence
- **false-positive**: Mistakenly identifies a contract-preserving candidate as defective
- **miss**: Fails to identify a risk demonstrated by source or reproducible verification
- **rooted evidence**: Evidence connected to the changed line and to `TaxAmounts`, `Money`, `CommonRulesTest`, or an execution result

## What you need

Fixed inputs are available in `starter/`.

- `candidates/`: Two patches and fixed hash information
- `reference/`: Excerpts from `TaxAmounts`, `Money`, and `CommonRulesTest`
- `customization/tax-review.instructions.md.template`: An inactive draft review rule
- `worksheets/classification.md.template`: A classification worksheet for the four reviews

`TaxAmounts` aggregates net amounts by rate and calls `Money.tax` for each bucket. Also verify that numeric comparison and `equals` for `BigDecimal` do not necessarily treat values with different scales in the same way.

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation steps.

1. Read `starter/reference/` and `starter/candidates/`.
2. Do not apply the candidate patches; treat them as read-only inputs.
3. Keep `starter/customization/tax-review.instructions.md.template` with the `.template` suffix and do not move it to an active path.

Fixed review request:

> Perform a review of this candidate patch and report only changes that break tax amount semantics, with the changed line and rooted evidence. If there are no problems, say so.

## Try it

1. Review Candidate A and Candidate B separately without adding Instructions.
2. Record the finding or no finding, changed line, impact, rooted evidence, and verification.
3. Read the rules in `tax-review.instructions.md.template` and confirm that they do not include candidate-specific answers.
4. Review Candidate A and Candidate B again with the same request. Use a fresh conversation if possible.
5. Record all four reviews in `worksheets/classification.md.template` and classify them using the public categories.
6. Record the command and result only if you ran a test; otherwise, record `not-run`.

## Optional: Compare

- **Baseline**: Without Instructions
- **Customized**: Add the body of `tax-review.instructions.md.template`

Keep the candidate, request, source, model, effort, and tools as consistent as possible. Do not tell only the Customized condition the candidate's intent or expected classification.

## Verification points

- Did you examine both arithmetic and semantic identity?
- Is each finding connected to the changed line and source/tests?
- Did you address true positives, false positives, and misses?
- Did you allow a no-finding result when there was no evidence?
- Are the Instructions free of candidate-specific answers?
- Did you accurately record whether tests were run?

## Further exploration

After evaluating the original two candidates, create a third synthetic patch that weakens the currency check and verify in a separate experiment whether the same review rules generalize. Do not add the expected classification to the Instructions.

## Constraints, fallback, and safety

- Do not modify the candidate patches, source, tests, or active `.github/instructions/**`.
- Do not add private tax rules or customer data.
- If Path-specific Instructions are unavailable, compare only the content by using a manual-equivalent that appends the same body to the fixed request.
- If a Java execution environment is unavailable, record only static evidence and do not infer test results.
