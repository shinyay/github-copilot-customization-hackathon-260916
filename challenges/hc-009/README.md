# HC-009 CSV再送調査のプレイブックをSkillにしよう

## Challenge Story

CSV importの再実行を調査するたびに、`external_key`、payload hash、同一requestのreplay、異なるpayloadのconflict、new claimを説明し直しています。手順を忘れると、static source readingだけでdatabase stateや実際のincident historyまで断言しかねません。安全な調査playbookをSkillへまとめ、手順の再利用と自動発見の限界を比較します。

このページとRuntimeのpinned sourceだけで完結します。実CSVや過去のLABは不要です。

## この機能とは

Skillは、特定種類の作業に必要な手順、reference、scriptをひとまとまりにするCustomizationです。説明からSkillを選べるclientでは、明示的に選ぶ使い方と、taskから自動的に見つける使い方があります。

このChallengeでは、Skillの効果と、単にchecklistを渡した効果を分けるため4条件を使います。

- no Skill（manifest conditionは `baseline`）
- `manual-equivalent`
- `manual-skill`
- `auto-skill`

自動発見は環境や表現に依存します。見つからないことも正しい観測です。

## 向いていること / 向いていないこと

**向いていること**

- 手順、reference、validation scriptを一緒に再利用する作業
- 特定のtask descriptionから選べる専門playbook
- 安全なstop conditionを含むsource investigation

**向いていないこと**

- repository全体へ常時適用する短いルール
- secret、実CSV、production dataをSkillへ保存すること
- 自動発見を前提にした無人のimportやreplay
- static readingだけでdatabase stateを断言すること

## Starter Kit

[Pack manifest](pack/manifest.json) は次を `.hackathon/challenge/hc-009/**` へ不活性に配置します。

- Runtime baselineの
  `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/service/OrderImportService.java`
  と
  `wholesale-batch/src/main/java/jp/co/tsubame/wholesale/batch/OrderGroup.java`
  を指すread-only excerpt
- `SKILL.md.template` — 調査だけを行うSkill starter
- `checklist.md.template` — publicなreplay判断手順
- `check-evidence-note.mjs.template` — dependency-free Evidence format checker
- `evidence-note.md.template` — 4条件の比較表

Java sourceはRuntimeのpinned 515-file baselineにすでに存在し、Packは複製しません。

## Open Question

「Skillとして価値がある」ことを、checklistを貼るだけの効果とどう区別しますか。

- Skillが候補として発見された
- Skill bodyが読み込まれた
- checklistやsource excerptが必要時に読み込まれた
- format checkerが実際に実行された
- explicit invocationで調査手順の欠落が減った
- unsupportedなdatabase/incident claimが抑制された
- checklistだけでも同等だった

discovery、body loading、resource loading、script executionを1つの「Skill成功」にまとめません。

## Design Time

1. 固定taskを使います。

   > `OrderImportService.importDraft` と `OrderGroup.canonicalHash` を調査し、新しい`external_key`、同じhashの既存claim、異なるhashの既存claimでsourceが定義する結果を説明してください。database stateや実際のincident historyは推測せず、import/replayを実行しないでください。

2. public checklistの各項目を `pass / fail / not-observed` で採点します。
3. 4条件ごとにfresh repository、conversation、profileを用意します。
4. auto条件ではSkill名を含めないtask wordingを固定します。
5. Skill利用のEvidenceを回答前に決めます。UI表示、bodyの引用、resourceの利用、checker invocationなど、直接観測できるものを使います。

## Build

1. **Hub checkout** で次の形のdry-runをconditionごとに実行します。このscriptはRuntimeにはありません。

   ```console
   node scripts/plan-run.mjs --dry-run --challenge HC-009 --condition baseline --team team-sora --run run-01
   ```

