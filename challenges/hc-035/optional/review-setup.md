# Code review setup を観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-035/optional/review-setup.md)

[← HC-035 のメインシナリオ](../README.md)

## 目的

Copilot code review の専用 setup と共有 setup のどちらが使われるかを、承認済みの小さな review で限定的に観測します。

## 前提

- Copilot code review、GitHub Actions、対象 repository を利用できる
- 対象 PR/head と対応 Ubuntu runner を特定できる
- 専用 setup と共有 setup の候補 revision/raw bytes を保存できる

## 権限と安全

- active setup の保存、review 要求、runner 利用、終了時の解除について事前承認を得ます。
- Cloud Agent の runner 対応を code review へ一般化しません。
- secret 値を読み、表示、登録、移動、要求しません。

## 手順

1. 対象 head、専用/共有 setup の候補 revision と bytes を記録します。
2. どちらを検証するか一つ選び、比較因子を増やしません。
3. 承認された setup を保存し、1 回の review を要求します。
4. 採用された setup revision、runner、各 step を直接確認できる範囲だけ記録します。
5. 実験後は自分が追加した setup だけを解除します。

## 観測すること

- 専用 setup と共有 setup の選択
- 採用 revision と review head
- runner と各 step
- setup success/failure と review result の違い
- Instructions の head 採用規則から setup ref を推測していないか

## 停止条件

- review 資格、承認、対象 head、runner、setup bytes のいずれかが不明
- 専用/共有 setup の選択責任者が不明
- Cloud Agent の対応情報で不足を補う必要がある
- review 要求を無制限に繰り返す必要がある

[← HC-035 のメインシナリオへ戻る](../README.md)
