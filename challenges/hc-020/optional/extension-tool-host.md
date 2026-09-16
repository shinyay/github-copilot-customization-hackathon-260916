# Language Model ToolのHost準備

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-020本編](../README.md)のNode / stub契約とは別に、Language Model ToolをDevelopment Hostで観測する前の準備ガイドです。本編でfolder展開、install、F5起動を行いません。

同じanalyzerを使用し、別実装や通常profileへのinstallを作りません。

## Prerequisites

environment:

- 承認済みDevelopment Host、独立した開発用folder、対応API / client接続、同じanalyzerとfixed textを確認できること。

entitlements:

- 対応するVS Code / Copilot、Extension Development Host、Language Model Tool API、教材folderの通常利用資格と組織policyを確認できること。

selection、confirmation、call、cancel、disposeを一件ずつ観測でき、開始前状態と終了方法を記録できる必要があります。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 独立folderの作成 / materialization、Development Host起動、Tool selection、confirmation、call、cancel、終了時解除を対象限定で別途承認すること。

通常profileへのinstall、Marketplace公開、既存folder / package上書き、未知の追加model callを行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| extension-development-host | blocked | Runtime v1本編は開発用folderのmaterialization、Development Host起動、extension lifecycleを許可しないためblockedです。 |
| extension-tool-observation | not-checked | Toolのregistration、candidate selection、confirmation、call、cancel、disposeは未観測です。 |

Node結果やAPI stubはlive HostのEvidenceではありません。

## Stop / Block

- 通常profileへのinstall、既存package上書き、Marketplace公開が必要なら停止します。
- 対応API / client、Tool候補、登録名、confirmationを確認できない場合は停止します。
- 同じanalyzerを使えない、未知の追加model callが発生する、cleanupを確認できない場合は停止します。

将来のfolderでは`package.json.template`から`package.json`、`extension.cjs.template`から`extension.cjs`、同じ`analyzer.cjs.template`から`analyzer.cjs`を作り、`require('./analyzer.cjs')`を保ちます。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

materialization、Host起動、registration、selection、confirmation、call、result、cancel、dispose、cleanupを別に記録します。live観測があってもliteral counterのsemantic accuracy、source accuracy、教育効果を証明しません。
