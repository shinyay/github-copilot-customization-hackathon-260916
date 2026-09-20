# HC-002 JavaとXMLに異なる読み方を伝えよう

**言語:** **日本語** / [English](../../en/challenges/hc-002/README.md)

## シナリオ

受注の在庫引当を調べるとき、Java だけを読むと「誰が、どの状態で呼び出せるか」は説明できても、Spring XML とのつながりを見落とすことがあります。反対に、XML の属性を並べるだけでは、調査対象のメソッドにどのように適用されるのかが伝わりません。

このシナリオでは、Java と Spring XML にそれぞれ異なる読み方を指定する File/task Instructions を設計します。業務上の答えを指示に埋め込まず、対象ファイル、共通処理、設定の参照関係をたどる習慣を身に付けます。

## この機能とは

VS Code で使う File/task Instructions は、リポジトリの `.github/instructions/` に `*.instructions.md` として配置する Markdown 形式の指示です。先頭の YAML front matter で対象や目的を示し、その後の本文に作業規則を記述します。

```markdown
---
description: "Java の実装を根拠付きで読むための観点"
applyTo: "wholesale-core/src/main/java/**/*.java"
---
```

- `applyTo` は、ワークスペースからの相対パスで指定するファイルパターンです。パターン内では、OS にかかわらず `/` を使います。
- 複数のパターンは、一つの引用符付き文字列にカンマ区切りで指定できます。
- `description` は指示の目的を説明します。クライアントによっては、作業内容との関連付けにも使われます。
- `applyTo` はアクセス制御ではありません。ファイルを読む権限や、ほかの経路から指示が選ばれないことを保証するものではありません。
- 複数の Instructions が組み合わされる順序は保証されません。ファイル名や保存順を優先順位として使わず、二つの本文が矛盾しないようにします。
- `applyTo` を省略した指示や、意味に基づく選択がどのように扱われるかは、クライアントやバージョンごとに確認が必要です。このシナリオでは、Java と XML の両方に `applyTo` を明示します。

Spring XML では、次を名前の参照としてつなげて読みます。

- bean: どのクラスのオブジェクトを、どの名前で構成するか
- advice: トランザクションなどの共通処理をどのように宣言するか
- advisor / pointcut: その advice をどの処理に適用するか
- method rule (`tx:method`): メソッド名ごとの扱い

XML に宣言があることと、実行時にトランザクションやロールバックを観測したことは別です。

## 向いていること / 向いていないこと

**向いていること**

- Java と Spring XML のように、ファイル群ごとに繰り返し使う読み方が異なる
- すべてのファイルに長い注意書きを渡さず、関連する観点だけを保守したい
- 適用範囲を広げたときの過剰適用と、絞ったときの対象漏れを検討したい

**向いていないこと**

- 一度だけの依頼や、全作業に共通する短い注意
- 特定のロール名、在庫引当の結論、トランザクションに関する答えを記憶させること
- パターンを、情報保護や必ず適用される仕組みとして使うこと
- Java/XML の静的読解だけで DB 上の実動作を証明すること

指示を増やす費用が効果を上回るなら、「追加しない」も妥当な設計です。

## ゴール

1. Java 用と Spring XML 用に、適用範囲と本文が異なる二つの Instructions を設計する。
2. Java の共有ガードと XML の bean/advice/pointcut/method rule を、根拠付きで一つの説明へつなぐ。
3. 正例と負例で適用範囲を確かめ、不要な選択や対象漏れを記録する。
4. 保存、クライアント上での検出、実際の本文利用、回答内容を混同しない。

## 用意するもの

- File/task Instructions に対応した VS Code と GitHub Copilot
- 読み取り用の作業ブランチまたはワークツリー
- 次のファイルを含む対象リポジトリ

| 読む入口 | 確認すること |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `OrderService.allocate`、呼出し先、状態の前提と更新 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | サービスに共通するガード |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | ガードから委譲される判定 |
| `wholesale-core/src/main/resources/application-context.xml` | import、advice、advisor、method rule |
| `wholesale-core/src/main/resources/spring/module-operations.xml` | import される bean の定義と参照 |

適用範囲の負例には、対象リポジトリの `pom.xml` と `README.md` を使います。XML 拡張子であることだけを理由に、Maven の設定まで Spring 用 Instructions の対象にしないでください。

