# Cloud sessionStart観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-038本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みCloud専用環境、default branchのactive Hook変更計画、Cloud Linux/bash、採用checkerの固定bytesと実行環境を確認できること。

entitlements:

- Copilot coding agent、対象repository、default branch、Actionsまたは必要な実行資源を利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- active Hook/script保存、session開始、実行資源・費用上限、ログ取得、停止・復元を操作ごとに別承認すること。

秘密、prompt全文、顧客データをログへ残さず、run.json手編集、branch制約の偽装、既存Hookの全消去を行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cloud-hook-observation | not-checked | 本編とRuntime v1はsessionStartの発火、checker実行、exit、Cloud環境、ログを観測しません。 |
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

blockedとnot-checkedを区別します。既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- checker版、Cloud Linux/bash、JDK等の実行前提、default branch、ログ取得範囲のいずれかが不明な場合は停止します。
- active Hook変更、session開始、実行資源・費用、停止・復元の個別承認がない場合は停止します。
- Cloud-created branchの観測を既存Runtime runへ束ねる必要がある場合は停止します。
- sessionStart成功を後続toolのpermission enforcementへ拡張する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、default branch、checker hash、宣言、呼出し、exit、ログ取得、unknown、blocked理由を分けます。sessionStart、後続tool、runtimeBehavior、educationalEffectは観測した範囲を超えて主張しません。
