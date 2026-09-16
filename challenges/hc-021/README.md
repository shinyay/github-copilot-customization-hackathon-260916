# HC-021 競合するInstructionsの犯人を見つけよう

## Challenge Story

チームは、2行だけの表示カードをCopilotに整形してもらおうとしています。ところが、規則ファイルを置いたはずなのに表示が変わらないこともあれば、同じ規則を2か所へ置いたあとに、どちらが使われたのか説明できなくなることもあります。

このChallengeでは「期待どおりの答えを出すまで指示を増やす」のではなく、**配置、発見、本文の利用、出力の従い方を順番に切り分ける診断**を設計します。正しい場所へ置いたことだけで本文利用を断定せず、よい出力だけから指示の投入元を逆算しません。

このページは単独で読めます。以前のLABやChallengeの設定、回答、個人用Instructionsは使いません。題材はすべて無害な合成表示カードで、Javaの業務仕様や秘密情報を扱いません。

## この機能とは

Instructionsは、Copilotへ作業上の読み方や出力上の規則を伝えるMarkdownです。ただし、次の4段階は別々の事実です。

1. **placement（配置）** — ファイルがどのpath・拡張子で保存されているか。
2. **discovery（発見）** — clientがそのファイルを候補や参照元として認識したか。
3. **content use（本文利用）** — 規則の本文が実際の会話へ供給されたと確認できたか。
4. **output compliance（出力の従い方）** — 回答が規則どおりか、矛盾を指摘したか、別の形になったか。

たとえば `.github/copilot-instructions.md.template` は配布には安全な不活性名ですが、通常のRepository Instructionsとして有効な名前ではありません。`notes/copilot-instructions.md` はMarkdownとして読めても、文書化された配置とは異なります。`.github/copilot-instructions.md` は文書化された配置ですが、保存だけで発見・本文利用・出力準拠まで証明するわけではありません。

複数のInstructionsが利用される場合、本文は組み合わされ得ますが、ファイル名や保存順による一般的な優先順位は保証されません。このChallengeでは、同じ本文の重複と、一行だけ反対の本文を診断します。どちらの見出しが「勝つか」を当てる課題ではありません。

Instructionsはtool権限、OS権限、承認、アクセス制御を追加しません。出典は [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)（文書確認日: 2026-09-15）です。文書を確認したことと、参加者環境での実発見・実投入は別です。

## 向いていること / 向いていないこと

**向いていること**

- 指示ファイルを置いたのに、どの段階で止まったか分からないとき。
- 不活性な配布原稿、標準外の配置、有効な配置を同じ本文で比較するとき。
- 同文重複と一行矛盾を、別々の問題として切り分けるとき。
- 原因候補、反証、未観測、最小修正案を次の担当者へ渡すとき。

**向いていないこと**

- 特定の見出しを必ず出させるまで試行を繰り返すこと。
- この小さなfixtureから、すべてのInstructions形式の優先順位を決めること。
- 出力が似ていることだけで、本文が投入されたと断定すること。
- 個人・home・組織の指示を削除し、「完全に無設定」と見せること。
- Instructionsを権限や安全な実行の仕組みとして扱うこと。

## Starter Kit

[Pack manifest](pack/manifest.json) は、次の固定素材をRuntimeへ不活性な `.template` として配置します。PackはactiveなInstructions、完成した設計、完成Evidenceを作りません。

`SYNTHETIC_TRAINING_ONLY` — source種別は `synthetic`、`sourcePaths` は空です。表示カード、依頼、規則、状況はこのChallenge用の合成教材であり、実アプリの仕様や実Copilotの観測結果ではありません。Runtime v1の固定515-file baselineとprovenance検査は残りますが、この課題ではJavaを読みません。基準sourceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`、515-file tree SHA-256は `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。

予定PackはschemaVersion / challengeVersion / minimumTemplateVersionがすべて1、`allowedMutations: []`、condition strategyはseparate-repository、`branchSafe: false` です。

