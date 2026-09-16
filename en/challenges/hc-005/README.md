# HC-005 Organize personal, team, and task instructions

**Language:** [日本語](../../../challenges/hc-005/README.md) / **English**

## Scenario

In the fictional "Haruka maintenance team," preferences about readability, team-agreed documentation conventions, and a request that applies only today are mixed together in one long memo. If it is reused as-is, it is unclear who each sentence is intended for, who decides whether to change it, and when it should be reviewed.

In this scenario, you will organize the same eight synthetic cards for two situations: a "morning handoff" and a "shared document with another team." Rather than mechanically sorting them under the labels personal, team, and task, you will design decisions and reasons for keeping, splitting, communicating only for this task, deferring, or not adding each item.

## What this feature is

Custom instructions are a mechanism for maintaining, as text, policies that you want to communicate repeatedly to GitHub Copilot. Here, scope means the range of "whose work, and which work, you want them delivered to."

- **Personal instructions**: Candidates for carrying your own reading and work preferences across multiple tasks
- **Team instructions**: Candidates maintained jointly by people who have agreed to them. Repository and organization scopes differ in audience, approval, and supported products
- **Task requests**: Information needed only for that task, such as the current audience, purpose, deadline, and output format

Treat the storage location, the owner of changes, and the entry point through which Copilot actually reads the instructions as separate considerations. Do not assume that a broader scope always takes precedence or that multiple instructions are always combined in the same order.

There are also purpose-specific settings for reviewing a selection, generating a commit message, and generating a pull request description. These are separate entry points from a one-time request in regular Chat. This scenario only drafts the syntax; it does not enable the settings or verify their behavior.

References:

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [GitHub Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions)

## Good fit / Not a good fit

**Good fit**

- Before writing the same explanation repeatedly, organize whose agreement it represents and how broadly it should be reused
- Separate personal preferences from business rules that require agreement
- Design instructions that include the owner, exclusions, expiration, and removal conditions
- Compare the convenience of making something persistent with the risks of unintended inclusion in other work and duplicated maintenance

**Not a good fit**

- Deciding a single correct answer or precedence from the scope name alone
- Always adding a settings file even for a one-time request
- Treating the saved draft as proof that Copilot discovered it, injected its contents, or improved quality
- Rewriting existing User, HOME, organization, or workspace settings

## Goals

1. Consider every item from R01 through R08 and explain its audience, exclusions, owner, reuse conditions, and review point.
2. Create short drafts for each audience using only the fixed materials for S1 and S2.
3. After the initial draft, state the scope policy explicitly and review the draft again from the same input.
4. Preserve the necessary instruction text and either one purpose-specific settings draft or a reason not to add one, all in an inactive form.
5. Do not confuse a saved design with evidence that the product actually used it.

## What you need

- An editor that can edit Markdown and JSON
- Optionally, Git
- You do not need to start AI, Java, Maven, a database, or an application

All people, teams, situations, statements, and materials are **SYNTHETIC_TRAINING_ONLY** synthetic training materials. Keep the originals in `starter/` with their `.template` suffixes and write only to working copies.

| Material | Purpose |
| --- | --- |
| [cards.md.template](../../../challenges/hc-005/starter/cards.md.template) | Full text of statements R01 through R08 |
| [situations.md.template](../../../challenges/hc-005/starter/situations.md.template) | Audiences, fixed materials, and fixed tasks for S1 and S2 |
| [request.txt.template](../../../challenges/hc-005/starter/request.txt.template) | Request shared by the two drafts |
| [classification.md.template](../../../challenges/hc-005/starter/classification.md.template) | Classification sheet for the cards and each situation |
| [policy.md.template](../../../challenges/hc-005/starter/policy.md.template) | Policy sheet for scope, ownership, reuse, and review |
| [instruction-drafts.md.template](../../../challenges/hc-005/starter/instruction-drafts.md.template) | Drafts of inactive instruction text |
| [generation-settings.json.template](../../../challenges/hc-005/starter/generation-settings.json.template) | Inactive syntax examples for purpose-specific setting keys |
| [comparison.md.template](../../../challenges/hc-005/starter/comparison.md.template) | Worksheet comparing the initial and reviewed drafts |

## Preparation

