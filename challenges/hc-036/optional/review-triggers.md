# Review trigger確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-036本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象repository、PR/head、review scope、個人/org/enterprise設定とruleset候補、event/actor/request/attemptの観測範囲を確認できること。

entitlements:

- Copilot code review、対象repository、rulesetまたは自動review設定を管理・利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 自動review設定またはruleset変更、合成でないPR event、review要求、head更新、発火/費用/回数上限、停止・復元を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| standard-review-observation | not-checked | 本編とRuntime v1は標準reviewのrequest、queue、attempt、completion、reviewed headを実行または観測しません。 |
| automatic-review-settings | not-checked | 本編とRuntime v1は個人/org/enterprise設定、ruleset、自動review eventの実効組合せを観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- repository管理者、review資格、対象scope/head、設定所有者のいずれかが不明な場合は停止します。
- 個人/org/enterprise設定の混入、複数ruleset、actor違いを分離できない場合は停止します。
- 発火/費用/回数上限または停止・復元の個別承認がない場合は停止します。
- レビューが起動しないため追加要求を無制限に繰り返す必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

扱う設計資料はSYNTHETIC_TRAINING_ONLYです。実PRや実利用者情報を合成Evidenceへ混ぜません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
