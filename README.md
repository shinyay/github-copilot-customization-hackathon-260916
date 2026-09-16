# GitHub Copilot Customization Workshop 2026-09-16

この非公開リポジトリは、2026-09-16開催ワークショップのChallenge選択、Starter Pack配布、実行計画、Challenge Result Issue、結果集約を担う **Hub** です。実験はHubでは行わず、参加者またはチームごとに独立した非公開Runtimeリポジトリで行います。

```console
git clone https://github.com/shinyay/github-copilot-customization-hackathon-260916.git
```

提出入口は [Issue chooser](https://github.com/shinyay/github-copilot-customization-hackathon-260916/issues/new/choose) の共通
[Challenge Result Form](https://github.com/shinyay/github-copilot-customization-hackathon-260916/issues/new?template=challenge-result.yml)
です。45 Challengeで同じFormを使います。

## Repository identity

- Event Hub: `shinyay/github-copilot-customization-hackathon-260916`
- Target initial main: `2ad9718625562160c8d96c2090b13a180820a1e9`
- Accepted source: [`shinyay/github-copilot-customization-hackathon@fcdf3d4b5a6ac70c3318d45f258585f8f2d660de`](https://github.com/shinyay/github-copilot-customization-hackathon/commit/fcdf3d4b5a6ac70c3318d45f258585f8f2d660de)
- Accepted source/target tree: `1777736d3c3db03ea149811fce9036c84605bf8b`
- Current participant Runtime: [`shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`](https://github.com/shinyay/github-copilot-customization-runtime-template/commit/8f0b3aa25c4f33facdea691642c2f1cb3901391c)

Challengeページ内に残る過去のRuntime commit pinは、各Challengeの受入時点を示す履歴Evidenceです。参加開始時に使う上記のcurrent participant Runtime pinとは役割が異なるため、過去のpinや製品情報の検証日をイベント日へ置き換えません。

## Start

1. [Getting Started](docs/getting-started.md) を読み、current participant Runtime pinを確認する。
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
