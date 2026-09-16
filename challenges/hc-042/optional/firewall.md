# Firewall経路観測の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-042本編](../README.md)とは別に、Bash、MCP、setupの経路差を将来観測する前の準備・停止境界だけを整理します。

ガイドの準備完了は、通信成功、安全性、認証、認可、live success、本編改善、Runtime completionを意味しません。

## Prerequisites

environment:

- 承認済みの専用環境、Bash / MCP / setupの対象経路、現行firewall方針、許可先、観測上限、復元責任者を確認できること。

entitlements:

- 対象Cloud / review環境、network policy、MCPまたはsetup経路を利用・管理する資格と組織policyを確認できること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 無害な限定経路の観測、許可先、回数・時間上限、ログ範囲、停止、復元を操作ごとに別承認すること。

firewallの無効化、迂回、任意endpoint probe、秘密送信、許可先の拡大を行いません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| network-route-observation | not-checked | 本編とRuntime v1はBash / MCP / setup経路の実通信、firewall適用、許可先、認証、認可、復元を観測しません。 |

Bash firewallの対象外を、接続成功、無制限許可、安全、認可済みへ読み替えません。

## Stop / Block

- firewallの無効化または迂回が必要な場合は停止します。
- 許可経路、許可先、回数・時間上限、ログ範囲のいずれかが不明な場合は停止します。
- 復元責任者または停止手順が不明な場合は停止します。
- MCP / setup対象外を成功または安全の証拠にする必要がある場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

route、Bash firewall scope、network結果、認証、認可、出力利用、復元、unknown、blocked理由を分けます。runtimeBehaviorとeducationalEffectは観測した範囲を超えて主張しません。
