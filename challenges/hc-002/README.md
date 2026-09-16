# HC-002 JavaとXMLに別々の読み方を教えよう

## Challenge Story

受注の在庫引当を調べるとき、Javaだけ読むと「誰が、どの状態で呼べるか」は説明できても、Springの設定との関係を見落とすことがあります。逆にXMLの属性だけを並べても、それが調べているメソッドへどう結び付くのかは伝わりません。

このChallengeでは、Javaを読むときとXMLを読むときで役立つ注意を分け、必要な場面へ届けるInstructionsを設計します。業務の答えを指示へ埋め込むのではなく、根拠をたどる習慣を育てる実験です。このページと同梱のStarter Kitで完結し、他のChallengeの成果物や事前の教材履修は不要です。

## この機能とは

File/task Instructionsは、特定のファイルや作業に向けたMarkdownの指示です。VS Codeでは、repository内の `.github/instructions/` に `*.instructions.md` を置きます。冒頭のYAML frontmatterは「いつ使うか」のmetadata、その後の本文は「どんな読み方をしてほしいか」です。

たとえばJava側には共有ガードまで確かめる観点、XML側にはbeanから設定規則まで結び付ける観点を置けます。repository全体の常設指示へ全部詰め込む方法とも、毎回チャットに貼る方法とも、届け方が異なります。

共有ガードとは、複数の処理から使う許可判定などの共通処理です。XMLでは、bean定義が「どのclassのobjectを、どの名前でつなぐか」、adviceが「ここではtransactionをどう扱うか」、pointcutが「どこへ適用するかの条件」、method rule（`tx:method`）が「メソッド名ごとの扱い」を表します。名前のつながりを読むことと、実際に動かして確かめることは別です。

- `applyTo` はworkspace相対のファイルパターンです。パターン内はWindowsでも `/` を使います。
- Starterの `applyTo` は引用符で囲んだ文字列です。複数パターンはカンマで区切ります。原稿を編集するときもYAML frontmatterと本文を混ぜません。
- `description` は目的の説明であり、作業内容との意味的な一致による選択にも使われ得ます。
- 公式資料には意味的な選択の説明と、`applyTo` 未指定時の自動適用を制限するfield表・FAQの留保が併存します。本編は**明示的な `applyTo` を二つとも残し**、description-onlyの挙動を確定したものとして扱いません。
- `applyTo` はACL（アクセス制御）ではありません。不一致でも、明示添付・参照や作業内容による選択は別に調べます。読取り権限や排他的な除外を保証しません。
- 複数の指示の**組合せ順序は保証されません**。ファイル名や保存順で優先順位を作らず、矛盾しない二本文を設計します。

ここでの製品の `applyTo` のglob文法と、Pack v1の許可パスに使うglob文法は**別物**です。Pack v1は完全なsegmentの `*` と末尾の `/**` などに制限されます。Java原稿の `**/*.java` をそのままmanifestの許可へ転用しません。本Packの追加許可はすべてexact pathです。

出典: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)（文書確認日: **2026-09-15**）。文書の確認は、あなたのclientでの発見・実投入の確認ではありません。

## 向いていること / 向いていないこと

**向いていること**

- JavaとSpring XMLのように、繰り返し使う読み方がファイル群ごとに違う。
- 全ファイルに長い注意書きを渡さず、関連する観点だけを維持したい。
- 新しいファイルが増えたときの対象漏れと、対象を広げたときの過剰適用を比べたい。

**向いていないこと**

- 一度きりの依頼や、全調査に共通で分ける必要のない短い注意。
- コードの正解、特定のrole名やtransactionの結論を覚えさせること。
- パターン一致による情報保護、必ず自動選択されること、指示どおりの回答の保証。
- Java/XMLを読んだだけで、DBのtransactionやrollbackの実動作まで証明すること。

指示を増やさなくても十分なら「追加不要」はよい結論です。文字数が増えたり、無関係な調査にも注意が混入したりする費用も評価してください。

