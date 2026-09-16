# HC-021 競合するInstructionsの犯人を見つけよう

**Language:** **日本語** / [English](../../en/challenges/hc-021/README.md)

## Scenario

2行だけの表示カードをGitHub Copilotに整形してもらいます。規則ファイルを置いたのに表示が変わらない場合もあれば、同じ規則を複数の場所へ置いたあと、どの本文が使われたか説明できなくなる場合もあります。

このシナリオでは、期待する答えが出るまで指示を増やすのではなく、**placement、discovery、content use、output compliance**を順番に切り分けます。素材はすべて無害な合成fixtureで、activeなInstructionsは作りません。

## この機能とは

Instructionsは、Copilotへ作業上の読み方や出力規則を伝えるMarkdownです。ただし、次の4段階は別の事実です。

1. **placement（配置）** — ファイルがどのpath・名前・拡張子で保存されているか。
2. **discovery（発見）** — clientが候補や参照元として認識したか。
3. **content use（本文利用）** — 規則本文が実際の会話へ供給されたと確認できたか。
4. **output compliance（出力準拠）** — 回答が規則へ従ったか、矛盾を指摘したか、別の形になったか。

`*.instructions.md.template` は安全な不活性サンプル名であり、通常のInstructionsとして有効な名前ではありません。文書化されたpathへファイルが存在しても、それだけでdiscovery、content use、output complianceは証明されません。

複数のInstructionsが使われる場合、本文は組み合わされ得ますが、ファイル名や保存順による一般的な優先順位を推測しません。Instructionsはtool権限、OS権限、承認、アクセス制御も追加しません。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 向いていること / 向いていないこと

**向いていること**

- 指示ファイルを置いたのに、どの段階で止まったか分からない状況
- 不活性名、標準外path、文書化されたpathを机上で比較する診断
- 同文重複と一行矛盾の切り分け
- 原因候補、反証、未観測、最小修正案の引き継ぎ

**向いていないこと**

- 特定の見出しが出るまで指示を増やし続けること
- 出力が似ているだけで本文利用を断定すること
- 小さなfixtureから全Instructionsの優先順位を決めること
- 個人、home、組織のInstructionsを削除して条件を整えること
- activeなcustomizationをこのリポジトリへ作ること

## ゴール

1. 4段階を混同しない診断順を作る。
2. 同じpacket、依頼、規則本文を保った7つの静的caseを説明する。
3. 同文重複と一行矛盾を別の問題として診断する。
4. 観測できない項目を `not-observed` のまま残し、次の最小確認を提案する。

## 用意するもの

