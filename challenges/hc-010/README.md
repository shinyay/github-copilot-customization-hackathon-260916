# HC-010 Agentの終了時に検査結果を通知しよう

**Language:** **日本語** / [English](../../en/challenges/hc-010/README.md)

## Scenario

保守引継ぎメモに、根拠と未確認事項が書かれているかを毎回確認します。結果票を担当者が開く方法と、Agentの応答が止まる時に短い通知を出す方法では、どちらが読み違えや見落としを減らせるでしょうか。

このシナリオでは、同じ形式検査を使った**手動確認の契約**と**nonblockingなStop通知の設計**を比べます。通知の実有効化や自動修正は必須ではありません。

## この機能とは

Agent Hooksは、Agentが特定の時点に到達した時に通常のプログラムを呼び出す仕組みです。ここで扱うStopは、現在のAgent実行が止まる時であり、会話・ウィンドウ・セッションを閉じる時ではありません。

同梱checkerはMarkdownの意味を評価せず、fenced code block外に次の見出しが各1回あり、本文が空でないことだけを確認します。

- `## Evidence`
- `## Unknowns`

結果は `pass`、`invalid`、`uncheckable`、`skipped` を区別します。checkerの終了値は順に0、1、2、0です。Stop adapterは結果を `systemMessage` に載せ、常に `continue: true` を返します。adapterが正常に通知を返したことと、checkerが `pass` したことは別です。

## 向いていること / 向いていないこと

**向いていること**

- 定型メモの確認忘れを減らす
- 未検査・形式違反・合格を短い文で区別する
- 通知の受け手、時点、重複時の扱いを明文化する

**向いていないこと**

- 業務内容やコードの正しさを保証する
- Hookから自動修正や追加のAIターンを繰り返す
- 権限付与、外部サービス接続、アプリやDBの検証を行う
- 小さなメモに不要な通知を増やす

## ゴール

1. 固定sourceと合成fixtureの役割を分ける。
2. 四つの結果を誤読しない手動確認手順を作る。
3. 同じ結果を伝えるStop通知方針と、`continue: true` の出力案を作る。
4. 通知を追加しない方がよい場合も含めて判断する。

## 用意するもの

- MarkdownとJSONを編集できる環境
- helperを試す場合はNode.js 22以降
- 公開Runtime templateから作成した作業用repositoryと、そこに含まれる次のsource

```text
upstream template: shinyay/github-copilot-customization-runtime-template
upstream revision: 8f0b3aa25c4f33facdea691642c2f1cb3901391c
runtime workspace path: wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java
symbol: Money.tax
```

upstream revisionはsourceの出所を示す値です。**Use this template** で作った作業用repositoryは
新しいGit履歴を持つため、local `HEAD` がこの値と一致することは要求しません。

## 準備

共通の開始手順は[リポジトリREADMEの「始め方」](../../README.md#始め方)を参照してください。

`starter/` には、固定依頼、合成草稿、結果fixture、不活性なHook設定例、helper、記入用worksheetがあります。`.template` は配布原稿であり、このrepositoryでは有効化しません。

helperを実行してみる場合は、別の使い捨て作業場所へ次の形で**コピー**し、コピー側だけ `.template` を外します。

```text
manual\hc-010\
├─ draft.md
└─ tools\
   ├─ checker.mjs
   ├─ hook-io.mjs
   └─ stop-notify.mjs
```

`draft.md` には `starter\fixtures\draft-complete.md.template` または
`starter\fixtures\draft-missing-unknowns.md.template` の内容を使えます。

## 試してみる

1. `starter\brief.md.template` と `starter\request.txt.template` を読む。
2. 可能ならruntime workspaceにある `Money.java` 全文から `Money.tax` を読み、支持される説明と未確認事項を `starter\worksheets\design.md.template` の作業コピーへ記録する。sourceが変更されている場合はupstream revisionと同一だと仮定しない。
3. 二つの合成草稿と `starter\fixtures\checker-results.json.template` を照合し、`pass` が形式だけの判定であることを確認する。
4. helperをコピーした場合は、作業場所のrootから次を試す。

   ```powershell
   node .\manual\hc-010\tools\checker.mjs .\manual\hc-010\draft.md
   '{"hook_event_name":"Stop","stop_hook_active":false}' |
     node .\manual\hc-010\tools\stop-notify.mjs
   ```

5. `manual-checklist.md.template` の作業コピーへ、人が結果を読む担当・時点・保留方法を書く。
6. `notification-policy.md.template` の作業コピーへ、受け手、文量、重複・再入、通知を見送る基準を書く。
7. `stop-output.json.template` を参考に、結果と「意味は未評価」を失わない通知文を1件作る。

## 任意: 比較する

`starter\worksheets\comparison.md.template` を使い、同じsource・草稿・結果に対する手動確認と通知設計だけを比較します。通知側だけ説明を増やしたり、良い結果が出るまで設計を変えたりしません。

## 確認ポイント

- `pass / 0` は限定された形式検査だけの合格になっているか
- `invalid / 1` と `uncheckable / 2` を「問題なし」にしていないか
- `stop_hook_active: true` ではcheckerを再実行せず `skipped` にしているか
- adapterの成功とcheckerの成功を分けているか
- `continue: true` を保ち、自動修正や追加ターンを要求していないか
- 固定sourceから確認できない内容を補っていないか

## 発展

実際のStop Hookを安全に観察したい場合は、[Stop Previewの補足ガイド](optional/stop-preview.md)を参照してください。専用の使い捨てworkspace、製品対応、組織ポリシー、解除方法を確認してから進めます。

## 制約・Fallback・安全

- 合成草稿と固定結果は `SYNTHETIC_TRAINING_ONLY` であり、実際のStop通知やLLM出力ではありません。
- checkerは入力Markdownの意味、`Money.tax` の正しさ、アプリやDBの状態を評価しません。
- helperはHook入力32 KiB・読取り2秒、草稿64 KiB、checker子process 3秒・出力8 KiBを上限にします。
- helperは作業場所の外、symbolic link、通常ファイルでない対象を拒否します。
- このrepositoryの `*.template` をactiveなHook設定へ変更しません。
- Hooksを利用できない場合でも、固定結果を使った手動確認と通知文の紙上設計で完了できます。
- 固定sourceを読めない場合は、合成fixtureの形式検査だけを扱い、コードの意味は未確認と明記します。
