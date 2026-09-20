# Chat ParticipantをDevelopment Hostで観察する

**言語:** **日本語** / [English](../../../en/challenges/hc-020/optional/chat-participant-host.md)

## 目的

同じ副作用のないアナライザーをChat Participantから呼び出し、登録、`@` の入口、プロンプト、ストリーミング応答、キャンセル、破棄を観察します。Language Model Toolとは別の入口として扱います。

## 前提

- Chat Participant APIに対応するVS Code / GitHub Copilot
- Extension Development Hostを起動できる承認済み環境
- このリポジトリとは別の、使い捨て可能な開発フォルダー
- [Tool探索ガイド](extension-tool-host.md)と同じ固定4行、アナライザー、拡張機能の例

## 権限・安全

- 開発フォルダーの作成、Hostの起動、Participantの呼び出し、キャンセルを対象を限定して承認します。
- 通常のプロファイルへのインストール、Marketplaceへの公開、既存フォルダーの上書きは行いません。
- このリポジトリ内の `starter/**/*.template` は名前を変更しません。
- Toolの結果とParticipantの結果を混ぜず、未知のモデル呼び出しが発生したら停止します。

## 手順

1. 現在の公式ドキュメントで、利用版がChat Participant APIに対応するか確認します。
2. [Tool探索ガイド](extension-tool-host.md)と同じ3ファイルを、独立した開発フォルダーへコピーします。
3. Participant ID `workshop-local.evidence-counter.reader` と参照名 `workshop-evidence` を宣言・登録箇所で照合します。
4. Development Hostを起動し、`@workshop-evidence` の入口を確認します。
5. 固定4行をプロンプトとして一度送り、ストリーミングされたJSONと注意書きを記録します。
6. 別の試行でキャンセルを要求し、キャンセルメッセージと副作用の有無を確認します。
7. Hostを閉じ、Participantが破棄され、開発フォルダーだけを整理できることを確認します。

## 観察すること

- Participantの登録と `@` の入口を別々に確認できるか
- プロンプトが同じアナライザーの `text` に渡るか
- ストリーミング結果がToolの呼び出しでもLLMの推論でもないと説明されているか
- キャンセルと破棄を確認できるか
- Toolの確認 / 選択へ結果を外挿していないか

## 停止条件

- 対応Chat入口やParticipant IDを確認できない
- Tool結果が混入する
- 未知の追加モデル呼び出しが発生する
- 通常のプロファイルへのインストールや既存パッケージの上書きが必要になる
- 同じアナライザーを使えない、または後片付けができない

Participantが応答しても、Toolの登録、意味の正確さ、ソースの正確さは証明されません。

[メインシナリオの発展へ戻る](../README.md#発展)
