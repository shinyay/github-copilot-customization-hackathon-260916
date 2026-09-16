# HC-016 役立つ記憶だけを残し、古い記憶を捨てよう

## Challenge Story

受注承認の権限処理を引き継ぐたびに、担当者は同じ二つの `require` を読み直しています。根拠付きの短いnoteがあれば助かる一方、古い引用、広すぎるscope、別workspaceの情報まで残すと、次の担当者を誤らせます。

このChallengeでは、実Memoryを操作せず、**毎回sourceへ戻る案**と、**残す候補を選別して保守する案**を比較します。このページ、Pack、自分の固定Runtimeだけで完結し、過去のChallengeやLABの回答は不要です。

## この機能とは

ここでいう記憶は「AIにとって常に正しい知識」ではなく、後の作業で参照する候補となるnoteです。似た仕組みを先に区別します。

| 仕組み | このChallengeでの区別 |
|---|---|
| 会話 | 今のやり取りの文脈。永続noteを作った証拠ではない |
| Instructions | 人が書いた適用ルール。事実の鮮度管理やMemoryの保存とは別 |
| VS Code local Memory | User / Repository / Session scopeを持つPreviewのlocal tool。GitHub Copilot Memoryと同じstoreではない |
| GitHub Copilot Memory | cloud agent、code review、CLI等がrepository factsを扱うpublic previewのservice。VS Code local Memoryと同一ではない |
| Copilot Appの記憶 | Copilot App側で扱う別の記憶面。この課題から保存・更新・削除を呼ばない |

小さな例として、「`BaseService.require` はnull actorを拒否する」というnoteがあっても、現在のsource、scope、source commit、再確認条件がなければ再利用に向きません。「記憶しました」という応答や原稿のhashだけでは、保存、持続、次の会話での再参照を証明できません。

