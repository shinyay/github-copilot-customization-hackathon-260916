# HC-029 Cloud AgentにJava互換条件を守らせよう

## Challenge Story

Javaの変更依頼には、今回だけの目的と、repositoryで繰り返し守りたい互換条件があります。すべてを毎回の依頼へ長く書く方法も、すべてを常設Instructionsへ移す方法も保守しにくいため、十分な固定依頼を出発点に、何を常設化する価値があるかを設計します。

このChallengeはHC-001などの実施を前提にしません。Runtimeの3つのmain `sourcePaths` と、source mapから必要に応じて辿る補助参照を読み、`Money.tax` のUNKNOWN境界に対するtest追加を「提案diff」として作成します。

## この機能とは

Repository Instructionsは、Cloud Agentなどへrepository固有の互換条件や変更範囲を繰り返し伝えるためのMarkdownです。ただし、InstructionsはJDKやMavenを用意せず、test実行、権限、変更の正しさ、人のreviewも保証しません。

このChallengeでは次を分離します。

- task固有の依頼: UNKNOWN境界へどのtestを提案するか
- 常設候補: Java version、変更可能範囲、既存期待値の保持
- environment: JDK8 / Mavenを実際に使えるか
- proposal: applyしていないdiff
- verification: 実行したことと未実施のこと

本編は供給方法と提案内容の設計比較であり、3種類のCloud Agent出力を実測する課題ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 多くのtaskで繰り返すJava互換条件の常設化
- production、POM、既存test期待値を保つ変更範囲の明示
- 十分な通常依頼と常設Instructionsの責任分担
- 追加Instructionsが不要という判断の記録

**向いていないこと**

- JDK、Maven、dependency、権限をInstructionsだけで準備すること
- production codeやPOMを変更してtest提案を通すこと
- test未実施をpassと報告すること
- 完成patchをStarterからcopyすること
- 紙上の提案をCloud実行成功やmerge可能性へ昇格させること

## Starter Kit

[Pack manifest](pack/manifest.json) は `sourceKind: baseline` とし、`sourcePaths` はRuntimeのpinned baselineにある次のexact pathです。

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- `pom.xml`