2. **Runtime checkout** のREADMEに従ってcondition付きでPackを適用します。Starterは `.hackathon/challenge/hc-009/**` にだけ配置されます。
3. Starterからcheckerを `tools/check-evidence-note.mjs` に参加者が新規作成します。
4. `baseline`（no Skill）条件を実行します。
5. fresh conversationでchecklist本文だけを固定taskへ貼り、`manual-equivalent` を実行します。
6. Starterから `.github/skills/csv-resend-investigation/` を参加者が新規作成し、Skillを明示して `manual-skill` を実行します。
7. fresh profile / conversationでSkill名を出さず、固定taskだけを渡して `auto-skill` を実行します。
8. `.hackathon/evidence/hc-009/evidence-note.md` を作成後、format checkerを実行します。

   ```console
   node tools/check-evidence-note.mjs .hackathon/evidence/hc-009/evidence-note.md
   ```

9. auto discoveryが起きたか不明なら `unknown` とし、回答が良かったことだけを発見証拠にしません。

## Compare

| 条件 | Skill active | Skillを明示 | checklistを手で貼る | 主な観測 |
|---|---|---|---|---|
| Baseline (`baseline`) | no | no | no | 素のsource investigation |
| manual-equivalent | no | no | yes | 手順内容だけの効果 |
| manual-skill | yes | yes | no | packagingと明示呼び出し |
| auto-skill | yes | no | no | discoveryを含む実利用 |

`baseline` を **Baseline**、残る3条件を目的の異なる **Customized** として比較します。

task、source boundary、評価表、できるだけmodel / effort / toolsを同じにします。前条件の会話やprofile cacheが残れば `incomparable` の理由になります。

outcomeは `improved`、`equal`、`worse`、`incomparable`、`blocked`、`unsupported` から選びます。autoだけ失敗してmanual Skillが成功した場合は、1語に丸めず条件別の結果も書きます。

## Evidence

`.hackathon/evidence/hc-009/evidence-note.md` に次を残します。

- 4条件の分離状態とexact task
- Skill名を出したか、checklistを貼ったか
- discoveryの直接Evidence
- Skill body / resource loadingの直接Evidence
- checker commandとexit result
- new claim / matching hash replay / different hash conflictのrooted evidence
- `canonicalHash` のversion marker、common header、quantity normalization、sorted line fingerprints
- unsupported claim、condition drift、unknown
- outcome

checkerの成功はEvidence noteの必須headingだけを示し、Java behaviorやAI回答全体の正しさを保証しません。

## Submit

Runtime PRへSkill、checklist、Evidence Noteを含めます。Hubの
[Challenge Result Issue Form](../../.github/ISSUE_TEMPLATE/challenge-result.yml)
には、4条件の要約と、Skill discovery・body loading・resource loading・script executionを分けて記載します。

実CSV、注文ID、顧客情報、database output、raw logを提出しないでください。

## Judging

- Skillの対象taskとstop conditionが明確か
- exact Runtime source pathへrootedしているか
- checklistとcheckerがSkillから必要時に参照されたか
- 4条件をfreshに分離したか
- auto discoveryを推測で成功扱いしていないか
- manual-equivalentとの差を説明したか
- import、replay、外部接続をしなかったか
- equal / worse / unsupportedを含む結果を保ったか

## Bonus Mission

Evidence noteの必須headingを1つだけ削除し、checkerがそのheading名を示して失敗することを確認します。単にexit codeが非zeroであるだけでなく、mutationとerror messageが一致することをEvidenceにしてください。

## Support / Fallback

Skillをclientが認識しない場合はBaselineとmanual-equivalentを実行し、Skill directoryを読み込めなかった直接Evidenceを残します。manual promptで同じ回答が得られても、Skill discovery成功とはしません。

Node.jsが使えない場合はcheckerが `blocked` です。手でEvidence headingを確認した場合は、その限界を記録します。auto discovery非対応は `unsupported`、profile分離不能は `incomparable` とできます。
[Support and Fallbacks](../../docs/support-and-fallbacks.md) も参照してください。
