# Chat ParticipantをDevelopment Hostで観察する

**Language:** **日本語** / [English](../../../en/challenges/hc-020/optional/chat-participant-host.md)

## 目的

同じpure analyzerをChat Participantから呼び、registration、`@`入口、prompt、stream応答、cancel、disposeを観察します。Language Model Toolとは別の入口として扱います。

## 前提

- Chat Participant APIに対応するVS Code / GitHub Copilot
- Extension Development Hostを起動できる承認済み環境
- このリポジトリとは別の、使い捨て可能な開発folder
- [Tool探索ガイド](extension-tool-host.md)と同じ固定4行、analyzer、extension例

## 権限・安全

- 開発folderの作成、Host起動、Participant呼出し、cancelを対象限定で承認します。
- 通常profileへのinstall、Marketplace公開、既存folder上書きを行いません。
- このリポジトリ内の `starter/**/*.template` はrenameしません。
- Tool結果とParticipant結果を混ぜず、未知のmodel callが発生したら停止します。

## 手順

1. 現在の公式ドキュメントで、利用版がChat Participant APIに対応するか確認します。
2. [Tool探索ガイド](extension-tool-host.md)と同じ3ファイルを独立した開発folderへcopyします。
3. Participant ID `workshop-local.evidence-counter.reader` と参照名 `workshop-evidence` を宣言・登録箇所で照合します。
4. Development Hostを起動し、`@workshop-evidence` の入口を確認します。
5. 固定4行をpromptとして一度送り、streamされたJSONと注意書きを記録します。
6. 別の一回でcancelを要求し、cancel messageと副作用の有無を確認します。
7. Hostを閉じ、Participantが解除され、開発folderだけを整理できることを確認します。

## 観察すること

- Participant registrationと`@`入口を別に確認できるか
- promptが同じanalyzerの `text` へ渡るか
- stream結果がTool callやLLM推論ではないと説明されているか
- cancelとdisposeを確認できるか
- Toolのconfirmation / selectionへ結果を外挿していないか

## 停止条件

- 対応Chat入口やParticipant IDを確認できない
- Tool結果が混入する
- 未知の追加model callが発生する
- 通常profileへのinstall、既存package上書きが必要
- 同じanalyzerを使えない、またはcleanupできない

Participantが応答しても、Tool registration、semantic accuracy、source accuracyは証明されません。

[メインシナリオの発展へ戻る](../README.md#発展)
