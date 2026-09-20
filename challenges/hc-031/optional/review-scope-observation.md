# Copilot code review で Instructions の適用範囲を観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-031/optional/review-scope-observation.md)

[← HC-031 のメインシナリオ](../README.md)

## 目的

標準の Copilot code review で、Java、XML、mixed の各差分に対する Instructions の供給範囲を、範囲を限定して観測します。

## 前提

- Copilot code review と対象リポジトリを利用できる
- 対象 PR/head と、Java/XML/mixed の各差分を特定できる
- Instructions 原稿のリビジョンと生のバイト列を保存できる
- attribution の表示範囲を確認できる

## 権限と安全

- active Instructions の配置、レビューの要求、再要求、head の更新について事前承認を得ます。
- 非公開のレビュー記録、実行者、ソースは、共有時にマスキングします。
- レビューコメントへの返信を、新しいプロンプトや再レビューの代わりにしません。

## 手順

1. Java、XML、mixed の各差分と head SHA を記録します。
2. Instructions を置かない確認と、承認済みの原稿を置く確認を分けます。
3. 各 head に対してレビューを 1 回ずつ要求します。
4. attribution から直接確認できる原稿、パス、リビジョンだけを記録します。
5. 設計上の予測と実際の観測結果を、適用範囲のマトリクスで分けて記録します。

## 観測すること

- PR/head とタスクの対応
- 原稿のハッシュと attribution
- Java/XML/mixed での供給差
- `excludeAgent` が意図した製品除外
- 回答内容が似ているだけの推測をしていないか

## 停止条件

- Copilot code review の利用資格、承認、対象リビジョン、原稿のバイト列、attribution の範囲のいずれかが不明
- Java/XML/mixed の入力を同じ条件で用意できない
- reply、回答言語、ソースへのアクセスだけで供給を推測する必要がある
- レビューの要求を無制限に繰り返す必要がある

[← HC-031 のメインシナリオへ戻る](../README.md)
