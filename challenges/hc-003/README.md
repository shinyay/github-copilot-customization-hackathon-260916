# HC-003 ディレクトリごとのルールをAGENTS.mdで伝えよう

## Challenge Story

受注承認の説明を頼むたびに、ある回答はサービスだけを読み、別の回答は共有の処理まで追ってくれます。チームは「毎回伝えたい調べ方」と「特定のディレクトリを読むときだけ気にしたいこと」を整理したくなりました。全部を常設すると長くなり、短くしすぎると必要な注意が抜けます。

このChallengeではその線引きを自分で設計し、**rootのAGENTS.mdを一つだけ使う本編**で試します。ディレクトリ固有の案は設計として残しますが、入れ子の発見を本編では有効化しません。このページとPackだけで開始でき、以前のLABや他Challengeの成果物は不要です。

## この機能とは

`AGENTS.md` は、対応するエージェントへ作業上の指示を伝えるMarkdownの**指示文書**です。VS Codeの公式説明では、workspace rootのファイルを常設指示として扱います。たとえば「調査結果をどの粒度で説明するか」というチームの習慣を置く場所です。ここでは参加者が必要だと判断した短い文だけを書きます。

名前にAgentとあっても、**`.agent.md` の役割定義ではありません**。新しい役割の選択肢やtool権限を作る仕組みではなく、Javaの動作、モデル、実行環境の権限も変更しません。文書を置くことと、その本文が実際に使われることは別です。

複数のディレクトリへ置くnested AGENTSは**Experimental**です。親repositoryを探索する機能も別の条件を持ちます。複数指示の厳密な継承や優先順位を、ディレクトリ名から保証しません。本編はrootだけなので、その組合せの順序を測る実験でもありません。

出典: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)（文書確認: **2026-09-15**）。公式の配置説明を確認した日であり、参加者環境での発見・投入を確認した日ではありません。

## 向いていること / 向いていないこと

何度も同じ読み方を依頼し、チームで小さな原稿を保守したいときに向いています。複数の対応エージェントで共有する候補にもなりますが、別clientや別harnessで同じように発見される保証はありません。

一回限りの長い依頼、特定のroleや受注の答え、アクセス制御、実行許可を置く用途には向きません。十分な固定依頼だけで同じ結果になるなら、指示を追加しない選択も合理的です。自然言語の指示はtestや人のsource確認の代わりにはなりません。

## Starter Kit

必要なのはNode.js 22以降、Git、Hubと自分の非公開Runtimeを扱う通常の参加権限、対応するVS Code / Copilotです。rootの対応を利用できない場合も、下のFallbackで設計と未実施理由を提出できます。追加の管理権限、Preview有効化、DB、Maven実行は本編の前提ではありません。

実アプリは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787` に固定します。[515-path inventory](../../catalog/source-baseline-paths.json)にある次の3ファイルを、Runtimeのbaselineから直接読みます。

| 読むpath | ここで確かめること |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `approve` の入口、呼び出すガード、続く処理の境界 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | 継承元の `require` の定義と委譲先 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | `require` とrole判定の分岐 |

まず `OrderService.approve` 内の呼出しを見つけ、`require` の定義へ移り、さらにその呼出し先を読みます。入力がnullの場合や早く戻る分岐も問い直してください。メソッド中のrole文字列一つだけを全体の規則とせず、認証・認可と受注の業務条件を分けて説明する練習です。答えの対応表は配りません。

[Pack manifest](pack/manifest.json)の4素材は全条件で同じbytesを配ります。配置先は `.hackathon/challenge/hc-003/` です。

| 不活性な素材 | 使い方 |
| --- | --- |
| [brief.md.template](pack/payload/brief.md.template) | sourceの所在と、追跡中に問い直すこと |
| [request.txt.template](pack/payload/request.txt.template) | 下の固定依頼全文。言い換えず使う |
| [AGENTS.md.template](pack/payload/AGENTS.md.template) | 未完成の原稿。参加者が短い本文を設計する |
| [comparison.md.template](pack/payload/comparison.md.template) | 設計、本文、環境、比較、提出の空の記録用紙 |

JavaはPackへ複製せず、515-file baselineと2件の運用overrideを保ちます。inventoryの一致はpath確認であって、意味の正しさや実機動作の確認ではありません。素材のためにsourceや既存testを変更しません。

**固定入力は次の全文だけです。** 全条件に同じsourceへのアクセスを与え、実データや利用者IDを足しません。

```text
固定source shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787 の受注承認を調べてください。

