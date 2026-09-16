# HC-005 個人・チーム・タスクの指示を整理しよう

## Challenge Story

架空の「はるか保守チーム」では、説明を読みやすくする好み、仲間と合意した記録の約束、今日だけの依頼が、一つの長いメモに混ざっています。そのまま別の作業へ持ち込むと、誰のためのルールなのか、誰に相談して直すのかが分からなくなります。

あなたはこのメモを整理する担当です。朝の引継ぎと、別チームとの文書づくりという**二つの架空の場面**で、同じ8枚のカードを読み直します。置き場所を三つに分けること自体が目的ではありません。「残す」「分ける」「その依頼でだけ伝える」「まだ共有しない」などを選び、理由を説明できる設計にしましょう。

本編は、初期の分類案と、方針を考え直した後の案を比べる**設計比較**です。User指示や組織設定を有効化せず、AIも呼び出しません。このページと同梱素材だけで完結し、以前のChallenge、Labs、講師の解答は必要ありません。

## この機能とは

Instructionsは、AIへ繰り返し伝えたい方針を文章として保守する仕組みです。ここでいうscopeは「誰の、どの作業に届けたいか」という範囲です。文章の保存場所、変更を判断する所有者、実際に読まれる入口は別々に考えます。

- **個人の指示**は、自分の読み方や作業上の好みを複数の作業へ持ち運ぶ候補です。他の人や別のチームまで同意したとは限りません。
- **チームの指示**は、合意した範囲の仲間が保守する候補です。Repositoryで共有する場合とorganizationで共有する場合は、対象、承認、対応製品が違います。
- **そのタスクの依頼**は、今回の読者、締切、出力の用途などを伝えます。次の作業にも残す必要がなければ、常設の設定を増やさない選択ができます。

たとえば「短い段落で読みたい」と「今日の連絡だけは一枚の表にする」が重なったら、ファイルを増やす前に、対象読者と今回の目的を確認します。これは一般例であり、カードの配置先を指定する答えではありません。広いscopeほど優先される、または複数の指示が必ず一定順序で結合される、とは考えないでください。

また、選択範囲のreview、commit message、PR descriptionには**用途別の生成入口と設定**があります。通常Chatへの一回の依頼とは別です。本編では文章と設定の草稿だけを扱い、保存による発見・本文投入や生成機能の動作は観測しません。

製品説明の根拠は [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions) と [GitHub Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions) です。文書確認日は2026-09-15、実機は未確認です。組織指示についての二資料の説明差は、後述の任意ガイドでも未解決のまま扱います。

## 向いていること / 向いていないこと

**向いていること**

- 同じ説明を何度も書く前に、誰の約束なのか、どこまで再利用するのかを整理すること。
- 表示上の好みと業務上の約束を分け、担当者の交代や期限切れに備えること。
- 常設化の便利さと、別の作業への混入、重複更新、合意を取る費用を比べること。

**向いていないこと**

- scope名を当てただけで、正しい所有者や唯一の優先順位が決まったとすること。
- 一回限りの依頼にも必ず設定ファイルを追加すること。
- 設計案が整ったことを、User共有、organization適用、Copilotの出力品質、学習効果の実証とすること。
- 本編を理由に、既存のUser・HOME・組織・workspace設定を書き換えること。

## Starter Kit

SYNTHETIC_TRAINING_ONLY — 全カード、人物、チーム、場面、資料内の出来事は、このChallengeのために作った合成教材です。実アプリから導いた事実、実際の合意、参加者本人の設定ではありません。各カードと各場面にも合成ラベルがあります。

[Pack manifest](pack/manifest.json) は、両条件へ次の**同じ全文・同じbytes**を渡します。原本は `.hackathon/challenge/hc-005/` に不活性な `.template` のまま配置されます。

| 素材 | 読む目的 |
|---|---|
| [cards.md.template](pack/payload/cards.md.template) | R01〜R08の発言全文。分類先や正解ラベルは付いていません |
| [situations.md.template](pack/payload/situations.md.template) | S1・S2の読者、資料、固定タスク。どちらの条件でも両方を扱います |
| [request.txt.template](pack/payload/request.txt.template) | 条件に共通の依頼全文。片方だけ短縮しません |
| [classification.md.template](pack/payload/classification.md.template) | 自分で記入する分類・場面別の設計票 |
| [policy.md.template](pack/payload/policy.md.template) | scope・所有・再利用・見直しを考える空の方針票 |
| [instruction-drafts.md.template](pack/payload/instruction-drafts.md.template) | 自分の指示本文を書く空欄。製品へ読み込ませません |
| [generation-settings.json.template](pack/payload/generation-settings.json.template) | 現行の三つの用途別キーと空配列。設定を有効化するファイルではありません |
| [comparison.md.template](pack/payload/comparison.md.template) | 条件ごとのEvidenceひな型 |

