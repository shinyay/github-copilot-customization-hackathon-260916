# Approvalを限定観測する

**Language:** **日本語** / [English](../../../en/challenges/hc-044/optional/approvals.md)

[HC-044本編へ戻る](../README.md)

## 目的

承認済みの対象repositoryで、positive assessment、formal Approve event、required approvalへの算入、approval requirement、mergeabilityを限定的に観察します。設定変更やmergeを成功条件にしません。

## 前提

- 対象repository、PR、current head、changed filesを固定できる。
- required countとenterprise/organization/repositoryの実効policyを確認できる。
- Copilot code review Approvalsのrelease stateと利用資格を確認できる。
- 通常review権限、回数上限、停止担当が決まっている。

## 権限と安全

- review request、Approve観察、費用、ログ範囲について個別の許可を得る。
- 未承認の設定・ruleset変更、追加reviewer依頼、mergeを行わない。
- stale eventやduplicate eventを再利用しない。
- private PR本文や個人情報を外部へ転記しない。

## 手順

1. current head、changed files、required count、effective policy、other gatesを記録する。
2. Approve permissionとcount-toward-required-approvals設定を別々に確認する。
3. 承認後に限定reviewを一回だけ依頼する。
4. assessmentとformal review eventを別々に記録する。
5. eventごとにactor eligibility、target head、stale/duplicate、path coverageを確認する。
6. distinct eligible countとrequired countを比較する。
7. approval requirementとCI等のother gatesを分け、mergeabilityは観察できた範囲だけ記録する。

## 観察すること

- assessment
- formal event ID/state
- actor、target head、stale/duplicate
- approve permissionとcount eligibility
- all-files coverage
- distinct eligible countとrequired count
- effective policy
- CI、conversation、deployment等

## 停止条件

- release state、利用資格、effective policy、current head/all filesが不明。
- 未承認の設定・ruleset変更が必要。
- eligible actor、required count、再試行上限が不明。
- approval Evidenceだけでmerge可能を主張する必要がある。

## 本編へ戻る

結果は [HC-044の確認ポイント](../README.md#確認ポイント) へ戻し、assessment、vote、requirement、mergeabilityを分離します。
