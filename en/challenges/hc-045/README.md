# HC-045 Safely hand off review findings to a Cloud fix

**Language:** [日本語](../../../challenges/hc-045/README.md) / **English**

## Scenario

A review of tax calculation code produces a potential finding that "the aggregation method for each tax rate may change." Passing it directly to a Cloud fix can lose the change target, branch/head, permitted scope, expected post-image, tests that must not be changed, and an independent validation method.

Compare the two candidates, finding, and handoff events, then create an unsent request draft and an independent validation plan. Do not perform a real Cloud fix, source change, commit, push, or merge.

## What this feature is

A handoff from review to a Cloud fix is not merely forwarding the finding text. A person returns to the source to decide whether to accept the finding, then preserves the change target, no-change scope, branch/head, expected result, validation method, and stop conditions in the request.

Distinguish the states.

| State | Required meaning |
|---|---|
| finding received | A review finding was received |
| human assessed | A person returned to the source and expected result to decide whether to accept it |
| draft | The request body was written. This does not mean it was authorized or sent |
| prepared | The target, scope, branch/head, validation, and stop conditions were confirmed |
| sent | There is direct Evidence that it was actually sent through an approved route |
| accepted | The recipient accepted the request |
| applied | The change was applied to the target head |
| independently validated | It was checked against expectations other than a self-report |

A true value in the packet is a claim in the training material. Do not convert it into Evidence of real permission, transmission, acceptance, or application.

Fixed boundaries for the subject:

- The change candidate targets only `TaxAmounts.java`.
- `Money.java` and `CommonRulesTest.java` are read-only grounds and are not change targets.
- `TaxAmounts` aggregates amounts into tax-rate buckets.
- `Money.tax` rounds the tax amount from the base for each tax rate.
- The existing test definition expects net `22.00`, tax `1.00`, and a bucket count of `2` for `6.00@0.10`, `6.00@0.1000`, and `10.00@0.0800`.
- Reading the source/tests and executing Java/tests are separate.

## Good fit / Not a good fit

**Good fit**

- Comparing a review finding with the source before turning it into a limited request.
- Preventing branch/head/scope confusion.
- Planning validation independent of the fixer's self-report.
- Recording no change needed, insufficient information, or not sent, together with the reason.

**Not a good fit**

- Deciding whether to accept a finding solely from its candidate name or assertive wording.
- Turning a packet claim into real permission, transmission, or application.
- Expanding the change target to `Money.java` or existing tests.
- Applying a before/after candidate to the real source.
- Forcing a handoff when the scope cannot be preserved.

## Goals

Complete the following three items.

- [`handoff-policy.md.template`](../../../challenges/hc-045/starter/handoff-policy.md.template): State, owner, scope, and final human confirmation
- [`request-draft.txt.template`](../../../challenges/hc-045/starter/request-draft.txt.template): An unsent request targeting only `TaxAmounts.java`
- [`validation-plan.md.template`](../../../challenges/hc-045/starter/validation-plan.md.template): Independent validation for H01–H06

Even if the decision is not to send, do not leave the request draft empty. Write the reason it remains unsent, the additional grounds needed, and the intended scope.

## What you need

- A text editor
- The fixed materials under `starter/`
- Java/Maven, Copilot code review, and Cloud Agent eligibility are not required for the main scenario

| Material | Role |
|---|---|
| [`request.txt.template`](../../../challenges/hc-045/starter/request.txt.template) | Fixed request |
| [`fixtures/candidate-diffs.json.template`](../../../challenges/hc-045/starter/fixtures/candidate-diffs.json.template) | before, after, anchor, branch/head/scope, and hash |
| [`fixtures/finding-packet.json.template`](../../../challenges/hc-045/starter/fixtures/finding-packet.json.template) | Synthetic/adapted finding and independent expectations |
| [`fixtures/handoff-events.json.template`](../../../challenges/hc-045/starter/fixtures/handoff-events.json.template) | State/claim/return material for H01–H06 |
| [`reference/reference-notes.md.template`](../../../challenges/hc-045/starter/reference/reference-notes.md.template) | Key handoff boundary points |
| [`handoff-policy.md.template`](../../../challenges/hc-045/starter/handoff-policy.md.template) | Policy worksheet |
| [`request-draft.txt.template`](../../../challenges/hc-045/starter/request-draft.txt.template) | Unsent draft |
| [`validation-plan.md.template`](../../../challenges/hc-045/starter/validation-plan.md.template) | Task decision table |

The candidates, finding, and events are `SYNTHETIC_ADAPTED_TRAINING_ONLY`. They do not have answer labels.

## Preparation

Follow [Getting started with the repository](../../README.md#getting-started) and open this directory. Before reading H01–H06, fix the state Evidence, branch/head/scope, paths that must not be changed, independent expectations, and person responsible for stopping.

| task | candidate | Situation |
|---|---|---|
| H01 | candidate-01 | draft |
| H02 | candidate-01 | sent claim, no direct Evidence |
| H03 | candidate-01 | Return material present |
| H04 | candidate-02 | draft |
| H05 | candidate-02 | sent claim, no direct Evidence |
| H06 | candidate-02 | Return material present |

## Try it

1. In `candidate-diffs`, check the before state, source anchor, after state, requested branch, target head, and requested paths.
2. Return the finding in `finding-packet` to the source boundary and independent expectations, then decide to accept, reject, or hold it.
3. In `handoff-policy.md.template`, write the Evidence, owner, and stop/rollback required for each state.
4. Fill in `request-draft.txt.template` for one candidate.
   - The status is draft/not sent
   - The only change target is `TaxAmounts.java`
   - `Money.java` and `CommonRulesTest.java` are read-only
   - Include the branch/head, anchor, post-image, expectations, and stop conditions
5. For H01–H06, use separate fields for the packet claim and Evidence that can be confirmed in reality.
6. Confirm that the branch/head/changed paths in the return material match the requested scope.
7. Do not convert a self-reported test into independent validation; write a plan to check it against the existing business rules and test definition.
8. Stop for an unexpected branch/head, scope expansion, edits to a no-change path, or insufficient Evidence.

## Optional: Compare

For the same candidate, create both a "draft requesting the change" and a "draft returning it to a person because no change is needed or information is insufficient." Compare what additional Evidence would change the decision while keeping the scope and independent expectations the same.

## Verification points

- The synthetic/adapted labels on the candidate/finding/event are preserved.
- The before state, anchor, after state, branch, head, and scope are compared.
- draft, prepared, sent, accepted, and applied are distinguished.
- A packet claim is not treated as Evidence of actual transmission or application.
- The change target is limited to `TaxAmounts.java`.
- `Money.java` and the test are treated as read-only Evidence.
- The validation plan uses buckets, scale, rounding, and the existing test definition rather than relying only on a self-report.
- No change needed, not sent, hold, and stop are valid results.

## Further exploration

- Compare a shorter request draft with one that fully preserves branch/head/scope/expectations.
- When considering a real Cloud handoff, see [Limited observation of a Cloud handoff](optional/cloud-handoff.md).

## Constraints, fallback, and safety

- In the main scenario, do not send a request, start a Cloud session, change source, run tests, commit, push, or merge.
- Keep the `.template` suffix, and do not create active customizations or requests.
- Stop if the scope cannot be preserved, the target branch/head cannot be confirmed, or independent expectations are insufficient.
- Even without a Java/Maven environment, a static validation plan can be created from the fixed fixtures and test definition.
- A matching hash verifies fixed bytes; it does not guarantee that the candidate is correct or that tests pass.
- `evidence` means direct observations or source/test grounds supporting a claim; it is not a submission bundle.
