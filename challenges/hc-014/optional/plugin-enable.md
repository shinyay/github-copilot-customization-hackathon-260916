# HC-014 Plugin有効化前の準備ガイド

## Guide scope

**OPTIONAL_GUIDE_ONLY / live-unobserved**

[HC-014本編へ戻る](../README.md)。これは任意の準備確認で、本編のDRAFT比較だけで提出できます。
将来、workspace設定を再現可能な成果物として追跡する経路を検討するためのガイドです。
Pluginそのものが利用不能という意味ではなく、この経路をRuntime v1で完走する準備がblockedです。
本編の二条件、Packのpath許可、Evidenceの要件を増やしません。

## Prerequisites

### Environment

- レビュー済みの Agent Plugins 1.0・一つの Skill の package と、対応する VS Code Stable / local plugin 設定を確認できること。
- 本編とは別の専用 workspace と、workspace 設定を再現可能な成果物として追跡する計画があること。

### Entitlements

- 利用予定の Copilot・教材 repository の利用資格と、組織の Plugin policy を確認できること。

これらは必要条件の説明で、閲覧者の環境・資格を確認した記録ではありません。
仕様を読むときは [VS Code Agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins) と
[Agent Plugins manifest](https://agent-plugins.org/plugin-authors/manifest) の対象形式・clientを確認します。
VS Code Agent pluginsの該当節の確認日は **2026-09-15** です。公式文書の確認であり、installやUI操作の観測ではありません。
別のharnessやUIの説明を、手元の環境の対応実績にはしません。

## Permissions / Safety

**このガイドは権限を付与せず、実機実行を開始しません。**

- 対象を限定した install / register / enable と workspace 設定変更には、環境所有者の別承認が必要です。

本編のparticipant原稿は探索先へ移さず、`.template` を外しません。
対応の確認だけを理由に、マーケットプレイス追加、download、install、publish、Profile変更、homeの削除を始めません。
一つのSkillという制約を保ち、HookやMCPを足しません。他のPluginに実行可能なcomponentが含まれ得ることを踏まえ、
名称だけで信頼せず中身全体のレビューが必要です。

## Runtime capabilities

| Capability | Status | Reason |
|---|---|---|
| `tracked-vscode-settings` | `blocked` | Runtime v1 ignores .vscode/settings.json; only .vscode/mcp.json is exempt. Do not force-add settings. |
| `plugin-discovery` | `not-checked` | Plugin の実 discovery、Skill 本文 loading、無効化後の残留は未確認です。 |

一件のblockedがあるため全体もblockedです。環境・資格・追加承認のreadinessはnot-checkedで、空の確認欄もreadyではありません。
`.vscode\settings.json` はRuntime v1でGit除外、例外は `.vscode\mcp.json` だけです。
本編Packはどちらのactive設定も許可しません。追跡可能性と実行許可は別です。
force-add、Runtimeの除外変更、User/Profileだけに保存する迂回でこのblockedを弱めません。
Profile限定の再現計画へ変えるなら別の設計と承認が必要で、同じrouteの成功扱いにはしません。

設定の**意味を読む**ときは次を区別します。ここには有効化する操作手順はありません。

- `chat.plugins.enabled` はPluginのサポートを切り替える設定です。設定値と今回のpackageの発見・本文loadingは別の観測です。
- `chat.pluginLocations` はlocal packageのdirectoryと設定上の有効状態の対応です。値が `true` なら有効、`false` なら登録済みで無効という設定です。
- Enable / Disable のUI操作による有効状態は設定ファイルとは別に保存されます。設定JSONを読むだけで、その時点の実UI状態まで確認したことにはなりません。
- 設定のファイル保存、UI上の出所表示、Skillの候補、本文loading、更新の反映、無効化後の残留は別々に確かめる必要があります。
- Copilot CLIがホームへ導入した installed plugins も発見され得ます。手動Skillも残る可能性があり、新規workspaceやProfileだけで同名候補が一つになるとは限りません。
- 合成資料の enabled / disabled は実clientの状態を観測した記録ではありません。

Hubで準備条件だけを表示するコマンドです。PackのapplyやVS Code操作は始まりません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-014 --route plugin-enable
```

`--condition` / `--team` / `--run` を混ぜません。
この経路はstdoutにガイドJSON、stderrに `OPTIONAL_ROUTE_BLOCKED`、exit 2を返します。
これは既知の停止理由の表示で、実機へのinstall失敗や成功ではありません。

## Stop / Block

- 追跡済みの .vscode/settings.json が必要なこの経路は Runtime v1 では blocked のため、実機操作を開始しません。
- 対応環境・利用資格・追加承認・package のレビューを確認できない場合は未実施にします。
- 既存の home / User / 組織設定や他人の Plugin に触れる必要がある場合は停止します。

停止後は未実施のままで構いません。本編は続けて提出できます。
同じrunへ設定pathを追加する、force-addする、権限を増やす、Profileだけへ黙って切り替える手順は提供しません。

## Evidence / Non-claims

**任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。**

ガイドを読んだこと、準備条件の表示、blocked / not-checked、未実施理由だけを本編と分離して記録します。
実機記録用の新しいEvidenceファイルやconditionをこのrouteで作りません。
構造validatorの合格、同じSkill hash、合成disabledの記載を、実install / discovery / loading / update / Disableの証拠にしません。
`runtimeBehavior` / `educationalEffect` は未観測です。将来別承認で観測しても、対象clientと版の実機記録として扱います。
