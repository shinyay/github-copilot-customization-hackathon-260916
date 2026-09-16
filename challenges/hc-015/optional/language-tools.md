# Java の文字列検索と定義・参照を分けるガイド

**Language:** **日本語** / [English](../../../en/challenges/hc-015/optional/language-tools.md)

[HC-015 本編へ戻る](../README.md)
## 目的

固定 query `allocate` について、文字列検索と Java 言語サービスによる定義・参照解決を分けて観察します。
手動で全文を渡すことは言語サービスの再現ではありません。人の Go to Definition / Find All References と、
Agent が Usages を使った結果も別々に扱います。

## 前提

- HC-015 本編とは別の workspace と新しい会話を使えること。
- 公開upstream template revision
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`
  を出所とするsourceを、templateから作成したruntime workspaceで読めること。
- runtime workspaceのlocal `HEAD` をupstream revisionと比較しないこと。
- 対応する Java 拡張が既に導入され、初期化状態と版を確認できること。
- 同じ query、source、tabs、selection、model、利用可能な tools を保てること。
- Copilot と教材 source の利用資格を確認できること。

Java 拡張や JDK がない場合、このガイドのために自動導入しません。

## 権限と安全

- エディター操作や Agent の Usages 利用は、環境所有者が許可した範囲に限定します。
- source、既存拡張、User/Profile、workspace 設定を変更しません。
- 追加 source が必要な場合は、その読取権限を別に確認します。
- 候補 path は ACL の付与ではありません。
- index 構築や設定変更を、このガイドへ追加しません。

## 手順

1. IDE、Java 拡張、extension host、workspace、初期化表示を記録する。
2. `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` を開く。
3. `allocate` を通常の text search で探し、返された文字列位置を記録する。
4. `OrderService.allocate` で Go to Definition を実行し、返された path・symbol・範囲を記録する。
5. Find All References を実行し、要求と返却位置を記録する。
6. 別承認の下で Agent の Usages を使う場合は、definitions / references / implementations の
   どれが返ったかを、人のエディター操作と分けて記録する。
7. 333–349 行の anchor だけで判断せず、必要な前後と参照先を読む。
8. XML の `application-context.xml` から `spring/module-operations.xml` を辿る操作は、
   Java 言語サービスの結果と分けて記録する。

## 観察すること

- text search の query、対象範囲、ヒット位置
- Java 言語サービスの初期化状態
- 定義、参照、実装として返された path・symbol・範囲
- 人の操作と Agent tool の違い
- 要求した位置、返された位置、実際に読んだ範囲
- 追加読取が必要になった理由

文字列ヒット数は呼出し回数や実行結果ではありません。定義へ移動できても、Spring の実 proxy や
実 transaction、Java・DB の動作を確認したことにはなりません。

## 停止条件

- Java 拡張がない、初期化が完了しない、対象言語に対応していない。
- 返却範囲や tool の種類を確認できない。
- source、設定、拡張、index を変更する必要がある。
- 別 source の読取権限が不明。

未観察の定義・参照位置を空配列や 0 件で補わず、確認不能として停止してください。
停止後も、HC-015 本編は text/file search で確認できる範囲を続けられます。

## 終了時の扱い

このガイドの結果は、特定の IDE、Java 拡張、版、初期化状態に限られます。
静的な位置解決を、実行時の呼出し、transaction、教育効果へ広げないでください。

参考:

- [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

[HC-015 本編へ戻る](../README.md)
