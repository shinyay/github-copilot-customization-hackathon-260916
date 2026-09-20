# Copilot code review の setup を観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-035/optional/review-setup.md)

[← HC-035 のメインシナリオ](../README.md)

## 目的

Copilot code review の専用 setup と共有 setup のどちらが使われるかを、承認済みの小さなレビューで、範囲を限定して観測します。

## 前提

- Copilot code review、GitHub Actions、対象リポジトリを利用できる
- 対象 PR/head と、対応する Ubuntu ランナーを特定できる
- 専用 setup と共有 setup の候補リビジョン/生のバイト列を保存できる

## 権限と安全

- active setup の保存、レビューの要求、ランナーの利用、終了時の解除について事前承認を得ます。
- Cloud Agent のランナー対応を code review へ一般化しません。
- シークレットの値を読み、表示、登録、移動、要求しません。

## 手順

1. 対象 head と、専用/共有 setup の候補リビジョンおよびバイト列を記録します。
2. どちらを検証するか一つ選び、比較因子を増やしません。
3. 承認された setup を保存し、レビューを 1 回要求します。
4. 採用された setup のリビジョン、ランナー、各ステップを、直接確認できる範囲だけ記録します。
5. 実験後は自分が追加した setup だけを解除します。

## 観測すること

- 専用 setup と共有 setup の選択
- 採用されたリビジョンとレビューの head
- ランナーと各ステップ
- setup の成功/失敗とレビュー結果の違い
- Instructions の head 採用規則から setup ref を推測していないか

## 停止条件

- Copilot code review の利用資格、承認、対象 head、ランナー、setup のバイト列のいずれかが不明
- 専用/共有 setup の選択責任者が不明
- Cloud Agent の対応情報で不足を補う必要がある
- レビューの要求を無制限に繰り返す必要がある

[← HC-035 のメインシナリオへ戻る](../README.md)