- [リポジトリ共通の始め方](../../README.md#始め方)を終えた作業環境
- Markdown / JSONを読めるエディター
- `starter/` の次の素材
  - [固定依頼](starter/request.txt.template)
  - [固定2行の表示カード](starter/fixtures/packet.txt.template)
  - [手動供給用の規則本文](starter/customizations/rules.md.template)
  - [同文のscoped原稿](starter/customizations/variant-a.instructions.md.template)
  - [一行だけ反対のscoped原稿](starter/customizations/variant-b.instructions.md.template)
  - [静的case plan](starter/worksheets/case-plan.json.template)
  - [診断設計票](starter/worksheets/design.md.template)

Copilotを使えない場合でも、静的診断だけで進められます。

## 準備

固定packetは次のexact 2行です。

```text
青いノートを机に置きます。
白いカードを隣に置きます。
```

固定依頼は、2行の文字と順序を変えずに表示し、規則の出所を直接確認できる場合だけ分けて説明し、内部状態は `not-observed` とする内容です。業務分析、source引用、ファイル変更、tool、command、別Agent、network実行を禁止しています。

規則本文は次の2行です。

```text
表示カードの見出しは「案内」にしてください。
固定メッセージは一行ずつ箇条書きで表示してください。
```

`variant-a.instructions.md.template` はこの本文に、対象を `starter/fixtures/packet.txt.template` へ限定するfrontmatterを付けた不活性原稿です。`variant-b.instructions.md.template` はfrontmatterと箇条書き規則を同じに保ち、見出しだけを「確認」へ変えています。

すべてUTF-8の教材として読み、`.template` を外したり `.github/` へcopyしたりしないでください。

## 試してみる

1. [静的case plan](starter/worksheets/case-plan.json.template)を開き、各caseで変わる要因を一つずつ確認します。
2. 次のcaseをplacementの事実と仮説に分けます。

| case | 規則の供給を想定する方法 | 診断の焦点 |
|---|---|---|
| no-instructions | 配置なし、手動供給なし | 固定依頼だけの出力 |
| inactive-template | `.template` の不活性素材 | ファイル存在とactive化の違い |
| nonstandard-path | `notes/copilot-instructions.md` を仮定 | Markdownであることと文書化pathの違い |
| documented-path | `.github/copilot-instructions.md` を仮定 | 正しいplacementだけでは残る未知 |
| manual-body | 規則本文を全文手動供給 | discoveryを介さないcontent use |
| duplicate-text | base本文 + 同文のvariant Aを仮定 | 同文重複 |
| conflicting-text | base本文 + variant Bを仮定 | 見出し一行だけの矛盾 |

`notes/...` と `.github/...` は診断用の仮想pathです。このリポジトリへ実ファイルを作りません。

3. [variant A](starter/customizations/variant-a.instructions.md.template)と[variant B](starter/customizations/variant-b.instructions.md.template)を比較します。
   - `description` と `applyTo` は同じ
   - 箇条書き規則は同じ
   - 見出しの「案内」 / 「確認」だけが異なる
4. [診断設計票](starter/worksheets/design.md.template)へ、各段階の直接観察、原因候補、反証、停止条件を書きます。
5. 各caseで次を別々に記録します。
   - placement: 実在するstarter pathと、仮想pathの区別
   - discovery: clientの表示がなければ `not-observed`
   - content use: 手動で全文を渡した場合以外は推測しない
   - output compliance: 実際に応答を得た場合だけ記録
6. 原因を一つへ決め打ちせず、次に一要因だけ変える最小確認を提案します。

よい出力からdiscoveryやcontent useを逆算せず、悪い出力だけでplacement不良と断定しないことがポイントです。

## 任意: 比較する

新しい会話を2つ使い、同じmodelと設定で短い手動確認を行います。

1. [固定依頼](starter/request.txt.template)の後に固定packetだけを貼る。
2. 別の会話で、固定依頼、[規則本文](starter/customizations/rules.md.template)、固定packetの順に全文を貼る。

比較するのはoutput complianceだけです。2では手動供給した本文を確認できますが、repositoryからのdiscoveryは確認していません。出力差がない、悪化する、比較不能も有効な観察です。

## 確認ポイント

- placement、discovery、content use、output complianceを分けたか
- 7つのcaseでpacket、依頼、規則本文の関係を保ったか
- manualでは要約ではなく規則全文を使ったか
- 同文重複と一行矛盾を別に説明したか
- active pathの存在だけで本文利用を断定していないか
- 特定の見出しが常に「勝つ」と一般化していないか
- 未観測を `not-observed` のまま残したか

## 発展

- 4段階、直接観察、停止条件、最小修正を一枚にまとめる。
- 既存caseを変更せず、「scopeが曖昧」「対象harnessが異なる」など一境界だけを変えた不活性 `*.template` 案を設計する。
- 実環境で確認する必要がある場合は、まず一要因だけを変える隔離された試行を計画し、このリポジトリの素材はactive化しない。

## 制約・Fallback・安全

- 素材は `SYNTHETIC_TRAINING_ONLY` の合成表示カードです。実アプリの仕様、private code、秘密を扱いません。
- `starter/customizations/` のサンプルはすべて不活性な `*.template` のまま保ちます。
- `.github/copilot-instructions.md` や `.github/instructions/*.instructions.md` をこのリポジトリへ作りません。
- Instructionsは権限や安全な実行を追加しません。固定依頼のtool / command / network禁止を守ります。
- Copilotや参照表示を利用できなければ、placementと本文差の静的診断まで行い、discovery、content use、output complianceは `not-observed` とします。
- 条件を揃えるために既存設定、個人・home・組織Instructions、他人のファイルを削除・reset・stashしません。