## Starter Kit

[Pack manifest](pack/manifest.json) はschemaVersion / challengeVersion / minimumTemplateVersionがいずれも1です。sourceKindは `baseline`。元アプリは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` の515ファイルで、参加者用Runtimeのrootにすでにあります。PackへJavaの複製は入れません。

### 同じ入口を三条件へ渡す

以下はRuntime root相対のexact pathです。コード中の参照先が必要なら、全条件で同じbaselineから読取りだけで補い、そのpathも記録します。

| 読む入口 | 何を調べるためか |
|---|---|
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | 固定taskの `OrderService.allocate`、呼出し先、状態の前提・更新 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | サービスが共有するガードの実装 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | ガードから委譲される判定。呼出し元の記述だけで判断しないため |
| `wholesale-core/src/main/resources/application-context.xml` | import、advice、advisorのpointcut、method ruleの宣言 |
| `wholesale-core/src/main/resources/spring/module-operations.xml` | importされるモジュールのbean定義と参照関係 |

`pom.xml` と `README.md` もbaselineに存在しますが、後述のscope診断では非対象の対照として使います。XMLという拡張子だけで、Maven設定もSpring用Instructionsの対象だと決めません。inventoryは [source-baseline-paths.json](../../catalog/source-baseline-paths.json) で確認できますが、path一覧はsourceの意味や実行結果の証明ではありません。

Packは全条件へ**同じ六つの不活性ファイル**を `.hackathon/challenge/hc-002/starter/` に配置します。

| ファイル | 用途 |
|---|---|
| `brief.md.template` | 読む範囲と素材の境界 |
| `request.txt.template` | 省略しない固定依頼 |
| `hc002-java.instructions.md.template` | Java用の編集開始点。完成解ではない |
| `hc002-xml.instructions.md.template` | XML用の編集開始点。完成解ではない |
| `design.md.template` | scope・言葉・費用・停止条件の設計票 |
| `comparison.md.template` | 各条件の出力と未観測を残すEvidence |

必要なのはNode.js 22以降、Git、公開Hubを閲覧・cloneできる環境、自分の非公開Runtime repositoryを扱う権限、利用可能なVS Code Stable / Copilotと読取り用toolsです。Java/JDK、Maven、DB、サーバー起動は本編では不要です。新しいsoftware、MCP、Skill、Custom Agent、Cloud Agentを導入せず、User・組織・workspace設定も変更しません。

## Open Question

**Javaの実装とSpring XMLの設定を取りこぼさず、無関係な規則を増やさないために、どこまで対象を広げ、何を本文へ残しますか。**

たとえば「Javaの共通部分も対象にして探索漏れを減らす」と「調査対象だけに絞って余計な注意を減らす」は、どちらにも利点と費用があります。XML側も特定の二ファイルを列挙するか、今後のモジュール追加まで含めるかで保守が変わります。唯一のパターンや文章を当てるクイズではありません。

## Design Time

まず人が設計し、比較する回答を見る前に次を決めます。

1. Java/XMLそれぞれの対象・非対象と理由。少なくともJavaの正例を `OrderService.java`、XMLの正例を `application-context.xml` とし、二つの `applyTo` を明示します。`module-operations.xml` を対象に含めるか、入口側の指示から参照をたどるかも理由を残します。
2. Starterの文章をそのまま「最適解」とせず、自分の言葉で残す・削る・補う観点。共有ガード、状態の前提と拒否と更新、XMLのbean・advice・pointcut・method ruleをどう確認させるかを考えます。具体的な業務の答えは書き込みません。
3. 効果と費用の観測方法。引用の正しさ、参照のつながり、未確認の明示、不要な説明の量などから選び、`yes / partial / no / not-observable` 等の基準を先に定義します。
4. 三条件で同じにするtask、source、添付方法、model / effort / toolsと、違っていたら停止する条件。入力の不足をBaselineだけに作りません。

下のBuildで人が作る `participant/hc-002/design.md` へ記録します。草稿の調整・scope診断と、本番の比較runは分離してください。調整後の二原稿を**凍結してからBaselineを含む比較を開始**し、回答を見て本文を変えた場合は別の比較セットとします。

## Build

### 1. HubでPackと計画を確認する

以下は **Hub checkout** のrootで実行します。`team-sora` とrun名は自分用に置き換えます。dry-runはrepositoryの作成やファイルの注入をしません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-002 --condition baseline --team team-sora --run hc002-baseline-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-002 --condition customized --team team-sora --run hc002-customized-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-002 --condition manual-equivalent --team team-sora --run hc002-manual-01
node .\scripts\build-pack.mjs --challenge HC-002 --output .runtime/packs
```

