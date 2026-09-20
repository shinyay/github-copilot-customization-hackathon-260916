# HC-024 InstructionsとSkillを一つずつ外して比べよう

**言語:** **日本語** / [English](../../en/challenges/hc-024/README.md)

## シナリオ

CSV 再送の説明を作るために Instructions と Skill を併用したところ、回答が読みやすくなりました。しかし、両方を使った1回の結果だけでは、Instructions が役立ったのか、Skill が役立ったのか、片方だけで十分だったのかは分かりません。

このシナリオでは、Instructionsを **I**、Skillを **S** とし、00 / 10 / 01 / 11の4セルで1つずつ要因を変えて比較します。ソース、合成運用メモ、依頼、Iの原稿、Sの原稿を固定し、I / Sの有無以外はできるだけ変えません。

## この機能とは

要因計画による比較（factorial comparison）は、複数の要因を個別に有効 / 無効にして、各要因による差と組み合わせによる差を確認する方法です。

| cell | I | S |
|---|---:|---:|
| 00 | 0 | 0 |
| 10 | 1 | 0 |
| 01 | 0 | 1 |
| 11 | 1 | 1 |

主に `10 − 00`、`01 − 00`、`11 − 10`、`11 − 01` を読みます。少数の回答から一般的な因果関係を証明するものではありません。

また、次を一つの「成功」にまとめません。

1. 原稿が所定の場所に存在した。
2. クライアントが候補として検出した。
3. Instructions / Skillの本文が読み込まれた。
4. ソースやメモが回答に使われた。
5. 事前に決めた観点で出力が変化した。

Skill が存在しても未利用になることがあります。未利用の結果も残します。

## 向いていること

- InstructionsとSkillを併用しており、片方だけで足りるか確認したい。
- 入力と原稿を固定し、有効 / 無効だけを変えられる。
- 存在（presence）、検出（discovery）、読み込み（loading）、利用（usage）、影響（effect）を分けて観察できる。
- `equal`、`worse`、追加不要、未利用も結果として扱える。

## 向いていないこと

- 11 の回答だけで両機能の効果を主張する。
- 00 へ I / S 本文を手動で貼り、別の入力にする。
- Skill側だけに追加の業務知識を入れる。
- Agent、MCP、Hook、モデルも同時に変更する。
- 未観測の `model`、`effort`、`tools`、`usage` を既定値で補う。

## ゴール

1. 共通原則だけを持つ短い I と、再利用手順を持つ S を設計する。
2. I は 10 / 11、S は 01 / 11 で同じ内容を使う。
3. 4セルで共通にする入力、評価観点、停止条件を先に決める。
4. presence、discovery、loading、usage、effectを分けて記録する。
5. 比較できない場合や両方不要な場合も、理由付きで残す。

## 用意するもの

- GitHub Copilot Chat。実機比較をしない場合はテキストエディターだけでも構いません。
- `starter/` の不活性な教材。`.template` はこのリポジトリで有効化しません。

| ファイル | 用途 |
|---|---|
| `starter/request.txt.template` | CSV 再送を説明する固定依頼 |
| `starter/source-packet.json.template` | 公開された上流テンプレート、ワークスペース内の3つのソース、引用ID |
| `starter/operations-note.json.template` | 全セルで共通にする合成運用メモ |
| `starter/brief.md.template` | 4セルと安全境界の要約 |
| `starter/instructions-skeleton.md.template` | Iの不活性な原稿 |
| `starter/skill-skeleton.md.template` | Sの不活性な原稿 |
| `starter/design.md.template` | 評価観点と停止条件のワークシート |
| `starter/matrix.md.template` | 4セルの観察記録 |

正規のソース基準は、公開された上流テンプレート `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c` です。次の3件は、現在のランタイムワークスペースにあるパスから読みます。

- `OrderImportService.importDraft/replay`
- `OrderGroup.canonicalHash`
- `OrderImportPostgresTest.groupedMainImportUsesCorePricingAndNeverApprovesAndReplaysCanonically`

