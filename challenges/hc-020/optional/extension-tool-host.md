# Language Model ToolをDevelopment Hostで観察する

**言語:** **日本語** / [English](../../../en/challenges/hc-020/optional/extension-tool-host.md)

## 目的

[メインシナリオ](../README.md)の副作用のないアナライザーは変更せず、Language Model Toolの登録、選択、確認、呼び出し、キャンセル、破棄を実機で個別に観察します。

## 前提

- Language Model Tool APIに対応するVS Code / GitHub Copilot
- Extension Development Hostを起動できる承認済み環境
- このリポジトリとは別の、使い捨て可能な開発フォルダー
- 現在のAPIドキュメントと、利用中のバージョンに合う拡張機能の設定

## 権限・安全

- 開発フォルダーの作成、Hostの起動、Toolの選択、確認、キャンセルを、対象を限定して承認します。
- 通常のプロファイルへのインストール、Marketplaceへの公開、既存フォルダー / パッケージの上書きは行いません。
- このリポジトリ内の `starter/**/*.template` は名前を変更しません。
- 固定4行以外の非公開情報は入力せず、未知のモデル呼び出しが発生したら停止します。

## 手順

1. 現在の公式ドキュメントで、利用版がLanguage Model Tool APIに対応するか確認します。
2. 独立した開発フォルダーへ次の3ファイルをコピーします。
   - `starter/examples/package.json.template` → `package.json`
   - `starter/examples/extension.cjs.template` → `extension.cjs`
   - `starter/helpers/analyzer.cjs.template` → `analyzer.cjs`
3. `package.json` のエンジン、Tool名、activation、入力スキーマを利用中のバージョンと照合します。
4. `extension.cjs` が `require('./analyzer.cjs')` を保ち、別のカウンターを実装していないことを確認します。
5. 製品の拡張機能デバッグ手順でDevelopment Hostを起動します。
6. `count_workshop_evidence` の登録と候補表示を確認します。
7. 固定4行を入力し、確認文、呼び出し結果、4つの出力フィールドを記録します。
8. 別の試行でキャンセルを要求し、キャンセルメッセージと副作用の有無を確認します。
9. Hostを閉じ、Toolが破棄され、開発フォルダーだけを整理できることを確認します。

## 観察すること

- 宣言名、登録名、activationが一致するか
- 選択と確認を別々に確認できるか
- Node.jsと同じ結果形式か
- キャンセルがいつ確認されるか
- Host終了後にDisposableが解放されるか

## 停止条件

- 対応API / クライアント、Tool候補、登録名を確認できない
- 通常のプロファイルへのインストールや既存パッケージの上書きが必要になる
- 同じアナライザーを使えない
- 未知の追加モデル呼び出し、ファイルアクセス、ネットワークアクセスが発生する
- 後片付けを確認できない

実環境のToolが成功しても、文字列カウンターの意味の正確さやソースの正確さは証明されません。

[メインシナリオの発展へ戻る](../README.md#発展)
