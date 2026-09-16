# 共有profile観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-039本編](../README.md)とは別に、将来の限定観測へ進む前の準備・停止境界だけを整理します。

ガイドの準備完了は、実行許可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 対象organization/enterprise、governance repositoryと固定branch/ref、profile名、保存ACL、利用scope、Public Previewを確認できること。

entitlements:

- 対象organization/enterprise、governance repository、共有profileを保存・利用する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- profile保存・更新、限定利用、他利用者への影響、Cloud/review試行、停止・復元を操作ごとに別承認すること。

実人名、未知owner、追加tools、ruleset、repository作成、User設定への迂回、run.json手編集を使いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| shared-profile-observation | not-checked | 本編とRuntime v1は共有profileの保存ACL、利用scope、selected revision、発見、選択、本文投入、利用を観測しません。 |
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

blockedとnot-checkedを区別します。既知blockedが一件でもあれば全体はblockedです。

## Stop / Block

- 保存ACLと利用scopeを同一視する必要がある場合は停止します。
- governance repository、selected branch/ref/revision、owner、Public Preview、利用資格のいずれかが不明な場合は停止します。
- 管理policyと不整合、または自分の追加分だけを復元できない場合は停止します。
- Cloud-created branchの観測を既存Runtime runへ束ねる必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

保存repository/path、ACL、利用scope、profile名、dedup scope、selected branch/ref/revision、発見、利用、unknown、blocked理由を分けます。Public Preview資料を実利用や全client対応の証拠にせず、runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
