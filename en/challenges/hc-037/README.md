# HC-037 Compare Lite and Balanced review quality

**Language:** [日本語](../../../challenges/hc-037/README.md) / **English**

## Scenario

When asking Copilot code review to review changes around tax amounts, you will consider whether to choose Lite or Balanced. Rather than deciding a winner based only on the number of findings or amount of text, you will create an evaluation plan that records supported findings, false positives, misses, duplicates, verification burden, and missing observations using the same criteria.

This scenario does not request actual reviews. For two candidate diffs, you will design all four Lite and Balanced plan cells as `planned-not-requested`.

## What this feature is

Copilot code review effort is the depth of analysis requested for a standard review. Treat Lite and Balanced separately from:

- The Chat model picker or thinking effort
- The role of a Custom Agent
- The length of a manual prompt
- The effective effort actually displayed
- The internal model, cost, agentic fallback, and CI display

The subject is aggregation and rounding by tax rate.

- `TaxAmounts` aggregates amounts by tax rate.
- `Money.tax` rounds the tax amount for each tax-rate bucket.
- Existing tests include inputs whose scales differ despite representing the same rate, such as `0.10` and `0.1000`.
- `candidate-01` contains a candidate with ordinary changes, and `candidate-02` contains a candidate for considering the order of aggregation and rounding. However, no answer labels are distributed.

## Good fit / Not a good fit

**Good fit**

- Deciding on a fair comparison method before running real reviews.
- Connecting findings to changed lines and source/tests.
- Treating warnings about correct changes as potential false positives.
- Defining when a comparison is impossible without converting a missing result on one side into zero findings.

**Not a good fit**

- Judging Balanced to be higher quality based only on its text length or number of findings.
- Calling the result of one run statistically significant.
- Mixing a manual prompt or another model in as a third condition.
- Applying candidate diffs to the real source and claiming that Java or tests were run.

## Goals

Fill in the four rows of [`starter/evaluation-plan.md.template`](../../../challenges/hc-037/starter/evaluation-plan.md.template) so that you can explain:

1. The smallest unit that supports a finding
2. How to handle false positives, duplicates, and misses
3. The time a human spends verifying and the burden of checking evidence
4. The separation between requested effort and unobserved items
5. Conditions for stopping or deferring the comparison

## What you need

- A text editor
- The fixed materials under `starter/`
- Optionally, Git. Eligibility for Copilot code review and a billing allowance are not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-037/starter/request.txt.template) | Unsent fixed request |
| [`evaluation-plan.md.template`](../../../challenges/hc-037/starter/evaluation-plan.md.template) | Evaluation plan for Lite × 2 candidates and Balanced × 2 candidates |
| [`candidate-01.diff.template`](../../../challenges/hc-037/starter/candidates/candidate-01.diff.template) and [`candidate-02.diff.template`](../../../challenges/hc-037/starter/candidates/candidate-02.diff.template) | Two synthetic candidate diffs |
| [`reference/controls.json.template`](../../../challenges/hc-037/starter/reference/controls.json.template) | Items other than effort to hold constant |
| [`reference/rules.md.template`](../../../challenges/hc-037/starter/reference/rules.md.template) | Shared rules for evidence, false positives, burden, and missing observations |
| [`reference/source-map.md.template`](../../../challenges/hc-037/starter/reference/source-map.md.template) | Related symbols and reading boundaries |

All of these are inactive training materials. Do not remove the `.template` suffix.

## Preparation

Open this directory by following [Getting started for the repository](../../README.md#getting-started). Before comparing, fix the following:

- task: `amount-review`
- The contents of `candidate-01` and `candidate-02`
- The full request text and evaluation rules
- Evaluation items other than Lite / Balanced
- The plan revision

Even if the real source is unavailable, you can create the plan using only the aggregation and rounding boundaries documented in the README, candidate diffs, source map, and rules.

## Try it

1. Read `starter/request.txt.template` and `starter/reference/rules.md.template`.
2. Read the two candidates without assuming any answer labels.
3. For each potential finding, decide the changed line, supporting source/test, and scope of support.
4. Decide how to record warnings about ordinary changes, unsupported findings, and duplicates.
5. Fill in the four rows of `evaluation-plan.md.template` using the same criteria.
6. Leave the following values as `null` or `not-observed` unless you actually run the reviews:
   - effective effort
   - internal model
   - actual findings
   - cost
   - agentic fallback
   - CI visibility
7. Write stop conditions for cases where only one side can be run or where the candidate/source can no longer be held constant.

Do not create accuracy or superiority ratios without a valid denominator.

## Optional: Compare

First create a short evaluation proposal without looking at the template, then recreate it using the template's perspectives. Use the same candidates in both and compare only differences in missed missing-observation handling, false-positive verification, and burden.

If you conduct real reviews, keep them separate from the main scenario and observe Lite and Balanced once each on the same PR, base/head, request, request-count limit, and cost limit. Do not treat the unrun side as zero findings.

## Verification points

- All four plan cells are present.
- Inputs and evaluation axes other than requested effort are the same.
- Support, false positives, duplicates, misses, and burden are separated instead of relying on the number of findings.
- Warnings about ordinary changes can be considered.
- `planned-not-requested` has not been reinterpreted as an actual review result.
- `same`, `worse`, `not-observed`, and `incomparable` are also valid conclusions.

## Further exploration

- Design one separate follow-up validation that identifies which missing observation an additional amount example would resolve.
- For safety checks before observing the real service, see [limited observation of standard review effort](optional/review-effort-live.md).

## Constraints, fallback, and safety

- Do not issue review requests, change PRs, change source, or perform cost-incurring operations from the main scenario.
- Do not infer the actual effort, internal model, cost, or review quality.
- If the source is inaccessible, create the evaluation plan using only the included materials and leave source execution results unobserved.
- Stop the comparison if the candidate contents, request, or evaluation rules cannot be held constant.
- Even without eligibility to use the service, you can complete the goals using text alone.
