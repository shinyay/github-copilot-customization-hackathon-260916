# Cloud Skill確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-033本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象Cloud Agent、承認済み専用repository、開始branch、Skill本文/resourceの保存元/ref/raw bytesを確認できること。

entitlements:

- Cloud Agent、対象repository、Skills利用、model利用の資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Skillのactive保存、Cloud task起動、本文/resourceの限定観測、model/費用上限、終了時解除を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |
| cloud-skill-observation | not-checked | 本編とRuntime v1はSkillの発見、本文投入、resource読取り、script実行をCloud Agentで観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- 資格、承認、開始branch、Skill本文/resource bytesのいずれかが不明な場合は停止します。
- resourceの安全レビューまたはscriptを起動しない初期scopeを維持できない場合は停止します。
- 別branchから既存Runtime runへbindingを移せない場合は停止します。
- linkだけから本文/resource読取りやscript実行を推測する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
