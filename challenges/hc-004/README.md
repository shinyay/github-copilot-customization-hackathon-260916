# HC-004 `CLAUDE.md` 形式の指示を安全に試そう

## Scenario

チームから「別の対応ツールで使っている短い作業規則を、GitHub Copilotでも再利用したい」と相談されました。
名前を `CLAUDE.md` に変えるだけで十分でしょうか。

このシナリオでは、受注承認コードを読むための短い規則を自分で設計し、repository root の
`CLAUDE.md` から利用します。ファイルを保存したこと、client が発見したこと、会話へ本文が渡ったこと、
回答に意図が表れたことを分けて確認します。

## この機能とは

対応する VS Code / GitHub Copilot は、repository root の `CLAUDE.md` を custom instructions の
互換形式として扱えます。同じ調査姿勢を繰り返し伝える用途では、毎回長い前置きを貼る手間を減らせます。

ただし、ファイル名によって Claude モデルや別の harness へ切り替わるわけではありません。
モデル、tool、承認、OS、filesystem の権限も変わりません。また、同じ本文でも保存場所による発見範囲や
優先順位まで同一とは限りません。本編では混同を避けるため、root の `CLAUDE.md` 一つだけを扱います。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 向いていること / 向いていないこと

**向いていること**

- 複数の調査で繰り返す、短く一般化できる作業規則
- 根拠、推論、未確認事項の分け方など、回答の作り方を共有すること
- 既存の互換形式を再利用する価値と保守負担を確かめること

**向いていないこと**

- 今回だけの依頼、特定利用者の判断、業務上の正解を常設すること
- モデル性能や別 harness の比較
- tool 権限、承認、filesystem 権限を追加すること
- secret、個人情報、実データを保存すること

## ゴール

1. 受注承認の調査に再利用できる短い規則を一つ、必要なら二つまで設計する。
2. その本文だけを root `CLAUDE.md` として明示的に試す。
3. 固定依頼への回答が、指定した source を追い、認証・認可と業務条件を分けているか確認する。
4. 保存・発見・本文投入・出力を混同せず、確認できない段階を未確認のまま残す。

## 用意するもの

- Git
- `CLAUDE.md` に対応する VS Code / GitHub Copilot
- [始め方](../../README.md#始め方) で用意した runtime workspace
- upstream template revision:
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`

runtime workspace が GitHub template から作られた repository の場合、独自の commit history を持ちます。
上記 revision は教材 source の由来を示すもので、runtime workspace の local `HEAD` が
`8f0b3aa25c4f33facdea691642c2f1cb3901391c` と一致することは確認条件ではありません。
revision へ checkout/reset せず、workspace にすでにある対象ファイルを使います。

`starter/` にはすべて不活性な `.template` として、次の素材があります。

| 素材 | 用途 |
| --- | --- |
| [brief.md.template](starter/brief.md.template) | upstream template の由来と runtime workspace で追跡する問い |
| [request.txt.template](starter/request.txt.template) | 変更せず使う固定依頼 |
| [CLAUDE.md.template](starter/CLAUDE.md.template) | 自分で完成させる短い指示の原稿 |
| [comparison.md.template](starter/comparison.md.template) | 任意比較と観察のワークシート |

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. runtime workspace の root を workspace root として開き、`starter/brief.md.template` にある三ファイルを
   読めることを確認します。local `HEAD` と upstream template revision の一致は求めません。
3. root に既存の `CLAUDE.md` がある場合は上書きせず、手動供給の fallback で進めます。
4. `starter/brief.md.template` と `starter/request.txt.template` を読みます。
5. `starter/CLAUDE.md.template` の括弧書きを、自分で選んだ短い規則へ置き換えます。
   固有の承認可否、role の答え、今回だけの依頼、secret は含めません。
6. 使用する client、model、tools を記録し、試行中は変えないようにします。

この教材 repository には active な `CLAUDE.md` を追加しません。完成本文を試すのは runtime workspace の
root だけです。

## 試してみる

1. 完成させた原稿の本文を、runtime workspace の新しい root `CLAUDE.md` へコピーします。
2. repository root を開き、新しい会話を開始します。
3. `starter/request.txt.template` の全文を変更せずに送ります。
4. 最初の回答を修正せず保存し、次を確認します。
   - `OrderService.approve` から `BaseService.require`、さらに `Actor.require` の分岐まで追っているか
   - 認証・認可と受注の業務条件を別の根拠として説明しているか
   - fact、推論、未確認事項を file + symbol 付きで分けているか
   - 実行していない DB、Web、batch、test を成功したと書いていないか
5. client に参照した instructions の表示がある場合は、その表示を記録します。ファイルが存在するだけで、
   本文が会話へ渡ったと断定しません。
6. 終了後は、自分が作成した root `CLAUDE.md` だけを runtime workspace から取り除きます。

## 任意: 比較する

短い手動セルフチェックとして、fresh conversation で次の三つを比べられます。

| 条件 | 送るもの |
| --- | --- |
| 追加なし | 固定依頼だけ |
| root `CLAUDE.md` | 完成本文を root に置き、固定依頼だけ |
| 手動供給 | root ファイルを置かず、同じ完成本文の後に固定依頼 |

runtime workspace の対象ファイル、upstream template revision、固定依頼、client、model、tools は
そろえます。local `HEAD` の一致は条件にしません。手動供給は discovery の代替確認にはなりません。
結果は `starter/comparison.md.template` のコピーへ記録してください。

## 確認ポイント

- 指示本文の意図と、`CLAUDE.md` という保存形式の役割を分けて説明できるか
- role 文字列一つで結論を出さず、共有ガードと業務条件を最後まで追えているか
- 保存、発見、本文投入、出力のうち、実際に観察できた範囲だけを主張しているか
- 同じ規則を複数場所へ置く場合の正本、更新担当、削除条件を決められるか
- 「追加なし」や手動依頼の方が保守しやすい場合、その結論も受け入れられるか

## 発展

- [`CLAUDE.local.md` と `.claude/rules/` を別々に検討する](optional/claude-variants.md)
- 同じ本文を二か所で管理すると仮定し、更新漏れを検出する方法と、どちらを正本にするかを考える
- 調査対象を別の method に替え、固有の答えを含まない規則として再利用できるか確認する

## 制約・Fallback・安全

- 静的な source 読解だけを行い、DB、Web、batch、アプリ、test を起動しません。
- source、既存 test、設定を変更しません。実在の利用者や受注の承認可否を判断しません。
- home、User、organization、Memory 由来の既存指示は削除・退避しません。影響を切り分けられない場合は、
  比較不能として記録します。
- `CLAUDE.md` が非対応なら、完成本文を固定依頼の直前に手動で貼って学習できます。ただし、
  root ファイルの発見や自動投入を確認したことにはなりません。
- runtime workspace に対象ファイルがない場合は `starter/brief.md.template` で追跡手順を設計できますが、
  実装を読んだ結果として扱いません。
