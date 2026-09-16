# HC-020 VS Code拡張から専用Toolを提供しよう

**Language:** **日本語** / [English](../../en/challenges/hc-020/README.md)

## Scenario

Markdown原稿の `## Evidence`、`## Unknowns`、`[[source:...]]` を数える小さな処理があります。普通のNode.jsで十分な処理でも、モデルから呼べるLanguage Model Toolにするなら、入力、説明、確認、error、cancel、解除まで設計が必要です。

このシナリオでは、同じpure analyzerをNode.jsで確認し、Tool wrapperとChat Participantの例は不活性な `*.template` としてレビューします。literal countが合っても、文書の意味や引用先が正しいとは主張しません。

## この機能とは

| 機構 | 役割 |
|---|---|
| Language Model Tool | モデルが必要に応じて呼ぶ関数。`package.json` の宣言と `vscode.lm.registerTool` の登録が必要 |
| Chat Participant | `@` で選ぶ会話入口。requestとstream応答を扱い、model callは必須ではない |
| Custom Agent | 役割、Instructions、tool構成を定義する仕組み。extension APIの関数登録とは別 |
| Subagent | 別コンテキストへ委任する実行。Participantの別名ではない |
| Agent Plugin | Skillなどをまとめて配布する仕組み。VS Code extension runtimeそのものではない |
| 普通のNode.js | pure calculationを確認する基準。Tool discovery、確認UI、cancel UI、lifecycleは再現しない |

Node.jsとToolが同じ数値を返しても、Toolが登録・発見・選択・確認・cancelされたことまでは証明しません。

