# Code review で Skill を観測する

[← HC-033 のメインシナリオ](../README.md)

## 目的

review-focused task で、Copilot code review が Skill の description、body、resource を利用したかを限定的に観測します。HC-033 の CSV 再送 task と混ぜません。

## 前提

- Copilot code review と対象 repository を利用できる
- 対象 PR/head と review-focused task を特定できる
- Skill body/resource の revision と raw bytes を保存できる
- attribution の表示範囲を確認できる

## 権限と安全

- active Skill の保存、review 要求、再要求、終了時の解除について事前承認を得ます。
- Cloud Agent の記録を code review の観測として流用しません。
- private log、actor、source は共有時に redact します。

## 手順

1. 対象 head、Skill revision、body/resource hash を記録します。
2. review-focused な小さな diff を用意します。
3. 承認された 1 回の review を要求します。
4. attribution から直接確認できる description/body/resource の範囲を記録します。
5. 観測できない段階は `not-observed` とし、追加要求を繰り返しません。
6. 実験後は自分が追加した active Skill だけを解除します。

## 観測すること

- 対象 head と Skill revision の対応
- description、body、resource の各段階
- source へ戻れる review 根拠
- link や回答の類似だけに依存していないか

## 停止条件

- review 資格、対象 head、要求者、Skill bytes、観測範囲のいずれかが不明
- active 保存または review 要求の承認がない
- Cloud Agent の記録で不足を補う必要がある
- review 要求を無制限に繰り返す必要がある

[← HC-033 のメインシナリオへ戻る](../README.md)
