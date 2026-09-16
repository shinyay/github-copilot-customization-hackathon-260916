# HC-024 Instructions と Skill を一つずつ外して比べる

**Language:** **日本語** / [English](../../en/challenges/hc-024/README.md)

## Scenario

CSV 再送の説明を作るために Instructions と Skill を併用したところ、回答が読みやすくなりました。しかし、両方を使った1回の結果だけでは、Instructions が役立ったのか、Skill が役立ったのか、片方だけで十分だったのかは分かりません。

このシナリオでは Instructions を **I**、Skill を **S** とし、00 / 10 / 01 / 11 の4セルで一要因ずつ比較します。source、合成運用メモ、依頼、I の原稿、S の原稿を固定し、I / S の有無以外をできるだけ変えません。

## この機能とは

factorial comparison は、複数の要因を個別に on / off して、単独の差と組合せの差を見る方法です。

| cell | I | S |
|---|---:|---:|
| 00 | 0 | 0 |
| 10 | 1 | 0 |
| 01 | 0 | 1 |
| 11 | 1 | 1 |

主に `10 − 00`、`01 − 00`、`11 − 10`、`11 − 01` を読みます。少数の回答から一般的な因果関係を証明するものではありません。

また、次を一つの「成功」にまとめません。

1. 原稿が所定の場所に存在した。
2. client が候補として発見した。
3. Instructions / Skill の本文が読み込まれた。
4. source やメモが回答へ使われた。
5. 事前に決めた観点で出力が変化した。

Skill が存在しても未利用になることがあります。未利用の結果も残します。

## 向いていること

- Instructions と Skill を併用しており、片方だけで足りるか確認したい。
- 入力と原稿を固定し、on / off だけを変えられる。
- presence、discovery、loading、usage、effect を分けて観察できる。
- equal、worse、追加不要、未利用も結果として扱える。

## 向いていないこと

- 11 の回答だけで両機能の効果を主張する。
- 00 へ I / S 本文を手動で貼り、別の入力にする。
- Skill 側だけへ追加の業務知識を入れる。
- Agent、MCP、Hook、model も同時に変更する。
- 未観測の model、effort、tools、usage を既定値で補う。

## ゴール

1. 共通原則だけを持つ短い I と、再利用手順を持つ S を設計する。
2. I は 10 / 11、S は 01 / 11 で同じ内容を使う。
3. 4セルで共通にする入力、評価観点、停止条件を先に決める。
4. presence、discovery、loading、usage、effect を分けて記録する。
5. 比較できない場合や両方不要な場合も、理由付きで残す。

## 用意するもの

- GitHub Copilot Chat。実機比較をしない場合はテキストエディターだけでも構いません。
- `starter/` の不活性な教材。`.template` はこのリポジトリで有効化しません。

| ファイル | 用途 |
|---|---|
| `starter/request.txt.template` | CSV 再送を説明する固定依頼 |
| `starter/source-packet.json.template` | public upstream template、workspace の3 source、引用 ID |
| `starter/operations-note.json.template` | 全セルで共通にする合成運用メモ |
| `starter/brief.md.template` | 4セルと安全境界の要約 |
| `starter/instructions-skeleton.md.template` | I の不活性な原稿 |
| `starter/skill-skeleton.md.template` | S の不活性な原稿 |
| `starter/design.md.template` | 評価観点と停止条件の worksheet |
| `starter/matrix.md.template` | 4セルの観察記録 |

canonical な source 基準は public upstream template `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c` です。次の3件は現在の runtime workspace にある path から読みます。

- `OrderImportService.importDraft/replay`
- `OrderGroup.canonicalHash`
- `OrderImportPostgresTest.groupedMainImportUsesCorePricingAndNeverApprovesAndReplaysCanonically`

