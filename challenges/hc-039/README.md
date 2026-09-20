# HC-039 組織で共有する規約の責任者を決めよう

**言語:** **日本語** / [English](../../en/challenges/hc-039/README.md)

## シナリオ

「調査結果では、根拠がある内容と未確認の内容を分ける」という規約を、複数のチームで共有するとします。ルートの `AGENTS.md`、organization Instructions、organization / enterprise の共有 profile には、似た内容を書けます。しかし、保存場所、利用する surface、閲覧範囲、編集権限、責任者、更新責任はそれぞれ異なります。

12件の責任情報をまとめた合成レコードを使い、現在確認できる事実、unknown、参加者の提案、承認待ちを分けたガバナンス設計を作ります。実際の organization 設定や共有 profile は変更しません。

## この機能とは

このシナリオでは、3つの仕組みを分けます。

- ルートの `AGENTS.md`: そのリポジトリで共有する作業指示です。組織全体の ACL や強制ポリシーではありません。
- organization Instructions: organization 設定に保存する自然言語の指示です。対応する surface、責任者の権限、リポジトリ側の Instructions との関係を確認します。
- 共有 profile: 専門的な役割の定義です。organization または enterprise のガバナンス用リポジトリで、役割、バージョン、利用範囲、保守責任を管理します。

選択規則も別です。

- 対応する GitHub surface では、該当するリポジトリの Instructions が organization Instructions より優先される場合があります。
- 同名 profile の選択には、ファイル名から `.md` / `.agent.md` を除いた名前を使います。リポジトリ、organization、enterprise の順で選ばれます。

Instructions の優先順位と profile の重複排除は、同じ処理ではありません。また、profile を利用できる範囲と、保存先のリポジトリを閲覧・編集できる範囲も異なります。

## 向いていること / 向いていないこと

**向いていること**

- 責任者、作成者、レビュー担当者、更新・廃止・復元の担当者を明示する。
- 現在の値と提案する値を分ける。
- 保存先の ACL、利用範囲、編集権限、選択されたリビジョンを別々に記録する。
- 重複を減らす、共有を見送る、追加承認まで保留するといった判断を説明する。

**向いていないこと**

- 責任者が不明な状態を、実在する人名や「管理者」で補う。
- パスだけを根拠に、ACL、利用資格、採用されたリビジョンを断定する。
- `AGENTS.md` や Instructions を ruleset やアクセス制御と見なす。
- 不活性なサンプルを、有効な共有 profile として配置する。

## ゴール

[`starter/governance-design.md.template`](starter/governance-design.md.template) の12行を埋め、各仕組みについて次を説明できるようにします。

1. 現在確認できる責任者、作成者、レビュー担当者、リビジョン
2. unknown と、その確認先
3. 提案する責任分担と必要な承認
4. 更新、廃止、復元の方法
5. Instructions の優先順位と profile の重複排除の違い

## 用意するもの

- テキストエディター
- `starter/` 以下の合成資料
- organization owner や enterprise admin の権限は本編には不要

| 素材 | 役割 |
|---|---|
| [`request.txt.template`](starter/request.txt.template) | 固定依頼 |
| [`governance-design.md.template`](starter/governance-design.md.template) | 4タスク × 3レコードのワークシート |
| [`fixtures/ownership.json.template`](starter/fixtures/ownership.json.template) | 責任情報をまとめた12件のレコード |
| [`reference/current-policy.md.template`](starter/reference/current-policy.md.template) | 現行の共有方針のスナップショット |
| [`reference/mechanism-map.md.template`](starter/reference/mechanism-map.md.template) | 保存先、surface、優先順位、重複排除の境界 |
| [`customization/shared-rules.md.template`](starter/customization/shared-rules.md.template) | 不活性な共通規約例 |
| [`customization/profile.agent.md.template`](starter/customization/profile.agent.md.template) | 不活性な専門 profile の例 |

`.template` を外さず、有効なパスへコピーしません。

## 準備

[リポジトリの始め方](../../README.md#始め方) に従ってこのディレクトリを開きます。次の4つのタスクを、それぞれ `record-01`〜`record-03` で確認します。

| タスク | 対象 |
|---|---|
| `root-rules` | リポジトリのルートに置く共有規約 |
| `org-instructions` | organization Instructions |
| `org-profile` | organization の共有 profile |
| `enterprise-profile` | enterprise の共有 profile |

`record-02` には責任情報の不足、`record-03` には選択された ref、記録されたリビジョン、コンテンツのハッシュの不整合が含まれます。タスク名やレコード名は正解ラベルではありません。

## 試してみる

1. `current-policy.md.template` と `mechanism-map.md.template` を読みます。
2. ワークシートの列を埋める前に、現在の事実と提案を混ぜないためのルールを決めます。
3. 12件のレコードについて、保存先のリポジトリとパス、利用する surface、利用範囲、ACL、責任者、作成者、レビュー担当者、選択された ref / リビジョン / ハッシュを照合します。
4. 不明な値は unknown のままにし、誰に何を確認するかを書きます。
5. 参加者の提案は別欄へ書き、承認済みの現在値として扱わないようにします。
6. Instructions ではリポジトリと organization の関係を、profile では scope 間の重複排除と選択されたリビジョンを確認します。
7. 共通規約または専門 profile の追加を検討する場合は、`customization/` の不活性なサンプルを参考にし、責任者、レビュー担当者、更新方法、復元方法を先に決めます。

## 任意: 比較する

まず `current-policy.md.template` だけを使って12件のレコードを簡潔に診断し、その後、ガバナンス用ワークシートで再評価します。unknown が減ったかではなく、根拠のない補完、責任の重複、復元できない状態が減ったかを比較します。

## 確認ポイント

- 4タスク × 3レコードをすべて扱っている。
- 責任者、作成者、レビュー担当者、ACL、利用範囲、リビジョン、ハッシュを分けている。
- unknown の現在値を提案値で上書きしていない。
- Instructions の優先順位と、同名 profile の重複排除を混同していない。
- profile の利用範囲と、保存先リポジトリの ACL を同一視していない。
- 共有しない、追加不要、保留も有効な結論にしている。

## 発展

- 同じ規約を2つの仕組みに重複して配置した場合に、差異を検出する方法と正本を設計する。
- 実際の organization 設定を観察する場合は、[Organization Instructions の限定観測](optional/org-instructions-live.md) を参照する。
- 共有 profile を観察する場合は、[共有 profile の限定観測](optional/shared-profiles-live.md) を参照する。

## 制約・代替手段・安全

- 本編では organization settings、ガバナンス用リポジトリ、ruleset、有効な profile を変更しない。
- 実在する人名、実際の organization、非公開の ACL を合成資料へ追加しない。
- 責任者、ACL、選択されたリビジョンを確認できない場合は、推測せずに停止する。
- Public Preview や利用資格は、実環境で確認するまで未観測として扱う。
- 管理権限がなくても、テキスト資料だけでガバナンス設計を完成できる。
