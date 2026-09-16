# HC-013 チームの知識をCopilot Spaceへ整理しよう

## Challenge Story

受注CSVの再送について、次の保守担当へ資料を渡すことになりました。コード、研修用の運用メモ、
版だけ違う参照が同じ場所にあると、「読めた資料」と「あるはずの資料」を混ぜて説明してしまいそうです。
**本編はSpaceに整理するためのローカル資料設計であり、実Spaceの作成・取得ではありません。**
このページ、Pack、固定Runtimeだけで始められます。元LABや前のChallengeの履修・回答は不要です。

## この機能とは

Copilot Spaceは、関連するinstructions（用途を伝える指示）とsources（根拠となる資料）をまとめ、
再利用する場所です。例えば「この引継ぎでは版と読取範囲を添える」という指示と、対象ファイルを
別々に管理できます。指示は読み方、資料は根拠であり、用途のdescriptionとも役割が違います。

IDEからSpaceを読む場合はGitHubの**remote MCP server**を介します。
ローカルJSONカードの保存・添付はこの経路ではありません。本編のカードは
`LOCAL_CONTEXT_CARD_NOT_A_COPILOT_SPACE` で、MCPの応答schemaを模倣しません。
通常のファイル添付と同じ材料をまとめ直す練習です。Spaceの閲覧権と個別sourceの閲覧権も別です。

例えば、ある参照に `revision: "main"` とあっても、解決commitと本文hashが未観測なら
「固定commitと同じ版」とは書けません。ここを目立つ欄にするか、資料ごとの欄にするかは自分で選べます。
内容が同じでも版が違うこと、同じ版を指しても本文を取得できないことを区別します。

