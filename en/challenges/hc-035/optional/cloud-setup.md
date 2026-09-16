# Observe Cloud Agent setup

**Language:** [日本語](../../../../challenges/hc-035/optional/cloud-setup.md) / **English**

[← HC-035 main scenario](../README.md)

## Purpose

In an approved dedicated repository and Ubuntu runner, make limited observations of Cloud Agent setup storage, adoption, each step, and agent start after failure.

## Prerequisites

- Cloud Agent, GitHub Actions, the target repository, and the runner are available
- The default branch and setup file revision can be identified
- JDK 8, Maven 3.9.x, and network requirements can be verified
- Cost limits can be set for the runner, Actions, and model

## Permissions and safety

- Obtain prior approval for saving the active workflow, triggering the check, using the runner, running the Cloud task, and removing the addition at the end.
- Do not read, display, move, or request secret values.
- Do not relax firewall, TLS, proxy, or shared runner settings.

## Procedure

1. Record the setup file revision, job, steps, permissions, runner, and timeout.
2. Verify the workflow syntax and the design of the version checks.
3. Observe setup adoption and each step using the minimum approved check.
4. If a required step fails, separately record the remaining skipped steps, remaining state, and agent start.
5. Record a test command and result only if a test was run.
6. After the experiment, remove only the workflow you added.

## What to observe

- Setup revision on the default branch
- Actual JDK/Maven versions and range compliance
- Difference between dependency preparation and tests
- Failed step, skips, and agent start
- Difference between workflow validation and Cloud Agent adoption

## Stop conditions

- Any of eligibility, approval, Ubuntu runner, default branch/ref, or setup bytes is unknown
- There is no cost limit for Actions, the runner, or the model
- Secrets or relaxation of network policy would be required
- Continuing would require treating agent start after setup failure as success

[← Back to the HC-035 main scenario](../README.md)
