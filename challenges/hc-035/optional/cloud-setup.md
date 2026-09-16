# Cloud setup確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-035本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みUbuntu環境、default branchのsetup草稿、採用候補ref、JDK8/Maven要件、準備stepを確認できること。

entitlements:

- Cloud Agent、GitHub Actions、対象repository、runner利用の資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- active setup workflow保存、検査用trigger、runner/Actions利用、Cloud task起動、準備処理、費用上限、終了時解除を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |
| active-setup-workflow | not-checked | 本編とRuntime v1はdefault branchのsetup保存、採用ref、runner実行、各step、失敗後のAgent開始を観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- 資格、承認、Ubuntu runner、default branch/ref、setup bytesのいずれかが不明な場合は停止します。
- 準備処理、Actions/runner費用、Cloud task、active保存の個別承認がない場合は停止します。
- 別branchから既存Runtime runへbindingを移せない場合は停止します。
- setup非0終了後のAgent開始をsetup成功へ読み替える必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

現在の公式Docsはrepository / organizationの **Agents secrets and variables** を案内し、旧GitHub Actions `copilot` environmentの値はrepository-level Agentsへ自動移行済みと説明します。このガイドは対象repositoryの移行済み・設定済み・資格ありを主張せず、secret値を読み、登録し、表示し、移動し、要求しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
