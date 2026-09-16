# HC-032 Cloud Agentの調査役とtoolsを設計しよう

## Challenge Story

受注承認の調査をCloud Agentへ頼むとき、チームは「コードから根拠を集める担当」と「実際に変更する担当」を分けたいと考えました。しかし、profileの説明に「読取り専用」と書くだけではOSやrepositoryの権限は変わりません。さらに、profileへtool名を書いたこと、実行時にそのtoolが利用可能だったこと、実際に呼ばれたことも別の事実です。

このChallengeでは、受注承認を追う**調査役**の責任、停止条件、変更担当への引継ぎを設計します。Cloud Agentや変更担当は本編では起動しません。参加者が作るのは不活性な `.template` 原稿と、同じ固定入力を使った供給設計の比較記録です。このページとStarter Kitだけで完結し、元LAB、HC-007、前のChallenge、前Phaseの成果は不要です。

## この機能とは

Custom Agent profileは、担当の名前・説明・利用させるtools・役割本文などをMarkdownで定義する仕組みです。GitHub.com向けのrepository profileは通常 `.github/agents/*.agent.md` に置き、default branchへ反映したprofileを選択して使います。本編ではactive pathへ配置せず、`participant/hc-032/` の不活性原稿として設計します。

このChallengeでは次の段階を分けます。

| 段階 | 確認するもの | それだけでは言えないこと |
|---|---|---|
| 保存 | repository、ref、filename、raw hash | 製品がprofileを発見した |
| 表示 | display name、候補として見えた記録 | そのprofileが選択された |
| 選択 | selectionの直接記録 | 宣言toolがすべて実効になった |
| 宣言 | profileの `tools` | 実行時のeffective tools |
| 実効 | 実行時に利用可能と確認できたtools | toolが呼ばれた |
| 呼出し | call ID、tool名、入力、結果 | 呼出し結果の意味が正しい |

`description` や役割本文に「read-only」「変更しない」と書くのは行動上の指示です。OS ACL、GitHub権限、network制御、tool実装の安全性を作るものではありません。逆に、`tools` の宣言だけを見て「呼ばれた」とも判断しません。

GitHubのCustom Agents設定では、`tools` を省略した場合、空配列の場合、未知名を含む場合で扱いが異なります。また、VS Code向けprofileの `handoffs` はGitHub.comのCloud Agentでは現在サポートされず、無視されます。変更担当への引継ぎは**人が読む設計成果**として作り、自動遷移とは説明しません。profileの `model` に関する一般的な設定説明はありますが、本編はmodelを変えず、Cloudでの実採用も確認済みとしません。

出典:

- [Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration)
- [Creating custom agents for Copilot cloud agent](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents)

文書確認日: **2026-09-15**。公式Docsの確認は、参加者のprofile保存・選択・実効tools・実callを観測した記録ではありません。

## 向いていること / 向いていないこと

**向いていること**

- 調査と変更で責任、停止条件、必要toolsが異なる作業
- 根拠をfile・symbolへ戻せる形で集める役割
- 未確認事項を変更担当へ明示的に渡すworkflow設計
- 宣言、選択、実効、callを分けたEvidence

**向いていないこと**

- profile本文だけでfilesystemやGitHubの権限を制御すること
- 調査役に修正、commit、投稿、承認までまとめて任せること
- tool数や禁止文の長さを品質の代理指標にすること
- 保存したprofileを、発見・選択・実行済みとして報告すること
- GitHub.comで未対応のhandoffを自動遷移として扱うこと

十分な通常依頼だけで同じ調査境界を保てるなら「追加不要」や `equal` は妥当です。役割本文が長くなって重要点が埋もれたなら `worse`、選択元や実効toolsを確認できなければ `unknown` / `not-observed`、条件を公平にそろえられなければ `incomparable` と記録できます。

## Starter Kit

[Pack manifest](pack/manifest.json) のsourceKindは `baseline` です。Java sourceはRuntime v1のrootにある固定baselineを読み、Packへもう1 tree複製しません。

### 固定source

Runtime root相対のsourcePathsは次のexact 3 pathです。

```text
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java
```

読む入口は `OrderService.approve`、継承元の `BaseService.require`、そこから呼ばれる `Actor.require` です。静的には、`OrderService extends BaseService` と、`require(actor, "MANAGER")` から `actor.require(roles)` へ進む経路を確認できます。これだけで特定の利用者や受注が承認可能だとは決めません。信用、在庫、永続化、実際の認証状態など、範囲外の条件は未確認として残します。

