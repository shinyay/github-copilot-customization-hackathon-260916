# Content exclusion観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-042本編](../README.md)とは別に、標準code reviewのcontent exclusionとInstructions `applyTo`を将来確認する前の準備・停止境界だけを整理します。

ガイドの準備完了は、除外の実効、回避許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象repository、標準code review surface、Instructions revision、content exclusionの管理scope、対象path、復元範囲を確認できること。

entitlements:

- 対象repository、標準code reviewのPublic Preview、content exclusionを利用・管理する資格と実効policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 除外設定を変更しない限定観測、対象surface / path、記録範囲、停止、必要な復元を操作ごとに別承認すること。

除外回避、別surfaceへの迂回、repository内容の持出し、Instructionsによる管理policy上書きを行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| review-exclusion-observation | not-checked | 本編とRuntime v1は標準code reviewのcontent exclusion、Public Preview資格、実効管理scope、Instructions applyToとの関係を観測しません。 |

Instructions `applyTo`とcontent exclusionを同じcontrolとして扱いません。

## Stop / Block

- Public Preview、利用資格、実効policy、管理scopeのいずれかが不明な場合は停止します。
- 除外回避または別surfaceへの迂回を要求される場合は停止します。
- 対象path、Instructions revision、復元範囲を固定できない場合は停止します。
- 管理者による除外と参加者の指示適用範囲を一つの成功値へまとめる必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

surface、Preview / entitlement、管理scope、対象path、Instructions applyTo、content exclusion、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
