# Getting Started

## 1. HubでChallengeを選ぶ

[Challenge Index](generated/challenge-index.md) から「公開中」のChallengeを選び、リンク先のページを最初から最後まで読みます。各ページは単独で完結しています。以前のLABを読んだり実行したりする必要はありません。

## 2. 独立したRuntimeを用意する

[`shinyay/github-copilot-customization-runtime-template`](https://github.com/shinyay/github-copilot-customization-runtime-template)
から参加者またはチーム専用の**非公開**リポジトリを作ります。Challengeごとに新しいリポジトリ、ワークスペース、会話、プロファイルを使い、前の実験の設定や会話を持ち込みません。

Hubは現在リモートリポジトリを作成しません。事前計画だけを確認できます。

```console
node scripts/plan-run.mjs --dry-run --challenge HC-001 --condition baseline --team team-sora --run run-01
```

出力は提案リポジトリ名、必要なTemplate version、condition、分離方法、`.hackathon/challenge/**` への配置予定、提出Issue metadata、未確認のCleanupを示すJSONです。ネットワーク変更やGitHub App設定は行いません。
`--route core` を明示しても同じ本編JSONです。登録済み任意ガイドの準備確認は、本編のconditionやrunとは別です。
詳しい引数・終了codeは [Runtime repository guide](runtime-repository-guide.md) を参照してください。

## 3. Baselineを先に取る

`--condition` を指定してPackを適用します。RuntimeはStarter materialを `.hackathon/challenge/**` へ不活性なまま配置します。参加者がCustomizationを有効な場所へ新規作成する前に、Challengeページで指定された固定入力を実行します。プロンプト、出力、テスト結果、所要時間、失敗、環境情報を残してください。

Baselineは「AIを使わない」こととは限りません。そのChallengeで評価したいCustomizationだけをまだ有効にしていない条件です。

## 4. Customizedを比較する

`.hackathon/challenge/**` のStarter templateを読み、ページの指示に従って、そのconditionに許可されたartifactだけを参加者自身が新規作成します。Instructionsを使う課題もあれば、activeな設定を作らず設計案や調査の分け方を比べる課題もあります。Runtimeはactive artifactを自動作成しません。同じ入力、同じ評価観点、できるだけ近いモデル・effort・tool条件で実行します。

完全に同じ条件にできなかった場合は隠さず、`incomparable` または制約付きの結果として記録します。

## 5. PRとHub Issueを提出する

RuntimeリポジトリのPull Requestに変更とEvidenceをまとめます。次にHubの
[Challenge Result Issue Form](../.github/ISSUE_TEMPLATE/challenge-result.yml)
で、比較したcondition ID、Baseline / Customized / outcome / failure / unknownを提出します。詳細は
[Submission Guide](submission-guide.md) を参照してください。

## Safety

- secret、token、個人情報、顧客データ、非公開コードを貼らない。
- スクリーンショットやログは必要部分だけにし、識別情報をredactする。
- MCP Toolやscriptは合成fixtureだけを読み、外部送信を追加しない。
- 不明な機能や環境差は推測で埋めず `unknown`、`blocked`、`unsupported` と書く。
