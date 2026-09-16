# 四機構ablationの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-024本編](../README.md)のInstructions×Skill四セルとは別に、Instructions / Skill / Custom Agent / MCPのfull構成から一つずつ外す比較を準備するガイドです。

五行はfullと各一除去であり、全16組合せではありません。本編PackはAgent/MCP条件や実行支援を提供しません。

## Prerequisites

environment:

- 対象Stable Local、独立workspace、同一source・operations note・requestを確認できること。

entitlements:

- 対象model、Custom Agent、承認済みread-only resourceの利用資格と組織policyを確認できること。

additionalApprovals:

- Agent選択、local server起動、server trust、resource添付、各runの停止・cleanupを個別に別途承認すること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Agent選択、local server起動、server trust、resource添付、各runの停止・cleanupを個別に別途承認すること。

MCPを外す行でも同じoperations note全文を通常fileとして残し、情報量を同じにします。resource添付はmodelがtoolを選びcallした証拠ではありません。

Agentの宣言toolsを実効toolsやOS権限と呼ばず、書込み、terminal、外部送信、通常profile変更を追加しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| four-component-ablation | not-checked | 本編Runtime v1 PackはAgent/MCP条件を提供せず、full＋各一除去の追加計画とconsumer検証が必要です。 |

ガイドの準備表示はPack適用、server起動、Agent選択、resource添付を行いません。

## Stop / Block

- 未承認server、trust、Agent選択、resource添付が必要なら停止します。
- MCPなしの行だけoperations noteの情報量が変わる場合は停止します。
- 実効toolsまたはmodelを揃えられない場合は停止します。
- resource添付を観測できない場合は停止します。
- 追加Packが提供されていない場合は実行へ進みません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

full / without-instructions / without-skill / without-agent / without-mcpの準備、同じnote供給、実効controls、未観測を別に記録します。五行から未実施の組合せ全体、一般的な因果性、製品効果を主張しません。