読む入口は次の3ファイルです。
- wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
- wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java
- wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java

OrderService.approveから共有のrequireへ進み、呼び出し先まで根拠をたどってください。認証・認可の条件と、受注の業務条件を分け、実装から分かること、推論、未確認事項をfile + symbol付きで説明してください。この範囲で判断できない点と、次に確認したい根拠も挙げてください。

静的な読解だけを行います。実在の利用者や受注の承認可否を決めず、実データ・認証情報を使わず、DB・Web・バッチを起動しないでください。アプリ、test、設定を変更せず、未実行の検証を成功と書かないでください。比較用のStarter、participant原稿、Evidenceを追加の調査資料として探索しないでください。
```

## Open Question

チーム全体へ常設したい規則は、どこまで小さくできますか。`service` や `common` を読むときだけ必要に見える観点も、一つのroot文書へ入れる価値があるでしょうか。

短さ、読み落とし、回答の長文化、毎回貼り直す手間のうち、重視するものを選びます。「rootが必ず有利」と予想する必要はありません。何も追加しない案と比較できる問いにしてください。

## Design Time

比較用の会話を始める前に、人が原稿を作ります。最初から完成例を写すのではなく、空のStarterを使って次を決めてください。ファイルへ保存する作業はBuildの手順2でPackを適用した後に行います。apply前のRuntimeへ原稿を置くと、未使用のbaselineではなくなります。

1. 繰り返し困ることを一つ選び、観測基準を2〜3個に絞る。たとえば「引用先が主張を支えるか」「共有処理まで追ったか」「未確認を残したか」です。引用数だけでは採点しません。
2. 共通規則の候補とディレクトリ固有の候補を分け、採用理由と削った理由を書く。固有案は設計メモだけに残し、本編でnestedファイルを作らない。rootへ一般化するか、今回入れないかも自分で選びます。
3. 最小限の再利用可能な本文を選ぶ。業務の正解、role一覧、今回だけのtask、環境固有の情報は入れない。誰がいつ見直すかも決めます。
4. 選んだ本文全文を、customized用Runtimeの `participant/hc-003/root-instructions.md.template` に保存して凍結する。UTF-8、改行、SHA-256、凍結日時を記録し、manual-equivalentへは同じbytesを渡します。baseline側へこの選択本文を置いたり貼ったりしません。
5. 比較の順序と停止条件を先に決める。試作中の回答は比較runへ流用せず、凍結後に直したくなったら別の独立runを用意します。

凍結原稿・activeファイル・Evidenceのコピー先が既に存在する場合は、コピーを中止します。上書きを選ばず、既存の比較を保管したまま新しいRuntime repository / runでやり直してください。

`.template` は自動でactive化しないだけで、読めない領域ではありません。Starterや選択本文を意図せずAIが読んだら、その混入を記録します。設計と本文は、回答を保存した後に各Evidenceの対応欄へ残してください。

## Build

### 1. Hubで配布物と計画を確認する

以下は**Hub checkoutのroot**で実行します。`team-sora` とrun名は公開可能な自分の識別子へ置き換えます。

```powershell
node scripts\plan-run.mjs --dry-run --challenge HC-003 --condition baseline --team team-sora --run run-b
node scripts\plan-run.mjs --dry-run --challenge HC-003 --condition customized --team team-sora --run run-c
node scripts\plan-run.mjs --dry-run --challenge HC-003 --condition manual-equivalent --team team-sora --run run-m
node scripts\build-pack.mjs --challenge HC-003 --output .runtime/packs
```

dry-runは計画表示だけで、repository作成やファイル注入をしません。buildの出力は `.runtime\packs\hc-003-v1` と隣接するhashです。`--output` 引数はOSにかかわらず文字列 `.runtime/packs` を指定します。既存出力があれば停止し、上書きしません。別の出力pathには変更できないため、作り直す必要があれば新しい専用のHub checkoutでbuildしてください。Hub内で `AGENTS.md` を作らないでください。

### 2. 条件ごとに別のRuntimeを用意する

[Getting Started](../../docs/getting-started.md)に従い、[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template)から**3つの専用の非公開repository**を作ります。それぞれを別のworkspace、新規会話、新規Profileで開き、repository rootをworkspace rootにします。別branchだけで分離したことにはしません。

各**Runtime checkoutのroot**で次を実行します。`$Pack` は先ほど作ったPackの実際の絶対pathです。`$Condition` をそのrepositoryの `baseline`、`customized`、`manual-equivalent` に一度だけ設定し、新しい名前付きbranchでapplyします。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-003-v1'
$Condition = 'baseline'
git switch -c "hc-003-$Condition"
npm run verify
node .hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition
```

