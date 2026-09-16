# HC-023 最小限で十分なカスタマイズを選ぶ

**Language:** **日本語** / [English](../../en/challenges/hc-023/README.md)

## Scenario

チームには Instructions、Prompt、Skill、Custom Agent、MCP、Plugin など多くの選択肢があります。困りごとごとに新しい仕組みを追加すると、設定、権限確認、対応環境、更新担当が増えます。一方、反復作業へ何も準備しないと、同じ説明を毎回やり直すことになります。

このシナリオでは、Java 保守に関する10個の固定 case を読み、**何を追加するかだけでなく、何を追加しないか**を設計します。機能名を当てるクイズではありません。manual context や追加なしも、条件に合えば正当な選択です。

## この機能とは

候補と主な役割は次のとおりです。

- **Instructions**: 繰り返し使う読み方や規則。repository 全体または対象 path に scope を絞る。
- **Prompt**: 人が明示的に開始する定型依頼。利用する harness の対応を確認する。
- **Skill**: 手順と関連資料をまとめる。存在、発見、本文利用、script 実行は別に確認する。
- **Custom Agent**: 役割と tool 宣言をまとめる。宣言と実効権限は同じではない。
- **MCP**: resource の取得経路。接続、server trust、content authority、call approval を分ける。
- **Plugin**: Skill などを版付きで配る単位。個々の component と harness の対応を確認する。
- **manual context**: 必要な資料を人が明示的に渡す。
- **none**: 固定依頼と既存資料だけを使い、追加の customization を作らない。

各案を次の5観点で説明します。

1. **trigger**: 一回限りか反復か、明示開始か自動供給候補か。
2. **scope**: 誰、どの workspace、path、harness へ届くか。
3. **resources**: source、資料、checklist、script、外部 resource の何が必要か。
4. **permissions**: 読取りと、別承認が必要な実行・書込み・送信をどう分けるか。
5. **maintenance**: 所有者、更新頻度、版、複製、復元、手動負担をどう扱うか。

## 向いていること

- 複数の仕組みが候補になり、価値と維持費を比較したい。
- Local Agent、Agent Host、外部接続不可など利用条件が異なる。
- none、manual、customization を同じ基準で検討したい。
- 採用しない案と、条件変更時の代案も残したい。

## 向いていないこと

- case ID から唯一の正解機能を引く。
- 追加した設定数を成果として評価する。
- Prompt や Plugin がすべての harness で使えると推測する。
- 合成された許可資料を実際の grant や server trust とみなす。
- 机上の設計を Copilot の動作確認済みと扱う。

## ゴール

1. 10 case すべてについて最低2案を比較する。
2. 採用案、不採用理由、追加不要、前提、未確認を説明する。
3. 5観点を使って、最小で保守可能な案を選ぶ。
4. harness や権限の重大な不一致を、文章の良さで相殺しない。
5. 条件が変わったときの代案を示す。

## 用意するもの

- テキストエディター。Copilot Chat は任意です。
- `starter/` の固定 case、request、候補、worksheet、補助資料。

| path | 用途 |
|---|---|
| `starter/cases/` | case-01〜10 の固定状況 |
| `starter/requests/` | 各 case の固定依頼 |
| `starter/mechanisms.json.template` | 候補となる準備方法 |
| `starter/checklist.md.template` | 5観点の checklist |
| `starter/answers.md.template` | 回答案 worksheet |
| `starter/review.md.template` | 人による review worksheet |
| `starter/brief.json.template` | public upstream template、workspace source、安全境界 |
| `starter/scope-paths.json.template` | case が参照する固定 path |
| `starter/resource-permission.md.template` | resource と permission の境界 |
| `starter/harness-boundaries.md.template` | Local / Agent Host の境界 |
| `starter/fixed-review-packet.md.template` | review の固定確認項目 |
| `starter/review-role.md.template` | 読取り専用 review 役の不活性な例 |
| `starter/operations-note.json.template` | case-06 / 08 で使う合成運用メモ |
| `starter/evidence-note.txt.template` | case-04 で使う短い記録ひな型 |
| `starter/package/` | case-09 で比較する v1 / v2 の不活性な Plugin / Skill 例 |

