# 承認済みの外部diagnosticを試す

**Language:** **日本語** / [English](../../../en/challenges/hc-019/optional/diagnostic-evaluation.md)

## 目的

外部の診断extensionやmodelへ、合成原稿だけを渡して補助的な指摘を得ます。出力は人のレビューを支える候補であり、意味の真値や修正のanswer keyではありません。

## 前提

- publisher、extension、利用model、費用を確認済みであること
- 送信内容、保存先、保持期間、組織policyを確認できること
- [固定本文](../starter/fixtures/draft-p.txt.template)と[frontmatter](../starter/fixtures/wrapper.txt.template)だけを使うこと
- 元へ戻せる自己所有の作業copy

## 権限・安全

- extension導入、model利用、データ送信、費用を個別に承認します。
- private code、秘密、個人情報、第三者情報を送信しません。
- 自動修正は無効にし、提案の適用は別判断にします。
- 通常profileや原本を直接変更しません。

## 手順

1. extensionの公式配布元、publisher、権限、送信先を確認します。
2. 合成2行とfrontmatterだけを含む使い捨てcopyを用意します。
3. 実際に送信される本文、metadata、logを事前に確認します。
4. 診断を一度実行し、入力、model、出力、費用、errorを記録します。
5. 指摘ごとに、固定2行から直接確認できるかを人がレビューします。
6. 採用する場合も、[修正検討票](../starter/worksheets/repair.md.template)で最小案として再評価します。
7. 自分が作ったcopyと保存logだけを整理します。

## 観察すること

- 競合2行を明示したか
- syntaxとmeaningを混同していないか
- 根拠のないapplication / usefulnessを主張していないか
- 提案が目的を削りすぎていないか

## 停止条件

- publisher、送信対象、model、費用、保存先を確認できない
- private contentを送らなければ成立しない
- 自動修正や原本変更が必須
- 出力を人が検証できない

[メインシナリオの発展へ戻る](../README.md#発展)
