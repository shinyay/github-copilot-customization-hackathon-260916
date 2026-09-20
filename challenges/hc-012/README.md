# HC-012 よく使うツールを迷わず選べるセットにしよう

**言語:** **日本語** / [English](../../en/challenges/hc-012/README.md)

## シナリオ

受注CSVの再送を調べるとき、前任者から「いつもの四つのtoolsを選んで」とだけ伝えられました。毎回個別に名前を探す方法と、用途が分かる名前付きTool Setから選ぶ方法では、どちらが別の担当者にも再現しやすいでしょうか。

このシナリオでは、固定した四つのツール参照を変えずに、個別選択と名前付き集合の手順を設計し、紙上で再構成します。Profileの実際の変更や、ツールの実際の呼び出しは必須ではありません。

## この機能とは

Tool Setは、すでに利用できるツールを、名前、説明、`icon` 付きの選択単位にまとめる機能です。たとえば、同梱のサンプルでは次の四つを `wholesaleReader` にまとめています。

```json
{
  "wholesaleReader": {
    "tools": ["search/changes", "search/codebase", "read/problems", "search/usages"],
    "description": "受注取込の実装根拠を読むための既存ツールの選択単位。権限や新機能は追加しない。",
    "icon": "book"
  }
}
```

`#wholesaleReader` は集合への参照です。新しい検索機能、利用資格、アクセス権、ACL、Sandboxは追加されず、四つすべてが自動的に呼び出される保証もありません。

次の状態は別々に扱います。

1. 原稿に宣言したメンバー
2. 手順を読んだ人が紙上で再構成したメンバー
3. UIで選択され、他の選択経路も含めて有効なメンバー
4. Agentが実際に呼び出したツール

## 向いていること / 向いていないこと

**向いていること**

- 同じツールを繰り返し選ぶ
- 担当交代時に用途とメンバーを一緒に伝える
- 集合を展開して欠落・余分・重複を確認する
- 初回準備と再設定の手順を揃える

**向いていないこと**

- 一度しか使わず、個別名の方が明確な作業
- 相手のクライアントに同じツールがない場合
- 新しい能力や権限を追加する
- 書き込み操作を完全に禁止するACLとして使う
- 全メンバーを毎回呼ばせる

## ゴール

1. 固定ソースの入口と、そこから確認できないことを整理する。
2. 固定された四つの参照を個別に選ぶ手順を書く。
3. 同じ四つの参照を持つTool Set原稿と、展開・確認手順を書く。
4. 別の人が手順だけから同じ四つの参照を再構成できるか確認する。
5. 集合を作らない方がよい場合も判断する。

## 用意するもの

- Markdown、JSONCを編集できる環境
- ソースを読む場合は、公開Runtimeテンプレートから作成した作業用リポジトリ
- Tool Sets UIを実際に試す場合だけ、対応するVS CodeとCopilot

固定ソース:

```text
upstream template: shinyay/github-copilot-customization-runtime-template
upstream revision: 8f0b3aa25c4f33facdea691642c2f1cb3901391c
source location: templateから作成したruntime workspace

wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java
wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java
wholesale-batch/src/test/java/jp/co/tsubame/wholesale/batch/OrderImportPostgresTest.java
```

upstreamリビジョンはソースの出所を示します。テンプレートから作成した作業用リポジトリは新しいGit履歴を持つため、
ローカルの `HEAD` がこの値と一致する必要はありません。

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

`.template` は不活性なサンプルです。このリポジトリでは、Profileが認識する有効な `.toolsets.jsonc` を作りません。記入する場合は別の作業場所へコピーし、`manual\hc-012\` の下で原稿として管理してください。

## 試してみる

1. `starter\brief.md.template`、`starter\request.txt.template`、`starter\reference\tool-members.json.template` を読む。
2. ソースを利用できる場合は、次の入口を実際に確認する。
   - `OrderImportService.importDraft` と `replay`
   - `OrderGroup.canonicalHash` と `validate`
   - `OrderImportPostgresTest` の接続前提と再送に関するテスト定義
3. `design.md.template` の作業用コピーに、パス、シンボル、読んだ範囲、未確認事項、集合名、説明、`icon` の理由を書く。
4. 個別選択の手順を `selection-worksheet.md.template` の作業用コピーに書く。
5. `reader.toolsets.jsonc.template` を参考に、固定された四つの参照を各1回だけ持つ集合原稿を作る。メンバーは変更しない。
6. JSON構文だけを確認する。

   ```powershell
   Get-Content -Raw .\starter\customization\reader.toolsets.jsonc.template |
     ConvertFrom-Json | Out-Null
   ```

7. 集合名を初めて見る人が、説明と手順だけを使って、四つの参照を紙上で書き戻す。自分で確認した場合は、事前知識の影響を記録する。
8. `membership.md.template` で、宣言、再構成、UIでの選択、実際の呼び出しを分ける。

## 任意: 比較する

`comparison.md.template` を使い、同じソース、依頼、四つの参照について、個別選択と名前付き集合を手動で比較します。Baseline / Customizedという呼び名を使う場合も、この短い比較のラベルに留めます。

## 確認ポイント

- 固定された四つの参照が、欠落、余分、重複なく各1回あるか
- 両方の手順が同じ誤った一覧になっていないか。必ず固定リストへ照合したか
- 集合名だけでなく、用途と対象外が `description` から分かるか
- 初回準備と再設定で省略してはいけない確認を区別したか
- `search/changes` の変更なしや `read/problems` の診断なしを、正しさの証明にしていないか
- 原稿の保存、UIでの選択、有効なツール、実際の呼び出しを混同していないか

## 発展

実際のProfileでTool Setの発見・選択・解除を安全に確認する場合は、[Profile Tool Setsの補足ガイド](optional/profile-tool-sets.md)を参照してください。

## 制約・代替手段・安全

- 固定された四つの参照は `search/changes`、`search/codebase`、`read/problems`、`search/usages` です。
- Tool Setは既存ツールの選択単位であり、能力、権限、承認を変更しません。
- サンプルはstrict JSONとしても読み取れるJSONCとし、`.template` のまま保持します。
- ソースを利用できない場合は、スターターの説明カードを使って選択手順だけを設計し、コードの読解は未確認であると明記します。
- Tool Sets UIや固定ツールを利用できない場合も、不活性な原稿と紙上での再構成によって完了できます。
- 実機で試す場合は、現在のProfileのpromptsフォルダーと `.toolsets.jsonc` の接尾辞をUIで確認し、`.vscode` や通常の `HOME` のパスを推測して書き換えません。
- 終了時に扱うのは自分が今回追加した設定だけです。既存Profile、同期設定、他人のファイルを削除しません。
