# Observe Instructions scope in Cloud Agent

**Language:** [日本語](../../../../challenges/hc-031/optional/cloud-scope-observation.md) / **English**

[← HC-031 main scenario](../README.md)

## Purpose

Make limited observations of which Instructions are supplied to Cloud Agent for Java, XML, and mixed tasks. This is not a procedure for testing `applyTo` as access control.

## Prerequisites

- Cloud Agent and the target repository are available
- The starting branch, target revision, and four main source files can be identified
- The raw bytes of the Java/XML drafts being compared can be saved
- Java, XML, and mixed tasks can be prepared under the same conditions

## Permissions and safety

- Obtain prior approval for placing active Instructions, running Cloud tasks, selecting the model and branch, incurring costs, and removing the additions at the end.
- Do not turn `applyTo` into an ACL or treat `excludeAgent` as a denial of source access.
- Remove only the settings you added; do not delete shared settings or history.

## Procedure

1. Record the target revision and the hashes of the Java/XML drafts.
2. Prepare the three Java, XML, and mixed tasks and a fixed request.
3. Place active Instructions within the approved scope.
4. Run each task in an independent conversation.
5. Record only the supply scope that can be confirmed directly from attribution or usage records.
6. After the experiment, remove the active Instructions you added.

## What to observe

- Task and target path
- Revision and hash of the Java/XML drafts
- Drafts that can be directly confirmed as supplied
- Prediction and actual observation for `excludeAgent`
- Difference between the fact that source could be read and the supply of Instructions

## Stop conditions

- Any of eligibility, approval, target revision, or draft bytes is unknown
- Inputs for the three tasks cannot be made comparable
- Instructions supply would have to be inferred only from source access
- Continuing would require deleting or broadly changing existing settings

[← Back to the HC-031 main scenario](../README.md)
