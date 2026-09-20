# Copilot code review で Skill を観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-033/optional/review-skill.md)

[← HC-033 のメインシナリオ](../README.md)

## 目的

review-focused タスクで、Copilot code review が Skill の description、body、resource を利用したかを、範囲を限定して観測します。HC-033 の CSV 再送タスクとは分けて扱います。

## 前提

- Copilot code review と対象リポジトリを利用できる
- 対象 PR/head と review-focused タスクを特定できる
- Skill の本文/リソースのリビジョンと生のバイト列を保存できる
- attribution の表示範囲を確認できる

## 権限と安全

- active Skill の保存、レビューの要求、再要求、終了時の解除について事前承認を得ます。
- Cloud Agent の記録を code review の観測として流用しません。
- 非公開ログ、実行者、ソースは、共有時にマスキングします。

## 手順

1. 対象 head、Skill のリビジョン、本文/リソースのハッシュを記録します。
2. review-focused の小さな差分を用意します。
3. 承認を得たうえで、レビューを 1 回要求します。
4. attribution から直接確認できる description/body/resource の範囲を記録します。
5. 観測できない段階は `not-observed` とし、追加の要求を繰り返しません。
6. 実験後は自分が追加した active Skill だけを解除します。

## 観測すること

- 対象 head と Skill のリビジョンの対応
- description、body、resource の各段階
- ソースへ戻れるレビューの根拠
- リンクや回答の類似だけに依存していないか

## 停止条件

- Copilot code review の利用資格、対象 head、要求者、Skill のバイト列、観測範囲のいずれかが不明
- active Skill の保存またはレビューの要求について承認がない
- Cloud Agent の記録で不足を補う必要がある
- レビューの要求を無制限に繰り返す必要がある

[← HC-033 のメインシナリオへ戻る](../README.md)
