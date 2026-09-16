# HC-004 Claude形式の指示を安全に持ち込もう

## Challenge Story

チームから「別のツールで使う指示を、ここでも共有したい」と相談されました。名前を `CLAUDE.md` にすれば済むのでしょうか。本文は同じでも、どこから見つけたか、何が会話へ渡ったか、モデルまで変わっていないかは別に確かめる必要があります。

このChallengeでは、自分で小さな再利用可能な本文を設計し、**rootのCLAUDE.mdだけを使う本編**で、指示なし・常設・同本文の手動供給を比べます。HC-003の実施や原稿は前提にしません。このページに同じ受注承認の固定taskと必要なsourceをすべて用意しています。

## この機能とは

VS Codeは `CLAUDE.md` を常設指示として認識する互換機構を持ちます。「互換」とは、他の対応ツールでも扱う指示形式を利用するということです。たとえば、調査報告の習慣を短いMarkdownにしておく用途があります。完成した指示を受け取るのではなく、このあと必要な一文から自分で選びます。

**ファイル名を替えても、Claudeモデルや別harnessへ切り替わりません。** tool権限、承認設定、OSやfilesystemの権限、アプリの動作も変えません。この実験ではmodel / harness / toolsを固定し、互換形式で本文を供給することだけを扱います。

公式資料はroot `CLAUDE.md` のほか、workspaceの `.claude/CLAUDE.md`、homeの `.claude/CLAUDE.md`、`CLAUDE.local.md`、`.claude/rules` を説明しています。しかし本編で使うのはroot一つだけです。本文が同じでも、形式固有のmetadataや発見範囲、複数指示の優先順位まで同一とは主張しません。

出典: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)（文書確認: **2026-09-15**）。ここでの確認は文書の説明であり、別harnessへの移植や実際の本文投入を実証したものではありません。

## 向いていること / 向いていないこと

同じ作業規則を対応ツール間で共有したいとき、既存の形式を読み替えて保守する負担を考えたいときに向いています。常設しなくても毎回の依頼で十分なら、手動供給や追加なしを選んで構いません。

モデルの性能比較、別harnessの評価、隠れた個人設定の除去、toolやfilesystemへの許可を与える用途には向きません。複数場所へ同時にコピーすると、何が効いたかも、更新すべき正本も分かりにくくなります。業務上の答えやsecretを常設することも避けます。

## Starter Kit

Node.js 22以降、Git、Hubと自分の非公開Runtimeを扱う通常の参加権限、対応するVS Code / Copilotを用意します。rootの互換形式を利用できなければFallbackで設計と未実施理由を提出できます。別モデルの購入、別harnessの導入、管理権限、home設定の変更は不要です。Javaは静的に読むためDBやMavenも実行しません。

実アプリは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` です。[515-path inventory](../../catalog/source-baseline-paths.json)にある次の3ファイルを、Runtimeのbaselineから直接読みます。別Challengeの回答を資料にはしません。

| 読むpath | ここで確かめること |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `approve` の入口、呼び出すガード、続く処理の境界 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | 継承元の `require` の定義と委譲先 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | `require` とrole判定の分岐 |

`OrderService.approve` の呼出しから `require` の定義へ移り、さらに委譲先の分岐を読みます。入力がnullの場合や早く戻る道も確認し、role文字列一つだけで全体を言い切っていないかを問い直します。認証・認可と受注の業務条件は別の根拠としてまとめます。完成した承認可否の表は提供しません。

[Pack manifest](pack/manifest.json)の4素材は、全条件で同じbytesを `.hackathon/challenge/hc-004/` へ配置します。

| 不活性な素材 | 使い方 |
| --- | --- |
| [brief.md.template](pack/payload/brief.md.template) | sourceの所在と追跡の問い |
| [request.txt.template](pack/payload/request.txt.template) | 下の固定依頼全文 |
| [CLAUDE.md.template](pack/payload/CLAUDE.md.template) | 未完成の原稿。短い本文を自分で設計する |
| [comparison.md.template](pack/payload/comparison.md.template) | 意図と形式、凍結本文、環境、比較、提出の空欄 |

PackはJavaを複製しません。515-file baseline、2件の運用override、provenanceを保ち、sourceや既存testを変更しません。inventoryはpath-onlyの資料で、意味や実機動作を確認した証拠ではありません。

**固定入力は次の全文です。** 全条件へ同じsourceへのアクセスを与え、実データや利用者IDを足しません。

```text
固定source shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787 の受注承認を調べてください。

