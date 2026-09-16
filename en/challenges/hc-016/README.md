# HC-016 Keep only useful memories and discard stale ones

**Language:** [日本語](../../../challenges/hc-016/README.md) / **English**

## Scenario

Every time responsibility for order-approval authorization is handed over, the new owner rereads the same two `require` methods. A short note would be useful, but retaining stale quotations, an overly broad scope, or information from another workspace can mislead the next owner.

In this exercise, you will not operate actual Memory. Instead, you will design both **an approach that returns to the source every time** and **an approach that selects and maintains note candidates with supporting evidence**. Concluding that there are zero candidates worth saving is also valid.

## What this feature is

Here, "memory" means a short repository fact that may be referenced in later work. Do not treat it as permanently correct knowledge; manage it together with its evidence, scope, verified revision, and revalidation conditions.

| Mechanism | Distinction in this exercise |
|---|---|
| Conversation | Context of the current interaction. It does not show that anything was saved persistently |
| Instructions | Human-authored rules for how they apply. Separate from managing the freshness of facts |
| VS Code local Memory | A local mechanism with User / Repository / Session scopes |
| GitHub Copilot Memory | A mechanism through which cloud agents, code review, CLI, and other surfaces handle repository facts |
| Memory in the Copilot App | A separate memory surface from the above. This exercise does not operate it |

Even a note such as "`BaseService.require` rejects a null actor" cannot be safely reused without the current source, target scope, and revalidation conditions. A response that says "I remembered it" alone does not verify saving, persistence, or reuse in another conversation.

References:

- [Use memory with agents in VS Code](https://code.visualstudio.com/docs/agents/run/memory)
- [About GitHub Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory)

## Good fit / Not a good fit

**Good fit**

- Designing short fact candidates that can be traced back to source, together with scope, quotations, and freshness
- Explaining information you will not save and information for which you will defer the decision
- Defining owners and triggers for updates, withdrawals, and revalidation
- Comparing stale notes or notes from a different scope with the current source

**Not a good fit**

- Collecting personal preferences, permissions of real people, secrets, or third-party information
- Guaranteeing that notes eliminate the need to read source
- Claiming that you have measured quality differences with Memory enabled and disabled
- Bulk-deleting existing memories or User settings to create comparison conditions

## Goals

Create a handoff plan that can explain:

1. Information to verify from source every time and information that can become a short note candidate
2. Decisions to retain, reject, or defer a candidate, and the scope of each decision
3. Evidence, freshness, revalidation triggers, and update/withdrawal methods
4. How to handle stale, overly broad, and unrelated candidates
5. A fallback that works without using actual Memory

## What you need

- An editor with access to GitHub Copilot Chat or an agent
- A way to edit Markdown and text
- Optional: A workspace where you can read the following Java source
  - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
  - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`
- The original scenario directory's `starter/`

Everything in `starter/` is provided as an inactive `.template`:

- [Fixed request](../../../challenges/hc-016/starter/request.txt.template)
- [Fixed fact](../../../challenges/hc-016/starter/materials/memory-fact.txt.template)
- [Four candidate cards](../../../challenges/hc-016/starter/materials/cards.md.template)
- [Source map](../../../challenges/hc-016/starter/materials/source-map.md.template)
- [Design worksheet](../../../challenges/hc-016/starter/worksheets/design.md.template)
- [Card-review worksheet](../../../challenges/hc-016/starter/worksheets/card-review.md.template)
- [Handoff draft](../../../challenges/hc-016/starter/worksheets/handoff.txt.template)

## Preparation

1. See [Getting started](../../README.md#getting-started) for repository-wide common preparation.
2. Leave the files in `starter/` with the `.template` suffix unchanged and create working copies in any work location.
3. If you can read the Java source, verify the two symbols in the source map.
4. If you cannot read the Java source, use the fixed fact as the finite input for this exercise. Do not add execution results or past design rationale.
5. Do not change Memory, User settings, or existing notes.

The fixed fact consists of these six lines.

```text
教材用の固定事実。対象はこの演習用repositoryだけであり、個人の好みではない。
BaseService.requireはactorがnullならauthentication.requiredを送出し、それ以外はActor.requireへ委譲する。
Actor.requireはADMINを許可し、そうでなければ指定されたroleのどれかを要求する。
根拠: wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java の require、
wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java の require。
これは固定ソースの読解であり、Java/DB実行や実際の利用者の権限を確認した結果ではない。
```

The candidate cards have the following roles.

| Card | Content |
|---|---|
| `card-p` | A candidate containing the current fixed fact and source references |
| `card-q` | An intentionally incorrect synthetic candidate that says a null actor is allowed |
| `card-r` | A synthetic candidate that gives the correct fact a broad User-wide scope |
| `card-s` | An unrelated candidate from another fictional workspace. Preserve `KEEP-UNCHANGED` |

## Try it

1. **Separate the reading paths**
   In the design worksheet, describe the differences among reading from source, manually providing the fixed fact, and referencing future Memory. Do not execute the third path in this exercise.
2. **Select candidates**
   For each card, record the claim, source support, scope, freshness, decision to retain/reject/defer, and revalidation trigger.
3. **Decide how to maintain candidates**
   Define update, withdrawal, and stop procedures for cases in which the source changes, a quotation does not support the claim, or the scope broadens. Do not use a full reset as a fallback.
4. **Create the handoff draft**
   Briefly summarize the candidate fact, source path and symbol, scope, revalidation trigger, owner, intentionally omitted information, and unverified items.
5. **Ask Copilot for a review**
   Provide the fixed request, fixed fact, cards, and completed worksheets. Ask only for a review that preserves evidence and unverified items, without operating actual Memory.
6. **Have a person return to the source and verify**
   Do not treat Copilot's proposal as the answer. Verify the claims in card-p / q / r and confirm that card-s is outside the target scope.

## Optional: Compare

Using the same fixed input in separate new conversations, you can manually compare:

- Approach A: Create no persistent note and verify from the source map every time
- Approach B: First read the selected inactive handoff draft, then revalidate only the necessary source locations

Compare how easy it is to return to source, the risk of retaining misinformation, scope narrowness, and the burden of revalidation and maintenance. If you cannot separate order effects or residual conversation context, do not declare one approach superior.

## Verification points

- You can explain the differences among conversations, Instructions, and each Memory surface
- The fact includes a source path, symbol, scope, and unverified items
- The retain/reject decision, including saving nothing, has a reason
- You compared card-q with the source and considered the scope of card-r
- You did not change or delete card-s for the convenience of this exercise
- You did not claim to have observed actual saving, persistence, or reuse in another conversation

## Further exploration

- [Exploration guide before trying VS Code local Memory](optional/local-memory.md)
- Create one new synthetic card and use exactly one of "the source changed," "the quotation does not support the claim," or "the scope broadened" as its revalidation trigger

## Constraints, fallback, and safety

- This exercise does not save, read, update, delete, or fully reset Memory.
- Do not make personal information, secrets, permissions of real people, or private logs into candidates.
- If you cannot read the Java source, you can complete the design using only the fixed fact and source map.
- Even if the client you are using does not support Memory, you can complete the exercise through candidate selection, scope, freshness, and maintenance design.
- If you cannot separate existing notes, safely revert only your candidate, or proceed without a full reset, do not continue to live operations.
- Clean up only working copies you created. Do not delete existing Memory, User settings, other people's notes, or source files.
