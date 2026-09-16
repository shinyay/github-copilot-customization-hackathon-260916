# utility model 経路を観察する探索ガイド

## 目的

[HC-017 の本編](../README.md)で扱う Chat model とは別に、commit message 生成など一つの utility model 経路を観察するための補足ガイドです。Chat picker で選んだモデルを、utility 機能の実効モデルとみなしません。

## 前提

- 対象を一つの utility 機能に限定できる
- 同じ非機密の固定入力と、同じ workspace 状態を用意できる
- 対応する client、Copilot、utility 機能を利用できる
- 実効モデルの表示または観測方法を公式資料で確認できる
- 設定変更が必要な場合、自分の変更だけを元へ戻せる

## 権限と安全

- utility 生成、実効モデルの観測、必要な設定変更は事前に許可を得ます。
- commit、push、provider 登録、credential 変更は行いません。
- private code や顧客情報を固定入力にしません。
- 生成物を repository に保存しません。

## 手順

1. 観察する utility 機能を一つ選び、Chat との入力経路の違いを確認します。
2. 非機密の固定入力、workspace 状態、生成前の設定を記録します。
3. 実効モデルを観測できる UI または公式手順があるか確認します。
4. 許可がある場合だけ一度生成し、表示と生成結果を記録します。
5. 同じ入力を通常 Chat へ渡した結果を、utility 経路の代替観測として扱いません。
6. 自分が変更した設定だけを元へ戻し、復元を確認します。

## 観察すること

- utility 機能と入力経路
- 固定入力と workspace 状態
- 要求設定と観測できたモデル表示
- 生成結果と欠測
- Chat model 選択との関係
- cleanup 後の状態

utility の一観測を、Chat model の実効経路や本編の品質比較へ外挿しません。

## 停止条件

- utility 入力経路または実効モデルを確認できない
- 追跡できない User / Profile 設定変更が必要
- provider 登録、credential 変更、commit、push が必要
- private code を使わなければ観察できない
- 自分の変更だけを安全に戻せない

[HC-017 の本編へ戻る](../README.md)
