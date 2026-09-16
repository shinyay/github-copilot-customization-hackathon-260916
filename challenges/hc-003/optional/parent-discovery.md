# 親repositoryの発見条件を確認する

## Guide scope

**OPTIONAL_GUIDE_ONLY / live-unobserved** — [HC-003本編へ戻る](../README.md)。これは親探索の準備を整理する任意ガイドです。本編はrepository rootをworkspace rootとして使い、親探索を有効化しません。このページから実機操作を開始することはありません。

サブフォルダーだけを開く場合、見えているworkspaceとrepositoryのrootは一致しないことがあります。公式説明にある `chat.useCustomizationsInParentRepositories` は、その親repositoryからの発見を扱う別の設定です。既定は無効と説明されています。名前を知ることは有効化の許可ではありません。

出典: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) と [Monorepo customization discovery](https://code.visualstudio.com/docs/agent-customization/overview#_use-customizations-in-a-monorepo)（文書確認: **2026-09-15**）。このガイドはその条件を紙上で点検し、実機のtrust状態を推定しません。

準備条件の表示だけを行うHub CLIです。coreの `--condition`、`--team`、`--run` とは混在させません。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-003 --route parent-discovery
```

## Prerequisites

environment:

- 開くworkspace rootと親repositoryの境界を、実行せず図で区別できること。
- workspace自身には.gitフォルダーがなく、親に.gitフォルダーがあるという公式の前提を確認できること。

entitlements:

- 教材と親repositoryを閲覧する通常の権限を確認できること。

公式説明は、開いたworkspaceから親のrepository rootまでの範囲と、親がtrustedであることを前提にしています。`.git` がファイルの場合などを、説明と同じだと未確認のまま一般化しません。必要な環境値と資格はnot-checkedです。

計画では、workspace root、親の境界、読むsource、候補の保存元を分けて図示します。workspaceを変えると参照できる入力も変わり得るため、本編の回答品質との単純比較にはしません。nested探索とも独立に考えます。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- 親repositoryを信頼してよいかは所有者が判断し、追加の実機計画を承認すること。

既存の親AGENTS.mdや他の親ファイルは変更・削除・退避しません。親にはInstructions以外のcustomizationがある可能性もあるので、内容や影響が分からないままtrustを受け入れません。このガイドはtrust操作、home・User設定の変更、他人のrepositoryへの書込みを求めません。別repositoryやProfileだけでhome、組織、Memoryの影響が消えたとは記録しません。

## Runtime capabilities

- capability: `parent-repository-discovery`
- status: `not-checked`
- reason: 親探索、trust、投入元とRuntimeによる任意実機検証の組合せは未確認です。

本編Packには親を操作する許可も任意実機の検証契約もありません。準備CLIのexit 0はガイド表示だけで、環境・資格・追加承認・Runtime readinessはnot-checkedです。親の発見を実行済み、対応済みとは表示しません。

## Stop / Block

- 親の信頼性、所有者の承認、workspace境界のいずれかが不明なら止めます。
- 既存の親ファイルやhomeの変更、trustの迂回が必要なら未実施にします。

未実施でも本編を提出できます。親へ読みに行けないことを本編の失敗へ読み替えず、`.hackathon/run.json` の改変や許可範囲の拡張で回避しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

準備の図、公式条件との差、未確認のtrust・権限、止めた理由を共通Issue FormのOPTIONAL欄へ分離します。親の個人情報や絶対pathを転載しません。読んだだけなら `guide-only`、実施しないなら `unperformed` とし、架空のrun識別子を発行しません。

将来別途承認された試行でも、保存元、発見、本文投入、出力と、workspace変更による入力差を別々に残します。rootに置いた手動対照の成功は親探索の成功ではありません。静的検証の `runtimeBehavior` / `educationalEffect` は `not-observed` のままです。
