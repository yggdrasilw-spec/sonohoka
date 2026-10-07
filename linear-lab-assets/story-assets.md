# 文章題の場面イラスト

2026-10-07、組み込みのimage_genツールで生成。720×480のWebPに縮小してラボへ組み込みました。

- `shopping-notebooks.webp`：文章題1・19。ノート・本と袋や包装を別々に買う場面。
- `bicycle-rental.webp`：文章題2。自転車を借り、利用時間を考える場面。
- `catch-up.webp`：文章題9。青いAが先を歩き、灰色のBが同じ向きに走る出発時の場面。

イラストは状況の理解を助けます。数値、時刻、現在の位置は隣のSVGに描き、表・式・グラフと連動します。追いつきのイラストには「出発時のイメージ」と表示します。

## 生成プロンプト

### shopping

Use case: illustration-story. Asset type: supporting scene for a Japanese middle-school math word problem, not a quantitative diagram. Create a polished flat textbook illustration on white background, landscape 3:2. A Japanese middle-school student at a stationery counter choosing a plain blue notebook; a shop assistant behind the counter holds one plain kraft paper shopping bag. Show one sample notebook only and one bag, no pile of purchased books. Small friendly full-body or waist-up characters, clear readable silhouettes, navy outlines, muted blue and warm ochre accents, calm age-appropriate tone. The image illustrates buying notebooks with a separate bag fee; all exact counts and prices are added by app code outside image. No numbers, no letters, no text, no signs, no currency symbols, no receipts with writing, no logo, no watermark. Spacious framing, uncomplicated background, no extra merchandise clutter.

### bicycle-rental

Use case: illustration-story. Asset type: supporting scene for a Japanese middle-school math word problem, not a quantitative diagram. Create a polished flat textbook illustration on white background, landscape 3:2. A middle-school student wearing a bicycle helmet stands next to a simple blue city bicycle, receiving its key from a friendly bicycle rental attendant at a small simple rental counter. The bicycle is parked and both people are standing, no riding. Include a small generic round clock without numerals, separate from counter, to suggest rental time. Navy outlines, muted blue and warm ochre accents, minimal calm textbook style matching educational illustrations. All fees, exact times, and arithmetic are added by the application outside image. No numbers, no letters, no text, no signage, no logos, no watermark. Keep bike wheels fully visible, simple composition with generous white margins.

### catch-up

Use case: scientific-educational. Asset type: supporting scene for a Japanese middle-school math problem about catching up, not a scale diagram. Create a polished flat textbook illustration on a white background, landscape 3:2. Side view on one straight path: student A in blue is ahead toward the RIGHT, walking to the RIGHT; student B in gray is behind toward the LEFT, jogging to the RIGHT, following A. Both look and move in the SAME rightward direction. Blue walker on right and gray jogger on left, two full-body middle-school-age characters only, with obvious different walking versus jogging poses. Simple path with small rightward arrow at far right to indicate common direction, no destination buildings, no finish line. Friendly navy outlines, muted blue and gray with restrained warm ochre accents. This is only a scene introduction; exact positions, distances and time are drawn by the app separately. No numbers, no letters, no labels A/B, no text, no scales, no logos, no watermark. Generous white margins, very clear silhouettes.
