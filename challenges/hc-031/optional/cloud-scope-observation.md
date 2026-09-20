# Cloud Agent で Instructions の適用範囲を観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-031/optional/cloud-scope-observation.md)

[← HC-031 のメインシナリオ](../README.md)

## 目的

Java、XML、mixed の各タスクで、Cloud Agent にどの Instructions が供給されたかを、範囲を限定して観測します。`applyTo` をアクセス制御として試す手順ではありません。

## 前提

- Cloud Agent と対象リポジトリを利用できる
- 開始ブランチ、対象リビジョン、4 つの主なソースを特定できる
- 比較する Java/XML 原稿の生のバイト列を保存できる
- Java、XML、mixed の各タスクを同じ条件で用意できる

## 権限と安全

- active Instructions の配置、Cloud Agent のタスク、モデル、ブランチ、費用、終了時の解除について事前承認を得ます。
- `applyTo` を ACL とみなさず、`excludeAgent` をソースへのアクセス拒否として扱いません。
- 自分が追加した設定だけを解除し、共有設定や履歴を消しません。

## 手順

1. 対象リビジョンと Java/XML 原稿のハッシュを記録します。
2. Java、XML、mixed の 3 つのタスクと固定依頼を準備します。
3. 承認された範囲で active Instructions を配置します。
4. 各タスクを別々の会話で実行します。
5. attribution や利用記録から直接確認できる供給範囲だけを記録します。
6. 実験後は自分が追加した active Instructions を解除します。

## 観測すること

- タスクと対象パス
- Java/XML 原稿のリビジョンとハッシュ
- 供給されたと直接確認できる原稿
- `excludeAgent` の予測と実際の観測結果
- ソースを読めたという事実と、Instructions が供給されたという事実の違い

## 停止条件

- 利用資格、承認、対象リビジョン、原稿のバイト列のいずれかが不明
- 3 つのタスクの入力を公平にそろえられない
- ソースへのアクセスだけから Instructions の供給を推測する必要がある
- 既存設定を削除または広く変更しないと続行できない

[← HC-031 のメインシナリオへ戻る](../README.md)
