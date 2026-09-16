# HC-017 タスクに合うモデルと推論量を選ぼう

## Scenario

受注承認の固定分析を短い表へ整理するとき、「新しいモデルだから正確」「推論量を上げたから安全」と先に結論すると、入力差、tool 差、未確認の補完を見落とします。モデルを変える比較と、同じモデルで Thinking Effort だけを変える比較も別の実験です。

この演習では、利用中の環境ですでに承認されている候補だけを使い、同じ 7 行、同じ初回依頼、同じ追問を保って選択方法を設計します。候補が足りない場合は、実行せず設計だけで完了できます。

## この機能とは

**モデル選択**は依頼を処理する推論器の選択、**Thinking Effort**は対応する同一モデル内の推論設定です。Instructions、tools、添付文脈、provider を同時に変えると、モデルまたは effort だけの差とは言えません。

要求したモデル名、picker の表示名、応答上で確認できる表示、provider、内部実装 ID は同じとは限りません。観測できない値は未知のままにします。Auto は request ごとに routing が変わる可能性があるため、controlled comparison には使いません。

参考: [AI language models in VS Code](https://code.visualstudio.com/docs/agent-customization/language-models)

## 向いていること / 向いていないこと

**向いていること**

- 同じ固定入力で、モデルと effort を別々の factor として比較する
- 根拠保持、入力にない追加、修正負担、欠測を記録する
- モデルを切り替えない、高い effort を使わない判断を説明する
- 表示不足や残留を分離できない比較を、比較不能として止める

**向いていないこと**

- Auto、provider、credential、組織 policy を変更して候補を作る
- 異なるモデル間の effort label を同じ計算量とみなす
- 出力量、長い思考表示、単発のよい回答だけで精度を証明する
- 内部思考全文、秘密ログ、未承認 provider へ送った private code を収集する

## ゴール

次を満たす選択・比較方法を作ります。

1. モデル差と effort 差を別々に扱う
2. 固定入力、依頼、追問、tools、context を揃える
3. 要求値と観測できた表示を分け、未知値を補わない
4. 固定分析の 6 観点を人が照合する
5. 候補不足、表示不足、設定 drift で止める条件を決める
6. 切替不要または設計のみという結論を有効に扱う

## 用意するもの

- GitHub Copilot Chat または agent を利用できるエディター
- 利用中の環境で承認済みのモデル候補
- 任意: 同じモデルで選択できる二つの Thinking Effort
- この directory の `starter/`

`starter/` にはすべて不活性な `.template` として次を用意しています。

- [固定の初回依頼](starter/request.txt.template)
- [固定 7 行](starter/materials/model-input.txt.template)
- [固定の追問](starter/materials/follow-up.txt.template)
- [source map](starter/materials/source-map.md.template)
- [手動比較 protocol](starter/materials/comparison-protocol.md.template)
- [設計用紙](starter/worksheets/design.md.template)
- [controls 記録用紙](starter/worksheets/controls.md.template)
- [応答レビュー用紙](starter/worksheets/responses.md.template)

## 準備

1. Repository 全体の共通準備は [#始め方](../../README.md#始め方) を参照します。
2. `starter/` の `.template` はそのまま残し、記入用のコピーを任意の作業場所へ作ります。
3. 利用可能なモデル、同一モデル内の effort、表示できる provider / effort 情報を確認します。
4. 比較中に固定する tools、Instructions、添付文脈、承認方法を決めます。
5. 候補や表示が不足する場合は、架空の名前や応答を作らず、設計のみへ切り替えます。

固定分析は次の exact 7 行です。

```text
この固定入力はモデル比較用の教材であり、前のラボの回答ではない。
確認したソース: OrderService.approve、BaseService.require、Actor.require、Checks.version。
静的に読めること: actorがnullなら拒否する。MANAGERまたはADMINが権限検査を通る。
expectedVersionが実際のversionと一致しなければ拒否する。状態はSUBMITTEDを要求する。
起票者本人による承認は禁止で、ADMINもこの業務条件を省略しない。
activeと与信の検査を通った後にAPPROVED、承認者、承認日時を設定する。
Java/DBは未実行。実環境の認証・transaction適用・過去の設計理由はこの入力では確定しない。
```

初回依頼:

> 固定分析全文だけを使い、条件・拒否時・根拠 / 未確認の表へ整理してください。入力にない業務事実や実行結果を補わないでください。

追問:

> 元の固定分析と照合し、抜け・入力にない追加・未確認の断定があれば直してください。新しい業務事実を追加せず、修正箇所を示してください。

## 試してみる

1. **事前条件を記録する**
   要求するモデル、実際に見えた表示、provider、要求・観測 effort、adaptive の見え方、tools、Instructions、添付文脈を controls 用紙へ書きます。
2. **モデル比較を設計する**
   承認済みモデル A / B に対して、固定 7 行、初回依頼、追問、tools、context、可能な範囲の effort 条件を同じにします。
3. **effort 比較を別に設計する**
   同じモデル E、同じ provider、同じ入力と tools のまま、実際に選べる effort e1 / e2 だけを変えます。モデル比較の応答を再利用しません。
4. **新しい会話を使う**
   各試行は新しい会話で始め、他の試行の応答、要約、評価を渡しません。入力順も揃えます。
5. **固定依頼を実行する**
   可能な試行だけ、固定 7 行と初回依頼を全文で渡します。必要な場合は同じ試行内で固定追問を一度だけ使い、初回と追問後を分けて保存します。
6. **6 観点を人が確認する**
   actor / role、version / SUBMITTED、自己承認 / ADMIN、active / 与信、更新項目、未確認事項について、保持・欠落・入力外追加・要修正を記録します。
7. **停止または採用を判断する**
   根拠保持、修正負担、欠測、観測可能な時間や使用量を見ます。内部思考全文や未表示の token 数は推測しません。

## 任意: 比較する

承認済み候補と必要な表示が揃う場合だけ、[手動比較 protocol](starter/materials/comparison-protocol.md.template) に沿って比較します。

- モデル比較: モデル A と B だけを変える
- effort 比較: 同じモデル E で e1 と e2 だけを変える

二つは別の比較です。モデル、provider、adaptive、tools、context のいずれかが意図せず変わった場合、その結果を単一 factor の効果として扱いません。

## 確認ポイント

- モデル選択と Thinking Effort を区別している
- exact 7 行、初回依頼、追問を変えていない
- モデル比較と effort 比較を分離している
- 要求名と観測表示、provider、未知値を分けている
- 6 観点を元の固定分析へ戻って確認している
- 欠測を除外したり、Auto や合成応答で埋めたりしていない
- 同等、悪化、追加不要、比較不能、未観測を有効な結論としている

## 発展

- [BYOK provider を評価する探索ガイド](optional/byok-provider.md)
- [utility model 経路を観察する探索ガイド](optional/utility-models.md)
- [Agent Host で BYOK を評価する探索ガイド](optional/host-byok.md)
- 「どの観測ならモデルや effort を切り替えないか」という停止規則を一つ追加する

## 制約・Fallback・安全

- 組織 policy、trust、provider、API key、Custom Endpoint、User 設定は変更しません。
- 未承認 provider へ固定 7 行や private code を送りません。
- Auto、架空モデル、架空 effort、合成応答で空欄を埋めません。
- 内部思考全文、secret、秘密 endpoint、生の private transcript を記録しません。
- モデル候補が二つない、同一モデルの effort が二つない、実効表示を確認できない場合は設計だけで完了できます。
- 比較中にモデルや provider が drift した場合は、限定的な観察として残し、単一 factor の差を断定しません。
- 終了時に戻すのは自分が変更したモデルまたは effort の選択だけです。既存 provider、credential、User 設定は削除しません。
