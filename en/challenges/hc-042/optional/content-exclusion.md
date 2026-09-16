# Observe content exclusion in a limited way

**Language:** [日本語](../../../../challenges/hc-042/optional/content-exclusion.md) / **English**

[Return to the HC-042 main scenario](../README.md)

## Purpose

Observe in a limited way that content exclusion for standard code review and Instructions `applyTo` are controls with different owners and surfaces. Do not bypass an exclusion or detour through another surface.

## Prerequisites

- You can identify the target repository, code review surface, and target path.
- You can confirm the Instructions revision and the management scope for content exclusion.
- You can confirm the target feature's release state, eligibility, and effective policy.
- The observation scope and the people responsible for stopping and restoration are defined.

## Permissions and safety

- Obtain separate permission for observation without changing exclusion settings, the target surface/path, and the logging scope.
- Do not bypass exclusions, detour through another surface, or remove repository content.
- Do not try to override an administrator policy with Instructions.
- If a setting change becomes necessary, do not proceed without separate approval.

## Procedure

1. Record the Instructions `applyTo` pattern, target revision, and owner.
2. Record the management scope, target path, owner, and supported surfaces for content exclusion.
3. Without changing settings, observe only the applicable scope that can be confirmed on the target surface.
4. Record separately whether instructions were provided, content was excluded, and content was used in the answer.
5. Do not infer an unknown policy; leave items to confirm with the administrator.

## What to observe

- Surface and release state
- Instructions pattern/revision
- Content exclusion scope/path
- Owner of each control
- Observations of instructions being provided, content being used, and exclusion
- Unknowns and reasons for holding

## Stop conditions

- Eligibility, effective policy, or management scope is unknown.
- Bypassing an exclusion or detouring through another surface is necessary.
- The target path, Instructions revision, or restoration scope cannot be fixed.
- The two controls would need to be combined into one success value.

## Return to the main scenario

Map the results back to the [HC-042 verification points](../README.md#verification-points), preserving the responsibility boundary between `applyTo` and content exclusion.
