# 索引・検索除外・開いたfileの違いを読む準備

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved。[HC-015本編](../README.md)とは分離した任意の準備確認です。このガイドでは設定変更、検索、index構築を実行しません。選んだ経路は「workspace除外設定を再現可能な成果として追跡する診断」であり、Runtime v1ではblockedです。index自体がすべての環境で使えないという意味ではありません。

同じ`allocate`、同じsource版についてtext検索、semantic検索、明示添付を区別する計画を考えます。これを本編B/Cの添付効果へ足さず、手動全文をsemantic indexの等価対照ともしません。[language-tools](language-tools.md)の言語サービス診断とも別です。

## Prerequisites

environment:

- 同じquery・source版・除外状態・開いたfileを固定し、text検索・semantic検索・添付を別々に記録できること。
- 索引の出所と状態、追跡対象のworkspace設定を変更せず確認できること。

entitlements:

- 対象workspaceの索引サービス、Copilot利用資格、組織policy、source読取り権限を確認できること。

indexの出所はGitHub、Azure DevOps、その他のworkspace等で異なり得ます。文書ではCopilot status dashboardで状態を確認します。個人・enterpriseの利用資格やpolicy、初期化状態を分け、既存の表示から分かる範囲と未確認の範囲を記録する準備です。状態を読めても構築・通信の承認や検索成功を確認したことにはなりません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

additionalApprovals:

- index構築・通信・当該workspace設定変更を伴う実機診断は、対象を限定した別承認が必要です。

source、既存ignore、組織content exclusionを変更しません。検索除外は秘密保護のACLではありません。明示添付できそうだという理由で、組織のcontent exclusionを回避する操作へ進みません。

## Runtime capabilities

| capability | status | reason |
|---|---|---|
| tracked-vscode-settings | blocked | Runtime v1は.vscode/settings.jsonをGit除外し、.vscode/mcp.jsonだけを例外にするため、この設定追跡経路はblockedです。 |
| semantic-index-observation | not-checked | semantic indexの出所、準備状態、実検索の返却範囲は未確認です。 |

一つのrequirementがblockedなのでRuntime readiness全体もblockedです。v1は`.vscode\settings.json`を追跡できず、`.vscode\mcp.json`だけが例外です。例外があることをこのPackのgrantとは扱いません。v2を実装したことにせず、force-addやUser/Profileの設定への黙った切替で同じ経路を完走したことにしません。

semantic検索にはindexが必要ですが、grep/text/file検索はindexなしでも使える経路です。文書には**Build Codebase semantic index**コマンドがありますが、本編では実行しません。このガイドも構築を開始・許可せず、未準備を「検索0件」へ補完しません。

### 設定の対象差を読む

| 設定 / 状態 | 区別して考える対象 |
|---|---|
| `search.exclude` | text/grep検索から除外するが、Explorerには表示する。すべてのcontext経路を閉じるACLではない |
| `files.exclude` | Explorerで非表示にし、text/grep/semantic検索からも除外する |
| `.gitignore` | Gitによる追跡対象の扱いに加え、対象をtext/grep/semantic検索から除外する。開いたfileやselectionのcontextは次行のとおり別 |
| 開いたignored file / selection | `.gitignore`による検索側の除外とは別に、開いたファイルや選択内容がcontextへ入り得る。ignoredだから読めないという保証ではない |

これらの実効値・継承元・検索UIの除外指定の扱いは、利用するclientの文書と状態で別々に確認します。開いたignored fileの挙動は、組織content exclusionの回避を許可する意味ではありません。対象一覧のliteral filterをVS Codeのglob、`.gitignore`やindexの実装と呼びません。

原本の診断例には`search.exclude`で`wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`を対象にする設定があります。本編のsearch-planはそれを**設定変更なし**へ改作しています。原本の設定例を本編へコピーせず、statusを読むだけの準備と、追跡対象の設定を変更する別経路を区別します。

## Stop / Block

- Runtime v1では追跡可能なworkspace除外設定を含む経路を完走できないため、準備確認で止めます。
- force-add、User/Profileへの黙った切替、既存ignoreの変更でblockedを回避しません。
- indexや権限が未確認ならreadyやsemantic結果0件にせず、組織content exclusionを回避しません。

停止後は任意未実施でかまいません。unknown / not-checked / pendingならsemanticResultsはnullと理由を残し、`[]`や0件に補完しません。観測済みのtext検索0件でも、ファイル不存在・読取り拒否・正しい結論を導けるわけではありません。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

準備の読解と、将来別承認で行う実観測を分けます。query、source hash、設定の出所、tabs/selection、要求・返却・読取範囲、index状態を別に記録する設計にします。read-onlyでstatusを説明できても、この設定追跡routeを成功としません。本ガイドは除外の変更・復元、実index、semantic結果、Add Context、LLM/教育効果を観測していません。

一次資料: [Workspace context and exclusion](https://code.visualstudio.com/docs/agents/reference/workspace-context)（取得確認日: **2026-09-15**）。補足: [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)、[Runtime repository guide](../../../docs/runtime-repository-guide.md)。文書確認は実UX・LSP・indexの観測ではありません。原稿のhashやNodeのliteral scanは実検索の再現ではありません。
