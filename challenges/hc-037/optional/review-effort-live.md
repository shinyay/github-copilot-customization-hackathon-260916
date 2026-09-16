# 標準review effort観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-037本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みcandidate PR環境、固定diffと指示、base/head、既存自動reviewの残留、回数・費用・時間上限を確認できること。

entitlements:

- Copilot code reviewとLite/Balanced effortを対象repositoryで利用できる資格を確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- candidate変更、各review要求、費用・回数・時間上限、終了時の整理を実施前に個別承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、無制限の再要求は使いません。整理対象は自分が追加した候補PRと依頼だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| review-effort-observation | not-checked | 本編とRuntime v1は標準reviewの実effort、actor、内部model、finding、費用、agentic fallback、CI visibilityを観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではありません。

## Stop / Block

- diff、依頼全文、残留条件、base/head、実effort表示のいずれかを固定できない場合は停止します。
- 本編Packがsource mutationを許可しないままcandidate PR作成まで同じrunで行う必要がある場合は停止します。
- 回数・費用・時間上限またはreview要求の個別承認がない場合は停止します。
- 片側だけの結果をもう片側の0 findingsと比較する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、承認scope、requested/effective effort、actor、base/head、観測結果、unknown、blocked理由を分けます。実サービス、内部model、費用、agentic fallback、CI visibility、runtimeBehavior、educationalEffectは観測した範囲を超えて主張しません。
