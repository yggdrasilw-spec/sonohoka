# Recording and encoding checklist

## Storyboard

- 0.0–1.0s: app identity and value.
- 1.0–3.0s: start or select the activity.
- 3.0–7.0s: one or two central actions.
- 7.0–9.0s: visible result or reward.
- 9.0–10.0s: hold the result long enough to understand it.

Use one short caption per state. Captions should explain the action or learning benefit, not repeat every visible button label. A lower-third band around 80–96 pixels is usually readable at 1280×720; test Japanese glyphs with the installed Japanese font.

## Suggested repository layout

```text
.record_<slug>/                    # source browser screenshots
.record_<slug>_captioned/          # caption-burned frames + storyboard.txt
media/<slug>-intro.mp4
media/<slug>-intro.png
scripts/caption-<slug>.mjs
scripts/encode-<slug>.py
```

The encoder may use the bundled `imageio_ffmpeg` runtime. For a silent-friendly portfolio video, include a silent AAC track when the browser/card player expects audio metadata, while keeping the default playback muted in the portfolio UI.

## Final checks

- MP4 duration is `<= 10.0` seconds.
- Resolution is suitable for the portfolio card, normally 1280×720 or another 16:9 size.
- Video is H.264 with browser-safe pixel format; audio is AAC or intentionally absent if the player permits it.
- No caption is clipped or placed over the decisive control/result.
- The thumbnail is a clear, representative frame.
- `data-video` points to an existing asset and the card’s poster path resolves to the matching PNG.
