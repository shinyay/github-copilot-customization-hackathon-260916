# HC-012 よく使うtoolsを迷わず選べるセットにしよう

## Challenge Story

受注CSVの再送について調べるため、前任者から「いつもの四つの道具を選んで」と言われました。
名前を一つずつ探す方が分かりやすいでしょうか。それとも「受注取込を読むセット」というまとまりがある方が、別の人も選び直せるでしょうか。
短い名前だけを渡して中身を確認しなければ、選び漏れや余分な選択に気付けないかもしれません。

このChallengeでは、実在する三つのJavaファイルを読み、**同じ四toolを選び直す手順を設計して、紙上で再構成**します。
本編は不活性な文書・JSONC原稿の比較です。Profileの実変更、toolの実選択、Agentの呼出しは行いません。
このページとPack、固定Runtimeだけで始められます。以前のLABやChallenge、講師の解答、MCPサーバーは不要です。

## この機能とは

Tool Setは、**すでにある道具をひとまとめの名前で選ぶ機能**です。
名前・説明・iconを付けて、同じ選択を伝えやすくします。新しい検索処理、業務知識、利用資格やアクセス権は増えません。
たとえば次の小さな原稿は、四つの既存参照を `wholesaleReader` という名前にまとめています。
これは機能を理解する例であり、あなたが選ぶべき唯一の名前ではありません。

```json
{
  "wholesaleReader": {
    "tools": ["search/changes", "search/codebase", "read/problems", "search/usages"],
    "description": "受注取込を読むための選択単位。権限や新機能は追加しない。",
    "icon": "book"
  }
}
```

`#wholesaleReader` は集合の参照です。四toolすべての自動呼出し指示でも、ほかのtoolを禁止するACLやsandboxでもありません。
toolの承認や元の権限は別の仕組みです。次の三段階と、その後のcallを混同しないでください。

1. **宣言した集合**: 原稿の `tools` に書いた参照。
2. **再構成した集合**: 手順を読んだ人が確認票へ書き戻した参照。本編で比較するものです。
3. **選択・実効メンバー**: 実UIで選んだものと、ほかの選択経路も含めて有効なtool。原稿だけでは分かりません。
4. **実際のcall**: Agentが何を呼び、何を受け取ったか。選択や有効状態とも別の観測です。

原稿の保存ができても、製品による発見、選択状態、実際のcallまで確認できたとは言えません。本編で確かめるのは原稿と紙上の再構成です。

実機での作成入口は **Chat: Configure Tool Sets → Create new tool sets file**。
開く先は**current Profileのpromptsフォルダー**で、認識されるsuffixは `.toolsets.jsonc` です。
実際に開いた絶対パスを確かめるのであって、`.vscode\toolsets.jsonc` やworkspace直下を発見先にしません。
本編の `reader.toolsets.jsonc.template` は最後に `.template` が付くため、そのまま登録するファイルではありません。

