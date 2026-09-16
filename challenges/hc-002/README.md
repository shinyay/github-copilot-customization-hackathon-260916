# HC-002 Java と XML に別々の読み方を教えよう

**Language:** **日本語** / [English](../../en/challenges/hc-002/README.md)

## Scenario

受注の在庫引当を調べるとき、Java だけを読むと「誰が、どの状態で呼べるか」は説明できても、Spring XML とのつながりを見落とすことがあります。逆に XML の属性だけを並べても、それが調べている method へどう適用されるのか伝わりません。

このシナリオでは、Java と Spring XML へ異なる読み方を届ける File/task Instructions を設計します。業務の答えを指示へ埋め込まず、対象 file、共有処理、設定の参照関係をたどる習慣を作ります。

## この機能とは

VS Code で使う File/task Instructions は、リポジトリの `.github/instructions/` に `*.instructions.md` として置く Markdown の指示です。先頭の YAML frontmatter で対象や目的を示し、その後の本文へ作業規則を書きます。

```markdown
---
description: "Java の実装を根拠付きで読むための観点"
applyTo: "wholesale-core/src/main/java/**/*.java"
---
```

- `applyTo` は workspace 相対の file pattern です。pattern 内では OS にかかわらず `/` を使います。
- 複数 pattern は一つの引用符付き文字列でカンマ区切りにできます。
- `description` は指示の目的を説明します。client によっては作業内容との関連付けにも使われます。
- `applyTo` はアクセス制御ではありません。file を読める権限や、他の経路から指示が選ばれないことを保証しません。
- 複数 Instructions の組合せ順序は保証されません。file 名や保存順を優先順位として使わず、二つの本文を矛盾させないようにします。
- `applyTo` を省略した指示や意味的な選択の扱いは client/version により確認が必要です。このシナリオでは Java/XML の両方に明示的な `applyTo` を残します。

Spring XML では、次を名前の参照としてつなげて読みます。

- bean: どの class の object をどの名前で構成するか
- advice: transaction などの共通処理をどう宣言するか
- advisor / pointcut: その advice をどの処理へ適用するか
- method rule (`tx:method`): method 名ごとの扱い

XML に宣言があることと、実行時に transaction や rollback を観測したことは別です。

## 向いていること / 向いていないこと

**向いていること**

- Java と Spring XML のように、file 群ごとに繰り返す読み方が異なる
- 全 file へ長い注意を渡さず、関連する観点だけを保守したい
- scope を広げたときの過剰適用と、絞ったときの対象漏れを検討したい

**向いていないこと**

- 一度だけの依頼や、全作業に共通する短い注意
- 特定の role 名、在庫引当の結論、transaction の答えを記憶させること
- pattern を情報保護や必ず適用される仕組みとして使うこと
- Java/XML の静的読解だけで DB 上の実動作を証明すること

指示を増やす費用が効果を上回るなら、「追加しない」も妥当な設計です。

## ゴール

1. Java 用と Spring XML 用に、scope と本文が異なる二つの Instructions を設計する。
2. Java の共有ガードと XML の bean/advice/pointcut/method rule を、根拠付きで一つの説明へつなぐ。
3. 正例・負例で scope を確かめ、不要な選択や対象漏れを記録する。
4. 保存、client 上の発見、実際の本文利用、回答内容を混同しない。

## 用意するもの

- File/task Instructions に対応した VS Code と GitHub Copilot
- 読み取り用の作業 branch または worktree
- 次の file を含む対象リポジトリ

| 読む入口 | 確認すること |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `OrderService.allocate`、呼出し先、状態の前提と更新 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | service が共有するガード |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | ガードから委譲される判定 |
| `wholesale-core/src/main/resources/application-context.xml` | import、advice、advisor、method rule |
| `wholesale-core/src/main/resources/spring/module-operations.xml` | import される bean 定義と参照 |

scope の負例には対象リポジトリの `pom.xml` と `README.md` を使います。XML 拡張子だけを理由に Maven 設定まで Spring 用 Instructions の対象にしないでください。

