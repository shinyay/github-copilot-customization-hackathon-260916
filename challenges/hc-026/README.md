# HC-026 カスタマイズを安全に段階導入しよう

## Challenge Story

チームで作ったInstructionsやSkillの原稿を共有したいものの、責任者、review状況、現在版、前版、復元先のどれかが不明なままでは、安全に展開範囲を広げられません。内容が良さそうという理由だけで配布せず、2つの架空資産を同じ台帳で監査し、「進める条件」と「止める条件」を設計します。

このChallengeはHubのページ、Starter Kit、参加者自身のRuntimeだけで完結します。元のLABや前のChallengeを実施している必要はありません。

## この機能とは

ここで扱う段階導入は、GitHubの組織管理機能そのものではなく、Customization資産を安全に共有するための運用設計です。資産ごとに、少なくとも次の情報を分けて扱います。

- owner / reviewer
- 現在版と前版
- reviewの完了状態と更新理由
- 配布を許可するtarget
- 復元に使う版と、そのbytesを確認する根拠

古い版であることと、復元に使える前版であることは同じではありません。たとえばv1がpreviousとして正しく保存され、復元対象も同じv1 bytesなら、v1という名前だけを理由に失敗とはしません。また、不明なownerを推測で補完すると追跡可能性を失うため、unknownを保持して停止できることも重要です。

## 向いていること / 向いていないこと

**向いていること**

- Instructions、Skill、Plugin原稿などを少人数から段階的に共有する計画
- 更新理由、review、復元可能性を同じ台帳で追跡すること
- 一部の資産だけ良い状態でも、集合全体のriskを隠さない判断
- 共有縮小、現状維持、追加資産不要を含む運用判断

**向いていないこと**

- 実在組織のownerや承認を架空値で埋めること
- Plugin、MCP、組織設定の権限を一括して保証すること
- 内容品質だけを見て配布可否を決めること
- 紙上の台帳完成を、実配布や復元成功の証拠にすること

## Starter Kit

[Pack manifest](pack/manifest.json) は `sourceKind: synthetic`、`sourcePaths: []` とし、すべての素材に `SYNTHETIC_TRAINING_ONLY` を表示します。Java sourceを便宜的な参照先として追加しません。

Packの不活性素材は、Runtimeへの適用時にexact `.hackathon/challenge/hc-026/starter/` 配下へmaterializeされます。これは参加者が読む固定starter locationであり、manifestの許可をfolder globへ広げる意味ではありません。

固定入力は次のとおりです。

- 資産 `reading-rules` と `analysis-package`
- 各資産のv1 / v2の不活性な原稿と、fileごとのSHA-256を記録できる資料
- owner、reviewer、現在版、前版、target、rollbackを分離した台帳
- 元の整合状態、owner欠測、現在版の不一致、未許可target、復元不成立を含む5つの中立IDの資料状態
- 全状態で欠落しない2資産の完全なinventory
- `comparison.md.template` など、答えを書き込んでいない不活性な記録用紙

Starter Kitは完成した監査表、合格ラベル、完成した共有方針を含みません。5状態のfile名から結論を推測せず、各recordのbytesと台帳項目を確認します。

## Open Question

不明な責任者や復元証拠が残るとき、共有をどこまで進め、何を条件に止めますか。少人数チームの手間と、版・責任・復元の追跡可能性をどう両立しますか。

全資産をすぐ共有することが唯一解ではありません。現状維持、対象を1資産へ縮小、review待ち、復元確認まで停止、追加資産不要も、根拠があれば有効な設計です。

## Design Time

資料状態を分類する前に、次を自分の言葉で固定します。

1. 1回のreviewで扱う単位と、owner / reviewerの責任分担
2. 更新理由に必要な情報と、欠測時の扱い
3. 共有する順序、待機条件、撤回条件
4. previousとrollback candidateを同一視しない確認方法
5. 復元bytesをどのfile hashで確認するか
6. unknownを誰が、どのEvidenceが得られるまで保持するか

台帳の整合性判定と、その後の運用判断は別欄にします。台帳上はblockedでも限定共有を検討する設計は書けますが、blockedをpassへ書き換えてはいけません。

集合のrollupは次の順序で固定します。

1. 1件でも `fail` があれば集合は `fail`
2. `fail` がなく、1件でも `blocked` があれば集合は `blocked`
3. 全件が `pass` のときだけ集合は `pass`

## Build

