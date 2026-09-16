# Approval観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-044本編](../README.md)とは別に、Copilot code reviewのApproveとrequired approval算入を将来観測する前の準備・停止境界だけを整理します。

ガイドの準備完了は、Approve有効化、算入、review request、merge可能、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みのpublic Preview対象repository、固定PR / head、changed files、required count、実効enterprise / organization / repository policyを確認できること。

entitlements:

- Copilot code review Approvals Public Preview、対象repository、通常review、設定・rulesetを確認する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 限定review request、Approve、算入観測、対象head、再試行上限、ログ範囲、停止、復元を操作ごとに別承認すること。

未承認の設定・ruleset変更、追加reviewer依頼、stale event再利用、mergeを行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| review-approval-observation | not-checked | 本編とRuntime v1はApprove permission、formal event、required approval算入、dismissal、all-files scope、実効policy、mergeabilityを観測しません。 |

assessment、formal event、count eligibility、approval requirement、mergeabilityを別々に扱います。

## Stop / Block

- Public Preview、利用資格、実効policy、対象head / all filesのいずれかが不明な場合は停止します。
- 未承認の設定またはruleset変更が必要な場合は停止します。
- 算入条件、eligible actor、required count、再試行上限のいずれかが不明な場合は停止します。
- approval evidenceだけからmerge可能を主張する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

assessment、review event、actor、head、stale / duplicate、count eligibility、all-files、required count、effective policy、other gates、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
