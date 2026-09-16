# Organization Instructions観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-039本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象organization、適用surface、既存organization/repository Instructions本文、対象revision、復元範囲を確認できること。

entitlements:

- organization owner権限、対象repositoryと対応surfaceの利用資格、組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- organization Instructionsの保存・変更、限定観測、他利用者への影響、停止・復元を操作ごとに別承認すること。

実ownerを推測せず、ruleset、repository作成、profile操作、User設定への迂回、run.json手編集を行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| org-settings-observation | not-checked | 本編とRuntime v1はorganization Instructionsの保存、適用surface、repository Instructionsとの実効関係、他利用者への影響を観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではありません。

## Stop / Block

- organization owner、対象surface、既存本文、対象revision、復元範囲のいずれかが不明な場合は停止します。
- 他利用者へ影響する変更または限定観測の個別承認がない場合は停止します。
- repository Instructionsとの重複・優先関係を固定できない場合は停止します。
- 自分の変更だけを識別して復元できない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象organization、surface、現行本文、提案本文、revision、保存、提供、応答、他利用者影響、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
