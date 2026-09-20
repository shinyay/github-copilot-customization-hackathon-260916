# HC-005 個人・チーム・タスクの指示を整理しよう

**言語:** **日本語** / [English](../../en/challenges/hc-005/README.md)

## シナリオ

架空の「はるか保守チーム」では、読みやすさに関する個人の好み、チームで合意した記録上の約束、その日限りの依頼が、
一つの長いメモに混在しています。そのまま再利用すると、誰に向けた文なのか、誰が変更を判断するのか、
いつ見直すのかが分からなくなります。

このシナリオでは、同じ 8 枚の合成カードを、「朝の引継ぎ」と「別チームとの共同文書」という二つの場面に合わせて
整理します。個人、チーム、タスクという分類名に機械的に振り分けるのではなく、残す、分ける、今回だけ伝える、
保留する、追加しないといった判断を、その理由とともに設計します。

## この機能とは

Custom instructions は、GitHub Copilot に繰り返し伝えたい方針を、文章として保守する仕組みです。
ここでいう適用範囲とは、「誰の、どの作業に届けたいか」という範囲です。

- **個人の指示**: 自分の読み方や作業上の好みを、複数の作業へ持ち運ぶ候補
- **チームの指示**: 合意したメンバーが共同で保守する候補。リポジトリと organization では、対象、承認、対応製品が異なる
- **タスクの依頼**: 今回の読者、目的、締切、出力形式など、その作業でだけ必要な情報

保存場所、変更の所有者、実際に Copilot が読む入口は別々に考えます。適用範囲が広いほど必ず優先される、
複数の指示が常に同じ順序で結合される、と推測してはいけません。

また、選択範囲のレビュー、コミットメッセージ、Pull Request の説明には、用途別の設定があります。
通常の Chat で一度だけ送る依頼とは別の入口です。このシナリオでは構文の草稿を作るだけで、有効化や動作確認はしません。

参考:

- [VS Code Custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
- [GitHub Organization instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-organization-instructions)

## 向いていること / 向いていないこと

**向いていること**

- 同じ説明を何度も書く前に、誰の約束か、どこまで再利用するかを整理する
- 個人の好みと、合意が必要な業務ルールを分ける
- 所有者、対象外、期限、撤去条件まで含めて指示を設計する
- 常設する利便性と、意図しない作業への混入や重複して保守する負担を比較する

**向いていないこと**

- 適用範囲の名前だけで、唯一の正解や優先順位を決める
- 一回限りの依頼にも必ず設定ファイルを追加する
- 草稿を保存したことを、Copilot による検出、本文投入、品質改善の根拠とする
- 既存の User、HOME、organization、ワークスペースの設定を書き換える

## ゴール

1. R01〜R08 をすべて検討し、対象、対象外、所有者、再利用の条件、見直す時点を説明する。
2. S1 と S2 の固定資料だけから、それぞれの読者向け短文案を作る。
3. 初回案の後に適用範囲の方針を明文化し、同じ入力を使って案を見直す。
4. 必要な指示本文と、用途別設定一つの草稿、または追加しない理由を、無効な状態で残す。
5. 保存した設計と、製品で実際に使われた事実を混同しない。

## 用意するもの

- Markdown と JSON を編集できるエディター
- 任意で Git
- AI、Java、Maven、DB、アプリの起動は不要

すべての人物、チーム、場面、発言、資料は、**SYNTHETIC_TRAINING_ONLY** の合成教材です。
`starter/` の原本は `.template` のまま保ち、作業用のコピーに記入します。

| 素材 | 用途 |
| --- | --- |
| [cards.md.template](starter/cards.md.template) | R01〜R08 の発言全文 |
| [situations.md.template](starter/situations.md.template) | S1・S2 の読者、固定資料、固定タスク |
| [request.txt.template](starter/request.txt.template) | 二つの案で共通に使う依頼 |
| [classification.md.template](starter/classification.md.template) | カードと場面別の分類票 |
| [policy.md.template](starter/policy.md.template) | 適用範囲、所有、再利用、見直しの方針票 |
| [instruction-drafts.md.template](starter/instruction-drafts.md.template) | 無効な状態の指示本文の草稿 |
| [generation-settings.json.template](starter/generation-settings.json.template) | 用途別設定キーの無効な構文例 |
| [comparison.md.template](starter/comparison.md.template) | 初回案と見直し案の比較ワークシート |

## 準備

1. [共通の始め方](../../README.md#始め方)を確認します。
2. `starter/cards.md.template`、`starter/situations.md.template`、
   `starter/request.txt.template` を最後まで読みます。
3. 比較前に評価軸を二つ以上決めます。例:
   - 対象外の読者へ届くおそれ
   - 変更時に相談する所有者が分かるか
   - 同じ文を更新する場所の数
   - 期限や例外を説明しやすいか
4. 分類票を二部コピーし、「初回案」と「方針見直し後」に分けます。
5. 原本と完成案は別に保ち、後の案を作る途中で初回案を上書きしません。

## 試してみる

### 1. 初回案を作る

1. `starter/classification.md.template` の作業用コピーへ R01〜R08 をすべて記入します。
2. 各カードについて、残す、分ける、今回だけ伝える、保留する、採用しない、のいずれも選べます。
3. 適用範囲の名前だけでなく、対象外、所有者、期限、未解決点を書きます。
4. S1-M1〜S1-M3 だけから朝の引継ぎ文案を、S2-M1〜S2-M4 だけから共同文書の紹介案を作ります。
5. 初回案を保存し、後から内容を置き換えません。

### 2. 方針を作って見直す

1. `starter/policy.md.template` のコピーへ、次を自分の言葉で書きます。
   - 個人、合意したチーム、今回の依頼を区別する基準
   - 対象と対象外
   - 所有者、合意を取る相手、見直し時点
   - 指示が衝突したときに人へ確認する条件
   - 常設化しない、または保留する基準
2. 同じカード、場面、固定依頼を使い、二部目の分類票を記入します。
3. `starter/instruction-drafts.md.template` のコピーに、必要な本文だけを書きます。
   個人・チーム・タスクの三つを必ず作る必要はありません。
4. 用途別設定を草稿にする場合は、次のうち一つだけを選び、
   `starter/generation-settings.json.template` の作業用コピーへ
   `{"text": "自分で設計した本文"}` を追加します。使わない key は削除します。
   追加しない場合は `{}` と理由を記録します。
   - `github.copilot.chat.reviewSelection.instructions`
   - `github.copilot.chat.commitMessageGeneration.instructions`
   - `github.copilot.chat.pullRequestDescriptionGeneration.instructions`
5. すべて無効な草稿として保ち、`.github`、`.vscode`、User、HOME、organization の設定にはコピーしません。

## 任意: 比較する

`starter/comparison.md.template` を使い、初回案と方針見直し後の案を手動で比べます。

- R01〜R08 と S1・S2 の全文、評価軸を変えない
- 同じカードの扱い、短文案、更新箇所、未解決事項を並べる
- 同じ人が資料を再読したことによる持ち越しの影響を記録する
- 整理されたなら「改善」、変更不要なら「同等」、例外や手間が増えたなら「悪化」でもよい

これは、初見の入力を使う A/B テストでも、Copilot の出力品質や教育効果の測定でもありません。

## 確認ポイント

- R01〜R08 の検討漏れがなく、S1 と S2 の両方を扱ったか
- 個人の好み、チームの合意、今回だけの依頼を、理由と所有者で説明できるか
- 未合意の提案を、共有済みの規則として扱っていないか
- 同じ本文を再利用する利益と、別の読者へ混ざる危険の両方を検討したか
- 分割、保留、追加なしという判断にも、見直す条件があるか
- 草稿の保存と、製品による検出、本文投入、呼び出し、出力を分けているか

## 発展

- [User 指示の保存元と隔離を確認する](optional/user-scope.md)
- [用途別生成の入口を小さく試す](optional/task-generation.md)
- [organization instructions の承認と対応範囲を確認する](optional/organization-scope.md)
- S1 と S2 の案を変えず、同じ文を二か所で更新する場合の、共通化と複製のトレードオフを考える

## 制約・代替手段・安全

- 合成教材だけを使い、実在する人、チーム、organization、既存設定を持ち込みません。
- 有効なリポジトリカスタマイズ、User instructions、organization instructions は作りません。
- AI や対象製品がなくても、エディターまたは紙を使って、分類、方針、短文案、草稿を完成できます。
- 用途別設定を実機で試せない場合も、構文草稿または追加しない理由までで完了できます。
- 既存設定の上書き、ignore 規則の変更、force-add、コミット、プッシュ、投稿は行いません。
- 製品による検出、本文投入、出力を観察していない場合は、そのまま未確認と記録します。