source mapから、必要に応じて次の補助読取りへ辿ります。これらはcatalogのmain `sourcePaths` へ追加しません。

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/BusinessException.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/TaxAmounts.java`
- `README.md`

`BusinessException.java` は `Money.tax` の例外境界、`TaxAmounts.java` はMoneyとの役割混同の回避、`README.md` はJDK8での実行とJava 7相当APIの区別を調べる補助参照です。補助参照を読むこともsource evidenceであり、実buildの成功証拠ではありません。

Packはmain sourceや補助参照を複製・変更せず、source map、compatibility checklist、空のrules draft、空のproposal guide、comparison templateをexact `.hackathon/challenge/hc-029/starter/` 配下へ不活性にmaterializeします。これは参加者が読む固定starter locationであり、manifestの許可をfolder globへ広げる意味ではありません。proposal guideはdiffの書き方だけを示し、完成test、完成patch、旧expected、講師答案を含みません。

全conditionへ渡す固定依頼は、次の条件をすべて含みます。

> JDK8とMavenを前提に、Java 7構文とJava 7標準APIの範囲を守ってください。`Money.tax` のUNKNOWN rounding境界を確認し、変更提案は `CommonRulesTest.java` だけに限定してください。production code、`pom.xml`、既存testの期待値は変更せず、未実施のcompile/testは未実施と報告してください。

main `sourcePaths` と補助参照を読むことはsource evidenceであり、実buildの成功証拠ではありません。

## Open Question

十分な依頼がすでにあるとき、どの条件を常設化する価値がありますか。重複、保守負担、指示の過剰化をどう避けますか。

すべてを常設化する必要はありません。通常依頼だけで十分、互換条件の一部だけ常設、task固有条件は依頼へ残す、という設計も比較してください。

## Design Time

sourceを読んだうえで、提案を作る前に次を固定します。

1. 固定依頼から常設候補へ移す条件と、依頼へ残す条件
2. JDK8での実行環境と、Java 7構文・標準API制約の違い
3. 変更提案を `CommonRulesTest.java` だけへ限定する方法
4. production、POM、既存test期待値が不変であることの確認表
5. UNKNOWN rounding境界を、既知roundingの既存testと混同しない観点
6. compile/testを実施できない場合の報告語彙
7. Instructionsを追加しない判断基準

`customized` と `manual-equivalent` で使うbodyは、結果を見る前に凍結し、body hashを記録します。manual側で短縮や言い換えを行いません。

## Build

1. conditionごとに独立したRuntime repositoryと新しいrunを用意します。
2. Hub checkoutで `baseline`、`customized`、`manual-equivalent` のdry-run計画だけを確認します。Runtime checkoutではRuntime READMEの手順でPackを適用します。
3. すべてのconditionで次を作成します。
   - `participant/hc-029/request.md`
   - `participant/hc-029/proposed-change.diff.template`
   - `participant/hc-029/compatibility-review.md`
4. `customized` と `manual-equivalent` だけで `participant/hc-029/repository-rules.md.template` を作成します。これは不活性な設計原稿であり、実 `.github/**` へ配置しません。
5. `manual-equivalent` では凍結body全文を固定依頼へ同じ順序で添付する案を `request.md` に保存します。
6. 提案diffは保存して読むだけにし、`git apply`、source編集、test編集、POM編集を行いません。
7. 未実施のcompile/testは `not-run` とし、DB skipやsource readingをtest成功へ置き換えません。

各conditionで十分な共通依頼、同じ3件のmain `sourcePaths`、同じ補助読取り導線、同じ安全条件を使います。`customized` だけにJDK、dependency、期待値、checkerを追加しません。

## Compare

| 条件 | Instructions body | 固定するもの | 観測するもの |
|---|---|---|---|
| `baseline` | なし | 固定依頼、3 main `sourcePaths`、補助読取り導線、互換条件 | 通常依頼だけで作る提案と監査 |
| `customized` | 凍結bodyを常設供給する設計 | baselineと同じ入力 | 常設化した条件、重複、提案境界 |
| `manual-equivalent` | 同じbody全文を手動供給する設計 | baselineと同じ入力 | body内容だけを渡した対照 |

file全体、body、固定依頼、sourceのhashを別々に記録します。同じbodyでも供給位置や優先度まで同じとは主張しません。

結論は `improved`、`not-needed`、`equal`、`worse`、`blocked`、`incomparable` のいずれでも構いません。実Cloud出力、実test、費用、時間を観測していない欄は `unknown`、`null`、`not-run` のまま残します。

## Evidence

`.hackathon/evidence/hc-029/comparison.md` に、次の見出しをこの表記で残します。

- `Fixed task`
- `Environment`
- `Baseline`
- `Customized`
- `Manual-equivalent`
- `Compatibility`
- `Proposal boundary`
- `Outcome`

`Compatibility` ではJDK8とJava 7制約、既存test期待値、production/POM不変を確認します。`Proposal boundary` ではdiffの対象pathと、applyしていないことを記録します。実行していないcommandへ架空のexit codeを書きません。

## Submit

各conditionのRuntimeで許可された成果物とcomparisonを完成させ、submitted検査後にcondition別exportを作ります。`baseline` にはrequest、proposal diff、compatibility review、comparisonを含め、`customized` と `manual-equivalent` にはrepository rules原稿も含めます。

Runtime Pull Requestとexportを対応付け、Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
へ、常設化した条件、依頼へ残した条件、proposalの対象、未実施検査、outcomeを提出します。diffをsourceへ適用したように見せないでください。

private repository情報、local path、raw logは
[Submission Guide](../../docs/submission-guide.md)
に従ってredactします。

## Judging

- baselineにもJDK、Java互換、変更範囲、安全条件を十分に与えたか
- JDK8の実行とJava 7構文・標準APIを区別したか
- 提案対象を `CommonRulesTest.java` だけへ限定したか
- production、POM、既存test期待値を不変にしたか
- UNKNOWN境界をsourceから説明したか
- `customized` と `manual-equivalent` のbody全文が同じか
- diffをapplyせず、未実施testを未実施と報告したか
- Instructions追加不要やworseという結論を受理したか

## Bonus Mission

別入力として `tax-category` の確認計画だけを追加し、今回の提案が別taskへ一般化するかを記述します。以前の回答や完成patchを転記せず、本編のcondition数、diff、outcomeを変更しないでください。

## Support / Fallback

本編はsource readingと不活性な提案作成だけで完了できます。実Cloud Agentで提案を試す将来手順は、統合後の
[cloud-test-proposal optional guide](optional/cloud-test-proposal.md)
で扱います。このrouteは `OPTIONAL_GUIDE_ONLY`、`live-unobserved` で、Runtime v1の `cross-branch-handoff` capabilityは `blocked` です。

Cloudが別branchへ変更を作っても、現在のRuntime runへ正式にbindingを移す経路がありません。別run作成、`run.json` 手編集、既存期待値の緩和で完走を装いません。JDKやMavenを使えない場合も本編のproposalは作れますが、compile/testは `not-run` とし、実行結果の比較は `incomparable` と報告します。

Cloud機能の資格、availability、Preview status、対応versionが未確認の場合は、その確認を飛ばして起動せずoptional routeを停止します。
