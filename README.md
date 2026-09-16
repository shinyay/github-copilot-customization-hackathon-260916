# GitHub Copilot Customization Hackathon

このリポジトリは、Challengeの選択、Starter Packの配布、実行計画、提出Issue、結果集約を担う **Hub** です。実験はここでは行わず、参加者ごとに
[`shinyay/github-copilot-customization-runtime-template`](https://github.com/shinyay/github-copilot-customization-runtime-template)
から作る独立した非公開Runtimeリポジトリで行います。

## Start

1. [Getting Started](docs/getting-started.md) を読む。
2. [Challenge Index](docs/generated/challenge-index.md) からChallengeを1つ選ぶ。
3. Runtimeリポジトリを作り、`--condition` 付きで不活性Packを配置し、ページ指定のBaselineを記録する。
4. 指定されたCustomized条件を同じ入力で比較し、RuntimeのPull RequestとHubのChallenge Result Issueを提出する。資料・設計比較ではactiveな設定を作らない。

現在選べるChallengeは、catalogの公開状態から生成する [Challenge Index](docs/generated/challenge-index.md) が正本です。各Challengeは単独で完結し、公開順は参加者の履修順ではありません。結果は
`improved` だけでなく、`equal`、`worse`、`incomparable`、`blocked`、`unsupported`
も有効です。

## Guides

- [Challenge lifecycle](docs/challenge-lifecycle.md)
- [Runtime repository guide](docs/runtime-repository-guide.md)
- [Submission guide](docs/submission-guide.md)
- [Judging](docs/judging.md)
- [Support and fallbacks](docs/support-and-fallbacks.md)
- [Architecture and Challenge Pack Contract v1](docs/architecture.md)
- [Contributing](CONTRIBUTING.md)

PackのOverlay先は常に `.hackathon/challenge/**` の不活性領域です。参加者が作る `.github` / `.vscode` artifactをHubが直接配置することはありません。HubはGitHub Appのプロビジョニングやリモートリポジトリ作成も実行せず、`plan-run.mjs` は常にdry-runです。
登録済みの任意経路は [Support Matrix](docs/generated/support-matrix.md) から参照できます。提供するのはガイドと未確認・停止条件の表示だけです。本編のPack実行や効果とは分け、任意作業は未実施のまま提出できます。
公開Challengeの実行には、`.hackathon/template.json` がversion 1を示すRuntime foundationが必要です。markerまたはPack consumerがないcheckoutでは実行せず、`blocked` として報告します。
初回リリースではRuntime foundationを先にmergeし、その後にこのHub foundationをmergeします。
