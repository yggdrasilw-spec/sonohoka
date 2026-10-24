# Other action scenes

Generated with the built-in `image_gen` tool using `scene-4-0.webp` as a character/style reference. Prompts and targeted corrections are saved in `other-generation-prompts.json`.

| Choice | Active / passive | Sheet | Frame row |
| --- | --- | --- | --- |
| つつく | つつく / つつかれる | other-poke-sheet-v1.png | 5 |
| なでる | なでる / なでられる | other-pat-sheet-v1.png | 6 |
| あおぐ | あおぐ / あおがれる | other-fan-sheet-v1.png | 7 |
| よぶ | よぶ / よばれる | other-call-sheet-v1.png | 8 |
| てらす | てらす / てらされる | other-light-sheet-v1.png | 9 |

Each source is a 2x2 sheet read left to right, top to bottom. `python scripts/prepare-sansuu-other.py` detects the central grid separators and mechanically crops four WebP frames per sheet, saved as `scene-{row}-{frame}.webp`. Source sheets remain intact.

The orange receiver stays left; the green actor stays right. Poking is a light touch to the clothed shoulder, patting is gentle, calling and fanning have no contact, and the flashlight targets clothing below the head. The pat sheet was corrected for arm color; the fan sheet was corrected to remove hair/hem movement opposing the breeze. These six non-arithmetic scenes (including the existing push scene, row 4) have people/role quizzes and no numeric equation.
