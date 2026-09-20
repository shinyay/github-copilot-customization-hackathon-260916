# HC-019 カスタマイズの健全性を診断しよう

**言語:** **日本語** / [English](../../en/challenges/hc-019/README.md)

## シナリオ

GitHub Copilot向けのInstructions原稿は、構文として解釈でき、候補一覧にも表示されていても、内容が互いに矛盾していることがあります。逆に、構文検査だけを根拠に「役に立たない」と決めるのも早計です。

このシナリオでは、無害な合成原稿と合成インベントリを使い、**構文、配置、対象ハーネス、意味、検出、実際の適用、有用性**を分けて診断します。原稿は有効化せず、元の目的を保つ最小限の修正と再確認の方法を設計してください。

## この機能とは

カスタマイズの状態は、少なくとも次の層に分けて考えます。

| 層 | 確認できること | それだけでは確認できないこと |
|---|---|---|
| 構文（syntax） | front matterや本文を解析できるか | 指示同士が両立するか |
| 配置（location） | 想定するスコープの候補パスにあるか | クライアントが検出したか |
| ハーネス（harness） | 対象クライアント / Agent Hostが形式を扱えるか | 今回のリクエストに投入されたか |
| 意味（meaning） | 指示が競合せず目的を保つか | 実際に役立つか |
| 検出（discovery） | 候補や参照元として表示されたか | 本文が会話に取り込まれたか |
| 適用（application） | リクエストに投入されたことを示す直接の手掛かりがあるか | 出力品質が上がったか |
| 有用性（usefulness） | タスクに役立ったか | 別のタスクでも常に有効か |

`listed: true`、`enabled: true`、parse成功を `applied: true` と読み替えません。`applied: null` は未知のまま扱います。

