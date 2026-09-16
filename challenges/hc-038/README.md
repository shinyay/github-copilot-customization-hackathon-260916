# HC-038 Cloud Hookの失敗を正しく分類しよう

## Challenge Story

架空の保守チームは、Cloud Agentの作業開始時に環境を確認し、tool使用前には安全な範囲かを点検したいと考えています。しかし「checkerが正しい結果を返した」と「指定eventでcheckerが呼ばれた」は別です。さらに、拒否、command error、timeout、HTTP failureを一つの失敗へ丸めると、止めるべき場面と通常のpermission flowへ戻る場面を取り違えます。

このChallengeでは、同じchecker全文とE01〜E12の合成packetを使い、手動点検の `baseline` と不活性なHook接続案を作る `hook-design` を比べます。実Hookをdefault branchへ配置せず、Cloud Agent、Java、外部endpointを起動しません。

このページとStarter Kitだけで完結します。元のLabs、以前のChallenge、前の診断結果、既存Hook設定は必要ありません。

## この機能とは

Hookは、決められたeventで外部checkerを呼び出す仕組みです。このページでは次の二つを分けます。

- `sessionStart` はsession開始時の準備確認です。ここでcheckerが成功しても、後のすべてのtool操作を防いだことにはなりません。
- `preToolUse` はtool使用直前の判断です。Cloudの非対話環境では、ローカルの承認UIと同じ動作を仮定しません。

Cloud HookのcommandはLinux上の非対話実行を前提にし、`bash`、または対応するfallbackの `command` を使います。Windows用PowerShell原稿をそのままCloud対応済みとしません。Cloudで使う設定はdefault branchの `.github/hooks/*.json` に必要ですが、本編はそこへ配置しません。

`preToolUse` のcamelCase入力には、たとえば `sessionId`、`timestamp`、`cwd`、`toolName`、`toolArgs` があります。製品の出力fieldは `permissionDecision` と、deny時に必須の `permissionDecisionReason` です。Labs由来の合成packetにある `decision` は教材の簡略fieldであり、製品fieldではありません。

失敗の扱いも同じではありません。

- Cloudの `ask` は人の返答待ちではなくdenyとして扱われます。
- commandのcrashやnonzero exitは、stdoutにallowらしい文字があってもpreToolUseのtool callをdenyします。
- command timeout、HTTP network error、HTTP non-2xx、HTTP timeoutは文書化されたfail-openで、通常のpermission flowへ戻ります。fail-openはtool操作の完了を観測したという意味ではありません。
- 空stdout、不正JSON、明示的なallowは同じ観測ではありません。

製品説明の根拠は [Hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference) と [Use hooks with Copilot coding agent](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/use-hooks) です。文書確認日は2026-09-15です。静的原稿や合成packetは、実event発火やRuntime成功の証拠ではありません。

## 向いていること / 向いていないこと

**向いていること**

- event宣言、呼出し記録、checker結果、最終permissionの観測を分けること。
- allow / deny / ask、command error、transport failure、timeout、未呼出しを別々に扱う診断方針を作ること。
- checkerが応答しないときに、誰が追加操作を止め、何を再確認するかを設計すること。
- default branchへ有効化する前に、不活性なJSON原稿と停止条件をレビューすること。

**向いていないこと**

- 単純な語句照合checkerを、あらゆる操作を防ぐ完全な防壁と呼ぶこと。
- 手動でcheckerを読んだだけで、`sessionStart` や `preToolUse` が発火したとすること。
- timeoutやHTTP 503をcommand nonzeroと同じdenyへまとめること。
- `ask` をローカルUIの人待ちに置き換えること。
- 本編を理由にdefault branch、firewall、外部endpoint、secret、prompt全文logを変更すること。

## Starter Kit

SYNTHETIC_TRAINING_ONLY — E01〜E12、checker入力、reported event、人物、環境、結果はこのChallengeの合成資料です。packetに記録されたeventは、今回Cloudで観測したeventではありません。

source種別は `synthetic`、`sourcePaths` は `[]` です。Runtimeの515-file baselineとprovenance検査は残りますが、Javaはこの課題の判断材料に使いません。JDK、Maven、DB、アプリは起動しません。

[Pack manifest](pack/manifest.json) は、両conditionへ次の全文を同じraw bytesで渡します。

