# HC-020 VS Code拡張から専用ツールを提供しよう

**言語:** **日本語** / [English](../../en/challenges/hc-020/README.md)

## シナリオ

Markdown原稿にある `## Evidence`、`## Unknowns`、`[[source:...]]` を数える小さな処理があります。処理自体は通常のNode.jsで十分ですが、モデルから呼び出せるLanguage Model Toolにするには、入力、説明、確認、エラー、キャンセル、破棄まで設計する必要があります。

このシナリオでは、同じ副作用のないアナライザーをNode.jsで確認し、ToolラッパーとChat Participantの例は不活性な `*.template` としてレビューします。文字列を数えた結果が合っていても、文書の意味や引用先が正しいとは主張しません。

## この機能とは

| 機構 | 役割 |
|---|---|
| Language Model Tool | モデルが必要に応じて呼ぶ関数。`package.json` の宣言と `vscode.lm.registerTool` の登録が必要 |
| Chat Participant | `@` で選ぶ会話の入口。リクエストとストリーミング応答を扱い、モデル呼び出しは必須ではない |
| Custom Agent | 役割、Instructions、ツール構成を定義する仕組み。拡張機能APIでの関数登録とは別 |
| Subagent | 別コンテキストへ委任する実行。Participantの別名ではない |
| Agent Plugin | Skillなどをまとめて配布する仕組み。VS Code拡張機能のランタイムそのものではない |
| 通常のNode.js | 副作用のない計算を確認する基準。Toolの検出、確認UI、キャンセルUI、ライフサイクルは再現しない |

Node.jsとToolが同じ数値を返しても、Toolが登録、検出、選択、確認、キャンセルされたことまでは証明しません。

