# HC-043 イベント駆動Agentを最小権限で動かそう

**言語:** **日本語** / [English](../../en/challenges/hc-043/README.md)

## シナリオ

Java の保守 PR が及ぼす影響の範囲を、自動で整理したいとします。PR を開いた actor、automation を作成した creator、費用を負担する主体、セッションを閲覧できる人、停止を依頼する人は、同じとは限りません。読み取りタスクにラベルの更新や push まで許可すると、不要な権限と、イベントが継続して発火する負担が生じます。

合成した automation packet と E01〜E05 のイベント列を使い、受理するイベント、許可する読み取り効果、除外する書き込み効果、出力範囲、費用負担者、停止と再開を設計します。実際の automation は登録しません。

## この機能とは

Cloud Agents Automations は、schedule や repository event をきっかけに Cloud Agent のセッションを起動する機能です。このシナリオで作るのは製品設定用の JSON / YAML ではなく、利用前に人が確認する最小権限ポリシーです。

| 項目 | 分けて確認すること |
|---|---|
| actor | イベントを起こした主体と write access |
| creator | automation を作成し、管理と費用に責任を持つ主体 |
| trigger | opened、synchronize、schedule などを受理する範囲 |
| read effects | PR の概要、diff の概要などの読み取り |
| write effects | ラベル、review の投稿、リポジトリの更新、push |
| repository visibility | private / internal、public、unknown |
| configuration visibility | automation 設定を閲覧できる範囲 |
| session visibility | 起動後のセッションを閲覧できる範囲 |
| stop/resume | 停止依頼、停止の確認、再開の判断 |
| cost owner | Actions minutes と AI credits の費用負担者 |

設定が private だからといって、セッションも private とは限りません。重複イベント、同じ head への再通知、新しい head への synchronize も別々に扱います。教材中の operation 名は学習用の分類であり、GitHub の実際のツール ID や API スキーマではありません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返し発生し、入力、出力、停止条件を限定できる読み取りタスク。
- actor、creator、閲覧範囲、費用負担者を分ける。
- 重複イベント、新しい head、creator の不在を安全に扱う。
- 全手動を維持する判断も比較する。

**向いていないこと**

- 一度きりで、人が直接読んだ方が安全なタスク。
- 読み取りタスクに、不要なラベル更新、review 投稿、commit、push を追加する。
- 費用負担者や停止担当が不明なまま継続して実行する。
- 教材用のフィールドを、製品保証や正式なスキーマとして利用する。

## ゴール

次の3つのワークシートを完成させます。

- [`automation-design.md.template`](starter/automation-design.md.template): trigger、actor、必要最小限の operation、visibility、費用
- [`event-ledger.md.template`](starter/event-ledger.md.template): E01〜E05の受理/無視/保留
- [`stop-plan.md.template`](starter/stop-plan.md.template): 上限、停止、確認、再開

不要な書き込み効果を除外し、誰が何を確認するまで実行しないかを説明できれば完了です。

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Cloud Agents Automations の利用資格や費用枠は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/automation-packet.json.template`](starter/fixtures/automation-packet.json.template) | creator、actor、visibility、operation、費用 |
| [`fixtures/event-sequence.json.template`](starter/fixtures/event-sequence.json.template) | E01〜E05 |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | 製品境界の要点 |
| [`automation-design.md.template`](starter/automation-design.md.template) | 設計ワークシート |
| [`event-ledger.md.template`](starter/event-ledger.md.template) | イベントの判断表 |
| [`stop-plan.md.template`](starter/stop-plan.md.template) | 停止・再開計画 |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。イベントを読む前に、対象製品、eligible actor、trigger、head identity、読み取り / 書き込みの分類、出力、上限、停止担当を固定します。

固定タスク:

| タスク | 状況 |
|---|---|
| E01 | private / internal、write actor、PR opened、読み取りタスク |
| E02 | non-write actor から同じ依頼 |
| E03 | public リポジトリまたはポリシーが不明 |
| E04 | 重複イベントと新しい head への synchronize |
| E05 | creator が不在、停止依頼、継続発火のリスク |

## 試してみる

1. `automation-packet` から actor、creator、visibility、billing、operation の分類を読みます。
2. `automation-design.md.template` に、accepted repository、event filter、actor rule、head/staleness rule を書きます。
3. operation ごとに、needed / not needed とその理由を書きます。
   - read-pr-summary
   - read-diff-summary
   - save-analysis-output
   - update-label
   - post-review
   - push-commit
4. configuration visibility と session visibility を別々に記録します。
5. E01〜E05 を `event-ledger.md.template` で、受理、無視、保留、停止に分類します。
6. duplicate key、head の更新、古い出力を使わない条件を決めます。
7. `stop-plan.md.template` に、回数、時間、費用、停止依頼の経路、停止の確認、再開条件を書きます。
8. creator やポリシーが不明な場合は、受理範囲を広げないようにします。

## 任意: 比較する

最初に「PR を自動で要約する」だけの短い案を作り、その後、最小権限のワークシートで見直します。自動化率ではなく、不要な書き込み効果、head の古さ、visibility の誤解、停止責任、人の負担を比較します。

## 確認ポイント

- actor、creator、費用負担者、閲覧者、停止担当を分けている。
- 読み取りタスクに不要な書き込み効果を許していない。
- configuration visibility を session visibility の判断に流用していない。
- 重複イベントと新しい head を区別している。
- non-write actor や unknown のポリシーを自動的に許可していない。
- 教材用の operation を、実際のツール ID や製品保証と見なしていない。
- 全手動、追加不要、停止も有効な結論にしている。

## 発展

- E04 について、同じ head の再通知を再利用する案と、常に再評価する案を比較する。
- 実際の automation を観察する場合は、[Event trigger の限定観測](optional/event-trigger.md) を参照する。

## 制約・代替手段・安全

- 本編では、automation の登録、schedule、イベントの発火、ラベルの更新、review の投稿、リポジトリの更新、commit、push を行わない。
- 実際のポリシー、利用資格、billing、stop/resume は、確認するまで未観測とする。
- public または unknown の対象を、private / internal と同じ扱いにしない。
- 費用上限、停止担当、session visibility が不明なら停止する。
- Cloud を利用できなくても、合成パケットとワークシートだけで完了できる。
