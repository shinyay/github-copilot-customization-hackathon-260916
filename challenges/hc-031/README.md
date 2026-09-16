# HC-031 Java・XML・製品別にInstructionsを出し分けよう

## Challenge Story

注文処理の調査では、Javaの制御フローとXMLの配線を行き来します。Java向け規則をXMLへ広く配るとnoiseになり、XML向け規則をすべてのJavaへ配ると保守範囲が曖昧になります。さらに、Cloud Agentとcode reviewで同じ原稿を使うかどうかも、file scopeとは別に設計する必要があります。

このChallengeはRuntimeの4つのmain `sourcePaths`、source mapから必要に応じて辿る共通guardの補助参照、不活性な原稿だけで完結します。以前のChallenge、実Cloud実行、実reviewは必要ありません。

## この機能とは

Path-specific Instructionsは、frontmatterの `applyTo` で対象pathを表し、そのpathを扱うときに規則を供給する仕組みです。`applyTo` は供給scopeであり、fileを読めるかどうかを制御するACLではありません。

製品別に原稿を使わない場合は、frontmatterの正式key `excludeAgent` を使います。値は `code-review` または `cloud-agent` です。製品除外はそのInstructions原稿を供給しない設計であり、対象sourceへのアクセス禁止ではありません。

このChallengeでは、次の2軸を分けます。

- path軸: core Java / core XML / 範囲外web Java
- product軸: Cloud Agent / code review

## 向いていること / 向いていないこと

**向いていること**

- JavaとXMLで異なる読解規則を保守すること
- core限定scopeと範囲外web sourceを区別すること
- 同じbodyを保ちながら製品別metadataだけを比較すること
- mixed taskで複数原稿を供給する順序を設計すること

**向いていないこと**

- `applyTo` をread/write権限やsandboxと説明すること
- 製品除外をsource accessの拒否と説明すること
- すべての規則を広いglobへ置くことを唯一解にすること
- local checkerだけでGitHub.com上の実採用を保証すること
- 紙上のmatrixを実Cloudや実reviewの成功記録にすること

## Starter Kit