Runtime v1の `.hackathon/template.json` と検証結果を確認し、consumerやmarkerがなければ止めます。Hubのrun名とRuntimeが記録するrun識別子を対応させてEvidenceへ残します。apply後は同じ名前付きbranchを使い続け、`.hackathon/run.json` を編集しません。

rootの対応、`chat.useAgentsMdFile` の観測値、model / harness / toolsを記録します。**本編ではnested / parent discoveryを有効化しません。** 既に有効、または無効であることを確認できない場合はrootだけの比較を止め、その限界を残します。既存設定の変更で無理に条件を作らず、使える範囲を確認してください。別repository・workspace・会話・Profileを用意しても、home、User、組織、Memory由来の指示はそれだけでは隔離できません。既存のhomeや個人設定を消さず、残る影響と未確認部分を記録します。

### 3. 自分で選んだ本文だけを使う

| condition | 参加者が追加できるもの |
| --- | --- |
| `baseline` | 実行後のEvidenceのみ。root AGENTS.mdなし |
| `customized` | `participant/hc-003/root-instructions.md.template` と、同じ本文のroot `AGENTS.md` |
| `manual-equivalent` | 同じ `participant/hc-003/root-instructions.md.template` のみ。root AGENTS.mdなし |

customizedでは、凍結した本文を**新規の**root `AGENTS.md` へコピーします。既存ファイルがあれば上書きせず止めます。元の `.hackathon/challenge/` 内のStarterは編集・改名しません。コピー前後のbyte同一性は、たとえば次で確かめられます。

```powershell
Get-FileHash -Algorithm SHA256 .\participant\hc-003\root-instructions.md.template
Get-FileHash -Algorithm SHA256 .\AGENTS.md
```

本編で追加するactive customizationはroot AGENTS.mdだけです。`.github/agents/` のrole定義、別形式のInstructions、nested AGENTS、親ファイル、settingsは追加しません。`allowedMutations: []` なのでJava、test、既存設定も変更しません。依頼の実行は次のCompareで行います。

## Compare

凍結後の比較は各repositoryのfresh conversationで一度ずつ開始します。選んだmodel / effort / harness / tools、入力、source revision、参照範囲をそろえます。

| 条件 | 指示の供給 | 会話へ送るもの |
| --- | --- | --- |
| Baseline (`baseline`) | root AGENTS.mdなし | 固定依頼全文のみ |
| Customized (`customized`) | root AGENTS.mdだけ | 同じ固定依頼全文のみ |
| manual-equivalent | root AGENTS.mdなし、手動供給 | 選択した同じ本文全文、その後に同じ固定依頼全文 |

manual-equivalentへ貼るのは**参加者が選んで凍結した本文全文**です。Starterの括弧書き、本文の要約、公開checklistだけ、Customizedの回答で代用しません。送信した全文と順序を残し、改行などが変わった場合も記録します。同じ本文でも、指示の保存元やcontextの扱いまで同一だとは主張しません。

全条件で十分な依頼と同じ3ファイルを使います。追加ヒントや以前の回答を一条件だけへ渡さず、AIの最初の回答は後から修復しません。必要な追加sourceが判明したときは未確認として残すか、全条件を新しい入力でやり直します。

比較するのは、事前に決めた読み方と再入力・保守の負担です。発見が見えない、選択本文がbaselineへ混入した、modelや外部指示が違った場合は、その差を隠さず `incomparable` を選べます。

## Evidence

各Runtimeで、回答を保存した後に `.hackathon/challenge/hc-003/comparison.md.template` を `.hackathon/evidence/hc-003/comparison.md` へ新規コピーし、全見出しを残して記入します。EvidenceはRuntimeの**run-state**で、`allowedAdditions` ではなく `evidenceRequirements` と `submissionFiles` に宣言しています。

