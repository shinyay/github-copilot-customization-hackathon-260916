# stdio MCP sandbox を評価する探索ガイド

**Language:** **日本語** / [English](../../../en/challenges/hc-018/optional/mcp-sandbox.md)

## 目的

[HC-018 の本編](../README.md)や [terminal sandbox のガイド](terminal-sandbox.md)とは別に、local stdio MCP server の sandbox 境界を限定的に評価できる条件を整理する補足ガイドです。terminal の結果を MCP の結果へ転用しません。

## 前提

- macOS または Linux の local stdio 経路を利用できる
- 既に review 済みの限定 server と dummy operation がある
- server の起動方法、transport、trust、sandbox 設定、approval の動作を確認できる
- 分離 workspace、開始前状態、復元方法を用意できる
- 対応 client、Copilot、MCP 機能を利用できる

remote server、別 transport、Windows 対応は推測しません。

## 権限と安全

- local stdio server の trust と起動、sandbox 設定、approval の動作、dummy operation、復元は事前に許可を得ます。
- 新しい server、依存、credential、remote transport、home / network probe を追加しません。
- server の source と起動方法を review できない場合は実行しません。
- この repository に active な MCP 設定や probe program を追加しません。

## 手順

1. server の source、起動 command、transport、利用する tool を review します。
2. sandbox と approval がどの段階へ作用するか、境界 map に整理します。
3. 開始前の server、workspace、dummy target の状態を記録します。
4. 許可が揃う場合だけ local stdio server を起動し、限定された dummy operation を一度提案します。
5. tool 選択、proposal、approval、execution、OS result、program result を別々に記録します。
6. server を停止し、自分が変更した設定と dummy target だけを元へ戻します。

## 観察すること

- client、host OS、server、transport、tool
- server trust と起動方法
- sandbox と approval の見える範囲
- proposal と人の判断
- OS と program の結果
- server 停止と workspace の復元
- 観察できなかった境界

一つの stdio server の観察を、terminal、remote MCP、すべての tool、すべての OS へ外挿しません。

## 停止条件

- Windows、remote transport、未 review server しか使えない
- approval の動作が許可条件と一致しない
- credential、network、home、依存導入、追加 probe path が必要
- server source や復元方法を確認できない
- User 設定や別 server へ迂回しなければ進めない

[HC-018 の本編へ戻る](../README.md)