### 配布される不活性素材

Packは全3条件へ次の共通payloadを同じbytesで配置します。

```text
payload/brief.md.template
payload/request.txt.template
payload/design.md.template
payload/packets.json.template
payload/evidence/comparison.md.template
```

HC-032固有のpayloadは次の5件です。

```text
payload/control.agent.md.template
payload/evidence.agent.md.template
payload/manual-body.md.template
payload/handoff.md.template
payload/tools-ledger.md.template
```

配置先は `.hackathon/challenge/hc-032/starter/` です。Evidenceひな型だけは `.hackathon/challenge/hc-032/starter/evidence/comparison.md.template` に置かれます。`packets.json.template` の `P32-01`〜`P32-04` は、保存元違い、未選択、宣言のみ、call不一致などを診断する中立資料です。packetのID、順番、filenameを正解ラベルとして使いません。

### exact conditionsとtask

condition IDsは次のexact 3件です。

```text
baseline
role-profile
manual-equivalent
```

task IDは `approval-trace` のexact 1件です。したがって初回比較は **3 conditions × 1 task = 3セル**です。Phase 6全5Challengeでは39セルですが、これは実施済みrun数、Runtime condition総数、LAB unit数、公開件数ではありません。このChallengeのconsumer smokeはconditionごとの3 fresh runsで、各runに `approval-trace` の1セルを記録します。

### participant artifactsとsubmissionFiles

全条件で、参加者が作れるのは次のexact 6 pathだけです。すべて不活性な `.template` で、activeな `.github/agents` へ移しません。

```text
participant/hc-032/design.md.template
participant/hc-032/control.agent.md.template
participant/hc-032/evidence.agent.md.template
participant/hc-032/manual-body.md.template
participant/hc-032/handoff.md.template
participant/hc-032/tools-ledger.md.template
```

Evidenceのexact pathは次です。

```text
.hackathon/evidence/hc-032/comparison.md
```

required headingsは共通7件と固有1件です。

```text
Fixed task
Environment
Design
Comparison
Observations
Outcome
Limits
Profile and tools
```

`submissionFiles` は上のparticipant 6 filesとEvidence 1 fileの**exact 7 files**です。空ひな型のままではなく、設計判断、固定本文、引継ぎ、toolsの観測境界、比較結果を記入します。

### Runtime安全契約

- `allowedMutations: []`
- participantのallowed additionsは上記exact pathだけで、3条件すべてに同じ集合を許可
- overlayは `.hackathon/challenge/hc-032/**` 内の不活性 `.template` だけ
- `branchSafe: false`
- conditionごとに**別の非公開Runtime repository**、fresh workspace、fresh conversation、fresh profileを使う
- 同じrepositoryのbranch切替だけで3条件を実施しない
- Runtimeの静的検査やexportが成功しても、`runtimeBehavior` と `educationalEffect` は `not-observed`

本編にCloud Agent利用資格、repository管理権限、組織設定、課金、secret、追加softwareは不要です。Node.js 22以降、Git、HubとRuntimeを扱う通常の参加権限が必要です。Cloudでのprofile選択や起動を試す場合は、本編提出後の任意ガイドへ分離します。

## Open Question

**受注承認を説明する調査担当に、どこまで辿る責任を持たせ、何を変更担当へ未解決のまま渡しますか。**

唯一の役割文や最長のsource一覧を当てる課題ではありません。たとえば、共有ガードまで必ず追う、推論と確認済み事実を分ける、範囲外の業務条件を変更担当へ渡す、根拠が切れたら停止する、といった方針にはそれぞれ利点と費用があります。

役割を追加せず通常依頼を明確にする案も有効です。比較前に、改善したいfailure modeと、調査役が**しないこと**を自分で決めてください。

## Design Time

比較回答を見る前に、人が次を決めて `participant/hc-032/design.md.template` へ記録します。

