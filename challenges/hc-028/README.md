# HC-028 Copilotが読んだInstructionsの版を突き止めよう

## Challenge Story

同じInstructions fileがbase、head、default、starting refに存在すると、「repositoryに保存された版」と「製品が採用すると説明されている版」と「今回の実行で観測できた版」が混ざりやすくなります。候補diffの内容だけから採用版を推測せず、合成ref資料とattribution記録を使って、断定できる範囲と未確認の境界を監査します。

このChallengeは合成資料だけで完結します。実PR、Cloud Agent、code reviewの実行や、前のChallengeの成果は必要ありません。

## この機能とは

版の監査では、少なくとも次の3層を分離します。

- **Stored revision**: Git上のどのrefに、どのfile bytesが保存されているか
- **Documented rule**: 対象製品がどのrefを採用すると公式に説明しているか
- **Observed attribution**: 今回の実行記録が、どの対象revisionとInstructions版を直接示しているか

`base`、`head`、`default`、`starting` は用途の違う名前であり、同じ値とは限りません。starting refはCloud作業の開始点を示すことがありますが、それだけですべての設定の採用元を決めません。

標準のCopilot code reviewについて文書化されたhead branchの規則を、Cloud Agent、App automation、別製品の一般則へ拡張してはいけません。

## 向いていること / 向いていないこと

**向いていること**

- 保存されたInstructionsのrefとbytesを台帳化すること
- 製品別の文書化規則と今回の観測を分離すること
- old headの記録を現在のrunへ流用しない判断
- task diffとInstructions変更diffを分離すること

**向いていないこと**

- 回答言語や自己申告だけで採用版を逆算すること
- 保存hashを、そのまま実投入版の証拠と呼ぶこと
- code reviewのhead規則をCloud全般へ広げること
- 合成attributionを実製品の観測結果として提出すること
- 不明なrevisionを推測で埋めること

## Starter Kit

[Pack manifest](pack/manifest.json) は `sourceKind: synthetic`、`sourcePaths: []` とし、`SYNTHETIC_TRAINING_ONLY` を表示した不活性資料を提供します。

Packの不活性素材は、Runtimeへの適用時にexact `.hackathon/challenge/hc-028/starter/` 配下へmaterializeされます。これは参加者が読む固定starter locationであり、manifestの許可をfolder globへ広げる意味ではありません。

- `base`、`head`、`default`、`starting` の4つの合成ref原稿
- refごとのbody hashとfile hashを記録するregister
- 擬似的なtask diffとInstructions変更diff
- 製品別の文書化規則を確認する資料
- 同一revisionを特定できる合成記録、以前のheadに結び付く記録、対象fileや版を特定できない記録
- 空のrevision ledger、diff separation、comparison template

合成ref IDは実Git SHAではなく、擬似diffも実アプリへ適用しません。Starter Kitはどの版が採用されたかという完成回答や、実在PRのattributionを含みません。

## Open Question

同じ候補diffでもInstructionsが複数refに存在するとき、どの証拠がそろえば版を断定し、何が欠けたら未確認で止めますか。

必要証拠を増やし続けることが唯一解ではありません。製品、asset、riskに応じて、断定に必要な最小集合と、古い証拠を無効化する条件を設計してください。

## Design Time

資料の結論を見る前に、次を固定します。

1. Stored revisionを識別するref、path、body hash、file hash
2. Documented ruleの製品名、対象asset、根拠、確認時点
3. Observed attributionに必要なrun、actor、対象head、対象file、表示revision
4. headが変わったときに古い記録を無効化する規則
5. task diffとInstructions変更diffを別々に保存する方法
6. 証拠が競合または欠測したときの調査順序
7. `unknown`、`old-head`、`revision-identified` を混ぜない判定語彙

`revision-audit` ではこの監査方法を先に凍結します。資料に合うように必要証拠や判定規則を後から弱めません。

## Build

1. conditionごとに独立したRuntime repositoryと新しいrunを用意します。
2. Hub checkoutで `baseline` と `revision-audit` のdry-run計画だけを確認します。Runtime checkoutではRuntime READMEの手順でPackを適用します。
3. `baseline` では十分な固定依頼に従い、4 ref、2 diff、3 attribution状態をそのまま監査します。
4. `revision-audit` では先に `participant/hc-028/audit-method.md` を作成し、その方法を同じ全資料へ適用します。
5. 両conditionで次を作成します。
   - `participant/hc-028/revision-ledger.md`
   - `participant/hc-028/diff-separation.md`
