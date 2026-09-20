# GitHub Copilot Customization Scenarios

**言語:** **日本語** / [English](en/README.md)

> **GitHub Pages（有効化後）:** [日英切り替え付きのサイトを開く](https://shinyay.github.io/github-copilot-customization-hackathon-260916/)。サイトのルートでは日本語を既定で表示し、すべての公開ページに **日本語 / English** の切り替えを表示します。

言語切り替えで選んだ言語はブラウザーに保存されます。JavaScriptや保存機能を利用できない場合も、通常のリンクとして切り替えられます。GitHub上では、各Markdown冒頭の **言語** リンクから、同じページの翻訳へ移動できます。

サイトの生成には、GitHub Pagesが標準で提供するJekyllプラグインだけを使っています。Node.jsパッケージ、Gemfile、GitHub Actionsのビルドワークフローは追加していません。

GitHub Copilotのカスタマイズ機能を、実務に近い45のシナリオで学ぶための公開リポジトリです。

このリポジトリが提供するのは、シナリオの説明と、そのままでは有効にならないサンプルだけです。リポジトリの作成、サンプルの配置、Copilotでの実行は、利用者が自分の作業用リポジトリで行います。結果をこのリポジトリのIssueやPull Requestとして提出する必要はありません。

## 収録内容

- Repository Instructions、Path-specific Instructions、AGENTS.md、CLAUDE.md
- Prompt Files、Custom Agents、Subagents、Agent Skills、Hooks
- MCP、Tool Sets、Copilot Spaces、Agent Plugins
- Context、Memory、Model、Permissions、Sandbox
- GitHub Copilot code review、Cloud Agent、Cloud customization
- カスタマイズの評価、段階導入、診断、安全な運用設計

[シナリオ一覧](challenges/README.md) から、興味のある機能や、現場の課題に近いものを選んでください。どのシナリオも単独で試せます。

## 始め方

### 1. シナリオを選ぶ

[シナリオ一覧](challenges/README.md) から1つ選び、はじめにREADME全体を読みます。ほかのシナリオを先に終えておく必要はありません。

### 2. 作業用リポジトリを作る

[`shinyay/github-copilot-customization-runtime-template`](https://github.com/shinyay/github-copilot-customization-runtime-template) を開き、**Use this template** から自分用のリポジトリを作ります。

実際のコード、会話、ログ、カスタマイズ設定を公開しないよう、特別な理由がなければPrivate（非公開）リポジトリを選んでください。シナリオごとに新しい作業用リポジトリを使うと、以前の設定や会話による影響を避けやすくなります。

Runtime templateに含まれる補助スクリプトや旧運営用ファイルは、このシナリオ集では使いません。各READMEで指定されたソースと、自分で配置する `starter/` の素材だけを扱ってください。

固定リビジョンを示すシナリオでは、その値は公開Runtime templateの上流リビジョンを表します。**Use this template** で作ったリポジトリには新しいGit履歴が作られるため、作業用リポジトリの `HEAD` が上流リビジョンと一致している必要はありません。

### 3. このリポジトリを参照する

ブラウザーで読むことも、ローカルにクローンすることもできます。

```console
git clone https://github.com/shinyay/github-copilot-customization-hackathon-260916.git copilot-customization-scenarios
```

各シナリオの `starter/` には、固定入力、fixture、コードの抜粋、カスタマイズ例、確認用ワークシートなどが入っています。READMEで指定されたファイルだけを作業用リポジトリへコピーしてください。

`*.template` は、そのままでは有効にならない名前にしてあります。READMEで配置先と名前を確認し、作業用リポジトリ内でだけ必要な接尾辞を外してください。この公開リポジトリ内で直接有効にしたり、`starter/` 全体をまとめてコピーしたりしないでください。

### 4. 試す

シナリオの固定タスクと手順に従ってCopilotを使います。機能を有効にする前後の結果を比べたい場合は、各READMEの **任意: 比較する** を使います。

比較は学習のためのセルフチェックです。実行ID、共通の記録形式、外部への提出は必要ありません。入力、モデル、ツール、会話の状態など、結果に影響する違いだけを自分のメモに残してください。

### 5. 後片付けする

起動したMCPサーバー、ウォッチャー、開発サーバーなどを停止します。不要になった作業用リポジトリや一時データは、自分の運用ルールに従って整理してください。

## 基本方針

- **シナリオ中心**: 機能一覧ではなく、現場の困りごとから始めます。
- **機能の限界も説明**: 何に適しているか、何を保証しないかを明記します。
- **手作業で理解する**: 自動配置や自動提出に頼らず、利用者自身が配置と実行を確認します。
- **結果を決めつけない**: 改善しない、悪化する、利用できないといった結果も学びに含めます。
- **安全を優先**: シークレット、個人情報、顧客データ、非公開ソース、未承認の外部操作を教材に持ち込みません。

## リポジトリ構成

```text
_config.yml             # GitHub Pages用の最小Jekyll設定
_layouts/default.html   # 全ページ共通の言語切り替え
assets/                 # GitHub Pages用の軽量なCSSとJavaScript
en/                     # 公開Markdownの英語版
challenges/
├── README.md          # 45シナリオの一覧
└── hc-xxx/
    ├── README.md      # シナリオ、機能説明、手順、確認ポイント
    ├── starter/       # 手動で使う、そのままでは有効にならないサンプル
    └── optional/      # 発展・補足ガイド（存在する場合）
```

シナリオを追加・更新する場合は [Contributing](CONTRIBUTING.md) を参照してください。

## 安全上の注意

- トークン、認証情報、個人情報、顧客データ、非公開ソース、未加工のログをコミットしない。
- 外部サービス、組織設定、権限、課金、クラウド実行を扱う場合は、対象と影響を確認し、必要な承認を得る。
- UIや機能が見つからない場合に、別の機能で成功したことにしない。利用環境、契約、クライアント、ホスト、チャネルの違いを確認する。
- 代替手段で同じ機能を再現できるとは限らない。手作業で比較できた部分と、確認できなくなった部分を分ける。
