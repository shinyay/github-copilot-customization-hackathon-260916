# HC-025 Local Agent / Agent Host間でカスタマイズの可搬性を診断しよう

**言語:** **日本語** / [English](../../en/challenges/hc-025/README.md)

## シナリオ

チームには、固定パケットを読むSkill、Prompt、Custom Agent、Pluginの原稿があります。VS CodeのLocal Agent向けに設計した内容をAgent Hostでも使いたいと考えていますが、本文が同じでも、メタデータ、配置、検出、読み込み、利用可能なツール、承認が同じとは限りません。

このシナリオでは、すべてのサンプルを不活性な `.template` のまま読み、どこまでそのまま使えるのか、何を移植するのか、どこで非対応または未確認として止めるのかを診断します。

## この機能とは

カスタマイズの**可搬性**とは、単にファイルをコピーできることではなく、別のハーネスでも意図と安全境界を保てるかを確認する考え方です。次の層を分けて扱います。

1. **ファイル形式（file format）**: YAML / JSON / Markdownとプロパティ
2. **文書化された検出方法（documented discovery）**: 文書に記載された保存場所と検出方法
3. **観測した検出 / 読み込み（observed discovery / loading）**: 実環境で候補や本文を確認したか
4. **実効ツール（effective tools）**: 宣言ではなく、実際に使えたツール
5. **承認（approval）**: 書き込みや外部送信などに対する確認と許可

Skill、Prompt、Custom Agent、Plugin は異なる種類です。特に Prompt Files は Agent Host では読み込まれないため、Skill に置き換えて「Prompt も成功した」とは扱いません。

参照:

- [VS Code Agent Host](https://code.visualstudio.com/docs/agents/concepts/agent-host)
- [Prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [Agent Plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)

## 向いていること

- 複数のCopilotハーネスへカスタマイズを移す前の静的診断
- 共通の本文と、種類ごとに固有のメタデータの切り分け
- 文書上の対応と実機観測の分離
- 非対応、未確認、追加承認が必要な境界の明示

## 向いていないこと

- Agent Host を Cloud Agent の別名として扱うこと
- 宣言された `read` / `search` だけで実効権限や OS 隔離を断定すること
- 1つのクライアントで得た結果を、CLI、App、Cloud、別のバージョンへ一般化すること
- サンプルを有効化し、全形式の実動作を一度に試すこと

## ゴール

- 固定パケットと4種類の原稿を、Local Agent / Agent Hostの観点で診断する
- format、discovery、loading、effective tools、approvalを別々の欄に残す
- 各原稿を「そのまま」「移植」「非対応」「未確認」「停止」に分類する
- 共通の本文を保ちながら、種類ごとに固有のメタデータについて最小限の修正案を説明する

## 用意するもの

`starter/` には、すべて不活性な `.template` として次を用意しています。

- `request.txt.template`: 固定依頼
- `packet.json.template`: パケット `LAB25-APP-01`
- `customizations/`: Skill、Prompt、Custom Agent、Plugin、MCP の原稿
- `invalid/`: プロパティの配置を誤った2つのフィクスチャ
- `permissions.json.template`: 教材上の権限境界
- `source-boundaries.md.template`: 文書上の対応と非主張
- `diagnosis.md.template` / `comparison.md.template`: 診断用ワークシート

パケットが保持する正規のソース基準は、公開された上流テンプレート `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c` です。実際のソースには、現在のランタイムワークスペースにある次の3つのパスを使います。

```text
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
```

GitHubテンプレートから作成したワークスペースは独自の履歴を持つため、ローカルHEADが上流テンプレートのリビジョンと一致する必要はありません。このシナリオではJavaの業務仕様を調査せず、パケットID、上流テンプレートのリポジトリ / リビジョン、3つのパス、HEADの一致が不要という境界だけを固定入力として扱います。リビジョンに合わせるための `checkout` や `reset` は行いません。

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/brief.md.template`、`request.txt.template`、`packet.json.template`、`permissions.json.template`、`source-boundaries.md.template` を読み、上流テンプレートのリビジョンとランタイムワークスペースのソースを区別します。
3. `starter/customizations/` と `starter/invalid/` のファイルを確認します。`.template` を外したり、`.github/`、ユーザーのホーム、Pluginのインストール先へコピーしたりしません。
4. 診断結果は `diagnosis.md.template` と `comparison.md.template` のコピー、または任意のメモへ記録します。

## 試してみる

1. Copilotの新しい会話に固定依頼とパケットを渡し、4種類を独立して診断するよう依頼します。
2. Skill、Prompt、Custom Agent、Pluginごとに、実際のプロパティと共通の本文を列挙します。パケットにある上流テンプレートのフィールド、ワークスペースのソースパス、HEADの一致が不要という境界も保ちます。
3. Local Agent / Agent Hostのそれぞれについて、`documented discovery` と `observed discovery` を分けます。実機を試していなければ、observedの値は `null` / `not-observed` のままにします。
4. 2つの不正なフィクスチャについて、問題のあるプロパティと最小限の修正を説明させます。別形式に置き換えて、元の形式が成功したことにはしません。
5. 宣言されたツール、実効ツール、クライアント接続、OS権限、承認を別々に記録します。
6. 最後に、各原稿を「そのまま」「移植」「非対応」「未確認」「停止」のいずれかへ分類し、理由を添えます。

## 任意: 比較する

短い手動セルフチェックとして、同じ固定依頼を新しい会話で2回試せます。

- **Baseline**: `request.txt.template` と `packet.json.template` だけを渡す
- **Customized**: 同じ入力に `source-boundaries.md.template`、`permissions.json.template`、4種類の原稿を加える

回答の長さではなく、層の分離、非対応の扱い、推測の少なさを比較します。これは実際のハーネスの性能比較ではありません。

## 確認ポイント

- `LAB25-APP-01`、公開された上流テンプレートのリポジトリ / リビジョン、3つのソースパスを変更していない
- テンプレートから作成したワークスペースのローカルHEADの一致を要求していない
- 4種類を同じ形式へ無理に統合していない
- Prompt の Agent Host 非読込を別形式の成功で置き換えていない
- 文書上の対応と実機での観測を同じ真偽値にしていない
- 未観測のバージョン、モデル、ツール、承認を補完していない
- すべてのサンプルが `.template` のままである

## 発展

- [Local Agent / Agent Host で1件ずつ確認する](optional/local-host-probes.md)
- [CLI / App / Cloudを別のクライアントとして調べる](optional/other-clients.md)

どちらも本編の静的診断を終えた後、必要な権限と隔離環境を用意できる場合だけ進めます。

## 制約・代替手段・安全

- 本編は静的診断だけで完了します。Local Agent または Agent Host を利用できなくても、観測値を `null` のままにして文書上の境界を整理できます。
- 製品の保存先や対応状況は変わる可能性があるため、実際に利用する前に上記の公式文書を再確認します。
- 実効ツールや承認を、宣言されたメタデータから推測しません。
- 有効なファイルの作成、インストール、ログイン、同期、設定変更、外部送信、書き込みは行いません。
- 上流テンプレートのリビジョンに合わせるための `checkout` や `reset` は行いません。列挙されたパスは、ランタイムワークスペースにあるソースの場所を示します。
- 条件を揃えられなければ `incomparable`、権限や環境で止まれば `blocked`、文書上の非対応なら `unsupported` と記録します。
