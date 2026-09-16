# HC-025 Local Agent / Agent Host のカスタマイズ可搬性を診断する

**Language:** **日本語** / [English](../../en/challenges/hc-025/README.md)

## Scenario

チームには、固定 packet を読む Skill、Prompt、Custom Agent、Plugin の原稿があります。VS Code の Local Agent 向けに考えた同じ意図を Agent Host でも使いたいものの、本文が同じでも metadata、配置、発見、読み込み、利用可能な tool、approval は同じとは限りません。

このシナリオでは、すべてのサンプルを不活性な `.template` のまま読み、どこまでそのまま使えるか、何を移植するか、どこで非対応・未確認として止めるかを診断します。

## この機能とは

カスタマイズの**可搬性**は、ファイルをコピーできるかではなく、別の harness でも意図と安全境界を保てるかを確認する考え方です。次の層を分けます。

1. **file format**: YAML / JSON / Markdown と property
2. **documented discovery**: 文書化された保存元と発見方法
3. **observed discovery / loading**: 実環境で候補や本文を確認したか
4. **effective tools**: 宣言ではなく実際に使えた tool
5. **approval**: 書き込みや外部送信などの確認・許可

Skill、Prompt、Custom Agent、Plugin は異なる種類です。特に Prompt Files は Agent Host では読み込まれないため、Skill に置き換えて「Prompt も成功した」とは扱いません。

参照:

- [VS Code Agent Host](https://code.visualstudio.com/docs/agents/concepts/agent-host)
- [Prompt files](https://code.visualstudio.com/docs/agent-customization/prompt-files)
- [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [Agent Plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)

## 向いていること

- 複数の Copilot harness へカスタマイズを移す前の静的診断
- 共通本文と種類固有 metadata の切り分け
- 文書上の対応と実機観測の分離
- 非対応、未確認、追加承認が必要な境界の明示

## 向いていないこと

- Agent Host を Cloud Agent の別名として扱うこと
- 宣言された `read` / `search` だけで実効権限や OS 隔離を断定すること
- 1 client の結果を CLI、App、Cloud、別 version へ一般化すること
- サンプルを有効化し、全形式の実動作を一度に試すこと

## ゴール

- 固定 packet と4種類の原稿を、Local Agent / Agent Host の観点で診断する
- format、discovery、loading、effective tools、approval を別欄に残す
- 各原稿を「そのまま」「移植」「非対応」「未確認」「停止」に分類する
- 共通本文を保ちつつ、種類固有 metadata の最小修正案を説明する

## 用意するもの

`starter/` には、すべて不活性な `.template` として次を用意しています。

- `request.txt.template`: 固定依頼
- `packet.json.template`: packet `LAB25-APP-01`
- `customizations/`: Skill、Prompt、Custom Agent、Plugin、MCP の原稿
- `invalid/`: property 配置を誤った2つの fixture
- `permissions.json.template`: 教材上の権限境界
- `source-boundaries.md.template`: 文書上の対応と非主張
- `diagnosis.md.template` / `comparison.md.template`: 診断用ワークシート

packet が保持する canonical な source 基準は public upstream template `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c` です。実際の source は、現在の runtime workspace にある次の3 pathを使います。

```text
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/action/OrderAction.java
wholesale-web/src/main/java/jp/co/tsubame/wholesale/web/form/OrderForm.java
wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java
```

GitHub template から作った workspace は独自履歴を持つため、local HEAD が upstream template revision と一致する必要はありません。この scenario では Java の業務仕様を調査せず、packet ID、upstream template repository / revision、3 path、HEAD 一致不要という境界だけを固定入力として扱います。revision へ合わせる checkout / reset は行いません。

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/brief.md.template`、`request.txt.template`、`packet.json.template`、`permissions.json.template`、`source-boundaries.md.template` を読み、upstream template revision と runtime workspace source を区別します。
3. `starter/customizations/` と `starter/invalid/` のファイルを確認します。`.template` を外したり、`.github/`、user home、Plugin の install 先へコピーしたりしません。
4. 診断結果は `diagnosis.md.template` と `comparison.md.template` のコピー、または任意のメモへ記録します。

## 試してみる

1. Copilot の新しい会話へ固定依頼と packet を渡し、4種類を独立して診断するよう依頼します。
2. Skill、Prompt、Custom Agent、Plugin ごとに、実際の property と共通本文を列挙します。packet の upstream template fields、workspace source paths、HEAD 一致不要という境界も保ちます。
3. Local Agent / Agent Host それぞれについて、`documented discovery` と `observed discovery` を分けます。実機を試していなければ observed 値は `null` / `not-observed` のままにします。
4. 2つの不正 fixture について、問題の property と最小修正を説明させます。別形式へ置換して元の形式が成功したことにはしません。
5. 宣言 tool、実効 tool、client 接続、OS 権限、approval を別々に記録します。
6. 最後に、各原稿を「そのまま」「移植」「非対応」「未確認」「停止」のいずれかへ分類し、理由を添えます。

## 任意: 比較する

短い手動セルフチェックとして、同じ固定依頼を新しい会話で2回試せます。

- **Baseline**: `request.txt.template` と `packet.json.template` だけを渡す
- **Customized**: 同じ入力に `source-boundaries.md.template`、`permissions.json.template`、4種類の原稿を加える

回答の長さではなく、層の分離、非対応の扱い、推測の少なさを比べます。これは実 harness の性能比較ではありません。

## 確認ポイント

- `LAB25-APP-01`、public upstream template repository / revision、3 source pathを変更していない
- template由来workspaceのlocal HEAD一致を要求していない
- 4種類を同じ形式へ無理に統合していない
- Prompt の Agent Host 非読込を別形式の成功で置き換えていない
- 文書上の対応と実機観測を同じ boolean にしていない
- 未観測の version、model、tools、approval を補完していない
- すべてのサンプルが `.template` のままである

## 発展

- [Local Agent / Agent Host で1件ずつ確認する](optional/local-host-probes.md)
- [CLI / App / Cloud を別 client として調べる](optional/other-clients.md)

どちらも本編の静的診断を終えた後、必要な権限と隔離環境を用意できる場合だけ進めます。

## 制約・Fallback・安全

- 本編は静的診断だけで完了します。Local Agent または Agent Host を利用できなくても、観測値を `null` のままにして文書上の境界を整理できます。
- 製品の保存先や対応状況は変わり得るため、実利用前に上記の公式文書を再確認します。
- 実効 tool や approval を宣言 metadata から推測しません。
- active file、install、login、同期、設定変更、外部送信、書き込みは行いません。
- upstream template revision に合わせる checkout / reset は行いません。列挙 path は runtime workspace にある source の場所を示します。
- 条件を揃えられなければ `incomparable`、権限や環境で止まれば `blocked`、文書上の非対応なら `unsupported` と記録します。
