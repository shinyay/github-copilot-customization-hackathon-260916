# Review MCP確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-034本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象repository、PR/head、研修専用server、training-v1 raw bytes、共有利用者とreadOnlyHint表示範囲を確認できること。

entitlements:

- Copilot code review、対象repository、共有MCP設定を管理・利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 共有設定所有者による最小追加、review要求、研修toolの限定call、共有利用者への影響確認、終了時解除を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| standard-review-observation | not-checked | 本編とRuntime v1は標準reviewでのMCP採用、tool call、attribution、review結果を実行または観測しません。 |
| shared-mcp-configuration | not-checked | 本編とRuntime v1は共有MCP設定の所有権、保存、既定server保護、共有利用者への影響を観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- review資格、対象head、要求者、設定所有者、training-v1 bytesのいずれかが不明な場合は停止します。
- 共有利用者への影響または実review要求の承認がない場合は停止します。
- readOnlyHintを認可、ACL、無害性の保証として扱う必要がある場合は停止します。
- NOT_FOUNDと取得error、返却版不一致を区別できない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
