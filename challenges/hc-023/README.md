# HC-023 最小限で十分なカスタマイズを選ぼう

**言語:** **日本語** / [English](../../en/challenges/hc-023/README.md)

## シナリオ

チームにはInstructions、Prompt、Skill、Custom Agent、MCP、Pluginなど、多くの選択肢があります。問題が起きるたびに新しい仕組みを追加すると、設定や権限の確認、対応環境、更新担当が増えます。一方、繰り返す作業に何も準備しなければ、同じ説明を毎回やり直すことになります。

このシナリオでは、Java保守に関する10件の固定ケースを読み、**何を追加するかだけでなく、何を追加しないか**も設計します。機能名を当てるクイズではありません。`manual context` や追加しない選択も、条件に合えば正当です。

## この機能とは

候補と主な役割は次のとおりです。

- **Instructions**: 繰り返し使う読み方や規則。リポジトリ全体または対象パスにスコープを限定する。
- **Prompt**: 人が明示的に開始する定型依頼。利用するハーネスが対応しているか確認する。
- **Skill**: 手順と関連資料をまとめる。存在、検出、本文の利用、スクリプトの実行は別々に確認する。
- **Custom Agent**: 役割とツール宣言をまとめる。宣言と実効権限は同じではない。
- **MCP**: リソースを取得する経路。接続、server trust、content authority、call approvalを分ける。
- **Plugin**: Skillなどをバージョン付きで配る単位。個々のコンポーネントとハーネスの対応を確認する。
- **manual context**: 必要な資料を人が明示的に渡す。
- **none**: 固定依頼と既存資料だけを使い、追加のカスタマイズを作らない。

各案を次の5観点で説明します。

1. **trigger**: 1回限りか反復か、明示的に開始するか自動供給の候補か。
2. **scope**: 誰に、どのワークスペース、パス、ハーネスまで届くか。
3. **resources**: ソース、資料、チェックリスト、スクリプト、外部リソースのうち何が必要か。
4. **permissions**: 読み取りと、別途承認が必要な実行・書き込み・送信をどう分けるか。
5. **maintenance**: 所有者、更新頻度、バージョン、複製、復元、手作業の負担をどう扱うか。

## 向いていること

- 複数の仕組みが候補となり、その価値と維持費を比較したい。
- Local Agent、Agent Host、外部接続不可など利用条件が異なる。
- none、manual、カスタマイズを同じ基準で検討したい。
- 採用しない案と、条件変更時の代案も残したい。

## 向いていないこと

- ケースIDから唯一の正解となる機能を導く。
- 追加した設定数を成果として評価する。
- PromptやPluginがすべてのハーネスで使えると推測する。
- 合成された許可資料を、実際の権限付与やserver trustとみなす。
- 机上の設計を Copilot の動作確認済みと扱う。

## ゴール

1. 10件のケースすべてについて、最低2案を比較する。
2. 採用案、不採用理由、追加不要、前提、未確認を説明する。
3. 5観点を使って、最小で保守可能な案を選ぶ。
4. ハーネスや権限の重大な不一致を、文章の良さで相殺しない。
5. 条件が変わったときの代案を示す。

## 用意するもの

- テキストエディター。Copilot Chat は任意です。
- `starter/` の固定ケース、リクエスト、候補、ワークシート、補助資料。

| パス | 用途 |
|---|---|
| `starter/cases/` | case-01〜10の固定状況 |
| `starter/requests/` | 各ケースの固定依頼 |
| `starter/mechanisms.json.template` | 候補となる準備方法 |
| `starter/checklist.md.template` | 5観点のチェックリスト |
| `starter/answers.md.template` | 回答案のワークシート |
| `starter/review.md.template` | 人がレビューするためのワークシート |
| `starter/brief.json.template` | 公開された上流テンプレート、ワークスペースのソース、安全境界 |
| `starter/scope-paths.json.template` | ケースが参照する固定パス |
| `starter/resource-permission.md.template` | リソースと権限の境界 |
| `starter/harness-boundaries.md.template` | Local / Agent Host の境界 |
| `starter/fixed-review-packet.md.template` | レビューで使う固定確認項目 |
| `starter/review-role.md.template` | 読み取り専用のレビュー役を示す不活性な例 |
| `starter/operations-note.json.template` | case-06 / 08で使う合成運用メモ |
| `starter/evidence-note.txt.template` | case-04で使う短い記録用ひな型 |
| `starter/package/` | case-09で比較するv1 / v2の不活性なPlugin / Skillの例 |