`--output` の値だけはWindowsでもCLIが要求する文字列 `.runtime/packs` をそのまま使います。buildの出力は `.runtime\packs\hc-002-v1` **ディレクトリ**と隣接するhashファイルです。出力先が既存なら上書きせず停止します。後の `$pack` にはこのディレクトリの絶対パスを使い、manifest単体を渡しません。未公開・version不一致なら先へ進まず運営へ報告してください。

### 2. 条件ごとに独立したRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から、**三つの新しい非公開repository**を用意します。[Getting Started](../../docs/getting-started.md) の通常の参加準備を使い、同じrepositoryのbranchを切り替えるだけで三条件を実施しません。各条件にfresh workspace・fresh conversation・fresh profileが必要です。

GitHubのtemplateページで **Use this template → Create a new repository** を選び、自分のOwner、条件ごとの別名、**Private**で作成します。各repositoryの **Code** に表示されるclone URLを使って `git clone "コピーしたURL" "条件専用の新規フォルダー名"` を実行します。Hubと三つのRuntimeは入れ子にせず、別々のフォルダーにしてください。作成権限や未使用の専用profileを用意できなければ、設定を変更して回避せずSupport / Fallbackへ進みます。

各 **Runtime checkout** のrootで、次を一条件ずつ実行します。`$condition` はそのrepository専用の `baseline`、`customized`、`manual-equivalent` のいずれか一つです。`C:\work\hub` はあなたのHubの絶対パスに置き換えます。各コマンドの終了codeを確認し、失敗時は次へ進みません。

```powershell
$condition = "baseline"
$pack = "C:\work\hub\.runtime\packs\hc-002-v1"
git switch -c "hc002-$condition"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition $condition
```

`.hackathon/template.json` がversion 1を示すこと、Runtime検査が通ることを確認します。applyはcleanなtemplateと名前付きbranchを前提とし、runをそのbranchへbindingします。`.hackathon/run.json` の編集や既存Starterの上書きでは回避しません。以後もそのbranchを使います。実コマンドの出典は [Runtime onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)、境界は [Runtime repository guide](../../docs/runtime-repository-guide.md) です。

repository分離ではhome・User・組織の指示やMemoryは消えません。専用profileもhomeの完全分離ではありません。既存指示、設定同期、Memory、tools等の混入と確認できない範囲を記録し、同条件にできなければ停止します。他人の設定・指示を削除したり、全Memoryを消したりしません。

### 3. 人が設計用コピーとEvidenceを作る

次は**人による準備**です。固定taskのAgentに書かせません。apply済みの各Runtimeで実行し、すでに自分の成果物がある場合も上書きせず、そのrunを確認してください。

```powershell
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-002\starter"
New-Item -ItemType Directory -Path .\participant\hc-002
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-002
[System.IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-002\design.md", $false)
[System.IO.File]::Copy("$starter\hc002-java.instructions.md.template", "$root\participant\hc-002\hc002-java.instructions.md.template", $false)
[System.IO.File]::Copy("$starter\hc002-xml.instructions.md.template", "$root\participant\hc-002\hc002-xml.instructions.md.template", $false)
[System.IO.File]::Copy("$starter\comparison.md.template", "$root\.hackathon\evidence\hc-002\comparison.md", $false)
```

