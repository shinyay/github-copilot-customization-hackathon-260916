# HC-010 Agentの終了時に検査結果を通知しよう

## Challenge Story

保守の引継ぎ用メモを受け取るたびに、根拠と未確認事項が書かれているかを確認しています。
検査結果を自分で開けば十分でしょうか。それともAgentの応答が止まった時に知らせてもらう方が助かるでしょうか。
通知が増えるだけだったり、「まだ検査していない」を「問題なし」と読み違えたりすると、かえって困ります。

このChallengeでは、**同じ形式検査の結果を、誰に、いつ、どう伝えるか**を設計します。
通知を動かすことや合格するまで書き直すことが目標ではありません。
このページ、Pack、自分の固定Runtimeだけで始められます。過去のLAB・HC、Skill、設定、回答は不要です。

## この機能とは

Hookは、Agentが決まった時点に来たとき、普通のプログラムを呼ぶ接続です。
Instructionsの「確認してね」という自然言語の依頼とは異なり、呼出しの時点と入出力を決めます。
この課題の **Stopは今のAgentの応答が止まる時**であり、セッションや会話、ウィンドウを閉じる時ではありません。

例えば「根拠を書く節はあるが、未確認事項を書く節がない」という同じ検査結果を考えます。
手動案は担当者が結果票を開きます。通知案は応答停止時に「形式の不足。内容の正しさは未評価」と短く知らせます。
これは説明用の小例で、配布adapterがその日本語を返したという観測ではありません。
どちらも検査項目や草稿を変えず、通知後に人が読むかどうかを決めます。

配布checkerはコードの意味ではなく、fenced code block外の `## Evidence` と `## Unknowns` が
各1回あり、本文が空でないか等を調べます。adapterは**同じchecker**を呼び、
`continue: true` と `systemMessage` のnonblocking通知を返します。
終了を妨げず、自動修正、新しいAIターンの要求、合格までの反復・ループは行いません。

共通出力の `continue` は既定でtrueで、falseはセッションを停止します。`systemMessage` は警告を伝える欄です。
Hookプロセスのexit 0はstdoutをJSONとして解釈する契約、exit 2はblockingであり、後述する内部checkerのexitとは別です。
Stopの `hookSpecificOutput` 内の `decision: "block"` は追加ターンにつながるため、
この通知専用adapterはそれを出力せず、明示的な `continue: true` を維持します。

