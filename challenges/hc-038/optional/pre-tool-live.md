# Cloud preToolUse観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-038本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みCloud専用環境、default branchのactive Hook変更計画、固定checker、Cloud Linux/bash、無害な限定tool操作を確認できること。

entitlements:

- Copilot coding agent、対象repository、default branch、対象toolと必要な実行資源を利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- active Hook/script保存、無害な限定tool操作、実行資源・費用上限、ログ取得、停止・復元を操作ごとに別承認すること。

endpoint、firewall、secret、prompt全文log、破壊操作を追加せず、run.json手編集やbranch制約の偽装を行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cloud-hook-observation | not-checked | 本編とRuntime v1はpreToolUseの発火、checker実行、permissionDecision、通常permission flow、tool完了を観測しません。 |
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

blockedとnot-checkedを区別します。既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- checker版、default branch、Cloud Linux/bash、限定tool、permission観測範囲のいずれかが不明な場合は停止します。
- endpoint、firewall変更、秘密、prompt全文log、破壊操作が必要な場合は停止します。
- Cloud-created branchの観測を既存Runtime runへ束ねる必要がある場合は停止します。
- timeoutやHTTP failureを実tool完了またはcommand denyへ読み替える必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、checker hash、宣言、呼出し、transport、exit/response、permission field、通常flow、tool結果、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