1. 調査役が追うsource範囲、file・symbolの引用粒度、推論とunknownの書式。
2. 変更、投稿、実行、承認を行わず停止する条件。役割本文の禁止文をOS権限だと説明しない。
3. 変更担当へ渡すもの。確認済み事実、未確認、次に読む候補、変更を始める前の人の判断を分ける。
4. profileの保存元repository/ref/file、filename、display name、selectionをどう照合するか。
5. declared tools、effective tools、actual callsをどう別々に記録するか。
6. controlとevidenceのprofileで共通化するfrontmatterと、比較する役割本文の境界。
7. `manual-equivalent` へ渡す本文の開始・終了、文字コード、LF、raw SHA-256。
8. source、固定task、通常資料、model / effort / toolsの想定が条件間で違ったときの停止基準。

`control.agent.md.template` と `evidence.agent.md.template` は、どちらもexactに `read` と `search` を宣言する設計にします。比較中に片方だけtoolを追加・削除しません。参加者が選んだ調査役本文を凍結し、同じ本文だけを `manual-body.md.template` に全文収録します。frontmatter付きprofile全体と本文だけのhashを混同しないでください。

profile名や供給位置の差まですべて消せたとは主張しません。本文を修正したくなった場合は、初回記録を残し、別run / `repetition=2` としてやり直します。

## Build

### 1. Hubで3条件の計画とPackを確認する

Hub checkoutのrootで実行します。`team-sora` とrun名は公開可能な自分用識別子へ置き換えてください。

```powershell
node scripts\plan-run.mjs --dry-run --route core --challenge HC-032 --condition baseline --team team-sora --run hc032-baseline-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-032 --condition role-profile --team team-sora --run hc032-role-profile-01
node scripts\plan-run.mjs --dry-run --route core --challenge HC-032 --condition manual-equivalent --team team-sora --run hc032-manual-equivalent-01
node scripts\build-pack.mjs --challenge HC-032 --output .runtime/packs
```

`--output` はliteral `.runtime/packs` を使います。build結果はmanifest単体ではなく、`.runtime\packs\hc-032-v1` のようなPack directoryです。既存出力があれば上書きせず停止します。

### 2. 条件ごとに独立したRuntimeを用意する