既存のEvidenceにはStarterをコピーし直しません。同じrunの記録に追記する場合は、前の出力と判断を残して既存のEvidenceを編集します。比較をやり直す場合は別repository / runに分けます。

記録は次の4段階を分けます。

- **保存**: rootや不活性原稿のpath、本文全文、hash。保存だけでは発見の証拠ではありません。
- **発見**: clientが示した参照や診断で確認できた範囲。ファイル名が見えることと本文が読まれることは別です。
- **本文投入**: 実際に供給された本文を確認できる記録、または `not-observed`。AIの「読みました」だけで埋めません。
- **出力**: 未修正の回答、引用先、誤り、未確認、手間。よい回答が出たことから上の段階を逆算しません。

現在のconditionだけを実施事実で埋め、他条件は別repository / PRへリンクするか未実施と書きます。client / host / OS / channel / version、指定・実効model、effort、tools、承認範囲、workspace root、Profile、他のhome / User / 組織 / Memory指示を安全に記録してください。見えない環境値は `unknown` でよく、既存個人情報を収集し直す必要はありません。

実行したcommandと整数exit codeを保存し、未実行のJava testやCopilot操作を作りません。Runtimeの静的検証が通っても `runtimeBehavior` と `educationalEffect` は `not-observed` のままです。

## Submit

Evidence記入後、**各Runtime checkoutのroot**で、apply時と同じPackを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $Pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .hackathon\scripts\export-submission.mjs $Pack
```

Runtimeの[onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)にあるCLIです。エラーを無視して次へ進まず、export先の `submission/` は不活性な提出bundleとして点検します。機能を実行できなかったconditionにも、その理由をEvidenceへ書けます。

各conditionのRuntime PRに、許可された成果物とEvidenceを含めます。[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)へ、condition → Runtime URL / PR / runの対応、工夫、共通規則とディレクトリ固有案の線引き、outcome、failure / unknownを提出します。activeファイルをHubへコピーしません。

[Submission Guide](../../docs/submission-guide.md)に従い、secret、個人情報、private code、local絶対pathをIssueへ転載せず、安全な要約と参照だけを残してください。任意ガイドの記録はOPTIONAL欄へ分け、未実施のままでも提出できます。

## Judging

共通の比較・安全・再現性に加え、rootへ常設する範囲を理由付きで選んだか、共有処理の根拠を人が確認したか、発見と本文投入の未観測を正直に残したかを見ます。nestedファイルの数や指示の長さは加点項目ではありません。

`improved` のほか、差を見いだせない `equal`、冗長化や読み落としが増える `worse`、公平に比べられない `incomparable`、環境・権限で進めない `blocked`、機能が提供されない `unsupported` はすべて有効です。固定依頼で十分だったという「追加不要」の判断にも価値があります。

## Bonus Mission

実行を増やさず、選択本文の一文を削った設計案を紙上で作ってみましょう。失われる注意と保守しやすさのどちらを選ぶかを説明します。本編の本文は途中で書き換えず、案を実測の改善として数えません。

## Support / Fallback

root AGENTS.mdの発見を確認できなければ、手動で同じ本文を渡す学習に切り替えられます。ただしmanual-equivalentをCustomized成功とは呼びません。機能非対応なら `unsupported`、条件の分離ができないなら `incomparable`、会話や教材へアクセスできないなら `blocked` とし、設計と止めた理由を残します。

本編から分けた準備ガイドは [入れ子の発見](optional/nested-discovery.md) と [親repositoryの発見](optional/parent-discovery.md) です。どちらも任意の非実行ガイドで、読了は実機対応や本編の改善を意味しません。設定変更・trustの回避・既存の親やhomeファイルの退避を本編へ持ち込みません。

終了時は検証・export・PR保存を先に行い、使い捨て環境の**自分が追加したものだけ**を整理します。既存ファイルを削除せず、processがあれば自分の分を停止し、repositoryを保管するかarchiveするかを人が決めます。Packのcleanupは助言で、自動実行ではありません。[Runtime repository guide](../../docs/runtime-repository-guide.md)と[Support and Fallbacks](../../docs/support-and-fallbacks.md)も参照してください。
