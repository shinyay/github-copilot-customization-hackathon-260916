# HC-009 CSV再送調査の手順をSkillにまとめよう

**言語:** **日本語** / [English](../../en/challenges/hc-009/README.md)

## シナリオ

CSV インポートの再送を調べるたびに、`external_key`、ペイロードのハッシュ、同じリクエストのリプレイ、異なるペイロードによる競合、新しい `claim` の扱いを説明し直していると、確認項目が抜けやすくなります。さらに、ソースを読んだだけで、データベースの状態や実際のインシデント履歴まで断定してしまう危険があります。

このシナリオでは、安全にソースを調査する手順を Skill にまとめます。Skill の本文、チェックリスト、ソースの抜粋、検査スクリプトを一緒に再利用しながら、Skill が検出されたこと、本文が読み込まれたこと、リソースが使われたこと、スクリプトが実行されたことを、それぞれ分けて確認します。

## この機能とは

Skill は、特定の種類の作業に必要な手順、参考資料、スクリプトをまとめる GitHub Copilot のカスタマイズです。対応するクライアントでは Skill を明示的に選べるほか、タスクの説明から自動的に候補として提示される場合があります。

自動検出は、クライアント、設定、タスクの表現に依存します。回答の品質が高かったという理由だけで、「Skill が自動的に使われた」と判断しません。次の観測を分けます。

- Skill が候補または選択済みとして表示された
- `SKILL.md` の手順が読み込まれた
- チェックリストやソースの抜粋が使われた
- 同梱されたスクリプトが実行された

この題材では、`OrderImportService.importDraft` と `OrderGroup.canonicalHash` を調べます。Skill は調査だけを行い、インポート、リプレイ、データベースへの接続は実行しません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返し使う手順、参考資料、検証スクリプトをまとめる作業
- 特定のタスクに応じて選べる専門的な手順書
- ソースの境界と停止条件を明示した調査
- 人が確認するワークシートの形式を簡単に検査する作業

**向いていないこと**

- リポジトリ全体に常時適用する短い規則
- シークレット、実際の CSV、本番データを保存すること
- 自動検出を前提に、人が関与せずインポートやリプレイを実行すること
- 静的な読解だけで、データベースの状態やインシデント履歴を断定すること

## ゴール

- CSV 再送調査用の Skill を作業用リポジトリで有効にする
- 固定タスクについて、新しいキー、同じハッシュ、異なるハッシュの 3 経路をソースまでたどって説明する
- `canonicalHash` のバージョンマーカー、ヘッダーフィールド、数量の正規化、並べ替えた行フィンガープリントを確認する
- Skill の本文、チェックリスト、参考資料、スクリプトの利用を別々に観察する
- 調査メモを、依存関係のないスクリプトで検査する
- インポート、リプレイ、データベース操作を一切実行しない

## 用意するもの

- Skill を利用できる GitHub Copilot クライアント
- 題材の Java ソースを含む作業用リポジトリ
- 検査スクリプトを使う場合は Node.js
- このディレクトリにある、無効な状態の素材

| 素材 | 用途 |
|---|---|
| [`starter/customization/SKILL.md.template`](starter/customization/SKILL.md.template) | Skill 本文の開始点 |
| [`starter/customization/checklist.md.template`](starter/customization/checklist.md.template) | リプレイを判断するための確認項目 |
| [`OrderImportService.java.excerpt.md.template`](starter/reference/OrderImportService.java.excerpt.md.template) | `importDraft` を確認する、読み取り専用の代替抜粋 |
| [`OrderGroup.java.excerpt.md.template`](starter/reference/OrderGroup.java.excerpt.md.template) | `canonicalHash` を確認する、読み取り専用の代替抜粋 |
| [`starter/tools/check-investigation-note.mjs.template`](starter/tools/check-investigation-note.mjs.template) | 調査メモの見出しを確認するスクリプト |
| [`starter/worksheets/investigation-note.md.template`](starter/worksheets/investigation-note.md.template) | 人が記入する調査メモ |

## 準備

