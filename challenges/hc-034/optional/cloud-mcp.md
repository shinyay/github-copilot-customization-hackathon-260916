# Cloud MCP確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-034本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 研修専用server、承認済み専用repository、開始branch、training-v1 raw bytes、placeholder解決案を確認できること。

entitlements:

- Cloud Agent、対象repository、共有MCP設定を管理・利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 共有設定所有者による最小追加、既定設定保護、server起動、Cloud task、限定call、費用上限、終了時解除を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |
| shared-mcp-configuration | not-checked | 本編とRuntime v1は共有MCP設定の保存、研修server起動、Cloud採用、tools/list、tools/callを実行または観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- 資格、承認、設定所有者、開始branch、training-v1 bytesのいずれかが不明な場合は停止します。
- 既定MCP設定を保護できない、secret不要の研修配置に限定できない、返却版が不一致の場合は停止します。
- 別branchから既存Runtime runへbindingを移せない場合は停止します。
- local protocol検査をCloud接続成功へ読み替える必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
