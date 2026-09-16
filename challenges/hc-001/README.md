# HC-001 根拠を大切にするJavaチームメイトを育てよう

## Challenge Story

チームのJava調査で、AIがもっともらしい説明を返しても、ファイルを読んだのか、テストを実行したのか、推測なのかが分からずレビューに時間がかかっています。毎回プロンプトで注意する代わりに、このリポジトリで守る「根拠のある働き方」をRepository Instructionsとして設計します。

このChallengeはこのページとStarter Kitだけで完結します。別の教材を先に終える必要はありません。

## この機能とは

Repository Instructionsは、リポジトリ内でCopilotへ継続的に伝えたい作業規則をMarkdownで置く仕組みです。ここでは、Javaの回答内容そのものを固定するのではなく、次の行動を促します。

- 指定されたsourceとtestを先に読む
- fact / inference / unknownを分ける
- 重要な主張をfileとsymbolへ結びつける
- 実行可能なら最小のcompile/testを走らせる
- 実行していないことを「成功」と書かない

Instructionsはテストや人の判断を置き換えません。モデル、client、host、tool権限によって反映のされ方も変わり得るため、実際のEvidenceで評価します。

## 向いていること / 向いていないこと

**向いていること**

- 多くのJava調査で繰り返す品質ルール
- repository全体で共通にしたいEvidenceの書き方
- 「実行したこと／していないこと」を明確にする習慣

**向いていないこと**

- 1回だけの長い作業手順
- secret、URL、個人名など環境固有情報の埋め込み
- 特定の答えを必ず返させること
- unit test、review、人の承認の代替

## Starter Kit

[Pack manifest](pack/manifest.json) は次をRuntimeへ安全に配置する計画です。

- Runtime baselineの `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`
- Runtime baselineの `wholesale-core/src/test/java/jp/co/tsubame/wholesale/common/CommonRulesTest.java`
- `copilot-instructions.md.template` — Hubでは不活性なRepository Instructions案
- `comparison.md.template` — Baseline / Customized / manual-equivalentの記録用紙

Java sourceと既存testはRuntimeのpinned 515-file baselineにすでに存在し、Packは複製しません。課題は既知bugの修正ではなく、`Money.tax` の `UNKNOWN` / invalid rounding境界をどうtestとして追加するかを、production behaviorと既存expectationを保ちながら調査することです。結果を先に決めつけず、`validation.rounding` と金額計算のroundingを区別します。

## Open Question

あなたのチームで「根拠を大切にした」と判断できる観測可能な行動は何ですか。

少なくとも3つ選び、測り方を決めます。例:

- source/testの引用が正しい
- factとinferenceが分離される
- test commandとexit resultが記録される
- 実行不能時にunknownを残す
- 最小変更を選ぶ

「丁寧だった」だけでは測れません。回答を読む前に基準を決めてください。

## Design Time

1. 固定taskを作ります。推奨:

   > `Money.tax` の `UNKNOWN` / invalid rounding境界について、production codeと既存expectationを保ったtestを `CommonRulesTest.java` に追加してください。`validation.rounding` と金額計算のroundingを区別し、根拠、実行結果、未確認事項を報告してください。

2. scorecardを作ります。各項目を `yes / partial / no / not-observable` で記録します。
3. Baseline、Customized、manual-equivalentで変えない条件を決めます。
4. client / host / OS / channel、model / effort / tools、Java versionを記録します。分からない値は `unknown` で構いません。
5. Instructionsに書きすぎないようにします。コードの正解ではなく、再利用できる作業規則だけを残します。

## Build

1. [Getting Started](../../docs/getting-started.md) に従い、Runtime templateから専用の非公開repositoryを作ります。
2. **Hub checkout** で `plan-run.mjs --dry-run` を `--condition baseline`、`customized`、`manual-equivalent` ごとに実行し、計画だけを確認します。このscriptはRuntimeにはありません。
3. **Runtime checkout** ではRuntime READMEのapply-pack手順を使い、対象conditionを明示します。PackはStarterを `.hackathon/challenge/hc-001/**` へ不活性に置くだけです。
4. Baselineの間は `.github/copilot-instructions.md` を作りません。
5. Baseline完了後、`.hackathon/challenge/hc-001/starter/copilot-instructions.md.template` を読み、自分のscorecardに必要な最小ルールを `.github/copilot-instructions.md` として**参加者が新規作成**します。
6. Runtime baselineに記載された標準test commandを使い、`wholesale-core` の対象testを実行します。Hubは別のbuild commandを発明しません。
7. AIがtestを実行したと主張した場合も、terminal outputとexit codeを自分で確認します。

## Compare

3条件をfresh conversationで実行します。

| 条件 | Repository Instructions | 追加の手作業 |
|---|---|---|
| Baseline | 無効 | 固定taskだけ |
| Customized | 有効 | 固定taskだけ |
| manual-equivalent | 無効 | Instructionsの公開checklistを固定taskへ貼る |

入力、対象file、scorecard、できるだけmodel / effort / toolsを揃えます。Customizedだけに追加ヒントを渡してはいけません。条件が揃わなければ、その差を記録して `incomparable` を選べます。

## Evidence

`.hackathon/evidence/hc-001/comparison.md` に次を残します。

- 固定task
- environment
- 各条件の回答
- 実際に実行したcommandとexit code
- 正しい引用、誤った引用
- fact / inference / unknown
- testの失敗と成功
- scorecard
- Instructionsによる差と、単にchecklistを貼った差

結果は `improved`、`equal`、`worse`、`incomparable`、`blocked`、`unsupported` のどれでも提出できます。都合の良いrunだけを選ばず、否定的なEvidenceも残します。

## Submit

Runtime Pull Requestへ、編集したInstructions、comparison、再現手順を含めます。その後
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
を使い、Runtime URLとPR URL、outcome、failure、unknown、privacy確認をHubへ提出します。

[Submission Guide](../../docs/submission-guide.md) のredaction規則に従い、local path、token、private code、個人情報をIssue本文へ貼らないでください。

## Judging

- 根拠ある行動を回答前に定義したか
- Instructionsが特定bugの答えではなく再利用可能な規則か
- Baseline / Customized / manual-equivalentが公平か
- 「testを実行した」という主張をterminal evidenceで確認したか
- equalやworseを含む反証を残したか
- Instructionsが向かない場面を説明したか

## Bonus Mission

同じInstructionsを別の小さなJava taskへ適用し、過剰な引用、不要なcommand実行、回答の長文化などの副作用を探します。元taskだけに最適化されていた場合は、その制約を明記してください。

## Support / Fallback

Repository Instructionsをclientが認識しない場合は、内容を固定taskへ貼るmanual-equivalentだけを実行します。その結果をCustomizedと同一扱いせず、`unsupported` または `incomparable` として機能差を記録します。

Javaを実行できない場合は、compile/test未実行を明記し、sourceとtestから手動確認できる範囲だけをEvidenceにします。権限回避や未承認softwareの導入はしません。詳細は
[Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