正確なパスと、上流テンプレート上のSHA-256は `starter/source-packet.json.template` にあります。GitHubテンプレートから作成したワークスペースは独自の履歴を持つため、ローカルHEADが上流テンプレートのリビジョンと一致する必要はありません。HEADを合わせるための `checkout` や `reset` は行わず、ワークスペースのソースが上流のハッシュと異なる場合は差分として記録します。テストは定義だけを読み、実行済みとは扱いません。`operations-note.json.template` は `SYNTHETIC_TRAINING_ONLY` の架空資料であり、実際の障害履歴や社内規約ではありません。

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/request.txt.template`、`starter/source-packet.json.template`、`starter/operations-note.json.template` を読み、列挙された3つのパスをランタイムワークスペースで確認します。ローカルHEADの一致は確認条件にしません。
3. I / Sのひな型とdesign / matrixを、未保存バッファまたは個人用の作業メモにコピーします。
4. `.template` を `.github/copilot-instructions.md`、Skillディレクトリ、その他の有効なパスへ移動しません。
5. ソースを参照できない場合は、合成運用メモ内のコードから得たスナップショットを代替手段とし、ソース本文を確認していないことを明記します。

## 試してみる

1. Iには、事実・推論・unknownの分離、パス / シンボルへの根拠付け、テスト定義と実行の区別など、他の作業にも再利用できる短い原則だけを書きます。
2. Sには、ランタイムワークスペースの3つのソースを読む順序、上流テンプレートのリビジョンの位置付け、同じ運用メモの扱い、引用、unknown、停止条件、出力形式を書きます。Sだけで完結する業務回答は埋め込みません。
3. `starter/design.md.template` に、I / Sの凍結版、共通入力、事前評価の観点、4セルの順序、停止条件を書きます。
4. `starter/matrix.md.template` に、4セルで何を同じにするかを記入します。
5. 実機を使わない場合は、各セルのpresence以外を `unobserved` とし、予想を観測結果として書きません。

## 任意: 比較する

許可された使い捨ての検証用リポジトリ / ワークスペースでのみ、4つの新しい会話を使って手動で確認します。この教材リポジトリには、有効なカスタマイズファイルを作りません。

1. 00: I なし、S なし。
2. 10: 凍結した I だけ。
3. 01: 凍結した S だけ。
4. 11: 同じ I と同じ S。

すべてのセルで、ソース、運用メモの全文、リクエスト、モデル、effort、利用可能なツール、approvalをそろえます。00にはI / Sを手動で貼り付けず、Skillが検出されなかった結果もそのまま残します。回答は事前に決めた観点で読み、長さや引用マーカーの数だけを改善指標にしません。

## 確認ポイント

- I は 10 / 11、S は 01 / 11 で同じ内容か。
- 4セルが欠落・重複していないか。
- ソース、メモ、リクエスト、モデル、ツールをそろえたか。
- 上流テンプレートのリビジョンと、ランタイムワークスペースのローカルHEADを同一視していないか。
- presence、discovery、loading、usage、effect を分けたか。
- テストの定義と実行、合成した運用と実際の履歴を区別したか。
- `equal`、`worse`、未利用、追加不要を捨てていないか。
- 途中で原稿や評価観点を変えた場合、以前の4セルと混ぜていないか。

## 発展

- [四機構を一つずつ外す](optional/ablation-preparation.md) — I / Skill / Custom Agent / MCPの `full` 構成から1つずつ外す補助設計。
- [Stop 通知経路を比べる](optional/hook-chain-preparation.md) — 同じ checker を未接続、手動、Stop 通知の3経路で観察する補助設計。
- 反復数を増やす場合は、順序効果、同じ人への影響の持ち越し（carryover）、評価者のブラインド化を別途設計する。

## 制約・代替手段・安全

- このリポジトリのサンプルは、すべて不活性な `.template` です。有効なInstructions、Skill、Agent、MCP、Hookは追加しません。
- Java、DB、テスト、設定、外部サービスを変更したり実行したりしません。
- 上流テンプレートのリビジョンに合わせるための `checkout` や `reset` は行いません。ワークスペースのソースを参照できない場合は、コードから得たスナップショットだけを使い、ソース本文は `unobserved` とします。
- Instructions / Skillを利用できない場合も、I / Sの原稿、4セル行列、共通入力、評価観点を設計できます。その場合、discovery、loading、usage、effectは `unobserved` です。
- 4セルの少数比較から一般的な因果性や教育効果を主張しません。
- 条件をそろえられない比較は `incomparable`、権限不足は `blocked`、対象機能非対応は `unsupported` と記録できます。
