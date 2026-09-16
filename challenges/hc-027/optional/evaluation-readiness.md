# 外部評価の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-027本編](../README.md)の合成18行とは別に、外部評価toolやserviceを検討する前の確認項目だけを整理するガイドです。

名称や古い教材の記述からcommand、availability、課金条件を推測しません。

## Prerequisites

environment:

- 対象publisher、対応version、binary取得元、独立環境、送信対象を確認できること。

entitlements:

- 外部評価機能、認証、対象model、必要なserviceの利用資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- binary取得、install、login、外部送信、model利用、課金上限を操作ごとに別途承認すること。

private prompt、source、token、個人情報を無承認で外部へ送信しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| external-evaluation | not-checked | Runtime v1と本編Packは外部評価binary、認証、model実行、送信、課金を提供または観測しません。 |

合成trialの解析を外部serviceの実行成功と呼びません。

## Stop / Block

- publisher、version、binary取得元のいずれかが不明な場合は停止します。
- install、login、外部送信、model利用、課金の承認がない場合は停止します。
- 送信対象からprivate dataを除外できない場合は停止します。
- 対応commandやavailabilityを一次資料で確認できない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

確認済みのversion、publisher、送信範囲、費用上限と、未確認・未実施を記録します。合成18行を実model評価や教育効果へ昇格させません。