製品説明の出典・参照日（実機実行日ではありません）: 2026-09-15、
[About Spaces](https://docs.github.com/en/copilot/concepts/context/spaces)、
[Using Spaces](https://docs.github.com/en/copilot/how-tos/provide-context/use-copilot-spaces/use-copilot-spaces)、
[Creating Spaces](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/copilot-spaces/create-copilot-spaces)。
作成ガイドはinstructions・sources・description・更新時点の説明を参照するだけで、作成操作はしません。

## 向いていること / 向いていないこと

複数の人が同じ資料を再利用する前に、出典・版・用途・見えていない範囲を点検する仕事に向いています。
「コード順に読む」「資料の種類で分ける」「未確認を最初に見せる」にはそれぞれ利点があります。
資料が少ないなら、個別ファイルの受渡し票だけで十分かもしれません。

カードやSpaceは、資料にない実際の設計理由を作れません。アクセスできない資料を読めるようにする
仕組みでもありません。カードの出来栄えから認証、ACL、同期、実DBの動作を証明する課題ではありません。
情報をBだけに足して詳しくなった結果も、整理方法だけの改善とは呼びません。

## Starter Kit

必要なのはGit、Node.js 22以降、UTF-8/LFを保存できるeditor、Hubと自分の非公開Runtimeへの通常のアクセスです。
利用可能な通常のCopilot Chatがあれば同じ入力を比較し、なければ人が資料設計を比較できます。
JDK、Maven、DB、アプリ・サーバーの起動は不要です。B3は**テスト定義を読むだけ**で実行しません。
本編はMCP、Hooks、Tool Sets、Custom Agent、Skill、Plugin、User/組織設定を追加・変更しません。

[Pack manifest](pack/manifest.json) の条件は `baseline`、`context-card`、`manual-equivalent` の三つだけです。
全条件で同じ14ファイルを `.hackathon/challenge/hc-013/` に受け取ります。
`brief.md.template` と `request.txt.template` は課題と固定依頼、
`source-materials.json.template` は由来・改作・hashの台帳です。
`design.md.template`、`handoff-worksheet.md.template`、`context-card.json.template` は自分で記入するひな型、
`comparison.md.template`、`recovery.md.template`、`provenance.md.template` はEvidenceのひな型です。
`github-spaces.mcp.json.template` は説明用の不活性な参照で、本編では適用しません。
`prepare-display.mjs.template` は明示的なstdin実行だけで使う表示資料の準備helperです。
自動発見されるCustomizationでも、Runtimeのredaction/export検査器でもありません。

比較で渡す材料は、次のB1/B2/B3から作る**sanitized全体display**と、P1/P2/P3のJSON全文です。
原本にはテスト用認証値を含む行があるため、そのままカードへ複製しません。helperは固定原本のpinを先に検証し、
B3の宣言済み6行全体だけを `HC013_DISPLAY_REDACTED` の説明markerへ置換します。他の全行・改行・行数は保持します。
値のescapeを変えてフィルターをすり抜ける方法ではありません。認証値を含む行そのものを表示資料から除きます。

| ID | Runtime rootから読むexact path | 用途 |
|---|---|---|
| B1 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | 現在の処理を自分で読む入口 |
| B2 | `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | B1が受け取るまとまりの定義 |
| B3 | `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | テストが何を確かめようとするかと、その実行前提の定義 |
| P1 | `.hackathon/challenge/hc-013/source-packet.json.template` | 合成運用メモ全文、B1/B2/B3の出典と未確認欄 |
| P2 | `.hackathon/challenge/hc-013/snapshot.json.template` | B1 whole-fileの固定identity。Space取得の証拠ではない |
| P3 | `.hackathon/challenge/hc-013/provenance-packets.json.template` | 中立IDの合成参照資料。配列順・空欄・取得状態も材料 |

| 原本 | 原本bytes / 行数 | display bytes / 行数 | whole-line置換 |
|---|---|---|---|
| B1 | 5,047 / 97 | 5,047 / 97 | 0行 |
| B2 | 5,408 / 126 | 5,408 / 126 | 0行 |
| B3 | 27,073 / 467 | 27,214 / 467 | 原本の86、87、237、242、431、437行 |

policyは `hc013-full-display-v1` です。B3の認証値を含む代入・呼出し行を**行全体で**除き、説明markerを置きます。
原本whole-source hashはprovenance、display whole-text hashは共有する全文の照合、transformationは
policy・行番号・件数・markerだけのreceiptです。認証値と個々の値のhashは保存しません。
このdisplayは**原本のbyte-exact複製ではなく、実行可能なJavaとも限りません**。短い要約にすることとも違います。

`sourceKind: baseline` のsourceは
`shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`。
Labsの教材参照HEAD `3474d21dd62bad2e594e84657dabe2eb9bb876c1` とは別です。
Runtimeの515-file baseline、provenance、2件の運用overrideを維持し、PackへJavaツリーを複製しません。
原本515ファイルは変えず、全条件から同じexact pathで読み取り専用に確認できます。
helperが検査する原本は表の3件だけです。515-file全体の検証はRuntimeの責務であり、helper成功で代用しません。
P1のメモとP3の設定は `SYNTHETIC_TRAINING_ONLY`。架空の「白樺-13」「再送確認係」は
実在するチームの規約・障害履歴ではなく、`actualHistoricalDecision: "NOT_PROVIDED"` を保持します。

各条件は別のfresh repository、名前付きbranch、新規workspace・会話・専用profileで始めます。
別repositoryでもhome、User/組織Instructions、Memoryは消えません。既存設定を削除して統制せず、
残留と影響の未確認を記録し、同じにできなければ `incomparable` にします。

## Open Question

別の人が「どの資料の、どの版の、どこまで読めた情報か」を誤解せず使えるよう、
出所・版・source種別・閲覧範囲をどう整理しますか。共有せずローカル資料のままにする判断も含めてください。

読み手はコードを追いたい人でしょうか、資料の更新漏れを確かめたい人でしょうか。
同じsanitized全体displayと資料の全metadataを保ったまま、読む順、束ね方、参照不能の見せ方、
次回の版確認手順を選んで理由を書きます。認証値を共有しない制約の中でも、読み手に何が欠けたか伝える工夫ができます。
一つの「正しいカード」へ合わせる課題ではありません。

## Design Time

まず比較と別の制作時間に、`design.md.template` を使って用途を伝えるinstructions文字列、
6材料の並べ方、未確認を断言に変えない方針、受渡しの観測点を決めます。
完成したinstructions文字列、設計全文、**全source packet・B1/B2/B3の共通display**を、最初の比較より前に凍結します。
同じ完成設計を全条件の `participant/hc-013/design.md` に使い、run IDや実行結果はEvidenceに分けます。

例えば「見出しは読み手別、本文は出典順」と「資料ごとに版・範囲を隣に置く」を比べられます。
採用しない資料にも理由と共通display全文・metadataを残し、配列の項目を削って見やすくしないでください。
原本identity、display本文、referenceType、revision、resolvedRevision、scope、別々のhash、アクセスの合成属性、
limitations、未知の歴史を全条件に同じように渡します。本文を要約した比較は別の設計試行です。
除去した認証値や原本の除去行を設計・回答・Evidenceへ貼り戻しません。

## Build

### HubでPackと計画を用意する

以下はHub checkoutのPowerShellです。`plan-run` は表示だけでrepository作成やAgent起動はしません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-013 --condition baseline --team team-sora --run hc013-base-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-013 --condition context-card --team team-sora --run hc013-card-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-013 --condition manual-equivalent --team team-sora --run hc013-manual-01
node .\scripts\build-pack.mjs --challenge HC-013 --output .runtime/packs
```

`--output .runtime/packs` はCLIのliteral契約です。出力 `.runtime\packs\hc-013-v1` と隣のhashが
既にあれば停止します。他人の出力を消さず、既存Packの版/hashを確認するか未使用のHub checkoutを使います。

### 条件ごとにRuntimeを準備する

[Getting Started](../../docs/getting-started.md) に従い、Runtime templateから三つの非公開repositoryを用意します。
固定Runtime templateVersionは1です。
[Runtime onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)
を使い、root READMEのアプリ起動手順は使いません。次は**新しいbaseline用Runtime checkout**の例です。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-013-v1'
git status --short --branch
git switch -c hc-013-baseline-01
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition baseline --run-id hc013-base-01
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

他条件ではそれぞれのfresh repositoryでbranch・condition・run IDを替えます。Hubの `--run` と
Runtimeの `--run-id` を混同しません。既存変更・既存run・名前衝突・template不一致なら停止します。
`branchSafe: false` のためapply後はそのbranchに留まり、`run.json` の手編集で回避しません。

### 自分の不活性な受渡し資料を作る

| condition | 作成・exportするexact path |
|---|---|
| `baseline` | `participant/hc-013/design.md`、`participant/hc-013/source-handoff.md` |
| `context-card` | `participant/hc-013/design.md`、`participant/hc-013/context-card.json.template` |
| `manual-equivalent` | `participant/hc-013/design.md`、`participant/hc-013/context-card.json.template`、`participant/hc-013/manual-input.txt` |

最初に設計ひな型だけを新規作成します。次のコマンドは既存のdesign.mdを上書きしません。
Java、配布overlay、設定は変更禁止です。Evidenceはこの表とは別のrun-stateです。

```powershell
node -e "const fs=require('node:fs'),p=require('node:path');const d=p.join('participant','hc-013');fs.mkdirSync(d,{recursive:true});fs.copyFileSync(p.join('.hackathon','challenge','hc-013','design.md.template'),p.join(d,'design.md'),fs.constants.COPYFILE_EXCL);"
```

editorでdesign.mdの説明欄と、一つだけある `hc013-design` のJSON blockを記入します。
instructionsは用途と注意を書く文字列、organizationはreader、readingOrder、groups、omissionPolicyです。
readingOrderにはB1/B2/B3/P1/P2/P3を各1回入れ、groupsの各要素は `title` と `members` で作ります。
例えば「原本へ戻る順」と「未確認を先に見る順」を選べます。groupの名前や分け方に唯一解はありません。
omissionPolicyは `preserve-full-display-and-metadata` のままにします。
**全条件で同じ完成design.mdをUTF-8/LFで使い、比較開始後は書き戻しません。**

次はbaseline用Runtime rootです。`.mjs.template` は保存しただけでは動きません。
レビューした不活性helperを、明示的にstdinへ渡します。参加者用の追加scriptは作りません。

```powershell
Get-Content -Raw -Encoding UTF8 .\.hackathon\challenge\hc-013\prepare-display.mjs.template | node --input-type=module - prepare baseline
Get-Content -Raw -Encoding UTF8 .\.hackathon\challenge\hc-013\prepare-display.mjs.template | node --input-type=module - verify baseline
```

context-card用のfresh Runtimeでは末尾を `prepare context-card` / `verify context-card`、
manual-equivalent用では `prepare manual-equivalent` / `verify manual-equivalent` に替えます。
helperは同じdesign、固定3原本、P1/P2/P3、カードひな型から構築し、当該conditionの宣言済み成果物だけを新規作成します。
既存宛先、source drift、未知の行形、予定外の変換、資料の改変なら止まり、上書きや別escapeで継続しません。
CLIの要約には原本/displayの別hash・件数と成果物hashだけを出し、本文や除去値は出しません。

baselineの票には、同じinstructions、カードと同じglobal metadata、6材料の全displayTextとmetadataが入ります。
context-cardには同じ資料をまとめます。読む順とgroupを自分で設計しても、材料配列はB1/B2/B3/P1/P2/P3の順で固定します。
各B材料は `id`、`sourcePath`、全`metadata`、`displayText`、`transformation` を持ち、
P材料は元JSON全文のdisplayTextとpacketのbyte数/hashを持ちます。
`originalSha256` は原本、`display.sha256` は表示全文、`transformation` は限定した変更のreceiptです。
これはformatVersion 2の教材用schemaであり、Space APIではありません。旧 `rawText` カードは再利用しません。

verifyは現在の固定原本から同じ表示を再計算し、全成果物のbytesを比較します。metadataだけを直して原本やdisplayの差を隠せません。
helperは全workspaceの許可path検査やRuntimeのredactionを行うものではなく、教育上の答えも採点しません。
本編ではsource root引数を省略し、現在のRuntime原本だけを使います。制作者の静的QAには
`--source-root <許可済み原本の絶対path>` を明示する読み取り専用の入口もありますが、
これは別のsourceを探す許可でも、実Runtimeの実行でもありません。同じ3件の固定pinが必須です。

missing（返却欄欠落）、error（読取失敗）、empty（空文字が返った）、partial（一部だけ返った）は別です。
nullと空文字と欠落fieldも区別します。P3の未解決mainに固定版を補充したり、
sourceAccessの合成denyを「実際に拒否された」「不存在」と言い換えたりしません。
RuntimeのB1をローカルで読めても、P3の別経路・別版の未取得本文を埋める根拠にはなりません。

### 手動対照の全文を固定する

manual-equivalentのprepareは、同じ凍結入力からBと同じカードJSON全raw bytesを生成し、
同じinstructionsを付けたmanual-inputを新規作成します。自分で原本をJSON escapeして組み立て直さないでください。
`textContent.text` だけ、要約、前条件の回答を渡す方法も使いません。

```powershell
Get-FileHash .\participant\hc-013\context-card.json.template -Algorithm SHA256
Get-FileHash .\participant\hc-013\manual-input.txt -Algorithm SHA256
```

manual-inputは「instructions文字列 + LF二つ + カードのJSON全raw bytes」という受渡し形式です。
B/C両カードのhashを元原稿と照合し、instructionsの文字列比較も行います。同じ誤hashを二条件に
書くだけでは不十分です。helperはB1/B2/B3の原本bytesを独立した固定pinへ戻って検証し、
displayのhashと宣言済みの変換範囲も確認します。原本と表示全文は異なる照合対象です。
hashの一致は保存displayの照合であり、原本byte-exact、Chatへの全文投入、Space callを証明しません。

## Compare

全条件に固定request、同じinstructions、6材料のsanitized全体display・全metadata・設計をfile contextまたは手動で渡します。
保存しただけで自動適用されたとは数えず、添付表示と実際の投入範囲を確認します。
通常のread/searchは同条件で使えますが、対象はB1/B2/B3だけです。追加で必要なsourceは読まずunknownへ記録します。
原本へ戻る場合も全条件で同じ閲覧範囲を使い、除去行や値を回答・Evidenceへ転載しません。
片側だけ原本を投入した試行は統制されたdisplay比較に数えません。

| 条件 | 変えるもの | 変えないもの |
|---|---|---|
| Baseline: `baseline` | 個別資料と受渡し票で整理する | instructions、共通全display・出典・版・範囲・制約 |
| Customized: `context-card` | 自分で設計したローカルカードへ整理する | 同じ6材料の全displayと全metadata。除去をBだけに適用しない |
| 手動同等対照: `manual-equivalent` | Bと同じinstructionsとカードJSON全文を手動供給する | B/Cカードのraw bytes、配列順、limitations、未知の履歴 |

A/Bは表現・受渡し設計、B/Cは同じ情報を供給する経路の比較です。いずれもローカル資料であり、
Spaces固有の取得・同期・共有効果は測定しません。カードは参考資料で、自動発見されるInstructionsではありません。
model/effort、実効tools、承認方式、外部指示もそろえます。揃わない変更は設計迭代として別runへ分けます。

出典へ戻れた箇所、欠落したmetadata、受渡しの操作を記録します。計画上の手順数と実UI操作数、
原稿hashと投入内容、返答とその根拠確認は別です。時間・クリック・call・tokenは測れなければnullと理由を残します。
`equal`、`worse`、`incomparable`、`blocked`、`unsupported` も提出できます。改善が出るまで繰り返しません。

## Evidence

各runで三つのひな型を `.hackathon/evidence/hc-013/comparison.md`、
`recovery.md`、`provenance.md` へ新規コピーし、全見出しを記入します。
condition/run ID、comparisonGroupId、共通入力・instructions・成果物のhash、観測種別、未観測理由を記録します。
他条件を未実施なら未実施と書き、条件横断のまとめはそれぞれのRuntime PRへ対応付けます。

provenanceではsource一覧、referenceType、revision、解決commit、whole-file/範囲、観測したhashと未観測hashを分けます。
原本whole-sourceと共有display whole-textのbyte数・行数・hash、変換policy、6行のreceiptを別欄にします。
displayの除去はローカル教材の変換であり、Spaceのpartial取得でも、原本不存在でもありません。
ローカルsourceの実読取は**sourceアクセスの観測**であって、取得済みSpaceではありません。
MCP初期化、tool discovery、enabled状態、認証、組織policy、Space ACL、source ACL、source type、
実callの返却、解釈を別々に記録します。本編でのMCP/認証/ACL/同期はすべてnot-observedです。
本編では `get_copilot_space` の実callを行いません。

recoveryは自分の不活性成果物だけで、正常→revisionだけ変更→差分確認→全文復元、などを一つずつ行います。
scopeだけの変更、無害なdisplay行の一部削除、limitationsの欠落、配列順の変更、instructionsだけの変更でも
何が比較不能になるか点検できます。配布overlayやJavaを変えず、実施しなければ設計点検と明記します。
実ACLやOAuthを復元したという記録は要求しません。
戻すのは正常なsanitized成果物の全bytesです。原本の除去行・認証値・個々の値のhashを負例や復元ログに載せません。

Runtimeの見出し・template hash検査は意味の採点ではありません。
`runtimeBehavior` / `educationalEffect` は静的QAでは `not-observed` のままです。
空ひな型と異なるだけの記録、ローカルfixtureの成功を実機成功へ昇格する記録にはしません。

## Submit

三つのEvidenceと当該conditionで許可された全成果物を記入し、同じRuntime branchで確認します。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

独立したsubmit CLIはありません。拒否された理由を直すか、実施できない理由を正直に記入し、
検査器・grant・run stateを変更しません。Runtime PRには当該runの設計、受渡し資料、Evidenceを含めます。
helperの成功だけでexport済みとは言えません。Runtime v1の実exportが拒否したら、その理由を保って停止します。
より複雑なescape、markerの隠蔽、フィルター緩和で通すことはしません。
[共通Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に3条件のRuntime URL/PR URLを対応付け、
`Challenge-specific design` に出典・版・閲覧範囲の整理と共有しない判断を説明します。
任意ガイドの欄は未入力で構いません。
[Submission Guide](../../docs/submission-guide.md) に従い、秘密・実アカウント名・実データ・生transcriptを持ち込まず、
原本515ファイルはそのまま保ちます。共有資料だけを、このChallengeが明示した限定policyで表示用に変換します。
認証値と除去行を含む旧カード・旧manual-input・旧fixtureを新しい提出へコピーしません。

## Judging

資料のまとめ方の理由、全条件で同じ表示情報を保った比較、原本とdisplayの区別、版と範囲、アクセスの層、
未知の履歴を残せたかを評価します。「Spaceを使った回数」、長い回答、必ずimprovedであることは評価基準ではありません。
コードの説明は参加者がsourceへ戻って支持範囲を確認します。配布物とテストには完成済みの業務回答や講師分類を入れません。
「共有せず個別資料で十分」「未確認なので止めた」という結論も根拠があれば有効です。

## Bonus Mission

同じ凍結資料を別の読み手に渡すなら、organizationの読む順やgroupだけをどう変えるか紙上で考えます。
新しい設計は元比較から分け、共通display・metadataの削除や除去内容の復活をしないよう点検してください。
実Spaceへの公開・uploadはBonusではありません。

## Support / Fallback

Copilotを使えなくても、同じ資料で受渡し票とローカルカードを手作業で比較して提出できます。
Chatの全文投入を確認できなければその観測はnot-observed、対象機能はunsupportedまたは比較不能とします。
source読取が不足したら取得不能を不存在にせず、scopeと停止理由を残します。権限や資料を足して穴埋めしません。

実サービスに関心がある場合だけ [space-read任意ガイド](optional/space-read.md) で準備条件を読めます。
本編Packは `.vscode/mcp.json` を含むMCP設定を許可しません。ガイド閲覧も実操作の承認ではありません。
既に許可された専用Spaceのexact owner/nameがなければ実機には進まず、list探索・作成・共有・upload・
PAT発行・OAuth/権限変更は行いません。

終了後は自分の成果物をexportしbaselineの不変を確認します。自分が追加した記録だけを整理し、
他人の設定、既存Space、homeを削除するclean/resetはしません。
[Runtime repository guide](../../docs/runtime-repository-guide.md) と
[Support and Fallbacks](../../docs/support-and-fallbacks.md) に共通の境界があります。
