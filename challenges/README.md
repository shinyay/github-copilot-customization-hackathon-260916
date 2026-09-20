# GitHub Copilot Customization Scenarios

**言語:** **日本語** / [English](../en/challenges/README.md)

45のシナリオは、どれも単独で試せます。興味のある機能や、自分の現場に近い課題から選んでください。

作業用リポジトリの準備とサンプルの扱い方は、ルートREADMEの [始め方](../README.md#始め方) を参照してください。

| ID | シナリオ | 主な機能 | カテゴリ |
|---|---|---|---|
| [HC-001](hc-001/) | 根拠を示せるJavaチームメイトを育てよう | Repository Instructions | Instructions |
| [HC-002](hc-002/) | JavaとXMLに異なる読み方を伝えよう | File/task Instructions | Instructions |
| [HC-003](hc-003/) | ディレクトリごとの規則をAGENTS.mdで伝えよう | AGENTS.md | Instructions |
| [HC-004](hc-004/) | `CLAUDE.md`形式の指示を安全に試そう | CLAUDE.md compatible instructions | Instructions |
| [HC-005](hc-005/) | 個人・チーム・タスクの指示を整理しよう | 個人・チーム・用途別Instructions | Instructions |
| [HC-006](hc-006/) | 繰り返すJava調査をPrompt Fileにしよう | Prompt Files | Workflows |
| [HC-007](hc-007/) | 調査役と検証役のAIチームを設計しよう | Custom Agents and Handoffs | Workflows |
| [HC-008](hc-008/) | 大きな調査を2つのSubagentへ任せよう | Subagents | Workflows |
| [HC-009](hc-009/) | CSV再送調査の手順をSkillにまとめよう | Agent Skills | Workflows |
| [HC-010](hc-010/) | Agentの実行終了時に検査結果を通知しよう | Hooks | Hooks |
| [HC-011](hc-011/) | 運用メモを安全に取得するMCPツールを作ろう | Model Context Protocol | Integrations |
| [HC-012](hc-012/) | よく使うツールを迷わず選べるセットにしよう | Tool Sets | Integrations |
| [HC-013](hc-013/) | チームの知識をCopilot Space向けに整理しよう | Copilot Spaces | Integrations |
| [HC-014](hc-014/) | SkillをPluginとして配布・更新しよう | Agent Plugins | Integrations |
| [HC-015](hc-015/) | 最短経路で必要なコードへ到達しよう | Context / Search / Language Intelligence | Context & Controls |
| [HC-016](hc-016/) | 役立つ記憶だけを残し、古い記憶を捨てよう | Memory | Context & Controls |
| [HC-017](hc-017/) | タスクに合うモデルと推論量を選ぼう | Model / Thinking Effort | Context & Controls |
| [HC-018](hc-018/) | 承認と隔離の境界を可視化しよう | Permissions / Sandbox | Context & Controls |
| [HC-019](hc-019/) | カスタマイズの健全性を診断しよう | Customization diagnostics | Context & Controls |
| [HC-020](hc-020/) | VS Code拡張から専用ツールを提供しよう | VS Code Language Model Tool | Context & Controls |
| [HC-021](hc-021/) | 競合しているInstructionsを特定しよう | Instructions diagnostics | Design & Evaluation |
| [HC-022](hc-022/) | 外部資料からの命令注入を防ごう | Prompt injection boundaries | Design & Evaluation |
| [HC-023](hc-023/) | 最小限で十分なカスタマイズを選ぼう | Customization selection | Design & Evaluation |
| [HC-024](hc-024/) | InstructionsとSkillを一つずつ外して比べよう | Ablation testing | Design & Evaluation |
| [HC-025](hc-025/) | Local Agent / Agent Host間でカスタマイズの可搬性を診断しよう | Local Agent / Agent Host | Design & Evaluation |
| [HC-026](hc-026/) | カスタマイズ資産を安全に段階導入しよう | Rollout / rollback | Design & Evaluation |
| [HC-027](hc-027/) | 評価計画を固定してからカスタマイズを比べよう | Evaluation design | Design & Evaluation |
| [HC-028](hc-028/) | Copilotが読んだInstructionsのバージョンを突き止めよう | Instructions attribution | GitHub & Cloud |
| [HC-029](hc-029/) | Cloud AgentにJavaの互換性要件を守らせよう | Cloud Agent instructions | GitHub & Cloud |
| [HC-030](hc-030/) | 税額の意味を守るコードレビューを設計しよう | Copilot code review | GitHub & Cloud |
| [HC-031](hc-031/) | Java・XML・製品ごとにInstructionsを出し分けよう | `applyTo` / `excludeAgent` | GitHub & Cloud |
| [HC-032](hc-032/) | Cloud Agentの調査役とツールを設計しよう | Cloud custom agents | GitHub & Cloud |
| [HC-033](hc-033/) | Cloud Agentに再送調査用のSkillを渡そう | Cloud Agent Skills | GitHub & Cloud |
| [HC-034](hc-034/) | Cloud Agentから運用メモを取得するMCP連携を設計しよう | Cloud MCP | GitHub & Cloud |
| [HC-035](hc-035/) | Instructionsと実行環境を混同せずに準備しよう | Cloud setup | GitHub & Cloud |
| [HC-036](hc-036/) | Draft・Open・更新時のレビュー実行条件を設計しよう | Code review triggers | GitHub & Cloud |
| [HC-037](hc-037/) | LiteとBalancedのレビュー品質を比べよう | Code review effort | GitHub & Cloud |
| [HC-038](hc-038/) | Cloud Hookの失敗を正しく分類しよう | Cloud Hooks | GitHub & Cloud |
| [HC-039](hc-039/) | 組織で共有する規約の責任者を決めよう | Organization instructions / profiles | GitHub & Cloud |
| [HC-040](hc-040/) | 1つのSkillをPluginとして届けよう | Plugin delivery | GitHub & Cloud |
| [HC-041](hc-041/) | リポジトリの事実と古い記憶を見分けよう | Memory attribution | GitHub & Cloud |
| [HC-042](hc-042/) | 読めない外部データの原因を層ごとに探そう | External data access | GitHub & Cloud |
| [HC-043](hc-043/) | イベント駆動Agentを最小権限で動かそう | Event-driven agents | GitHub & Cloud |
| [HC-044](hc-044/) | CopilotのApproveとマージ可能な状態を区別しよう | Review approval semantics | GitHub & Cloud |
| [HC-045](hc-045/) | レビュー指摘を安全なCloud修正へ引き継ごう | Review-to-Cloud handoff | GitHub & Cloud |

## 進め方

1. 各ページの **シナリオ** と **この機能とは** を読み、扱う課題と機能の限界を確認する。
2. `starter/` から、READMEで指定された素材だけを作業用リポジトリへコピーする。
3. **試してみる** の手順を実行する。
4. 必要なら **任意: 比較する** で、カスタマイズ前後の違いを確認する。
5. **確認ポイント** と **制約・代替手段・安全** を使って結果を振り返る。

`optional/` があるシナリオでは、本編を終えた後に、追加の製品機能や運用条件を試せます。
