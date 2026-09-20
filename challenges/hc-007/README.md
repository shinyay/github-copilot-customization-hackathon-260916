# HC-007 調査役と検証役のAIチームを設計しよう

**言語:** **日本語** / [English](../../en/challenges/hc-007/README.md)

## シナリオ

受注承認の調査を一つの AI に任せ、そのまま自己レビューも依頼すると、最初の仮説を正当化したり、未確認事項を見落としたりすることがあります。

このシナリオでは、承認経路を追う **investigator** と、根拠の弱い主張を独立した立場で検証する **reviewer** を Custom Agent として分けます。investigator の出力は自動転送せず、人が内容と機密情報を確認してから reviewer に渡します。最後に、先へ進むか、調べ直すか、中止するかを決めるのも人です。

題材は、`OrderAction.perform` の `op=approve` 経路です。Web アクションでのロール確認、サービス側での再確認、バージョンと状態、自己承認、参照先が有効かどうかの検証、与信確認を混同せずに追います。

## この機能とは

Custom Agent は、特定の役割、利用できるツール、禁止事項、期待する出力を定義する GitHub Copilot のカスタマイズです。このシナリオでは次の 2 役を使います。

- **investigator**: ソースから事実、仮説、反証、不明点、検証方法を整理する
- **reviewer**: investigator のパケットにある各主張を `supported / contradicted / not decidable` に分類する

役割名を分けるだけでは、独立したレビューにはなりません。同じ会話履歴の中で役割だけを切り替えたり、reviewer に渡す前にパケットを修正したりすると、最初の結論へのアンカリングを減らせません。新しい会話と、人が確認した未修正のパケットを使います。

handoff を扱えるクライアントでは、Agent 定義の `send: false` により候補を表示した状態で止め、人が確認してから送信できます。handoff に対応していないクライアントでも、同じ内容を手動で受け渡せます。

## 向いていること / 向いていないこと

**向いていること**

- 調査と反証で評価軸が異なる作業
- ソースまで根拠をたどれる複数段階の調査
- handoff の前に人の確認が必要な、安全重視のワークフロー
- 不明点を無理に埋めず、最終判断を人が持つ作業

**向いていないこと**

- 単純な一問一答
- 同じ会話内で役割名だけを変える自己レビュー
- パケットを人に見せず、自動転送する処理
- AI に承認、コード変更、本番環境での操作を委ねること

## ゴール

- 2 つの Custom Agent を作業用リポジトリで有効にする
- 固定パケットを変えずに受注承認経路を調査する
- investigator の未修正パケットを人が確認してから reviewer に渡す
- reviewer が、根拠のない主張と、複数の仮説を区別できない検証方法を指摘する
- 最終判断と残った不明点を人が記録する

## 用意するもの

- Custom Agent を利用できる GitHub Copilot クライアント
- handoff を試す場合は、handoff に対応したクライアント
- 題材の Java ソースを含む作業用リポジトリ
- このディレクトリにある、無効な状態の素材

| 素材 | 用途 |
|---|---|
| [`starter/inputs/fixed-packet.md.template`](starter/inputs/fixed-packet.md.template) | すべての会話で変更しない調査依頼 |
| [`starter/customization/order-investigator.agent.md.template`](starter/customization/order-investigator.agent.md.template) | investigator の開始点 |
| [`starter/customization/order-reviewer.agent.md.template`](starter/customization/order-reviewer.agent.md.template) | reviewer の開始点 |
| [`OrderAction.java.excerpt.md.template`](starter/reference/OrderAction.java.excerpt.md.template) | Web アクションでのロール確認とサービスへのディスパッチを確認する、読み取り専用の代替資料 |
| [`OrderService.java.excerpt.md.template`](starter/reference/OrderService.java.excerpt.md.template) | サービス側の認可と業務条件を確認する、読み取り専用の代替資料 |
| [`Actor.java.excerpt.md.template`](starter/reference/Actor.java.excerpt.md.template) | ADMIN のバイパスと完全一致のロール判定を確認する、読み取り専用の代替資料 |
| [`BaseService.java.excerpt.md.template`](starter/reference/BaseService.java.excerpt.md.template) | actor が null の場合とサービス側の認可を確認する、読み取り専用の代替資料 |
| [`starter/worksheets/handoff.md.template`](starter/worksheets/handoff.md.template) | 人による確認と最終判断を記録する簡易ワークシート |

JDK、データベース、サーバーの起動は不要です。

## 準備

