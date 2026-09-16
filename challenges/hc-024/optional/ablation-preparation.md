# 四機構を一つずつ外す

**Language:** **日本語** / [English](../../../en/challenges/hc-024/optional/ablation-preparation.md)

## 目的

[HC-024 のメインシナリオ](../README.md)は Instructions と Skill の2要因を扱います。この補助ガイドでは、Instructions / Skill / Custom Agent / MCP の full 構成から1つずつ外し、どの構成要素が観察結果に関係したかを整理します。

調べるのは full と4つの一要素除去、合計5行です。全16組合せを網羅する設計ではありません。

## 前提

- メインシナリオの固定 source、合成運用メモ、request、評価観点を理解している。
- Custom Agent と MCP を利用できる、許可済みの使い捨て検証環境がある。
- 同じ model、実効 tools、source、メモ全文、request を各行でそろえられる。
- Agent 選択、local server 起動、server trust、resource 添付を個別に承認できる。

## 権限と安全

- このガイド自体は権限を付与しません。
- MCP は承認済みの read-only resource だけを対象にします。
- Agent の tool 宣言を実効 tools や OS 権限と同一視しません。
- 書込み、terminal、外部送信、通常 profile の変更は追加しません。
- MCP を外す行でも、同じ運用メモ全文を通常 file として渡し、情報量をそろえます。
- この教材 repository には active な Agent / MCP 設定を作りません。

## 手順

1. full 構成の I、Skill、Agent role、MCP resource を固定します。
2. 次の5行を作ります: full、without-instructions、without-skill、without-agent、without-mcp。
3. 各行で同じ source、メモ、request、model、実効 tools、評価観点を使います。
4. without-mcp では、MCP が返す予定だったメモと同じ全文を file として提供します。
5. presence、discovery、loading、resource 取得、usage、output effect を別々に記録します。
6. 一度に複数要素が変わった行は比較対象から分けます。

## 観察すること

- Agent が選択されたことと、その指示・tools が実際に使われたこと。
- resource を添付したことと、model が tool を選び call したこと。
- MCP 経由と file 経由で情報量が同じか。
- full から1要素を外したときの差が、事前評価観点で説明できるか。
- 未観測や未利用を `false` や成功に置き換えていないか。

5行だけから、未実施の組合せ全体や一般的な因果関係を主張しません。

## 停止条件

- 未承認の server、trust、Agent 選択、resource 添付が必要になった。
- without-mcp だけ情報量が変わった。
- model や実効 tools をそろえられない。
- resource 取得や tool call を観察できない。
- 書込み、外部送信、追加権限が必要になった。

[HC-024 のメインシナリオへ戻る](../README.md#発展)
