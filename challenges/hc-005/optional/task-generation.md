# 用途別生成の入口とRuntime制約を確認する

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved

このページは、review・commit message・PR descriptionの生成設定についての任意の準備確認です。[HC-005本編](../README.md) の設定草稿は不活性な設計物であり、このガイドを読んでも有効化されません。本編の提出に生成UI、追加の拡張、commitや投稿は必要ありません。

通常のworkspace設定を追跡する試行は、Runtime v1の既知の制約でblockedです。実機用Packや追加conditionを提供しているガイドではありません。

## Prerequisites

### environment

- 対象のVS Code版とreview・commit message・PR descriptionの生成入口を特定できること。
- 通常のworkspace設定を追跡する試行には、別途承認されたRuntimeの対応が必要である。

### entitlements

- 選んだ生成入口の利用資格と必要な拡張の有無を本人が確認すること。

環境と利用資格はnot-checkedです。生成入口は用途ごとに異なり、通常Chatが使えるだけでは条件を満たしません。

[VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) の文書確認日は2026-09-15です。現行の設定と将来そろえるべき入力を分けて読みます。

| 用途 | 設定キー | 同じにする必要がある入力 |
|---|---|---|
| 選択範囲のreview | `github.copilot.chat.reviewSelection.instructions` | 同じファイルの同じ選択範囲 |
| commit message生成 | `github.copilot.chat.commitMessageGeneration.instructions` | 同じstaged diff |
| PR description生成 | `github.copilot.chat.pullRequestDescriptionGeneration.instructions` | 同じ差分とPRの前提 |

値は `text` または `file` を持つobjectの配列です。`file` なら参照先の実在・本文・版を別に確認する必要があります。本編は `text` の草稿だけに限定しています。三つのキーを同時に有効化する手順ではなく、非推奨のcode generation / test generation用設定も混ぜません。

本編S2の二行は合成の文書資料です。tracked fileやstaged diffを作成した証拠ではなく、その短文案も生成機能の出力ではありません。Chatのmodel pickerと用途別のutility modelを同じ条件だと決めつけません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

- 環境の所有者から、選んだ用途の設定一つと合成入力だけを扱う独立試行の承認を得ること。

承認はnot-checkedです。今は生成ボタンを押さず、設定、Gitのstage、既存PRを変更しません。必要な拡張をこのページから導入することもありません。

将来別途承認された試行では、選んだ一つのpropertyだけを扱い、既存設定の全文置換を避け、元値と今回の追加分を区別できる設計が必要です。生成と、commit・push・PR作成・投稿は別の副作用です。投稿先や既存リモート項目を必要とする入口を、このガイドの権限で用意しません。

通常Chatへ同じ文を貼る案は別の参考対照です。同じ生成入口が同じ追加本文を受け取ると確認できない限り、等価な手動対照とは呼べません。

## Runtime capabilities

tracked-vscode-settings — blocked

Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings.

generation-entrypoint-delivery — not-checked

用途別設定が選んだ生成入口へ投入されることと、その出力は実機未確認である。

通常の `.vscode/settings.json` はgitignoredで、例外は `.vscode/mcp.json` だけです。ignoreの変更、設定のforce-add、別pathへの偽装、allowlistの拡大で通過させません。既知の制約はnot-checkedに弱めず、全体のRuntime readinessもblockedです。

不活性な草稿をexportできることと、追跡したworkspace設定を使う実機試行が検証可能なことは別です。Runtimeの拡張は別途承認する将来の作業であり、このガイドは実行サポートを追加しません。

## Stop / Block

- Runtime v1で通常の.vscode/settings.jsonの追跡が必要な間は停止する。
- 通常Chatしか使えない、同じ選択範囲や差分を用意できない、または既存のstageを動かす必要がある場合は停止する。
- 投稿・commit・push・PR作成や追加の拡張導入が必要なら、このガイドでは実施しない。

停止後はblockedまたは未実施の記録で構いません。本編では `participant/hc-005/generation-settings.json.template` の草稿、または追加なしの理由だけを残せます。実機の代替成功とは呼びません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

共通Issue Formの任意欄へ、読解のみか、既知の制約で停止したかを書き、本編の二条件のoutcomeやEvidenceとは分けます。実機未実施なら独立run IDや生成結果を作らず、live-unobservedを維持します。

将来の記録でも、設定の保存、発見、本文投入、生成ボタンの呼出し、出力内容、外部投稿の有無を別々に示す必要があります。構文が正しい、言語が変わった、見出しがそろっただけで正確性や設定の効果を証明しません。RuntimeのruntimeBehaviorとeducationalEffectはnot-observedのままです。
