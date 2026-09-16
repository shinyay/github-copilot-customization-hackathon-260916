# Review Skill確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-033本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象repository、review-focused task、PR/head、Skill本文/resource bytes、観測するattribution範囲を確認できること。

entitlements:

- Copilot code review、対象repository、Skills利用の資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- review-focused Skillのactive保存、対象headへのreview要求、再review、限定観測、終了時解除を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| standard-review-observation | not-checked | 本編とRuntime v1は標準reviewでのSkill発見、本文/resource投入、attribution、review結果を実行または観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- review資格、対象head、要求者、Skill bytes、観測範囲のいずれかが不明な場合は停止します。
- active保存または実review要求の個別承認がない場合は停止します。
- Cloud taskの記録を標準reviewのEvidenceへ流用する必要がある場合は停止します。
- link、類似回答、attribution欠落からSkill利用を推測する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
