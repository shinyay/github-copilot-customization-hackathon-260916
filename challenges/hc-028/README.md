# HC-028 Copilotが読んだInstructionsのバージョンを突き止めよう

**言語:** **日本語** / [English](../../en/challenges/hc-028/README.md)

## シナリオ

同じ Instructions が base、head、default、starting の各 ref に存在すると、「保存済みのリビジョン」「製品仕様で参照されるリビジョン」「今回の観測で特定できたリビジョン」を混同しやすくなります。

このシナリオでは、すべて `SYNTHETIC_TRAINING_ONLY` の固定資料を使います。候補となる差分の内容や回答の言語から採用リビジョンを推測せず、attribution を監査します。

## この機能とは

リビジョンの監査では、少なくとも次の 3 層を分けます。

- **Stored revision**: どの ref に、どのファイルのバイト列が保存されているか
- **Documented rule**: 対象製品がどの ref を使うと公式に説明しているか
- **Observed attribution**: 今回の記録が対象リビジョンと Instructions のリビジョンを直接示しているか

`base`、`head`、`default`、`starting` は用途が異なる ref です。たとえば、Copilot code review における head の規則を Cloud Agent や別の automation に一般化してはいけません。

## 向いていること / 向いていないこと

**向いていること**

- ref ごとの Instructions のバイト列とハッシュを台帳にまとめる
- 製品仕様と個別の観測結果を分ける
- 古い head の記録を現在の対象へ流用しない
- タスクの差分と Instructions の差分を分けて扱う

**向いていないこと**

- 回答言語や自己申告から採用リビジョンを逆算する
- 保存時のハッシュを、実際に投入されたリビジョンの根拠とみなす
- 対象ファイルやリビジョンが不明な記録を推測で埋める
- 合成 attribution を実際の製品の観測結果として扱う

## ゴール

4 つの合成 ref、2 つの差分、3 種類の attribution 記録を調べ、次の点を説明できる監査結果を作ります。

1. 保存済みのリビジョン
2. 製品ごとの文書化された規則
3. 今回直接確認できた attribution
4. 古い head と unknown を判定する基準
5. タスクの変更と customization の変更の切り分け

## 用意するもの

`starter/` にすべての固定入力があります。

- `request.md.template`: 固定依頼
- `refs/*.md.template`: base / head / default / starting の合成 Instructions
- `ref-register.md.template`: 本文のハッシュとファイル全体のハッシュを記録する台帳
- `product-rules.md.template`: 製品別規則の境界
- `attribution-records.md.template`: revision-identified / old-head / unknown の合成記録
- `diffs/*.diff.template`: タスクの差分と customization の差分
- `design.md.template`: 監査方法の設計票
- `worksheets/comparison.md.template`: 任意比較用の記録票

合成 ref ID は実際の Git SHA ではなく、差分は適用しません。

## 準備

共通の準備は [始め方](../../README.md#始め方) を参照してください。

1. `starter/` のファイルを読み、すべての `SYNTHETIC_TRAINING_ONLY` 表示を保持します。
2. `.template` ファイルは不活性な教材として扱い、`.github/**` へ配置しません。
3. ハッシュを再計算する場合は、本文だけのハッシュと frontmatter を含むファイル全体のハッシュを分けます。

## 試してみる

1. `request.md.template` を読み、最初に `design.md.template` の監査基準を埋めます。
2. `refs/` の 4 ファイルを `ref-register.md.template` と照合します。
3. `product-rules.md.template` を使い、製品、アセット、参照 ref、適用範囲を整理します。
4. `attribution-records.md.template` の各記録について、次を別欄にします。
   - 対象リビジョン
   - Instructions の参照元として主張された ref
   - 直接観測した Instructions のハッシュ
   - 推論
   - unknown の理由
5. `diffs/task.diff.template` と `diffs/config.diff.template` を、パス、目的、ハッシュが混ざらないように整理します。
6. 根拠が競合している場合や不足している場合は、断定せず `old-head` または `unknown` で止めます。

## 任意: 比較する

`worksheets/comparison.md.template` を使い、監査方法を決めずに読む **Baseline** と、先に監査方法を固定する **Customized** を手動で比較できます。同じ資料を使い、Customized だけに追加の答えや実際の製品のログを与えないでください。

## 確認ポイント

- Stored revision / Documented rule / Observed attribution を別々の欄に記録したか
- base / head / default / starting を同一視していないか
- 古い head を現在の対象へ流用していないか
- 本文のハッシュとファイル全体のハッシュを区別したか
- タスクの差分と customization の差分を分けたか
- 不明なリビジョンを回答内容から補完していないか
- 合成記録を実際の製品の観測へ昇格させていないか

## 発展

- 合成 head を 1 回更新した追加記録を作り、以前の attribution を無効にする規則を試す
- 実際の Copilot code review で attribution を観測する準備には、[Copilot code review の attribution に関する補足ガイド](optional/review-attribution.md) を使う

## 制約・代替手段・安全

- 実 PR、Cloud Agent、Copilot code review、ブランチ、リポジトリ設定は作成・変更しません。
- 非公開リポジトリ名、実行者、実際のレビュー記録などを教材へ貼り付けません。
- 実際の製品を利用できなくても、合成資料だけで監査を完了できます。
- attribution が対象ファイルやリビジョンを直接示さない場合は、`not-observed` のままにします。
