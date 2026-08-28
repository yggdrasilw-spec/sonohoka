---
name: portfolio-app-links-update
description: Update the app_links_portfolio.html catalog when adding or correcting an app card, including its count, grade metadata, link, and optional demo-video wiring.
---

# Portfolio App Links Update

Use this skill for changes to the repository's `app_links_portfolio.html`. Keep the catalog internally consistent and make the smallest focused edit.

## Workflow

1. Read `app_links_portfolio.html` and enumerate `article.card` entries. Treat `data-register-order` as the registration identity, not the current DOM position.
2. Before inserting a card, check for an existing card with the same app URL, title, or registration order. Update an existing card when it is the same app; otherwise choose the next unused registration order and matching circled number.
3. Keep these fields aligned: `data-category`, `data-grades`, `data-main-grade`, the visible grade tags, title/description, and the primary `href`. Use the grade supplied by the user; do not infer a different school year from neighboring cards.
4. If a valid demo asset exists, add `data-video` with the exact filename under `media/`. The portfolio script derives the poster filename by replacing `.mp4` with `.png`. Never add `data-video` for a missing asset.
5. Update any visible catalog total that is hard-coded in the hero summary. Verify it equals the number of `article.card` elements after the edit; also verify any grade-filter totals are generated from the cards rather than duplicated literals.
6. Validate with focused searches or a small parser: card count, unique registration orders, target URL, grade values, `data-video` asset existence, and no duplicate app link. Inspect the relevant diff before handing off.

## Scope and safety

- Preserve unrelated cards, descriptions, ordering conventions, and JavaScript behavior.
- Do not change the app source or publish files as part of a catalog-only update unless the user asks for that separately.
- Git commit and push are separate actions requiring the user's explicit authorization immediately before the mutation.
