# local Memoryを操作する前の準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-016本編](../README.md)から任意で読む準備ガイドです。本編の`baseline` / `curated-design`へ実Memory condition、保存結果、権限、設定を追加しません。

VS Code local Memory、GitHub Copilot Memory、Copilot Appの記憶は別の面です。このページは前者の将来観測に必要な条件を整理するだけで、Memoryのsave、read、update、delete、clearを実行しません。

## Prerequisites

environment:

- 対応Stable / Local / Preview tool、組織policy、専用scope、保存・限定更新と元状態確認を準備できること。

entitlements:

- 利用予定のVS Code Stable、GitHub Copilot、対象workspaceへの通常の利用資格と組織policyを確認できること。

既存記憶と今回のself-owned training noteを識別でき、開始前状態と終了後状態を比較できる必要があります。個別削除未対応を架空APIで補いません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 専用scopeへの保存、限定更新、元状態確認をそれぞれ対象を限定して別途承認すること。

全消去、既存User設定の削除、他人のnote変更、assistantの`store_memory`呼出しを教材の実行手順にしません。復元できない操作や既存状態を巻き込む操作は開始しません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| persistent-memory-lifecycle | blocked | Runtime v1はlocal storeのbinding / 復元を管理しないため、この経路はblockedです。 |
| tracked-vscode-settings | blocked | Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings. |

Runtime v1はMemory storeの内容、scope、持続、次会話での再参照、own-note-only復元を検証しません。本文hashや保存依頼への応答は、保存された証拠ではありません。

## Stop / Block

- 既存記憶を今回のnoteから分離できない場合は停止します。
- 自分のnoteだけを安全に戻せない場合は停止します。
- 全消去、既存User設定削除、個別削除を装う未確認APIが必要な場合は停止します。

blockedをUser/Profileへの迂回、force-add、別storeの利用で隠しません。本編はsourceと不活性原稿だけで完了できます。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

このページを読んだこと、原稿を作ったこと、実際に保存・読出し・更新・再参照したことを別に記録します。live観測を別承認で行った場合も、版、harness、scope、開始前状態、操作、復元確認、未確認を限定して残します。Memoryの品質、永続性、教育効果を本編の静的検査から主張しません。