読む入口は次の3ファイルです。
- wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
- wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java
- wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java

OrderService.approveから共有のrequireへ進み、呼び出し先まで根拠をたどってください。認証・認可の条件と、受注の業務条件を分け、実装から分かること、推論、未確認事項をfile + symbol付きで説明してください。この範囲で判断できない点と、次に確認したい根拠も挙げてください。

静的な読解だけを行います。実在の利用者や受注の承認可否を決めず、実データ・認証情報を使わず、DB・Web・バッチを起動しないでください。アプリ、test、設定を変更せず、未実行の検証を成功と書かないでください。比較用のStarter、participant原稿、Evidenceを追加の調査資料として探索しないでください。
```

## Open Question

形式を持ち込むとき、変えてよいものと固定したいものをどう分けますか。本文の意図が伝わること、貼り直しが減ること、複製の保守が増えないことのうち、何を確かめたいでしょうか。

回答が同等でも、形式を増やす価値がないと分かることがあります。逆に文書を保存できただけでは、互換機能が使われたとは言えません。この二つを分けて判断できる基準を選びます。

## Design Time

ファイルへの保存はBuildの手順2でPackを適用した後、比較の会話を始める前に行います。apply前のRuntimeへ原稿を置かず、ここではまず設計する内容を決めてください。

1. 空のStarterを読み、複数の調査で使いたい意図を一つ選ぶ。短い規則を自分で書き、足す必要がある場合だけもう一つ加えます。roleの答え、今回だけの依頼、secretは書きません。
2. **形式と意図の対応**を自分の言葉で整理する。「本文で伝えること」「保存場所が担うこと」「この比較では確認できないmetadata・優先順位」を分け、root一つに絞る理由を書く。別形式への完全な変換表ではありません。
3. 出力前に観測基準を2〜3個決める。意図に沿った読み方、出典の正しさ、未確認の保持、貼り直しの手間などから選び、複製の更新担当と削除・見直しの条件も決めます。
4. 選んだ本文全文をcustomized用Runtimeの `participant/hc-004/root-instructions.md.template` へ保存して凍結する。UTF-8、改行、SHA-256、日時を記録し、manual-equivalentへ同じbytesを渡します。baseline側へ選択本文を置いたり貼ったりしません。
5. 試作と比較を分ける。比較後に本文を改善したくなったら、同じrunを上書きせず、独立した新しい比較として扱います。modelやharnessを替えて結果を救済しません。

凍結原稿・activeファイル・Evidenceのコピー先が既に存在する場合は、コピーを中止します。上書きを選ばず、既存の比較を保管したまま新しいRuntime repository / runでやり直してください。

`.template` は自動でactive化しない名前であり、AIから見えない領域という意味ではありません。選択本文やStarterを意図せず読まれたら混入として記録します。設計と凍結本文は、回答保存後に各Evidenceの対応欄へ残します。

## Build

### 1. Hubで計画とPackを用意する

次は**Hub checkoutのroot**のコマンドです。`team-sora` とrun名は公開可能な識別子へ置き換えます。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-004 --condition baseline --team team-sora --run run-b
node scripts\plan-run.mjs --dry-run --challenge HC-004 --condition customized --team team-sora --run run-c
node scripts\plan-run.mjs --dry-run --challenge HC-004 --condition manual-equivalent --team team-sora --run run-m
node scripts\build-pack.mjs --challenge HC-004 --output .runtime/packs
```

dry-runは表示だけです。repositoryの作成や注入はしません。buildの出力は `.runtime\packs\hc-004-v1` と隣接するhashです。`--output` にはWindowsでも専用の文字列 `.runtime/packs` を渡します。既存出力があれば上書きせず止めます。別の出力pathを選ぶことはできないので、再buildが必要なら新しい専用のHub checkoutを使ってください。Hubにactiveな `CLAUDE.md` を作りません。

### 2. 条件ごとの独立したRuntimeを準備する

[Getting Started](../../docs/getting-started.md)に従い、[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template)から**3つの専用の非公開repository**を作ります。それぞれを別workspace、新規会話、新規Profileで開きます。repository rootをworkspace rootにし、別branchだけで比較を済ませません。

