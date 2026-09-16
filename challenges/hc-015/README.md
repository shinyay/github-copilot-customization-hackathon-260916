# HC-015 最短経路で必要なコードへ到達しよう

## Challenge Story

「受注の在庫引当はどこから始まり、transactionはどこで決まりますか」と聞かれました。検索するとJavaの同じ単語がいくつも見つかります。しかし、ヒット数が多くても、必要な設定まで読めたとは限りません。Javaの定義からXMLへ移り、説明の根拠を揃える道筋が必要です。

このChallengeでは、通常の検索で探す方法と、先に二つのファイル全文を渡す方法を実際に比べます。タイトルの「最短」は性能改善の約束ではありません。先に添付する準備のほうが重い、自力検索で十分だった、という発見も大切です。このページとStarter Kitだけで始められ、過去のChallenge・LABの回答や履修は不要です。

## この機能とは

**コンテキストの添付は情報を渡す操作、検索は情報を探す操作**です。どちらも新しい常設Instructionsを作る必要はありません。通常のVS Code Stable / Copilotで利用できるread/searchと、ChatのAdd Contextによるfile添付を本編で使います。

たとえば、`allocate`を文字列検索して定義のあるJavaを開く方法と、最初からそのJavaファイルをChatへ添付する方法は、同じsourceへ向かう別の入口です。XMLもfileとして添付すれば設定を渡せますが、添付しただけでモデルが全行を読んだとは言えません。

- **Add Context**: ファイル等を依頼に明示するUIです。文書では`Add Context → Files & Folders`、`Symbols`、`#`参照、ドラッグ＆ドロップが案内されています。本編ではfileを選び、symbol・selection・folderの添付とは区別します。候補名を入力しただけで添付できたことにせず、実添付表示を確認します。
- **text/file search**: 名前や文字列を手がかりに探します。grep/text/file検索はsemantic indexなしでも使える経路です。`allocate`の文字列一致は、呼出し・定義・実行回数の確定ではありません。
- **言語機能 / LSP**: Java拡張などが定義・参照の位置を解決します。AgentのUsagesはreferences・implementations・definitionsを組み合わせて調べる経路です。人のGo to Definition / Find All Referencesと、AgentがUsagesを使った記録は別で、一つのエディター操作と同一とはしません。
- **semantic index**: semantic検索に必要な、関連箇所を探すための索引です。リポジトリ全文を毎回投入する機能でも、読取り権限を与える機能でもありません。状態の確認先はCopilot status dashboardです。個人・enterpriseの利用資格やpolicy、初期化状態を別々に記録し、未準備を検索0件へ読み替えません。未準備なら全条件を同じtext/file searchへ揃え、semantic成功を主張しません。