参考: [Language Model Tool API](https://code.visualstudio.com/api/extension-guides/ai/tools)、[Chat Participant API](https://code.visualstudio.com/api/extension-guides/ai/chat)、[AI extensibility overview](https://code.visualstudio.com/api/extension-guides/ai/ai-extensibility-overview)

## 向いていること / 向いていないこと

**向いていること**

- 副作用のない関数を、Node.jsと将来のToolの入口で共有する設計
- 上限を設けた入力、明示的なエラー、誤解を招かない出力説明の作成
- 確認、キャンセル、Disposableを含むラッパー契約の点検
- Node.jsだけで十分という判断の説明

**向いていないこと**

- Node版とTool版へ同じ処理をコピーすること
- 単純な文字列カウンターをMarkdownパーサー、ソース検証器、意味評価器と呼ぶこと
- stubやNode.jsの成功をDevelopment Hostでの成功とみなすこと
- 有効な拡張機能をこのリポジトリに作ること

## ゴール

1. 固定4行を同じアナライザーに3つの状態で入力し、文字列の出現数を確認する。
2. 入出力、エラー、確認、キャンセル、ライフサイクルの契約を説明する。
3. Tool、Participant、Custom Agent、Subagent、Agent Pluginを区別する。
4. Toolの入口を追加する価値があるか、Node.jsで十分かを判断する。

## 用意するもの

- [リポジトリ共通の始め方](../../README.md#始め方)を終えた作業環境
- Node.js 22以降
- `starter/` の次の素材
  - [固定依頼](starter/request.txt.template)
  - [固定4行](starter/fixtures/counter-draft.txt.template)
  - [副作用のないアナライザー](starter/helpers/analyzer.cjs.template)
  - [Tool / Participantラッパーの例](starter/examples/extension.cjs.template)
  - [`package.json` 例](starter/examples/package.json.template)
  - [設計票](starter/worksheets/design.md.template)
  - [計数記録票](starter/worksheets/counts.md.template)
  - [入力契約票](starter/worksheets/input-contract.md.template)

VS Code API、Development Host、拡張機能のインストール、LLMは本編に不要です。

## 準備

固定本文は次の4行です。4行目の後に終端LFを一つ保ちます。

```text
## Evidence
[[source:README.md#L1-L2]]
## Unknowns
実行時の挙動は確認していない。
```

`[[source:README.md#L1-L2]]` は、文字列の出現数を数えるための合成文字列です。実ファイル、引用行、主張の正しさは検証しません。

アナライザーの入力契約は次のとおりです。

- JSONでは、オブジェクト自身が持つフィールドは `text` の1つだけ
- `text` は空でも空白だけでもない文字列
- 上限は8,192 Unicodeコードポイント。8,193以上はRangeError
- TypeError: `Provide exactly one nonempty string field named text.`
- RangeError: `Draft text exceeds 8192 Unicode code points.`
- CRLFをLFへ正規化
- 行全体が `## Evidence` / `## Unknowns` である行を数え、末尾のスペース / タブは許容
- フェンス付きコードブロック内も数えるため、Markdownパーサーではない
- `[[source:...]]` 形式のマーカーを数えるだけで、パスやURLは開かない

出力フィールドは `evidenceSections`、`unknownSections`、`citationMarkers`、`semanticValidation` の4つだけです。`semanticValidation` は常に `not-performed` です。

## 試してみる

リポジトリのルートから次を実行します。フィクスチャ自体は変更せず、missing-headingだけをメモリ上で作ります。

```powershell
node --input-type=commonjs -e "const path=require('node:path'); const fs=require('node:fs'); const {analyze}=require(path.resolve(process.argv[1])); const original=fs.readFileSync(process.argv[2],'utf8'); const missing=original.replace(/^## Unknowns\r?\n/m,''); for (const [state,text] of [['original',original],['missing-heading',missing],['restored',original]]) console.log(state, JSON.stringify(analyze({text})));" .\challenges\hc-020\starter\helpers\analyzer.cjs.template .\challenges\hc-020\starter\fixtures\counter-draft.txt.template
```

期待する文字列の出現数は次のとおりです。

| 状態 | 変更 | `evidenceSections` | `unknownSections` | `citationMarkers` |
|---|---|---:|---:|---:|
| original | 固定4行 + 終端LF | 1 | 1 | 1 |
| missing-heading | `## Unknowns` とその改行だけを除く。最後の文は残す | 1 | 0 | 1 |
| restored | originalと同じ本文へ戻す | 1 | 1 | 1 |

結果を[計数記録票](starter/worksheets/counts.md.template)に記録します。3つの状態はすべて有効な入力であり、見出しの欠落を入力エラーとして扱わないでください。

次に、[Toolラッパーの例](starter/examples/extension.cjs.template)と[`package.json` の例](starter/examples/package.json.template)を読み、[設計票](starter/worksheets/design.md.template)と[入力契約票](starter/worksheets/input-contract.md.template)を確認します。

- Tool登録名: `count_workshop_evidence`
- prompt参照名: `workshopEvidence`
- Participant ID: `workshop-local.evidence-counter.reader`
- Participant参照名: `workshop-evidence`
- `prepareInvocation`: 同じアナライザーで入力を検査し、確認文を返す
- `invoke`: キャンセルを確認してから同じアナライザーを呼ぶ
- cancel message: `Evidence counting was cancelled.`
- ToolとParticipantのDisposableを `context.subscriptions` へ追加する

同期カウンターの入口でキャンセルを確認することと、長時間の処理を途中で強制停止できることは別です。

## 任意: 比較する

同じ固定依頼について、次を短く比較します。

1. Node.jsだけを公開入口にする案
2. 副作用のないアナライザーは変えず、Toolの入口を追加する案

利用者、呼び出し頻度、確認UI、エラーの説明、保守負担、見つけやすさを比較してください。計数結果が同じでも、入口の価値まで同じとは限りません。追加は不要、同等、複雑になるという結論も有効です。

## 確認ポイント

- 3状態が `[1,1,1] → [1,0,1] → [1,1,1]` になったか
- Node.jsとwrapperが同じ `analyze` を使っているか
- 追加フィールド、空白だけの入力、8,193コードポイントを拒否する契約か
- 4つの出力フィールドと `not-performed` を正しく説明したか
- ToolとParticipantを別の入口として扱ったか
- Node.jsの結果を、登録、検出、確認、キャンセルを実際に観測した結果へ昇格していないか

## 発展

- [Language Model ToolをDevelopment Hostで観察する](optional/extension-tool-host.md)
- [Chat ParticipantをDevelopment Hostで観察する](optional/chat-participant-host.md)

どちらも、承認済みの独立した開発フォルダーで行う補足の探索です。このリポジトリ内の `*.template` は名前を変更しません。

## 制約・代替手段・安全

- アナライザーはファイル / ネットワークI/Oや外部依存を持たない、純粋な関数です。
- 文字列の出現数は、Markdown構造、ソース / URL、引用内容、意味の正しさを検証しません。
- `package.json.template` のJSON Schemaに加え、アナライザー自身が8,192 Unicodeコードポイントの上限を検査します。
- ラッパーの例と`package.json`の例は不活性です。このリポジトリに有効な拡張機能を作成したり、インストールしたりしません。
- Development Hostを使えなくても、Node.jsによる3状態の確認と契約レビューで完了できます。
- Node.jsが使えない場合は、固定4行と正規表現の対象を手作業で確認し、実行結果は `not-observed` と記録します。
- Hostの探索では、通常のプロファイルへのインストール、既存パッケージの上書き、Marketplaceへの公開、未知のモデル呼び出しを行いません。
