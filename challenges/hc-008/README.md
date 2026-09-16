# HC-008 大きな調査を二人のSubagentへ任せよう

## Challenge Story

受注機能の引継ぎで「画面から入る注文」と「CSVから入る注文」を説明することになりました。
一人で順に読む方が分かりやすいでしょうか。それとも入口ごとに調査を任せ、根拠を持ち寄る方がよいでしょうか。
二人分の文章を並べただけでは、読んだ範囲や未確認事項が統合時に消えてしまうこともあります。

このChallengeでは、調査の**分け方と戻し方**を設計します。速さや子の数を競う課題ではありません。
このページとPack、固定Runtimeだけで開始でき、別のLAB、Prompt、Custom Agent、Skill、過去の回答は不要です。

## この機能とは

Subagentは、親のAgentから限定した仕事を受け、別のコンテキストで調べて結果を返す担当です。
通常の会話で「画面担当」「バッチ担当」という見出しを出すだけでは、子は起動していません。
親からの**実際の呼出し・渡した入力・返却**を別々に確かめます。人が会話を切り替えるhandoffとも区別します。

VS Codeの通常Agentでは、`agent/runSubagent` が利用できるかを確認します。
既定では親のAgent・モデル・toolsを継承する説明ですが、設定上の既定と当該呼出しの実効値は別です。
本編はモデルを上書きせず、Custom Agentを子に指定しません。
このVS Codeの呼出しはstatelessで、同じ子への追質問を前提にできません。
子には最初に必要な範囲・資料・安全条件・返却形式を全部渡します。

コンテキストが別でも、ファイルシステムの隔離や別worktreeは保証されません。
本編では親も子もソースを読むだけにし、ファイルへ書くのは参加者による記録作業だけです。
子の最大2件・各1回、入れ子なし、再試行ループなしは**この教材の上限**であり、製品全体の一律上限ではありません。
入れ子は製品の既定で無効ですが、この課題のために有効化しません。