本編の道具は、テキストを編集できる環境、Git、Node.js 22以降です。通常のPrivate Runtime repository・PR・Hub Issueへの参加権限は別途必要ですが、Copilotの利用権、organization owner権限、Preview、拡張の導入は不要です。Java、Maven、DB、アプリの起動も使いません。

素材のsource種別は `synthetic`、`sourcePaths` は `[]` です。それでもRuntimeの515-file baselineとprovenanceの検査は残ります。固定sourceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` で、source tree SHA-256は `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。Javaの複製や編集はせず、template管理の二つの運用overrideにも触れません。

## Open Question

**同じ人が二つの場面で働くとき、何を持ち運び、何を置いていけば、読みやすさと合意の境界を両立できるでしょうか。**

- 一枚のカードを、目的の違う二つの文章に分けた方がよいでしょうか。それとも一か所で管理する方がよいでしょうか。
- 自分だけには便利でも、ほかの読者には負担になるルールをどう扱いますか。
- まだ合意されていない提案を、誰が、どの時点で見直せるようにしますか。
- 再入力の手間を減らす利益と、適用範囲を広げ過ぎる危険をどう比べますか。

配置先を増やす、三分類を同じ数にそろえる、すべてを常設化する、といった完成形は要求しません。追加しない案にも説明の余地があります。

## Design Time

1. ページ全体と、カード・場面・共通依頼を先に読んで構いません。Baselineは「機能を知らない人」の測定ではなく、同じ十分な資料から作った**最初の自分の案**です。
2. 比較前に評価軸を二つ以上決めます。たとえば、対象外の読者へ届くおそれ、所有者に相談できるか、同じ文を直す場所の数、例外の説明のしやすさです。「適切そう」という感想だけにならない確認方法も書きます。時間を測るなら、読む時間と書く時間の扱いをそろえます。
3. `baseline` でR01〜R08をすべて検討し、S1・S2それぞれの方針と読者向け短文案を分類票へ記入します。分割、保留、採用しない判断も理由を残し、この初期案を凍結します。
4. `scope-design` では同じ素材から、先に配置・所有・再利用の方針を設計します。対象と対象外、変更を相談する相手、期限、矛盾したときに人へ確認する条件を決め、その方針で分類票を作り直します。先の完成本文は、両案を凍結して比較するまで貼り込みません。
5. 見直した案を支える指示本文を自分で書きます。個人向け、合意したチーム向け、その依頼向けに何を残すか、あるいは新しい常設指示を作らないかを選びます。製品の優先順位を推測して衝突を隠さず、確認が必要な点を残してください。

用途別設定の草稿は、review・commit message・PR descriptionのうち**一つを選ぶか、追加なし**にします。選んだキーの配列に `{"text": "自分で設計した本文"}` という形で書き、使わないキーは取り除きます。追加なしなら `{}` と理由を残します。三つを一括で設定する演習ではありません。公式には `file` によるMarkdown参照もありますが、本編は未宣言の参照ファイルを増やさず `text` だけで完結させます。

## Build

### 1. Hubで計画だけを確認する