1. [Getting Started](../../docs/getting-started.md) に従い、conditionごとに独立したRuntime repositoryと新しいrunを用意します。
2. Hub checkoutで `baseline` と `governed-design` のdry-run計画だけを確認します。Runtime checkoutではRuntime READMEの手順でPackを適用します。Starterは `.hackathon/challenge/hc-026/starter/` に不活性に置かれます。
3. `baseline` では既存の台帳規則を改良せず、2資産×5状態の10組をすべて監査します。
4. `governed-design` では結果を見る前に自分の方針を固定し、同じ10組へ適用します。良い結論に合わせて資料、版、owner、targetを変更しません。
5. 両条件で次を作成します。
   - `participant/hc-026/asset-audit.md`
   - `participant/hc-026/restore-plan.md`
6. `governed-design` だけで `participant/hc-026/rollout-policy.md` を作成します。`baseline` には追加方針を供給しません。
7. 実 `.github/**`、組織設定、Plugin、MCP、共有repositoryは変更しません。

各成果物には全10組の行を残します。unknown、blocked、failの行を削除したり、良い資産だけを抜き出したりしません。

## Compare

| 条件 | 固定するもの | 変更するもの |
|---|---|---|
| `baseline` | 2資産、5状態、bytes、台帳項目、十分な監査依頼 | 追加の共有・更新・復元方針なし |
| `governed-design` | baselineと同じ全入力、監査依頼、rollup | 参加者が事前に固定した運用方針 |

比較表示では `baseline` を **Baseline**、`governed-design` を **Customized** と呼びます。Customizedは実承認、実配布、実復元の成功を意味せず、事前に凍結した運用方針をBaselineと同じ2資産×5状態へ適用する比較条件です。

比較では、個別状態の判定と集合rollupの両方を見ます。`governed-design` が必ず改善するとは限りません。手順が増えただけなら `not-needed`、差がなければ `equal`、不必要な共有を増やせば `worse`、入力や環境が揃わなければ `incomparable`、必要情報が得られなければ `blocked` とできます。

owner、権限、実配布、実復元を観測していない欄は `unknown` または `not-observed` のまま残します。空欄を肯定値で補完しません。

## Evidence

`.hackathon/evidence/hc-026/comparison.md` に、次の見出しをこの表記で残します。

- `Fixed task`
- `Environment`
- `Asset coverage`
- `Baseline`
- `Governed design`
- `Restore`
- `Outcome`

`Asset coverage` では、conditionごとに2資産×5状態がexactに存在することを示します。`Restore` ではpreviousの名前だけでなく、復元候補のpathとSHA-256、未確認事項を記録します。`Outcome` は個別判定、集合rollup、運用判断を分け、実配布や復元を行っていないなら `live-unobserved` と明記します。

## Submit

各conditionのRuntimeで、許可された成果物とEvidenceを完成させてからsubmitted検査とcondition別exportを実行します。`baseline` のexportには `asset-audit.md`、`restore-plan.md`、comparisonだけを含め、`governed-design` には `rollout-policy.md` も含めます。別conditionのfileを手作業で混ぜません。

Runtime Pull Requestとexport結果を対応付け、Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
へ、全10組のcoverage、集合rollup、共有を止めた条件、復元の未確認事項、outcomeを提出します。

[Submission Guide](../../docs/submission-guide.md) に従い、private owner名、local absolute path、token、raw logを公開Issueへ貼らないでください。

## Judging

- owner / reviewer不明を推測で埋めていないか
- 2資産×5状態を両conditionで全件監査したか
- previous=v1とstale current=v1を区別したか
- fail優先、次にblockedという集合rollupを保ったか
- 復元候補を実bytesの根拠へ結び付けたか
- 台帳判定と運用判断を分離したか
- 共有縮小、追加不要、equal、worseを正当な結論として扱ったか
- 紙上設計を実承認・実配布・実復元成功へ昇格させていないか

## Bonus Mission

`governed-design` の方針へ、共有後の再確認時点と撤回担当を追加します。元の10組やconditionを増やさず、追加した運用判断が台帳のpass / blocked / failを書き換えないことを確認してください。

## Support / Fallback

本編は不活性な合成資料の監査だけで完了できます。実組織への展開を検討する場合は、統合後の
[rollout-readiness optional guide](optional/rollout-readiness.md)
を使用します。このrouteは `OPTIONAL_GUIDE_ONLY`、`live-unobserved` で、`organization-rollout` capabilityは `not-checked` です。

実owner、reviewer、対象管理者、配布元版、復元先、必要権限のどれかが不明なら停止します。書込み、権限拡大、PluginやMCPの許可が必要な操作を、本編の成功条件やfallbackとして実行しません。Starterを読めない場合は `blocked`、全入力を同じbytesで維持できない場合は `incomparable` として報告します。

対象clientや機能のavailability、Preview status、対応versionを確認できない場合もoptional routeを停止し、本編の合成監査へ戻ります。
