# Approval を限定的に観測する

**言語:** **日本語** / [English](../../../en/challenges/hc-044/optional/approvals.md)

[HC-044本編へ戻る](../README.md)

## 目的

承認済みの対象リポジトリで、positive assessment、formal Approve event、required approval への算入を限定的に観察します。approval requirement と mergeability も分けて記録し、設定の変更や merge は成功条件にしません。

## 前提

- 対象のリポジトリ、PR、current head、changed files を固定できる。
- required count と enterprise / organization / リポジトリの実効ポリシーを確認できる。
- Copilot code review Approvals の release state と利用資格を確認できる。
- 通常のレビュー権限、回数の上限、停止担当が決まっている。

## 権限と安全

- レビュー依頼、Approve の観察、費用、ログの範囲について、個別の許可を得る。
- 未承認の設定や ruleset の変更、追加の reviewer への依頼、merge を行わない。
- stale event や duplicate event を再利用しない。
- 非公開の PR 本文や個人情報を外部へ転記しない。

## 手順

1. current head、changed files、required count、effective policy、other gates を記録します。
2. Approve permission と count-toward-required-approvals の設定を別々に確認します。
3. 承認後に、限定したレビューを1回だけ依頼します。
4. assessment と formal review event を別々に記録します。
5. イベントごとに actor eligibility、target head、stale / duplicate、パスの対象範囲を確認します。
6. distinct eligible count と required count を比較します。
7. approval requirement と CI などの other gates を分け、mergeability は観察できた範囲だけを記録します。

## 観察すること

- assessment
- formal event ID / state
- actor、target head、stale / duplicate
- approve permission と count eligibility
- all-files coverage
- distinct eligible count と required count
- effective policy
- CI、conversation、deployment など

## 停止条件

- release state、利用資格、effective policy、current head / all files が不明。
- 未承認の設定や ruleset の変更が必要。
- eligible actor、required count、再試行の上限が不明。
- approval の根拠だけで merge 可能と主張する必要がある。

## 本編へ戻る

結果を [HC-044の確認ポイント](../README.md#確認ポイント) に対応付け、assessment、vote、requirement、mergeability を分けて記録します。
