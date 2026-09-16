# HC-027 Freeze the evaluation plan before comparing customizations

**Language:** [日本語](../../../challenges/hc-027/README.md) / **English**

## Scenario

If you change the scoring criteria, number of trials, or handling of missing values after seeing Copilot's responses, you can label only favorable results as "improvements." In this scenario, use a primary task and a transfer-check task to freeze the evaluation criteria, order, completion conditions, missing-data handling, and regression handling before viewing the results.

All materials are synthetic data. They are not measurements of a real model's performance, human scoring, or educational effects.

## What this feature is

Evaluation preregistration is a way to decide before a comparison what will remain the same, which rows will remain in the denominator, and how failures will be handled. Treat the following separately.

- task: `primary` / `transfer-check`
- variant: `reference` / `reusable-rules` / `manual-rules`
- block: `block-01` / `block-02` / `block-03`
- initial response / follow-up response
- observed `0` / unobserved `null`
- individual row / within-task aggregation / overall regression judgment

The fixed identity is `2 task × 3 variant × 3 block = 18 row`. `reusable-rules` and `manual-rules` are intended to use the same frozen body, but the former supplies reusable rules while the latter supplies the same full body manually.

## Good fit

- Freezing the rubric, denominator, and order before a customization comparison
- Retaining missing values, failures, and partial regressions rather than removing them
- Separating the initial response from the response after a follow-up
- Using the same rules to judge improved, equal, worse, no additional asset needed, and incomparable results

## Not a good fit

- Selecting only high-scoring criteria after seeing the results
- Replacing `null` with `0` before calculating an average
- Calling the 18 synthetic rows 18 LLM executions
- Calling additional data in the same starter a blind test
- Sending private data to an external service without approval

## Goals

- Define five evaluation criteria and a fixed denominator
- Freeze the order, completion conditions, and missing-data / failure rules for all 18 rows
- Aggregate initial / follow-up results and regressions by task separately
- Detect omissions, duplicates, and variant contamination
- Explain conclusions and limitations, including when the results were viewed

## What you need

`starter/` contains the following inactive materials.

- `request.md.template`: Fixed evaluation request
- `primary-request.md.template` / `primary-packet.txt.template`
- `transfer-request.md.template` / `transfer-packet.txt.template`
- `design.md.template`: Worksheet for the five criteria and aggregation rules
- `schedule.md.template`: Fixed schedule of 18 rows
- `rules-draft.md.template`: Reusable rules body that contains no task values
- `synthetic-trials.md.template`: Synthetic results to read after freezing the plan
- `regression-toy.md.template`: Exercise that does not hide a regression in one target
- `comparison.md.template`: Comparison record

## Preparation

1. Review the [common getting started instructions](../../README.md#getting-started).
2. At first, do not open `synthetic-trials.md.template`. Use only `request.md.template`, the two task request / packet pairs, `design.md.template`, and `schedule.md.template`.
3. Freeze in your own notes the five criteria, denominator of five, variant order, block completion conditions, missing-data / failure handling, initial / follow-up distinction, individual regression rules, and overall rollup.
4. Decide that if you viewed the results first, you will not call the analysis preregistered.
5. Keep every `.template` inactive and do not create active repository customizations.

## Try it

1. Give Copilot the fixed request and `design.md.template`, and have it propose five criteria that measure the purpose of the task. Also freeze the reason for choosing each criterion and the method for judging it.
2. Confirm that the 18 rows in `schedule.md.template` form the exact set with no duplicates.
3. Decide the variant order and the stop conditions for each block. Do not change them midway to match the results.
4. In `rules-draft.md.template`, write only reusable rules that do not contain concrete packet values or winners and losers.
5. Only now read `synthetic-trials.md.template`. Do not delete any of the 18 rows; retain failed / not-run / `null` entries in the denominator record as well.
6. Aggregate primary and transfer-check separately, and separate initial from follow-up.
7. Use `regression-toy.md.template` to confirm that a regression in one target is not hidden by equal results in other targets.
8. In `comparison.md.template`, summarize coverage, missing values, per-task results, the overall judgment, and limitations.

The conclusion may be any of `improved`, `not-needed`, `equal`, `worse`, `blocked`, or `incomparable`.

## Optional: Compare

As a brief manual self-check, you can try the same task twice in new conversations.

- **Baseline**: Provide only the fixed task
- **Customized**: Add to the same task the full rules body frozen before viewing the results

Keep the inputs, freshness of the conversation, and order the same, and do not revise the rules after viewing a response. Record this manual check separately from the main exercise using the 18 synthetic rows.

## Verification points

- The five criteria, order, completion conditions, missing-data handling, and regression policy were frozen before the results
- The exact identity of all 18 rows was preserved
- `null` and `0`, and initial and follow-up, were separated
- Omissions, duplicates, and variant contamination were detected
- Regressions in primary and transfer-check were not hidden by an average
- The bodies of `reusable-rules` and `manual-rules` remained identical
- Synthetic results were not promoted to a real-model evaluation or educational effect

## Further exploration

- [Consider an external evaluation tool / service](optional/external-evaluation.md)

Proceed as a separate evaluation from the synthetic exercise only if you can confirm the publisher, version, transmission scope, model, cost, and approval.

## Constraints, fallback, and safety

- The main scenario is complete using only local synthetic materials and requires no model execution, network transmission, or billing.
- If you viewed `synthetic-trials.md.template` first, you can still analyze it, but you cannot demonstrate preregistration. Record the viewing order as a limitation.
- If cost or time was not observed, record `null`, not `0`.
- Do not delete rows for execution failures, unscorable results, or unperformed trials.
- Stop if any of the publisher, supported version, acquisition source, authentication, transmission target, cost ceiling, or approval for an external feature is unknown.
- Do not send private prompts, source, tokens, or personal information externally without approval.