参考: [Create and manage agent customizations](https://code.visualstudio.com/docs/agent-customization/overview)、[Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 向いていること / 向いていないこと

**向いていること**

- カスタマイズが「見えるのに効かない」「効いたように見えるが根拠がない」状況の切り分け
- 自動検査と人の意味判断の分担
- 削除、書き換え、スコープの限定、優先関係の明示など、最小限の修正の比較
- 未確認の層で止まる条件の明文化

**向いていないこと**

- パーサーによる解析の成功や候補表示だけで、適用や有用性を断定すること
- 実在するプロファイルや他人のカスタマイズを教材として変更すること
- 外部評価モデルの出力を唯一の正解にすること
- 有効なInstructionsをこのリポジトリに作ること

## ゴール

1. 固定2行の競合を説明する。
2. 7層を混同しない診断チェックリストを作る。
3. 元の目的を残す最小修正候補を選ぶ。
4. 構文と意味を別々に再確認し、未観測の層を明記する。

## 用意するもの

- [リポジトリ共通の始め方](../../README.md#始め方)を終えた作業環境
- Markdown / JSONを読めるエディター
- `starter/` の次の素材
  - [固定依頼](starter/request.txt.template)
  - [競合する本文](starter/fixtures/draft-p.txt.template)
  - [不活性なfront matter](starter/fixtures/wrapper.txt.template)
  - [合成インベントリ](starter/fixtures/inventory.json.template)
  - [設計票](starter/worksheets/design.md.template)
  - [診断チェックリスト](starter/worksheets/checklist.md.template)
  - [修正検討票](starter/worksheets/repair.md.template)

管理UI、外部モデル、追加の拡張機能は不要です。

## 準備

固定本文は次の2行です。

```text
Use exactly the two headings Evidence and Unknowns.
Never include a heading named Unknowns.
```

固定のfront matterは次のとおりです。

```text
---
description: "Synthetic contradiction for evaluating instruction diagnostics"
applyTo: "**"
---
```

`*.template` は不活性な教材名です。連結した原稿を `.github/`、プロファイル、User dataへ移動したり、`.template` を外したりしないでください。

合成インベントリには次の2項目があります。

| name | スコープ / ソース | 合成状態 |
|---|---|---|
| `lab19-safe` | workspace / `.github/instructions/lab19-safe.instructions.md` | local-agentとagent-hostの候補、enabled / listedはtrue、appliedはnull |
| `profile-only` | profile / `vscode-profile-user-data/instructions/profile-only.instructions.md` | local-agentの候補、enabledはfalse、listedはtrue、appliedはnull |

これらのパスと状態は教材内のラベルであり、実際のプロファイルや管理UIで観測した結果ではありません。

## 試してみる

1. [固定依頼](starter/request.txt.template)を読み、原稿を有効化せずに回答方針を考えます。
2. [設計票](starter/worksheets/design.md.template)へ、元の目的、点検順、自動確認と人の判断、停止条件を書きます。
3. ラッパーと本文を別々に確認します。
   - syntax: front matterの形式と本文2行を読めるか
   - meaning: `Unknowns` を必須にする行と禁止する行が同時に満たせるか
4. インベントリを確認します。
   - locationと対象ハーネスから言えることだけを書く
   - `listed` / `enabled` からapplicationを推測しない
   - `applied: null`、実UI、usefulnessは未知のまま残す
5. [診断チェックリスト](starter/worksheets/checklist.md.template)の各行に、入力、直接確認する材料、自動化できる事実、人が判断する内容、停止条件を記入します。
6. [修正検討票](starter/worksheets/repair.md.template)で複数案を比較します。例:
   - 競合する一方を削除する
   - 条件付きの表現へ書き換える
   - 適用スコープを狭める
   - 優先関係を明示する
   - customizationを追加しない
7. 選んだ案が、元の目的を保ち、変更範囲を増やしていないか再確認します。修正原稿を作る場合も `*.instructions.md.template` の不活性名を保ちます。

全員が一つの削除方法に合わせる課題ではありません。競合を解消できる理由と、残した要求を説明できることが重要です。

## 任意: 比較する

最初に自由な方法で一度レビューし、次に新しいメモまたは会話でチェックリストを使って同じ素材をレビューします。見落とした層、未知の扱い、説明量、保守負担を比較してください。

2回目は素材をすでに知っているため、その差だけでチェックリストの効果や精度向上が証明されたとは扱いません。結果が同等、手順が複雑になった、追加は不要という結論も有効です。

## 確認ポイント

- 競合する固定の2行を特定できたか
- syntax、location、harness、meaning、discovery、application、usefulnessを分けたか
- 合成インベントリを実際のUIで観測した結果と誤認していないか
- 自動確認と人の判断を分けたか
- 最小修正が元の目的を保っているか
- 未確認の層と、そこで止める条件を書いたか

## 発展

- [Customizations editorで自己所有copyを観察する](optional/customization-editor.md)
- [承認済みの外部diagnosticを試す](optional/diagnostic-evaluation.md)
- [Waza評価を安全に試す](optional/waza-evaluation.md)
- [自己所有copyのmigrationを観察する](optional/copy-migration.md)

いずれも本編とは独立した任意探索です。必要な製品、権限、データ送信、費用、安全条件を確認してから進めます。

## 制約・代替手段・安全

- 素材は `SYNTHETIC_TRAINING_ONLY` の合成フィクスチャです。合成IDや状態を実環境のログとして扱いません。
- このリポジトリでは、有効なInstructions、プロファイルデータ、User設定を作成・変更しません。
- 非公開コード、秘密、第三者情報を外部評価へ送信しません。
- パーサーがなくても、front matterの区切り、必須フィールド、本文2行を手作業で点検できます。
- Copilotや管理UIを使えなくても、固定フィクスチャ、インベントリ、ワークシートだけで診断と最小限の修正を設計できます。
- 実際のdiscovery、application、usefulnessを確認するには別の承認済み環境が必要です。確認できなければ `not-observed` と記録して終了します。
