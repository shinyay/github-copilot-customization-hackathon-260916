# Language Model ToolをDevelopment Hostで観察する

**Language:** **日本語** / [English](../../../en/challenges/hc-020/optional/extension-tool-host.md)

## 目的

[メインシナリオ](../README.md)のpure analyzerを変えずに、Language Model Toolのregistration、selection、confirmation、call、cancel、disposeを実機で分けて観察します。

## 前提

- Language Model Tool APIに対応するVS Code / GitHub Copilot
- Extension Development Hostを起動できる承認済み環境
- このリポジトリとは別の、使い捨て可能な開発folder
- 現在のAPIドキュメントと、利用版に合うextension設定

## 権限・安全

- 開発folderの作成、Host起動、Tool選択、confirmation、cancelを対象限定で承認します。
- 通常profileへのinstall、Marketplace公開、既存folder / package上書きを行いません。
- このリポジトリ内の `starter/**/*.template` はrenameしません。
- 固定4行以外のprivate contentを入力せず、未知のmodel callが発生したら停止します。

## 手順

1. 現在の公式ドキュメントで、利用版がLanguage Model Tool APIに対応するか確認します。
2. 独立した開発folderへ次の3ファイルをcopyします。
   - `starter/examples/package.json.template` → `package.json`
   - `starter/examples/extension.cjs.template` → `extension.cjs`
   - `starter/helpers/analyzer.cjs.template` → `analyzer.cjs`
3. `package.json` のengine、Tool名、activation、input schemaを利用版と照合します。
4. `extension.cjs` が `require('./analyzer.cjs')` を保ち、別counterを実装していないことを確認します。
5. 製品のextension debugging手順でDevelopment Hostを起動します。
6. `count_workshop_evidence` の登録と候補表示を確認します。
7. 固定4行を入力し、confirmation文、call結果、4 output fieldsを記録します。
8. 別の一回でcancelを要求し、cancel messageと副作用の有無を確認します。
9. Hostを閉じ、Toolが解除され、開発folderだけを整理できることを確認します。

## 観察すること

- 宣言名、登録名、activationが一致するか
- selectionとconfirmationを別に確認できるか
- Node.jsと同じresult shapeか
- cancelがいつ確認されるか
- Host終了後にDisposableが解放されるか

## 停止条件

- 対応API / client、Tool候補、登録名を確認できない
- 通常profileへのinstallや既存package上書きが必要
- 同じanalyzerを使えない
- 未知の追加model call、file access、network accessが発生する
- cleanupを確認できない

live Toolが成功しても、literal counterのsemantic accuracyやsource accuracyは証明されません。

[メインシナリオの発展へ戻る](../README.md#発展)