| 素材 | 役割 |
|---|---|
| `brief.md.template` | 本編が静的な診断・設計であることを確認する |
| `request.txt.template` | 両conditionに共通の依頼全文 |
| `design.md.template` | event、failure、停止、復旧を設計する |
| `comparison.md.template` | conditionごとのEvidenceひな型 |
| `input/events.json.template` | E01〜E12の12 packet |
| `input/checker.sh.template` | 両conditionで完全に同一のchecker全文 |
| `input/hook-contract.md.template` | Cloud fieldとfailure境界の短い説明 |
| `input/hooks-session-start.json.template` | `sessionStart` 接続の不活性な参考原稿 |
| `input/hooks-pre-tool.json.template` | `preToolUse` 接続の不活性な参考原稿 |

比較するtaskは `startup-check` と `tool-check` です。両conditionで同じ12 packetをすべて扱います。

| packet | task | 固定する合成観測資料 |
|---|---|---|
| E01 | `startup-check` | 宣言はあるが呼出し観測なし、checker exitは `null` |
| E02 | `startup-check` | 呼出し記録とchecker exit 0 |
| E03 | `startup-check` | 呼出し記録とchecker nonzero |
| E04 | `tool-check` | command exit 0、`permissionDecision: allow` |
| E05 | `tool-check` | command exit 0、`permissionDecision: deny` とreason |
| E06 | `tool-check` | command exit 0、`permissionDecision: ask` |
| E07 | `tool-check` | command exit 1 |
| E08 | `tool-check` | command exit 2、stdoutにはallow |
| E09 | `tool-check` | HTTP 503 |
| E10 | `tool-check` | command timeout |
| E11 | `tool-check` | HTTP timeout |
| E12 | `tool-check` | command exit 0、空stdout |

この表は入力inventoryであり、参加者用の期待分類表ではありません。どの層の何が分かるか、追加操作を止めるか、通常のpermission flowへ戻るかを参加者が根拠付きで判断します。

必要なのはGit、Node.js 22以降、bash原稿を読めるテキスト環境、Hubと非公開Runtimeを扱う通常の参加権限です。Cloud、Hook有効化、organization owner、外部network、JDKは本編に不要です。

## Open Question

**同じcheckerを手動で読む場合とeventへつなぐ設計で、何を証拠として残し、応答しないときや壊れたときに誰がどこで止めるべきでしょうか。**

- 「宣言がある」「呼ばれた」「checkerが返した」「toolが許可された」をどう分けますか。
- `sessionStart` の失敗と `preToolUse` のdenyを同じ運用へまとめてよいでしょうか。
- nonzero、timeout、HTTP failure、空stdoutを、どの資料に基づいて区別しますか。
- fail-open後に人が追加確認すべき場面と、そのまま通常判断へ戻す場面をどう決めますか。
- checkerやtransportの版を確認できないとき、どの時点で `blocked` にしますか。

すべてをHookで止めること、常にfail-closedへ変えることが唯一解ではありません。Hookを有効化しない方針にも理由を残せます。

## Design Time

1. `startup-check` と `tool-check` を混ぜず、E01〜E12を一行ずつ扱う診断表を設計します。欠落packetを作りません。
2. 各行に、declared event、reported invocation、transport、checker exit、stdout/response、製品fieldとして有効か、追加で必要なEvidence、停止担当を書きます。
3. `baseline` では同じchecker全文を人が手動点検したときに分かることと、event発火について分からないことを分けます。
4. `hook-design` ではchecker bytesを変えず、`sessionStart` と `preToolUse` の不活性なHook JSON草稿、停止・再確認・復元の手順を作ります。active pathへは置きません。
5. `permissionDecision` / `permissionDecisionReason` と教材packetの `decision` を混同しない説明を自分の言葉で残します。
6. checkerの改版、packetの変更、判定観点の変更が必要なら、新しいrevisionとして全conditionをやり直します。前条件の診断結果を次条件の入力にしません。

一度の比較で扱うchecker全文、raw bytes、E01〜E12、task、判定観点、設計revisionを先に凍結します。実Hookの呼出し回数や成功率は作りません。

## Build

### 1. Hubで計画とPackを確認する

次は **Hub checkout** のrootで実行します。dry-runとbuildはCloud AgentやHookを起動しません。

