# Judging

審査は「AIが派手な答えを返したか」ではなく、問題設定、比較の公平さ、Evidence、再利用可能性、安全性を見ます。

## Rubric

| 観点 | 問い |
|---|---|
| Problem framing | 実務上の困りごとと仮説が明確か |
| Feature understanding | 対象Customizationが何を変え、何を変えないか説明できるか |
| Fair comparison | BaselineとCustomizedで入力・評価軸・環境差を管理したか |
| Evidence quality | 成功だけでなく失敗、反例、テスト、human checkを残したか |
| Safety and privacy | secret、個人情報、外部副作用、過剰権限を避けたか |
| Reusability | 適用範囲、非適用範囲、保守方法を説明したか |

## Outcome is not the score

`improved` は自動的な高得点ではありません。弱いBaseline、異なる入力、選別した成功例だけの提出は評価を下げます。反対に、`equal`、`worse`、`incomparable`、`blocked`、`unsupported` でも、原因を切り分けて次の判断につながるEvidenceがあれば高く評価できます。

## Challenge-specific criteria

各Challengeページの **Judging** セクションが追加基準です。非公開の正解表は使いません。参加者には、観測可能な分類、期待するEvidence、禁止事項を事前に公開します。