正確な path と upstream template 上の SHA-256 は `starter/source-packet.json.template` にあります。GitHub template から作った workspace は独自履歴を持つため、local HEAD が upstream template revision と一致する必要はありません。HEAD を合わせる checkout / reset は行わず、workspace source が upstream hash と異なる場合は差分として記録します。test は定義だけを読み、実行済みとは扱いません。`operations-note.json.template` は `SYNTHETIC_TRAINING_ONLY` の架空資料であり、実障害履歴や社内規約ではありません。

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/request.txt.template`、`starter/source-packet.json.template`、`starter/operations-note.json.template` を読み、列挙された3 path を runtime workspace で確認します。local HEAD の一致は確認条件にしません。
3. I / S の skeleton と design / matrix を、未保存バッファまたは個人用作業メモへコピーします。
4. `.template` を `.github/copilot-instructions.md`、Skill directory、その他の active path へ移動しません。
5. source を参照できない場合は、合成運用メモ内の code-derived snapshot を fallback とし、source 本文未確認を明記します。

## 試してみる

1. I には、事実・推論・unknown の分離、path / symbol への根拠付け、test 定義と実行の区別など、他の作業にも再利用できる短い原則だけを書きます。
2. S には、runtime workspace の3 source を読む順序、upstream template revision の位置付け、同じ運用メモの扱い、引用、unknown、停止条件、出力形式を書きます。S だけの業務回答を埋め込みません。
3. `starter/design.md.template` に、I / S の凍結版、共通入力、事前評価観点、4セルの順序、停止条件を書きます。
4. `starter/matrix.md.template` に、4セルで何を同じにするかを記入します。
5. 実機を使わない場合は、各セルの presence 以外を `unobserved` とし、予想を観測結果として書きません。

## 任意: 比較する

許可された使い捨ての検証用 repository / workspace でのみ、4つの新規会話を使って手動確認します。この教材 repository には active な customization file を作りません。

1. 00: I なし、S なし。
2. 10: 凍結した I だけ。
3. 01: 凍結した S だけ。
4. 11: 同じ I と同じ S。

全セルで source、運用メモ全文、request、model、effort、利用可能な tools、approval をそろえます。00 へ I / S を手動で貼らず、Skill が発見されなかった結果もそのまま残します。回答は事前に決めた観点で読み、長さや citation marker 数だけを改善指標にしません。

## 確認ポイント

- I は 10 / 11、S は 01 / 11 で同じ内容か。
- 4セルが欠落・重複していないか。
- source、note、request、model、tools をそろえたか。
- upstream template revision と runtime workspace の local HEAD を同一視していないか。
- presence、discovery、loading、usage、effect を分けたか。
- test 定義と test 実行、合成運用と実履歴を区別したか。
- equal、worse、未利用、追加不要を捨てていないか。
- 途中で原稿や評価観点を変えた場合、以前の4セルと混ぜていないか。

## 発展

- [四機構を一つずつ外す](optional/ablation-preparation.md) — I / Skill / Custom Agent / MCP の full 構成から1つずつ外す補助設計。
- [Stop 通知経路を比べる](optional/hook-chain-preparation.md) — 同じ checker を未接続、手動、Stop 通知の3経路で観察する補助設計。
- 反復数を増やす場合は、順序効果、同じ人の carryover、評価者の blind 化を別途設計する。

## 制約・Fallback・安全

- このリポジトリのサンプルはすべて不活性な `.template` です。active な Instructions、Skill、Agent、MCP、Hook を追加しません。
- Java、DB、test、設定、外部 service を変更・実行しません。
- upstream template revision に合わせる checkout / reset は行いません。workspace source を参照できない場合は code-derived snapshot だけを使い、source 本文は `unobserved` とします。
- Instructions / Skill を利用できない場合も、I / S の原稿、4セル行列、共通入力、評価観点を設計できます。その場合、discovery、loading、usage、effect は `unobserved` です。
- 4セルの少数比較から一般的な因果性や教育効果を主張しません。
- 条件をそろえられない比較は `incomparable`、権限不足は `blocked`、対象機能非対応は `unsupported` と記録できます。
