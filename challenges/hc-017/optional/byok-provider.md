# BYOK provider を評価する探索ガイド

**Language:** **日本語** / [English](../../../en/challenges/hc-017/optional/byok-provider.md)

## 目的

[HC-017 の本編](../README.md)とは別に、Bring Your Own Key の provider を安全に評価できる条件を整理する補足ガイドです。本編の固定 7 行や private code は使わず、承認済みの無害な合成文だけを通信候補にします。

## 前提

- 許可済み provider、API、実モデル ID を一次資料で確認できる
- provider とモデルの利用資格、組織 policy、データ取扱い条件、費用範囲を確認できる
- credential を secure input で扱える
- 既存 provider 設定と今回の変更を区別し、元へ戻せる

## 権限と安全

- provider 登録、credential 入力、初回通信、費用発生はそれぞれ事前に許可を得ます。
- secret を repository、設定原稿、チャット、画面共有、shell 履歴へ記録しません。
- private code、本編の固定入力、顧客データは送信しません。
- 既存 provider や鍵を一括削除して比較条件を作りません。

## 手順

1. endpoint、API、実モデル ID、region、データ保持、費用上限を provider の公式資料で確認します。
2. 対象 client の公式 UI が secure input を提供することを確認します。
3. 開始前の provider 選択と設定の見える範囲を記録します。
4. 許可がある場合だけ provider を登録し、無害な合成文を一度送ります。
5. 要求したモデルと、client 上で観測できたモデル表示を分けて記録します。
6. 自分が追加した設定だけを元へ戻し、復元を確認します。

## 観察すること

- provider、API、要求モデル、観測表示
- 通信先とデータ取扱い条件
- secure input を使えたか
- 応答の有無と、観測できなかった項目
- 費用の確認方法
- cleanup 後の状態

接続できたことは、本編タスクの品質や provider 全体の安全性を示しません。

## 停止条件

- provider 登録または送信の許可がない
- endpoint、API、モデル ID、費用、データ取扱いのいずれかが不明
- credential を平文で扱う必要がある
- private code や本編の固定入力を送らなければ評価できない
- 自分の変更だけを安全に戻せない

[HC-017 の本編へ戻る](../README.md)