正規のソース基準は、公開された上流テンプレート `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c` です。実際に読み取る際は、各ケースに列挙されたパスを現在のランタイムワークスペースから使います。GitHubテンプレートから作成したワークスペースは独自の履歴を持つため、ローカルHEADが上流テンプレートのリビジョンと一致する必要はありません。HEADを合わせるための `checkout` や `reset` は行わず、ソースが上流と異なる場合はワークスペース側の差分として記録します。ケースの状況、権限、配布計画は合成教材です。

10件のケースの要点は次のとおりです。

| ケース | 状況 |
|---|---|
| `case-01` | リポジトリ全体で繰り返す根拠整理 |
| `case-02` | Java / XML だけに必要な読み方 |
| `case-03` | 人が明示的に繰り返す固定依頼 |
| `case-04` | チェックリストと記録用ひな型を使うバッチ処理の読解 |
| `case-05` | 読み取り専用のレビュー役とツールの範囲 |
| `case-06` | 外部接続なしで、配布済み資料を使う |
| `case-07` | Agent Host 向けの再利用設計 |
| `case-08` | manual contextと将来の読み取り専用リソース経路 |
| `case-09` | 同じ Skill の v1 / v2 を版管理して配る設計 |
| `case-10` | 一回限りで、固定入力がすでに十分な作業 |

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/brief.json.template`、`starter/mechanisms.json.template` と補助資料を読み、上流テンプレートのリビジョンとランタイムワークスペースのソースを区別します。
3. `starter/answers.md.template` を未保存バッファまたは個人用作業メモへコピーします。
4. `.template` を有効なInstructions、Skill、Agent、Pluginのパスへ移動しません。
5. ケース内の「許可」「利用可能」は合成された前提であり、自分の環境に権限を付与するものではないと確認します。

## 試してみる

各 `case-01`〜`case-10` について、次の手順を繰り返します。

1. `starter/cases/case-NN.json.template`、対応する `starter/requests/case-NN.txt.template`、共通の `starter/brief.json.template` を読みます。
2. `none` と `manual-context` を除外せず、最低2つの候補を挙げる。
3. 各候補をtrigger / scope / resources / permissions / maintenanceで比較します。
4. 最小限の採用案、選ばない案の理由、追加不要の可能性、成立に必要な前提を書きます。
5. 不明なハーネス対応、ツール、権限付与、信頼、インストール状態は `unknown` のまま残します。
6. `starter/fixed-review-packet.md.template` と `starter/review.md.template` を使って自己レビューします。

ケースごとの補助資料も使います。たとえばcase-02では `scope-paths`、case-05ではレビューパケットとレビュー役、case-07ではハーネス境界、case-08では運用メモとリソース権限、case-09では `starter/package/` を参照します。

## 任意: 比較する

1つのケースを選び、最初はチェックリストを見ずに回答します。次に、新しい作業メモで `starter/checklist.md.template` を使ってもう一度回答し、抜けていた前提、不要な仕組み、permissionsやmaintenanceの説明を手作業で比較します。

これは短い自己確認です。学習効果や製品効果を証明する実験ではありません。

## 確認ポイント

- 機能名ではなく、状況との適合を説明しているか。
- 採用案と少なくとも1つの別案があるか。
- none / manual / 追加不要を同じ基準で扱っているか。
- scopeとハーネスの対応を推測していないか。
- 上流テンプレートのリビジョンと、ランタイムワークスペースのローカルHEADを同一視していないか。
- ツール宣言、実効ツール、操作権限を分けているか。
- server trust、content authority、call approval を混同していないか。
- 10件のケースに欠落や重複がないか。

## 発展

- 1つのケースで前提を1項目だけ変え、選択がどう変わるか再検討する。
- case-09のv1 / v2について、所有者、レビュアー、バージョン、復元方法だけを比較する。
- 同じ目的をmanual contextで運用した場合の手間と、カスタマイズの保守費用を見積もる。

## 制約・代替手段・安全

- この演習では、有効なInstructions、Prompt、Skill、Agent、MCP、Pluginを作成したり、インストールしたりしません。
- `starter/package/` と `starter/review-role.md.template` は、不活性な読解用サンプルです。
- スクリプト、サーバー、外部送信、User / 組織設定、Cloud操作、ソースの編集は行いません。
- 上流テンプレートのリビジョンに合わせるための `checkout` や `reset` は行いません。列挙されたパスをワークスペースから読めない場合は、ソースを `unobserved` とします。
- Prompt FilesのAgent Host対応や、Pluginコンポーネントの対応範囲を推測で広げません。
- すべてのケースを最初から閲覧できるため、未知の入力に対するブラインド評価（blind evaluation）ではありません。
- Copilot がなくても全手順をテキストエディターで実施できます。
- 前提をそろえられない比較は `incomparable`、権限不足は `blocked`、対象ハーネスが非対応の場合は `unsupported` と記録できます。
