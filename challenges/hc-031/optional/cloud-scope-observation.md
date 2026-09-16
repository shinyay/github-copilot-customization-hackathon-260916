# Cloud Agent で Instructions scope を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-031/optional/cloud-scope-observation.md)

[← HC-031 のメインシナリオ](../README.md)

## 目的

Java、XML、mixed task で、Cloud Agent にどの Instructions が供給されたかを限定的に観測します。`applyTo` を access control として試す手順ではありません。

## 前提

- Cloud Agent と対象 repository を利用できる
- 開始 branch、対象 revision、4 つの main source を特定できる
- 比較する Java/XML 原稿の raw bytes を保存できる
- Java、XML、mixed の task を同じ条件で用意できる

## 権限と安全

- active Instructions の配置、Cloud task、model、branch、費用、終了時の解除について事前承認を得ます。
- `applyTo` を ACL に変えず、`excludeAgent` を source access 拒否として扱いません。
- 自分が追加した設定だけを解除し、共有設定や履歴を消しません。

## 手順

1. 対象 revision と Java/XML 原稿の hash を記録します。
2. Java、XML、mixed の 3 task と固定 request を準備します。
3. 承認された範囲で active Instructions を配置します。
4. 各 task を独立した conversation で実行します。
5. attribution や利用記録から直接確認できる供給範囲だけを記録します。
6. 実験後は自分が追加した active Instructions を解除します。

## 観測すること

- task と対象 path
- Java/XML 原稿の revision と hash
- 供給されたと直接確認できる原稿
- `excludeAgent` の予測と実観測
- source を読めた事実と Instructions 供給の違い

## 停止条件

- 資格、承認、対象 revision、原稿 bytes のいずれかが不明
- 3 task の入力を公平にそろえられない
- source access だけから Instructions 供給を推測する必要がある
- 既存設定を削除または広く変更しないと続行できない

[← HC-031 のメインシナリオへ戻る](../README.md)
