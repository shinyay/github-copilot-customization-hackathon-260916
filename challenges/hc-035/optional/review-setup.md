# Review setup確認の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-035本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象repository、PR/head、専用review setupとshared setupの候補、対応Ubuntu runner、採用refのEvidence範囲を確認できること。

entitlements:

- Copilot code review、GitHub Actions、対象repository、対応runner利用の資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 専用またはshared setupのactive保存、review要求、runner/Actions利用、限定観測、終了時解除を操作ごとに別途承認すること。

共有設定の全消去、履歴巻戻し、allow-all、run.json手編集、秘密値の回避策は使いません。整理対象は自分が追加した設定だけです。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| active-setup-workflow | not-checked | 本編とRuntime v1はreview専用/shared setupの保存、採用ref、runner実行、各stepを観測しません。 |
| standard-review-observation | not-checked | 本編とRuntime v1は標準review要求、setup利用、review結果を実行または観測しません。 |

blockedとnot-checkedを区別します。not-checkedの表示成功は実機成功ではなく、既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- review資格、承認、対象head、対応Ubuntu runner、setup bytesのいずれかが不明な場合は停止します。
- 専用/sharedの選択所有者または実review要求の承認がない場合は停止します。
- review instructionsのhead採用からsetup採用refを推測する必要がある場合は停止します。
- Cloud Windows対応をreview runner対応へ拡張する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

現在の公式Docsはrepository / organizationの **Agents secrets and variables** を案内し、旧GitHub Actions `copilot` environmentの値はrepository-level Agentsへ自動移行済みと説明します。このガイドは対象repositoryの移行済み・設定済み・資格ありを主張せず、secret値を読み、登録し、表示し、移動し、要求しません。

対象revision、承認scope、予測、観測手段、実観測、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectはnot-observedのままです。
