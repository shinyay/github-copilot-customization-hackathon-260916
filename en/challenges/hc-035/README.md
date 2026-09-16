# HC-035 Prepare without confusing instructions and the execution environment

**Language:** [日本語](../../../challenges/hc-035/README.md) / **English**

## Scenario

Writing "use JDK 8," "use Maven 3.9.x," or "do not exceed Java 7 APIs" in Instructions for an investigation of an old Java application is not evidence that those tools exist in the environment. Preparing tools in setup also does not guarantee compliance with source/API constraints or successful tests.

In this scenario, separate the responsibilities of Instructions, advance setup, version checks, tests, databases, and agent start. Do not start an actual workflow, Java, Maven, database, or Cloud Agent.

## What this feature is

**Instructions** communicate constraints, verification order, and stop conditions to the model. **Copilot setup steps** are a GitHub Actions-style configuration that prepares an ephemeral environment before Cloud Agent begins work.

At minimum, keep the following separate:

| Stage | What to verify | What that alone does not establish |
|---|---|---|
| instructions | JDK/Maven/API constraints, stop instructions | The tools are installed |
| setup definition | Job, steps, runner, permissions | Setup was adopted |
| setup step | Result of each step | The version met the requirement |
| version check | Versions of `java` / `mvn` | Dependencies or tests succeeded |
| tests | Command and exit result | Database tests also ran |
| DB | Opt-in, engine, dedicated database, connectivity | The entire unit test suite succeeded |
| agent start | Start after setup | Setup succeeded |

The Cloud Agent setup file is `.github/workflows/copilot-setup-steps.yml`, and the job name is `copilot-setup-steps`. The permitted job fields are `steps`, `permissions`, `runs-on`, `services`, `snapshot`, and `timeout-minutes`, with a timeout no greater than 59. If a setup step fails, Agent may still start after the remaining steps are skipped, so do not interpret a start as setup success.

## Good fit / Not a good fit

**Good fit**

- Separating the responsibilities of Instructions and environment preparation
- Verifying JDK, Maven, compiler, and API constraints individually
- Recording skips, remaining state, and agent start after setup failure
- Comparing preparation by the agent with advance preparation

**Not a good fit**

- Treating "use JDK 8" alone as evidence that it is installed
- Treating output from `mvn --version` alone as proof of compliance with `[3.9,4.0)`
- Treating `dependency:go-offline` as test success
- Treating agent start after setup failure as success
- Reading Animal Sniffer's `java17` as a JDK 17 specification
- Changing secrets, runners, firewalls, proxies, or TLS without authorization

## Goals

Read the constraints in the root `pom.xml` and create inactive drafts that assign responsibility for the following:

1. JDK `[1.8,1.9)`
2. Maven `[3.9,4.0)`
3. Compiler source/target `1.7`
4. Java 7 API checks with Animal Sniffer
5. Instructions, setup, version checks, dependency preparation, tests, databases, and agent start
6. Handoff after setup failure

## What you need

The fixed source is the root `pom.xml`.

`starter/` contains the fixed request, design worksheet, inactive Instructions/setup drafts, responsibility matrix, failure handoff, synthetic packets, and optional comparison worksheet.

Important:

- Compiler `1.7` does not specify using JDK 7.
- Animal Sniffer's signature `java17:1.0` is an artifact name for Java 7 APIs, not a JDK 17 specification.
- Secrets/variables are managed at the repository or organization level. In this main scenario, do not register, display, move, or request their values.

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation steps.

1. Read `starter/request.txt.template` and `pom.xml`.
2. Do not move `starter/customization/*.template` into active `.github/**`.
3. Assume an approved Ubuntu environment, while leaving the runner, network, and secrets unverified in the design.

## Try it

1. Classify the JDK, Maven, compiler, and API constraints in `starter/design.md.template`.
2. In `customization/instructions.md.template`, write the constraints, verification order, change prohibitions, and method for reporting unverified items.
3. Statically verify the following in `customization/copilot-setup-steps.yml.template`.
   - Job name `copilot-setup-steps`
   - Minimal permissions
   - A plan to prepare JDK 8
   - Separation between displaying the Maven version and checking its range
   - Separation between dependency preparation and tests
   - Timeout no greater than 59
   - Skips and remaining state after failure
4. In `responsibility.md.template`, separate the owner, observer, and stop decision for each stage.
5. In `failure-handoff.md.template`, record the failed step, exit result, remaining skipped steps, observed versions, incomplete steps, and agent start.
6. Diagnose `fixtures/packets.json.template` without elevating statuses in the packets to observations of an actual environment.

## Optional: Compare

Use `starter/worksheets/comparison.md.template` to perform a manual comparison of the following:

- **Baseline**: A plan in which Agent prepares and verifies the required tools
- **Customized**: A plan in which advance setup prepares the same constraints and passes the remaining state to Agent

Use the same task, POM, and runner/OS/network assumptions. Do not call either one an environment that has actually run.

## Verification points

- Did you separate the JDK, Maven, compiler, and API constraints?
- Did you avoid misreading `java17` as JDK 17?
- Did you separate version display from range compliance?
- Did you use separate fields for setup, tests, database, and agent start?
- Did you avoid treating dependency preparation as test success?
- After a required step failed, did you keep the setup outcome as failure?
- Did you avoid assuming secrets or runners were configured and available?

## Further exploration

- If Maven is outside the range, compare a plan to prepare an approved version with a plan to stop and hand off to a person
- Use the [Cloud setup supplementary guide](optional/cloud-setup.md) to prepare for actual observation of Cloud setup
- Use the [Review setup supplementary guide](optional/review-setup.md) to prepare for actual observation of code review setup
- Use the [PostgreSQL readiness supplementary guide](optional/postgres-readiness.md) for verification items for a dedicated PostgreSQL database

## Constraints, fallback, and safety

- Do not modify active workflows, the POM, Java, test or database settings, secrets, or repository/organization settings.
- Even if Cloud Agent, Actions, JDK, Maven, or a database is unavailable, you can complete the scenario by reading the POM and creating inactive design drafts.
- If setup storage, adoption, or execution, the runner, tests, database, or agent start cannot be verified, record them as `not-observed`.
- Do not use a self-hosted runner, switch to Windows, disable a firewall, relax TLS, or change a proxy as a fallback.
