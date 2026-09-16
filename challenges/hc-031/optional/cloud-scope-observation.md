# Cloud scope観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-031本編](../README.md)のscope/product設計とは別に、Cloud Agentで供給scopeを将来観測する前の準備境界だけを整理するガイドです。

実 `.github/instructions/**` 配置やCloud task作成はこのページでは行いません。

## Prerequisites

environment:

- 対象Cloud Agent、repository、開始branch、Java/XML task、4 main source、比較するInstructions原稿を確認できること。

entitlements:

- Cloud Agent、対象repository、model、repository Instructionsの利用資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- active Instructions配置、Cloud task、model利用、別branch作成、限定観測、終了時解除を操作ごとに別途承認すること。

`applyTo` をACLへ変えず、`excludeAgent` をsource access拒否として扱いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

active配置と実Instructions採用もnot-checkedですが、既知のbranch handoff blockerを先に解消しないまま実行へ進みません。

## Stop / Block

- Cloud機能、資格、対象revision、原稿bytesのいずれかが不明な場合は停止します。
- active配置、Cloud task、model、branch、観測の承認がない場合は停止します。
- 別branchから既存Runtime runへ正式にbindingを移せない場合は停止します。
- sourceを読めたことだけでInstructions供給成功を主張する必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

task、source、原稿hash、対象revision、予測、実観測、blocked理由を分けて記録します。runtimeBehaviorとeducationalEffectはnot-observedのままです。
