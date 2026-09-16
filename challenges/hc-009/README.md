# HC-009 CSV再送調査のプレイブックをSkillにしよう

## Scenario

CSV importの再送を調べるたびに、`external_key`、payload hash、同じrequestのreplay、異なるpayloadのconflict、新しいclaimの扱いを説明し直していると、確認項目が抜けやすくなります。さらに、sourceを読んだだけでdatabase stateや実際のincident historyまで断言してしまう危険があります。

このシナリオでは、安全なsource調査のplaybookをSkillへまとめます。Skill本文、checklist、source excerpt、検査scriptを一緒に再利用しながら、Skillが見つかったこと、本文を読んだこと、resourceを使ったこと、scriptを実行したことを別々に確認します。

## この機能とは

Skillは、特定種類の作業に必要な手順、reference、scriptをまとめるGitHub Copilotのカスタマイズです。対応clientではSkillを明示的に選べるほか、task descriptionから自動的に候補となる場合があります。

自動発見はclient、設定、task wordingに依存します。回答が良かっただけで「Skillが自動で使われた」と判断しません。次の観測を分けます。

- Skillが候補または選択済みとして表示された
- `SKILL.md` の手順が読み込まれた
- checklistやsource excerptが使われた
- bundled scriptが実行された

この題材では、`OrderImportService.importDraft` と `OrderGroup.canonicalHash` を調べます。Skillは調査だけを行い、import、replay、database接続は実行しません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返し使う手順、reference、validation scriptをまとめる作業
- 特定のtaskから選べる専門的なplaybook
- source boundaryとstop conditionを明示した調査
- 人が確認するworksheetの形式を軽く検査する作業

**向いていないこと**

- repository全体へ常に適用する短い規則
- secret、実CSV、production dataを保存すること
- 自動発見を前提にした無人のimportやreplay
- static readingだけでdatabase stateやincident historyを断言すること

## ゴール

- CSV再送調査用Skillを作業用リポジトリで有効化する
- 固定taskから新しいkey、同じhash、異なるhashの3経路をsourceへ戻して説明する
- `canonicalHash` のversion marker、header fields、quantity normalization、sorted line fingerprintsを確認する
- Skill本文、checklist、reference、scriptの利用を別々に観察する
- 調査noteをdependency-free scriptで検査する
- import、replay、database操作を一切実行しない

## 用意するもの

- Skillを利用できるGitHub Copilot client
- 題材のJava sourceを含む作業用リポジトリ
- 検査scriptを使う場合はNode.js
- このディレクトリの不活性な素材

| 素材 | 用途 |
|---|---|
| [`starter/customization/SKILL.md.template`](starter/customization/SKILL.md.template) | Skill本文の開始点 |
| [`starter/customization/checklist.md.template`](starter/customization/checklist.md.template) | replay判断の確認項目 |
| [`starter/reference/`](starter/reference/) | sourceを用意できない場合のread-only excerpt |
| [`starter/tools/check-investigation-note.mjs.template`](starter/tools/check-investigation-note.mjs.template) | 調査noteのheadingを確認するscript |
| [`starter/worksheets/investigation-note.md.template`](starter/worksheets/investigation-note.md.template) | 人が記入する調査note |

## 準備