公式資料は2026-09-15に確認した [Use memory with agents in VS Code](https://code.visualstudio.com/docs/agents/run/memory) と [About GitHub Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory) を参照します。文書の記載と、このChallengeで未実施のlive動作は分けて扱います。

## 向いていること / 向いていないこと

**向いていること**

- sourceへ戻れる短いfact候補を、scope・引用・鮮度と一緒に設計する
- 保存ゼロも含め、何を残さないかを説明する
- 更新、撤回、再確認を誰がいつ行うか決める
- 古いnoteや別scopeのnoteを、現在のsourceと照合する

**向いていないこと**

- 個人の好み、実在人物の権限、secret、第三者情報を集める
- noteがあればsourceを読まなくてよいと保証する
- MemoryのON/OFFによる品質や教育効果を測ったと主張する
- 全消去、既存noteの削除、User設定の初期化で比較条件を揃える

追加のcustomizationが不要で、毎回sourceへ戻る方が安全という結論も有効です。

## Starter Kit

[Pack manifest](pack/manifest.json) の `sourceKind` は `baseline`、conditionsは `baseline` / `curated-design` です。Java原本は **shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787**。次のRuntime root相対pathだけをsourceとして使います。

| ID | exact source path | 読む場所 |
|---|---|---|
| S1 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | `require`。null actorの拒否とS2への委譲 |
| S2 | `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | `require`。ADMIN、指定role、拒否の分岐 |

固定factは次の6行です。654 bytes、SHA-256は `0590d39c742d3378f56ba3ac31763a42ba8d12ffb32bf1d21a28a40991b804e6` です。

```text
教材用の固定事実。対象はこの演習用repositoryだけであり、個人の好みではない。
BaseService.requireはactorがnullならauthentication.requiredを送出し、それ以外はActor.requireへ委譲する。
Actor.requireはADMINを許可し、そうでなければ指定されたroleのどれかを要求する。
根拠: wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java の require、
wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java の require。
これは固定ソースの読解であり、Java/DB実行や実際の利用者の権限を確認した結果ではない。
```

両conditionへ、同じfactと次の中立IDのカードを同じbytesで配ります。

| カード | 内容 |
|---|---|
| `card-p` | 上のcurrent fact、source commit、path、symbol、未実行注記 |
| `card-q` | null actorを許可すると書いた意図的な合成note。古い引用候補を持つが、実在した過去commitの主張ではない |
| `card-r` | current factへUser全体のscope案を付けたscope検討用の合成カード |
| `card-s` | 別の架空演習workspaceの無関係note。本文 `KEEP-UNCHANGED` を保つ対象 |

Packは次を `.hackathon/challenge/hc-016/` にbyte-copyします。すべて不活性な `.template` で、Memoryの論理pathや自動発見位置へ配置しません。

- `brief.md.template`、`request.txt.template`
- `starter/design.md.template`、`starter/comparison.md.template`
- `materials/source-map.md.template`、`materials/memory-fact.txt.template`、`materials/cards.md.template`
- `starter/card-review.md.template`、`starter/handoff.txt.template`

必要なのはGit、Markdownを編集する道具、Hubと自分の非公開Runtimeへの通常アクセスです。Java、DB、実Memory、追加extensionは不要です。実Memoryのcondition、save、read、update、delete、clear、次会話での再参照は行いません。

## Open Question

**同じ権限処理を次の担当者が説明するとき、毎回sourceへ戻る案と、根拠付きのnote候補を維持する案のどちらが適切ですか。古い引用、別scopeの情報、保存不要の情報をどう扱いますか。**

保存候補をゼロにする案、同じfactだけを残す案、再確認を優先して採用を保留する案のいずれも選べます。唯一の正解カードを当てる課題ではありません。

## Design Time

比較を始める前に `participant/hc-016/design.md` へ次を記録します。

1. sourceから読む、固定factを手動供給する、将来Memory経由で読む、という三つの経路の違い。三つ目は本編で実行しません。
2. 残す候補、残さない候補、保留する候補と、その理由。
3. Repository / User / Session等のscopeを選ぶ基準。論理的なMemory pathをWindows directoryとして作りません。
4. source commit、path、symbol、引用範囲、再確認trigger、陳腐化の判定。
5. 更新・撤回・対象外note保持の責任者と手順。全消去をfallbackにしません。
6. fixed fact、cards、依頼、source、観測点を凍結し、設計revisionを変えたら新しい比較groupにする基準。

各conditionはfresh Runtime repository、named branch、新しいworkspace・会話・run-idを使います。repositoryを分けてもhome、User、組織状態、既存Memoryの消去は保証されません。既存状態を削除して揃えず、分離不能なら `incomparable` とします。

## Build

### Hubでconditionを確認する

Hub checkoutでdry-runとPack buildを行います。dry-runはrepositoryやMemoryを作りません。

```powershell
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-016 --condition baseline --team team-sora --run hc016-baseline-01
node .\scripts\plan-run.mjs --dry-run --route core --challenge HC-016 --condition curated-design --team team-sora --run hc016-curated-01
node .\scripts\build-pack.mjs --challenge HC-016 --output .runtime/packs
```

`.runtime/packs` はHub CLIが要求するlogical literalです。既存出力があれば削除・上書きせず停止します。

### conditionごとに新しいRuntime checkoutを使う

各Runtime rootで、そのrepository専用のconditionとrun-idを指定します。`$Pack` は実在する展開済みPack directoryの絶対pathです。

```powershell
$condition = 'baseline'
$runId = 'hc016-baseline-01'
$Pack = 'C:\work\hub\.runtime\packs\hc-016-v1'
git switch -c $runId
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $condition --run-id $runId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

`curated-design` は別repositoryで別runとして開始します。`.hackathon/run.json`を手編集してconditionを切り替えません。

### 宣言された成果物だけを作る

両conditionで次のexact pathだけを新規作成します。

- `participant/hc-016/design.md`
- `participant/hc-016/card-review.md`
- `participant/hc-016/handoff.txt.template`

Starterの同名用紙から作り、既存fileを上書きしません。`card-review.md`では各カードの主張、source支持、scope、古さ、採否、再確認条件、`card-s`の保持を記録します。

`curated-design` では初期原稿、陳腐化の指摘、更新案、初期原稿へ戻す案を**紙上のlifecycle**として示します。実際のnoteを保存・変更・削除して復元する手順ではありません。`handoff.txt.template` も不活性な引継ぎ原稿です。

全conditionで `allowedMutations: []` を維持します。Evidenceは `allowedAdditions` ではなく、Runtime所有の `.hackathon/evidence/hc-016/comparison.md` に記入します。source、Pack、`.hackathon/challenge/**`、既存Memory、設定は変更しません。

## Compare

Hub共通の比較表示では `baseline` を **Baseline**、`curated-design` を **Customized** と呼びます。Customizedはactive customizationの適用・成功を意味せず、このChallengeで参加者が作る選別・保守設計側の表示語です。

| condition | 同じ入力で行うこと | 比較しないこと |
|---|---|---|
| `baseline` | 永続noteを作らず、毎回S1 / S2へ戻る引継ぎを設計する | 「Memory OFFを実確認した環境」ではない |
| `curated-design` | 自分の選別、scope、引用、更新、撤回方針を不活性原稿へ反映する | 実MemoryのON/OFF効果や次会話での再利用成功ではない |

両条件へ同じsource、fixed fact、4 cards、依頼、通常資源を渡します。baselineを不十分にせず、同じfactへ到達できれば十分です。手動でfixed fact全文を渡せても、保存・持続・自動再利用の等価条件にはなりません。

比較するのは、sourceへ戻りやすさ、誤情報を残すrisk、scopeの狭さ、再確認と保守の負担です。順序効果があるため、発見率や時間短縮を因果推定しません。

結果は同等、悪化、追加不要、`blocked`、`unsupported`、`incomparable`、`not-observed` を含めて記録できます。良い結果だけを選んだり、原稿のhashをMemory保存の成功へ読み替えたりしません。

## Evidence

各runの `.hackathon/evidence/hc-016/comparison.md` は、次のexact 7見出しを使います。

`Fixed task` / `Environment` / `Design` / `Run log` / `Comparison` / `Outcome` / `Limits and cleanup`

- **Fixed task**: HC、condition、run-id、Pack、S1/S2、fixed factとcardsのhash、固定依頼
- **Environment**: client、harness、OS、利用したread手段、残留の可能性。モデルを使わなければ「モデル不使用」
- **Design**: 採否、scope、引用、再確認、更新・撤回、保存ゼロの理由
- **Run log**: source照合、カードレビュー、紙上lifecycle。合成カードとsource観測を分ける
- **Comparison**: 相手run-id、同一入力、設計差、順序効果、まだ相手runがない場合の未実施
- **Outcome**: 同等、悪化、追加不要、blocked等と根拠
- **Limits and cleanup**: save/read/update/delete/clear、scope確認、次会話再参照、残留評価を実施していないこと、自分の追加分だけの整理

`runtimeBehavior` と `educationalEffect` は静的検査から `pass` へ変更せず、`not-observed` を維持します。個人情報、実権限、生のprivate logは提出しません。

## Submit

当該Runtime branchで3つのparticipant成果物と記入済みEvidenceを揃えます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

検査が失敗したらexportへ進まず、run bindingや検査器を書き換えません。各conditionのRuntime PRには、そのrunの3成果物、Evidence、exportされたbundleだけを含めます。

[共通Challenge Result Issue](../../.github/ISSUE_TEMPLATE/challenge-result.yml) では、condition、run-id、Runtime repository / PR、Pack識別、比較相手、結果を一対一で対応付けます。`Challenge-specific design` には、採用しない情報、scope、引用の鮮度、更新・撤回trigger、保存ゼロの理由を書きます。相手runが未実施なら、その状態のまま提出できます。

## Judging

- 会話、Instructions、VS Code local Memory、GitHub Copilot Memory、Copilot Appの記憶を区別したか
- S1 / S2へ戻れるsource commit、path、symbol、未確認を残したか
- 保存ゼロを含む採否とscopeに、自分の理由があるか
- 古い引用、別scope、対象外noteを一括削除で処理していないか
- baselineを不利にせず、手動供給と永続Memoryを同一視していないか
- 実保存、持続、次会話再参照を観測済みと偽っていないか
- equal / worse / blocked / 追加不要を正直に保ったか

保存したnote数や「役立った」という結論だけでは採点しません。人がsourceと設計を読み、保守可能性と非主張を確認します。

## Bonus Mission

新しい不活性カードを1枚だけ提案し、「source commitが変わった」「引用行が主張を支持しない」「scopeが広がった」など、一つの陳腐化triggerを設計してください。既存4 cardsや本編conditionを変更せず、別Challengeやlive Memory操作へ進みません。

## Support / Fallback

[local-memory: local Memoryの準備境界](optional/local-memory.md) は `OPTIONAL_GUIDE_ONLY` / `live-unobserved` の任意ガイドです。対応Stable / Local、Preview tool、組織policy、専用scope、保存・限定更新、元状態確認について別承認がある場合だけ準備を検討します。

Runtime v1はMemory storeのbindingや復元を管理せず、tracked settingsも提供しません。既存記憶を分離できない、own noteだけを安全に戻せない、全消去が必要、個別削除を架空APIで補う必要がある場合は停止します。ガイドを読んだことや原稿hashを保存証拠にしません。

任意routeを実施しなくても本編は完了できます。S1 / S2が読めなければ `blocked`、利用予定harnessが非対応なら `unsupported`、既存状態を分離できなければ `incomparable` とし、架空の保存結果を作りません。終了時に整理するのは自分のparticipant成果物と当該runだけで、既存Memory、User設定、他人のnote、sourceを削除しません。
