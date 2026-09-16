# Agent Host で BYOK を評価する探索ガイド

**Language:** **日本語** / [English](../../../en/challenges/hc-017/optional/host-byok.md)

## 目的

[HC-017 の本編](../README.md)や local client の BYOK とは別に、Agent Host から provider を利用する経路を安全に観察するための補足ガイドです。local での接続成功を Host の成功として扱いません。

## 前提

- 対応する Agent Host と実行 OS を確認できる
- 必要な Experimental 設定、provider、実モデル ID、secure input の利用条件を確認できる
- Host、Copilot、provider、モデルの利用資格と組織 policy を確認できる
- Host の実行場所、profile data、設定の保存先、local client との違いを記録できる

## 権限と安全

- Experimental 設定、provider 登録、credential 入力、Host からの初回通信、費用発生は個別に許可を得ます。
- 送信候補は承認済みの無害な合成文だけにします。
- private code、本編の固定入力、既存 profile data、通常の User 設定は送信・変更しません。
- secret を repository やログへ残しません。

## 手順

1. Host の対応 OS、設定面、provider 対応、実行場所を公式資料で確認します。
2. local client と Host で共有される設定、共有されない設定を整理します。
3. 開始前の Host 設定と provider 選択の見える範囲を記録します。
4. 許可が揃う場合だけ、Host 側の公式手順で provider を選び、無害な合成文を一度送ります。
5. Host 上で観測できたモデル表示、応答、費用情報を記録します。
6. 自分が変更した Host 設定だけを元へ戻し、復元を確認します。

## 観察すること

- Host と実行 OS
- local client との設定差
- 要求した provider / モデルと観測表示
- secure input、通信、応答、費用の確認結果
- cleanup 後の Host 状態

Host で一度応答したことは、本編のモデル比較、local 経路、private task の品質を示しません。

## 停止条件

- 対応 Host / OS、Experimental 設定、provider、credential、費用の許可が揃わない
- local client でしか確認できない
- private code、本編の固定入力、通常 profile の変更が必要
- Host 側の変更だけを安全に戻せない

[HC-017 の本編へ戻る](../README.md)
