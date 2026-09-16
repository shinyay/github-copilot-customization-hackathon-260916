# Credential presenceを限定観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-042/optional/credentials.md)

[HC-042本編へ戻る](../README.md)

## 目的

Agents secrets/variablesについて、値を見ずに名称、保存scope、consumer、presenceの観測可能範囲を確認します。credentialの存在、authentication、authorization、外部アクセス成功は別々に扱います。

## 前提

- 承認済みの専用repositoryまたはorganizationがある。
- 対象名称、保存scope、consumerを特定できる。
- Agents secrets/variablesを管理・利用する資格と組織policyを確認できる。
- 値を記録しない観察方法と復元担当が決まっている。

## 権限と安全

- presence観察、対象scope、consumer、記録範囲について個別の許可を得る。
- credential値、値hash、raw log、実送信先を取得しない。
- redaction表示を値取得の許可として扱わない。
- Actions、Codespaces、Dependabot等の別保存先へ範囲を広げない。

## 手順

1. 対象名称、repository/organization scope、consumer、ownerを記録する。
2. 値を開かない方法でpresenceを確認する。
3. presence、consumerへの提供、authentication、authorizationを別欄にする。
4. 必要なら無害な既存操作の結果を観察するが、秘密値や送信内容を記録しない。
5. 自分が変更した設定がある場合だけ、承認済み手順で復元する。

## 観察すること

- 名称と保存scope
- presenceの観測結果
- consumer
- authentication結果
- authorization結果
- output use
- unknownと観察不能の理由

## 停止条件

- 値または値hashの取得が必要。
- 保存scope、consumer、対象名称が不明。
- 実送信先、認可scope、復元責任者が不明。
- 個人credentialや別secret製品へ範囲を広げる必要がある。

## 本編へ戻る

結果は [HC-042の六層](../README.md#この機能とは) へ対応付け、presenceをauthentication/authorization成功へ変換しないでください。
