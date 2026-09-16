# Guide to separating Java text search from definition and reference lookup

**Language:** [日本語](../../../../challenges/hc-015/optional/language-tools.md) / **English**

[Back to the HC-015 main guide](../README.md)
## Purpose

For the fixed query `allocate`, separately observe text search and definition/reference resolution by the Java language service.
Manually supplying the full text does not reproduce the language service. Also treat a person's Go to Definition / Find All References actions
separately from results produced when the Agent uses Usages.

## Prerequisites

- You can use a separate workspace and new conversation from the HC-015 main guide.
- You can read source whose provenance is the public upstream template revision
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`
  in a runtime workspace created from the template.
- Do not compare the local `HEAD` of the runtime workspace with the upstream revision.
- The corresponding Java extension is already installed, and you can verify its initialization state and version.
- You can keep the same query, source, tabs, selection, model, and available tools.
- You can verify eligibility to use Copilot and the training source.

If the Java extension or JDK is unavailable, do not install it automatically for this guide.

## Permissions and safety

- Limit editor actions and the Agent's use of Usages to what the environment owner has authorized.
- Do not modify source files, existing extensions, User/Profile settings, or workspace settings.
- If additional source is required, verify its read permission separately.
- Candidate paths do not grant ACL permissions.
- Do not add index construction or settings changes to this guide.

## Procedure

1. Record the IDE, Java extension, extension host, workspace, and initialization display.
2. Open `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`.
3. Find `allocate` with ordinary text search and record the returned text locations.
4. Run Go to Definition on `OrderService.allocate` and record the returned path, symbol, and range.
5. Run Find All References and record the request and returned locations.
6. If the Agent uses Usages under separate approval, record whether definitions / references / implementations
   were returned, separately from the person's editor actions.
7. Do not decide from the line 333–349 anchor alone; read the necessary surrounding code and references.
8. Record the action of following the XML import from `application-context.xml` to `spring/module-operations.xml`
   separately from Java language service results.

## What to observe

- Text search query, target scope, and hit locations
- Java language service initialization state
- Paths, symbols, and ranges returned as definitions, references, or implementations
- Differences between human actions and Agent tools
- Requested location, returned location, and range actually read
- Why additional reading became necessary

The number of text hits is not a call count or execution result. Even if you can navigate to a definition, that does not verify
the actual Spring proxy, actual transaction, or Java/database behavior.

## Stop conditions

- The Java extension is unavailable, initialization does not complete, or the target language is unsupported.
- You cannot verify the returned range or tool type.
- Proceeding requires modifying source files, settings, extensions, or the index.
- Read access to separate source files is unknown.

Do not fill unobserved definition or reference locations with an empty array or zero results; stop and mark them unverifiable.
After stopping, you can still continue the HC-015 main guide within what text/file search can verify.

## How to interpret the result

The results of this guide are limited to the specific IDE, Java extension, version, and initialization state.
Do not generalize static location resolution to runtime calls, transactions, or educational effectiveness.

References:

- [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

[Back to the HC-015 main guide](../README.md)