各**Runtime checkoutのroot**で、`$Pack` を実際のPackの絶対pathへ置き換えます。`$Condition` はそのrepositoryの `baseline`、`customized`、`manual-equivalent` のいずれか一つです。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-004-v1'
$Condition = 'baseline'
git switch -c "hc-004-$Condition"
npm run verify
node .hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition
```

`.hackathon/template.json` がRuntime v1を示すことと検証結果を確認します。consumerやmarkerがなければ止めます。Hubのrun名とRuntimeのrun識別子を対応させ、apply後は同じ名前付きbranchで続けます。`.hackathon/run.json` を手で変えません。

`chat.useClaudeMdFile` の観測値、client / version / host / channel、指定・実効model、harness、effort、tools、承認範囲を記録してください。**本編はmodel / harness / toolsを固定**し、互換性を理由に切り替えません。既存設定を書き換えて条件を作る手順ではありません。

別repository、workspace、会話、Profileを用意しても、home、User、組織、Memory由来の指示はそれだけでは隔離できません。特にhomeの `.claude/CLAUDE.md` 等が残る可能性を「素の状態」と呼ばず、確認できた範囲と未知の影響を記録します。homeや個人設定を削除・退避して帳尻を合わせません。

### 3. root一つだけに限定する

| condition | 参加者が追加できるもの |
| --- | --- |
| `baseline` | 実行後のEvidenceのみ。root CLAUDE.mdなし |
| `customized` | `participant/hc-004/root-instructions.md.template` と、同じ本文のroot `CLAUDE.md` |
| `manual-equivalent` | 同じ `participant/hc-004/root-instructions.md.template` のみ。root CLAUDE.mdなし |

customizedでは、凍結した本文を**新規の**root `CLAUDE.md` へコピーします。既存ファイルを上書きしません。`.hackathon/challenge/` 内のStarterも編集・改名せず保持します。保存したbytesを照合する例です。

```powershell
Get-FileHash -Algorithm SHA256 .\participant\hc-004\root-instructions.md.template
Get-FileHash -Algorithm SHA256 .\CLAUDE.md
```

activeにするのはroot CLAUDE.mdだけです。**AGENTS.md、`.claude/CLAUDE.md`、CLAUDE.local.md、Rulesを同時に置きません。** 他のInstructions、役割定義、settingsも追加しません。`allowedMutations: []` を保ち、Javaや既存testを変更しません。ファイル形式の比較がmodel・harness・tool・filesystem変更の比較へすり替わらないようにします。

## Compare

凍結後、各repositoryのfresh conversationで一度ずつ始めます。source revision、固定依頼全文、3ファイルへのアクセス、model / effort / harness / toolsをそろえます。

| 条件 | 指示の供給 | 会話へ送るもの |
| --- | --- | --- |
| Baseline (`baseline`) | root CLAUDE.mdなし | 固定依頼全文のみ |
| Customized (`customized`) | root CLAUDE.mdだけ | 同じ固定依頼全文のみ |
| manual-equivalent | root CLAUDE.mdなし、手動供給 | 選択した同じ本文全文、その後に同じ固定依頼全文 |

manual-equivalentへ貼るのは**参加者が選んで凍結した本文全文**です。Starterの括弧書きや要約、公開checklistだけ、Customizedの回答で置き換えません。送信全文、順序、改行等の差を保存します。本文hashの一致は保存した文章の一致であり、metadata、priority、内部contextの扱いの一致ではありません。

同じ十分な依頼とsourceをBaselineにも渡し、Customizedだけに追加ヒントや以前の回答を与えません。最初の回答を未修正で残し、必要な追加sourceが判明したら未確認として残すか、全条件を新しい入力でやり直します。

ここで測れるのは、この固定環境での供給方法と、事前に選んだ読み方・保守の負担です。HC-003との勝敗や別harnessの可搬性は測りません。選択本文の混入、model変更、外部指示の差を制御できなければ、結果を `incomparable` として残せます。

## Evidence

回答保存後、各Runtimeで `.hackathon/challenge/hc-004/comparison.md.template` を `.hackathon/evidence/hc-004/comparison.md` へ新規コピーします。Evidenceは**run-state**として `evidenceRequirements` と `submissionFiles` に宣言され、`allowedAdditions` へは重複登録していません。全見出しを残して記入してください。

既存のEvidenceにはStarterをコピーし直しません。同じrunの記録に追記する場合は、前の出力と判断を残して既存のEvidenceを編集します。比較をやり直す場合は別repository / runに分けます。

**保存・発見・本文投入・出力**を別々に記録します。rootのpathと本文hashは保存の証拠です。clientの参照表示は確認できた発見の範囲を示しますが、それだけで全文投入を証明するとは限りません。投入を確認できなければ `not-observed` と書き、AIの自己申告や回答の似かよりで補いません。手動貼付も送信できた全文を残し、内部処理を推測しません。

出力欄には未修正の回答、引用先、読み落とし、未確認を保存します。現conditionだけを実施事実で埋め、他条件はrepository / PRリンクまたは未実施とします。本文の意図と形式の対応、採らなかった案、更新担当、貼付の負担も残してください。

client / host / OS / channel / version、指定・実効model、harness、effort、tools、承認範囲、workspace root、Profile、他のhome / User / 組織 / Memory指示を確認できた範囲で記録します。不明は `unknown` とし、個人情報を新たに収集しません。commandと整数exit code、未実行の理由も保存します。

Runtimeの静的検証は `runtimeBehavior` と `educationalEffect` を `not-observed` のままにします。Pack検査の成功から、CLAUDE形式の実機投入や教育効果を主張しません。

## Submit

Evidence記入後、**各Runtime checkoutのroot**でapplyと同じPackを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $Pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .hackathon\scripts\export-submission.mjs $Pack
```

