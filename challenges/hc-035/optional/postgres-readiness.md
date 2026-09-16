# PostgreSQL readiness確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-035本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- JDK8、Maven 3.9系、DB opt-in条件、承認済み専用PostgreSQL、専用DB名、復元範囲を確認できること。

entitlements:

- 対象repositoryと専用PostgreSQLを利用する資格、DB所有者の許可、network/runner policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- DB所有者による専用instance/databaseの利用、接続、fixture、限定test、停止・cleanupを操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| dedicated-postgres | not-checked | 本編とRuntime v1はPostgreSQLのprovision、認証、接続、DB opt-in、test、cleanupを実行または観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- JDK/Maven適合、DB所有者許可、専用DB、network/runner、復元範囲のいずれかが不明な場合は停止します。
- 共有DB、実credential、未承認fixture、production dataが必要な場合は停止します。
- DB opt-inなしのskipをDB test成功として扱う必要がある場合は停止します。
- cleanupが自分の追加分だけに限定できない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

現在の公式Docsはrepository / organizationの **Agents secrets and variables** を案内し、旧GitHub Actions `copilot` environmentの値はrepository-level Agentsへ自動移行済みと説明します。このガイドは対象repositoryの移行済み・設定済み・資格ありを主張せず、secret値を読み、登録し、表示し、移動し、要求しません。
このガイドはPostgreSQLのprovision、接続、test、cleanup完了を提供しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
