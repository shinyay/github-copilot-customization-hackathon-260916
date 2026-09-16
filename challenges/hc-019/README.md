# HC-019 カスタマイズの健康診断を作ろう

**Language:** **日本語** / [English](../../en/challenges/hc-019/README.md)

## Scenario

GitHub Copilot向けInstructionsの原稿は、構文として読め、候補一覧にも表示されているのに、実際には互いに矛盾していることがあります。逆に、構文検査だけで「役に立たない」と決めるのも早計です。

このシナリオでは、無害な合成原稿と合成inventoryを使い、**構文・配置・対象harness・意味・発見・実利用・有用性**を分けて診断します。原稿は有効化せず、元の目的を残す最小修正と再確認方法を設計してください。

## この機能とは

customizationの状態は、少なくとも次の層に分けて考えます。

| 層 | 確認できること | それだけでは確認できないこと |
|---|---|---|
| syntax | frontmatterや本文を解析できるか | 指示同士が両立するか |
| location | 想定scopeの候補pathにあるか | clientが発見したか |
| harness | 対象client / agent hostが形式を扱うか | 今回の依頼へ投入されたか |
| meaning | 指示が競合せず目的を保つか | 実際に役立つか |
| discovery | 候補や参照元として見えたか | 本文が会話へ入ったか |
| application | requestへ投入された直接の手掛かりがあるか | 出力品質が上がったか |
| usefulness | taskに役立ったか | 別taskでも常に有効か |

`listed: true`、`enabled: true`、parse成功を `applied: true` と読み替えません。`applied: null` は未知のまま扱います。

参考: [Create and manage agent customizations](https://code.visualstudio.com/docs/agent-customization/overview)、[Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 向いていること / 向いていないこと

**向いていること**

- customizationが「見えるのに効かない」「効いたように見えるが根拠がない」状況の切り分け
- 自動検査と人の意味判断の分担
- 削除、書換え、scope限定、優先関係の明示などの最小修正の比較
- 未確認の層で止まる条件の明文化

**向いていないこと**

- parser成功や候補表示だけで適用・有用性を断定すること
- 実在するprofileや他人のcustomizationを教材として変更すること
- 外部評価modelの出力を唯一の正解にすること
- activeなInstructionsをこのリポジトリへ作ること

## ゴール

1. 固定2行の競合を説明する。
2. 7層を混同しない診断checklistを作る。
3. 元の目的を残す最小修正候補を選ぶ。
4. 構文と意味を別々に再確認し、未観測の層を明記する。

## 用意するもの

- [リポジトリ共通の始め方](../../README.md#始め方)を終えた作業環境
- Markdown / JSONを読めるエディター
- `starter/` の次の素材
  - [固定依頼](starter/request.txt.template)
  - [競合する本文](starter/fixtures/draft-p.txt.template)
  - [不活性frontmatter](starter/fixtures/wrapper.txt.template)
  - [合成inventory](starter/fixtures/inventory.json.template)
  - [設計票](starter/worksheets/design.md.template)
  - [診断checklist](starter/worksheets/checklist.md.template)
  - [修正検討票](starter/worksheets/repair.md.template)

管理UI、外部model、追加extensionは不要です。

## 準備

固定本文は次のexact 2行です。

```text
Use exactly the two headings Evidence and Unknowns.
Never include a heading named Unknowns.
```

固定frontmatterは次のとおりです。

```text
---
description: "Synthetic contradiction for evaluating instruction diagnostics"
applyTo: "**"
---
```

`*.template` は不活性な教材名です。連結した原稿を `.github/`、profile、User dataへ移動したり、`.template` を外したりしないでください。

合成inventoryには次の2項目があります。

| name | scope / source | 合成状態 |
|---|---|---|
| `lab19-safe` | workspace / `.github/instructions/lab19-safe.instructions.md` | local-agentとagent-hostの候補、enabled / listedはtrue、appliedはnull |
| `profile-only` | profile / `vscode-profile-user-data/instructions/profile-only.instructions.md` | local-agentの候補、enabledはfalse、listedはtrue、appliedはnull |

これらのpathと状態は教材上のlabelであり、実profileや管理UIの観測結果ではありません。

## 試してみる

1. [固定依頼](starter/request.txt.template)を読み、原稿を有効化せずに回答方針を考えます。
2. [設計票](starter/worksheets/design.md.template)へ、元の目的、点検順、自動確認と人の判断、停止条件を書きます。
3. wrapperと本文を別々に確認します。
   - syntax: frontmatterの形と本文2行を読めるか
   - meaning: `Unknowns` を必須にする行と禁止する行が同時に満たせるか
4. inventoryを確認します。
   - locationと対象harnessから言えることだけを書く
   - `listed` / `enabled` からapplicationを推測しない
   - `applied: null`、実UI、usefulnessは未知のまま残す
5. [診断checklist](starter/worksheets/checklist.md.template)の各行へ、入力、直接確認する材料、自動化できる事実、人が判断する内容、停止条件を記入します。
6. [修正検討票](starter/worksheets/repair.md.template)で複数案を比較します。例:
   - 競合する一方を削除する
   - 条件付きの表現へ書き換える
   - 適用scopeを狭める
   - 優先関係を明示する
   - customizationを追加しない
7. 選んだ案が、元の目的を保ち、変更範囲を増やしていないか再確認します。修正原稿を作る場合も `*.instructions.md.template` の不活性名を保ちます。

一つの削除方法へ合わせる課題ではありません。競合を解消する理由と、残した要求を説明できることが重要です。

## 任意: 比較する

最初に自由な方法で一度レビューし、次に新しいメモまたは会話でchecklistを使って同じ素材をレビューします。見落とした層、未知の扱い、説明量、保守負担を比較してください。

二回目は素材を既に知っているため、差をchecklistの効果や精度向上の証明にはしません。同等、複雑化、追加不要も有効な結論です。

## 確認ポイント

- 競合するexact 2行を特定できたか
- syntax、location、harness、meaning、discovery、application、usefulnessを分けたか
- 合成inventoryを実UIの観測と誤認していないか
- 自動確認と人の判断を分けたか
- 最小修正が元の目的を保っているか
- 未確認の層と、そこで止める条件を書いたか

## 発展

- [Customizations editorで自己所有copyを観察する](optional/customization-editor.md)
- [承認済みの外部diagnosticを試す](optional/diagnostic-evaluation.md)
- [Waza評価を安全に試す](optional/waza-evaluation.md)
- [自己所有copyのmigrationを観察する](optional/copy-migration.md)

いずれも本編とは独立した任意探索です。必要な製品、権限、データ送信、費用、安全条件を確認してから進めます。

## 制約・Fallback・安全

- 素材は `SYNTHETIC_TRAINING_ONLY` の合成fixtureです。合成IDや状態を実環境のlogとして扱いません。
- このリポジトリではactiveなInstructions、profile data、User設定を作成・変更しません。
- private code、秘密、第三者情報を外部評価へ送信しません。
- parserがなくても、frontmatterの区切り、必須field、本文2行を手作業で点検できます。
- Copilotや管理UIを使えなくても、固定fixture、inventory、worksheetだけで診断と最小修正の設計を完了できます。
- 実際のdiscovery、application、usefulnessを確認するには別の承認済み環境が必要です。確認できなければ `not-observed` と記録して終了します。
