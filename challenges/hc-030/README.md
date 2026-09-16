# HC-030 税額の意味を守るコードレビューを設計しよう

## Challenge Story

税計算のpatchには、見た目が小さくても意味を変えるものと、意味を保った変更があります。公開されたsemantic rulesをReview Instructionsにし、見落としと根拠のない指摘を同時に減らせるか測ります。

隠れたanswer keyは使いません。評価category、source、test、2つのcandidate patchはすべて参加者へ公開されています。

## この機能とは

Path-specific Instructionsは、対象file patternにだけ適用するreview規則をrepositoryへ置くCustomizationです。ここではJava source、test、candidate patchを対象にし、税率bucketとrounding timingを確認するreview ruleを作ります。

baselineの `TaxAmounts` はrateごとにnetを集約し、bucketごとにtaxを計算します。各candidateがこの公開contractを保つかは、source、test、変更行から参加者が判断します。

Instructionsはreview commentを自動的に正解にしません。reviewerが変更行とsource/testを結び付けたか、実際にtestを実行したか、根拠のないfindingを作らなかったかをEvidenceで分類します。

## 向いていること / 向いていないこと

**向いていること**

- domain固有のsemantic invariant
- 特定pathだけで必要なreview観点
- changed lineとrooted evidenceを結ぶ規則
- false-positiveも評価するreview設計

**向いていないこと**

- formatterやcompilerと同じ機械的checkの置き換え
- candidateごとの正解ラベルをInstructionsへ書くこと
- すべての変更へ同じ重大度で警告すること
- testを実行せず「pass」と主張すること

## Starter Kit

[Pack manifest](pack/manifest.json) は次を提供します。

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- `candidate-a.patch.template` と `candidate-b.patch.template` — 意味上の性質が異なる2 patch
- `candidates.json.template` — baselineと各post-imageの固定SHA-256
- `tax-review.instructions.md.template` — 不活性なreview rule案
- `classification.md.template` — public categoryでのEvidence表

candidate名から正解を推測せず、変更行とrooted evidenceを使います。

## Open Question

「良いreview」をfinding数だけで測ると、根拠のない警告を増やすだけでも高く見えます。あなたは何を同時に測りますか。

- semantic riskへのrooted finding
- 根拠のないfalse-positive
- missed risk
- changed lineへのrooting
- source/testへのrooting
- verificationの実行
- no-findingを選べるか

評価categoryはこのページとEvidence templateのpublic definitionsを使います。

## Design Time

1. public categoriesを確認します。
   - **true-positive**: actual semantic riskをrooted evidence付きで報告
   - **false-positive**: public contractを保つcandidateへ誤ってdefectを主張
   - **miss**: sourceまたは再現可能checkで示せるsemantic riskを見逃す
   - **rooted evidence**: changed lineとsource/test/実行結果へ結び付く根拠
2. 2つのcandidateを変更・適用せず、同じreview requestで使います。`candidates.json.template` のbaseline/post-image SHA-256で固定入力を確認します。
3. Baseline reviewの後でのみInstructionsを有効化します。
4. severity、impact、verificationの記録形式を決めます。
5. 「問題なし」という結果も保存します。
6. candidateの正解分類をInstructions本文へ書きません。

## Build

1. **Hub checkout** の `plan-run.mjs --dry-run` で `baseline` と `customized` を確認します。各condition内でcandidate AとBを別runとして扱います。
2. **Runtime checkout** のREADMEに従ってcondition付きでPackを適用します。candidateとStarterは `.hackathon/challenge/hc-030/**` に不活性に配置されます。
3. Instructionsを作らず、candidate AとBをそれぞれfresh conversationでreviewします。固定request:

   > このcandidate patchをreviewし、税額の意味を壊す変更だけを、changed lineとrooted evidence付きで報告してください。問題がなければ問題なしと答えてください。

4. Starterから `.github/instructions/tax-review.instructions.md` を参加者が新規作成します。
5. 同じ2 candidateをfresh conversationで再reviewします。
6. findingごとに、変更行、impact、rooted evidence、verificationを表へ移します。
7. Packはcandidateをsourceへ適用せず、manifestもsource mutationを許可しません。既存testの定義をEvidenceとして読めますが、candidate適用後のtest pass/failを作りません。

読み取りだけでtest passを主張せず、Hubが架空のbuild commandを提示することもありません。

## Compare

| Candidate | Baseline | Customized | 比較対象 |
|---|---|---|---|
| A | Instructionsなし | Instructionsあり | finding / no-finding、rooted evidence、unsupported claim |
| B | Instructionsなし | Instructionsあり | finding / no-finding、rooted evidence、unsupported claim |

candidate内容、request、source、test、model / effort / toolsをできるだけ揃えます。Customizedへだけcandidateの意図を教えてはいけません。

true-positiveが増えてfalse-positiveが増えなければ `improved` の根拠になります。差がなければ `equal`、noiseが増えれば `worse`、条件差で分類不能なら `incomparable`、実行できなければ `blocked`、Instructions非対応なら `unsupported` を選べます。

## Evidence

`.hackathon/evidence/hc-030/classification.md` に4 review（2 candidate × 2条件）を記録します。

- findingまたはno-finding
- changed line
- rooted evidence
- test definitionと、実行した場合だけcommand / exit result
- public category
- false-positiveとmiss
- client / host / OS / channel、model / effort / tools
- outcome、failure、unknown

testが落ちたことだけでreview findingが良いとは限りません。reviewerが変更行とsemantic impactを事前に説明できたかも見ます。

## Submit

Runtime PRへReview Instructionsとclassification Evidenceを含めます。candidate patchは比較入力として変更しません。Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
へ、4 reviewの集計、代表的なrooted evidence、false-positive / miss、outcomeを提出します。

private tax ruleや顧客データを追加せず、Starter Kitの合成金額だけを使います。

## Judging

- arithmeticとsemantic identityの両方をreview ruleへ含めたか
- candidate-specific answerをInstructionsへ漏らしていないか
- 変更行とsource/testへrootedしているか
- true-positiveだけでなくfalse-positiveとmissを測ったか
- 問題を示す根拠がないときno-findingを許したか
- test実行の有無を正確に報告したか
- negative/equal resultも保存したか

## Bonus Mission

第三のcandidateとして、currency checkを弱める小さなpatchを自分で作ります。元2 candidateの評価後に別実験として実行し、Review Instructionsが新しいriskへ一般化するか確認してください。第三candidateの期待分類をInstructionsへ追記してはいけません。

## Support / Fallback

Path-specific Instructionsが利用できない場合は、review rule本文を固定requestへ貼るmanual-equivalentを実行します。これでrule内容は比較できますが、path適用や自動読込は評価できません。`unsupported` または `incomparable` として区別します。

Java実行環境がない場合はstatic evidenceだけを記録し、test結果を推測しません。patch適用が安全に分離できない場合はreview-onlyで進め、その制約を明記します。
[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
