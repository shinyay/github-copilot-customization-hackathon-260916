# Profile Tool Setsの保存元と実効メンバーを確認する

## Guide scope

OPTIONAL_GUIDE_ONLY / live-unobserved

このページは、将来の独立した実機試行に必要な準備を考える**任意のガイド**です。
[HC-012本編](../README.md) は不活性原稿と紙上の再構成だけで提出できます。読むことは、Profileの作成・変更やtool呼出しへの承認ではありません。
ここでは実操作を始めません。後述は別途承認された将来の確認事項です。

## Prerequisites

### environment

- 対応するVS Code StableのLocal Agentで、Chat: Configure Tool Setsと四つの固定参照の実在を本人が確認できること。
- 別途承認された専用user-data/Profileを使い、既定Profileからの継承・同期・残留を識別できること。

### entitlements

- 対象環境でのCopilotと既存の四toolの利用資格・policyを本人が確認すること。

どれもnot-checkedです。固定参照は `search/changes`、`search/codebase`、`read/problems`、`search/usages`。
ここに書いてあることと、その端末に導入済みで使えることは別です。client / host / 版、言語サービスや索引の状態も未確認として残します。
専用ProfileだけでHOME、組織設定、既定Profileの継承、Settings Syncが消えると考えません。

公式ドキュメント [Create and use tool sets](https://code.visualstudio.com/docs/agent-customization/tool-sets) は、制作担当が2026-09-15に直接取得して確認しました。
作成コマンド、固定四参照、`description` / `icon: book`、pickerの折り畳みグループとメンバーの選択を確認できます。
**Profile保存先とdeprecated flagは、この公式ページ本文の記載ではありません。**
[Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools) は関連資料です。

保存先・deprecatedの留保は、承認済み設計で参照した
[toolSetsContribution.ts](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/chat/browser/tools/toolSetsContribution.ts) と
[userDataProfile.ts](https://github.com/microsoft/vscode/blob/main/src/vs/platform/userDataProfile/common/userDataProfile.ts) に基づきます。
**設計時のsource確認日は2026-09-15です。今回のsource再取得は未確認です**（microsoft/vscodeがSSO 403を返したため取得できず、別認証・raw URLでの迂回は行っていません）。
設計資料に記録されたupstream mainのuser set生成には `deprecated: true` があり、今回確認した文書には作成案内があります。
これは最新sourceの今回の取得や、installed Stableの削除・動作の実測ではありません。実UIも未観測であり、将来の別承認で実際に開いたProfileの絶対パスを記録します。
対応UIがない版や別harnessへ、Profileの設定をportableなものとして持ち込みません。

## Permissions / Safety

このガイドは権限を付与せず、実機実行を開始しません。

- 環境の所有者から、今回新規作成するTool SetだけのProfile保存・選択・確認・解除について別途明示承認を得ること。

承認はnot-checkedです。次は今実行する手順ではなく、承認時に範囲を確定するための確認表です。

| 将来の確認事項 | 別々に必要となる記録 |
|---|---|
| 作成入口 | **Chat: Configure Tool Sets → Create new tool sets file** が実際に存在するか |
| 保存先 | UIが開いた**実際の絶対パス**とcurrent Profileの識別。`currentProfile.promptsHome` に対応するpromptsフォルダーか |
| ファイル名 | `RawToolSetsShape.suffix` に対応する `.toolsets.jsonc`。本編の `.template` 保存とは別 |
| 構文・発見 | 実際の補完と診断、`#` 候補、pickerのグループ表示。JSON parseや手入力文字列だけで代用しない |
| 展開・選択 | 展開した宣言メンバー、選択した四参照、ほかの選択経路も含む実効一覧を固定四参照へ別々に照合 |
| 呼出し | 同じsource・依頼に対して実際に呼ばれたtool、入力・返却・承認。全メンバーのcallは強制しない |
| 反復 | 初回と別の人による再選択を分け、クリック・展開・チェック変更等の数え方を先に固定。第三conditionにはしない |
| 終了 | 自分が今回新規作成した集合だけの識別と解除、元の選択状態の確認。既存設定の削除で代用しない |

通常の既定Profileでは `<user-data>\User\prompts` のような配置が考えられますが、これは通常例であり実際の保存先の証拠ではありません。
名前付きProfileや継承で異なるため、絶対パスは将来UIで確認します。`.vscode\toolsets.jsonc` を発見先にしたり、通常の `%APPDATA%` を推測して書き換えたりしません。
実pathは本人の非公開記録で管理し、提出には識別を安全に要約します。

Tool SetはACL、sandbox、権限付与、全toolの自動呼出しではありません。元toolの承認と利用権限は変わりません。
本編のRuntime PackはProfile操作やactive設定を許可していません。本編conditionのまま実ファイルを追加して通す経路は用意しません。

## Runtime capabilities

profile-toolsets-ui — not-checked

Runtime v1はChat: Configure Tool Sets、picker、実効メンバーやtool callを検査しない。

external-profile-state — not-checked

Runtime v1はrepository外のProfile保存先・継承・同期・残留を検査しない。

readinessもnot-checkedです。Runtime bundleに原稿が含まれても、Profileのファイル・発見・補完・選択・callを観測した意味にはなりません。
このmetadataは準備の不足を示すだけで、実行サポートや追加grantではありません。

## Stop / Block

- 対応UIがない、固定四参照のいずれかを確認できない、または実効メンバーが一致しない場合は停止する。
- 既定Profileからの継承・同期・残留を分離できない場合は停止する。
- 利用資格・所有者承認・実際の保存先が不明、または自分の追加分だけを解除できない場合は停止する。
- 既存HOME/Profile設定の削除・上書き、追加toolの導入や権限変更が必要なら、このガイドでは実施しない。

停止後は未実施のままで構いません。未知の参照を似た名前へ置き換えたり、他人の設定を削除したりして合格を作りません。
変更がなくてもsourceを変更しません。診断なしを不具合ゼロとせず、言語サービスや索引が未確認ならその限界を残します。
本編の設計比較はそのまま提出できます。

## Evidence / Non-claims

任意ガイドの完了は、本編の改善やRuntimeの検証成功を意味しません。

読んだだけなら共通Issue Formの任意欄にguide-only / unperformedと未確認事項を記載できます。架空の実run IDやProfile操作receiptは作りません。
将来別途承認された実機記録ができても、本編のcomparison / recovery / membershipとは分離します。
宣言、紙上の再構成、UI選択、実効メンバー、実call、時間をそれぞれ別の証拠で示し、見えない値はnull / not-observedです。
sourceのテスト定義を読んだことはJava・DB実行ではなく、tool callの成功とも違います。
liveStatusはlive-unobserved、runtimeBehaviorとeducationalEffectはnot-observedのままです。