出典・確認日: [VS Code Subagents](https://code.visualstudio.com/docs/agents/run/subagents)、2026-09-15。
この説明をCLIや別harnessへ無条件に一般化せず、実際のclient / hostを記録してください。
文書を確認した日であり、本教材作成時にSubagentを実行したという意味ではありません。

## 向いていること / 向いていないこと

向いているのは、先の担当の結論を待たずに読める二つの範囲と、短くても根拠を失わない返却を定義できる調査です。
例えば「画面入力の受渡し」と「CSVのまとまりの受渡し」は別々に点検できます。
同じ呼出し連鎖を二人で重複して追うだけの小さい調査、頻繁な追質問が必要な仕事には、直接調べる方が適切かもしれません。

委任は正解、安さ、並列実行、速さを保証しません。ソースの静的読解から、
DBの実トランザクション、運用上の再送安全性、利用者の実権限まで実証したとは言えません。
「子を使わない」という設計判断も、根拠があれば有効です。

## Starter Kit

必要なのはGit、Node.js 22以降、Hubと自分の非公開Runtimeへの通常のアクセス、
利用可能なVS Code Stableの通常Agentです。子の機能がなければ後述の手動比較へ進めます。
JDK、Maven、DB、サーバーの起動や追加extensionのインストールは本編に不要です。

[Pack manifest](pack/manifest.json) の条件は `baseline`、`subagents`、`manual-conversations` です。
すべて同じ7個の不活性素材を `.hackathon/challenge/hc-008/` に受け取ります。
`request.txt.template`、`packets/web-entry.md.template`、`packets/batch-entry.md.template` が固定入力で、
`design.md.template`、`returns.md.template`、`synthesis.md.template`、`comparison.md.template` が空の記録用紙です。
解答や業務上の正解表は含みません。

各packetの対象は次の3ファイルに固定します。表のパスはRuntimeのrootからの相対パスです。

| Packet | 読むsource |
|---|---|
| web | `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java` |
| web | `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java` |
| web | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` |
| batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderCsv.java` |
| batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` |
| batch | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` |

sourceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` の固定515ファイルです。
PackはJavaツリーを複製しません。追加で読みたくなったファイルは、読まずに理由をunknownへ残します。
二つの入口の業務経路が同一であるとは仮定しません。

条件ごとに別のRuntime repository、名前付きbranch、新規workspace・会話・専用profileを使います。
repositoryやprofileだけではhome、User/組織Instructions、Memoryを隔離できません。
既存の外部設定を消さず、有無と影響の未確認を記録し、揃えられなければ比較を止めます。

## Open Question

短い返却でも、保守担当が「どのファイルの何を根拠に、どこまで言えるか」を再確認できる引継ぎをどう作りますか。
二つの入口を同じ列で整理する利点と、違いを無理に揃えてしまう危険を考えてください。
親が各引用を読み直す量、子がunknownを返す基準、人が統合で行う確認を自分で決めます。

例えば、返却を入口順に並べるか、入力の検査・受渡し・限界でまとめるかを選べます。
どちらかを唯一の正解にせず、「この小ささなら子は不要」という案とも比べてください。

## Design Time

回答を見る前に `design.md.template` を読み、各項目の表示順、根拠を落とさない統合方法、
不足入力を補わず止める基準、比較の観測点を決めます。
固定の6ファイル、各packet最大5項目、各項目の「観測 / パス・シンボル・行範囲 / 限界」、安全条件は変えません。

設計は `participant/hc-008/design.md` に参加者が保存できます。同じ完成版を全条件に使い、
比較途中の改善は新しいrunへ分けます。制作時の試行や別条件の出力を固定packetに混ぜません。
開始前に本文hashを取り、run-id・condition等の実行metadataと分けます。

観測点には、両入口から最低1項目ずつsourceへ戻れるか、unknownが統合で断言に化けないか、
重複した調査が増えないかを含めてください。時間・コストを測れない環境ではunknownを選びます。

## Build

### Hubで計画とPackを用意する

Hub checkoutで実行するコマンドです。別条件には未使用のrun名を使います。
`plan-run` は表示だけで、repositoryの作成やAgentの起動はしません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-008 --condition baseline --team team-sora --run direct-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-008 --condition subagents --team team-sora --run children-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-008 --condition manual-conversations --team team-sora --run manual-01
node .\scripts\build-pack.mjs --challenge HC-008 --output .runtime/packs
```

出力先引数はCLIで定められた `.runtime/packs` をそのまま使います。
生成先 `.runtime\packs\hc-008-v1` または隣のhashが存在すると停止します。
他人の出力を削除せず、既存Packなら版・hashを確認するか未使用のHub checkoutでbuildします。

### 条件ごとにRuntimeを準備する

[Getting Started](../../docs/getting-started.md) に従い、Runtime templateから各条件専用の非公開repositoryを用意します。
前の条件のbranchを使い回しません。Runtime templateVersionは1で、
[Runtime onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)
が実行手順です。root READMEのアプリ起動手順はこの課題では使いません。

以下は**新しいbaseline用Runtime checkout**で、参加者が準備する例です。
`$Pack` は先ほどbuildしたPack directoryの実在する絶対パスに置き換えます。
他の二条件はそれぞれの新しいrepositoryで、branch名とconditionを替えて実行します。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-008-v1'
git status --short --branch
git switch -c hc-008-baseline-direct-01
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition baseline
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

既存変更・既存run・名前の衝突・template不一致なら停止し、上書きや `run.json` の手編集で回避しません。
`branchSafe: false` のため、applyした名前付きbranchから途中で移動しません。
本編の追加ファイルは `participant/hc-008/design.md`、`returns.md`、`synthesis.md` だけです。
AGENTS、Prompt、Skill、tools設定等は作りません。Java、設定、Packの配布物は変更禁止です。

### 同じ入力を渡す

参加者が固定requestと**両packet全文**を通常Agentへ添付・貼付し、設計全文も同じように渡します。
自動で読まれるInstructionsではないため、保存しただけで入力済みとは数えません。
ファイル添付を読めない環境では、全条件で同じ本文を手動で渡し、その方法を記録します。

```powershell
Get-FileHash .\.hackathon\challenge\hc-008\request.txt.template -Algorithm SHA256
Get-FileHash .\.hackathon\challenge\hc-008\packets\web-entry.md.template -Algorithm SHA256
Get-FileHash .\.hackathon\challenge\hc-008\packets\batch-entry.md.template -Algorithm SHA256
Get-FileHash .\participant\hc-008\design.md -Algorithm SHA256
```

最後のコマンドは参加者が設計を保存した後に使います。hashはbytesの一致であり、実際の本文投入の証拠ではありません。
run-id・condition・workspace識別子は別metadataとして添え、配布packet自体を書き換えません。

親・子・手動会話すべて、許可されたsourceだけを読み、チャットにだけ返答します。
実データ・資格情報を読まず、DB・サーバー・ビルド・テスト・シェル・無許可ネットワークを実行しません。
準備用の上記Node/Gitや、参加者の記録作業はAgentへの調査許可とは別です。

## Compare

| 条件 | 誰が調べるか | 必要な観測 |
|---|---|---|
| Baseline: `baseline` | 通常Agentが一会話で両packetを順に読み、直接統合。子なし | 子を実際にOFFにできたか、指示で委任を抑えたか |
| Customized: `subagents` | 通常Agentが最大2子へ各1回。web全文とbatch全文をそれぞれ渡し、返却を統合 | 呼出し数、各入力全文、返却、実効モデル/tools、順次か並列か |
| 手動対照: `manual-conversations` | 人がwebとbatchを別々の新規会話へ渡し、二つの返却全文を第三の新規統合会話へ運ぶ | 人が作った3会話、改変しない返却、両packetと設計の再投入 |

すべて同じsource・両packet・依頼・設計・安全条件・返却形式を使います。
子には該当packet全文、baseline、run-id、安全条件、設計と返却契約を最初の一度で渡します。
親に添付しただけの情報や過去の会話を子が知っていると仮定しません。
人が会話を分ける条件を、Agentが子を呼ぶ条件の成功例へ流用しません。

子呼出しtoolを無効にできないhostでは、「委任しないで」という**指示ベースの対照**と
能力自体を切った **capability-off** を区別します。既存設定の変更や新しいAgent定義でOFFを作りません。
意図せず委任されたbaselineは比較条件違反です。子が未起動なら「未起動」と記録し、
同じrunの中で再試行ループを始めません。

手動対照は同じ情報を与える比較であり、コンテキスト境界・受渡しmetadata・操作量まで同一ではありません。
手作業の貼付・会話作成時間も記録します。model、tools、外部指示、入力が揃わない場合は `incomparable`、
機能が提供されない場合は `unsupported`、権限や準備条件で止まる場合は `blocked` を使います。
`equal`、`worse`、Subagent追加不要も提出でき、`improved` を得るまで繰り返しません。

## Evidence

`comparison.md.template` を参加者が `.hackathon/evidence/hc-008/comparison.md` にコピーし、各見出しを記入します。
未実施項目は理由を残し、ひな型のまま提出しません。必要な二返却と統合文は
`participant/hc-008/returns.md`、`participant/hc-008/synthesis.md` に保存できます。
全件のraw logではなく、秘密や個人情報を除いた必要な範囲だけにします。

保存hash、実際に渡した本文、toolの起動、子の作業の成功、親の統合品質を分けて記録します。
単なる「二人が調べました」という見出しは呼出し証拠ではありません。
UIで呼出しを展開できれば、入力・開始終了・返却を記録し、見えないものはnot-observedとします。
親が返却のパス・シンボル・行範囲・限界をどの行へ引き継いだかも対応付けます。

両packetから各1項目以上を人がsourceと照合し、誤引用、根拠の脱落、保留した主張を残します。
Nodeの子プロセスやPack検査成功をAI Subagentの実行記録と呼びません。
Runtime bundleの `runtimeBehavior` と `educationalEffect` は静的検査では `not-observed` のままです。

## Submit

参加者が同じRuntime branchで検査・exportし、Runtime PRに設計、必要な返却と統合、Evidenceを含めます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

未記入や宣言外変更で拒否されたら、理由を直すかblockedを正直に記入し、検査器を変更しません。
[共通Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に各条件のRuntime URL・PR URL、
工夫した統合設計、比較と限界をまとめます。単独runに他条件を実施済みと書かず、別runへの対応を示します。
[Submission Guide](../../docs/submission-guide.md) のredaction規則を守ってください。

## Judging

評価するのは、分ける理由、各入力の完全性、呼出しと文章の区別、統合しても追える根拠、
未確認を未確認のまま残せたかです。二人を必ず動かしたことや並列だったことは加点理由にしません。
元のsourceに戻った点検と、機能が不要・未起動・不利だった記録も同じ価値があります。
構文・path・hashの検査だけでは、返却の意味が正しいとは判定しません。

## Bonus Mission

同じ二返却の自分の記録を読み、順序を変えた統合案を**紙上で**比較してみます。
どのunknownが消えやすいかを探し、これは新しいSubagent実行ではないと記録してください。
Custom Agentを子にする比較やnested実験は本編にも今回の任意ガイドにも含めません。

## Support / Fallback

`agent/runSubagent` が使えなければ、二packetの設計と人による別会話の比較を行えます。
それを実Subagentの利用やモデル継承の実証と呼ばず、対象機能はunsupported / not-observedとします。
読取toolがない場合は人が許可sourceを読み、設計演習として提出して構いません。
許可範囲外のsource、設定変更、追加の呼出しが必要になった時点で停止します。

終了時は自分の記録をexportし、baseline検査を確認します。他人の設定の削除、広範囲のclean/reset/stash、
homeや組織設定の書換えを後片付けに使いません。
[Runtime repository guide](../../docs/runtime-repository-guide.md) と
[Support and Fallbacks](../../docs/support-and-fallbacks.md) に共通の停止条件があります。