`Copy` の第3引数の `$false` は上書き禁止です。既存の設計票・原稿・Evidenceがあれば停止し、bytesを変更しません。途中まで準備できた後に失敗した場合も、既存成果物を消して再実行するのではなく、そのrunの状態と原因を確認します。

編集するのは `participant/hc-002/design.md` と、同directoryの二つの `.instructions.md.template` です。`.hackathon/challenge/` の原本は変更・renameしません。二原稿をUTF-8、BOMなし、LF改行で保存し、凍結後の同じbytesを三条件の設計用コピーへそろえます。BaselineのAgentには原稿本文を渡しません。診断で改稿したら、診断の会話を流用せず新しい比較セットを準備します。

VS Codeではファイルを開いたときの文字コード・改行の表示を確認し、この二原稿だけを指定形式で保存します。Userやworkspaceの設定ファイルを書き換える必要はありません。

### 4. Customizedだけに二ファイルを新規配置する

凍結した参加者原稿から作ります。**Baseline / manual-equivalentではこの操作をしません**。既存ファイルを消して場所を空けるのではなく、混入として停止します。

```powershell
$ErrorActionPreference = "Stop"
$root = (Get-Location).Path
if (Test-Path .\.github\instructions) { throw "既存のinstructionsを確認し、このrunを停止してください。" }
New-Item -ItemType Directory -Path .\.github\instructions
[System.IO.File]::Copy("$root\participant\hc-002\hc002-java.instructions.md.template", "$root\.github\instructions\hc002-java.instructions.md", $false)
[System.IO.File]::Copy("$root\participant\hc-002\hc002-xml.instructions.md.template", "$root\.github\instructions\hc002-xml.instructions.md", $false)
```

この二つも上書きを拒否するbyte-copyです。保存先の確認後に同名ファイルが作られた場合も、そのファイルを置き換えません。

有効な配置先は正確に `.github/instructions/hc002-java.instructions.md` と `.github/instructions/hc002-xml.instructions.md` の二つだけです。repository-wide Instructions、AGENTS、CLAUDE、settingsを追加しません。Java・XML・testを含むbaselineの変更は全条件で禁止（`allowedMutations: []`）です。

### 5. 凍結したmetadataと本文を別々に照合する

次の読取り専用コマンドは各原稿について `fileSha256`、`frontmatterSha256`、`bodySha256` を出します。frontmatterは先頭の `---` から閉じる `---` の直後のLFまで、本文はそれ以降の全bytesです。trimや要約はしません。

```powershell
@'
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const hash = (text) => createHash("sha256").update(text, "utf8").digest("hex");
for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, "utf8");
  if (text.startsWith("\uFEFF") || text.includes("\r")) {
    throw new Error("UTF-8 without BOM and LF line endings are required");
  }
  const match = /^---\n[\s\S]*?\n---\n/u.exec(text);
  if (!match) throw new Error("Explicit YAML frontmatter is required");
  const frontmatter = match[0];
  const body = text.slice(frontmatter.length);
  if (!body.trim()) throw new Error("Instruction body is empty");
  console.log(JSON.stringify({
    file, fileSha256: hash(text),
    frontmatterSha256: hash(frontmatter), bodySha256: hash(body)
  }));
}
'@ | node --input-type=module - `
  .\participant\hc-002\hc002-java.instructions.md.template `
  .\participant\hc-002\hc002-xml.instructions.md.template
```

Customizedでは引数の二パスを有効な配置先に置き換えても実行し、原稿とinstalled fileの三hashを照合します。`applyTo` / `description` の変更はmetadataにも現れます。hash一致は保存したbytesの一致であり、Copilotの発見・実投入の証明ではありません。

## Compare

### scope診断は本番とは別の新規会話で行う

まず人が自分の二つの `applyTo` から予測を記入します。Starterの初期パターンでは次の正負を想定できますが、選んだscopeの理由と実観測を別欄にします。

