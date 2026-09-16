# localとRulesの互換形式を別々に準備する

## Guide scope

**OPTIONAL_GUIDE_ONLY / live-unobserved** — [HC-004本編へ戻る](../README.md)。root一つの本編とは別に、localの保存とGit除外、Rulesの対象選択を考える任意の準備ガイドです。ここではactiveファイルを作らず、実機試行を開始しません。

localとRulesは**別の実験**として計画します。root、local、Rulesを同時に置いて互換性の比較と呼びません。model / harness / toolsも変えず、別モデルの結果を混ぜません。

出典: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)（文書確認: **2026-09-15**）。root以外の配置とRulesの `paths` 配列の説明を確認しましたが、利用予定環境での発見・本文投入は未確認です。

Hubで準備条件を表示するだけのCLIは次です。`--condition`、`--team`、`--run` を加えません。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-004 --route claude-variants
```

## Prerequisites

environment:

- localとRulesを分けた使い捨てworkspaceと新規会話を計画できること。
- 利用予定のVS Code・harnessとClaude互換形式の対応状況を確認できること。

entitlements:

- 利用予定環境のGitHub Copilotと教材repositoryへの通常の利用資格を確認できること。

これらはnot-checkedです。別repository・会話・Profileだけでhome、User、組織、Memory由来の指示は隔離されません。未知の保存元を空と見なさず、追加の実機計画にはその確認範囲も書きます。

### localを考えるとき

`CLAUDE.local.md` はローカル用途の形式ですが、**localという名前はGit除外の証明ではありません**。既存の追跡状態と除外規則の両方が観測対象です。将来承認された環境で何を読むかの例として、次のread-onlyコマンドを計画へ記せます。このガイドは実行結果を持っていません。

```powershell
git ls-files --error-unmatch -- CLAUDE.local.md
git check-ignore -v -- CLAUDE.local.md
```

前者は追跡状態、後者は除外規則を調べる別の観測です。出力とexit codeをそれぞれ読み、無出力や非ゼロを「除外済み」と解釈しません。除外されていてもsecretを書いてよいわけではなく、Gitの状態からAIへの本文投入も分かりません。

### Rulesを考えるとき

`.claude/rules/` のRulesは `applyTo` ではなく **`paths` 配列**を使います。下は構文だけの不活性な草稿で、保存・適用する手順ではありません。

```yaml
---
paths: ["wholesale-core/src/**/*.java"]
---
```

本文は参加者が別途選ぶ短い規則です。この例で何を対象にするつもりか、対象外では何を観測したいかを先に書きます。公式説明ではpaths省略時は `**` になるため、対象を明示する理由も考えます。パターンへの一致だけで実投入を保証せず、Rulesの構文をPackの許可pathやJavaの業務知識と混同しません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- localまたはRulesの独立した実機計画には、環境所有者の追加承認を得ること。

homeの `.claude/CLAUDE.md` やRules、既存User設定は変更・削除・退避しません。除外設定の書換えやforce-addも本編を通すための手段にしません。本編Packはroot CLAUDE.mdだけを許可し、CLAUDE.local.mdやactive Rulesは許可していません。ガイド登録でその範囲は増えず、上のYAMLを本編の `.claude/rules/` へ保存することも認めていません。

## Runtime capabilities

- capability: `claude-local-discovery`
- status: `not-checked`
- reason: localの発見・本文投入とGit除外の実状態は未確認です。

- capability: `claude-rules-discovery`
- status: `not-checked`
- reason: paths配列によるRulesの選択・本文投入とRuntimeによる任意実機検証は未確認です。

本編v1の検証を任意実機へ流用する契約はありません。CLIのreadinessはnot-checkedで、exit 0は準備条件を表示したことだけを示します。実行Pack、別condition、自動有効化を提供したとは扱いません。

## Stop / Block

- 対応状況、分離環境、追加承認が確認できない場合は実機計画を止めます。
- homeの変更、除外設定の書換え、本編へのactive Rules追加が必要なら未実施にします。

未実施のままで構いません。設定・本文・harnessの複数要因を分けられない場合も止め、本編の提出へ混ぜません。`.hackathon/run.json` の編集や許可範囲の拡張で制約を回避しません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

共通Issue FormのOPTIONAL欄へ、localの準備とRulesの準備を別々に記します。読むだけなら `guide-only`、未実施なら `unperformed` とし、架空のrunやGit出力を作りません。個人情報、homeの内容、local絶対pathは転載しません。

将来別途承認された試行を記録しても、localの保存・除外と発見・本文投入は分け、Rulesでは対象パターン、発見、投入本文、出力を分けます。本文が同じことはmetadataやpriorityの同一性ではありません。別harnessでの可搬性も未確認とし、静的exportの `runtimeBehavior` / `educationalEffect` は `not-observed` のままです。
