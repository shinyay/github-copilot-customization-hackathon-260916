# Local Agent / Agent Host で1件ずつ確認する

[メインシナリオへ戻る](../README.md)

## 目的

静的診断の次に、Local Agent と Agent Host でカスタマイズを1種類ずつ確認し、発見、本文の読み込み、実効 tool、approval を実測します。一度に複数の形式を有効化せず、結果を形式ごと・harness ごとに分離します。

## 前提

- 対象 VS Code version と、Local Agent / Agent Host の利用可否を公式文書で確認できる
- 通常利用とは分離した disposable workspace と profile を用意できる
- 対象 model とカスタマイズ機能を利用する権限がある
- 作成物を最後に安全に無効化・削除できる

## 権限・安全

- active 配置、model 利用、外部送信、終了時の削除を操作ごとに承認します。
- この repository の `starter/` は変更せず、承認済みの隔離 workspace だけで試します。
- user home、同期設定、既存 Plugin、既存カスタマイズへ上書きしません。
- Prompt が Agent Host で読み込まれない場合、Skill へ置き換えて同じ probe を継続しません。

## 手順

1. `../starter/diagnosis.md.template` をもとに観察表を用意します。
2. Skill、Prompt、Custom Agent、Plugin から1種類だけ選びます。
3. 公式文書で、その形式の active filename と配置先を確認します。推測した path は使いません。
4. 隔離 workspace に選んだサンプルだけを配置し、固定依頼 `../starter/request.txt.template` を実行します。
5. 候補として発見されたか、本文が使われたか、実効 tool、approval 表示、error を記録します。
6. 自分が配置したファイルだけを無効化・削除し、開始前状態へ戻します。
7. 次の形式または harness を試す場合は、新しい会話とクリーンな状態から繰り返します。

## 観察すること

- client / harness / version
- sample type と active path
- documented discovery / observed discovery
- loading
- declared tools / effective tools
- approval
- result / error / cleanup

1つの成功を、別形式、別 version、別 harness の成功へ一般化しません。

## 停止条件

- 対象機能または公式の配置先を確認できない
- 既存ファイルへの上書きや user home の変更が必要
- 必要な権限、model、費用、外部送信の承認がない
- 実効 tool や approval を観測できない
- 自分の変更だけを確実に戻せない

停止した項目は `blocked` または `not-observed` とし、[メインシナリオ](../README.md)の静的診断へ戻ります。