1. 共通の準備は [始め方](../../README.md#始め方) に従い、作業用リポジトリで行います。
2. 次の素材を作業用リポジトリへコピーし、そこでだけ `.template` を外します。

   | コピー元 | 作業用リポジトリの配置先 |
   |---|---|
   | `starter/customization/SKILL.md.template` | `.github/skills/csv-resend-investigation/SKILL.md` |
   | `starter/customization/checklist.md.template` | `.github/skills/csv-resend-investigation/checklist.md` |
   | `starter/reference/OrderImportService.java.excerpt.md.template` | `.github/skills/csv-resend-investigation/reference/OrderImportService.java.excerpt.md` |
   | `starter/reference/OrderGroup.java.excerpt.md.template` | `.github/skills/csv-resend-investigation/reference/OrderGroup.java.excerpt.md` |
   | `starter/tools/check-investigation-note.mjs.template` | `.github/skills/csv-resend-investigation/scripts/check-investigation-note.mjs` |

3. `starter/worksheets/investigation-note.md.template` を `notes/hc-009-investigation.md` など自分のメモへコピーします。
4. 可能なら次のfull sourceを開けることを確認します。利用できなければbundled excerptだけを使い、その限界をnoteへ残します。
   - `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
   - `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
5. 固定taskを変えずに使います。

   > `OrderImportService.importDraft` と `OrderGroup.canonicalHash` を調査し、新しい `external_key`、同じhashの既存claim、異なるhashの既存claimでsourceが定義する結果を説明してください。database stateや実際のincident historyは推測せず、import/replayを実行しないでください。

この公開リポジトリでは全素材を `.template` のまま保ち、activeなSkillを作りません。

## 試してみる

1. fresh conversationで `csv-resend-investigation` Skillを明示的に選び、固定taskをそのまま渡します。
2. Skillが `checklist.md` を読み、full sourceまたは `reference/` のexcerptへ戻ったことを確認します。
3. `OrderImportService.importDraft` について、少なくとも次を分けて説明させます。
   - `canonicalHash()` の計算
   - 最初の `findClaim`
   - 既存claimがある場合の `replay`
   - referenceとkeyをlockした後の2回目の `findClaim`
   - 新しいkeyでの `saveDraft` とclaim保存
4. 既存claimでは、`payloadHash` が異なると `orderImport.keyConflict` で止まり、同じ場合だけ元のorderを取得して `orderImport.replayed` を返すことをsourceと対応付けます。元のorderを編集する経路だと決めつけません。
5. `OrderGroup.canonicalHash` では、次を別々に記録します。
   - `order-import-v1` marker
   - 先頭recordのcommon header fields
   - quantityをintegerへ変換してから文字列化すること
   - productとquantityから作るline fingerprint
   - line fingerprintをsortしてからfinal fingerprintへ含めること
6. static readingで分からないdatabase contents、transaction result、実incident history、実際の再送結果をunknownに残します。
7. 人が `notes/hc-009-investigation.md` を記入した後、Skillに含めたscriptで形式を確認します。

   ```console
   node .github/skills/csv-resend-investigation/scripts/check-investigation-note.mjs notes/hc-009-investigation.md
   ```

scriptは指定したnoteを読み、必須headingの不足だけを報告します。Java behaviorや回答の正しさを保証するものではありません。

## 任意: 比較する

同じ固定task、source、model、toolsをできるだけそろえ、次をfresh conversationで1回ずつ試します。

1. checklistを渡さない一般的なsource調査
2. `checklist.md` の本文だけをpromptへ貼る調査
3. Skillを明示的に選ぶ調査

checklist項目の抜け、unsupportedなdatabase claim、referenceの利用、note checkerまで到達できたかを手動で比べます。Skill版だけtaskやsourceを増やさず、入力をそろえられない場合は優劣を決めません。

## 確認ポイント

- Skillの対象taskとstop conditionが明確
- Skillの選択、body loading、resource loading、script executionを混同していない
- `importDraft` の最初と2回目のclaim lookupを分けている
- new key、matching hash、different hashの3経路をsourceへ戻せる
- `canonicalHash` をfile全体のbyte hashだと誤解していない
- static readingからdatabase stateやproduction resultを発明していない
- checkerの成功をJava behaviorの成功に置き換えていない
- import、replay、外部接続、file変更を実行していない

## 発展

- fresh conversationでSkill名を出さず、固定taskだけを渡して自動発見を観察します。clientに直接表示されなければ「不明」とし、回答品質から推測しません。
- 調査noteのcopyから必須headingを1つだけ外し、checkerがそのheading名を報告することを確認します。元のnoteは変更せず、確認後にcopyを削除します。

## 制約・Fallback・安全

- Skillを認識しないclientでは、`checklist.md.template` をfresh conversationへ貼る手動playbookに切り替えます。同じ回答が得られてもSkill discovery成功とは呼びません。
- Node.jsを使えない場合は、worksheetのheadingを人が確認します。scriptを実行したとは記録しません。
- full sourceを読めない場合はexcerptの範囲だけを説明し、欠けたmethodや周辺処理をunknownにします。
- 実CSV、注文ID、顧客情報、database output、raw private logを入力やnoteへ含めません。
- import、resend、replay、DB、server、build、test、外部networkを実行しません。
- checkerへ渡すpathを人が確認し、調査note以外を読ませません。
- 自動発見やresource loadingを観測できない場合は、成功と推測しません。