これはRuntimeの[onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)のCLIです。エラーを無視して進まず、不活性な `submission/` bundleを点検します。機能を実行できないconditionも、理由をEvidenceへ書いて提出できます。

各conditionのRuntime PRに許可された原稿とEvidenceを残し、[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)へcondition → Runtime URL / PR / runの対応を記します。`Challenge-specific design` には形式と意図の線引き、rootだけにした理由、再利用・保守の工夫、限界を書いてください。

[Submission Guide](../../docs/submission-guide.md)に従い、secret、個人情報、private code、local絶対pathをIssueへ転載しません。activeファイルはRuntimeだけに置きます。任意ガイドはOPTIONAL欄へ分離し、未実施でも本編を提出できます。

## Judging

共通の比較・安全・再現性に加え、本文の意図と形式の働きを混同していないか、model / harnessを固定したか、同じ本文を手動供給したか、保存だけを投入成功と呼んでいないかを見ます。形式やコピーの数、別モデルの利用は加点しません。

事前基準で改善した `improved`、差のない `equal`、冗長化などが増える `worse`、条件がそろわない `incomparable`、環境・権限で進めない `blocked`、対応機能がない `unsupported` はすべて有効です。互換形式を増やさず固定依頼だけにする「追加不要」の結論も歓迎します。

## Bonus Mission

実機条件を増やさず、同じ本文を二か所へ複製したと仮定して、更新漏れを見つける運用を紙上で考えます。どちらを正本にし、どこを削除するかを説明してください。本編へ二つ目を追加せず、保守案を可搬性の実証として数えません。

## Support / Fallback

互換形式を利用できなければ同じ本文の手動供給で学習できますが、それをroot CLAUDE.mdの成功とは呼びません。非対応は `unsupported`、環境や権限で開始できなければ `blocked`、model / harness / 外部指示をそろえられなければ `incomparable` として、設計と未実施理由を残します。

[localとRulesの準備ガイド](optional/claude-variants.md)は、本編とは別の任意の非実行ガイドです。localとRulesは別実験として計画し、ここで有効化しません。Rulesの `paths` は配列で、`applyTo` へ置き換えるものではありません。`local` という名前はGit除外の証明でもありません。homeの変更やactive Rules追加で本編の制約を回避しません。

検証・export・PR保存を先に済ませ、使い捨て環境の**自分が追加したものだけ**を整理します。既存のhomeや個人設定を消さず、起動processがあれば自分の分を停止し、repositoryの保管・archiveは人が判断します。cleanupは助言であって自動実行ではありません。[Runtime repository guide](../../docs/runtime-repository-guide.md)と[Support and Fallbacks](../../docs/support-and-fallbacks.md)も参照してください。