参考: [Language Model Tool API](https://code.visualstudio.com/api/extension-guides/ai/tools)、[Chat Participant API](https://code.visualstudio.com/api/extension-guides/ai/chat)、[AI extensibility overview](https://code.visualstudio.com/api/extension-guides/ai/ai-extensibility-overview)

## 向いていること / 向いていないこと

**向いていること**

- pure functionをNode.jsと将来のTool入口で共有する設計
- boundedな入力、明示的error、正直な出力説明の作成
- confirmation、cancel、Disposableを含むwrapper契約の点検
- Node.jsだけで十分という判断の説明

**向いていないこと**

- Node版とTool版へ同じ処理をコピーすること
- literal counterをMarkdown parser、source verifier、semantic evaluatorと呼ぶこと
- stubやNode.jsの成功をDevelopment Hostでの成功とみなすこと
- active extensionをこのリポジトリへ作ること

## ゴール

1. 固定4行を同じanalyzerで3状態にして、literal countを確認する。
2. 入出力、error、confirmation、cancel、lifecycleの契約を説明する。
3. Tool、Participant、Custom Agent、Subagent、Agent Pluginを区別する。
4. Tool入口を追加する価値があるか、Node.jsで十分かを判断する。

## 用意するもの

- [リポジトリ共通の始め方](../../README.md#始め方)を終えた作業環境
- Node.js 22以降
- `starter/` の次の素材
  - [固定依頼](starter/request.txt.template)
  - [固定4行](starter/fixtures/counter-draft.txt.template)
  - [pure analyzer](starter/helpers/analyzer.cjs.template)
  - [Tool / Participant wrapper例](starter/examples/extension.cjs.template)
  - [`package.json` 例](starter/examples/package.json.template)
  - [設計票](starter/worksheets/design.md.template)
  - [計数記録票](starter/worksheets/counts.md.template)
  - [入力契約票](starter/worksheets/input-contract.md.template)

VS Code API、Development Host、extension install、LLMは本編に不要です。

## 準備

固定本文は次の4行です。4行目の後に終端LFを一つ保ちます。

```text
## Evidence
[[source:README.md#L1-L2]]
## Unknowns
実行時の挙動は確認していない。
```

`[[source:README.md#L1-L2]]` はliteral計数用の合成文字列です。実ファイル、引用行、主張の正しさは検証しません。

analyzerの入力契約は次のとおりです。

- JSON上、own fieldが `text` 一つだけのobject
- `text` は空でも空白だけでもないstring
- 上限は8,192 Unicode code points。8,193以上はRangeError
- TypeError: `Provide exactly one nonempty string field named text.`
- RangeError: `Draft text exceeds 8192 Unicode code points.`
- CRLFをLFへ正規化
- 行全体が `## Evidence` / `## Unknowns` の行を数え、末尾space / tabは許容
- fenced code block内も数えるため、Markdown parserではない
- `[[source:...]]` 形のmarkerを数えるだけで、pathやURLを開かない

出力fieldはexactに `evidenceSections`、`unknownSections`、`citationMarkers`、`semanticValidation` の4つです。`semanticValidation` は常に `not-performed` です。

## 試してみる

リポジトリrootから次を実行します。fixture自体は変更せず、missing-headingだけをmemory上で作ります。

```powershell
node --input-type=commonjs -e "const path=require('node:path'); const fs=require('node:fs'); const {analyze}=require(path.resolve(process.argv[1])); const original=fs.readFileSync(process.argv[2],'utf8'); const missing=original.replace(/^## Unknowns\r?\n/m,''); for (const [state,text] of [['original',original],['missing-heading',missing],['restored',original]]) console.log(state, JSON.stringify(analyze({text})));" .\challenges\hc-020\starter\helpers\analyzer.cjs.template .\challenges\hc-020\starter\fixtures\counter-draft.txt.template
```

期待するliteral countは次のとおりです。

| state | 変更 | `evidenceSections` | `unknownSections` | `citationMarkers` |
|---|---|---:|---:|---:|
| original | 固定4行 + 終端LF | 1 | 1 | 1 |
| missing-heading | `## Unknowns` とその改行だけを除く。最後の文は残す | 1 | 0 | 1 |
| restored | originalと同じ本文へ戻す | 1 | 1 | 1 |

結果を[計数記録票](starter/worksheets/counts.md.template)へ記録します。3状態はすべて有効入力であり、見出し欠落をinput errorへ作り替えません。

次に、[Tool wrapper例](starter/examples/extension.cjs.template)と[`package.json` 例](starter/examples/package.json.template)を読んで、[設計票](starter/worksheets/design.md.template)と[入力契約票](starter/worksheets/input-contract.md.template)を確認します。

- Tool登録名: `count_workshop_evidence`
- prompt参照名: `workshopEvidence`
- Participant ID: `workshop-local.evidence-counter.reader`
- Participant参照名: `workshop-evidence`
- `prepareInvocation`: 同じanalyzerで入力検査し、確認文を返す
- `invoke`: cancelを確認してから同じanalyzerを呼ぶ
- cancel message: `Evidence counting was cancelled.`
- ToolとParticipantのDisposableを `context.subscriptions` へ追加する

同期counterの入口でcancelを確認することと、長時間処理を途中で強制停止できることは別です。

## 任意: 比較する

同じ固定依頼について、次を短く比較します。

1. Node.jsだけを公開入口にする案
2. pure analyzerは変えず、Tool入口を追加する案

利用者、呼出し頻度、確認UI、error説明、保守負担、発見可能性を比較してください。計数結果が同じでも、入口の価値は同じとは限りません。追加不要、同等、複雑化も有効な結論です。

## 確認ポイント

- 3状態が `[1,1,1] → [1,0,1] → [1,1,1]` になったか
- Node.jsとwrapperが同じ `analyze` を使っているか
- 追加field、空白input、8,193 code pointsを拒否する契約か
- 4 output fieldsと `not-performed` を正しく説明したか
- ToolとParticipantを別の入口として扱ったか
- Node.jsの結果をregistration、discovery、confirmation、cancelの実観測へ昇格していないか

## 発展

- [Language Model ToolをDevelopment Hostで観察する](optional/extension-tool-host.md)
- [Chat ParticipantをDevelopment Hostで観察する](optional/chat-participant-host.md)

どちらも、承認済みの独立した開発folderで行う任意探索です。このリポジトリ内の `*.template` はrenameしません。

## 制約・Fallback・安全

- analyzerはfile / network I/Oや外部依存を持たないpure functionです。
- literal countはMarkdown構造、source / URL、引用内容、意味の正しさを検証しません。
- `package.json.template` のJSON Schemaに加え、analyzer自身が8,192 Unicode code pointsを検査します。
- wrapper例と`package.json`例は不活性です。このリポジトリへactive extensionを作成・installしません。
- Development Hostを使えなくても、Node.jsによる3状態の確認と契約レビューで完了できます。
- Node.jsが使えない場合は、固定4行とregexの対象を手作業で確認し、実行結果は `not-observed` と記録します。
- Host探索では通常profileへのinstall、既存package上書き、Marketplace公開、未知のmodel callを行いません。
