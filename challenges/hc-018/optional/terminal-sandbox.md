# terminal sandboxの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-018本編](../README.md)とは別に、Preview terminal sandboxの実行条件を確認する準備ガイドです。本編のManual比較、settings原稿、Runtime grantを変更しません。

対象候補はmacOS / Linux / WSL2の実行ホストです。Windows nativeは資料読解までにし、対応を推測しません。

## Prerequisites

environment:

- macOS / Linux / WSL2の実行ホスト、準備済み依存、分離workspace、開始前状態を確認できること。

entitlements:

- 対応するVS Code / Copilot、Preview機能、教材repository、実行ホストの通常利用資格と組織policyを確認できること。

owned dummy path以外へ触れず、固定された無害な一操作と復元方法を事前にレビューできる必要があります。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- terminal sandboxの有効化、通常承認、限定dummy操作、開始前状態確認と復元を対象限定で別途承認すること。

依存導入、elevation、保護解除、home / network probe、既存approval resetは承認対象に含めません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| terminal-sandbox | not-checked | Runtime v1ではterminal sandboxの有効化、実行ホスト、境界結果を確認していません。 |
| tracked-vscode-settings | blocked | Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings. |
| owned-boundary-probe | blocked | 本編Packはsandbox probe用pathや実行を許可しないため、この経路はblockedです。 |

設定原稿、EACCES packet、正常な`node --version`は実sandboxのEvidenceではありません。

## Stop / Block

- Windows native、依存導入、elevation、元の保護解除が必要なら停止します。
- owned dummy pathと復元を確認できない場合は停止します。
- 追跡不能settings、force-add、User/Profileへの迂回が必要なら停止します。

正常実行は拒否境界の証拠ではなく、一つの拒否を全filesystemや全toolへ外挿しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

文書確認、設定、承認、実行、OS結果、program結果、復元を別に記録します。実施しても限定dummy操作の一観測であり、全tool、network、home、他OS、教育効果を証明しません。
