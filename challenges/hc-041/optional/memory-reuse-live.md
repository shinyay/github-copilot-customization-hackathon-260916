# Memory reuse観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-041本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象account、専用repository、現在branch、Cloudとreviewの独立した観測計画、自分の追加記録と残留・復元範囲を確認できること。

entitlements:

- GitHub Copilot Memory、Cloud、標準review、対象repositoryを利用する資格とuser単位設定の影響範囲を確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Memory設定・限定記録・Cloud/review試行・残留確認・自分の追加分だけの整理を操作ごとに別承認すること。

全Memory削除、新sessionを空対照とする操作、設定解除を削除とする扱い、他製品のMemory操作、run.json手編集を使いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| memory-reuse-observation | not-checked | 本編とRuntime v1はMemoryの保存、eligible、reuse、Cloud/reviewでの実利用、残留、retention、削除を観測しません。 |
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

blockedとnot-checkedを区別します。既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- 実記録または自分の追加分を識別できない場合は停止します。
- user全体の設定影響、対象repository/current branch、Cloud/reviewの独立観測を固定できない場合は停止します。
- 既存Memoryの全削除、識別不能な記録の削除、他製品の操作が必要な場合は停止します。
- Cloud-created branchの観測を既存Runtime runへ束ねる必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象repository/branch、fact/citation、設定範囲、保存候補、eligible、Cloud/reviewの使用Evidence、残留、retention、整理、unknown、blocked理由を分けます。新session、設定解除、応答文を保存・削除・reuseの証拠にせず、runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
