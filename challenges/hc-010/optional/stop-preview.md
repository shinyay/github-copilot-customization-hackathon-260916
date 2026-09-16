# Stop Hookを使い捨てworkspaceで観察する

このガイドは[HC-010本編](../README.md)の任意の発展です。本編はHookを有効化せず完了できます。

## 目的

合成草稿に対するchecker結果、Stop adapterの出力、実際のStop発火、画面通知を別々に観察します。通知が返ったことを、形式合格や内容の正しさへ読み替えないことが目的です。

## 前提

- 利用中のVS CodeとCopilotがAgent HooksおよびStop Hookに対応している
- extension hostのOSとNode.js 22以降を確認できる
- 既存Hookと分離できる使い捨てworkspaceを用意できる
- 組織ポリシーとworkspace所有者がHookの追加を許可している

## 権限と安全

- `starter\` のファイルは不活性な原稿です。このrepository内で `.template` を外しません。
- 別の使い捨てworkspaceへ、今回使うhelper、合成草稿、設定だけをコピーします。
- `continue: true` を維持し、`decision: "block"`、自動修正、追加ターン、再試行ループを追加しません。
- 既存のUser/Home Hookを削除・上書きしません。終了時に消すのは自分が今回追加したものだけです。

## 手順

1. 本編の `manual\hc-010` layoutを使い、helper三つと合成草稿を使い捨てworkspaceへコピーする。
2. Hookを使わずcheckerを手動実行し、草稿の見出し構造と結果を確認する。
3. 合成Stop入力をadapterへ渡し、`continue: true`、`systemMessage`、checker結果の関係を確認する。
4. `starter\customization\stop-hook.json.template` を参照し、対象製品の公式手順に従って使い捨てworkspaceだけへStop Hookを設定する。
5. 合成草稿を対象にAgentを一度だけ実行し、現在のAgent実行が止まる時にHookが呼ばれたか確認する。
6. checker結果、adapter出力、製品が表示した通知を別々に記録する。画面通知が見えなくても推測で補わない。
7. 今回追加したHook設定と作業ファイルだけを削除し、元の選択状態を確認する。

## 観察すること

- 手動checkerとHook経由で同じ草稿を読んでいるか
- `pass`、`invalid`、`uncheckable`、再入時の`skipped`が混同されていないか
- adapterの通知文が形式検査だけであることを明示しているか
- Stopが会話やウィンドウの終了ではなく、現在のAgent実行停止に対応しているか
- 他のHookやUser設定が結果へ混入していないか

## 停止条件

- Hooksが利用できない、または組織ポリシー・所有者承認を確認できない
- extension hostのOS、Node.js、設定場所を確認できない
- 既存Hookと今回の追加分を分離できない
- blocking、外部接続、権限変更、既存設定の削除が必要になる
- 今回追加した設定だけを安全に解除できない

停止した場合は、本編の手動確認と通知設計へ戻ります。

[HC-010本編へ戻る](../README.md)