全7条件へ、次の9個の不活性なpayloadを同じbytesで配る予定です。

| payload leaf | 用途 |
|---|---|
| `brief.md.template` | 4段階の診断境界と安全条件 |
| `request.txt.template` | 全条件で同じ固定依頼 |
| `packet.txt.template` | 2行の固定表示カード |
| `rules.md.template` | 見出しと箇条書き方法を示す同一規則 |
| `variant-a.instructions.md.template` | 同文重複に使うscoped原稿 |
| `variant-b.instructions.md.template` | metadataを保ち、見出し一行だけ反対にした原稿 |
| `case-plan.json.template` | 条件・配置・空の観測欄。講師の結論は含めない |
| `design.md.template` | 調査順、仮説、反証、最小修正の設計票 |
| `evidence/comparison.md.template` | 完成回答を含まないEvidenceひな型 |

Pack適用後の配置先は `.hackathon/challenge/hc-021/starter/` です。PackはactiveなInstructions、完成した設計、完成Evidenceを作りません。

固定packetは全条件で次の2行です。

```text
青いノートを机に置きます。
白いカードを隣に置きます。
```

固定taskは、この2行を文字と順序を変えずに表示し、業務分析、source引用、ファイル変更、tool・command・別Agent・network実行をしない依頼です。`participant/hc-021/display.txt` を対象にし、競合条件だけ別packetへ差し替えません。

exact condition IDsは次の7件です。

`baseline`, `inert`, `misplaced`, `valid`, `manual`, `duplicate`, `conflict`

## Open Question

**表示が想定と違うとき、どの順番で何を調べれば、変更を最小限にして原因候補を減らせるでしょうか。**

最初にpathを見る案、clientの参照表示から見る案、手動全文との比較を先に置く案など、複数の進め方があります。実投入を観測できない環境でも、配置不一致を根拠付きで説明し、次の確認を小さく設計できます。

「有効なpathへ全部移す」「矛盾する方を削除する」を最初から正解にしません。観測できること、まだ観測できないこと、修正で変わる要因を説明できる問いにしてください。

## Design Time

比較用の回答を見る前に、次を `participant/hc-021/design.md` へ決めます。

1. placement → discovery → content use → output complianceをどの順番で確認するか。
2. 各段階で使う直接Evidenceと、推測に留める項目。
3. `baseline` から `valid` までの配置診断と、`duplicate` から `conflict` までの競合診断を別々に読む方法。
4. `valid` と `manual` へ渡す規則本文を同一にする方法。manualでは要約やvalidの回答を使いません。
5. duplicateとconflictで同じにするfrontmatter、`applyTo`、path、依頼、packetと、反対にする一行。
6. 比較不能にする条件。例: model、tools、外部指示、packet、本文bytes、workspace rootが揃わない。
7. 最小修正案と再確認手順。今回の測定runを変更せず、修正後の試行は別runにします。

原稿はUTF-8、BOMなし、LFで凍結し、SHA-256を記録します。全variantがPack内に存在することは、全variantを会話へ送ってよい意味ではありません。選ばれない原稿、case-plan、他条件の出力をChatへ混ぜません。

## Build

### Hub checkoutで統合状態を確認する

次のコマンドは、**Hub checkout** でconditionごとの計画とPackを確認します。

```powershell
$Runs = [ordered]@{
  baseline  = 'hc021-baseline-01'
  inert     = 'hc021-inert-01'
  misplaced = 'hc021-misplaced-01'
  valid     = 'hc021-valid-01'
  manual    = 'hc021-manual-01'
  duplicate = 'hc021-duplicate-01'
  conflict  = 'hc021-conflict-01'
}
foreach ($Condition in $Runs.Keys) {
  node .\scripts\plan-run.mjs --dry-run --challenge HC-021 --condition $Condition --team team-sora --run $Runs[$Condition]
}
node .\scripts\build-pack.mjs --challenge HC-021 --output .runtime/packs
```

