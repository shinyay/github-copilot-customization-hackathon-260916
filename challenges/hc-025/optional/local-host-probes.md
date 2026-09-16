# Local Agent / Agent Host live probeの準備境界

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-025本編](../README.md)の不活性な資料診断とは別に、Local AgentとAgent Hostで一つずつactive probeを観測する前の準備ガイドです。

同時に複数のCustomizationを有効化せず、Skill / Prompt / Agent / Pluginを独立したprobeとして扱います。

## Prerequisites

environment:

- Local AgentとAgent Hostを区別できる対象version、独立workspace、client接続条件、開始前状態を確認できること。

entitlements:

- 各harness、model、対象Customization、教材workspaceの利用資格と組織policyを確認できること。

additionalApprovals:

- 各probeのactive配置、harness選択、限定観測、model利用、終了時解除を一件ずつ別途承認すること。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 各probeのactive配置、harness選択、限定観測、model利用、終了時解除を一件ずつ別途承認すること。

通常profile、User/home保存元、同期、既存Pluginを変更せず、既存probe先へ上書きしません。PromptがHostで読まれない場合、Skillへ置き換えて同じprobeを継続しません。

宣言tools、実効tools、client接続、OS権限、approvalを別に記録します。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| live-portability-probes | not-checked | 両harnessでのactive probeは本編baseline/host条件外で、別の配置設計、実機観測、consumer検証が必要です。 |

本編Packの不活性kitはactive file、install、harness起動を作りません。

## Stop / Block

- Local Agentが対象versionにない場合は停止します。
- 既存probe先への上書きが必要な場合は停止します。
- User保存元への移行が必要な場合は停止します。
- PromptをSkillへ置き換えなければ続けられない場合は元probeを止めます。
- 実効model/tools/approvalを観測できない場合は停止します。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

format、active path、discovery、loading、effective tools、approval、result、解除をprobeごとに記録します。一つのprobeや一つのharnessの結果を、他の形式・version・hostへ一般化しません。
