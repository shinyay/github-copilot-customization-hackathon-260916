# HC-031 Tailor Instructions by Java, XML, and product

**Language:** [日本語](../../../challenges/hc-031/README.md) / **English**

## Scenario

Investigating order processing requires moving back and forth between Java control flow and XML wiring. Distributing Java rules broadly to XML creates noise, while distributing XML rules to all Java makes the maintenance scope unclear. In addition, deciding whether to deliver the same draft to Cloud Agent or code review is a separate design question from file scope.

## What this feature is

Path-specific Instructions express the paths to which they are supplied through `applyTo` in the frontmatter. `applyTo` defines the supply scope for Instructions; it is not an ACL that controls read/write permissions for files.

Use `excludeAgent` when excluding a draft from a particular product. The two valid values are:

- `code-review`
- `cloud-agent`

Product exclusion is a design that prevents a draft from being supplied to that product; it is not a denial of access to the target source.

## Good fit / Not a good fit

**Good fit**

- Maintaining different reading rules for Java and XML
- Distinguishing a core-only scope from out-of-scope web source
- Comparing only product metadata while keeping the body fixed
- Designing the order in which multiple drafts are supplied for a mixed task

**Not a good fit**

- Describing `applyTo` as a permission or sandbox
- Describing `excludeAgent` as a denial of source access
- Treating the consolidation of all rules into a broad glob as the only solution
- Calling a paper matrix an actual product adoption result

## Goals

Separate the path axis from the product axis and design the following:

1. Instructions for core Java
2. Instructions for core XML
3. A way to supply them to Java, XML, and mixed tasks
4. A scope that can exclude out-of-scope web Java
5. Supply to or exclusion from Cloud Agent and code review

## What you need

Fixed main source:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/resources/application-context.xml`
- `wholesale-core/src/main/resources/spring/module-operations.xml`
- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`

Supporting source for tracing the common guard:

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

`starter/` contains the fixed request, source map, design worksheet, inactive Java/XML customization drafts, scope/product matrices, delivery plan, and optional comparison worksheet.

Candidate patterns:

- `wholesale-core/src/main/java/**/*.java`
- `wholesale-core/src/main/resources/**/*.xml`

## Preparation

See [Getting started](../../README.md#getting-started) for the common preparation steps.

1. Read `starter/request.md.template` and `starter/source-map.md.template`.
2. Do not move `starter/customization/*.template` into active `.github/instructions/**`.
3. Before writing the Java and XML bodies, use `starter/design.md.template` to decide their purpose, out-of-scope paths, and product policy.

## Try it

1. Create Java reading rules that trace from `OrderService` to `BaseService` and `Actor`.
2. Create wiring-verification rules for the two XML files.
3. Fill in the respective bodies and `applyTo` values in `starter/customization/java-rules.md.template` and `xml-rules.md.template`.
4. Use `starter/scope-matrix.md.template` to determine which of the following three tasks apply or do not apply to the four main source files.
   - `java-reading`
   - `xml-reading`
   - `mixed-reading`
5. Use the 12 rows in `starter/product-matrix.md.template` to examine two drafts × two products × three metadata alternatives.
6. Record the draft order for the mixed task and the manual supply method in `starter/delivery-plan.md.template`.
7. Keep scope predictions, product predictions, and actual observations in separate fields.

## Optional: Compare

Use `starter/worksheets/comparison.md.template` to perform a short manual comparison of the following:

- **Baseline**: Only the fixed request
- **Customized**: A design that supplies the Java/XML bodies to their respective scopes
- **Manual-equivalent**: Manually supply the full text of the same bodies in the same order

Do not mix body changes and metadata changes in the same comparison, and leave fields not verified in an actual product as `not-checked`.

## Verification points

- Did you explain the reasons for the Java/XML bodies and scopes?
- Did you retain the four main source files and distinguish web Java from core Java?
- Did you avoid confusing `applyTo` with an ACL?
- Did you use `excludeAgent` and its two official values correctly?
- Did you avoid confusing the 9-row task/source table with the 12-row product table?
- Does the manually supplied body match the customization draft?
- Did you avoid treating successful source access alone as successful Instructions adoption?

## Further exploration

- Narrow the scope of either Java or XML only, then reassess the effects on the four source files and the product matrix
- Use the [Cloud scope supplementary guide](optional/cloud-scope-observation.md) to prepare to observe scope in Cloud Agent
- Use the [review scope supplementary guide](optional/review-scope-observation.md) to prepare to observe scope in code review

## Constraints, fallback, and safety

- Do not modify active `.github/instructions/**`, Java, XML, POM files, or repository settings.
- Even without using an actual Cloud Agent or code review, you can complete the scenario by reading source and designing the matrices.
- If Path-specific Instructions are unavailable, use the manual-equivalent and record automatic scope application as `unsupported` or `not-observed`.
- Do not proceed to actual observation if you cannot verify product availability, supported versions, or eligibility.
