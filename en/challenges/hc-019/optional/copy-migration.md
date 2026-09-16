# Observe migration of a self-owned copy

**Language:** [日本語](../../../../challenges/hc-019/optional/copy-migration.md) / **English**

## Purpose

Observe copy migration in a supported product using a harmless copy that you own. Verify the source and destination, metadata, and preservation of the original separately, and do not mistake successful copying for application or automatic synchronization.

## Prerequisites

- A product version and target host that support migration
- A disposable copy that you own
- The ability to verify the source, destination, same-name collisions, metadata, and location settings
- The ability to restore the previous state while preserving the original

## Permissions and safety

- Limit and approve in advance the destinations and settings that may be created or changed.
- Do not use `deleteOriginal`, overwrite an item with the same name, or modify a normal profile / home.
- Do not migrate this repository's `starter/**/*.template`.
- Do not use private content or another person's copy.

## Procedure

1. In the current product documentation, verify the target format, source, destination, and metadata that will be carried over.
2. Record the body, metadata, location, and initial state of the self-owned copy.
3. Perform the permitted migration operation once with settings that preserve the original.
4. Compare the destination body and metadata with the source.
5. Observe listed, enabled, discovery, and application as separate items; do not infer them from matching bodies.
6. If rollback is needed, keep the original and clean up only the destination that you created.

## What to observe

- Which of the body and metadata were carried over
- Whether automatic synchronization between source and destination remains unverified
- How location settings and same-name collisions were handled
- Whether there is direct information about discovery / application after migration

## Stop conditions

- Deleting the original, overwriting an item with the same name, or modifying a normal profile / home is required
- The source, destination, metadata, or rollback cannot be verified
- The self-owned copy cannot be isolated
- The product documentation and the actual UI do not match

[Return to Further exploration in the main scenario](../README.md#further-exploration)
