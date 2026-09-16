# stdio MCP sandboxの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-018本編](../README.md)と[terminal-sandbox](terminal-sandbox.md)とは別の、local stdio MCP sandbox readinessガイドです。terminal資料からWSL2対応や境界結果を転用しません。

対象候補はmacOS / Linuxのlocal stdioです。別transport、remote server、Windows対応を推測しません。

## Prerequisites

environment:

- macOS / Linux、local stdio、既存依存、分離workspace、review済みの限定serverとdummy操作を確認できること。

entitlements:

- 対応するVS Code / Copilot、MCP機能、server trust、教材repositoryの通常利用資格と組織policyを確認できること。

serverの起動方法、transport、sandbox設定、auto-approval挙動、開始前状態と復元方法を事前に確認します。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- local stdio serverのtrust / 起動、sandbox設定、auto-approval挙動の受入、限定dummy操作、復元を対象限定で別途承認すること。

新しいserver、依存、credential、remote transport、home / network probeを黙って追加しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| stdio-mcp-sandbox | not-checked | Runtime v1ではmacOS / Linux local stdio MCP sandbox、server起動、tool call、auto-approval挙動を確認していません。 |
| owned-boundary-probe | blocked | 本編PackはMCP sandbox probe用pathや実行を許可しないため、この経路はblockedです。 |

terminal sandboxの結果、合成packet、server設定のparseをMCP sandbox成功へ読み替えません。

## Stop / Block

- Windows、別transport、未review serverしか使えない場合は停止します。
- auto-approval挙動が許可条件と一致しない場合は停止します。
- credential、network、home、依存導入、probe path追加が必要なら停止します。

User設定や別serverへの迂回でblockedを隠しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

server trust、起動、sandbox、tool call、auto-approval、OS結果、program結果、復元を別に記録します。一つのstdio server観測をterminal、remote MCP、全tool、全OS、教育効果へ外挿しません。
