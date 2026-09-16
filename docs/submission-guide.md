# Submission Guide

提出は **Runtime Pull Request + Hub Challenge Result Issue** の2点です。

## Runtime Pull Request

Pull Requestには次を含めます。

- Challenge ID、team、run ID
- ChallengeページのOpen Questionへの回答
- 選択したCustomization、選んだ理由、却下した代替案
- 変更したCustomization、code、checklist
- 固定入力と第三者が追試できる再現手順
- Baseline evidenceとCustomized evidenceの対応する比較
- `improved` だけでなく、`equal`、`worse`、`incomparable`、`blocked`、`unsupported`、観測できなかった項目（`not-observed`）を含む判断根拠
- 失敗、制限、unknown、環境差
- 再利用するときの適用範囲と注意点

Challenge evidenceは `.hackathon/evidence/hc-xxx/**` に作ります。Runtime exporterは許可されたfileだけを、source path hash由来のflatな不活性名へ変換します。dot-directoryをmirrorせず、secretやraw logをexport対象にしません。

Customizationを有効化したファイルはRuntimeだけに置きます。Hubへ有効なCustomizationをコピーしないでください。

Evidenceは必要部分へ絞り、secret、token、credential value、顧客データ、private source、raw log、実名、連絡先、個人home pathを除去します。private linkを審査者が開けない場合は、機密を含まないredacted summary、実行条件、観測結果を併記します。

## Hub Issue

[Challenge Result Issue Form](../.github/ISSUE_TEMPLATE/challenge-result.yml) で以下を記録します。

- Challenge ID、participant/team、run ID
- 比較したexact condition IDと、それぞれのRuntime repository / PR
- primary Runtime repository URL / Pull Request URLと、conditionごとの追加URL mapping
- client / host / OS / channel
- model / effort / tools（分からなければ `unknown`）
- 機能をどう理解したか
- problemとhypothesis
- ChallengeページのOpen Questionへの回答
- 選択したCustomization、理由、却下した代替案
- Baseline / Customized evidence
- outcome（`improved` 以外の結果も隠さない）
- failure / limit / unknown / not-observed
- 再現手順
- reusability
- privacy / safety確認

Formは本編・任意経路に共通の**1つだけ**です。`Challenge-specific design` には引き続き自由記述で設計判断を残します。
本編のconditions、run、Baseline / Customized、Outcomeは本編だけの記録です。
Runtime repository URLまたはPull Request URLを作成できなかった場合は `N/A` とし、`Failures + unknowns` に理由を書きます。

### OPTIONAL guide / activity record

任意欄はすべて未入力・未実施のまま提出できます。追加資格・権限がないことを本編の不成立へ読み替えません。

| 任意欄 | 記録する内容 |
|---|---|
| `OPTIONAL guide route` | 登録済みのroute IDとガイドへのリンク |
| `OPTIONAL activity status` | `unperformed`、`guide-only`、`blocked`、`live-attempted`。最後も成功判定ではない |
| `OPTIONAL separate run` | 別途承認された実機試行だけの独立run ID、承認scope、環境、安全なリンク。未実施なら空またはN/A |
| `OPTIONAL evidence` | ガイド・設計メモと実際の観測を区別した最小限のredacted記録 |
| `OPTIONAL unperformed / blocked reason` | 未実施手順、未確認環境・資格、未取得承認、既知のRuntime制約 |

ガイドを読んだだけで架空のrunやEvidenceを作らないでください。任意の記録は本編の改善、必須達成、Runtime検証成功には数えません。
これらの欄は実機操作を許可したり、Runtime v1の未対応capabilityを解除したりするものではありません。
Hubが提供するのは登録済みガイドと準備確認までで、任意実機の実行支援は別の将来フェーズです。

## Outcomes

| Outcome | 使う場面 |
|---|---|
| `improved` | 事前に決めた評価軸でCustomizedが改善 |
| `equal` | 意味のある差を観測できない |
| `worse` | Customizedが正確性、速度、説明可能性などを悪化 |
| `incomparable` | 条件差が大きく、公平な比較を主張できない |
| `blocked` | 権限、環境、依存関係などで実行まで到達できない |
| `unsupported` | client / host / channelが対象機能を提供していない |

否定的、同等、未観測、停止、未対応の結果も、条件とEvidenceが明確なら価値のある提出です。成功例だけを選んだり、`equal`、`worse`、`blocked`、`unsupported`、`not-observed` を隠したりしないでください。

## Schemaと検証責任

[`schemas/hub-result-draft.schema.json`](../schemas/hub-result-draft.schema.json) は、将来のHub集約payloadを検討するための
**非規範（non-normative）草案**です。以前の `submission.schema.json` から用途が分かる名前へ変更しました。
`participantTeam`、Runtime/PR URL、Baseline/Customized本文、outcome、`totalArtifactBytes`、独自artifact object等を持ちますが、
Runtimeがexportする `submission/submission.json` の形式ではありません。

`scripts/lib/submission.mjs` の `validateSubmissionArtifacts()` は、この草案のartifact配列と合計bytesだけを検査する限定helperです。
内容bytesを渡したartifactだけはdigest/byteLengthも照合しますが、未提供のbytesを確認したことにはなりません。
利用箇所はartifact単体の回帰testsであり、Issue全体・草案全体・Runtime bundleを検証するentrypointではありません。
repository検査はschemaのdialectを確認するだけで、提出文書の全体schema検証を実行したことにはなりません。

Hubにbundle upload、ingestion CLI/API、自動正規化・集計serviceはありません。
現在の提出入口は共通Issue FormとRuntime PRのままです。Runtime bundleの生成・検証はRuntimeの既存実装が担当し、
静的な `runtimeBehavior` / `educationalEffect` は `not-observed` を維持します。

## Privacy and redaction

URLが非公開リポジトリを指す場合でも、Hub Issue本文へsecretや非公開内容を転載しないでください。実名、email、電話番号、employee IDは不要で、public-safeなteam名またはaliasで十分です。ユーザー名、ローカルpath、token、credential value、顧客名、実データ、private source、raw logはredactし、合成例に置き換えます。アクセス権のない審査者には、機密を含まない要約EvidenceをIssueへ載せます。