1. Review the [common getting started steps](../../README.md#getting-started).
2. Read `starter/cards.md.template`, `starter/situations.md.template`, and
   `starter/request.txt.template` through to the end.
3. Before comparing, choose at least two evaluation criteria. Examples:
   - Risk that the text reaches readers outside the intended audience
   - Whether the owner to consult about changes is clear
   - Number of places where the same text must be updated
   - How easy it is to explain expiration and exceptions
4. Make two copies of the classification sheet and label them "Initial draft" and "After policy review."
5. Keep the original and completed drafts separately, and do not overwrite the initial draft while creating the later one.

## Try it

### 1. Create the initial draft

1. Fill in every item from R01 through R08 in a working copy of `starter/classification.md.template`.
2. For each card, you may choose to keep it, split it, communicate it only for this task, defer it, or reject it.
3. Record not only the scope name but also the exclusions, owner, expiration, and unresolved questions.
4. Create a morning handoff draft using only S1-M1 through S1-M3, and an introduction for the shared document using only S2-M1 through S2-M4.
5. Save the initial draft and do not replace its contents later.

### 2. Create a policy and review the draft

1. In a copy of `starter/policy.md.template`, write the following in your own words.
   - Criteria for separating personal preferences, agreements within a team, and the current request
   - Audience and exclusions
   - Owner, people whose agreement is required, and review point
   - Conditions under which a person must be consulted when instructions conflict
   - Criteria for not making an item persistent or for deferring it
2. Using the same cards, situations, and fixed request, fill in the second classification sheet.
3. In a copy of `starter/instruction-drafts.md.template`, write only the text that is necessary.
   You do not have to create all three categories of personal, team, and task instructions.
4. If you draft a purpose-specific setting, choose exactly one of the following and add
   `{"text": "自分で設計した本文"}` to a working copy of
   `starter/generation-settings.json.template`. Delete unused keys.
   If you do not add one, record `{}` and the reason.
   - `github.copilot.chat.reviewSelection.instructions`
   - `github.copilot.chat.commitMessageGeneration.instructions`
   - `github.copilot.chat.pullRequestDescriptionGeneration.instructions`
5. Keep everything as an inactive draft. Do not copy it into `.github`, `.vscode`, User, HOME, or organization settings.

## Optional: Compare

Use `starter/comparison.md.template` to compare the initial draft manually with the draft created after the policy review.

- Do not change the full text of R01 through R08 and S1 and S2, or the evaluation criteria
- Place the handling of the same cards, the short drafts, the update locations, and unresolved questions side by side
- Record carryover caused by the same person rereading the materials
- If the result is more organized, it can be "improved"; if no change was needed, "equivalent"; and if exceptions or effort increased, "worse"

This is not an unseen A/B test or a measurement of Copilot output quality or educational effect.

## Verification points

- Did you consider every item from R01 through R08 and cover both S1 and S2?
- Can you explain personal preferences, team agreements, and one-time requests by their reasons and owners?
- Did you avoid treating an unapproved proposal as an already shared rule?
- Did you consider both the benefit of reusing the same text and the risk that it could be mixed into work for a different audience?
- Do decisions to split, defer, or add nothing also have conditions for review?
- Did you distinguish saving a draft from product discovery, content injection, invocation, and output?

## Further exploration

- [Verify the storage sources and isolation of User instructions](optional/user-scope.md)
- [Run a small test of an entry point for purpose-specific generation](optional/task-generation.md)
- [Verify approval and supported scope for organization instructions](optional/organization-scope.md)
- Without changing the S1 and S2 drafts, consider the trade-off between sharing and duplication when the same text must be updated in two places

## Constraints, fallback, and safety

- Use only synthetic training materials. Do not introduce real people, teams, organizations, or existing settings.
- Do not create active repository customization, User instructions, or organization instructions.
- Even without AI or the target product, you can complete the classification, policy, short drafts, and inactive drafts in an editor or on paper.
- If you cannot test a purpose-specific setting on the actual product, you can still complete the scenario with a syntax draft or a reason not to add one.
- Do not overwrite existing settings, change ignore rules, force-add files, commit, push, or publish anything.
- If you did not observe product discovery, content injection, or output, record those stages as unverified.