canonical な source 基準は public upstream template `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c` です。実際の読取りでは、各 case に列挙された path を現在の runtime workspace から使います。GitHub template から作った workspace は独自履歴を持つため、local HEAD が upstream template revision と一致する必要はありません。HEAD を合わせる checkout / reset は行わず、source が upstream と異なる場合は workspace 側の差分として記録します。case の状況、権限、配布計画は合成教材です。

10 case の要点は次のとおりです。

| case | 状況 |
|---|---|
| `case-01` | repository 全体で反復する根拠整理 |
| `case-02` | Java / XML だけに必要な読み方 |
| `case-03` | 人が明示的に繰り返す固定依頼 |
| `case-04` | checklist と記録ひな型を伴う batch 読解 |
| `case-05` | 読取り専用の review 役と tool 範囲 |
| `case-06` | 外部接続なしで、配布済み資料を使う |
| `case-07` | Agent Host 向けの再利用設計 |
| `case-08` | manual context と将来の read-only resource 経路 |
| `case-09` | 同じ Skill の v1 / v2 を版管理して配る設計 |
| `case-10` | 一回限りで、固定入力がすでに十分な作業 |

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/brief.json.template`、`starter/mechanisms.json.template` と補助資料を読み、upstream template revision と runtime workspace source を区別します。
3. `starter/answers.md.template` を未保存バッファまたは個人用作業メモへコピーします。
4. `.template` を active な Instructions、Skill、Agent、Plugin の path へ移動しません。
5. case 内の「許可」「利用可能」は合成された前提であり、自分の環境への権限付与ではないと確認します。

## 試してみる

各 `case-01`〜`case-10` について、次を繰り返します。

1. `starter/cases/case-NN.json.template`、対応する `starter/requests/case-NN.txt.template`、共通の `starter/brief.json.template` を読む。
2. `none` と `manual-context` を除外せず、最低2つの候補を挙げる。
3. 各候補を trigger / scope / resources / permissions / maintenance で比較する。
4. 最小の採用案、選ばない案の理由、追加不要の可能性、成立に必要な前提を書く。
5. 不明な harness 対応、tool、grant、trust、install 状態を `unknown` のまま残す。
6. `starter/fixed-review-packet.md.template` と `starter/review.md.template` で自己 review する。

case ごとの補助資料も使います。たとえば case-02 は `scope-paths`、case-05 は review packet と review role、case-07 は harness boundaries、case-08 は operations note と resource permission、case-09 は `starter/package/` を参照します。

## 任意: 比較する

1つの case を選び、最初は checklist を見ずに回答し、新しい作業メモでもう一度 `starter/checklist.md.template` を使って回答します。抜けた前提、不要な仕組み、permission や maintenance の説明を手動で比べます。

これは短い自己確認です。学習効果や製品効果を証明する実験ではありません。

## 確認ポイント

- 機能名ではなく、状況との適合を説明しているか。
- 採用案と少なくとも1つの別案があるか。
- none / manual / 追加不要を同じ基準で扱っているか。
- scope と harness の対応を推測していないか。
- upstream template revision と runtime workspace の local HEAD を同一視していないか。
- tool 宣言、実効 tool、操作 permission を分けているか。
- server trust、content authority、call approval を混同していないか。
- 10 case の欠落や重複がないか。

## 発展

- 1つの case で前提を1項目だけ変え、選択がどう変わるか再検討する。
- case-09 の v1 / v2 について、owner、reviewer、version、復元方法だけを比較する。
- 同じ目的を manual context で運用した場合の手間と、customization の保守費用を見積もる。

## 制約・Fallback・安全

- この演習は active な Instructions、Prompt、Skill、Agent、MCP、Plugin を作成・install しません。
- `starter/package/` と `starter/review-role.md.template` は不活性な読解サンプルです。
- script、server、外部送信、User / 組織設定、Cloud 操作、source 編集を行いません。
- upstream template revision に合わせるための checkout / reset は行いません。列挙 path を workspace から読めない場合は source を `unobserved` とします。
- Prompt Files の Agent Host 対応や Plugin component の対応を推測で広げません。
- すべての case が最初から閲覧できるため、未知入力に対する blind evaluation ではありません。
- Copilot がなくても全手順をテキストエディターで実施できます。
- 前提をそろえられない比較は `incomparable`、権限不足は `blocked`、対象 harness 非対応は `unsupported` と記録できます。
