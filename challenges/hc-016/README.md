# HC-016 役立つ記憶だけを残し、古い記憶を捨てよう

**Language:** **日本語** / [English](../../en/challenges/hc-016/README.md)

## Scenario

受注承認の権限処理を引き継ぐたびに、担当者は同じ二つの `require` を読み直しています。短いメモがあれば便利ですが、古い引用、広すぎる scope、別 workspace の情報まで残すと、次の担当者を誤らせます。

この演習では実際の Memory を操作せず、**毎回 source へ戻る案**と、**根拠付きのメモ候補を選別して保守する案**を設計します。保存候補をゼロにする結論も正解です。

## この機能とは

ここで扱う「記憶」は、後の作業で参照する可能性がある短い repository fact です。常に正しい知識として扱わず、根拠、scope、確認した版、再確認条件と一緒に管理します。

| 仕組み | この演習での区別 |
|---|---|
| 会話 | 現在のやり取りの文脈。永続的に保存されたことは示さない |
| Instructions | 人が書いた適用ルール。事実の鮮度管理とは別 |
| VS Code local Memory | User / Repository / Session scope を持つ local の仕組み |
| GitHub Copilot Memory | cloud agent、code review、CLI などが repository facts を扱う仕組み |
| Copilot App の記憶 | 上記とは別の記憶面。この演習からは操作しない |

「`BaseService.require` は null actor を拒否する」というメモも、現在の source、対象 scope、再確認条件がなければ安全に再利用できません。「記憶しました」という応答だけで、保存、持続、別会話での再参照を確認したことにはなりません。

参考:

- [Use memory with agents in VS Code](https://code.visualstudio.com/docs/agents/run/memory)
- [About GitHub Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory)

## 向いていること / 向いていないこと

**向いていること**

- source へ戻れる短い fact 候補を、scope・引用・鮮度と一緒に設計する
- 保存しない情報と、判断を保留する情報を説明する
- 更新、撤回、再確認の担当と trigger を決める
- 古いメモや別 scope のメモを現在の source と照合する

**向いていないこと**

- 個人の好み、実在人物の権限、secret、第三者情報を収集する
- メモがあれば source を読まなくてよいと保証する
- Memory の有効・無効による品質差を測定済みと主張する
- 比較のために既存の記憶や User 設定を一括削除する

## ゴール

次を説明できる引継ぎ案を作ります。

1. source から毎回確認する情報と、短いメモ候補にできる情報
2. 残す・残さない・保留する判断と、その scope
3. 根拠、鮮度、再確認 trigger、更新・撤回方法
4. 古い候補、広すぎる候補、無関係な候補の扱い
5. 実 Memory を使わなくても成立する fallback

## 用意するもの

- GitHub Copilot Chat または agent を利用できるエディター
- Markdown と text を編集する手段
- 任意: 次の Java source を読める workspace
  - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java`
  - `wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java`
- この directory の `starter/`

`starter/` にはすべて不活性な `.template` として次を用意しています。

- [固定依頼](starter/request.txt.template)
- [固定 fact](starter/materials/memory-fact.txt.template)
- [4 枚の候補カード](starter/materials/cards.md.template)
- [source map](starter/materials/source-map.md.template)
- [設計用紙](starter/worksheets/design.md.template)
- [カードレビュー用紙](starter/worksheets/card-review.md.template)
- [引継ぎ原稿](starter/worksheets/handoff.txt.template)

## 準備

1. Repository 全体の共通準備は [#始め方](../../README.md#始め方) を参照します。
2. `starter/` の `.template` はそのまま残し、記入用のコピーを任意の作業場所へ作ります。
3. Java source を読める場合は、source map の二つの symbol を確認します。
4. Java source を読めない場合は、固定 fact をこの演習の有限入力として使います。実行結果や過去の設計理由は補いません。
5. Memory、User 設定、既存メモは変更しません。

固定 fact は次の 6 行です。

```text
教材用の固定事実。対象はこの演習用repositoryだけであり、個人の好みではない。
BaseService.requireはactorがnullならauthentication.requiredを送出し、それ以外はActor.requireへ委譲する。
Actor.requireはADMINを許可し、そうでなければ指定されたroleのどれかを要求する。
根拠: wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/BaseService.java の require、
wholesale-core/src/main/java/jp/co/tsubame/wholesale/common/Actor.java の require。
これは固定ソースの読解であり、Java/DB実行や実際の利用者の権限を確認した結果ではない。
```

候補カードは次の役割を持ちます。

| カード | 内容 |
|---|---|
| `card-p` | 現在の固定 fact と source 参照を持つ候補 |
| `card-q` | null actor を許可すると書いた、意図的に誤った合成候補 |
| `card-r` | 正しい fact に User 全体の広い scope を付けた合成候補 |
| `card-s` | 別の架空 workspace の無関係な候補。`KEEP-UNCHANGED` を保つ |

## 試してみる

1. **読み取り経路を分ける**
   source から読む経路、固定 fact を手動で渡す経路、将来 Memory から参照する経路の違いを設計用紙へ書きます。三つ目はこの演習では実行しません。
2. **候補を選別する**
   各カードについて、主張、source の支持、scope、鮮度、残す・残さない・保留、再確認 trigger を記録します。
3. **保守方法を決める**
   source が変わった、引用が主張を支持しない、scope が広がった、という場合の更新・撤回・停止方法を決めます。全消去は fallback にしません。
4. **引継ぎ原稿を作る**
   候補 fact、source path と symbol、scope、再確認 trigger、担当、意図的に残さない情報、未確認事項を短くまとめます。
5. **Copilot にレビューを依頼する**
   固定依頼、固定 fact、カード、記入した用紙を渡し、実 Memory を操作せず、根拠と未確認を保ったレビューだけを依頼します。
6. **人が source へ戻って確認する**
   Copilot の提案を正解扱いせず、card-p / q / r の主張と card-s の非対象性を確認します。

## 任意: 比較する

同じ固定入力を使い、別々の新しい会話で次を手動比較できます。

- 案 A: 永続メモを作らず、毎回 source map から確認する
- 案 B: 選別した不活性な引継ぎ原稿を先に読み、必要な箇所だけ source で再確認する

source へ戻りやすいか、誤情報を残す risk、scope の狭さ、再確認と保守の負担を比べます。順序効果や会話の残留を分離できない場合は、優劣を断定しません。

## 確認ポイント

- 会話、Instructions、各 Memory の違いを説明できる
- fact に source path、symbol、scope、未確認事項が付いている
- 保存ゼロを含む採否に理由がある
- card-q を source と照合し、card-r の scope を検討している
- card-s をこの演習の都合で変更・削除していない
- 実保存、持続、別会話での再参照を観測済みと書いていない

## 発展

- [VS Code local Memory を試す前の探索ガイド](optional/local-memory.md)
- 新しい合成カードを 1 枚作り、「source が変わった」「引用が主張を支持しない」「scope が広がった」のいずれか一つを再確認 trigger にする

## 制約・Fallback・安全

- この演習では Memory の保存、読出し、更新、削除、全消去を行いません。
- 個人情報、secret、実在人物の権限、private log を候補にしません。
- Java source を読めなければ固定 fact と source map だけで設計を完了できます。
- 利用中の client が Memory に対応しなくても、選別、scope、鮮度、保守の設計までで完了できます。
- 既存メモを分離できない、自分の候補だけを安全に戻せない、全消去が必要な場合は live 操作へ進みません。
- 整理するのは自分で作った作業コピーだけです。既存 Memory、User 設定、他人のメモ、source は削除しません。