| 調べるファイル | Java側の初期予測 | XML側の初期予測 |
|---|---|---|
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | 正例 | 非対象 |
| `wholesale-core/src/main/resources/application-context.xml` | 非対象 | 正例 |
| `wholesale-core/src/main/resources/spring/module-operations.xml` | 非対象 | 正例（scopeを狭めた場合の扱いも説明する） |
| `pom.xml` | 負例 | 負例 |
| `README.md` | 負例 | 負例 |

一ファイルずつ明示して「このファイルの構造を一文で説明してください。読取りのみで、変更・実行はしないでください」と同じ依頼を使います。Java用はXMLで、XML用はJavaでも不要に選ばれていないか観察します。開いたファイル、明示添付、利用できるclientの参照表示を記録してください。表示がない場合は `not-observed` です。

この表はVS Codeのmatcherや意味的選択を実装した検査器ではありません。負例で指示が見えた場合も直ちにパターン違反とせず、description、手動添付、リンク参照、他の指示の混入を調べます。原因を特定できなければ、本番の自動適用比較を停止し `incomparable` / `blocked` とします。

### 固定taskによる三条件比較

新しい会話で `.hackathon/challenge/hc-002/starter/request.txt.template` の**全文**を貼ります。Javaの共有ガードとXMLの配線を含む十分な依頼を、全条件へ同じように渡します。五つの入口も同じ方法で利用可能にしてください。指示原稿や設計票をAgentへ探索させること、他条件の回答を追加ヒントにすることは禁止です。

| condition | scoped Instructions | 手動で送るもの |
|---|---|---|
| `baseline`（Baseline） | 二つともなし | 同じ固定taskだけ |
| `customized`（Customized） | 凍結した二つだけ | 同じ固定taskだけ。指示本文は手動添付しない |
| `manual-equivalent` | 二つともなし | 同じ固定task + **参加者が選び凍結した二本文の全文** |

manual-equivalentではfrontmatterだけを除き、本文の見出し・段落・箇条書き・末尾まで省略せず渡します。「同じ趣旨」の短いchecklist、選んだ原稿とは異なる配布Starterの本文、Customizedの回答で代用しません。送った二本文の全文とbody hashの一致を記録します。手動側の順序はJava→XML等、事前に決めて記録しますが、Customizedの組合せ順序まで同じだとは主張しません。

これは供給する文字列の同一性の確認です。チャット側の改行変換・切詰め等により送信後の全文を確認できない場合、送信後の一致は `unknown` とします。手元の原稿hashを内部contextのhashだと呼ばないでください。

機能が指示を発見しなかった場合に、その場で同じ会話へ貼ってCustomized成功にしないでください。明示添付が必要だった回は自動適用の証拠ではなく、その経路を別記します。run順、sourceへの読取り経路、所要時間、modelやtoolsの差も残します。

## Evidence

人が `.hackathon/evidence/hc-002/comparison.md` を記入します。これはrun-stateであり `allowedAdditions` ではありません。各repositoryは自分のconditionの記録を持ち、他条件は参照先か「未実施」とします。三条件を一つのrunとして偽装しません。

特に次の段階を分けます。

1. **保存**: 原稿とinstalled fileのexact path、frontmatter / 本文 / 全fileのhash、activeファイルの有無。
2. **発見**: clientが指示を候補として表示した等の観測。パターンの予測だけなら「予測」と書く。
3. **実際のcontext投入**: どの本文が送られたと確認できたか、手動貼付か、自動か。UIが示す範囲を超える内部状態は `not-observed` / `unknown` のままにする。
4. **出力**: 回答全文または安全に保管した参照、正しい引用と誤引用、JavaとXMLのつながり、費用、推論と未確認。回答に言葉が現れたことだけで実投入を逆算しない。

固定taskは読取り専用です。Agentによるsource編集・compile・test・DB接続・サーバー起動はしません。人のEvidence作成とRuntime検証コマンドは別作業として、command・終了code・失敗を記録します。