dry-runは計画表示だけで、repository作成、Pack適用、Instructions有効化を行いません。build済み出力は `.runtime\packs\hc-021-v1` ディレクトリです。既存出力を削除・上書きして作り直しません。

### conditionごとに独立したRuntime checkoutを用意する

[Getting Started](../../docs/getting-started.md) に従い、Runtime templateから**7つの新しい非公開repository**を用意します。各conditionで別repository、別の名前付きbranch、fresh workspace、fresh conversation、可能なら専用profileを使います。repositoryやprofileだけでhome、User、組織、Memoryが消えたとはしません。

各Runtime checkoutで、対応するconditionを一度だけ適用します。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-021-v1'
$Condition = 'baseline'
$RunIds = @{
  baseline  = 'hc021-baseline-01'
  inert     = 'hc021-inert-01'
  misplaced = 'hc021-misplaced-01'
  valid     = 'hc021-valid-01'
  manual    = 'hc021-manual-01'
  duplicate = 'hc021-duplicate-01'
  conflict  = 'hc021-conflict-01'
}
$RunId = $RunIds[$Condition]
if (-not $RunId) { throw 'HC-021の固定conditionを選んでください' }
git status --short --branch
git switch -c "hc-021-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

`$Condition` とbranch名はそのrepositoryの1条件に対応させ、Hub dry-runの `--run` とRuntime applyの `--run-id` には同じ `$RunId` を使います。apply後にbranchを移動せず、`.hackathon/run.json` を手編集しません。既存ファイル、既存run、dirty state、template version不一致があれば停止します。

参加者が新規作成できる予定pathは次のとおりです。

| path | conditions |
|---|---|
| `participant/hc-021/display.txt` | 全7条件 |
| `participant/hc-021/design.md` | 全7条件 |
| `participant/hc-021/repair-plan.md` | 全7条件 |
| `.github/copilot-instructions.md.template` | `inert` |
| `notes/copilot-instructions.md` | `misplaced` |
| `.github/copilot-instructions.md` | `valid`, `duplicate`, `conflict` |
| `.github/instructions/hc021-display.instructions.md` | `duplicate`, `conflict` |

`baseline` は規則を配置・手動供給しません。`manual` はactiveファイルを作らず、凍結した `rules.md.template` の本文全文を固定taskの後へ貼ります。`duplicate` はvalidの規則と同本文のscoped原稿、`conflict` は追加側の見出し一行だけを反対にします。

`repair-plan.md` は測定中のファイルを変更する実行指示ではありません。修正を試す場合は新しい比較group・全条件・run IDを用意します。Java、既存test、Runtime設定、User/home/組織設定は変更しません。

## Compare

このページでは `baseline` を **Baseline**、残る6条件を目的の異なる **Customized** 診断条件と呼びます。Customizedが常に改善するという意味ではありません。

| condition | 規則の供給 | 主な比較 |
|---|---|---|
| `baseline` | 配置なし、手動供給なし | 十分な固定taskだけの基準 |
| `inert` | 同じ規則を `.github/copilot-instructions.md.template` に保存 | Baselineとの配置差 |
| `misplaced` | 同じ規則を `notes/copilot-instructions.md` に保存 | Baselineとの配置差 |
| `valid` | 同じ規則を `.github/copilot-instructions.md` に保存 | Baselineとの文書化path差、競合群のsingle |
| `manual` | active化せず同じ規則全文を手動供給 | `valid` と同本文・別供給経路 |
| `duplicate` | `valid` + 同じ本文のscoped原稿 | `valid` との同文重複差 |
| `conflict` | `duplicate` の追加側だけ見出し一行を反対にする | `duplicate` との一行矛盾差 |

全7条件でpacket、固定task、全variantの配布集合、版、harness、指定・実効model、effort、tools、承認をできるだけ揃えます。保存hashが同じでも、実際の投入本文が同じとは限りません。候補表示が同じでも、本文利用や出力は別に記録します。

