# Observe the Plugin lifecycle within a limited scope

**Language:** [日本語](../../../../challenges/hc-040/optional/plugin-lifecycle-live.md) / **English**

[Return to the HC-040 main scenario](../README.md)

## Purpose

Using a trusted, fixed retrieval source, observe Plugin retrieval, installation, enablement, selected version, Skill discovery, update, and restoration within a limited scope. This supplement verifies the main scenario's byte-identity plan in a real environment.

## Prerequisites

- You have an approved retrieval source and fixed ref/version.
- You can verify the supported client or Cloud surface.
- You can distinguish existing Skill/Plugin copies from what you add yourself.
- You can fix the v1/v2 package hashes and v1 restoration source.
- You can verify the eligibility and organization policy required for installation, enablement, and updates.

## Permissions and safety

- Obtain separate permission for retrieval, installation, enablement, update, restoration, Cloud trials, and costs.
- Do not use a fictional marketplace, floating ref, or unknown version.
- Do not silently bypass controls through user settings or delete existing copies in bulk.
- Do not add components to the package from the main scenario.

## Procedure

1. Record the retrieval source, ref/version, package hash, and component inventory.
2. Verify existing copies, the selected version, and the restoration source.
3. After approval, install/enable v1 and observe the discovered version and Skill.
4. Update to v2, then record the selected version, Skill hash, discovery, and call as separate observations.
5. Restore v1 and verify that the retrieval source and Skill hash return to the frozen v1.
6. After completion, clean up only what you added yourself using the approved procedure.

## What to observe

| Layer | Record |
|---|---|
| package | source/ref, package hash, component inventory |
| lifecycle | install, enable, update, restore |
| selection | number of active copies, selected/fetched version |
| use | discovery, content injection, call |
| safety | client/Cloud support, cost, restoration |

Do not treat format conformance or matching hashes alone as successful discovery or call.

## Stop conditions

- The retrieval source, ref/version, or supported surface cannot be verified.
- Existing copies cannot be distinguished from what you added yourself.
- The v1 restoration source or hash cannot be fixed.
- There is no separate permission for installation, enablement, update, and restoration.
- Additional components would be required for the one-Skill comparison.

## Return to the main scenario

Return the observations to the [HC-040 verification points](../README.md#verification-points), and verify that you have not confused planned copies with observed active copies or the manifest with the selected version.