6. `audit-method.md` は `revision-audit` だけで作成します。`baseline` に追加checkerや別資料を与えません。
7. 擬似diffをapplyせず、実 `.github/**`、branch、PR、review設定を変更しません。

ledgerには保存ref、body/file hash、文書化規則、資料が主張するref、観測対象revision、実観測の有無、推論、unknown理由を別欄で記録します。

## Compare

| 条件 | 固定するもの | 変更するもの |
|---|---|---|
| `baseline` | 4 ref、2 diff、3記録状態、十分な監査依頼 | 追加の監査方法なし |
| `revision-audit` | baselineと同じ全資料と依頼 | 参加者が事前に凍結した版監査方法 |

比較表示では `baseline` を **Baseline**、`revision-audit` を **Customized** と呼びます。Customizedは実reviewやCloudでの採用成功を意味せず、事前に凍結した版監査方法をBaselineと同じ4 ref、2 diff、3 attribution状態へ適用する比較条件です。

両条件で、版特定可能な合成記録、old head、特定不可の3状態をすべて扱います。合成資料の「特定可能」は実review観測とは異なります。

結論は `improved`、`not-needed`、`equal`、`worse`、`blocked`、`incomparable` のいずれでも構いません。文書化規則は分かるが今回の投入版は分からない場合、Observed attributionを `unknown` または `not-observed` として残すのが正しい結論です。

## Evidence

`.hackathon/evidence/hc-028/comparison.md` に、次の見出しをこの表記で残します。

- `Fixed task`
- `Environment`
- `Stored revisions`
- `Documented rules`
- `Observed attribution`
- `Diff separation`
- `Outcome`

`Stored revisions` はrefごとの実資料bytesを、`Documented rules` は製品ごとの規則と適用範囲を、`Observed attribution` は今回直接観測できたことだけを記録します。合成記録は `synthetic`、実機未実施は `live-unobserved` と明示します。

## Submit

各conditionのRuntimeで成果物とcomparisonを完成させ、submitted検査後にcondition別exportを作ります。`baseline` にはrevision ledger、diff separation、comparisonを含め、`revision-audit` にはaudit methodも含めます。別runのattributionを自分の観測として転載しません。

Runtime Pull Requestとexportを対応付け、Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
へ、断定できた版、old headとして無効化した記録、未特定の理由、task/config diffの分離、outcomeを提出します。

private repository名、実branch名、actor、raw review logは
[Submission Guide](../../docs/submission-guide.md)
に従って必要な範囲をredactします。

## Judging

- 保存版、文書化規則、観測版を別欄にしたか
- base / head / default / startingを同一視していないか
- old headの記録を現在のrunへ流用していないか
- body hashとfile hashを区別したか
- task diffとInstructions変更diffを分離したか
- 標準reviewのhead規則をCloud一般則へ拡張していないか
- 回答言語や自己申告でunknownを補完していないか
- 合成記録を実機観測や製品成功へ昇格させていないか

## Bonus Mission

合成headが1回進んだ追加記録を作り、以前のattributionを無効化する条件を監査方法へ適用します。新しいconditionや実PRは作らず、元のEvidenceを上書きしないでください。

## Support / Fallback

本編は合成資料だけで完了できます。標準reviewで実際の版attributionを観測する場合は、統合後の
[review-attribution optional guide](optional/review-attribution.md)
を使用します。このrouteは `OPTIONAL_GUIDE_ONLY`、`live-unobserved` で、`review-attribution-observation` capabilityは `not-checked` です。

実reviewの要求は別の承認が必要です。資格、repository設定、actor、対象PR/head、再review方法、表示されるsessionやlogの範囲が確認できなければ停止します。版まで特定できない場合は `not-observed` のままにし、attributionの存在だけで成功扱いにしません。

対象client、対応version、availability、Preview statusが未確認の場合もoptional routeを停止し、合成資料の監査結果だけを提出します。