[Runtime template](https://github.com/shinyay/github-copilot-customization-runtime-template) から3つの新しい非公開repositoryを作ります。各repositoryで1conditionだけを使い、named branch、fresh workspace、fresh conversation、fresh profileを用意します。repositoryを分けてもhome、User、組織、Memoryの影響が消えるとは限らないため、確認できる範囲とunknownをEvidenceへ残します。

各Runtime checkoutのrootで、conditionとrun IDをそのrepository用に設定して実行します。

```powershell
$pack = 'C:\work\hub\.runtime\packs\hc-032-v1'
$condition = 'baseline'
$runId = 'hc032-baseline-01'

npm run verify
node .hackathon\scripts\apply-pack.mjs $pack --team team-sora --condition $condition --run-id $runId
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
```

`.hackathon/template.json` がversion 1であること、source baseline、condition、branch bindingを確認します。`.hackathon/run.json` は手編集しません。applyや検査が失敗したら、許可を広げたり既存成果を消したりせず停止します。

### 3. 不活性な参加者原稿を作る

Starterを読み、人が次の7 filesを上書きなしで新規作成します。

```powershell
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$starter = "$root\.hackathon\challenge\hc-032\starter"

New-Item -ItemType Directory -Path .\participant\hc-032
New-Item -ItemType Directory -Path .\.hackathon\evidence\hc-032

[IO.File]::Copy("$starter\design.md.template", "$root\participant\hc-032\design.md.template", $false)
[IO.File]::Copy("$starter\control.agent.md.template", "$root\participant\hc-032\control.agent.md.template", $false)
[IO.File]::Copy("$starter\evidence.agent.md.template", "$root\participant\hc-032\evidence.agent.md.template", $false)
[IO.File]::Copy("$starter\manual-body.md.template", "$root\participant\hc-032\manual-body.md.template", $false)
[IO.File]::Copy("$starter\handoff.md.template", "$root\participant\hc-032\handoff.md.template", $false)
[IO.File]::Copy("$starter\tools-ledger.md.template", "$root\participant\hc-032\tools-ledger.md.template", $false)
[IO.File]::Copy("$starter\evidence\comparison.md.template", "$root\.hackathon\evidence\hc-032\comparison.md", $false)
```

既存pathがあれば上書きせず、そのrunを確認します。`.hackathon/challenge/` のStarter、Java、test、workflow、`.github/agents` は変更しません。

### 4. 同じdeclared toolsで役割本文だけを設計する

control/evidence profileのfrontmatterでは、少なくともprofile識別情報、`target` の想定、`description`、`tools` を読み分けられるようにします。filename / `name` など必要な識別名の差は台帳へ記録し、それ以外の比較対象でないmetadata、`target`、`description`、declared toolsは同じにします。両profileのdeclared toolsはexactに同じ `read` / `search` を保ち、比較因子はMarkdownの役割本文だけです。evidence profileの本文には、参加者が選んだ調査責任、出力形式、停止、変更担当への引継ぎを記入します。

`manual-body.md.template` には比較対象の役割本文を**全文**入れます。見出し、箇条書き、末尾まで省略せず、本文raw hashをprofile側の同じ区画と照合します。profile全体hashと本文hashを直接比較しません。

変更担当は `handoff.md.template` の受け手として設計するだけです。本編では変更担当を選択・起動せず、コード変更、PR作成、コメント投稿を行いません。

### 5. toolsとselectionの検査票を完成させる

`tools-ledger.md.template` には最低限、次を別欄で残します。

- profile source repository / ref / file
- filename / display name
- selected / not selected / unknown
- declared tools
- effective tools
- call ID / called tool / input / result
- 観測手段と観測不能理由

本編ではprofileを製品へ登録・選択・起動しないため、declared以外の多くは `not-observed` です。packetが「selected」「called」と主張している場合も、それを実サービス履歴へ昇格させず、packet内主張として診断します。

## Compare

全条件へ次の固定依頼、exact 3 source、通常の読取り資料を同じように与える設計にします。

> `OrderService` の受注承認について `BaseService` と `Actor` まで辿り、静的に確認できる条件と未確認点を整理し、変更担当への依頼事項を作ってください。変更・投稿・実行はしないでください。

task IDは全条件で `approval-trace` です。

以下では `baseline` を **Baseline**、`role-profile` と `manual-equivalent` を供給方法の異なる **Customized** として説明します。Customized同士を同じ機能経路とはみなしません。

| condition | 比較する供給案 | 固定するもの | 記録する限界 |
|---|---|---|---|
| `baseline` | 通常の固定依頼 + control profile案 | source、依頼、通常資料、declared tools | role本文を追加しない |
| `role-profile` | 同じtoolsのevidence profileへ凍結した役割本文を格納する案 | source、依頼、通常資料、declared tools | profile名・供給位置の差は残る |
| `manual-equivalent` | control profile + 同じ役割本文全文を手動供給する案 | source、依頼、通常資料、declared tools、本文bytes | 手動供給の位置・優先度はprofileと同一とは限らない |

Baselineを弱くするためにsourceや通常資料を隠しません。`manual-equivalent` へは `role-profile` の回答、完成trace、本文要約を渡しません。本文を凍結してから3セルを比較します。

各セルでは、回答の長さではなく次を比べます。

- `OrderService` → `BaseService` → `Actor` の根拠がfile・symbolへ戻れるか
- 認証・認可、受注の業務条件、推論、unknownを分離したか
- 変更担当へ渡す未解決事項が具体的か
- source外の条件、実行結果、実利用者状態を発明していないか
- declared / effective / called toolsを混同していないか

`read` / `search` から `read` のみにする案は別因子の設計付録です。本編3条件へ混ぜず、追加conditionにも数えません。tools省略、空配列、未知aliasを考察する場合も、危険なcommandで制限を試しません。

## Evidence

`.hackathon/evidence/hc-032/comparison.md` を人が記入します。required headingsをすべて残し、特に `Profile and tools` で次を分けます。

1. **Fixed task**: `approval-trace` の固定依頼全文、source 3 paths、packet ID、run / repetition。
2. **Environment**: repository、branch、workspace、client / host / OS / channel、指定・実効model、effort、利用可能tools。見えない値は `unknown`。
3. **Design**: 調査役の責任、停止、変更担当への引継ぎ、本文凍結範囲。
4. **Profile and tools**: 保存元/ref/name/selection、declared/effective/called、call ID。
5. **Comparison**: 3条件の同一入力、本文hash、条件差、壊れた等価条件。
6. **Observations**: packet内主張と自分の静的確認を分けた記録、source引用、unsupported claim。
7. **Outcome**: `improved` / `equal` / `worse` / `incomparable` / `blocked` / `unsupported`、または追加不要・未利用を説明する結論。
8. **Limits**: Cloud Agent、profile選択、effective tools、calls、変更担当、Java実行、教育効果の未観測。

raw hash一致は保存した本文bytesの一致です。製品が同じcontextへ投入したこと、同じmodelを使ったこと、回答品質へ因果効果があったことの証明ではありません。packetの分類、Runtime検査、export成功から実Cloud利用を逆算しません。

## Submit

各Runtimeでparticipant 6 filesとEvidenceを完成させた後、apply時と同じPack directoryを使います。

```powershell
node .hackathon\scripts\verify-run.mjs $pack --stage in-progress
node .hackathon\scripts\verify-run.mjs $pack --stage submitted
node .hackathon\scripts\export-submission.mjs $pack
```

export対象がexact 7 filesであることを確認します。空原稿、別condition、別run、余分なactive file、source変更があれば提出へ進みません。各conditionのRuntime PRには、そのconditionの設計原稿、profile原稿、manual本文、handoff、tools ledger、Evidenceを含めます。

[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ、condition → Runtime repository / PR / runの対応、役割境界、同toolsの比較、outcome、未観測、停止理由を要約します。secret、個人情報、local absolute path、private source、未加工logは貼らず、安全な参照とredact済み抜粋を使います。

Runtime verifierの成功は静的な契約受理です。`runtimeBehavior` / `educationalEffect` は `not-observed` のままで、Cloud Agent利用や学習効果の実証にはなりません。

## Judging

- 調査役と変更担当の責任、禁止事項、停止条件が分かれているか
- control/evidence profileで同じdeclared toolsを保ち、役割本文だけを比較したか
- profile source/ref/name/selectionと、declared/effective/called toolsを分離したか
- `description` のread-only表現をOS権限やACLとして扱っていないか
- exact 3 sourceへ戻れる根拠と、範囲外のunknownを残したか
- `manual-equivalent` へ凍結した役割本文全文を渡し、要約や前条件の回答で代用していないか
- 変更担当、Cloud Agent、実callを起動済みとしていないか
- equal、worse、追加不要、未利用、unknown、blocked、incomparableを隠していないか

profile名、tool数、禁止文の長さ、引用数、`improved` の獲得自体は加点しません。

## Bonus Mission

本編の3条件と本文を変更せず、`read` / `search` から `read` のみに絞る案を**別因子の設計付録**として作ります。どの調査経路が失われる可能性があるか、宣言だけで実効制限を確認できない点、不要な能力を減らす利点を書いてください。

実測する場合は新しい独立runにし、本編の3セルやcondition集合へ混ぜません。危険なcommand、書込み、投稿でtool制限を試さないでください。

## Support / Fallback

本編はprofileの不活性設計と固定資料比較だけで完了できます。Custom AgentやCloud Agentを利用できない場合も、control/evidence本文、manual全文、handoff、tools ledger、3セルの紙上比較を提出できます。機能非対応は `unsupported`、条件分離不能は `incomparable`、必要なHub/Runtimeへアクセスできない場合は `blocked` とします。

任意route ID `cloud-profile` の [Cloud profile確認ガイド](optional/cloud-profile.md) は **OPTIONAL_GUIDE_ONLY**、`required: false`、`liveStatus: "live-unobserved"` です。将来、profile保存・選択・版を実機で確認するための準備だけを扱います。

- prerequisite: Cloud利用資格、承認済み専用repository、選択元/refの確認、起動と費用上限の別承認
- runtime requirement: `cross-branch-handoff: blocked`
- runtime requirement: `cloud-profile-selection: not-checked`
- stop: 承認、資格、保存元、既存設定の所有者、branch binding、費用上限のいずれかが不明

guideを読んだこと、profileを保存したこと、候補が見えたことをCloud完走や本編改善の証拠にしません。Cloudが別branchへ作る成果をRuntime v1のrunへ結び付ける経路はblockedのままです。User設定への迂回、force-add、共有設定の削除、無制限の再試行は行いません。

任意リンクを開けない場合も、上のprerequisite・停止条件・`not-checked` / blockedをEvidenceへ転記すれば本編は完了できます。詳細な共通境界は [Support and Fallbacks](../../docs/support-and-fallbacks.md) を参照してください。