[Pack manifest](pack/manifest.json) は `sourceKind: baseline` とし、`sourcePaths` はRuntimeのpinned baselineにある次の4 exact pathです。

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java`
- `wholesale-core/src/main/resources/application-context.xml`
- `wholesale-core/src/main/resources/spring/module-operations.xml`
- `wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java`

source mapから、必要に応じて次の補助読取りへ辿ります。これらはcatalogのmain `sourcePaths` へ追加しません。

- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
- `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`

補助参照は `OrderService` から共通guardを辿るために使います。sourceを読んだことを、transactionやruntime behaviorの実観測として扱いません。

前3件はcore Java/XMLの候補scope、最後の `OrderAction.java` は範囲外web Javaを確認する固定入力です。Packはmain sourceや補助参照を複製・変更せず、source map、空のJava/XML rules draft、scope matrix、product matrix、delivery plan、comparison templateをexact `.hackathon/challenge/hc-031/starter/` 配下へ不活性にmaterializeします。これは参加者が読む固定starter locationであり、manifestの許可をfolder globへ広げる意味ではありません。

Starter Kitは最小のfrontmatter構文と次の候補patternを説明しますが、Java/XML bodyの完成答案は含みません。

- `wholesale-core/src/main/java/**/*.java`
- `wholesale-core/src/main/resources/**/*.xml`

metadata案は、`excludeAgent` なし、`excludeAgent: "code-review"`、`excludeAgent: "cloud-agent"` の3つです。

## Open Question

Javaの制御とXMLの配線を行き来する作業で、どの規則を分け、どこを共有しますか。非対象fileや異なる製品へ不要な規則を届けないために、scopeと製品除外をどう組み合わせますか。

広いscope、細かいscope、共通bodyを持つ設計のいずれも選べます。保守負担、誤適用、mixed taskでの重複を比較し、理由を記録してください。

## Design Time

sourceを読んだうえで、結果を記入する前に次を固定します。

1. Java原稿の目的、body、`applyTo`、対象外path
2. XML原稿の目的、body、`applyTo`、対象外path
3. `java-reading`、`xml-reading`、`mixed-reading` の3 task
4. mixed taskで両bodyを渡す順序
5. core Java、2つのXML、範囲外web Javaを残すscope確認表
6. Cloud Agent / code reviewごとの利用または除外方針
7. scope予測、製品予測、実観測を別欄にする方法
8. body変更とmetadata変更を同じ比較へ混ぜない規則

製品別matrixは、2原稿 × 2製品 × 3metadata案 = 12行です。この12行は診断軸であり、12 conditionではありません。

## Build

1. conditionごとに独立したRuntime repositoryと新しいrunを用意します。
2. Hub checkoutで `baseline`、`scoped-design`、`manual-equivalent` のdry-run計画だけを確認します。Runtime checkoutではRuntime READMEの手順でPackを適用します。
3. すべてのconditionで次を作成します。
   - `participant/hc-031/scope-matrix.md`
   - `participant/hc-031/product-matrix.md`
   - `participant/hc-031/delivery-plan.md`
4. `scoped-design` と `manual-equivalent` だけで次を作成します。
   - `participant/hc-031/java-rules.md.template`
   - `participant/hc-031/xml-rules.md.template`
5. `baseline` は十分な固定依頼、4つのmain `sourcePaths`、同じ補助読取り導線を使いますが、scoped規則を追加供給しません。
6. `scoped-design` では凍結したJava/XML bodyを対象scopeへ供給する計画を記録します。
7. `manual-equivalent` では同じbody全文をtaskへ手動供給します。mixed taskでは両bodyを同じ順序で含め、要約しません。
8. 実 `.github/instructions/**`、Java、XML、POMを変更しません。

各conditionで3 taskを1回ずつ扱い、scope matrixには4 sourceをすべて残します。product matrixは12行のexact集合を保持し、行数だけ同じ別組合せへの置換を許しません。

## Compare

| 条件 | scoped規則 | 固定するもの | 変更するもの |
|---|---|---|---|
| `baseline` | なし | 3 task、4 main `sourcePaths`、補助読取り導線、十分な依頼 | 追加bodyなし |
| `scoped-design` | Java/XML bodyをscope別に供給する設計 | baselineと同じtask/source | scopeと製品metadataの設計 |
| `manual-equivalent` | 同じbody全文を手動供給する設計 | baselineと同じtask/source | 自動scopeを使わない供給方法 |

比較表示では `baseline` を **Baseline**、`scoped-design` と `manual-equivalent` を目的の異なる **Customized** 条件と呼びます。Customizedは実Cloudや実reviewでの採用成功、またはACLを意味せず、Baselineと同じ3 task、4 sourceでscope別の供給案と同全文の手動供給案を比較するための呼称です。

scope比較ではcore Java、2 XML、範囲外web Javaを確認します。product比較ではbodyを固定し、metadataだけを変えた12行を確認します。bodyまで変えた行は同じ対照へ含めません。

結論は `improved`、`not-needed`、`equal`、`worse`、`blocked`、`incomparable` のいずれでも構いません。実製品のglob評価、Instructions採用、source accessを観測していない欄は `unknown` または `not-checked` とします。

## Evidence

`.hackathon/evidence/hc-031/comparison.md` に、次の見出しをこの表記で残します。

- `Fixed task`
- `Environment`
- `Baseline`
- `Scoped design`
- `Manual-equivalent`
- `Scope coverage`
- `Product coverage`
- `Outcome`

`Scope coverage` には3 task × 3 conditionと4 sourceの対象/非対象を記録します。`Product coverage` には2原稿 × 2製品 × 3metadata案の12行を記録し、設計上の予測と実観測欄を分けます。実Cloud/reviewを行っていない場合は `live-unobserved` と明記します。

## Submit

各conditionのRuntimeで許可された成果物とcomparisonを完成させ、submitted検査後にcondition別exportを作ります。`baseline` には3つのmatrix/planとcomparisonを含め、`scoped-design` と `manual-equivalent` にはJava/XML rules原稿も含めます。

Runtime Pull Requestとexportを対応付け、Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
へ、3 task、4 sourceのscope、12行のproduct coverage、非対象webの扱い、outcomeを提出します。実製品で確認していない供給結果を成功値で埋めません。

private source、local path、raw review logは
[Submission Guide](../../docs/submission-guide.md)
に従ってredactします。

## Judging

- Java/XML bodyとscopeの理由を説明したか
- 4 sourceを残し、範囲外webをcore Javaと区別したか
- `applyTo` を供給scopeとして扱い、ACLと混同していないか
- `excludeAgent` と2つの正式値を正しく使ったか
- 3 conditionと12行product matrixを混同していないか
- `scoped-design` と `manual-equivalent` のbody全文を揃えたか
- body変更とmetadata変更を分離したか
- 紙上設計を実Cloud/review採用成功へ昇格させていないか

## Bonus Mission

JavaまたはXMLのどちらか一方だけ `applyTo` を狭める探索案を作り、4 sourceと12行matrixへの影響を再評価します。本編の凍結body、condition、outcomeは上書きせず、別の設計案として残してください。

## Support / Fallback

本編はsource readingと不活性な設計表だけで完了できます。実Cloudでscopeを観測する場合は、統合後の
[cloud-scope-observation optional guide](optional/cloud-scope-observation.md)
を使用します。このrouteは `OPTIONAL_GUIDE_ONLY`、`live-unobserved` で、Runtime v1の `cross-branch-handoff` capabilityは `blocked` です。

標準reviewで供給scopeを観測する場合は
[review-scope-observation optional guide](optional/review-scope-observation.md)
を使用します。このrouteも `OPTIONAL_GUIDE_ONLY`、`live-unobserved` で、`review-scope-observation` capabilityは `not-checked` です。資格、承認、対象revision、attributionが不足する場合は停止し、review commentへのreplyをprompt投入の代わりにしません。

Path-specific Instructionsを使えない環境ではmanual-equivalentの設計を提出できますが、scope採用は `unsupported` または `incomparable` とし、sourceを読めたことだけでInstructions供給成功としません。

Cloudまたはreview機能の資格、availability、Preview status、対応versionが未確認の場合は、optional routeを停止し、設計上の予測を実観測へ書き換えません。