公式ドキュメント [Create and use tool sets](https://code.visualstudio.com/docs/agent-customization/tool-sets) は、制作担当が2026-09-15に直接取得して確認しました。
作成コマンド、同じ四参照、`description` / `icon: book` の例、pickerの折り畳みグループとメンバーの選択を確認できます。
**Profile保存先とdeprecated flagは、この公式ページ本文の記載ではありません。**
[Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools) は関連資料です。

保存先の設計根拠は、承認済み設計で参照した公式sourceの [toolSetsContribution.ts](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/chat/browser/tools/toolSetsContribution.ts) の
`ConfigureToolSets` / `UserToolSetsContributions` / `RawToolSetsShape.suffix`、
[userDataProfile.ts](https://github.com/microsoft/vscode/blob/main/src/vs/platform/userDataProfile/common/userDataProfile.ts) の `toUserDataProfile` / `promptsHome` です。
**設計時のsource確認日は2026-09-15です。今回のsource再取得は未確認です**（microsoft/vscodeがSSO 403を返したため取得できず、別認証・raw URLでの迂回は行っていません）。
設計資料に記録されたupstream mainのuser set生成には `deprecated: true` という留保があり、今回確認した文書上の作成案内とは区別します。
これは最新sourceを今回取得した主張でも、installed Stableでの削除済み・利用可能の観測でもありません。実際の保存先は将来の別承認でUIが開いた絶対パスを記録します。
Local Agentの説明を別のAgent Host / harnessへ無条件に一般化せず、実機なしの本編ではすべて未観測のままにします。

## 向いていること / 向いていないこと

向いているのは、同じ道具を繰り返し選ぶ作業、担当交代時に「何を選ぶか」を短く伝えたい場面、中身の確認手順まで一緒に渡したい場面です。
たとえば、初回は説明を読み、二回目は集合を展開して四参照を確認する手順に分けられます。まとめる利益と確認する負担の両方を考えます。

一回しか選ばない、小さい作業で個別名の方が明確、相手のclientに同じtoolがない場合は、集合を増やさない方がよいかもしれません。
新しい能力を追加する、未導入toolを呼べるようにする、書込みを絶対禁止する、承認を省く、回答を必ず正しくする用途には向きません。
同じ実効集合なら回答が同じでも自然です。四つを毎回callさせることや、改善した結果だけを出すことは目的にしません。

## Starter Kit

必要なのはGit、Node.js 22以降、テキストを読んで編集できる環境、自分の非公開Runtimeへのアクセス権、公開HubへChallenge Result Issueを提出するためのサインイン済みGitHubアカウントです。
本編は手作業で進められ、Copilotの利用資格、JDK、Maven、DB、拡張の新規導入、Preview有効化は不要です。
SYNTHETIC_TRAINING_ONLY — 引継ぎの場面と記録用紙は合成教材です。Javaの実装やテスト定義まで合成の実行ログとして扱いません。

[Pack manifest](pack/manifest.json) は、次の同じ10素材を両条件の `.hackathon/challenge/hc-012/` へ不活性な `.template` のまま置きます。
コピーして保管しただけでモデルへ投入されたとは数えません。本編はAgentへ入力しません。

| 素材 | 何に使うか |
|---|---|
| [brief.md.template](pack/payload/brief.md.template) | 固定の作業と、三sourceの読み始め |
| [request.txt.template](pack/payload/request.txt.template) | 両条件で全文を変えない依頼 |
| [source-materials.json.template](pack/payload/source-materials.json.template) | Java原本とLabsの由来・hash・改作範囲。解答ではありません |
| [tool-members.json.template](pack/payload/tool-members.json.template) | 四つの説明カード、固定メンバー、非主張。Runtime設定ではありません |
| [reader.toolsets.jsonc.template](pack/payload/reader.toolsets.jsonc.template) | 集合の小さな構造例。名前・description・iconは自分で考えます |
| [design.md.template](pack/payload/design.md.template) | 両条件で共有する設計票 |
| [selection-worksheet.md.template](pack/payload/selection-worksheet.md.template) | 個別選択と集合選択、それぞれの手順票の原本 |
| [comparison.md.template](pack/payload/comparison.md.template) | 比較Evidenceのひな型 |
| [recovery.md.template](pack/payload/recovery.md.template) | 一要因の負例と復元、または紙上点検のひな型 |
| [membership.md.template](pack/payload/membership.md.template) | 宣言・再構成・実効状態・callを分けるひな型 |

sourceKindは `baseline` です。次は**Runtimeのrootからのexact path**で、全部を実際に読める状態にします。

| 実source | 自分で読む箇所と目的 |
|---|---|
| `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | `importDraft` の中で `replay` へ進む箇所と `replay` 本体を追い、確認したいsymbolを選ぶ |
| `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | `canonicalHash` と `validate` を読み、先に確かめる前提を自分で挙げる |
| `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | `connect` の前提と、再送を扱う `@Test` 定義の入力・assertion・限界を読む |

原本は **`shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`**。
Labs `3474d21dd62bad2e594e84657dabe2eb9bb876c1` は教材の執筆根拠の版であり、Java原本のcommitではありません。
Runtimeの515-file baseline、provenance、二つの運用overrideの検査は維持します。Packに別のJavaツリーは作りません。
テスト定義の読解であり、Java・DB実行ではありません。root READMEのアプリ起動手順、テスト内の接続や認証の処理は実行しません。

四参照を初めて見る場合は、次のカードから用途と限界を確認してください。

| 固定参照 | 小さな説明カード |
|---|---|
| `search/changes` | 変更を調べる入口。本課題はアプリ変更なしなので変更がなくても異常ではありません。結果を作るためにsourceを変えません |
| `search/codebase` | 意味に基づいて関連コードへ到達する入口。索引の状態と実際に利用できたことは別途確認します |
| `read/problems` | 利用可能な診断を読む入口。空結果はアプリ全体に不具合がない証明ではなく、対象範囲と言語サービスの起動状態にも依存します |
| `search/usages` | symbolの利用・関係を調べる入口。対応する言語機能やXML配線の限界を確認します |

これらは公式ガイドの参照名であり、内部extension IDや推測したMCP名ではありません。installed toolsの実在は本編で確認しません。

## Open Question

**同じ四つの道具を、別の参加者が迷わず選び直せるようにするには、どんな集合名・説明・確認手順がよいでしょうか。個別選択の方が分かりやすい場合も説明してください。**

名前を短くする利益と用途が伝わらなくなる不利益、説明を増やす利益と読む負担、iconだけに頼る危険を考えられます。
初回の準備と、翌日の再設定で同じ説明が必要でしょうか。選び漏れや余分な選択があったら、誰がどこで気付けるでしょうか。
固定四参照は変えませんが、確認する順番、引継ぎ文、集合を使わない判断に唯一解はありません。

## Design Time

まず三sourceを実際に読み、各ファイルについてpath・symbol・行範囲と「ここだけでは分からないこと」を設計票に記入します。
読めないsourceを読んだことにせず、停止理由を残してください。採用理由や履歴は、資料がなければunknownです。
テスト名やassertionを見付けることと、テストが通ったことは別です。

次に `design.md` へ、読む相手、集合の名前・description・iconの候補、個別選択の代案、確認漏れを防ぐ方法を書きます。
`wholesaleReader` / `book` を残しても構いませんが、理由は自分で説明します。
比較の観点は先に決めます。たとえば「四参照へ迷わず戻れるか」「初回と再設定を区別できるか」「余分な選択を見つけられるか」です。
想定手順の数え方も決めますが、その数を実測クリック数や時間短縮率へ換算しません。

完成した共通設計・依頼・資料を凍結し、同じbytesを両条件へ渡します。制作の試行錯誤は比較runとは別です。
別条件の完成回答や要約を固定入力へ混ぜません。改善案を途中で思い付いたら、新しい比較へ分けます。

## Build

### 1. Hubで条件とPackを確認する

次は**Hub checkoutのroot**で実行します。dry-runは表示だけで、repository作成や製品の起動ではありません。
`--run` は提案用の名前です。apply後の本当のrun IDはRuntimeの `.hackathon/run.json` で確認し、手編集しません。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-012 --condition baseline --team team-sora --run individual-01
node scripts\plan-run.mjs --dry-run --challenge HC-012 --condition tool-set-design --team team-sora --run set-01
```

手元の `challenges\hc-012\pack` directoryを使えます。配布Packを作る場合だけ、Hubで次を使います。

```powershell
node scripts\build-pack.mjs --challenge HC-012 --output .runtime/packs
```

出力引数 `.runtime/packs` はCLIの固定値です。生成先 `.runtime\packs\hc-012-v1` や隣のhashが既存なら停止します。
既存の出力を消してやり直さず、版・hashを確認するか未使用のHub checkoutを使います。

### 2. 条件ごとに未使用のRuntimeを準備する

[Getting Started](../../docs/getting-started.md) に従い、Runtime templateから条件別に**二つの新しい非公開repository**を用意します。
manifestはseparate-repository、別の名前付きbranch、新規workspace・会話・profileを分離単位として宣言します。
本編は手作業の設計比較なので会話・Profileの製品利用はnot-usedです。`freshProfile: true` は既存Profileを作り替える命令でも、実機隔離を確認済みにする値でもありません。
既存HOME/User/組織/Memoryを削除して条件を揃えません。残留の不明点を記録し、使い回した実機環境をfreshと報告しません。

以下は**新しいbaseline用Runtime checkoutのroot**です。`$pack` は実在するPack **directoryの絶対パス**へ置き換えます。
`.hackathon/template.json` はversion 1である必要があります。

```powershell
$pack = 'C:\work\hub\challenges\hc-012\pack'
git status --short --branch
git switch -c hc-012-baseline-individual-01
node .hackathon\scripts\verify-template.mjs
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition baseline
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

もう一方の**未使用のRuntime checkout**では、同じPackを指定して次を行います。

```powershell
$pack = 'C:\work\hub\challenges\hc-012\pack'
git status --short --branch
git switch -c hc-012-tool-set-design-set-01
node .hackathon\scripts\verify-template.mjs
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition tool-set-design
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

コマンドごとに終了codeを確認し、既存変更、名前の衝突、template不一致、既存runがあれば停止します。
上書き・強制追加・run.jsonの書換えでは回避しません。`branchSafe: false` のrunはapplyしたbranchを提出まで使います。
実CLIの説明は [Runtime onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md) にあります。

### 3. 自分の不活性な成果物を書く

配布物は編集・renameせず、必要な親folderを作ってから下表のexact pathへ新規コピーします。
コピー先が一つでも既存なら停止し、以前の草稿やEvidenceへStarterを重ねて上書きしません。
そのrunで自分が新規作成した草稿を編集することとは区別してください。

| 原本 `.hackathon/challenge/hc-012/` 内 | `baseline` のコピー先 | `tool-set-design` のコピー先 |
|---|---|---|
| `design.md.template` | `participant/hc-012/design.md` | `participant/hc-012/design.md` |
| `selection-worksheet.md.template` | `participant/hc-012/individual-selection.md` | `participant/hc-012/selection-plan.md` |
| `reader.toolsets.jsonc.template` | 作らない | `participant/hc-012/reader.toolsets.jsonc.template` |
| `comparison.md.template` | `.hackathon/evidence/hc-012/comparison.md` | `.hackathon/evidence/hc-012/comparison.md` |
| `recovery.md.template` | `.hackathon/evidence/hc-012/recovery.md` | `.hackathon/evidence/hc-012/recovery.md` |
| `membership.md.template` | `.hackathon/evidence/hc-012/membership.md` | `.hackathon/evidence/hc-012/membership.md` |

Evidenceの三つはrun-stateで、participantの追加許可とは別です。baselineは二つ、tool-set-designは三つのparticipantファイルだけを作ります。
Java、既存テスト、root README、Pack配布物、`.github`、`.vscode`、User/Profileの発見先を変更しません。

Baselineでは四参照を個別に見付け、選び、固定リストへ戻って確認する初回・再設定の手順を書きます。
Customizedでは名前付きobject一つに `tools` / `description` / `icon` を持つ原稿を書き、集合の展開後に同じ四参照だけか確認する手順を書きます。
ほかの選択経路から同じtoolや余分なtoolが残る可能性も、将来の実効一覧の確認として計画に残します。

JSONCはコメントを許す形式ですが、本編の原稿は**strict-JSON subset（コメント・末尾カンマなし）**に限定します。
コメント削除の自作parserや依存追加は不要です。次は**集合条件のRuntime**で構文だけを読むコマンドです。

```powershell
node -e "JSON.parse(require('node:fs').readFileSync('participant\\hc-012\\reader.toolsets.jsonc.template','utf8')); console.log('JSON syntax only; feature not observed')"
Get-FileHash .\participant\hc-012\design.md -Algorithm SHA256
Get-FileHash .\.hackathon\challenge\hc-012\request.txt.template -Algorithm SHA256
```

JSON parseやhash一致は、toolの存在・発見・実選択の証拠ではありません。実UIは開かず、`.template` を外しません。
書き終えたら別の人に同じ資料と手順だけを読んでもらい、四参照を紙上で書き戻してもらいます。
一人なら自己点検と明記できますが、第三者の再現に見せません。再構成後の一覧を各手順票へ記録します。

## Compare

| condition | 呼び名 | 同じ四参照 | 変える要因 |
|---|---|---|---|
| `baseline` | Baseline | `search/changes`, `search/codebase`, `read/problems`, `search/usages` | 個別選択の手順と確認票 |
| `tool-set-design` | Customized | `search/changes`, `search/codebase`, `read/problems`, `search/usages` | 名前付き集合の原稿、展開・選択・確認の手順 |

Customizedは設計条件の呼称で、製品機能を有効化した意味ではありません。再設定は各条件内の反復で、第三conditionではありません。
共通の依頼全文、三source、全資料、共通設計、四参照、安全条件を固定します。baselineだけ資料や道具を不足させません。
model/effort、実効tools、承認方式を使う実機試行なら別途揃える必要がありますが、本編ではnot-used / not-observedです。

まず各原稿と再構成票を**固定四参照に対して**照合し、その後で両条件の一致を確認します。
両条件が同じ三参照、または同じ別の四参照でも失敗です。欠落・余分・重複・未知の参照を、相手との一致で隠しません。
初回準備と別の人の再設定を分け、どの説明で迷ったか、どの確認で不一致に気付いたかを比較します。

本編で数えられるのは想定手順や紙上の指摘です。実測クリック数・時間・callはnull、実機はnot-observedです。
実機ではクリック・展開・チェック変更をそれぞれ一操作とするなど先に数え方が必要ですが、その観測は本編に含みません。
同じ人による再読にはcarryoverがあります。別repositoryでも、人の記憶や外部設定まで消えるとは言えません。

設計上の `improved` だけでなく、`equal`、`worse`、追加不要を受け入れます。
入力や比較軸が違えば `incomparable`、準備や許可の境界なら `blocked`、実機機能が使えなければその項目は `unsupported` と理由を記録します。
UIなしでも設計は完成できます。未観測の実機まで成功・失敗に丸めません。

## Evidence

各runの `.hackathon/evidence/hc-012/` に次の**三ファイルすべて**を記入します。ひな型のまま、または末尾に一行足しただけでは提出しません。

- `comparison.md`: 自runのcondition/run ID、比較groupと他runへの対応、共通入力・成果物のhash、三sourceの読解、設計比較と限界。
- `recovery.md`: 元の正常形→一要因の欠落等→意図した形と検出理由→元の完全なbytesへの復元。自分の不活性草稿の編集か、紙上点検かを区別。
- `membership.md`: 宣言した集合、手順から再構成した集合、初回・再設定の想定手順。選択・実効メンバー・callは未観測として別欄へ。

負例のためにsource、Pack、Profileを変えません。紙上で考えただけなら復元不要と理由を書き、実ACLの復元を装いません。
`search/changes` に変更がないこと、`read/problems` に診断がないことを、不具合ゼロへ読み替えない点も残してください。
言語サービス・索引・installed tools・実際の絶対保存pathが不明なら不明のままにします。
Runtimeの見出し・hash検査は、文章の意味や実UIを自動採点しません。`runtimeBehavior` / `educationalEffect` は `not-observed` のままです。

## Submit

各Runtimeの同じbranchで、記入済みEvidenceと許可されたparticipant成果物を検査・exportします。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

ひな型のまま、欠落、宣言外変更で拒否されたら理由を直すか停止し、検査器・schemaを変更しません。
exportした不活性bundleと記録を確認して各Runtime PRを作り、
Hubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に両conditionとそれぞれのrepository・PR・実run IDを対応付けます。
未実施の相手条件は未実施と書き、二条件を一runの成功記録にしません。

`Challenge-specific design` には集合名・説明・iconの意図、固定四参照の選び直し、個別選択の代案、漏れ・余分の検出、使わない場面を記載します。
任意ガイドは本編とは別欄でguide-only / unperformedとし、実機成功にしません。
[Submission Guide](../../docs/submission-guide.md) に従い、実HOMEのpath、アカウント、認証値、既存User設定、生ログを載せません。

## Judging

評価するのは、初心者が同じ四参照へ戻れる説明、自分の用途に合う名前と代案、初回と再設定の違い、不一致の検出、制約を残す姿勢です。
三sourceを実際に読み、根拠の場所と未確認を示せるかも確認します。講師の業務結論への一致を要求しません。
集合の数、call数、機能を使った回数、見かけの時間短縮だけでは採点しません。
同等・悪化・追加不要や、正直な未観測も価値のある結果です。構造テストの合格を教育効果の実証としません。

## Bonus Mission

凍結済みの比較を変えず、引継ぎの一文を短くする案と、集合を作らず個別選択の説明を残す案を紙上で比べてください。
名前を知らない人にも用途と対象外が伝わるか、自分の設計票に補足できます。
新condition、追加MCP/Plugin/Custom Agent、Profile操作は増やしません。Bonusの発想を最初から決めていた比較軸に後付けしません。

## Support / Fallback

Tool Sets UIや四toolがなくても、本編の不活性原稿と紙上の再構成で提出できます。製品機能はunsupported / not-observedと分けます。
実sourceやRuntimeを準備できなければ、読解・提出の不足をblockedとして残し、架空のsourceや実測値で埋めません。
既存ファイルを消して開始条件を作ったり、未知のtool名へ置き換えて固定契約に合格させたりしません。

将来の別承認に向けた準備確認だけが [Profile Tool Setsの任意ガイド](optional/profile-tool-sets.md) です。本編の必須手順ではありません。
ガイドの表示だけならHubで次を使えます。condition / team / run引数は混ぜません。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-012 --route profile-tool-sets
```

終了時は今回の自分の成果物をexportし、baselineの不変を再確認します。既存HOME/Profileや他人の設定を削除しません。
cleanupは助言であり、広範囲のclean/resetや外部状態の自動復元ではありません。本編では停止すべき製品processも起動していません。
[Runtime repository guide](../../docs/runtime-repository-guide.md) と [Support and Fallbacks](../../docs/support-and-fallbacks.md) に共通の停止境界があります。
