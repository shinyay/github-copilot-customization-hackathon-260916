# Cloud test提案の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-029本編](../README.md)の不活性な提案diffとは別に、実Cloud Agentで将来試す前の準備境界だけを整理するガイドです。

本編diffをapplyせず、別runやrun-state編集でCloud branchを既存runへ接続しません。

## Prerequisites

environment:

- 対象Cloud Agent、repository、開始branch、JDK8、Maven、Java 7互換条件、対象test pathを確認できること。

entitlements:

- Cloud Agent、対象repository、model、必要なcomputeの利用資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Cloud task作成、model利用、別branch作成、提案変更、test実行、費用を操作ごとに別途承認すること。

production、POM、既存test期待値の変更や、権限拡大をfallbackにしません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| cross-branch-handoff | blocked | Runtime v1 binds branchSafe:false runs to the named apply branch; cross-branch handoff is not supported. |

blockedはnot-checkedへ弱めません。正式なrun binding移行がない限り、Cloud-created branchを既存runの成功として扱いません。

## Stop / Block

- Cloud機能、資格、開始branch、JDK8またはMavenを確認できない場合は停止します。
- Cloud task、model、branch、変更、test、費用の承認がない場合は停止します。
- 別branchから既存Runtime runへ正式にbindingを移せない場合は停止します。
- run-state手編集、別run作成、既存期待値緩和が必要な場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

準備条件、承認、blocked理由、未実施testを記録します。proposal作成をCloud実行、compile/test成功、merge可能性の証拠にしません。
