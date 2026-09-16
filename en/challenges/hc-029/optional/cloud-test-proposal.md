# Try the test proposal with Cloud Agent

**Language:** [日本語](../../../../challenges/hc-029/optional/cloud-test-proposal.md) / **English**

[← HC-029 main scenario](../README.md)

## Purpose

Organize the checks required before giving the inactive rules and test proposal created in HC-029 to Cloud Agent in an approved dedicated repository. This is not a procedure for automatically applying the proposed diff to existing work.

## Prerequisites

- Cloud Agent and the target repository are available
- You can clearly identify the starting branch and destination branch
- You can confirm JDK 8, the Maven 3.9 series, and the Java 7 compatibility constraints
- You can confirm the target test path and paths that must not be changed

## Permissions and safety

- Obtain advance approval for the Cloud task, model use, branch creation, change proposal, test execution, and cost.
- Do not change production code, `pom.xml`, or existing test expectations as a fallback.
- If active Instructions are placed, the target repository owner must review the content and the removal procedure.

## Procedure

1. Record the fixed request, rules body, source revision, and target test path.
2. If you separate trials without and with the rules, use the same source and request.
3. Explicitly tell Cloud Agent that the proposal scope is limited to `CommonRulesTest.java`.
4. Do not merge the generated change automatically. Review it for changes to production/POM/existing expectations.
5. Confirm the JDK and Maven versions before running compile/test, and record the command and exit result.
6. After the trial, remove only the active customization that you added.

## What to observe

- Whether the rules unnecessarily duplicate the task-specific request
- Whether the proposal stays within the target test file
- The actual JDK/Maven versions and compatibility constraints
- Compile/test steps that were run and checks that were not run
- Factors that make the comparison impossible, such as differences in branch, model, tools, or inputs

## Stop conditions

- Any of Cloud Agent, the repository, branch, JDK, or Maven cannot be confirmed
- Approval for the task, model, cost, changes, or tests is unavailable
- Changes to production/POM/existing expectations become necessary
- The source or inputs cannot be aligned fairly
- Unperformed tests would need to be treated as passing

[← Return to the HC-029 main scenario](../README.md)
