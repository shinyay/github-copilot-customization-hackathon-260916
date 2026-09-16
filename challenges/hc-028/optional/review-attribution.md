# 標準review attributionの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-028本編](../README.md)の合成ref監査とは別に、標準reviewで版attributionを観測する前の準備だけを整理するガイドです。

review要求、PR操作、再reviewはこのガイドでは実行しません。

## Prerequisites

environment:

- 対象repository、PR、現在head、actor、review設定、再review手順、表示されるsession/logの範囲を確認できること。

entitlements:

- Copilot code review、対象repository、PR、必要なmodelと組織policyの利用資格を確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 対象PRへのreview要求、再review、head更新、attribution閲覧を操作ごとに別途承認すること。

別PRや古いheadの記録を現在のrunへ流用せず、actorやprivate logを公開Evidenceへ無加工で貼りません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| review-attribution-observation | not-checked | 本編とRuntime v1は実review、対象head、session attribution、Instructions版の直接観測を実行しません。 |

attribution表示の存在だけでInstructions版まで特定できたとは扱いません。

## Stop / Block

- 資格、repository設定、actor、対象PR/headのいずれかが不明な場合は停止します。
- review要求または再reviewの承認がない場合は停止します。
- 表示されるattributionが対象fileや版を直接示さない場合は未観測で停止します。
- old head、別run、自己申告だけで版を補う必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象head、request時点、actor、表示されたrevision範囲、unknownを別に記録します。実Instructions版を特定できなければnot-observedのままです。
