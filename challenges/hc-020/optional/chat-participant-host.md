# Chat ParticipantのHost準備

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-020本編](../README.md)と[extension-tool-host](extension-tool-host.md)とは別に、Chat Participant入口をDevelopment Hostで観測する準備ガイドです。Participant応答をTool conditionの得点へ合算しません。

同じanalyzerとfixed textを使い、ParticipantをTool、Custom Agent、Subagent、Agent Pluginの別名として扱いません。

## Prerequisites

environment:

- 承認済みDevelopment Host、独立したParticipant用開発folder、対応Chat入口、同じanalyzerとfixed textを確認できること。

entitlements:

- 対応するVS Code / Copilot、Extension Development Host、Chat Participant API、教材folderの通常利用資格と組織policyを確認できること。

Participant registration、`@`入口、prompt、stream応答、cancel、disposeを分けて観測できる必要があります。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 独立folderの作成 / materialization、Development Host起動、Participant call、cancel、終了時解除を対象限定で別途承認すること。

通常profileへのinstall、既存folder上書き、未知の追加model call、Tool結果との混入を行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| extension-development-host | blocked | Runtime v1本編は開発用folderのmaterialization、Development Host起動、extension lifecycleを許可しないためblockedです。 |
| chat-participant-observation | not-checked | Participantのregistration、Chat入口、prompt、stream、cancel、disposeは未観測です。 |

固定stream応答やAPI stubはlive Participant、LLM推論、Tool callのEvidenceではありません。

## Stop / Block

- Tool結果が混入する、未知の追加model callが発生する、client接続がない場合は停止します。
- 通常profileへのinstall、既存package上書き、Marketplace公開が必要なら停止します。
- 同じanalyzerを使えない、Participant ID / referenceを確認できない、cleanupできない場合は停止します。

Participant観測をToolのregistration、confirmation、selectionへ外挿しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

materialization、Host起動、registration、`@`入口、prompt、stream、result、cancel、dispose、cleanupを別に記録します。固定stream応答をLLM推論、Tool成功、semantic accuracy、教育効果へ昇格しません。