```powershell
node .\scripts\plan-run.mjs --dry-run --challenge HC-038 --condition baseline --team team-sora --run manual-check-01
node .\scripts\plan-run.mjs --dry-run --challenge HC-038 --condition hook-design --team team-sora --run hook-design-01
node .\scripts\build-pack.mjs --challenge HC-038 --output .runtime/packs
```

既存の `.runtime/packs` 出力を削除・上書きしません。生成されたPack directory、版、hashを記録し、manifest単体ではなくdirectoryをRuntimeへ渡します。

### 2. conditionごとにfresh Runtimeを用意する

[Getting Started](../../docs/getting-started.md) に従い、二つの新しい非公開Runtime repositoryを作ります。各conditionで別repository、名前付きbranch、新規workspace、新しい会話を使います。repo分離だけでUser/org設定やMemoryが消えたとは書きません。既存Hook、home、同期設定を確認できない場合は、その範囲を `not-observed` として残します。

各 **Runtime checkout** のrootで一つのconditionだけを適用します。

```powershell
$Pack = 'C:\work\hub\.runtime\packs\hc-038-v1'
$Condition = 'baseline'
$RunId = 'manual-check-01'
git status --short --branch
git switch -c "hc-038-$Condition-01"
npm run verify
node .\.hackathon\scripts\apply-pack.mjs $Pack --team team-sora --condition $Condition --run-id $RunId
```

もう一方の未使用Runtimeでは `$Condition = 'hook-design'`、`$RunId = 'hook-design-01'` とします。どちらも `$RunId` をHub dry-runの `--run` と一致させ、EvidenceとHub Issueのrun IDにも同じbindingを記録します。applyしたbranchを提出まで使い、`.hackathon/run.json` を編集しません。

### 3. 診断方針と不活性原稿だけを作る

| exact path | baseline | hook-design |
|---|---|---|
| `participant/hc-038/diagnosis-policy.md.template` | 手動点検で分かること／分からないこと、12行の診断 | 同じ12行、event接続時の責任分界と停止手順 |
| `participant/hc-038/hooks-session-start.json.template` | 作らない | 不活性な `sessionStart` JSON草稿 |
| `participant/hc-038/hooks-pre-tool.json.template` | 作らない | 不活性な `preToolUse` JSON草稿 |
| `.hackathon/evidence/hc-038/comparison.md` | 当該conditionのEvidence | 当該conditionのEvidence |