1. 共通の準備は [始め方](../../README.md#始め方) に従い、作業用リポジトリで行います。
2. 次の素材を作業用リポジトリにコピーし、そのリポジトリ内でだけ `.template` を外します。

   | コピー元 | 作業用リポジトリの配置先 |
   |---|---|
   | `starter/customization/SKILL.md.template` | `.github/skills/csv-resend-investigation/SKILL.md` |
   | `starter/customization/checklist.md.template` | `.github/skills/csv-resend-investigation/checklist.md` |
   | `starter/reference/OrderImportService.java.excerpt.md.template` | `.github/skills/csv-resend-investigation/reference/OrderImportService.java.excerpt.md` |
   | `starter/reference/OrderGroup.java.excerpt.md.template` | `.github/skills/csv-resend-investigation/reference/OrderGroup.java.excerpt.md` |
   | `starter/tools/check-investigation-note.mjs.template` | `.github/skills/csv-resend-investigation/scripts/check-investigation-note.mjs` |

3. `starter/worksheets/investigation-note.md.template` を、`notes/hc-009-investigation.md` など自分のメモにコピーします。
4. 可能であれば、次の完全なソースを開けることを確認します。利用できない場合は、同梱された抜粋だけを使い、その限界をメモに残します。
   - `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
   - `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
5. 固定タスクは変更せずに使います。

   > `OrderImportService.importDraft` と `OrderGroup.canonicalHash` を調査し、新しい `external_key`、同じhashの既存claim、異なるhashの既存claimでsourceが定義する結果を説明してください。database stateや実際のincident historyは推測せず、import/replayを実行しないでください。

この公開リポジトリでは、すべての素材を `.template` のまま保ち、有効な Skill は作りません。

## 試してみる

1. 新しい会話で `csv-resend-investigation` Skill を明示的に選び、固定タスクをそのまま渡します。
2. Skill が `checklist.md` を読み、完全なソースまたは `reference/` の抜粋を参照したことを確認します。
3. `OrderImportService.importDraft` について、少なくとも次を分けて説明させます。
   - `canonicalHash()` の計算
   - 最初の `findClaim`
   - 既存の `claim` がある場合の `replay`
   - 参照先とキーをロックした後の 2 回目の `findClaim`
   - 新しいキーに対する `saveDraft` と `claim` の保存
4. 既存の `claim` については、`payloadHash` が異なる場合は `orderImport.keyConflict` で停止し、同じ場合に限り元の注文を取得して `orderImport.replayed` を返すことを、ソースと対応付けます。元の注文を編集する経路だとは決めつけません。
5. `OrderGroup.canonicalHash` では、次を別々に記録します。
   - `order-import-v1` マーカー
   - 先頭レコードの共通ヘッダーフィールド
   - 数量を整数に変換してから文字列化すること
   - 商品と数量から作る行フィンガープリント
   - 行フィンガープリントを並べ替えてから、最終フィンガープリントに含めること
6. 静的な読解では分からない、データベースの内容、トランザクション結果、実際のインシデント履歴、実際の再送結果は、不明点として残します。
7. 人が `notes/hc-009-investigation.md` を記入した後、Skill に含まれるスクリプトで形式を確認します。

   ```console
   node .github/skills/csv-resend-investigation/scripts/check-investigation-note.mjs notes/hc-009-investigation.md
   ```

スクリプトは指定したメモを読み、必須見出しの不足だけを報告します。Java の挙動や回答の正しさを保証するものではありません。

## 任意: 比較する

同じ固定タスク、ソース、モデル、ツールをできるだけそろえ、次の方法を新しい会話で 1 回ずつ試します。

1. チェックリストを渡さない一般的なソース調査
2. `checklist.md` の本文だけをプロンプトに貼り付ける調査
3. Skill を明示的に選ぶ調査

チェックリスト項目の抜け、根拠のないデータベースに関する主張、参考資料の利用、メモのチェッカーまで到達できたかを、手動で比べます。Skill を使う場合だけタスクやソースを増やすことはせず、入力をそろえられない場合は優劣を決めません。

## 確認ポイント

- Skill の対象タスクと停止条件が明確である
- Skill の選択、本文の読み込み、リソースの読み込み、スクリプトの実行を混同していない
- `importDraft` の最初と 2 回目の `claim` 検索を分けている
- 新しいキー、同じハッシュ、異なるハッシュの 3 経路をソースまでたどれる
- `canonicalHash` を、ファイル全体のバイト列に対するハッシュだと誤解していない
- 静的な読解から、データベースの状態や本番環境での結果を作り出していない
- チェッカーの成功を、Java の挙動が正しいことに置き換えていない
- インポート、リプレイ、外部接続、ファイル変更を実行していない

## 発展

- 新しい会話で Skill 名を出さず、固定タスクだけを渡して自動検出を観察します。クライアントに直接表示されなければ「不明」とし、回答の品質から推測しません。
- 調査メモのコピーから必須見出しを一つだけ外し、チェッカーがその見出し名を報告することを確認します。元のメモは変更せず、確認後にコピーを削除します。

## 制約・代替手段・安全

- Skill を認識しないクライアントでは、`checklist.md.template` を新しい会話に貼り付ける手動の手順書に切り替えます。同じ回答が得られても、Skill の検出に成功したとはみなしません。
- Node.js を使えない場合は、ワークシートの見出しを人が確認します。スクリプトを実行したとは記録しません。
- 完全なソースを読めない場合は、抜粋の範囲だけを説明し、欠けているメソッドや周辺処理を不明点として残します。
- 実際の CSV、注文 ID、顧客情報、データベースの出力、未加工の非公開ログを、入力やメモに含めません。
- インポート、再送、リプレイ、データベース、サーバー、ビルド、テスト、外部ネットワーク接続は実行しません。
- チェッカーに渡すパスを人が確認し、調査メモ以外を読ませません。
- 自動検出やリソースの読み込みを観測できない場合は、成功したと推測しません。