outcomeは `improved` / `equal` / `worse` / `incomparable` / `blocked` / `unsupported` から選べます。本文を手で貼るだけで同じ結果なら、それも重要です。未観測の自動選択や、実行していないtransaction・rollbackを成功にしません。

## Submit

各RuntimeでEvidenceの全required headingを記入し、未実施箇所には理由を残します。空のひな型をコピーしただけでは提出になりません。`$pack` はapply時と同じ不変のPackです。

```powershell
node .\.hackathon\scripts\verify-run.mjs $pack --stage in-progress
node .\.hackathon\scripts\verify-run.mjs $pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $pack
```

検証失敗なら原因を記録し、許可を広げず修正可能な自分の成果物だけを直します。exportされた `submission/` を点検してから、各Runtime PRへ凍結した原稿・設計票・その条件のEvidence・Customizedの二つの有効ファイルを含めます。Baseline / manual-equivalentのPRに有効な指示を混ぜません。

[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に三条件のRuntime URL / PR URLとrunの対応、工夫したscopeと本文、比較、outcome、限界をまとめます。任意ガイドはなく、任意欄は未実施で構いません。[Submission Guide](../../docs/submission-guide.md) に従い、secret、個人情報、ローカルの絶対パス、非公開コードや未加工ログをHub Issueへ貼りません。共有用には必要部分をredactし、未加工版の代わりに安全な参照を残します。

Runtime verifierの成功は静的な契約検査です。exporterの `runtimeBehavior` / `educationalEffect` は `not-observed` のままで、機能利用や学習効果の実証へ読み替えません。

## Judging

- チームの困りごとに対し、対象を広げる利点と絞る利点を説明できたか。
- 二つの本文が正解の丸暗記ではなく、Javaの共有ガードやXMLの参照を再利用可能な読み方として導いているか。
- scopeの正例・負例、保存・発見・実投入・出力を混同せず、未観測も残したか。
- Baseline / Customized / manual-equivalentで十分な同一taskとsourceを使い、手動側へ参加者が選んだ全文を渡したか。
- Java/XMLを単に両方引用するだけでなく、根拠のつながりを人が確認し、宣言と稼働時の観測を区別したか。
- equal、worse、追加不要、blockedを隠さず、保守や長文化の費用を比較したか。

特定のパターン、結論、機能の使用回数では採点しません。

## Bonus Mission

凍結済みの比較を変更せず、次にファイルが増えるとしたらscopeをどのように保守するか、設計票へ次回案を追記してみてください。対象漏れと過剰適用をそれぞれ一例考えるだけでも十分です。実際に試すなら新しい独立runで、本編の結果と分けます。description-only等の追加機構を本編へ混ぜず、未提供の任意ガイドがあるようには扱いません。

## Support / Fallback

主対象はVS Code Stableでの、明示applyTo付きFile/task Instructionsです。client / host / version / entitlementが異なる環境の同一動作は保証しません。自動適用を利用できないならCustomizedを `unsupported` とし、同じ全文のmanual-equivalentによる設計・読解比較を提出できます。Copilot自体が使えなければ、人による設計とscope予測だけを残し、AI比較は未実施とします。

本編のoptionalRoutesは空です。設定変更、Preview有効化、Cloudでの代替起動、Runtimeの制限緩和は行いません。profile・home・User・組織・Memoryの混入を確認できない、二本文が一致しない、sourceが違う、宣言外の変更が出た場合は停止し、`blocked` / `incomparable` と理由を残します。権限を回避したり他人の設定を消したりしません。

提出をexportして確認した後、baseline不変を検証し、自分が開始したprocessだけを停止します。本編ではアプリprocessを起動しません。実験repositoryはチームの方針でarchiveし、Cleanup欄に実施・未実施を記録してください。cleanupの指定は自動実行ではありません。他の実験・共有設定へ触れず、詳細は [Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