1. 共通の準備は [始め方](../../README.md#始め方) に従い、作業用リポジトリで行います。
2. `fixed-packet.md.template` を読み、質問、対象ソース、評価する主張を変更しないことを確認します。
3. 次の 2 ファイルを作業用リポジトリにコピーし、そのリポジトリ内でだけ `.template` を外します。

   | コピー元 | 作業用リポジトリの配置先 |
   |---|---|
   | `starter/customization/order-investigator.agent.md.template` | `.github/agents/order-investigator.agent.md` |
   | `starter/customization/order-reviewer.agent.md.template` | `.github/agents/order-reviewer.agent.md` |

4. `starter/worksheets/handoff.md.template` は、必要に応じて `notes/hc-007-handoff.md` など、自分だけが管理できる場所にコピーします。
5. 固定パケットにある 4 つのソースパスを開けることを確認します。ソースを用意できない場合は、`starter/reference/` の抜粋だけを使い、全体を確認できていないことを不明点として残します。
6. investigator 用と reviewer 用に、新しい会話を作れるようにします。

## 試してみる

1. investigator 用の新しい会話を開き、`fixed-packet.md.template` の全文をそのまま渡します。
2. investigator のパケットで、次の項目が別々の主張として扱われているか確認します。
   - `OrderAction.perform` での MANAGER の確認
   - `OrderService.approve` での再認可
   - actor が null の場合と、`Actor.require` での ADMIN のバイパス / 完全一致のロール判定
   - ロック、期待するバージョン、`SUBMITTED` 状態
   - 自己承認の制限
   - 参照先が有効かどうかの検証
   - 与信確認
3. investigator の出力を修正せずに保存します。`HUMAN HANDOFF REQUIRED` で止まり、handoff 対応クライアントでは候補が未送信のまま表示されることを確認します。
4. 人が次を確認します。
   - 対象外のソースや推測が事実に混ざっていない
   - 引用やパスが主張を支えている
   - シークレット、顧客情報、実際の注文情報が含まれていない
   - 未解決の点がパケットに残っている
5. 確認結果を handoff のワークシートに記入し、問題がなければ `Confirmed for review: yes` とします。秘匿化が必要な場合はレビューを止め、修正版を新しい入力として扱います。
6. reviewer 用の新しい会話に、固定パケットと、人が確認した investigator のパケットだけを渡します。handoff 候補を使う場合も、人が確認してから送信します。
7. reviewer の `ACCEPT / REVISE / INSUFFICIENT ENVIRONMENT` と、各主張の分類を読みます。
8. 人が `proceed / revise / stop` を選び、理由と不明点を記録します。AI の判断だけで、コード変更や承認処理には進みません。

ソースから直接分かるのは、コード上の分岐です。特定の注文を承認できるか、データベース上のバージョンや状態が何か、参照先が有効かどうかの検証や与信確認を通過するかは、静的な読解だけでは判断できません。

## 任意: 比較する

同じ固定パケット、ソース、モデル、ツールをできるだけそろえ、次の 2 通りを手動で 1 回ずつ試します。

1. 一般的なアシスタントに「調査してから自分でレビューして」と依頼する
2. investigator と新しい会話の reviewer に分け、人がパケットを確認して受け渡す

文章量ではなく、根拠のない主張、競合する仮説、不明点の保持、検証方法が複数の仮説を区別できるか、人が作業を止めるための判断材料を比べます。入力や環境をそろえられない場合は、優劣を決めません。

## 確認ポイント

- 2 役の責任と禁止事項が重複していない
- 固定パケットが途中で書き換えられていない
- investigator のパケットを後から修正していない
- handoff の前に、人が範囲、引用、機密情報を確認した
- reviewer がパケット外の事実を補っていない
- 検証方法が複数の仮説を区別できる
- ソースだけでは判断できない実行時の事実が、不明点のまま残っている
- 最終判断を人が行っている

## 発展

investigator の結論文を外し、根拠の表、不明点、検証案だけを reviewer に渡す別案を試します。通常の handoff と比べ、結論へのアンカリングが減るか、必要なコンテキストまで失われるかを観察してください。元のパケットは変更せず、別の試行として扱います。

## 制約・代替手段・安全

- Custom Agent を使えない場合は、2 つのテンプレート本文を、それぞれ新しい会話の役割プロンプトとして貼り付けます。Agent の検出やツール制限を試したことにはなりません。
- handoff 機能がない場合は、人が確認したパケットを手動でコピーします。自動転送よりも安全確認を優先します。
- 新しい会話を作れない場合は、独立レビューの効果を主張せず、役割設計の確認だけにとどめます。
- 完全なソースを読めない場合は、抜粋から分かる範囲だけを回答し、欠けている経路を不明点として残します。
- 実際の注文、データベース、サーバー、外部接続を調べたり、承認やコード変更を実行したりしません。
- シークレット、顧客情報、非公開ログをパケットに含めません。
- Agent 間の自動送信や、人が関与しない最終判断は追加しません。