取得確認した一次資料（**2026-09-15**）: [Add context to chat](https://code.visualstudio.com/docs/chat/copilot-chat-context)、[Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)。補足: [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)。UI名・候補・使えるtoolsは利用中の版と表示で確認してください。文書には添付したfileのraw bytesすべてがモデルへ届く保証はありません。文書を読んだこと、原稿のhashが一致したこと、実機で操作できたことは別の証拠です。本教材の制作時には実UI・LLM・LSP・indexを操作していません。

## 向いていること / 向いていないこと

**向いていること**

- 入口は分かるが、JavaとXMLを行き来する調査で根拠が抜けやすい。
- ファイル名は知っていて、検索を毎回繰り返すか先に全文を渡すかを選びたい。
- 「見つからなかった」を、対象範囲・index・未対応・アクセスなどへ切り分けたい。

**向いていないこと**

- 読む量を増やせば必ず正しい、添付すれば必ず速い、という保証が必要な場面。
- sourceを隠してBaselineを不利にする比較や、検索除外をACLとして使うこと。
- 文字列検索をLSPの代用品とし、未観測を「参照0件」へ置き換えること。
- 静的なJava/XML読解だけで、Springの実proxy・実transaction・DB動作を証明すること。

言語拡張が未導入でも、text/file searchと全文readが利用できるなら本編を続けられます。LSPだけをunsupportedとして分け、新しい拡張を自動installしません。

## Starter Kit

[Pack manifest](pack/manifest.json) はschemaVersion / challengeVersion / minimumTemplateVersionがすべて1です。sourceKindは`baseline`。元アプリは **shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787** の515ファイルで、Runtime rootにあります。Labs repositoryは教材の改作元であり、アプリのsource repositoryではありません。PackにJavaの重複treeや業務の完成回答はありません。

### 同じsourceを三条件へ

次はRuntime root相対のexact pathです。JSON・表のpathは契約上POSIX表記、Windowsの操作コマンドは`\`表記を使います。

| ID / 読むファイル | 調べること | 全文bytes |
|---|---|---:|
| A1 `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `OrderService.allocate`の定義。333–349行を入口に必要な前後・参照先を読む | 29357 |
| A2 `wholesale-core/src/main/resources/application-context.xml` | transaction設定とimport。44–53行、82–89行を本文全体とともに確かめる | 5169 |
| A3 `wholesale-core/src/main/resources/spring/module-operations.xml` | A2のimportから辿る実際のbean定義。10–14行を入口に読む | 1405 |

これらは**読む候補でありACLではありません**。必要な参照先は全条件で同じbaselineから読めます。A3は全条件へ等しく利用可能にし、追加readの理由と範囲を記録します。import先を推測した別のXML名へ置き換えません。

主比較のB/Cで事前供給するのは**A1/A2の二つの全文だけ**です。原文合計は34526 bytes、A3も足すと35931 bytesです。request・filename delimiterはこの値に含みません。各fileの固定SHA-256と行数は[source-targets.json.template](pack/payload/source-targets.json.template)にあります。Byte数は測定済みですが、実token数・clientの容量・切り詰めなしは未観測です。

### 配布物と道具

全条件へ同じ12個の不活性`.template`を`.hackathon/challenge/hc-015/`にoverlayします。原本は編集・renameしません。

| 配布物 | 使い方 |
|---|---|
| `brief.md.template` / `request.txt.template` | 共通の前提と、全条件へ省略せず送る依頼 |
| `source-materials.json.template` / `source-targets.json.template` | 原本の由来・改作・hashと、固定sourceの照合 |
| `design.md.template` | 自分の判断と停止基準を先に書く |
| `context-plan.md.template` | B/Cの全文準備・投入範囲・同等性の計画 |
| `query.json.template` / `search-plan.json.template` | queryとscope、未観測の状態を分ける教材用データ |
| `manual-input-layout.txt.template` | 元sourceから作るCのfilename delimiter仕様 |
| `comparison.md.template` / `recovery.md.template` / `context.md.template` | 当該runの三つのEvidenceの編集開始点 |

query/search-planは **SYNTHETIC_TRAINING_ONLY** の設計教材です。アプリsourceは合成メモと混同せず固定baselineのままです。JSONはVS Code設定やLSPイベントschemaではなく、読み込ませて設定を有効化するものではありません。

Node.js 22以降、Git、Hubと新しい非公開Runtime repositoryを扱える参加権限、利用できるVS Code Stable / Copilotとread/search toolsを用意します。Java/JDK、Maven、DB、アプリ・test実行は不要です。root READMEのアプリ起動手順はこの課題では使いません。新規MCP、Skill、Hook、Custom Agent、拡張、indexを導入せず、User/Profile・workspace設定や除外も変更しません。

## Open Question

**OrderService.allocateの説明に必要なJavaとXMLへ、必要な情報を削りすぎず到達するには、どこから探し、何を明示添付しますか。全文添付の負担が大きい場合や、自力検索で十分な場合も説明してください。**

本編の統制比較では添付集合をA1/A2に固定します。その制約の中で検索順序、追加readの判断、投入確認の手順を設計してください。別集合のほうがよいという提案も歓迎しますが、本編の途中で入力を替えず別の再設計として説明します。

## Design Time

回答を見る前に、人が次を決めて`participant/hc-015/design.md`へ記録します。

1. 何を「必要な根拠に到達した」とするか。path・symbol・行範囲がsourceへ戻れること、XMLへの移動と不確実さの説明などから観測基準を作ります。
2. 検索語の順序、対象範囲、全文を開く時点、importや参照を辿る基準、探索を止める条件。文字列一致と定義読解のどちらを観測したかを区別します。
3. A1/A2の全文準備、Bの実添付表示、Cのsection別raw hashを確かめる方法。A3を追加で読んだ操作は別欄にします。
4. 操作数の定義。検索・file read・添付・貼付・追問を分け、予定手順数を実UI操作数としません。実測できない時間・token・call数はnullにします。
5. 同じrequest、source/access、model/effort、実効tools、承認方法、tabs/selectionの扱いと、変わったときの停止。home・User・組織指示・Memory・設定同期の残留も記録します。

試作と比較runを分け、設計revisionと共通入力hashを凍結してから始めます。新しいrepositoryやprofileでもhomeを完全分離したことにはなりません。既存設定や他人の資料を削除して条件を揃えず、分離できなければincomparable / blockedとします。

## Build

### 1. Hubで計画し、Packを作る

以下は**Hub checkoutのroot**です。teamとrun IDを自分用に置き換えます。dry-runはrepositoryを作らず、live操作もしません。

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-015 --condition baseline --team team-sora --run hc015-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-015 --condition explicit-context --team team-sora --run hc015-context-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-015 --condition manual-equivalent --team team-sora --run hc015-manual-01
node .\scripts\build-pack.mjs --challenge HC-015 --output .runtime/packs
```

`--output .runtime/packs`の値だけはCLIが要求するliteralです。実際の出力は`.runtime\packs\hc-015-v1`という**ディレクトリ**と隣接hashです。既存出力を消して上書きせず停止します。未公開・version不一致なら運営へ確認してください。

### 2. 条件ごとに新しいRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template)の**Use this template → Create a new repository**で自分のOwnerに三つの新しい**Private repository**を作ります。それぞれのCodeに表示されたURLを使い、`git clone "コピーしたURL" "条件専用の新規フォルダー名"`で取得します。Hubと各Runtimeは別フォルダーに置き、入れ子にしません。通常の参加準備は[Getting Started](../../docs/getting-started.md)でも確認できます。

一つのrepositoryでbranchを切り替えて条件を使い回してはいけません。本Packはrepository tier、separate-repository、branchSafe:falseです。fresh repository / workspace / conversation / profileを条件ごとに用意し、同じRuntime template version 1を使います。

次は**各Runtime checkoutのroot**で一条件ずつ行います。`$Pack`は先ほどの展開済みPack directoryの絶対パスです。run IDも条件専用にします。失敗したコマンドがあれば続けず原因を確認してください。

```powershell
$condition = "baseline"
$runId = "hc015-baseline-01"
$Pack = "C:\work\hub\.runtime\packs\hc-015-v1"
git switch -c $runId
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $condition --run-id $runId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

Bでは`explicit-context` / `hc015-context-01`、Cでは`manual-equivalent` / `hc015-manual-01`を、その条件専用のrepositoryで指定します。中立状態の`verify-template.mjs`と、apply後の`verify-run.mjs`は目的が違います。`.hackathon/run.json`を手で変更せず、applyしたnamed branchを維持します。[Runtime repository guide](../../docs/runtime-repository-guide.md)も参照できます。

### 3. 設計票とEvidenceを新規作成する

これは**人の準備作業**です。固定taskのAgentにはsourceの調査だけを頼みます。apply済みRuntimeで実行し、既存の自分の成果物も上書きしません。

```powershell
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-015"
New-Item -ItemType Directory -Path .\participant\hc-015
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-015
[System.IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-015\design.md", $false)
if ($condition -eq "baseline") {
    New-Item -ItemType File -Path .\participant\hc-015\search-plan.md
} elseif ($condition -in @("explicit-context", "manual-equivalent")) {
    [System.IO.File]::Copy("$starter\context-plan.md.template", "$root\participant\hc-015\context-plan.md", $false)
} else {
    throw "このPackにないconditionです。"
}
foreach ($name in @("comparison", "recovery", "context")) {
    [System.IO.File]::Copy("$starter\$name.md.template", "$root\.hackathon\evidence\hc-015\$name.md", $false)
}
```

`Copy`の`$false`と新規作成は上書きを拒否します。途中まで作成して失敗しても、既存のファイルを削除して再実行しません。状態を確認してください。

Baselineの`search-plan.md`には、query/search-planのJSONを読んで、検索順・範囲・XMLへ進む判断・停止基準を自分のMarkdownで書きます。JSONを設定として実行しません。B/Cは`context-plan.md`を具体化します。Cの`manual-input.txt`は次のbyte-copyで作ります。設計票はUTF-8/BOMなし・LFで保存し、凍結した判断を三条件に揃えます。

### 4. 固定sourceのraw bytesを照合し、Cだけpacketを作る

次は各Runtime rootで実行するNodeのファイル検査です。JavaやDBを起動しません。全三fileを固定oracleへ照合し、CだけA1/A2のraw全文を組み立てます。`$condition`はこのrepositoryへapplyした値です。

```powershell
@'
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const condition = process.argv[2];
assert.ok(["baseline", "explicit-context", "manual-equivalent"].includes(condition));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const targets = JSON.parse(readFileSync(path.join(".hackathon", "challenge", "hc-015", "source-targets.json.template"), "utf8"));
const files = targets.sources.map((source) => {
  const content = readFileSync(path.join(...source.path.split("/")));
  assert.equal(content.length, source.bytes, source.path);
  assert.equal(hash(content), source.sha256, source.path);
  console.log(JSON.stringify({ path: source.path, bytes: content.length, sha256: hash(content) }));
  return { ...source, content };
});
if (condition === "manual-equivalent") {
  const packet = Buffer.concat([
    Buffer.from("HC-015 MANUAL FULL-SOURCE v1\n", "utf8"),
    ...files.slice(0, 2).flatMap((file) => [
      Buffer.from(`<<<BEGIN FILE ${file.path}>>>\n`, "utf8"),
      file.content,
      Buffer.from(`<<<END FILE ${file.path}>>>\n`, "utf8"),
    ]),
  ]);
  writeFileSync(path.join("participant", "hc-015", "manual-input.txt"), packet, { flag: "wx" });
  console.log(JSON.stringify({ packetBytes: packet.length, packetSha256: hash(packet) }));
}
'@ | node --input-type=module - $condition
```

`flag: "wx"`は既存packetを上書きしません。各fileのbytesとhash、Cのpacket全体のhashを`context.md`へ記録します。Gitの改行変換等で不一致になった場合、sourceや期待hashをその場で変更して通さず停止してください。B/Cが同じ誤hashでも、固定sourceとの照合なしに同一としません。

### 5. 通常のStableで比較を実施する

新規会話で、各条件とも`request.txt.template`の**全文**を送ります。共通の読む候補とsource/access、model/effort、実効read/search tools、承認方式を変えません。不要な添付・selection・前の回答・無関係なtabsの混入を確認します。他人のtabsや設定は勝手に消しません。

- **A / baseline**: 二fileを先に添付せず、通常のtext/file searchと全文readで探します。Aにも全baselineは読める状態にします。検索語、開いたpath、読めた範囲を記録します。
- **B / explicit-context**: Chatの**Add Context → Files & Folders**でA1、A2を**fileそのものとして**選び、exact pathと二つの添付表示を確認してから同じ依頼を送ります。Symbolsからのsymbol添付、selectionだけ、同名別ファイルではありません。UIが示す範囲と、内部投入で確認できない範囲を分けます。
- **C / manual-equivalent**: Bと同じA1/A2全文を含む`manual-input.txt`を開き、preamble・filename delimiterも含む**全体**を同じ依頼とともに手動供給します。Bとは別の要約・抜粋・前の回答を使いません。

全条件でA3や必要な参照先を追加readできます。どのpathを何のために読んだか、要求した範囲・返却範囲・実際に読んだ範囲を記録します。検索能力をBだけ増やしたり、Aだけ全文を読めなくしたりしません。

全文が収まらない、切り詰めが疑われる、内部投入を確認できない場合はその状態を記録します。**片側だけ要約して比較を通しません**。同じ原稿を用意できたことと、同じ全文が実際に投入されたことは別です。未対応clientならSupport / Fallbackの設計提出へ切り替え、実検索・添付成功とは数えません。

## Compare

Baselineは`baseline`、Customizedに当たる本編経路は`explicit-context`、同全文の手動対照は`manual-equivalent`です。condition名はこの三つだけで、LSP/index診断を第四の条件にしません。

| condition | 固定入力とアクセス | 変える要因 | 許可されたparticipant成果物 |
|---|---|---|---|
| `baseline` | 同じtaskと全baseline、同じread/search | 自力で探す | `design.md`, `search-plan.md` |
| `explicit-context` | 同上、事前供給はA1/A2全文 | Add Contextによる供給 | `design.md`, `context-plan.md` |
| `manual-equivalent` | 同上、Bと同じA1/A2全文 | filename delimiter付き手動供給 | `design.md`, `context-plan.md`, `manual-input.txt` |

表のfileはすべて`participant/hc-015/`直下のexact pathです。A3は全条件に等しく利用可能で、追加readは供給効果と分けて数えます。別添付集合を試すなら別design revision・別比較groupとし、同じ比較内の入力をこっそり変更しません。

初回に必要な根拠へ到達したか、不要な検索や追問があったか、全文準備の負担はどうかを見ます。操作数・時間は測れたものだけです。回答のpath/symbol/行範囲を人が元sourceへ戻って確かめ、引用件数だけで勝敗を決めません。

B/Cで準備したsource bytesが一致しても、UI metadata、文脈の優先度、内部投入量まで同じとは保証しません。unobserved / pending / unsupportedは0件でも正しい回答の証拠でもありません。LSPが使えなければLSPだけunsupported、index未確認ならsemanticResultsはnullとし、同じtext/file能力で比較できる範囲を限定します。

負例は本比較の回答を汚さない別の確認にします。自分の不活性成果物について、正常確認→一要因変更→意図したpost-image確認→具体的理由での拒否→元の完全なbytesへ復元→同じ検査で正常、の順を記録します。manualの1行欠落、filename違い、queryのallocate→approve、333行を外すscope、両条件共通の誤hashなどを使えます。sourceや配布原本は変更せず、実施しなければdesign-onlyと明示します。

## Evidence

各conditionにexact三ファイルが必要です。`.hackathon/evidence/hc-015/`はRuntime所有のrun-stateであり、allowedAdditionsではありません。未記入のひな型を提出せず、次のH2を維持して自分の観測へ置き換えます。

| ファイル | 必須H2 |
|---|---|
| `comparison.md` | Fixed task / Environment / Design / Observations / Comparison / Outcome |
| `recovery.md` | Case / Expected boundary / Observed result / Restoration / Non-claims |
| `context.md` | Requested context / Provided context / Source references / Search and language status / Non-claims |

当該run ID、condition、comparisonGroupId、request/source/成果物hash、実施・design-only・fixture-onlyの区別、未観測理由を書きます。Bの実添付表示、Cのsection別raw照合、A3への追加read、LSP/indexの状態は別欄です。literal scanの成功をVS Code検索・LSP・semantic検索・Add Context成功へ再ラベルしません。

制作側の[構造検査](../../tests/support/hc-015-context-checks.mjs)はtests内だけに置き、PackやRuntimeへ追加しません。これもRuntimeの見出し・template hash検査も、業務の答えを採点するoracleではありません。sourceを静的に読めても、実proxy・実transaction・Java/DBテスト・過去の設計意図は未確認です。未実施のruntimeBehavior / educationalEffectは`not-observed`とします。

## Submit

各Runtimeの当該branchで、設計成果物と三つのEvidenceを揃えてから実行します。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

submittedが失敗したらexportへ進みません。独立したsubmit CLIはありません。exportされたbundleと許可された成果物を自分のRuntime PRに含め、[共通Challenge Result Issue](../../.github/ISSUE_TEMPLATE/challenge-result.yml)でHC-015、当該run・condition、Runtime repository/PR、比較結果を提出します。[Submission guide](../../docs/submission-guide.md)も参照できます。

当該conditionの上表の全追加物と三つのEvidenceがexport対象です。他conditionのpath、任意診断の設定、生transcript、別sourceのコピーをbundleへ混ぜません。Cのmanual-inputは固定教材全文だけであり、実データを追加しません。秘密・認証値・実アカウント情報が入っていないか点検し、固定sourceをredactionで改変して同一だとは言いません。

`Challenge-specific design`には「到達経路を選んだ理由、固定した二全文、実際に投入・読取できた範囲、A3への追加read、未観測」を記入します。三条件を一つのrunとして偽装せず、横断比較はcomparisonGroupIdとそれぞれのrun/PRへのリンクで結びます。未実施conditionは未実施のまま残します。

## Judging

- 探索の順序・停止基準・供給方法に、自分の理由と具体的な工夫があるか。
- task/source/access/model/toolsを揃え、準備した全文と実投入の同等性を区別したか。
- Javaの定義、XMLのimport、bean定義へ戻れる根拠と、確認できない点を示したか。
- 文字列検索、言語機能、semantic index、添付の状態を混同していないか。
- 負例の狙いと復元、全文準備の負担や追加不要という判断を説明できるか。

機能を使った回数、引用の数、改善だけで採点しません。`equal`、`worse`、`incomparable`、`blocked`、`unsupported`も根拠があれば有効な結果です。構造テストのpassだけで教育効果を認定せず、人がsourceと記録を読みます。

## Bonus Mission

本編を凍結したまま、「A3も最初から添付したい」「まず自力で探したい」など別の候補を選ぶ理由と費用を考えてください。入力集合が変わるため別design revisionです。本文を削ったB/Cを元の比較へ混ぜたり、追加Challengeの完了を本編の前提にしたりしません。提案だけでも十分です。

## Support / Fallback

- [language-tools: 定義・参照と言語サービスの準備](optional/language-tools.md)はJava拡張が既にある場合の任意ガイドです。人のエディター操作とAgent Usagesを分け、実機利用は別承認です。
- [index-exclusions: 索引・除外の準備とblocked境界](optional/index-exclusions.md)は別診断のガイドです。Runtime v1でworkspace設定を追跡する経路はblockedです。設定変更、index構築、force-add、User/Profileへの黙った迂回を本編へ足しません。

どちらもOPTIONAL_GUIDE_ONLY / live-unobservedで、読むだけで実機を開始・許可しません。任意未実施でも本編を提出できます。

利用予定clientが通常の検索や全文添付に未対応なら、作れる設計票と三つのEvidenceを完成させ、未実施理由と`unsupported`を記録します。全文が入らない・投入範囲不明なら準備の同一性だけを報告し、必要に応じて`incomparable`にします。設計/read-only確認だけの完了をroute成功へ昇格しません。Runtime自体が用意できない場合は、その準備ブロックを運営へ伝え、架空のrun/PR・検証成功を作りません。

終了時はexportとbaselineの不変確認を行い、自分の添付・selection・当該会話だけを整理します。source、既存ignore、他人のtabs、User/home/組織設定やindexを消しません。次のconditionは新しいrepository・workspace・conversation・profileから始めます。