固定checkerは `.hackathon/challenge/hc-038/starter/input/checker.sh.template` のまま読みます。participant側へ別checkerを作らず、`.sh.template` の末尾を外しません。Hook JSONも `.template` のままで、`.github/hooks/`、default branch、User設定へコピーしません。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage in-progress
```

この検査が通っても、event発火、Java起動、permission enforcement、transport到達を観測したことにはなりません。

## Compare

| condition | このページでの呼び名 | 比較すること |
|---|---|---|
| `baseline` | Baseline | 同じcheckerと12 packetを手動で読み、何が診断でき、event発火の何が分からないかを記録する |
| `hook-design` | Customized | checkerを変えず、二eventへの不活性接続案と停止・再確認・復元の設計を同じ12 packetへ適用する |

固定するのはchecker全文/raw bytes、E01〜E12、task、hook contract、判定観点、設計revisionです。変更するのは起動方式と責任分界の設計だけです。Baselineを不十分な資料にせず、Customizedだけにfailureの説明を追加しません。

Baselineの手動点検はchecker logicの読解であり、`sessionStart` / `preToolUse` の呼出し証明ではありません。CustomizedのJSON草稿も宣言案であり、default branch配置、Cloud実行、permission適用の証明ではありません。

結論は `improved`、`same`（Issueでは `equal`）、`worse`、`no-addition-needed`、`not-observed`、`unsupported`、`blocked`、`incomparable` が有効です。Hook案が責任を曖昧にするなら `worse`、手動運用で十分なら `no-addition-needed`、実eventを確認できなければ `not-observed` として構いません。

## Evidence

各Runtimeの `.hackathon/evidence/hc-038/comparison.md` に、次のexact headingを残します。

- `Fixed task`
- `Environment`
- `Condition and input`
- `Design`
- `Comparison`
- `Outcome`
- `Limitations`
- `Event and checker`
- `Failure matrix`
- `Stop and recovery`

12行すべてについて、task、packet ID、素材revision/hash、declared event、reported invocation、checker exit、response、診断根拠、追加で必要な観測、停止/復旧方針を記録します。packetのreported valueと、今回の実サービス観測を別欄にしてください。

保存した `.sh.template` / JSON草稿、形式検査、packet読解、実Hook発火、実permission、tool完了を分けます。本編で確認できるのは不活性原稿の保存と合成資料の診断だけです。Cloud runtime、default branch発見、Java起動、command/HTTP実通信、tool完了、教育効果は `not-observed` です。

未呼出しをexit 0へ、timeoutをdenyへ、HTTP 503を成功/失敗の一語へ、空stdoutを明示allowへ変換しません。不明・取得失敗は0、pass、N/Aにせず、根拠がなければ `not-observed` / `incomparable` とします。

## Submit

各 **Runtime checkout** で、当該conditionのparticipant原稿とEvidenceを完成させます。

```powershell
node .\.hackathon\scripts\verify-run.mjs $Pack --stage submitted
node .\.hackathon\scripts\export-submission.mjs $Pack
```

Runtime PRには、`diagnosis-policy.md.template`、hook-designだけの二つのJSON草稿、Evidence、再現手順を含めます。active Hook、実行script、Cloud log、endpoint設定は含めません。

Hubの [共通Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml) には、Baseline / CustomizedのRuntime URLとPR、run ID、checker hash、12 packetのcoverage、failureの区別、停止・復旧設計、outcome、未観測をまとめます。`Challenge-specific design` に、どの失敗を誰が止めるかを書きます。

[Submission Guide](../../docs/submission-guide.md) に従い、prompt全文、secret、token、private URL、raw Cloud log、local絶対pathをIssueへ貼りません。静的検査の成功から `runtimeBehavior` / `educationalEffect` をpassへ変えません。

## Judging

- E01〜E12を両conditionで欠けなく扱い、checker bytesを同じにしたか。
- `sessionStart` と `preToolUse`、宣言と呼出し、checker結果とpermissionを分けたか。
- `permissionDecision` / reasonと、Labs合成packetの `decision` を混同していないか。
- `ask`、command nonzero、command timeout、HTTP failure、空stdoutを資料どおり区別したか。
- active化せず、停止・人の確認・復元の責任を具体化したか。
- `same`、`worse`、`not-observed`、`blocked` を隠さず、実Hook成功を作っていないか。

Hook原稿の行数、denyの数、すべてを止める設計、形式validatorの成功だけでは採点しません。

## Bonus Mission

E01〜E12やcheckerを変更せず、packetに「不正JSON」または「event情報欠落」が追加された場合の診断欄を紙上で一つ設計してください。既存12行の結果へ混ぜず、どの観測が不足し、誰が止めるかだけを書きます。これは新conditionや実Hook試行ではありません。

## Support / Fallback

CloudやHookの利用資格がなくても、本編はテキストエディターで完了できます。Runtimeを用意できなければ原稿をローカルに保ち、提出だけを `blocked` と分けます。checker hash、packet集合、製品fieldの根拠が固定できない場合は、期待値を補わず停止してください。

任意の [`session-start-live`](optional/session-start-live.md) と [`pre-tool-live`](optional/pre-tool-live.md) は、別承認前の準備ガイドです。どちらも本編conditionや実行許可ではなく、`live-unobserved` です。default branchのactive Hook、採用checkerの実行環境、Cloud Linux/bash、資格、変更範囲、停止・復元、限定した無害操作を事前に確認します。

JDKを前提にするなら実在確認が別に必要です。preToolUseでendpointやfirewall変更、secret、prompt全文log、破壊操作が必要なら停止します。Cloud-created branchの観測を既存Runtime runへ束ねる必要がある場合、v1のcross-branch handoffは `blocked` として扱い、`run.json` 手編集やbranch制約の偽装で回避しません。

終了時は既存Hook、User/org設定、Memory、PR履歴を削除せず、自分の不活性原稿だけを管理します。執筆根拠は固定Labs commitの [LAB-38原稿](https://github.com/shinyay/github-copilot-customization-labs/blob/3474d21dd62bad2e594e84657dabe2eb9bb876c1/docs/labs/lab-38-cloud-hooks.md) です。
