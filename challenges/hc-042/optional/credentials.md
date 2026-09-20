# Credential presence を限定的に観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-042/optional/credentials.md)

[HC-042本編へ戻る](../README.md)

## 目的

Agents secrets/variables について、値を見ずに、名前、保存範囲、利用元、presence を観測できる範囲を確認します。credential の存在、authentication、authorization、外部アクセスの成功は別々に扱います。

## 前提

- 承認済みの専用リポジトリまたは organization がある。
- 対象の名前、保存範囲、利用元を特定できる。
- Agents secrets/variables を管理・利用する資格と、組織のポリシーを確認できる。
- 値を記録しない観察方法と復元担当が決まっている。

## 権限と安全

- presence の観察、対象の scope、利用元、記録範囲について、個別の許可を得る。
- credential の値、値のハッシュ、未加工のログ、実際の送信先を取得しない。
- redaction表示を値取得の許可として扱わない。
- Actions、Codespaces、Dependabot などの別の保存先まで範囲を広げない。

## 手順

1. 対象の名前、リポジトリ / organization の scope、利用元、責任者を記録します。
2. 値を開かない方法で presence を確認します。
3. presence、利用元への提供、authentication、authorization を別の欄に記録します。
4. 必要であれば、無害な既存操作の結果を観察します。ただし、秘密値や送信内容は記録しません。
5. 自分が変更した設定がある場合に限り、承認済みの手順で復元します。

## 観察すること

- 名前と保存範囲
- presence の観測結果
- 利用元
- authentication の結果
- authorization の結果
- output use
- unknownと観察不能の理由

## 停止条件

- 値または値のハッシュを取得する必要がある。
- 保存範囲、利用元、対象の名前が不明。
- 実際の送信先、認可の scope、復元の責任者が不明。
- 個人の credential や、別のシークレット製品まで範囲を広げる必要がある。

## 本編へ戻る

結果を [HC-042の6つの層](../README.md#この機能とは) に対応付け、presence を authentication / authorization の成功と見なさないでください。
