# Cloud handoff観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-045本編](../README.md)とは別に、review指摘からCloud修正へ進む将来のhandoffについて準備・停止境界だけを整理します。

ガイドの準備条件が揃っても、Runtime v1のcross-branch handoffはblockedです。ガイドの閲覧は実送信、Cloud修正、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みのreview / Cloud専用環境、固定PR / branch / head、TaxAmountsだけのscope、独立期待値、返却packet、停止・復元計画を確認できること。

entitlements:

- Copilot code review、Cloud agent、対象repository / PR、必要な実行資源を利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- request送信、Cloud session、限定source変更、test、commit、push、返却、最終確認、停止、復元を操作ごとに別承認すること。

`.hackathon/run.json`編集、`branchSafe`偽装、post-hoc apply、allow-all、Money / CommonRulesTest変更、無承認のsend / commit / push / mergeを行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

準備条件を満たしてもblockedをnot-checkedやreadyへ弱めません。

## Stop / Block

- Runtime v1 runをCloud-created branchへ移す必要がある場合は停止します。
- review / Cloud双方の利用条件、対象branch / head / scope、独立期待値のいずれかが不明な場合は停止します。
- TaxAmounts.java以外の変更、run.json編集、branchSafe偽装、post-hoc apply、allow-allが必要な場合は停止します。
- request送信、source変更、test、commit、push、最終確認の個別承認がない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

finding、human assessment、draft、prepared、sent、accepted、applied、branch / head / scope、independent validation、final human confirmation、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
