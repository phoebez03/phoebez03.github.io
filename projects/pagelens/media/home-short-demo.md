# PageLens homepage short demo — 2026-11-02

The user supplied `/Users/phoebezhang/Downloads/ImpressChat-short demo.mov`.
After reviewing its reading-support tablet footage, the user explicitly
confirmed that this is **PageLens** material. Do not assign it to ImpressChat
based on the filename. The ImpressChat homepage presentation is unchanged.

**Status:** superseded on 2026-11-02 by the user’s request for a static physical-product + iPad composition. The homepage no longer references either video or video poster. Keep these derivatives as unused source material; the case pages were not changed.

## Homepage files

- `pagelens-home-short-demo.mp4`: H.264, 1280×720, 30 fps, approximately 16.9 seconds, muted, faststart.
- `pagelens-home-short-demo-poster.jpg`: frame at 2 seconds.
- Existing `../cover/pagelens-home-cutout.png`: the initial static homepage cover.

The original 1920×1080 HEVC recording remains untouched in Downloads. The
homepage derivative keeps the interaction order and captions and removes audio.
Skip the long processing-wait screen: join 0–14.35 seconds to 18.1 seconds onward
with a 160 ms fade, then hold the final reading result for 1.2 seconds. This keeps
the homepage loop from spending several seconds on a nearly blank loading screen.

## Previous presentation (superseded)

Show the transparent static cover first. Once the demo enters view, wait 700 ms
before starting the muted inline loop. Fade the footage in only after its
`playing` event, avoiding a black or unloaded frame. The preview stays the same
size throughout; clicking the project still navigates directly to the case study.

Offscreen playback, the global pause control and tab visibility use the existing
homepage video controller. If playback fails, keep the static cover. With
reduced motion or no JavaScript, show the static cutout instead of autoplay.
