# Plugin lifecycle観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-040本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済み取得先と固定ref/version、対応client/Cloud、既存Skill/Plugin copy、自分の追加分、復元元hashを確認できること。

entitlements:

- Agent Plugins、対象repository/marketplace、install/enable/updateに必要な資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Plugin取得、install、enable、update、restore、Cloud試行、費用上限、終了時の整理を操作ごとに別承認すること。

架空marketplace、floating ref、User設定への迂回、追加component、run.json手編集、既存copyの全消去を使いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cloud-plugin-observation | not-checked | 本編とRuntime v1はPlugin取得、install、enable、active copy、selected version、Skill発見、本文投入、call、update、restoreを観測しません。 |
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

blockedとnot-checkedを区別します。既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- 架空marketplace、未知版、floating ref、未確認のclient/Cloud対応が必要な場合は停止します。
- 既存copyと自分の追加分を識別できない、または復元元hashを固定できない場合は停止します。
- install、enable、update、restore、Cloud試行の個別承認がない場合は停止します。
- Cloud-created branchの観測を既存Runtime runへ束ねる必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

取得先/ref、package hash、component inventory、install、enable、active copy、selected version、発見、call、update、restore、unknown、blocked理由を分けます。Agent Plugins 1.0形式や他clientの説明をCloudの実提供保証へ変換せず、runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
