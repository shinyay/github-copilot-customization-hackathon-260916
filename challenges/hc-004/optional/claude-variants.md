# `CLAUDE.local.md` と `.claude/rules/` を別々に検討する

**Language:** **日本語** / [English](../../../en/challenges/hc-004/optional/claude-variants.md)

[HC-004 本編へ戻る](../README.md)

## 目的

root `CLAUDE.md` の本編とは別に、ローカル専用の指示と path を限定した Rules を検討するための
補足ガイドです。二つは目的も観察点も異なるため、同時に有効化して一つの比較にはしません。

参考: [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)

## 前提

- 利用予定の client が対象形式に対応していることを、現在の公式資料で確認できる
- root の試行と分けた、使い捨て workspace と fresh conversation を用意できる
- 既存の repository、home、User、organization instructions の有無を確認できる
- 本編で使った model、harness、tools を変えずに試せる

## 権限・安全

- workspace または端末の所有者から、今回追加する非機密の指示だけを試す承認を得ます。
- 既存の home instructions、User 設定、organization 設定を削除・退避しません。
- secret、個人情報、実データ、業務上の答えを書きません。
- この教材 repository には active な `CLAUDE.local.md` や `.claude/rules/` を追加しません。
- root、local、Rules は一度に一つだけ試し、どの保存元が影響したか分からなくなる状態を避けます。

## 手順

### A. `CLAUDE.local.md` を検討する

1. ローカルだけで使いたい短い規則と、その理由を決めます。
2. **`local` という名前だけでは Git 除外を保証しない**ことを前提に、使い捨て checkout で
   追跡状態と除外規則を別々に確認します。

   ```powershell
   git ls-files --error-unmatch -- CLAUDE.local.md
   git check-ignore -v -- CLAUDE.local.md
   ```

3. 一方で追跡対象として表示されたか、もう一方で一致した ignore 規則が表示されたかを分けて読みます。
   無出力だけを「除外済み」の証拠にしません。
4. 承認済みの独立試行でだけ新規ファイルを作り、固定 request を fresh conversation で一度試します。
5. 終了後は、自分が追加したファイルだけを取り除きます。

Git から除外されていても、secret を保存してよいわけではありません。また、Git の状態だけでは
client による発見や本文投入は分かりません。

### B. `.claude/rules/` を検討する

1. 対象にしたい path と、対象外で観察したい path を先に決めます。
2. Rules の path 選択には `applyTo` ではなく **`paths` 配列**を使います。次は構文確認用の
   不活性な例です。

   ```yaml
   ---
   paths: ["wholesale-core/src/**/*.java"]
   ---
   ```

3. 本文には一般化できる短い規則だけを書き、受注承認の答えを含めません。
4. 承認済みの独立試行で、一致する Java file と一致しない file を別々に開きます。
5. client が示す参照元、送った request、回答を保存し、対象外でも作用したように見える場合は停止します。

## 観察すること

- 保存した path と本文
- client がどの source を発見したと表示したか
- 本文が渡ったと直接確認できる情報があるか
- local file の追跡状態と除外規則
- Rules の `paths` に一致する file / 一致しない file での違い
- root や既存の home / User / organization instructions が混ざった可能性
- 回答に表れた意図と、確認できない内部処理

同じ本文になっても、metadata、priority、発見範囲まで同一とは限りません。

## 中止条件

- client の対応状況、環境所有者の承認、分離方法のいずれかが確認できない
- 既存ファイルの上書き、ignore 規則の変更、force-add が必要になる
- root、local、Rules や複数の外部 instructions を一つずつ切り分けられない
- home の変更や既存設定の削除が必要になる
- 対象外 path への作用が疑われ、原因を説明できない

中止しても HC-004 本編は完了できます。対応していない形式は手動供給で本文だけ確認できますが、
その形式の discovery を試したことにはなりません。

## 本編へ戻る

この補足で得た観察は root `CLAUDE.md` の結果へ混ぜず、別の記録として扱ってください。
[HC-004 の手順と安全境界へ戻る](../README.md)。