参照先は [VS Code Agent hooks](https://code.visualstudio.com/docs/agent-customization/hooks) と
[Hooks reference — Stop](https://code.visualstudio.com/docs/agents/reference/hooks-reference#_stop) です。
公式資料の確認日は**2026-09-15**（制作側で再取得）です。Stopの時点は概要のイベント表の略記ではなく、
詳細referenceの「current agent execution stops」で判断します。セッションの停止や非アクティブ化を示すものではありません。
文書確認と制作者の合成stdinテスト、実Stopの観測を分けます。製品全体の入力schema適合や、
現行client・別harnessでの実行成功を確認したという意味ではありません。

再確認した資料でもHooksはPreviewです。実際の組織ポリシーとextension host OSは任意ガイドで別に確認し、
本編では有効化を要求しません。Web表示からJSONの入れ子を推測せず、構文は同梱の原本テンプレートを参照します。

## 向いていること / 向いていないこと

向いているのは、同じ検査を忘れず確認したい場面や、未検査と形式違反を読み分けたい引継ぎです。
受け手、確認時点、通知を見送る基準を言葉にできることが大切です。
小さなメモをたまに読むだけなら、手動checklistの方が静かで分かりやすいかもしれません。

Hookは業務説明の正解判定、アプリの安全性保証、権限付与、検査項目の自動追加の代わりではありません。
形式に合格しても内容がsourceに支持されるとは限りません。通知が返っても実画面に表示された証拠にはなりません。
本編ではPreToolUse、agent-scoped hooks、実アプリ・DB、ネットワーク接続を試しません。

## Starter Kit

準備するのはGit、Node.js 22以降、Hubと自分の非公開Runtimeへの通常のアクセス、
Markdown・JSONを編集できる道具です。本編は読解と不活性な原稿の制作で完了でき、
VS Codeの実Hook、LLM、追加extension、JDK、Maven、DBは不要です。
[Getting Started](../../docs/getting-started.md) と
[Runtime repository guide](../../docs/runtime-repository-guide.md) が共通の準備案内です。

実際に読むsourceはRuntime rootから次の**1ファイル全文**です。`Money.tax` の場所を探し、
自分の説明を支持する行と、この1ファイルだけでは確認できない点を `design.md` に残してください。
Packは完成した業務説明や正解表を渡しません。

`wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Money.java`

sourceは `shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`。
これはJava原本のcommitで、Labsのcommitではありません。Runtimeの固定515ファイルを使い、Javaを複製・改変しません。
Windowsでは同じファイルを次のように読みます。

```powershell
Get-Content .\wholesale-core\src\main\java\jp\co\tsubame\wholesale\common\Money.java
Get-FileHash .\wholesale-core\src\main\java\jp\co\tsubame\wholesale\common\Money.java -Algorithm SHA256
```

[Pack manifest](pack/manifest.json) の2条件は、同じ21個の不活性な素材を
`.hackathon/challenge/hc-010/` に受け取ります。Hubのpayloadもoverlay先も全て `.template` のままです。

| 素材 | 使い方 |
|---|---|
| `brief.md.template`、`request.txt.template` | 共通の目的・固定依頼。条件間で本文を変えない |
| `source-materials.json.template` | Labs原本のpath・commit・hash、改作理由、payloadのdigest台帳 |
| `draft-a.md.template`、`draft-b.md.template` | SYNTHETIC_TRAINING_ONLYの書式サンプル。Money.taxの解答ではない |
| `stop-inputs.json.template`、`checker-results.json.template` | 合成caseの条件と、同一helperから得たfixture-onlyの結果。実Stopログではない |
| `notification-contract.json.template`、`active.json.template`、`stop-notification.json.template` | 結果の読み方、原本selector、無効なWindows向け設定の参照資料 |
| `tools/checker.mjs.template`、`tools/hook-io.mjs.template`、`tools/stop-notify.mjs.template` | Labsの3ファイルを同じbytesで収録。本編で拡張子を外さず、実行しない |
| `design.md.template`、`manual-checklist.md.template`、`notification-policy.md.template`、`stop-output.json.template`、`stop-hook.json.template` | 自分の原稿を作るための用紙 |
| `comparison.md.template`、`recovery.md.template`、`notifications.md.template` | 3つのEvidence用紙。参加者成果物とは別のrun-state |

合成素材はSYNTHETIC_TRAINING_ONLYです。sourceKindは `baseline` ですが、全素材が業務データという意味ではありません。
Labsの由来は `shinyay/github-copilot-customization-labs@3474d21dd62bad2e594e84657dabe2eb9bb876c1`。
`LAB-10` はcheckerの原本プロトコルIDで、Hubの `HC-010` に書き換えません。

## Open Question

同じ検査結果なら、誰が、どの時点で、どんな通知を受け取ると役立つでしょうか。
手動確認のままで十分な場合や、通知が邪魔になる場合も含めて設計してください。

たとえば受け手を「メモの作者」と「次の保守担当」のどちらにするかで、必要な短さや説明が変わります。
結果を全部同じ長さで知らせるか、未検査だけ詳しくするかも選べます。
検査器を賢くするのではなく、読み違えと負担を減らす理由を考えます。

## Design Time

先に `design.md.template` を読み、受け手、手動確認の責任者・時点、結果別の説明量、
重複通知・再入をどう扱うか、通知を追加しない基準を決めます。
Money.taxを実際に読んだ範囲と、自分の確認点も記します。配布の形式サンプルを業務分析の代わりにしません。
同じ完成した設計を両条件の `participant/hc-010/design.md` に用意し、比較前に凍結します。

request、source、2草稿、selectorの契約、checker、5つの合成caseを共通にします。
設計補助にモデルを使った場合はmodel/effort、実効tools、承認方式も揃え、前条件の回答を持ち込みません。
run-id・資源場所の置換は別欄に記録します。原稿hashと実際に渡した本文の範囲は別の証拠です。
実測していない時間、クリック数、call数、token、追加AIターン数は `null` または理由付きnot-observedにします。

条件ごとに別Runtime repository、名前付きbranch、新規workspace・会話・専用profileを使います。
それでもHOME、User/組織の設定、Memoryまで消えるわけではありません。
既存設定を削除して対照を作らず、残留を記録し、揃えられなければ `incomparable` にします。

## Build

### HubでPackを用意する

次はHub checkoutで実行するコマンドです。`plan-run` は表示だけで、repository作成やHook起動を行いません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-010 --condition baseline --team team-sora --run hc010-baseline-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-010 --condition notification-design --team team-sora --run hc010-notify-01
node .\scripts\build-pack.mjs --challenge HC-010 --output .runtime/packs
```

出力先引数 `.runtime/packs` はCLIのliteralです。物理的な生成先は `.runtime\packs\hc-010-v1`。
そのdirectoryや隣のhashが既にあれば停止し、上書き・削除せず、既存版を確認するか未使用のHub checkoutでbuildします。

### 新しいRuntimeで条件を始める

条件ごとにRuntime templateから非公開repositoryを用意します。
[固定Runtime onboarding](https://github.com/shinyay/github-copilot-customization-runtime-template/blob/708449571fa41bbaf8367a6b81b7c222e30fc3ce/.hackathon/README.md)
のtemplateVersion 1を使い、root READMEのアプリ起動手順は使いません。
次は**新しいbaseline用Runtime checkout**での例です。`$Pack` は実在するPackの絶対パスに置き換えます。

```powershell
$Pack = 'C:\work\hackathon-hub\.runtime\packs\hc-010-v1'
git status --short --branch
git switch -c hc-010-baseline
node .\.hackathon\scripts\verify-template.mjs
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition baseline --run-id hc010-baseline-01
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

notification-designは別の新しいrepositoryで、branchを `hc-010-notification-design`、
conditionを `notification-design`、run-idを `hc010-notify-01` にします。
既存変更、既存run、名前の衝突、template不一致なら停止します。`branchSafe: false` なので途中でbranchを移動しません。
Hubの `--run` とRuntimeの `--run-id` は準備CLIの引数です。**checkerにはどちらも渡しません。**

### 許可された原稿だけを新規作成する

overlayの用紙を読み、下表の対応で新しいファイルを作ります。既存pathがあれば上書きせず停止してください。
各用紙の問いに自分の言葉で答えます。配布した用紙やsource自体は編集しません。

| 条件 | 用紙から作るexact path |
|---|---|
| 両方 | `design.md.template` → `participant/hc-010/design.md` |
| baselineだけ | `manual-checklist.md.template` → `participant/hc-010/manual-checklist.md` |
| notification-designだけ | `notification-policy.md.template` → `participant/hc-010/notification-policy.md` |
| notification-designだけ | `stop-output.json.template` → `participant/hc-010/stop-output.json.template` |
| notification-designだけ | `stop-hook.json.template` → `participant/hc-010/stop-hook.json.template` |

手動案では5つのcaseについて「誰が結果票のどこを読み、未検査をどう保留するか」を書きます。
通知案では同じ5つのcaseの文面と見送り方針を書き、そのうち1件の出力案をJSON用紙に記します。
`continue: true` を保ち、result/codeを隠さず、意味未評価を伝えます。これは**提案文面**であり、
既存adapterの観測出力ではありません。新しい通知エンジンを実装する課題でもありません。

Stop設定原稿は `.template` のまま読み比べます。原本Windows向けcommandを載せた文書であって、
参照先は本編の許可外であり、作成しません。checkerの追加、変更、通知からの自動修正・再試行は禁止です。
本編の `allowedMutations: []` を守り、`.github\hooks`、`.vscode`、User/Profile、
原本の `.runtime\independent-labs\lab-10` layoutをRuntimeに作りません。

### 原本の読取り契約を確認する

ここは実行手順ではなく、配布結果を読むための説明です。
原本CLIは `node <checker.mjsの実在パス>` の追加引数なしだけです。
**プロセスcwd基準**の `.runtime\independent-labs\lab-10\active.json` が
`{"lab":"LAB-10","runId":"run-01"}` を選ぶと、同cwdの
`.runtime\independent-labs\lab-10\run-01\draft.md` を読みます。草稿内run markerはありません。
selectorのrunId・directory・依頼のbinding・Evidenceの対応を点検します。
Hook入力の `cwd` fieldでこの読取り先が切り替わるとは考えません。

`--run-id` を後付けすると `uncheckable / UNEXPECTED_ARGUMENTS / exit 2` です。
selector不在、草稿不在、形式不足は別の結果です。入力32 KiB・2秒、selector 1 KiB、
草稿64 KiB、checker子process 3秒・出力8 KiBという原本の限界も読みます。
これらの実CLI検査は制作者の所有scratchで行った合成QAで、本編のRuntime操作ではありません。

## Compare

| 条件 | 同じ結果を読む方法 | 比較する設計 |
|---|---|---|
| Baseline: `baseline` | 人が固定結果票を読み、manual-checklistを使う | 担当者、確認時点、見落としやすい違い |
| Customized: `notification-design` | 同じ結果票に対して不活性なStop原稿・通知案を作る | 応答停止との対応、受け手、説明量、重複や不要の扱い |

本編の比較は**手動確認契約と通知設計**です。baselineにも同じsource・checker・十分な依頼・全caseを渡し、
材料不足で差を作りません。実Stop対手動起動、LLMの通常の欠落率、操作時間の実測比較には置き換えません。
正常な草稿とUnknowns節だけがない草稿は、同じ入力群の別caseであり、第三のconditionではありません。

| checker result / exit | 読み方 |
|---|---|
| `pass / 0` | 限定された形式検査だけに合格。Money.taxの説明の正しさは未評価 |
| `invalid / 1` | 形式違反。codeとmissingHeadingsを読む |
| `uncheckable / 2` | 検査不能。形式の合否をまだ言えない |
| `skipped / 0` | 対象未指定などによる未実施。合格ではない |

adapterのexit 0は通知を返せたことです。checkerがinvalid/uncheckableでも0になり、passではありません。
`stop_hook_active: true` は再入を避け、**checker起動前にskipped**を返します。
配布した通知の合成出力と、自分が提案した文面を別列に置きます。

`equal`、`worse`、追加カスタマイズ不要は正当な結論です。
機能が使えなければ `unsupported`、観測がなければ `not-observed`、前提が揃わなければ `incomparable`、
準備・承認で止まれば `blocked` と記録します。改善が出るまで繰り返しません。

## Evidence

3つの用紙を下記へ新規コピーして記入します。これはrun-stateで、allowedAdditionsには重複登録しません。
既存Evidenceがあれば上書きせず内容とrunを確認します。

- `comparison.md.template` → `.hackathon/evidence/hc-010/comparison.md`
- `recovery.md.template` → `.hackathon/evidence/hc-010/recovery.md`
- `notifications.md.template` → `.hackathon/evidence/hc-010/notifications.md`

自runのcondition/run ID、比較groupと相手run、source・request・checker・草稿・自分の原稿のhashを記録します。
Windowsでは例えば `Get-FileHash .\.hackathon\challenge\hc-010\draft-a.md.template -Algorithm SHA256`、
設計保存後なら `Get-FileHash .\participant\hc-010\design.md -Algorithm SHA256` で確認できます。
hash一致、実際に読んだ範囲、意味の点検は別欄です。

notificationsには5件のcase ID、selectorとrunの対応、checker result/code/exit、
adapterの合成出力/exit、手動の担当・時点、提案文面を分けて書きます。
設定発見、実イベント、通知表示、追加AIターン数は本編ではnot-observedです。
合成JSONをstdinへ入れた制作者のテストを実Stopログにしません。

recoveryは配布packetの正常→Unknowns節のみ欠落→元の全文、という**設計確認**だけでも記入できます。
自分の不活性原稿を実際に直した場合だけ、その差分・post-image・元の全bytesへの復元を記録します。
未実施のHook有効化や解除を捏造せず、配布物を変更して負例を作りません。
Runtimeの見出し・hash検査は意味の正しさを採点しません。
`runtimeBehavior` と `educationalEffect` は静的QAでは `not-observed` のままです。

## Submit

当該Runtimeの同じbranchで、原稿と3つのEvidenceを完成させてから検査・exportします。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

ひな型のまま、見出し不足、宣言外変更で拒否されたら、その理由を確認します。検査器やrun.jsonを書き換えて通しません。
各条件のRuntime PRへ、その条件で許可された原稿とEvidenceを含めます。
[共通Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) に各runのRuntime URL・PR URLを対応付け、
`Challenge-specific design` へ通知方針、追加不要の判断、比較と限界を説明します。
相手条件が未実施なら未実施と書き、一つのrunを両条件の完了と呼びません。
[Submission Guide](../../docs/submission-guide.md) に沿って秘密・実アカウント名・生transcriptを除きます。
任意ガイドは未実施でも提出でき、その記録は本編と分けます。

## Judging

見るのは、受け手と時点を選んだ理由、4種類の結果を混同しない説明、
再入時に追加確認を走らせない設計、手動案との公平な比較、未検査と負担を扱う工夫です。
通知を増やした数や「改善した」という結論だけでは加点しません。
Money.taxの自分の確認点はsourceに戻って人が確認します。形式合格を正しい業務回答へ昇格しないことも大切です。

## Bonus Mission

同じ1件の結果を、別の読み手向けにもう少し短い文へ紙上で直してみます。
何を削ると未検査を誤読されるか、あるいは通知自体を省く方がよいかを説明してください。
自分の許可された原稿内で案を記録するだけです。追加Challenge、実Hook、検査項目追加、AI反復は始めません。

## Support / Fallback

HooksやPreviewを使えなくても、固定結果票とsourceを読み、手動案と不活性通知案を比較して本編を完了できます。
sourceが読めない場合はその制限をblocked/unsupportedとして残し、回答や実観測を補いません。
通知を追加しない判断や設計だけの提出も有効です。

[Stop Previewの準備確認ガイド](optional/stop-preview.md) は任意のguide-onlyです。
閲覧は承認ではなく、core Packはactive Hookも原本 `.runtime` layoutも許可していません。
実操作には必要path・binding・停止条件を確定した別計画と別承認が必要です。
未許可、extension host OS不明、他のHook混入、selector不一致なら停止します。

終了時は記録をexportして固定baselineを確認します。本編では有効化していないのでHook解除操作はありません。
整理するのは今回の自分の追加分だけです。他人の設定、HOME、Memoryを削除せず、
広範囲のclean/reset/stashで初期化しません。
[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
