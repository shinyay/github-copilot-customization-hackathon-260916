# HC-017 Choose a model and reasoning effort that fit the task

**Language:** [日本語](../../../challenges/hc-017/README.md) / **English**

## Scenario

When organizing a fixed analysis of order approval into a short table, deciding in advance that "a newer model is accurate" or "higher reasoning effort is safe" can cause you to overlook input differences, tool differences, and unsupported additions. Comparing different models is also a separate experiment from changing only Thinking Effort for the same model.

In this exercise, you will use only candidates already approved in your current environment and design a selection method that keeps the same seven lines, the same initial request, and the same follow-up. If there are not enough candidates, you can complete the exercise through design alone without running it.

## What this feature is

**Model selection** chooses the reasoning engine that processes the request; **Thinking Effort** is a reasoning setting within the same model where supported. If you change Instructions, tools, attached context, or the provider at the same time, you cannot attribute the difference to only the model or effort.

The requested model name, display name in the picker, display observable in the response, provider, and internal implementation ID are not necessarily the same. Leave unobservable values unknown. Because Auto may change routing for each request, do not use it for a controlled comparison.

Reference: [AI language models in VS Code](https://code.visualstudio.com/docs/agent-customization/language-models)

## Good fit / Not a good fit

**Good fit**

- Comparing model and effort as separate factors with the same fixed input
- Recording evidence retention, additions not present in the input, correction burden, and missing observations
- Explaining a decision not to switch models or not to use higher effort
- Stopping a comparison as incomparable when missing displays or residual context cannot be isolated

**Not a good fit**

- Changing Auto, the provider, credentials, or organizational policy to create candidates
- Treating effort labels from different models as the same amount of computation
- Proving accuracy from output length, a long visible reasoning trace, or a single good response
- Collecting complete internal reasoning, secret logs, or private code sent to an unapproved provider

## Goals

Create a selection and comparison method that:

1. Treats model differences and effort differences separately
2. Keeps the fixed input, requests, follow-up, tools, and context consistent
3. Separates requested values from observable displays and does not fill in unknown values
4. Has a person verify the six aspects of the fixed analysis
5. Defines stop conditions for too few candidates, insufficient display information, and configuration drift
6. Treats no switch or design-only completion as valid conclusions

## What you need

- An editor with access to GitHub Copilot Chat or an agent
- Model candidates approved in your current environment
- Optional: Two Thinking Effort values selectable for the same model
- The original scenario directory's `starter/`

Everything in `starter/` is provided as an inactive `.template`:

- [Fixed initial request](../../../challenges/hc-017/starter/request.txt.template)
- [Fixed seven lines](../../../challenges/hc-017/starter/materials/model-input.txt.template)
- [Fixed follow-up](../../../challenges/hc-017/starter/materials/follow-up.txt.template)
- [Source map](../../../challenges/hc-017/starter/materials/source-map.md.template)
- [Manual comparison protocol](../../../challenges/hc-017/starter/materials/comparison-protocol.md.template)
- [Design worksheet](../../../challenges/hc-017/starter/worksheets/design.md.template)
- [Controls worksheet](../../../challenges/hc-017/starter/worksheets/controls.md.template)
- [Response-review worksheet](../../../challenges/hc-017/starter/worksheets/responses.md.template)

## Preparation

1. See [Getting started](../../README.md#getting-started) for repository-wide common preparation.
2. Leave the files in `starter/` with the `.template` suffix unchanged and create working copies in any work location.
3. Verify the available models, effort values within the same model, and provider / effort information that can be displayed.
4. Decide which tools, Instructions, attached context, and approval method to keep fixed during the comparison.
5. If candidates or display information are insufficient, do not invent names or responses; switch to design-only completion.

The fixed analysis consists of these exact seven lines.

```text
この固定入力はモデル比較用の教材であり、前のラボの回答ではない。
確認したソース: OrderService.approve、BaseService.require、Actor.require、Checks.version。
静的に読めること: actorがnullなら拒否する。MANAGERまたはADMINが権限検査を通る。
expectedVersionが実際のversionと一致しなければ拒否する。状態はSUBMITTEDを要求する。
起票者本人による承認は禁止で、ADMINもこの業務条件を省略しない。
activeと与信の検査を通った後にAPPROVED、承認者、承認日時を設定する。
Java/DBは未実行。実環境の認証・transaction適用・過去の設計理由はこの入力では確定しない。
```

Initial request:

> Using only the complete fixed analysis, organize it into a table of conditions, behavior on rejection, and evidence / unverified items. Do not add business facts or execution results that are not in the input.

Follow-up:

> Compare it with the original fixed analysis and correct any omissions, additions not present in the input, or claims about unverified items. Do not add new business facts, and show what you corrected.

## Try it

1. **Record the preconditions**
   In the controls worksheet, record the requested model, display actually observed, provider, requested and observed effort, how adaptive appears, tools, Instructions, and attached context.
2. **Design the model comparison**
   For approved models A / B, keep the fixed seven lines, initial request, follow-up, tools, context, and effort conditions consistent to the extent possible.
3. **Design the effort comparison separately**
   With the same model E, same provider, same input, and same tools, change only the actually selectable effort e1 / e2. Do not reuse responses from the model comparison.
4. **Use new conversations**
   Start every trial in a new conversation. Do not provide responses, summaries, or evaluations from other trials. Keep the input order consistent.
5. **Run the fixed request**
   Only for feasible trials, provide the complete fixed seven lines and initial request. If necessary, use the fixed follow-up exactly once within the same trial, and save the initial and post-follow-up responses separately.
6. **Have a person verify six aspects**
   For actor / role, version / SUBMITTED, self-approval / ADMIN, active / credit, updated fields, and unverified items, record whether each was retained, omitted, added beyond the input, or needs correction.
7. **Decide whether to stop or adopt**
   Consider evidence retention, correction burden, missing observations, and observable time or usage. Do not infer complete internal reasoning or undisplayed token counts.

## Optional: Compare

Only when approved candidates and the necessary displays are available, compare them according to the [manual comparison protocol](../../../challenges/hc-017/starter/materials/comparison-protocol.md.template).

- Model comparison: Change only model A and B
- Effort comparison: Change only e1 and e2 with the same model E

These are separate comparisons. If the model, provider, adaptive setting, tools, or context changes unintentionally, do not treat the result as the effect of a single factor.

## Verification points

- You distinguish model selection from Thinking Effort
- You did not change the exact seven lines, initial request, or follow-up
- You separated the model comparison from the effort comparison
- You separated requested names, observed displays, the provider, and unknown values
- You returned to the original fixed analysis to verify the six aspects
- You did not exclude missing observations or fill them with Auto or synthetic responses
- You treat equivalent, worse, no addition needed, incomparable, and unobserved as valid conclusions

## Further exploration

- [Exploration guide for evaluating a BYOK provider](optional/byok-provider.md)
- [Exploration guide for observing a utility-model path](optional/utility-models.md)
- [Exploration guide for evaluating BYOK in Agent Host](optional/host-byok.md)
- Add one stop rule describing which observation would lead you not to switch the model or effort

## Constraints, fallback, and safety

- Do not change organizational policy, trust, the provider, API key, Custom Endpoint, or User settings.
- Do not send the fixed seven lines or private code to an unapproved provider.
- Do not fill blanks with Auto, fictional models, fictional effort values, or synthetic responses.
- Do not record complete internal reasoning, secrets, secret endpoints, or raw private transcripts.
- If two model candidates are unavailable, two effort values for the same model are unavailable, or you cannot verify the effective display, you can complete the exercise through design alone.
- If the model or provider drifts during comparison, preserve the result as a limited observation and do not claim a single-factor difference.
- At the end, revert only the model or effort selection you changed. Do not delete existing providers, credentials, or User settings.