`starter\` には次の無効な状態の素材があります。

- [固定依頼](starter/request.txt.template)
- [Java 用 Instructions](starter/customization/hc002-java.instructions.md.template)
- [Spring XML 用 Instructions](starter/customization/hc002-xml.instructions.md.template)
- [設計ワークシート](starter/worksheet/design.md.template)
- [任意比較メモ](starter/worksheet/comparison.md.template)

すべて `.template` のままなので、このチャレンジディレクトリでは有効なカスタマイズになりません。

## 準備

1. [リポジトリ全体の始め方](../../README.md#始め方) を確認します。
2. [設計ワークシート](starter/worksheet/design.md.template) を使い、回答を見る前に次を決めます。
   - Java と XML それぞれの正例と負例
   - `module-operations.xml` を適用範囲に直接含めるか、入口から参照をたどらせるか
   - 共有ガード、状態の前提・拒否・更新、XML の参照関係のどれを本文へ残すか
   - 不要な説明、対象漏れ、過剰適用をどう観察するか
3. `starter\customization\` の二つの原稿を読み、必要な規則だけを対象リポジトリ用のコピーに残します。チャレンジ側の `.template` は編集しても有効にはせず、実際に試すときだけ、次の名前で対象リポジトリにコピーします。
   - `.github/instructions/hc002-java.instructions.md`
   - `.github/instructions/hc002-xml.instructions.md`
4. front matter と本文を混ぜず、二つの本文をどちらの順序で組み合わせても矛盾しないようにします。
5. Instructions の本文には、`allocate` の結論や、この演習でしか使わないロールやトランザクションの答えを書かないでください。

## 試してみる

### 1. 適用範囲を確かめる

本番の調査とは別に新しい会話を用意し、ファイルごとに次の同じ依頼を使います。

> このファイルの構造を一文で説明してください。読み取りだけを行い、変更や実行はしないでください。

初期テンプレートなら、次のような予測を立てられます。

| 対象 | Java 用 | XML 用 |
| --- | --- | --- |
| `OrderService.java` | 対象 | 非対象 |
| `application-context.xml` | 非対象 | 対象 |
| `module-operations.xml` | 非対象 | 対象 |
| `pom.xml` | 非対象 | 非対象 |
| `README.md` | 非対象 | 非対象 |

予測と、クライアントが示した参照や選択は分けて記録します。ファイルを明示的に添付した場合、別の Instructions から参照した場合、何も表示されなかった場合も区別してください。回答に同じ言葉が現れただけで、指示本文が自動的に使われたとは断定しません。

### 2. 固定依頼で読む

新しい会話を開始し、[request.txt.template](starter/request.txt.template) の全文をそのまま送ります。5 つの入口を同じ方法で参照できるようにします。

回答では次を確認します。

- `OrderService.allocate` から共有ガードと `Actor` の判定までたどっている
- 状態や version の前提、拒否条件、処理後の更新を分けている
- 対象の bean、advice、advisor の pointcut、method rule を名前でつないでいる
- 別のサービスの規則を `allocate` に無条件で流用していない
- ファイルとシンボル（XML では要素と属性）で重要な主張を支えている
- 事実、推論、未確認を区別している
- XML の宣言と、実行していないトランザクションやロールバックを区別している

この依頼は読み取り専用です。ソースの編集、コンパイル、テスト、データベースへの接続、サーバーの起動は行いません。

## 任意: 比較する

比較する場合は二条件だけを短く試します。

1. 二つの Instructions を置かず、固定依頼を新しい会話で実行する（Baseline）。
2. 二つの Instructions を置き、同じ固定依頼を別の新しい会話で実行する（Customized）。
3. ソース、依頼、モデル、ツール、明示的な添付方法をそろえ、[比較メモ](starter/worksheet/comparison.md.template) に差を残す。

条件が異なる場合、指示が検出されたことを観測できない場合、ほかの指示が混ざる場合は、回答の品質だけで機能の効果を断定しません。

## 確認ポイント

- Java と XML の適用範囲について、広げる利点と保守費用を説明できるか
- 二つの Instructions は業務の正解ではなく、再利用できる読み方か
- `applyTo` を ACL や排他的な除外として扱っていないか
- 保存、検出、本文利用、出力のどこまで観測できたか
- Java と XML を単に両方引用するだけでなく、参照関係を確認したか
- 宣言と実行時の事実を分け、未確認を残したか

## 発展

- 新しいサービスや XML モジュールが増えたとき、対象漏れと過剰適用がどう変わるかを設計ワークシートに追記する
- XML の適用範囲を完全一致のパスに絞る案と、ディレクトリパターンに広げる案を比較する
- `description` の言葉を変えた場合の選択を、`applyTo` の比較とは別の実験として観察する
- 二つの本文で重複している一文を削り、回答品質と保守量の変化を考える

## 制約・代替手段・安全

- File/task Instructions を利用できない場合は、二つの本文を固定依頼の前に手動で貼り付けられます。これは手動の代替手段であり、適用範囲や自動選択を確認したことにはなりません。
- クライアントに検出や参照の表示がない場合は、実際に本文が使われたかどうかを未確認のままにします。
- `applyTo` は権限を増減しません。シークレットや非公開データを指示に含めず、既存のアクセスポリシーに従います。
- XML の静的な宣言だけから、データベーストランザクション、コミット、ロールバックの実際の挙動を断定しません。
- ソース、テスト、設定は変更しません。また、この読解演習のために、新しいソフトウェアや外部ツールを導入したり、権限を変更したりしません。
- 適用範囲を確かめるために、既存の User/organization 設定や他人の Instructions を削除しません。影響を切り分けられない場合は、その制約を記録して作業を止めます。
