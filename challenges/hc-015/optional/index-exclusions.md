# index・検索除外・開いたファイルを分けるガイド

**Language:** **日本語** / [English](../../../en/challenges/hc-015/optional/index-exclusions.md)

[HC-015 本編へ戻る](../README.md)

## 目的

同じ `allocate` と固定 source について、text search、semantic search、明示添付、
開いているファイルや selection の違いを整理します。
検索除外を ACL として扱わず、index の未準備や未確認を「検索結果 0 件」に置き換えないことが目的です。

このガイドでは設定変更や index 構築を行いません。
[Java 言語サービスのガイド](language-tools.md)とも別の探索です。

## 前提

- HC-015 本編とは別の workspace と新しい会話を使えること。
- 同じ query、固定 source、除外状態、開いたファイル、selection を記録できること。
- 利用中の client で index の出所と状態を確認できること。
- Copilot、index サービス、source の利用資格と組織 policy を確認できること。
- 既存設定の出所を、変更せず読めること。

index の出所は GitHub、Azure DevOps、その他の workspace などで異なる場合があります。
状態表示を読めても、構築・通信・検索成功を確認したことにはなりません。

## 権限と安全

- index 構築、通信、workspace 設定変更には別承認が必要です。このガイドでは実行しません。
- source、既存 ignore、組織の content exclusion を変更しません。
- `force-add`、User/Profile 設定への切替で再現性の問題を回避しません。
- content exclusion で制限された内容を、明示添付や開いたファイルから迂回して取得しません。
- 検索除外は秘密保護の ACL ではありません。

## 手順

1. client、runtime workspace、query `allocate`、upstream template revision を記録する。local `HEAD` との一致は要求しない。
2. `search.exclude`、`files.exclude`、`.gitignore` の実効値と出所を、変更せず確認する。
3. 開いているファイル、tabs、selection を記録する。
4. text/file search を実行する場合は、対象範囲、除外、返却 path を記録する。
5. semantic search を実行する前に、index の出所、状態、利用資格、組織 policy を確認する。
6. index が利用でき、別承認がある場合だけ同じ query と source 範囲で semantic search を観察する。
7. 明示添付を使う場合は、検索結果とは別に exact path と添付表示を記録する。
8. text search、semantic search、明示添付、開いたファイル由来の context を別々に比較する。

### 設定ごとの対象

| 設定 / 状態 | 区別して考えること |
|---|---|
| `search.exclude` | text/grep 検索からの除外。Explorer 表示やすべての context 経路を閉じる ACL ではない |
| `files.exclude` | Explorer と検索への影響。利用中の client の文書と実効値を確認する |
| `.gitignore` | Git 追跡と検索への影響。開いたファイルや selection の context とは別に確認する |
| 開いた ignored file / selection | 検索側の除外と別経路で context に入り得る。content exclusion を回避する許可ではない |
| semantic index | 意味検索の準備。source 閲覧権や全文投入を保証しない |

## 観察すること

- query、upstream template revision、runtime workspaceの対象範囲
- 各除外設定の値と出所
- tabs、開いたファイル、selection
- text/file search の返却 path
- index の出所、状態、利用資格、組織 policy
- semantic search の要求・返却範囲
- 明示添付の exact path と表示
- 確認できなかった範囲

Node.js の literal scan や教材 JSON の値は、VS Code の検索、index、添付を実行した結果ではありません。

## 停止条件

- index の出所、状態、利用資格、組織 policy を確認できない。
- 設定変更、index 構築、既存 ignore の変更が必要。
- `force-add` や User/Profile 設定への切替が必要。
- 組織の content exclusion を回避する可能性がある。
- query、source、除外状態、tabs、selection を方法間で揃えられない。

未確認の semantic result は `null` 相当として扱い、空配列や 0 件へ補完しないでください。
text search が 0 件でも、source の不存在、読取拒否、正しい結論を意味しません。

## 終了時の扱い

このガイドは、設定と context 経路の違いを観察するための補足です。
実際の source ACL、全 context 投入、回答品質、教育効果を証明しません。

参考:

- [Workspace context and exclusion](https://code.visualstudio.com/docs/agents/reference/workspace-context)
- [Tools in VS Code](https://code.visualstudio.com/docs/agents/run/tools)

[HC-015 本編へ戻る](../README.md)