`baseline` → `valid` の出力差と、`duplicate` → `conflict` の診断を一つの改善率へ合算しません。`valid` → `manual` は内容と供給経路、`valid` → `duplicate` は同文追加、`duplicate` → `conflict` は一行差です。比較要因が混ざったrunは `incomparable` とします。

結果は `improved` に限りません。`equal`、`worse`、`incomparable`、`blocked`、`unsupported`、追加不要、投入未観測も有効です。

## Evidence

各Runtimeで `.hackathon/evidence/hc-021/comparison.md` を参加者が作ります。Packが完成Evidenceを作ることはありません。必須見出しは次の9件です。

`Fixed task`, `Environment`, `Condition`, `Materials`, `Observations`, `Design rationale`, `Comparison set`, `Outcome`, `Limits`

特に `Observations` では、次を別々に残します。

- placement: 実在path、拡張子、raw SHA-256、active / inertの区別。
- discovery: clientが示した候補・参照元。予測だけなら予測と書く。
- content use: 実際に供給された本文を確認できた範囲。確認不能なら `not-observed`。
- manual delivery: 貼った規則全文、body hash、固定taskとの順序。
- output compliance: 初回の未修正出力、見出し、箇条書き、矛盾の指摘、逸脱。
- diagnosis: 原因候補、反証、残るunknown、最小修正案。
- comparison identity: condition、Runtime repository、branch、run ID、Hub commit、Pack hash、比較相手のbundle参照。

よい出力から発見や本文投入を逆算しません。実機を使えない場合、discovery、content use、outputはnull / `not-observed` のままです。Runtime exporterの `runtimeBehavior` と `educationalEffect` は静的検査後も `not-observed` を維持します。

## Submit

各Runtime checkoutで、自分のconditionのEvidenceと許可された成果物だけを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

検査器を変更したり許可pathを広げたりせず、失敗理由を確認します。各conditionのRuntime Pull Requestへ、そのconditionの配置、設計、repair plan、Evidenceを含めます。別conditionを同じbranchで実施済みと書きません。

その後、[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ7条件のRuntime URL / PR / run対応、調査順、最小修正、比較結果、failure、unknownをまとめます。[Submission Guide](../../docs/submission-guide.md) に従い、secret、個人情報、local絶対path、private code、raw logを転載しません。

## Judging

- placement、discovery、content use、output complianceを混同していないか。
- 全7条件を同じpacket・task・規則本文の関係で設計したか。
- manualへ要約ではなく、凍結した規則全文を渡したか。
- Baseline→validとduplicate→conflictを別の診断として説明したか。
- 同文重複と一行矛盾のraw bytes・metadata差を確認したか。
- 観測できない層をnull / `not-observed` のまま残したか。
- 修正案が小さく、何を再確認するか説明できるか。
- 特定の見出しの勝利やInstructionsの数を採点基準にしていないか。

## Bonus Mission

今回の固定比較を変更せず、次の担当者が同じ診断を再現できる「一枚の診断票」を設計します。各段階のEvidence、停止条件、最小修正、別runでの再確認を短く対応付けてください。

Bonusは新しいconditionでも、未作成の任意ガイドでもありません。実際に修正を試す場合は、元7条件を上書きせず別の比較groupとして記録します。

## Support / Fallback

StableのLocal AgentやInstructions参照表示を利用できない場合でも、7条件のpath・原稿・本文差を机上で診断できます。その場合、候補表示、本文投入、出力は未観測であり、active pathを置いたことを実機成功と呼びません。

HC-021には今回のoptional routeはありません。Previewの管理UI、親repository探索、User/home/組織Instructions、別形式の優先順位確認を追加しません。これらが必要になった時点で本編を止めます。

条件分離ができない場合は `incomparable`、Runtimeや権限で止まる場合は `blocked`、対象機能がない場合は `unsupported` とします。自分の追加分だけを整理し、既存設定、他人のファイル、広いdirectoryを削除・reset・stashしません。
