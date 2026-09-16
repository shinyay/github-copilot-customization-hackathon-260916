# Verify PostgreSQL readiness

**Language:** [日本語](../../../../challenges/hc-035/optional/postgres-readiness.md) / **English**

[← HC-035 main scenario](../README.md)

## Purpose

Before starting database tests, verify that the conditions for a dedicated PostgreSQL database, connection scope, opt-in, and cleanup are in place. This guide does not provision a database or run a connection or test.

## Prerequisites

- JDK 8 and Maven 3.9.x can be verified
- The opt-in conditions for database tests can be verified
- An approved dedicated PostgreSQL instance/database is available
- The database owner, network/runner policy, and restoration scope can be identified

## Permissions and safety

- Obtain approval from the database owner for database use, connections, fixtures, limited tests, stopping, and cleanup.
- Do not use a shared/production database, production data, or unapproved fixtures.
- Do not save, display, or reproduce credentials in the training material.

## Procedure

1. Record the engine/version, dedicated database name, owner, and network path.
2. Identify the tests to run only when opt-in is enabled.
3. Limit fixture and cleanup scope to data that you add.
4. Verify JDK/Maven compliance separately from database connectivity.
5. If tests are run after approval, record the command, exit result, and cleanup result separately.

## What to observe

- Separation between the dedicated database and shared/production databases
- Presence or absence of opt-in
- Difference between successful connection and successful tests
- Difference between skip and pass
- Whether cleanup is limited to only your additions

## Stop conditions

- Any of JDK/Maven, database owner, dedicated database, network, or restoration scope is unknown
- A shared/production database or production data is required
- A skip caused by missing opt-in would have to be treated as test success
- The cleanup scope cannot be limited

[← Back to the HC-035 main scenario](../README.md)
