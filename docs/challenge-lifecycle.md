# Challenge Lifecycle

## Status

| Status | 意味 |
|---|---|
| `planned` | Catalogには登録済みだが、参加者ページとPackは未公開 |
| `published` | 参加者ページとContract v1準拠Packが揃い、実行可能 |

初期公開（foundation commit `b3cbbe2`）は公開6本・計画39本でした。これは履歴であり、固定の公開件数ではありません。
現在の公開状態はcatalogの `status` と [Challenge Index](generated/challenge-index.md) で確認します。
計画中のページやPackが存在するように見せかけません。

## Participant lifecycle

1. **Choose** — HubのIndexから公開中Challengeを選ぶ。
2. **Plan** — dry-runでcondition、分離条件、`.hackathon/challenge/**` のOverlay先を確認する。
3. **Create** — Runtime templateから専用の非公開リポジトリを作る。
4. **Baseline** — Customizationを有効化する前に固定入力を実行する。
5. **Apply** — Runtime consumerが選択conditionの `*.template` を `.hackathon/challenge/**` へ不活性に配置する。既存destinationは拒否する。
6. **Customize** — 参加者がStarterを参考に、manifestで許可された成果物を作る。active変更が不要な設計・資料比較では、許可を広げずEvidenceだけを記録する。Hub/Runtimeはactive artifactを直接生成しない。
7. **Compare** — 同じ問題と評価軸でCustomized条件を実行する。
8. **Evidence** — 良い結果だけでなく、失敗、等価、悪化、比較不能、非対応を残す。
9. **Submit** — Runtime PRとHub Issueを作る。
10. **Cleanup** — Baseline確認、提出物export、process停止、Runtime archiveを行う。

## Maintainer lifecycle

Challengeを公開するPull RequestはCatalog、ページ、Packを同時に追加し、共通Issue Formの選択肢、Pack hash一覧、生成IndexとSupport Matrixを更新します。`npm run verify` はID順序、公開物のparity、source種別、登録済み任意ガイド、必須見出し、Pack安全性、Issue Form、生成差分、リンク、dry-run、hash再現性を確認します。

運営者は [Contributing](../CONTRIBUTING.md) の `releasePlan` 順に制作し、各waveの内容確認を待ちます。
これは公開・レビューの順序で、参加者の前提・履修順・unlockではありません。各Challengeの本編は単独で完結します。
任意ガイドの閲覧・準備確認は本編の比較runとは別です。任意作業が未実施でも、本編の提出を妨げません。

Catalogに残す `sourceLab` はLabs側のChallenge authoring由来を追跡する保守用metadataです。実行sourceのprovenanceは別に
`shinyay/code-to-doc-workshop-260910@398d7d1982a1402bcdba00d6c3ded67d8d338787`
をpinします。どちらも参加者の前提条件ではなく、生成された参加者向け表にも表示しません。
