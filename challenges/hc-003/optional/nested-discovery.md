# 入れ子のAGENTS.md発見を別実験として準備する

## Guide scope

**OPTIONAL_GUIDE_ONLY / live-unobserved** — これは任意の準備ガイドです。[HC-003本編へ戻る](../README.md)。本編のroot比較にnestedの発見や効果を足しません。読了は実機試行ではなく、準備条件を整理したという意味です。

nested AGENTS.mdはExperimentalです。公式説明では、機能が有効な場合にサブフォルダーのAGENTS.mdを再帰的に探し、相対pathをchat contextへ加え、エージェントが扱うファイルに応じて選択します。pathの発見を本文全文の投入と同一視しません。厳密な継承、優先順位、常に子が勝つといった規則も保証しません。

出典: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)（文書確認: **2026-09-15**）。`chat.useNestedAgentsMdFiles` は説明を照合するための設定名であり、このガイドで変更する指示ではありません。

Hubで登録済みの準備条件だけを表示するCLIは次です。`--condition`、`--team`、`--run` を加えません。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-003 --route nested-discovery
```

## Prerequisites

environment:

- Experimentalなnested AGENTS.mdの説明と、利用予定のVS Code・harnessの対応状況を確認できること。
- 本編とは別の使い捨てworkspaceと新規会話を用意できること。

entitlements:

- 利用予定環境のGitHub Copilotと教材repositoryへの通常の利用資格を確認できること。

これらの実状態はnot-checkedです。将来の独立した計画では、rootの共通原稿とディレクトリ固有案を紙上で区別し、同じsourceと依頼を保って何を観測するかを先に決めます。親探索を同時に扱わず、workspace rootも変えません。fresh Profileや別repositoryだけでhome、User、組織、Memoryが隔離されるとは考えません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- Experimental機能を扱う独立した実機計画は、環境所有者の追加承認を得ること。

本編Packはrootの追加だけを認め、nestedのactive pathは認めていません。このガイドを読んでもその許可は増えません。ここでは設定の有効化、新しいactive AGENTS.mdの配置、既存ファイルの変更をしません。homeやUser設定の削除・退避、組織設定の変更、trustの迂回もしません。

## Runtime capabilities

- capability: `nested-agents-discovery`
- status: `not-checked`
- reason: 入れ子ファイルの発見・本文投入とRuntimeによる任意実機検証は未確認です。

Runtime v1の本編conditionに、この任意操作の検証契約はありません。ガイド登録は実行Packや自動有効化ではありません。CLIのreadinessもnot-checkedで、exit 0は準備条件を表示できたという意味に限られます。実機の利用可能性や成功は観測していません。

## Stop / Block

- 対応状況または追加承認が確認できない場合は実機計画を止めます。
- 本編のroot条件、既存設定、許可pathを変更しなければ試せない場合は未実施にします。

停止後は未実施で構いません。本編はrootだけで提出できます。`.hackathon/run.json` の編集、許可範囲の拡張、`branchSafe` の偽装によって任意実験を通そうとしないでください。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

準備メモは共通Issue FormのOPTIONAL欄へ `guide-only` または `unperformed` として分離します。考えた配置、未確認の環境・資格、追加承認の有無、停止理由を必要最小限に残し、架空のrunを作りません。

将来、別途承認された実機試行を記録する場合も、保存したpath、発見されたpath、本文投入、出力を分けます。特定の観点が回答へ現れたことだけでnestedが読まれたとは言いません。本編の改善に加算せず、静的exportの `runtimeBehavior` / `educationalEffect` は `not-observed` のままです。
