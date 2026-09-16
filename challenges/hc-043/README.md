# HC-043 イベント駆動Agentを最小権限で動かそう

## Scenario

Java保守PRの影響範囲を自動で整理したいとします。PRを開いたactor、automationを作ったcreator、費用を負担する主体、sessionを読める人、停止を依頼する人は同じとは限りません。読取taskへlabel更新やpushまで許可すると、不要な権限と継続発火の負担を持ち込みます。

合成のautomation packetとE01〜E05のevent列を使い、受理するevent、許可する読取効果、除外する書込効果、出力範囲、費用主体、停止・再開を設計します。実automationは登録しません。

## この機能とは

Cloud Agents Automationsは、scheduleやrepository eventをきっかけにCloud Agentのsessionを起動する機能です。このシナリオで作るのは製品設定JSON/YAMLではなく、利用前に人が確認するminimum-permission policyです。

| 項目 | 分けて確認すること |
|---|---|
| actor | eventを起こした主体とwrite access |
| creator | automationを作成し、管理・費用責任を持つ主体 |
| trigger | opened、synchronize、schedule等の受理範囲 |
| read effects | PR概要、diff概要等の読取 |
| write effects | label、review投稿、repository更新、push |
| repository visibility | private/internal、public、unknown |
| configuration visibility | automation設定の可視範囲 |
| session visibility | 起動後sessionを見られる範囲 |
| stop/resume | 停止依頼、停止確認、再開判断 |
| cost owner | Actions minutesとAI creditsの負担主体 |

privateな設定だからsessionもprivateとは限りません。duplicate event、同じheadの再通知、新headへのsynchronizeも別々に扱います。教材中のoperation名は学習用分類であり、GitHubの実tool IDやAPI schemaではありません。

## 向いていること / 向いていないこと

**向いていること**

- 繰り返し発生し、入力・出力・停止条件を限定できる読取task。
- actor、creator、閲覧範囲、費用主体を分ける。
- duplicate event、新head、creator不在を安全に扱う。
- 全手動を維持する判断も比較する。

**向いていないこと**

- 一度きりで人が直接読む方が安全なtask。
- 読取taskへ不要なlabel、review、commit、pushを追加する。
- 費用主体や停止担当が不明な継続実行。
- 教材fieldを製品保証や正式schemaとして利用する。

## ゴール

次の三つのworksheetを完成させます。

- [`automation-design.md.template`](starter/automation-design.md.template): trigger、actor、minimum operation、visibility、cost
- [`event-ledger.md.template`](starter/event-ledger.md.template): E01〜E05の受理/無視/保留
- [`stop-plan.md.template`](starter/stop-plan.md.template): 上限、停止、確認、再開

不要なwrite効果を除外し、誰が何を確認するまで実行しないかを説明できれば完了です。

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- Cloud Agents Automationsの利用資格や費用枠は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`fixtures/automation-packet.json.template`](starter/fixtures/automation-packet.json.template) | creator、actor、visibility、operation、費用 |
| [`fixtures/event-sequence.json.template`](starter/fixtures/event-sequence.json.template) | E01〜E05 |
| [`reference/reference-notes.md.template`](starter/reference/reference-notes.md.template) | 製品境界の要点 |
| [`automation-design.md.template`](starter/automation-design.md.template) | 設計worksheet |
| [`event-ledger.md.template`](starter/event-ledger.md.template) | event判断表 |
| [`stop-plan.md.template`](starter/stop-plan.md.template) | 停止・再開計画 |

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。eventを読む前に、対象製品、eligible actor、trigger、head identity、read/write分類、出力、上限、停止担当を固定します。

固定task:

| task | 状況 |
|---|---|
| E01 | private/internal、write actor、PR opened、読取task |
| E02 | non-write actorから同じ依頼 |
| E03 | public repositoryまたはpolicy不明 |
| E04 | duplicate eventと新headへのsynchronize |
| E05 | creator不在、停止依頼、継続発火リスク |

## 試してみる

1. `automation-packet` からactor、creator、visibility、billing、operation分類を読む。
2. `automation-design.md.template` へaccepted repository、event filter、actor rule、head/staleness ruleを書く。
3. operationごとにneeded/not neededと理由を書く。
   - read-pr-summary
   - read-diff-summary
   - save-analysis-output
   - update-label
   - post-review
   - push-commit
4. configuration visibilityとsession visibilityを別々に記録する。
5. E01〜E05を `event-ledger.md.template` で受理、無視、保留、停止に分類する。
6. duplicate key、head更新、古い出力を使わない条件を決める。
7. `stop-plan.md.template` に回数、時間、費用、停止route、停止確認、再開条件を書く。
8. creatorやpolicyが不明な場合に受理範囲を広げない。

## 任意: 比較する

最初に「PRを自動要約する」だけの短い案を作り、その後minimum-permission worksheetで見直します。自動化率ではなく、不要なwrite効果、headの古さ、visibilityの誤解、停止責任、人的負担を比較します。

## 確認ポイント

- actor、creator、費用主体、閲覧者、停止担当を分けている。
- 読取taskへ不要なwrite効果を許していない。
- configuration visibilityをsession visibilityへ流用していない。
- duplicate eventとnew headを区別している。
- non-write actorやunknown policyを自動的に許可していない。
- 教材operationを実tool IDや製品保証と呼んでいない。
- 全手動、追加不要、停止も有効な結論にしている。

## 発展

- E04について、同じheadの再通知を再利用する案と常に再評価する案を比較する。
- 実automationを観察する場合は [Event triggerの限定観測](optional/event-trigger.md) を参照する。

## 制約・Fallback・安全

- 本編ではautomation登録、schedule、event発火、label、review投稿、repository更新、commit、pushを行わない。
- 実policy、資格、billing、stop/resumeは確認するまで未観測。
- public/unknownな対象をprivate/internalと同じ扱いにしない。
- 費用上限、停止担当、session visibilityが不明なら停止する。
- Cloudを利用できなくても、合成packetとworksheetだけで完了できる。
