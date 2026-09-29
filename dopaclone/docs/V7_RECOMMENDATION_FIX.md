# v7 おすすめ出題の整合性修正

## 問題

タイトルでは `frontier(progress)[0]` を「つぎは…」として表示していましたが、実際の `levelPlan()` は約30%の既習復習を先頭に置いていたため、表示したおすすめと1問目が一致しませんでした。

## 修正

- `recommendedSkill(progress)` を追加し、タイトル表示と学習プランで同じ関数を使用。
- 「おすすめから はじめる」の1問目は必ず `recommendedSkill` と一致。
- 復習は先頭に固めず、2問目以降へ分散。
- さびたスキルは分散された復習枠で優先。
- `data-recommended-skill` と `data-skill` をDOMに付与し、GitHub Pages上で開発者ツールから整合性を確認可能。
- 自動テストに「おすすめスキル＝1問目」を追加。

## 確認方法

タイトル画面でおすすめ表示を確認し、開始後にDevTools Consoleで次を実行できます。

```js
document.querySelector('#start')?.dataset.recommendedSkill
document.querySelector('#card')?.dataset.skill
```

1問目ではこの2値が一致します。
