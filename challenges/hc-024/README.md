# HC-024 一つずつ外して本当に効いた機能を探そう

## Challenge Story

CSV再送の説明を作るためにInstructionsとSkillを両方用意したところ、回答が読みやすくなりました。しかし「両方を入れたら良かった」という一回の結果だけでは、Instructionsが役立ったのか、Skillが役立ったのか、片方だけで十分だったのかは分かりません。

このChallengeではInstructionsをI、SkillをSとし、00 / 10 / 01 / 11の4セルを独立して比較します。source、運用メモ、依頼、Iの本文、Sの本文を凍結し、機構の有無だけを変えます。機構が置かれていたこと、発見されたこと、本文が使われたこと、出力へ影響したことも別々に記録します。

以前のChallengeやLABの設定・回答は使いません。固定されたCSV再送のsourceと合成運用メモを、このページと統合後のStarter Kitだけで扱います。DB、アプリ、test、外部serviceは実行しません。

## この機能とは

**factorial comparison（要因を組み合わせた比較）**は、複数の要因を個別にon/offして、それぞれの差と組合せの差を見る方法です。このChallengeの要因は2つだけです。

- **I: Instructions** — repositoryで繰り返す読み方や根拠の扱いを伝える短い原則。
- **S: Skill** — CSV再送を調べる手順、読むsource、未確認を分ける方法をまとめた再利用単位。

必要な4セルは次のとおりです。

- 00: Iなし、Sなし
- 10: Iあり、Sなし
- 01: Iなし、Sあり
- 11: Iあり、Sあり

この4セルがあれば、10−00でI単独、01−00でS単独、11−10でSの追加、11−01でIの追加を見られます。`Y11 − Y10 − Y01 + Y00` のような記述的な差を考えることもできますが、少数の出力から一般的な因果関係を証明するものではありません。

また、次を一つの「利用成功」にまとめません。

1. 原稿が所定pathに存在した。
2. clientが候補として発見した。
3. Instructions / Skill本文が実際に利用された。
4. sourceやメモがモデルへ供給された。
5. 出力が事前rubricで変化した。

Skillが存在しても未利用になることがあります。そのrunを捨てたり、同じrunで明示起動して成功に直したりしません。

## 向いていること / 向いていないこと

**向いていること**

- 二つの機構を併用し、片方だけでも足りるかを知りたいとき。
- 共通入力と原稿bytesを固定し、on/offだけを変えられるとき。
- 機構の存在、発見、利用、出力への効果を分けたいとき。
- equal、worse、追加不要、未利用も結果として残せるとき。

**向いていないこと**

- 11の一回答だけで両方の有効性を主張すること。
- 00へI/S全文を手動で貼り、baselineを別条件へ変えること。
- Sだけ別のsource・note・業務知識を持たせること。
- Agent、MCP、Hook、別modelも同時に変えること。
- 未観測のmodel、effort、toolsを既定値で補い、比較可能に見せること。
- 4セルの一つをduplicateして、件数だけ4に合わせること。

## Starter Kit

[Pack manifest](pack/manifest.json) は、同じ3 source、operations note、request、I/S skeleton、四セル表、空の設計・Evidence原稿を全conditionへ不活性に配置します。

予定PackはRuntime v1向けで、schemaVersion / challengeVersion / minimumTemplateVersionがすべて1、`allowedMutations: []`、condition strategyはseparate-repository、`branchSafe: false` です。

source種別は `baseline` です。固定sourceは次の3件で、Runtimeの515-file baselineに存在します。

| Runtime source path | raw SHA-256 |
|---|---|
| `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java` | `540035ef9797badbb049502462c9dfc23295dd7124f30d23e757f7ed5e97dde2` |
| `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java` | `6fd51123ea20d737192c90ebe9d06bc9cd893e1f352ba31d036c00350237f986` |
| `wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java` | `4512773a9a39ba25e61b1c1b1d0d9150d8004bfe43fb94617fb1bbe1c4a2ee63` |

source provenanceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`、source tree SHA-256は `c3cd74e0d65b1ae88a29a4392eb42f9d51ba2c671d111796aacc69fd9cc5b111` です。

固定taskは `OrderImportService.importDraft/replay`、`OrderGroup.canonicalHash`、`OrderImportPostgresTest.groupedMainImportUsesCorePricingAndNeverApprovesAndReplaysCanonically` の定義を読み、新規作成、同内容の再送、異内容の再送、canonicalization、test定義の範囲を分けて説明するものです。

test fileにはDB接続を前提とする定義があります。本編では実行せず、定義を読んだこととtest成功を区別します。未展開guardの実効動作、実際の採用理由、障害履歴は不明のままです。

全4条件へ同じ `operations-note.json` 全文を通常fileとして提供します。SHA-256は `22df2a80b62da87852559d22ef6d60e0a8aabc743d15b1ba8a591e9e9c64c2db` です。`SYNTHETIC_TRAINING_ONLY` の架空運用メモと、固定sourceからの静的snapshotを含みます。実障害履歴、実社内規約、最新DB状態ではありません。

Packは全条件へ次の9個の不活性payloadを同じbytesで配る予定です。

| payload leaf | 用途 |
|---|---|
| `brief.md.template` | source、合成メモ、禁止操作、比較境界 |
| `request.txt.template` | 省略しない固定依頼 |
| `source-packet.json.template` | 3 sourceとhash、note hash |
| `operations-note.json.template` | 全セル共通の合成運用メモ |
| `instructions-skeleton.md.template` | 参加者がIを設計する空の骨組み |
| `skill-skeleton.md.template` | 参加者がSを設計する空の骨組み |
| `design.md.template` | 要因、rubric、順序、停止条件 |
| `matrix.md.template` | 00 / 10 / 01 / 11の空表 |
| `evidence/comparison.md.template` | 完成回答を含まないEvidenceひな型 |

完成したI/Sや業務回答は配りません。exact condition IDsは `baseline`, `instructions`, `skill`, `both` です。

## Open Question

**同じCSV再送の説明を作るとき、あなたが設計した読み方と手順のどちらが役立ち、どちらを外しても困らなかったと言えますか。何がまだ測れていませんか。**

役立つの意味は、引用の正しさ、現行動作・合成運用・unknownの分離、不要な断言の減少、手順の再利用、操作量などから自分で選びます。文章が長くなったことやcitation markerの数だけを改善にしません。

I/Sのどちらも追加不要、Skillが見つからず未利用、11でかえって冗長になった、controlsが揃わず比較不能という結論も認めます。

## Design Time

4セルの会話を始める前に、次を `participant/hc-024/design.md` へ決めます。

1. Iへ置く共通原則。今回の業務回答そのものを書かず、根拠・推論・unknownの扱いを短く設計する。
2. Sへ置く手順とdescription。3 sourceと同じnoteを参照し、Sだけの隠れた業務情報を追加しない。
3. Iのraw bytes、Sのraw bytes、frontmatter/bodyの範囲とhashを凍結する方法。
4. 出力を読むrubric、condition順、反復数、初回と追問後の扱い、終了条件。
5. 全セルで同じにするsource、note、request、default Agent、read/search、model、effort、approval。
6. 原稿の存在、discovery、loading、usage、output effectを分けるEvidence。
7. 比較途中でI/Sや固定入力を変更したとき、全4セルを新しいrevisionでやり直す規則。

Iは `instructions` と `both` で完全に同じbytes、Sは `skill` と `both` で完全に同じbytesにします。全4条件へ凍結原稿を不活性な材料として用意しますが、00で会話へ貼ったり、探索対象として積極的に与えたりしません。

## Build

### Hub checkoutで統合状態を確認する

以下は **Hub checkout** で4 conditionの計画とPackを確認します。

```powershell
$Runs = [ordered]@{
  baseline     = 'hc024-00-01'
  instructions = 'hc024-10-01'
  skill        = 'hc024-01-01'
  both         = 'hc024-11-01'
}
foreach ($Condition in $Runs.Keys) {
  node .\scripts\plan-run.mjs --dry-run --challenge HC-024 --condition $Condition --team team-sora --run $Runs[$Condition]
}
node .\scripts\build-pack.mjs --challenge HC-024 --output .runtime/packs
```

dry-runは計画表示だけです。build済み出力は `.runtime\packs\hc-024-v1` ディレクトリです。既存出力を削除・上書きせず、新しい専用Hub checkoutで扱います。

### 4つの独立したRuntime checkoutを用意する

Runtime templateから4つの新しい非公開repositoryを作ります。conditionごとに別repository、名前付きbranch、fresh workspace、fresh conversationを使い、前セルからactive fileや回答を持ち込みません。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-024-v1'
$Condition = 'baseline'
$RunIds = [ordered]@{
  baseline     = 'hc024-00-01'
  instructions = 'hc024-10-01'
  skill        = 'hc024-01-01'
  both         = 'hc024-11-01'
}
$RunId = $RunIds[$Condition]
if (-not $RunId) { throw 'HC-024の固定conditionを選んでください' }
git status --short --branch
git switch -c "hc-024-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

Hub dry-runの `--run` とRuntime applyの `--run-id` には同じ `$RunId` を使い、`.hackathon/run.json` は手編集しません。

参加者が新規作成できる予定pathは次のとおりです。

| path | conditions |
|---|---|
| `participant/hc-024/design.md` | 全4 |
| `participant/hc-024/frozen-instructions.md.template` | 全4 |
| `participant/hc-024/frozen-skill.md.template` | 全4 |
| `participant/hc-024/operations-note.json` | 全4 |
| `participant/hc-024/answer.md` | 全4 |
| `.github/copilot-instructions.md` | `instructions`, `both` |
| `.github/skills/hc024-replay/SKILL.md` | `skill`, `both` |

全4条件で `operations-note.json` を同じbytesへコピーします。I/Sの凍結原稿も全4条件へ同じbytesで保存します。active化するのは表の該当conditionだけです。既存active fileがあれば上書きせず停止します。

Skillのnameは親directoryに合わせて `hc024-replay` とします。model、tools、Agent、MCP、Hook、scriptを追加しません。Java、XML、test、Runtime設定は変更しません。製品実行を行わない場合、`answer.md` には未実行と理由を書き、架空のLLM回答を作りません。

## Compare

`baseline` を **Baseline**、残る3セルを **Customized** と呼びます。Customized同士にも異なる比較目的があります。

| condition | I/S | active customization |
|---|---:|---|
| `baseline` | 00 | なし |
| `instructions` | 10 | 凍結したIだけ |
| `skill` | 01 | 凍結したSだけ |
| `both` | 11 | 同じI + 同じS |

比較は次の一要因差を中心に読みます。

- `instructions` − `baseline`: Iを加えた差。
- `skill` − `baseline`: Sを加えた差。
- `both` − `instructions`: Iがある状態でSを加えた差。
- `both` − `skill`: Sがある状態でIを加えた差。

4セルは別repository・branch・workspace・conversation・runです。全セルへ同じ3 source、同じnote全文、同じ十分なrequest、同じ凍結I/S材料を用意します。I/Sのactive状態以外を変えません。

Skillが候補に見えたこと、Skill本文が読まれたこと、source/noteを使ったこと、出力が変わったことを別にします。Skill未利用のrunも分母に残します。明示起動で追試する場合は誘導ありの別runとし、元4セルへ合算しません。

00へI/S全文をmanualで追加すると00ではなくなります。manual-equivalentを必須の5条件目にしません。4セル欠落、同件数duplicate、bothだけ違うI、skillだけ別note、未知modelの補完は `incomparable` または不正な比較です。

結果は `improved`、`equal`、`worse`、`incomparable`、`blocked`、`unsupported`、追加不要、未利用を条件ごとに残します。

## Evidence

各Runtimeで `.hackathon/evidence/hc-024/comparison.md` を参加者が作ります。必須見出しは次の9件です。

`Fixed task`, `Environment`, `Condition`, `Materials`, `Observations`, `Design rationale`, `Comparison set`, `Outcome`, `Limits`

特に次を記録します。

- cell IDと00 / 10 / 01 / 11 vector。
- source packet、3 source、note、request、I、Sのraw SHA-256。
- active fileのpathとhash。存在だけでdiscovery / usageを認定しない。
- Instructionsの発見・本文利用、Skillの発見・本文利用、source/noteの実供給。
- 初回の未修正回答、追問を行った場合の別結果。
- `Y00`, `Y10`, `Y01`, `Y11` と、事前rubricによる根拠。
- test定義を読んだことと、test未実行。
- 実障害履歴、採用理由、未展開guardなど残るunknown。
- 比較相手のrepository、branch、run ID、Hub commit、Pack hash、bundle参照。

四セルの完全性は、件数だけでなくexact condition IDsとvectorで確認します。すべてを同じ誤hashへ置換しても、固定基準と一致しないため拒否します。

Runtimeの静的検査は原稿の実利用や効果を観測しません。`runtimeBehavior` と `educationalEffect` は `not-observed` のままです。

## Submit

各Runtime checkoutで許可された成果物とEvidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

各Runtime Pull Requestに、そのセルのdesign、凍結I/S、共通note、answer、active file、Evidenceを含めます。active fileが不要なセルへ混ぜません。

[共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) へ4セルのRuntime URL / PR / run対応、同一入力・I/S hash、各一要因差、未利用、failure、unknown、限界をまとめます。[Submission Guide](../../docs/submission-guide.md) に従い、private source、secret、raw logs、local絶対pathを貼りません。

## Judging

- exact 00 / 10 / 01 / 11の4セルを欠落・重複なく実施したか。
- source、note、request、I/Sの対応するbytesを固定したか。
- 一要因差を読み、11の一回答だけで両機構を有効としなかったか。
- presence、discovery、loading、usage、effectを分けたか。
- Skill未利用、equal、worse、追加不要を残したか。
- test定義とtest実行、合成運用と実履歴を区別したか。
- Agent、MCP、Hook、別model等を4セルへ混ぜなかったか。
- 未観測controlsを補完せず、比較不能を正直に扱ったか。

mandatoryな5番目のmanual cellや、機能の利用回数は採点しません。

## Bonus Mission

次の二つは本編と分離した任意の準備ガイドです。どちらも `OPTIONAL_GUIDE_ONLY` / `live-unobserved` で、実行Packや操作権限を追加しません。

- [四機構ablationの準備境界](optional/ablation-preparation.md) — I / Skill / Agent / MCPのfullから一つずつ外す5行の準備。
- [Stop通知chainの準備境界](optional/hook-chain-preparation.md) — 同じcheckerを未接続 / 手動 / Stop通知へ接続する準備。

Bonusでは、どちらか一つの比較設計を紙上で読み、coreの4セルと何が違うかを説明します。Agent、MCP、Hookを本編Packへ追加せず、Previewやserverを起動しません。manualを5セル目にするBonusでもありません。

## Support / Fallback

InstructionsやSkillを実機で利用できない場合でも、I/Sの凍結、4セル行列、source/note/requestの同一性、比較計画を提出できます。その場合、discovery、loading、usage、output effectはnull / `not-observed` で、製品効果を主張しません。

通常Stableのworkspace実践は、将来のRuntime v2を前提にしません。一方、任意のAgent/MCP/Hook経路はcore Packに含まれず、ガイドも準備確認だけです。未承認server、Preview、追加tools、設定変更で本編を救済しません。

条件が揃わなければ `incomparable`、Runtimeや権限で止まれば `blocked`、対象機能がなければ `unsupported` とします。終了時は自分のactive I/Sと成果物だけを管理し、既存User設定、他人のSkill、広いdirectoryを削除・reset・stashしません。