**Hub checkout** のrootで、次を実行します。両方ともread-onlyのdry-runで、remote作成、Pack適用、製品の起動はしません。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-005 --condition baseline --team team-haru --run design-01
node scripts\plan-run.mjs --dry-run --challenge HC-005 --condition scope-design --team team-haru --run design-02
```

### 2. 条件ごとに別のRuntimeを用意する

[Getting Started](../../docs/getting-started.md) に従い、[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から**二つの新しい非公開repository**を用意します。各条件で新しいworkspace・会話・profileを使い、名前のあるbranchで開始します。repositoryやprofileの分離だけでHOME、User、組織、Memoryが消えるわけではありません。本編ではそれらを操作せず、文書を手作業で設計します。

**Runtime checkout** のrootで実行します。`$pack` は手元のHub内のPack **directory**へ置き換えてください。`manifest.json` 自体のpathではありません。`.hackathon/template.json` がversion 1であることも確認します。

```powershell
$pack = 'C:\work\hub\challenges\hc-005\pack'
git status --short --branch
git switch -c hc-005-baseline-design-01
npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-haru --condition baseline
```

もう一方の**未使用のRuntime checkout**では、同じPackを指定し、別の名前付きbranchで同じpreflightを行います。

```powershell
$pack = 'C:\work\hub\challenges\hc-005\pack'
git status --short --branch
git switch -c hc-005-scope-design-design-02
npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-haru --condition scope-design
```

各コマンドの終了codeを確認し、既存変更やbranch名の衝突、検査失敗があれば先へ進みません。このapplyは汚れたtemplateや既存の配置先を拒否し、不活性なStarterだけをコピーします。`branchSafe: false` のrunはapplyしたbranchにbindingされるため、提出までそのbranchを使います。dry-runの `--run` は提案用の識別子です。実際のrun IDはapply後の `.hackathon/run.json` で確認して記録し、手編集しません。

### 3. 許可された草稿だけを新規作成する

`.hackathon/challenge/hc-005/` の原本を直接編集・renameせず、該当ひな型を次の場所へコピーしてから書きます。フォルダーがなければ作成します。

表のコピー先は未作成であることを先に確認し、既存ファイルが一つでもあれば、コピーを止めます。以前の草稿やEvidenceにStarterを重ねて上書きせず、強制コピーもしません。今回のrunで新規作成した草稿を編集することとは区別してください。別の比較を始める場合は新しいRuntimeを使い、既存の成果物やactive artifactを削除して開始条件を作りません。

| 新規作成するpath | baseline | scope-design |
|---|---|---|
| `participant/hc-005/classification.md` | 初期案 | 方針を適用した見直し案 |
| `participant/hc-005/policy.md` | 作らない | 選んだ方針と代案・tradeoff |
| `participant/hc-005/instruction-drafts.md.template` | 作らない | 個人・チーム・今回の依頼の本文草稿、または追加しない理由 |
| `participant/hc-005/generation-settings.json.template` | 作らない | 一用途の設定草稿、または `{}` |
| `.hackathon/evidence/hc-005/comparison.md` | 今回の記録 | 今回の記録 |

Evidenceは最後のpathに置くrun-stateです。参加者ファイルの追加許可とは別にmanifestへ宣言しています。すべての必要な本文はこの許可範囲へ収め、activeな `.github`、`.vscode`、User・HOME・組織設定にはコピーしません。`.template` の草稿は不活性のままです。

各Runtimeで進捗を検査します。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

コマンドの意味と失敗時の境界は [Runtime repository guide](../../docs/runtime-repository-guide.md) と、Runtimeの [.hackathon/README.md](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md) にあります。HubとRuntimeのコマンドを逆のcheckoutで実行しないでください。

## Compare

| 条件ID | このページでの呼び名 | すること |
|---|---|---|
| `baseline` | Baseline | 完全なカード・場面・依頼から初期分類とS1・S2の短文案を作る |
| `scope-design` | Customized | 同じ素材で方針を明文化し、分類、短文案、不活性な指示・設定草稿を作る |

Customizedは**scope設計を見直した条件の呼称**であり、製品機能をactivatedにした意味ではありません。条件は二つ、各条件内の場面はS1・S2の二つです。場面数を独立した実験条件やAI実行回数に数えません。

固定するのはR01〜R08の全文、S1・S2の全文、共通依頼、評価軸、使える資料です。初期案だけ資料を省略しません。変更するのは、明示した方針で整理し、草稿として再利用を設計する方法です。入力の同一性はファイルのSHA-256等で確認し、案を調整したら版と比較時点を記録します。

両方を凍結してから、同じカードの扱い、短文案、更新箇所、未解決事項を並べて理由を読み比べます。**同じカードを再読した人には持越し（carryover）があります。** 別repository・新規会話でも、人の記憶や練習は消えません。これは未見試験、独立したA/B実験、User共有やCopilotの効果測定、教育効果の証明ではありません。

事前の観点で案が整理されたなら設計上の `improved`、変更不要なら `equal`、手間や例外が増えたなら `worse` です。固定入力や評価軸が変わったら `incomparable` と理由を残します。Runtime準備ができなければ `blocked`、提出環境が対応していなければ `unsupported` も有効です。AIや追加の機能利用権がないこと自体は、本編のblockではありません。

## Evidence

各Runtimeの `.hackathon/evidence/hc-005/comparison.md` を記入します。同じひな型でも、今回のcondition、run ID、参照したPackの版、入力の同一性、実際に作ったpathを自分の記録へ置き換えます。ひな型をコピーしただけでは提出Evidenceになりません。

- R01〜R08の検討漏れと、S1・S2の両方を扱ったことを確認します。配置先に正解表はありません。
- 仮説、初期案と見直し案の違い、採用しなかった代案、判断を保留した点を記録します。
- 草稿の**保存**、製品による**発見**、モデルへの**本文投入**、生成入口の**呼出し**、**出力**を別にします。本編で確認できる保存は「不活性な草稿を保存した」ことだけです。ほかは `not-observed`、AI利用は `not-used` とします。
- User指示を別の作業でも利用できた、organizationの指示が届いた、設定キーが動いた、といったreceiptは作りません。短文案は人の設計物であり、AI出力ではありません。
- 入力を再読した順序、carryover、未検証の製品挙動を明記します。仮のmodel名、架空の所要時間、テスト成功で空欄を埋めません。

Runtimeの静的検査が通っても、内容の妥当性を自動採点したことにはなりません。exporterの `runtimeBehavior` と `educationalEffect` は `not-observed` のままです。

## Submit

各RuntimeでEvidenceを完成させ、同じPack directoryを指定します。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

`submission/` のbundleは不活性なflat名へexportされます。自作のJSONをRuntime bundleの代わりにせず、内容と秘匿情報の有無を確認してください。

条件ごとのRuntime PRに、その条件の分類票、`scope-design` の方針と草稿、Evidence、再現手順を含めます。共有設定の有効化や文書生成機能のためのPRは作りません。続いてHubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に、次をまとめます。

- `baseline` / `scope-design` と、それぞれのrepository・PR・実run IDの対応。
- Baseline / Customizedの案、同じ二場面で比べた観点、outcomeと制約。
- `Challenge-specific design` に、scope、所有者、再利用する文章、追加しなかった設定、更新・撤去の方針。
- 任意ガイドは未実施でよく、読んだ場合も任意欄だけへ分けること。

通常の提出手続きは [Submission Guide](../../docs/submission-guide.md) に従います。合成教材だけを扱い、個人のHOMEのpath、既存User指示、実組織の情報を転載しません。

## Judging

- 同じ完全な入力で二つの場面を検討し、変更した設計要因を説明できるか。
- scopeの名前だけでなく、対象外、所有者、合意、期限、相談する条件を考えたか。
- 同じ本文を再利用する利益と、別の読者への混入、保守負担の両方を比較したか。
- 分割・保留・追加なしなど、自分の判断と代案のtradeoffを根拠付きで説明したか。
- 草稿の保存と実際の発見・投入・利用を混同せず、carryoverと未観測を残したか。

三つの分類の個数、設定ファイルの数、機能の利用回数、初期案より良くなったかだけでは採点しません。唯一の正解配置や、講師だけが持つ判定表はありません。

## Bonus Mission

凍結済みのS1・S2の案を変えずに、同じ文を二か所以上で更新する必要がある部分を探します。「共通化する案」と「用途ごとに複製を許す案」の保守上の違いを短く追記してください。第三の条件や実機操作は増やさず、Bonusの考察を本編の比較結果へ後付けしません。

## Support / Fallback

紙やテキストエディターだけでも分類と方針づくりを完了できます。提出用Runtimeをまだ用意できない場合は、草稿を手元で保ち、提出手続きだけが `blocked` であると分けて報告してください。Runtimeのdirty state、version不一致、既存overlayが原因なら、許可範囲を広げず停止し、新しいRuntimeでやり直します。

次の三つは**任意の準備確認ガイド**です。本編の追加conditionでも、実機実行の許可でもありません。準備条件は `not-checked`、既知のRuntime制約は `blocked`、実機状態は `live-unobserved` のままです。

- [User指示の保存元と隔離を確認する](optional/user-scope.md)
- [用途別生成の入口とRuntime制約を確認する](optional/task-generation.md)
- [組織指示の承認と対応範囲を確認する](optional/organization-scope.md)

特に通常の `.vscode/settings.json` はRuntime v1ではgitignoredです。例外は `.vscode/mcp.json` だけです。設定をforce-addしたり、別の許可ファイルへ偽装したりしません。Userや組織の指示へコピーして本編の成果に置き換えることもありません。

終了時はbaseline不変とexportを確認し、今回自分が開始したprocessがあれば停止します。archiveの要否は参加者が確認します。cleanupは自動実施済みの宣言ではありません。既存User・HOME・組織設定を消去せず、自分の追加分だけを管理します。本編でそこへの追加はありません。

執筆時の構文確認には [LAB-05の原稿](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/docs/labs/lab-05-shared-task-instructions.md)、[表示指示のraw template](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/examples/instructions/reader-style.instructions.md.template)、[用途別設定のraw template](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/examples/comparison/generation-instructions.json.template) を参照しました。これらは執筆者向けの由来であり、参加者の追加教材や解答ではありません。本編のカードと設計票は新規の合成教材です。
