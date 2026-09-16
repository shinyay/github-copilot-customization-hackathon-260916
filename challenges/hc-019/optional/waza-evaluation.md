# Waza評価を安全に試す

**Language:** **日本語** / [English](../../../en/challenges/hc-019/optional/waza-evaluation.md)

## 目的

利用可能なWaza評価環境がある場合に、合成fixtureだけを対象として評価の入力・出力境界を確認します。未知のcommand、schema、scoreを推測して作りません。

## 前提

- 承認済みのWaza extension / binaryと公式ドキュメント
- 対応OS、固定されたtool版、実際のschemaと操作方法
- model、データ送信、費用、出力保存先を確認できること
- [固定本文](../starter/fixtures/draft-p.txt.template)だけを使える隔離された作業場所

## 権限・安全

- extension / binaryの取得と実行、model利用、送信、費用を工程ごとに承認します。
- 入手元と署名またはhashを確認できないbinaryは実行しません。
- private code、秘密、第三者情報を送信しません。
- このリポジトリの不活性templateや通常profileを変更しません。

## 手順

1. 現在の公式ドキュメントで、入手元、対応OS、版、schema、操作方法を確認します。
2. 合成fixtureだけを含む作業copyを用意します。
3. 入力、model、送信先、費用、出力path、cleanup方法をレビューします。
4. 許可された操作を一段階ずつ行い、実際に使用した版と入力を記録します。
5. 出力を人が読み、固定2行の競合と直接対応する指摘だけを分けます。
6. scoreがある場合も、意味の真値、application、usefulnessへ一般化しません。
7. 自分が作ったcopy、process、出力だけを終了・整理します。

## 観察すること

- 実schemaと入力が一致したか
- tool / model / 送信 / 費用の境界が明確か
- scoreと具体的な診断根拠を分けられるか
- errorや未対応を成功として扱っていないか

## 停止条件

- 入手元、版、schema、操作方法、OS対応を確認できない
- binary、model、送信、費用の承認がない
- private dataや原本変更が必要
- cleanup方法が不明

[メインシナリオの発展へ戻る](../README.md#発展)
