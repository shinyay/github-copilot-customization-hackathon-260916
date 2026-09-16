# Contributing

このリポジトリは、GitHub Copilotのカスタマイズ機能をシナリオから学べる、静的な公開教材として維持します。

## シナリオの原則

- 1つのシナリオだけで目的、前提、手順、確認ポイントが分かるようにする。
- 機能名からではなく、現場の困りごとと判断したいことから始める。
- 機能が何を変え、何を保証しないかを説明する。
- 成功例だけでなく、差がない場合、悪化する場合、利用できない場合も扱う。
- 過去のイベント、提出、審査、run管理、非公開の解答資料を前提にしない。
- 固定sourceを使う場合は、公開されているrepositoryとrevisionを示す。Templateから作った作業用リポジトリのlocal `HEAD` とupstream revisionの一致は要求しない。
- secret、credential、個人情報、顧客データ、private source、社内限定情報を含めない。

## 推奨する本文構成

必要な章だけを使い、シナリオ固有の説明を優先してください。

1. `Scenario`
2. `この機能とは`
3. `向いていること / 向いていないこと`
4. `ゴール`
5. `用意するもの`
6. `準備`
7. `試してみる`
8. `任意: 比較する`
9. `確認ポイント`
10. `発展`
11. `制約・Fallback・安全`

結果の提出方法や採点基準ではなく、利用者が自分で判断できる観察項目を書きます。

## Starter素材

- 実習で直接使う固定入力、fixture、code excerpt、candidate、Customization例、helper、短いworksheetだけを置く。
- `challenges/hc-xxx/starter/` 配下へ、用途が分かる名前と構造で配置する。
- Copilotが誤って有効化しないよう、Customization例は `.template` suffixを維持する。
- `.github/copilot-instructions.md`、`*.instructions.md`、`*.prompt.md`、`*.agent.md`、`SKILL.md`、`.vscode/mcp.json` などを有効な名前のままコミットしない。
- 自動配置、hash、run ID、提出exportのためだけのmetadataは追加しない。
- helperは教材内の相対pathで動き、外部送信や実データへの接続を行わないようにする。

## Optionalガイド

`optional/` は本編を終えるための必須条件ではなく、追加の環境、資格、権限、製品surfaceを試す発展資料です。

- 目的、前提、権限と安全、試し方、観察ポイント、停止条件を書く。
- 本編READMEからリンクし、optionalガイドから本編へ戻れるようにする。
- ガイドを読んだことと、実機で成功したことを混同しない。

## インデックス

シナリオを追加、削除、改名した場合は `challenges/README.md` の静的インデックスを同じ変更で更新します。generatorやCatalogは使用しません。

## 確認

- READMEの相対リンクが存在するファイルへ解決する。
- `starter/` のサンプルが不活性な名前になっている。
- 手順がこのREADMEと対象シナリオだけで開始できる。
- 旧Hub／Pack／submission用commandやIssue提出導線が残っていない。
- `git diff --check` が成功する。
