# HC-039 組織で共有する規約のownerを決めよう

**Language:** **日本語** / [English](../../en/challenges/hc-039/README.md)

## Scenario

「調査結果は根拠と未確認を分ける」という規約を複数teamで共有するとします。rootの `AGENTS.md`、organization Instructions、organization/enterprise共有profileには似た文章を書けますが、保存場所、利用surface、閲覧範囲、編集権限、owner、更新責任は同じではありません。

12件の合成ownership recordを使い、現在確認できる事実、unknown、参加者の提案、承認待ちを分けたgovernance設計を作ります。実organization設定や共有profileは変更しません。

## この機能とは

このシナリオでは三つの仕組みを分けます。

- root `AGENTS.md`: そのrepositoryで共有する作業指示。組織全体のACLや強制policyではない。
- organization Instructions: organization設定に保存する自然言語指示。対応surface、owner権限、repository側のInstructionsとの関係を確認する。
- 共有profile: 専門役の定義。organizationまたはenterpriseのgovernance repositoryで、role、版、利用範囲、保守責任を管理する。

選択規則も別です。

- 対応するGitHub surfaceでは、該当するrepository Instructionsがorganization Instructionsより優先される場合がある。
- 同名profileの選択は、ファイル名から `.md` / `.agent.md` を除いた名前を使い、repository、organization、enterpriseの順で選ばれる。

Instructionsの優先とprofileのdeduplicationは同じ処理ではありません。また、profileを利用できる範囲と、保存repositoryを閲覧・編集できる範囲も同じではありません。

## 向いていること / 向いていないこと

**向いていること**

- owner、author、reviewer、更新・廃止・復元担当を明示する。
- 現在値と提案値を分ける。
- 保存ACL、利用scope、編集権限、selected revisionを別々に記録する。
- 重複を減らす、共有を見送る、追加承認まで保留する判断を説明する。

**向いていないこと**

- owner不明を実在する人名や「管理者」で補う。
- pathだけでACL、利用資格、採用revisionを断定する。
- `AGENTS.md` やInstructionsをrulesetやアクセス制御と呼ぶ。
- 不活性sampleをactiveな共有profileとして配置する。

## ゴール

[`starter/governance-design.md.template`](starter/governance-design.md.template) の12行を埋め、各仕組みについて次を説明できるようにします。

1. 現在確認できるowner、author、reviewer、revision
2. unknownと、その確認先
3. 提案する責任分担と必要な承認
4. 更新、廃止、復元の方法
5. Instructionsの優先とprofile dedupの違い

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- organization ownerやenterprise admin権限は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`governance-design.md.template`](starter/governance-design.md.template) | 4 task × 3 recordのworksheet |
| [`fixtures/ownership.json.template`](starter/fixtures/ownership.json.template) | 12件のownership record |
| [`reference/current-policy.md.template`](starter/reference/current-policy.md.template) | 現行共有方針のsnapshot |
| [`reference/mechanism-map.md.template`](starter/reference/mechanism-map.md.template) | 保存先、surface、優先、dedupの境界 |
| [`customization/shared-rules.md.template`](starter/customization/shared-rules.md.template) | 不活性な共通規約例 |
| [`customization/profile.agent.md.template`](starter/customization/profile.agent.md.template) | 不活性な専門profile例 |

`.template` を外さず、active pathへコピーしません。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。次の四つのtaskを、それぞれ `record-01`〜`record-03` で確認します。

| task | 対象 |
|---|---|
| `root-rules` | repository rootの共有規約 |
| `org-instructions` | organization Instructions |
| `org-profile` | organization共有profile |
| `enterprise-profile` | enterprise共有profile |

`record-02` は責任情報の不足、`record-03` はselected ref、recorded revision、content hashの不整合を含みます。task名やrecord名は正解ラベルではありません。

## 試してみる

1. `current-policy.md.template` と `mechanism-map.md.template` を読む。
2. worksheetの列を埋める前に、current factとproposalを混ぜないルールを決める。
3. 12 recordについて、保存repo/path、利用surface、利用scope、ACL、owner、author、reviewer、selected ref/revision/hashを照合する。
4. 不明値はunknownのままにし、誰へ何を確認するかを書く。
5. 参加者の提案は別欄へ書き、承認済みの現在値へ変換しない。
6. Instructionsではrepository/organizationの関係を、profileではscope間dedupとselected revisionを確認する。
7. 共通規約または専門profileを追加する案を検討する場合は、`customization/` の不活性sampleを参考に、owner、reviewer、更新、復元を先に決める。

## 任意: 比較する

まず `current-policy.md.template` だけで12 recordを短く診断し、その後governance worksheetで再評価します。unknownが減ったかではなく、根拠のない補完、重複責任、復元不能が減ったかを比較します。

## 確認ポイント

- 4 task × 3 recordをすべて扱っている。
- owner、author、reviewer、ACL、利用scope、revision、hashを分けている。
- unknownな現在値と提案値を上書きしていない。
- Instructionsの優先とprofileの同名dedupを混同していない。
- profile利用scopeと保存repository ACLを同一視していない。
- 共有しない、追加不要、保留も有効な結論にしている。

## 発展

- 同じ規約を二つの仕組みに重複配置した場合のdrift検出と正本を設計する。
- 実organization設定を観察する場合は [Organization Instructionsの限定観測](optional/org-instructions-live.md) を参照する。
- 共有profileを観察する場合は [共有profileの限定観測](optional/shared-profiles-live.md) を参照する。

## 制約・Fallback・安全

- 本編ではorganization settings、governance repository、ruleset、active profileを変更しない。
- 実人名、実organization、private ACLを合成資料へ追加しない。
- owner、ACL、selected revisionを確認できない場合は推測せず停止する。
- Public Previewや利用資格は実環境で確認するまで未観測とする。
- 管理権限がなくても、テキスト資料だけでgovernance設計を完成できる。
