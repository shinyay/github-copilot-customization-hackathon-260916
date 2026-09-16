# Cloud Agent で profile を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-032/optional/cloud-profile.md)

[← HC-032 のメインシナリオ](../README.md)

## 目的

承認済みの専用 repository で、Custom Agent profile の保存元、選択、版、effective tools、actual calls を限定的に観測します。

## 前提

- Cloud Agent と対象 repository を利用できる
- 開始 branch と profile の保存元 repository/ref/file を特定できる
- control と investigation profile の raw bytes を保存できる
- model、費用、試行回数の上限を決められる

## 権限と安全

- active profile の保存、選択、Cloud task、model 利用、終了時の解除について事前承認を得ます。
- role 本文を ACL とみなさず、危険な write/post command で制限を試しません。
- 自分が追加した profile だけを解除し、共有設定や履歴を消しません。

## 手順

1. profile の repository/ref/file、raw hash、display name を記録します。
2. control または investigation profile を明示的に選択します。
3. 同じ `approval-trace` request を使って 1 回だけ task を実行します。
4. selection、effective tools、actual calls を直接確認できる記録だけ転記します。
5. source 根拠、unknown、handoff の品質を確認します。
6. 実験後は自分が追加した active profile を解除します。

## 観測すること

- 保存された profile と選択された profile の一致
- declared tools と effective tools の差
- actual call の ID、tool、入力、結果
- role 本文の禁止事項と実権限の違い
- source 外の事実を発明していないか

## 停止条件

- 資格、承認、開始 branch、profile bytes のいずれかが不明
- model、費用、回数上限が決まっていない
- declared tools だけから effective tools や calls を推測する必要がある
- write/post 操作や共有設定の変更が必要になる

[← HC-032 のメインシナリオへ戻る](../README.md)
