# Credential観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-042本編](../README.md)とは別に、credential値を見ない限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、credentialの存在、認証、認可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みの専用repository、Agents secrets / variablesの管理scope、対象consumer、観測する名称とpresenceだけの記録方法を確認できること。

entitlements:

- 対象repositoryまたはorganizationのAgents secrets / variablesを管理・利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 値を取得しないpresence観測、対象scope、consumer、記録、停止、復元を操作ごとに別承認すること。

credential値、値hash、raw log、送信先、別scopeのsecretを取得せず、redactionを取得許可として使いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| external-access-observation | not-checked | 本編とRuntime v1はAgents secrets / variablesの保存、presence、consumer、認証、認可、MCP出力利用を観測しません。 |

not-checkedの表示成功はcredentialの存在、認証、認可、外部アクセス成功ではありません。

## Stop / Block

- 追加承認がない、または値・値hashの取得が必要な場合は停止します。
- 保存scope、consumer、対象名称、記録範囲のいずれかが不明な場合は停止します。
- 実送信先、認可scope、復元責任者のいずれかが不明な場合は停止します。
- 別のsecret製品や個人credentialへ範囲を広げる必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象scope、名称、presence、consumer、認証、認可、出力利用、unknown、blocked理由を分けます。値を記録せず、runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
