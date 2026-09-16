# GitHub Copilot Customization Scenarios

GitHub Copilotのカスタマイズ機能を、実務に近い45のシナリオで学ぶための公開リポジトリです。

このリポジトリが提供するのは、シナリオの説明と不活性なサンプルだけです。リポジトリ作成、サンプルの配置、Copilotでの実行は利用者が自分の作業用リポジトリで行います。結果をこのリポジトリのIssueやPull Requestへ提出する必要はありません。

## 収録内容

- Repository Instructions、Path-specific Instructions、AGENTS.md、CLAUDE.md
- Prompt Files、Custom Agents、Subagents、Agent Skills、Hooks
- MCP、Tool Sets、Copilot Spaces、Agent Plugins
- Context、Memory、Model、Permissions、Sandbox
- GitHub Copilot code review、Cloud Agent、Cloud customization
- カスタマイズの評価、段階導入、診断、安全な運用設計

[シナリオ一覧](challenges/README.md) から、興味のある機能または現場の課題に近いものを選んでください。各シナリオは単独で試せます。

## 始め方

### 1. シナリオを選ぶ

[シナリオ一覧](challenges/README.md) から1つ選び、最初にREADME全体を読みます。前のシナリオを終えている必要はありません。

### 2. 作業用リポジトリを作る

[`shinyay/github-copilot-customization-runtime-template`](https://github.com/shinyay/github-copilot-customization-runtime-template) を開き、**Use this template** から自分用のリポジトリを作ります。

実コード、会話、ログ、カスタマイズ設定を公開しないよう、特別な理由がなければPrivateリポジトリを選んでください。シナリオごとに新しい作業用リポジトリを使うと、前の設定や会話の影響を避けやすくなります。

Runtime templateに含まれる補助スクリプトや旧運営用ファイルは、このシナリオ集では使用しません。各READMEが指定するsourceと、自分で手動配置する `starter/` の素材だけを扱ってください。

固定revisionを示すシナリオでは、その値は公開Runtime template上のupstream revisionです。**Use this template** で作ったリポジトリは新しいGit履歴になるため、作業用リポジトリの `HEAD` がupstream revisionと一致することは要求しません。

### 3. このリポジトリを参照する

ブラウザーで読んでも、ローカルへcloneしても構いません。

```console
git clone https://github.com/shinyay/github-copilot-customization-hackathon-260916.git copilot-customization-scenarios
```

各シナリオの `starter/` には、固定入力、fixture、code excerpt、Customization例、確認用worksheetなどが入っています。READMEで指定されたファイルだけを作業用リポジトリへコピーしてください。

`*.template` は意図的に不活性です。READMEで配置先と名前を確認し、作業用リポジトリ内でだけ必要なsuffixを外します。この公開リポジトリ内で直接有効化したり、`starter/` 全体を一括コピーしたりしないでください。

### 4. 試す

シナリオの固定taskと手順に従ってCopilotを使います。機能を有効化する前の結果と有効化後の結果を比べたい場合は、各READMEの **任意: 比較する** を使います。

比較は学習のためのセルフチェックです。run ID、共通のEvidence形式、外部提出はありません。入力、モデル、tools、会話の状態など、結果に影響する差だけ自分のメモへ残してください。

### 5. 後片付けする

起動したMCP server、watcher、開発serverなどを停止します。不要になった作業用リポジトリや一時データは、自分の運用ルールに従って整理してください。

## 基本方針

- **シナリオ中心**: 機能一覧ではなく、現場の困りごとから始めます。
- **機能の限界も説明**: 何に向き、何を保証しないかを明記します。
- **手動で理解する**: 自動注入や自動提出ではなく、利用者が配置と実行を確認します。
- **結果を決めつけない**: 改善しない、悪化する、利用できないという結果も学びに含めます。
- **安全を優先**: secret、個人情報、顧客データ、private source、未承認の外部操作を教材へ持ち込みません。

## リポジトリ構成

```text
challenges/
├── README.md          # 45シナリオの一覧
└── hc-xxx/
    ├── README.md      # シナリオ、機能説明、手順、確認ポイント
    ├── starter/       # 手動で使う不活性なサンプル
    └── optional/      # 発展・補足ガイド（存在する場合）
```

シナリオを追加・更新する場合は [Contributing](CONTRIBUTING.md) を参照してください。

## Safety

- token、credential、個人情報、顧客データ、private source、raw logをコミットしない。
- 外部service、組織設定、権限、課金、Cloud実行を扱う場合は、対象と影響を確認して必要な承認を得る。
- UIや機能が見つからない場合に、別機能で成功したことにしない。利用環境、契約、client、host、channelの違いを確認する。
- Fallbackは同じ機能を再現するとは限らない。手作業で比較できた部分と、確認できなくなった部分を分ける。
