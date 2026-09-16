# HC-028 Copilot が読んだ Instructions の版を突き止めよう

## Scenario

同じ Instructions が base、head、default、starting ref に存在すると、「保存されている版」「製品仕様上参照される版」「今回の観測で特定できた版」が混ざりやすくなります。

このシナリオでは、すべて `SYNTHETIC_TRAINING_ONLY` の固定資料を使い、候補 diff の内容や回答の言語から採用版を推測せずに attribution を監査します。

## この機能とは

版の監査では、少なくとも次の 3 層を分けます。

- **Stored revision**: どの ref にどの file bytes が保存されているか
- **Documented rule**: 対象製品がどの ref を使うと公式に説明しているか
- **Observed attribution**: 今回の記録が対象 revision と Instructions 版を直接示しているか

`base`、`head`、`default`、`starting` は用途の違う ref です。たとえば code review の head 規則を Cloud Agent や別の automation に一般化してはいけません。

## 向いていること / 向いていないこと

**向いていること**

- ref ごとの Instructions bytes と hash を台帳化する
- 製品仕様と個別の観測を分離する
- old head の記録を現在の対象へ流用しない
- task diff と Instructions diff を別々に扱う

**向いていないこと**

- 回答言語や自己申告から採用版を逆算する
- 保存 hash を実際に投入された版の証拠と呼ぶ
- 対象 file や revision が不明な記録を推測で埋める
- 合成 attribution を実製品の観測結果として扱う

## ゴール

4 つの合成 ref、2 つの diff、3 種類の attribution 記録を調べ、次を説明できる監査結果を作ります。

1. 保存されている版
2. 製品ごとの文書化された規則
3. 今回直接確認できた attribution
4. old head と unknown を判定する基準
5. task 変更と customization 変更の分離

## 用意するもの

`starter/` にすべての固定入力があります。

- `request.md.template`: 固定依頼
- `refs/*.md.template`: base / head / default / starting の合成 Instructions
- `ref-register.md.template`: body hash と file hash の台帳
- `product-rules.md.template`: 製品別規則の境界
- `attribution-records.md.template`: revision-identified / old-head / unknown の合成記録
- `diffs/*.diff.template`: task diff と customization diff
- `design.md.template`: 監査方法の設計票
- `worksheets/comparison.md.template`: 任意比較用の記録票

合成 ref ID は実 Git SHA ではなく、diff は適用しません。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/` のファイルを読み、すべての `SYNTHETIC_TRAINING_ONLY` 表示を保持します。
2. `.template` ファイルは不活性な教材として扱い、`.github/**` へ配置しません。
3. hash を再計算する場合は、本文だけの hash と frontmatter を含む file 全体の hash を分けます。

## 試してみる

1. `request.md.template` を読み、最初に `design.md.template` の監査基準を埋めます。
2. `refs/` の 4 ファイルを `ref-register.md.template` と照合します。
3. `product-rules.md.template` を使い、製品・asset・参照 ref・適用範囲を整理します。
4. `attribution-records.md.template` の各記録について、次を別欄にします。
   - 対象 revision
   - 主張された Instructions ref
   - 直接観測された Instructions hash
   - 推論
   - unknown の理由
5. `diffs/task.diff.template` と `diffs/config.diff.template` を、path・目的・hash が混ざらないように整理します。
6. 証拠が競合または欠測した場合は、断定せず `old-head` または `unknown` で止めます。

## 任意: 比較する

`worksheets/comparison.md.template` を使い、監査方法を決めずに読む **Baseline** と、先に監査方法を固定した **Customized** を手動で比較できます。同じ資料を使い、Customized にだけ追加の答えや実製品ログを与えないでください。

## 確認ポイント

- Stored revision / Documented rule / Observed attribution を別欄にしたか
- base / head / default / starting を同一視していないか
- old head を現在の対象へ流用していないか
- body hash と file hash を区別したか
- task diff と customization diff を分離したか
- 不明な版を回答内容から補完していないか
- 合成記録を実製品の観測へ昇格させていないか

## 発展

- 合成 head が 1 回進んだ追加記録を作り、以前の attribution を無効化する規則を試す
- 実際の code review で attribution を観測する準備は [標準 review attribution の補足ガイド](optional/review-attribution.md) を使う

## 制約・Fallback・安全

- 実 PR、Cloud Agent、code review、branch、repository 設定は作成・変更しません。
- private repository 名、actor、実 review log などを教材へ貼りません。
- 実製品を利用できなくても、合成資料だけで監査を完了できます。
- attribution が対象 file や revision を直接示さない場合は `not-observed` のままにします。