`starter\` には次の不活性な素材があります。

- [固定依頼](starter/request.txt.template)
- [Java 用 Instructions](starter/customization/hc002-java.instructions.md.template)
- [Spring XML 用 Instructions](starter/customization/hc002-xml.instructions.md.template)
- [設計ワークシート](starter/worksheet/design.md.template)
- [任意比較メモ](starter/worksheet/comparison.md.template)

すべて `.template` のままなので、この challenge ディレクトリでは active customization になりません。

## 準備

1. [リポジトリ全体の始め方](../../README.md#始め方) を確認します。
2. [設計ワークシート](starter/worksheet/design.md.template) を使い、回答を見る前に次を決めます。
   - Java/XML それぞれの正例と負例
   - `module-operations.xml` を直接 scope に含めるか、入口から参照をたどらせるか
   - 共有ガード、状態の前提・拒否・更新、XML の参照関係のどれを本文へ残すか
   - 不要な説明、対象漏れ、過剰適用をどう観察するか
3. `starter\customization\` の二つの原稿を読み、必要な規則だけを対象リポジトリ用のコピーへ残します。challenge 側の `.template` は変更しても active にはせず、実際に試すときだけ対象リポジトリへ次の名前でコピーします。
   - `.github/instructions/hc002-java.instructions.md`
   - `.github/instructions/hc002-xml.instructions.md`
4. frontmatter と本文を混ぜず、二つの本文をどちらの順序で組み合わせても矛盾しないようにします。
5. Instructions の本文へ、`allocate` の結論や今回だけの role/transaction の答えを書かないでください。

## 試してみる

### 1. scope を確かめる

本番の調査とは別の新しい会話で、一 file ずつ次の同じ依頼を使います。

> このファイルの構造を一文で説明してください。読み取りだけを行い、変更や実行はしないでください。

初期テンプレートなら、次のような予測を立てられます。

| 対象 | Java 用 | XML 用 |
| --- | --- | --- |
| `OrderService.java` | 対象 | 非対象 |
| `application-context.xml` | 非対象 | 対象 |
| `module-operations.xml` | 非対象 | 対象 |
| `pom.xml` | 非対象 | 非対象 |
| `README.md` | 非対象 | 非対象 |

予測と、client が示した参照や選択を分けて記録します。file を明示添付した場合、別の Instructions から参照した場合、表示がない場合も区別してください。回答に同じ言葉が現れただけで、指示本文が自動で使われたとは断定しません。

### 2. 固定依頼で読む

新しい会話を開始し、[request.txt.template](starter/request.txt.template) の全文をそのまま送ります。五つの入口を同じ方法で利用可能にします。

回答では次を確認します。

- `OrderService.allocate` から共有ガードと `Actor` の判定までたどっている
- 状態や version の前提、拒否条件、処理後の更新を分けている
- 対象 bean、advice、advisor の pointcut、method rule を名前でつないでいる
- 別 service の規則を `allocate` へ無条件に流用していない
- file + symbol（XML は要素・属性）で重要な主張を支えている
- 事実、推論、未確認を区別している
- XML の宣言と、未実行の transaction/rollback を区別している

この依頼は読み取り専用です。source 編集、compile、test、DB 接続、server 起動は行いません。

## 任意: 比較する

比較する場合は二条件だけを短く試します。

1. 二つの Instructions を置かず、固定依頼を新しい会話で実行する（Baseline）。
2. 二つの Instructions を置き、同じ固定依頼を別の新しい会話で実行する（Customized）。
3. source、依頼、model、tools、明示添付の方法をそろえ、[比較メモ](starter/worksheet/comparison.md.template) に差を残す。

条件が違う、指示の発見を観測できない、他の指示が混ざる場合は、回答品質だけで機能の効果を断定しません。

## 確認ポイント

- Java と XML の scope は、広げる利点と保守費用を説明できるか
- 二つの Instructions は業務の正解ではなく、再利用できる読み方か
- `applyTo` を ACL や排他的な除外として扱っていないか
- 保存、発見、本文利用、出力のどこまで観測できたか
- Java と XML を単に両方引用するだけでなく、参照関係を確認したか
- 宣言と実行時の事実を分け、未確認を残したか

## 発展

- 新しい service や XML module が増えたとき、対象漏れと過剰適用がどう変わるか設計ワークシートへ追記する
- XML の scope を exact path に絞る案と、directory pattern に広げる案を比較する
- `description` の言葉を変えた場合の選択を、`applyTo` の比較とは別の実験として観察する
- 二つの本文で重複している一文を削り、回答品質と保守量の変化を考える

## 制約・Fallback・安全

- File/task Instructions を利用できない場合は、二つの本文を固定依頼の前に手動で貼れます。これは手動 fallback であり、scope や自動選択を確認したことにはなりません。
- client に発見や参照の表示がない場合は、実際の本文利用を未確認のままにします。
- `applyTo` は権限を増減しません。secret や private data を指示へ入れず、既存の access policy に従います。
- XML の静的宣言から、DB transaction、commit、rollback の実動作を断定しません。
- source、test、設定を変更せず、新しい software、外部 tool、権限変更をこの読み取り演習のために追加しません。
- scope を確かめるために既存の User/organization 設定や他人の Instructions を削除しません。混入を分離できない場合は、その限界を記録して止めます。
