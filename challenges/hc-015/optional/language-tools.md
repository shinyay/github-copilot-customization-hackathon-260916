# Java の文字列検索と定義・参照を分けるガイド

**言語:** **日本語** / [English](../../../en/challenges/hc-015/optional/language-tools.md)

[HC-015 本編へ戻る](../README.md)
## 目的

固定クエリ `allocate` について、文字列検索とJava言語サービスによる定義・参照の解決を分けて観察します。
手動で全文を渡すことは言語サービスの再現ではありません。人の Go to Definition / Find All References と、
Agent が Usages を使った結果も別々に扱います。

## 前提

- HC-015本編とは別のワークスペースと新しい会話を使えること。
- 公開upstreamテンプレートのリビジョン
  `shinyay/github-copilot-customization-runtime-template@8f0b3aa25c4f33facdea691642c2f1cb3901391c`
  を出所とするソースを、テンプレートから作成したランタイムワークスペースで読めること。
- ランタイムワークスペースのローカル `HEAD` をupstreamリビジョンと比較しないこと。
- 対応するJava拡張がすでに導入され、初期化状態と版を確認できること。
- 同じクエリ、ソース、タブ、選択範囲、モデル、利用可能なツールを維持できること。
- Copilotと教材ソースの利用資格を確認できること。

Java 拡張や JDK がない場合、このガイドのために自動導入しません。

## 権限と安全

- エディター操作や Agent の Usages 利用は、環境所有者が許可した範囲に限定します。
- ソース、既存の拡張機能、User/Profile、ワークスペース設定は変更しません。
- 追加のソースが必要な場合は、その読み取り権限を別途確認します。
- 候補のパスはACLを付与するものではありません。
- インデックスの構築や設定変更を、このガイドに追加しません。

## 手順

1. IDE、Java拡張、extension host、ワークスペース、初期化表示を記録する。
2. `wholesale-core/src/main/java/jp/co/tsubame/wholesale/service/OrderService.java` を開く。
3. `allocate` を通常のtext searchで探し、返された文字列の位置を記録する。
4. `OrderService.allocate` でGo to Definitionを実行し、返されたパス、シンボル、範囲を記録する。
5. Find All References を実行し、要求と返却位置を記録する。
6. 別承認の下で Agent の Usages を使う場合は、definitions / references / implementations の
   どれが返ったかを、人が行ったエディター操作と分けて記録する。
7. 333–349行の起点だけで判断せず、必要な前後の範囲と参照先を読む。
8. XML の `application-context.xml` から `spring/module-operations.xml` を辿る操作は、
   Java 言語サービスの結果と分けて記録する。

## 観察すること

- text searchのクエリ、対象範囲、ヒット位置
- Java言語サービスの初期化状態
- 定義、参照、実装として返されたパス、シンボル、範囲
- 人の操作とAgentツールの違い
- 要求した位置、返された位置、実際に読んだ範囲
- 追加の読み取りが必要になった理由

文字列のヒット数は、呼び出し回数や実行結果ではありません。定義へ移動できても、Springの実際のプロキシや
トランザクション、JavaやDBの動作を確認したことにはなりません。

## 停止条件

- Java 拡張がない、初期化が完了しない、対象言語に対応していない。
- 返却範囲やツールの種類を確認できない。
- ソース、設定、拡張機能、インデックスを変更する必要がある。
- 別のソースの読み取り権限が不明。

未観察の定義・参照位置を空配列や 0 件で補わず、確認不能として停止してください。
停止後も、HC-015本編はtext/file searchで確認できる範囲を続けられます。

## 終了時の扱い

このガイドの結果は、特定の IDE、Java 拡張、版、初期化状態に限られます。
静的な位置解決の結果を、実行時の呼び出し、トランザクション、教育効果にまで広げないでください。

参考:

- [Workspace context](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

[HC-015 本編へ戻る](../README.md)
