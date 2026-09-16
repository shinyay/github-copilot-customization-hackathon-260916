# HC-003 ディレクトリごとのルールを AGENTS.md で伝えよう

**Language:** **日本語** / [English](../../en/challenges/hc-003/README.md)

## Scenario

受注承認の説明を Copilot に頼むと、service の入口だけで結論を出す回答もあれば、継承元の共有処理や委譲先まで追う回答もあります。チームは「どの調査にも必要な短い規則」と「特定の directory でだけ必要な観点」を整理したいと考えています。

このシナリオの本編では、対象リポジトリの root に置く `AGENTS.md` を一つだけ設計します。directory 固有の案は設計メモに残しますが、nested AGENTS や親 repository からの発見は本編へ混ぜません。

## この機能とは

`AGENTS.md` は、対応する coding agent へリポジトリでの作業規則を伝える Markdown の指示文書です。workspace root の `AGENTS.md` には、たとえば次のようなチーム共通の習慣を置けます。

- 入口の method だけでなく、共有処理と委譲先まで読む
- 認証・認可と業務条件を分ける
- 重要な主張を file + symbol へ結び付ける
- 事実、推論、未確認を区別する

`AGENTS.md` は `.agent.md` の role 定義ではありません。新しい agent の選択肢、tool、実行権限、Java の動作を作るものではなく、自然言語の指示です。file を保存したこと、client が発見したこと、本文が実際に使われたこと、回答が改善したことは別々に確認します。

複数 directory の nested AGENTS は Experimental な機能として扱われます。親 repository から customization を見つける機能にも別の条件があります。複数文書の厳密な継承順や「常に子が優先される」といった規則を、path だけから仮定しません。本編では root の一つだけを使います。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 向いていること / 向いていないこと

**向いていること**

- 多くの調査で繰り返す短い作業規則
- 対応する複数の coding agent と共有したい repository の習慣
- 根拠、未確認事項、実行していないことの報告方法

**向いていないこと**

- 一度だけの長い依頼
- 特定の role 一覧や受注承認の正解
- access control、実行許可、model/tool の設定
- test や人の source review の代替

固定依頼だけで十分なら、`AGENTS.md` を追加しない判断にも価値があります。

## ゴール

1. root へ常設する規則と、directory 固有に見える規則を分ける。
2. root `AGENTS.md` の本文を、再利用できる短い規則へ絞る。
3. `OrderService.approve` から共有の `require` とその委譲先まで、根拠付きで読めるか確かめる。
4. 認証・認可の条件と、受注の業務条件を混同しない。
5. 指示による効果だけでなく、回答の長文化や保守量も確認する。

## 用意するもの

- root `AGENTS.md` に対応する GitHub Copilot / coding agent 環境
- 変更してよい対象リポジトリの branch または worktree
- 次の file を含む対象リポジトリ

| 読む入口 | 確認すること |
| --- | --- |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` | `approve` の入口、呼び出す guard、その後の条件 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java` | 継承元の `require` と委譲先 |
| `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java` | `require` から使われる role 判定 |

`starter\` には次の不活性な素材があります。

- [固定依頼](starter/request.txt.template)
- [root AGENTS.md の編集例](starter/customization/AGENTS.md.template)
- [設計と任意比較のワークシート](starter/worksheet/comparison.md.template)

すべて `.template` のままなので、この challenge ディレクトリでは active customization になりません。

## 準備

1. [リポジトリ全体の始め方](../../README.md#始め方) を確認します。
2. 回答を見る前に、観察する項目を 2〜3 個に絞ります。例:
   - 共有処理と委譲先まで追ったか
   - 引用先が主張を支えているか
   - 認証・認可と業務条件を分けたか
   - 未確認事項を残したか
3. [ワークシート](starter/worksheet/comparison.md.template) に、root へ置く共通規則の候補と、directory 固有として今回は置かない候補を書き分けます。
4. [AGENTS.md.template](starter/customization/AGENTS.md.template) を編集開始点にし、今回だけの答え、role の対応表、環境固有情報を除きます。challenge 側は `.template` のまま残します。
5. 実際に試すときだけ、選んだ本文を対象リポジトリの root `AGENTS.md` へコピーします。既存の `AGENTS.md` がある場合は上書きせず、内容と所有者を確認して止めます。
6. 本編では nested AGENTS、親 repository の customization、別形式の Instructions、settings 変更を追加しません。

## 試してみる

1. 対象リポジトリの root を workspace root として開きます。
2. 新しい会話を開始し、[request.txt.template](starter/request.txt.template) の全文をそのまま送ります。
3. Copilot が必要な file を読み取れるようにしますが、`starter\` の原稿や比較メモを業務ロジックの根拠として渡しません。
4. 回答を次の順で source と照合します。
   - `OrderService.approve` 内の呼出し
   - `BaseService.require` の定義
   - `require` が委譲する `Actor` の判定
   - null や早期 return の分岐
   - 認証・認可を通る条件と、受注の業務条件
5. 保存した path、client が示した発見、本文利用を確認できる表示、最終回答を分けて記録します。よい回答が出たことだけから、本文が自動で使われたとは推定しません。

この本編は静的な読解です。Java test、DB、Web、batch を起動せず、source、test、設定を変更しません。

## 任意: 比較する

比較する場合は、二つの新しい会話で短く行います。

1. 対象リポジトリに root `AGENTS.md` がない状態で固定依頼を試す（Baseline）。
2. 選んだ本文の root `AGENTS.md` だけを追加し、同じ固定依頼を試す（Customized）。
3. source、model、tools、参照方法をそろえ、[ワークシート](starter/worksheet/comparison.md.template) に差を残します。

本文を設計するために使った試行は比較へ流用しません。条件がそろわない、他の指示が混ざる、発見を観測できない場合は、機能の効果を断定しません。

## 確認ポイント

- root へ置いた規則は別の調査にも使えるか
- directory 固有の観点を root へ詰め込みすぎていないか
- `AGENTS.md` を role 定義や権限設定として説明していないか
- method 内の role 文字列だけで結論を出さず、共有処理まで追ったか
- 認証・認可と受注の業務条件を分けたか
- 事実、推論、未確認を file + symbol 付きで示したか
- 指示の保存、発見、本文利用、回答を区別したか
- 読み落としだけでなく、長文化や保守の負担も確認したか

## 発展

- [入れ子の AGENTS.md を別環境で探索する](optional/nested-discovery.md)
- [親 repository からの customization 発見を探索する](optional/parent-discovery.md)
- root の一文を削る設計案を作り、失われる注意と保守しやすさを比べる
- `service` と `common` に固有の候補を紙上で分け、どこまで root へ一般化できるか考える

任意ガイドは本編と分け、対応状況、所有者の許可、安全な使い捨て環境を確認できる場合だけ試します。

## 制約・Fallback・安全

- root `AGENTS.md` の利用を確認できない場合は、同じ本文を固定依頼の前に手動で貼れます。これは手動 fallback であり、root からの発見を確認したことにはなりません。
- client に発見や参照の表示がない場合は、本文利用を未確認のままにします。
- 実在する利用者や受注の承認可否を判断せず、実データ、認証情報、secret を使いません。
- DB、Web、batch、Java test を起動せず、未実行の検証を成功と書きません。
- 既存の `AGENTS.md`、User/organization 設定、Memory、他人の customization を削除または退避して条件を作りません。
- nested/parent 機能を本編へ混ぜず、試す場合は任意ガイドに従って別の使い捨て環境で行います。
