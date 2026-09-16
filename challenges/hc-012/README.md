# HC-012 よく使うtoolsを迷わず選べるセットにしよう

## Scenario

受注CSVの再送を調べる時、前任者から「いつもの四つのtoolsを選んで」とだけ渡されました。個別名を毎回探す方法と、用途が分かる名前付きTool Setから選ぶ方法では、どちらが別の担当者にも再現しやすいでしょうか。

このシナリオでは、固定した四つのtool参照を変えずに、個別選択と名前付き集合の手順を設計し、紙上で再構成します。Profileの実変更やtoolの実呼出しは必須ではありません。

## この機能とは

Tool Setは、すでに利用できるtoolsを名前・説明・icon付きの選択単位へまとめる機能です。たとえば同梱sampleは、次の四つを `wholesaleReader` にまとめています。

```json
{
  "wholesaleReader": {
    "tools": ["search/changes", "search/codebase", "read/problems", "search/usages"],
    "description": "受注取込の実装根拠を読むための既存ツールの選択単位。権限や新機能は追加しない。",
    "icon": "book"
  }
}
```

`#wholesaleReader` は集合への参照です。新しい検索機能、利用資格、アクセス権、ACL、sandboxを追加せず、四つすべての自動呼出しも保証しません。

次の状態は別々に扱います。

1. 原稿に宣言したメンバー
2. 手順を読んだ人が紙上で再構成したメンバー
3. UIで選択され、他の選択経路も含めて有効なメンバー
4. Agentが実際に呼び出したtool

## 向いていること / 向いていないこと

**向いていること**

- 同じtoolsを繰り返し選ぶ
- 担当交代時に用途とメンバーを一緒に伝える
- 集合を展開して欠落・余分・重複を確認する
- 初回準備と再設定の手順を揃える

**向いていないこと**

- 一度しか使わず、個別名の方が明確な作業
- 相手のclientに同じtoolsがない場合
- 新しい能力や権限を追加する
- write操作を絶対に禁止するACLとして使う
- 全メンバーを毎回呼ばせる

## ゴール

1. 固定sourceの入口と、そこから確認できないことを整理する。
2. 固定四参照を個別に選ぶ手順を書く。
3. 同じ四参照を持つTool Set原稿と、展開・確認手順を書く。
4. 別の人が手順だけから同じ四参照を再構成できるか確認する。
5. 集合を作らない方がよい場合も判断する。

## 用意するもの

- Markdown、JSONCを編集できる環境
- sourceを読む場合は、公開Runtime templateから作成した作業用repository
- Tool Sets UIを実際に試す場合だけ、対応するVS CodeとCopilot

固定source:

```text
upstream template: shinyay/github-copilot-customization-runtime-template
upstream revision: 8f0b3aa25c4f33facdea691642c2f1cb3901391c
source location: templateから作成したruntime workspace

wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java
wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java
```

upstream revisionはsourceの出所です。templateから作った作業用repositoryは新しいGit履歴を持つため、
local `HEAD` がこの値と一致することは要求しません。

## 準備

共通の開始手順は[リポジトリREADMEの「始め方」](../../README.md#始め方)を参照してください。

`starter/` の構成:

```text
starter\
├─ brief.md.template
├─ request.txt.template
├─ customization\reader.toolsets.jsonc.template
├─ reference\tool-members.json.template
└─ worksheets\
   ├─ design.md.template
   ├─ selection-worksheet.md.template
   ├─ membership.md.template
   └─ comparison.md.template
```

`.template` は不活性なsampleです。このrepositoryではProfileに認識されるactiveな `.toolsets.jsonc` を作りません。記入する場合は別の作業場所へコピーし、`manual\hc-012\` の下で原稿として管理してください。

## 試してみる

1. `starter\brief.md.template`、`starter\request.txt.template`、`starter\reference\tool-members.json.template` を読む。
2. sourceを利用できる場合は、次の入口を実際に確認する。
   - `OrderImportService.importDraft` と `replay`
   - `OrderGroup.canonicalHash` と `validate`
   - `OrderImportPostgresTest` の接続前提と再送に関するtest定義
3. `design.md.template` の作業コピーへ、path、symbol、読んだ範囲、未確認事項、集合名・説明・iconの理由を書く。
4. 個別選択の手順を `selection-worksheet.md.template` の作業コピーへ書く。
5. `reader.toolsets.jsonc.template` を参考に、固定四参照を各1回だけ持つ集合原稿を作る。メンバーは変更しない。
6. JSON構文だけを確認する。

   ```powershell
   Get-Content -Raw .\starter\customization\reader.toolsets.jsonc.template |
     ConvertFrom-Json | Out-Null
   ```

7. 集合名を初めて見る人が、説明と手順だけから四参照を紙上で書き戻す。自分で確認した場合は、そのcarryoverを記録する。
8. `membership.md.template` で宣言、再構成、UI選択、実際のcallを分ける。

## 任意: 比較する

`comparison.md.template` を使い、同じsource、request、四参照について、個別選択と名前付き集合を手動で比較します。Baseline / Customizedという呼び名を使う場合も、この短い比較のラベルに留めます。

## 確認ポイント

- 固定四参照が欠落・余分・重複なしで各1回あるか
- 両方の手順が同じ誤った一覧になっていないか。必ず固定リストへ照合したか
- 集合名だけでなく、用途と対象外がdescriptionから分かるか
- 初回準備と再設定で省略してはいけない確認を区別したか
- `search/changes` の変更なしや `read/problems` の診断なしを、正しさの証明にしていないか
- 原稿保存、UI選択、有効なtools、実callを混同していないか

## 発展

実際のProfileでTool Setの発見・選択・解除を安全に確認する場合は、[Profile Tool Setsの補足ガイド](optional/profile-tool-sets.md)を参照してください。

## 制約・Fallback・安全

- 固定四参照は `search/changes`、`search/codebase`、`read/problems`、`search/usages` です。
- Tool Setは既存toolの選択単位であり、能力・権限・承認を変更しません。
- sampleはstrict JSONとしても読めるJSONCにし、`.template` のまま保持します。
- sourceを利用できない場合は、starterの説明カードを使って選択設計だけを行い、コードの読解は未確認と明記します。
- Tool Sets UIや固定toolsが利用できない場合でも、不活性な原稿と紙上の再構成で完了できます。
- 実機を試す場合はcurrent Profileのprompts folderと `.toolsets.jsonc` suffixをUIで確認し、`.vscode` や通常のHOME pathを推測して書き換えません。
- 終了時に扱うのは自分が今回追加した設定だけです。既存Profile、同期設定、他人のファイルを削除しません。
