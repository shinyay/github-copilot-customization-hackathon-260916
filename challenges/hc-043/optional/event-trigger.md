# Event trigger観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-043本編](../README.md)とは別に、限定eventでCloud Agents Automationを将来観測する前の準備・停止境界だけを整理します。

ガイドの準備完了は、automation登録、event発火、session起動、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みのprivate / internal repository、creator、限定event、固定head識別、読取task、出力先、停止担当、費用上限を確認できること。

entitlements:

- Cloud Agents Automations、対象repository、cloud / automation policy、Actions minutes、AI creditsを利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- automation登録、限定event、読取tools、session閲覧範囲、費用上限、停止、復元を操作ごとに別承認すること。

non-write actorの受理拡大、label更新、repository更新、review投稿、commit、pushを読取taskへ追加しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| automation-session-observation | not-checked | 本編とRuntime v1はautomation登録、event発火、actor eligibility、session起動、tool効果、visibility、billing、停止、再開を観測しません。 |

Cloud Agents Automations、standard code review ruleset、Copilot App scheduled workflowを一つの保存/API/runtime契約へまとめません。

## Stop / Block

- 課金主体、費用上限、停止責任者のいずれかが不明な場合は停止します。
- private / internal、creator権限、cloud / automation policy、session visibilityのいずれかが不明な場合は停止します。
- non-write actorの受理拡大または投稿・書込toolが必要な場合は停止します。
- 重複event、新head、停止依頼を識別できない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

creator、actor、event、head、read/write効果、configuration / session visibility、Actions minutes、AI credits、停止、再開、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
