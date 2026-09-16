# HC-036 Design review triggers for Draft, Open, and updates

**Language:** [日本語](../../../challenges/hc-036/README.md) / **English**

## Scenario

For automatic pull request reviews, you need to distinguish a newly opened PR, the first transition from Draft to Ready, an update while still in Draft, a new push, and a human rereview request. You also cannot ignore the time lag between request and completion or the difference between the reviewed head and the current head.

In this scenario, you will use four synthetic configuration proposals and five synthetic events to design a review trigger policy and timeline correlation. Everything is `SYNTHETIC_TRAINING_ONLY`; you will not operate any real PR, review, ruleset, or personal/organization/enterprise setting.

## What this feature is

The automatic settings for Copilot code review determine at which event a review is **requested**. The queue, start, and complete states after the request are separate states.

| Stage | What to verify | What this alone does not establish |
|---|---|---|
| request | request ID, event, actor, ruleset | It entered the queue |
| queue | queue state and its association with an attempt | Execution started |
| start | attempt ID, start time, target head | The review completed |
| complete | completion time, reviewed head | The current head has also been reviewed |

The four configuration proposals are:

- `no-automatic-request`: no automatic requests
- `basic-request`: basic automatic requests
- `draft-request`: basic plus Draft review only
- `push-request`: basic plus new pushes review only

`draft-request` and `push-request` are each a delta from basic. Do not call them a direct one-factor comparison with each other.

## Good fit / Not a good fit

**Good fit**

- Separating newly opened PRs, first Ready transitions, Draft updates, new pushes, and manual rereview requests
- Comparing configuration deltas one at a time
- Correlating request / queue / start / complete
- Identifying stale results from base / head / reviewed head

**Not a good fit**

- Changing rulesets or automatic review settings in a real repository for training purposes
- Treating a request as immediate completion
- Reusing a review of an old head for the current head
- Making manual rereview a fifth configuration proposal
- Inventing queue time, duplicate suppression, or review success without evidence

## Goals

Create the exact 20 cells for 4 configuration proposals × 5 events, and record the trigger decision and required observations in each cell.

Fixed events:

- `new-open`
- `first-ready`
- `still-draft`
- `new-push`
- `manual-rereview`

In addition, correlate the event, actor, PR, base/head, setting source, request, queue, attempt, and reviewed head on one line.

## What you need

All synthetic inputs are in `starter/`.

- `request.txt.template`: fixed request
- `fixtures/packets.json.template`: synthetic request/queue/attempt/head records
- `policy.md.template`: trigger policy
- `event-matrix.md.template`: 20 cells
- `correlation.md.template`: timeline and head correlation table
- `design.md.template`: design worksheet
- `worksheets/comparison.md.template`: optional comparison worksheet

Source code is not included in the fixed inputs. Even if the material looks like a Java PR, do not add a Java file to the reference set.

## Preparation

For common preparation, see [Getting started](../../README.md#getting-started).

1. In every `.template` file and record, preserve `SYNTHETIC_TRAINING_ONLY`.
2. Do not use the IDs or ordering in `starter/fixtures/packets.json.template` as ground-truth labels.
3. Before filling in the event matrix, use `starter/design.md.template` to decide the configuration deltas, scope, manual responsibility, unknowns, and stop conditions.

## Try it

1. Record the differences among the four configuration proposals and their target branch/scope in `policy.md.template`.
2. Fill in all 20 cells in `event-matrix.md.template` without omissions or duplicates.
3. Treat `manual-rereview` as a shared event with a different actor, not as an additional configuration.
4. Read `fixtures/packets.json.template` and diagnose request, queue, start, and complete separately.
5. In `correlation.md.template`, associate event ID/type, actor, synthetic PR, base/head, setting source/scope/ref, request ID, attempt, and reviewed head.
6. Even if the state is completed, do not treat the current head as complete when the reviewed head is stale.
7. If actor, ruleset, or setting source is missing, do not choose a single cause; record it as `unknown`.

## Optional: Compare

In `starter/worksheets/comparison.md.template`, you can make a short comparison using `no-automatic-request` as the **Baseline** and each automatic configuration proposal as the **Customized** condition. Compare only adjacent one-factor differences, and do not treat a trigger in every cell as a good result.

## Verification points

- Are all 20 unique cells for 4 configuration proposals × 5 events present?
- Did you avoid omitting newly opened PRs from the basic targets?
- Did you treat draft and push as separate deltas from basic?
- Did you avoid making manual rereview a configuration proposal?
- Did you separate request / queue / start / complete?
- Did you associate actor, ruleset, and base/head/reviewed head?
- Did you avoid reusing a review of an old head for the current head?
- Did you avoid describing synthetic values as actual GitHub settings or users?

## Further exploration

- On paper, design duplicate handling, cost controls, stopping, and manual responsibility for enabling both Draft review and new pushes review.
- To prepare for limited observation of real events, use the [review trigger supplemental guide](optional/review-triggers.md).

## Constraints, fallback, and safety

- Do not create or change real settings, rulesets, PRs, review requests, workflows, Java, or tests.
- Do not mix real user information or PR URLs into the synthetic materials.
- Even without access to Copilot code review, you can complete the scenario by designing the synthetic policy, 20 cells, and correlation.
- If actor, ruleset, head, or request/attempt information is missing, record it as `unknown` or `incomparable`.
