# PageLens prototype sources

User-supplied SVG exports, November 4, 2026. Screen content and vector text are preserved. Selected top-level screen groups are extracted with their referenced masks and definitions. Embedded raster images are resized to at most 1400px; photographs use JPEG quality 3, while the dragon preserves PNG transparency for page weight. No interface text is regenerated.

- Foundations: attachment 0a204338-6113-470e-ad35-6e00a707d47a.
- Components: attachment 8fa383b9-ba95-4306-a7dd-a4514b93c4cb. Figma selection outlines removed.
- Onboarding / settings: ac93a943-fe58-4563-bc14-86366ede7c62, groups 1, 2, 3, 11.
- Original reading / Simplify result: 531ec64f-e26f-42e3-9c2a-dbf8fc67bdf4, groups 0, 3.
- Easy to Read: 59a32108-0a31-45e5-b107-4d81f634e80f, group 1. fcd8d927-add4-4a27-841b-226aba153634 is identical.
- Story preview / AR: 329cdc9c-b9b4-416f-838f-11c86e4c93d0, groups 3, 5. c559d88b-dce2-4b45-945b-7789b31310e2 is identical.
- Read aloud: the original audio test screen (onboarding group 3) shows volume and pace. The existing commercial excerpt was checked and depicts Simplify, so it is not relabeled as Read aloud.
- Superseded experience map detail: first flow from existing pagelens-process-03-experience-map.png; full original linked.
- Earlier pass (Finish reading and book-recognition recovery now superseded): finish reading, page turning, and graceful recovery were shown as portfolio flow diagrams based on the existing experience map and archived failure-handling artifact. They are not supplied prototype screenshots.

## November 4 refinement

- Complete foundation PNG: user attachment codex-clipboard-751c1a94-e0a2-45fd-969e-67936180f5db.png. Display the whole image and link the full original.
- Complete experience map PNG: user attachment codex-clipboard-bee48270-6d04-4619-86e4-5133d3c810ec.png; replaces the earlier cropped working map.
- Component PNG originals: button states (231e834d), audio states (1f917f01), progress states (321be05f), reading tool states (bafff93f). SVG display viewports omit Figma selection outlines without altering the PNG originals.
- Error handling SVG: attachment 568c184d-2659-47c1-b177-ee58c27fac3c, top-level groups 1 and 3. Selected screens show book recognition failure and filled manual entry. Vector text and all paths remain unchanged.
- User confirmed that the design system is custom built based on Carnegie Library’s visual identity and that reading data is saved with the reader’s Carnegie Library card. The Finish reading flow diagram is superseded by that statement.

## User flow and page turn refinement

- Current user flow: user PNG attachment codex-clipboard-813255c5-a7cd-49fb-abfe-adc8c538030f.png (9888×6080), copied intact as `process/pagelens-user-flow.png`. Replaces the earlier full-width strip. Opens in an on-page zoom/pan dialog instead of another page.
- Page turn detected: user PNG attachment codex-clipboard-1a0fd265-a161-4fd0-bf84-7f768244763b.png (1194×834), copied intact as `prototypes/pagelens-page-turn-detected.png`. Replaces the middle illustration in the three-step page-turn flow; the side illustrations remain.
- The user removed the loading and AR recovery notes. Error handling now shows only recognition failure and manual entry.

## Feature rationale and Read Aloud demo refinement

- Simplify now shows three supplied states: word replacement (original SVG attachment 531ec64f, group 2), definition popup (group 1) and paragraph simplification (group 3, the existing result SVG). The two new PNG attachments e9ef2389 and e800c34d are byte-identical and match the word-replacement state. No new interface content was invented. New SVG extracts reuse the optimized photo definition from the existing result while preserving all vector text.
- Read Aloud: source `/Users/phoebezhang/Downloads/PageLens_read aloud.mov`, 2396×1530, 2.479 seconds. Website derivative `media/pagelens-read-aloud.mp4` is H.264, 1600×1022, 30 fps, CRF 18, with the original audio transcoded to AAC 96 kbps and MP4 fast start. Poster is at 0.7s. The actual moving underline demo replaces the earlier audio test screenshot. The source MOV is unchanged.
- All eight prototype explanations use the user's latest supplied copy. The privacy-oriented Finish Reading explanation supersedes the earlier library-card-only closing sentence; no ending prototype was added.
- Foundation/tokens uses the same card treatment as the remaining Buttons and Features button cards. Audio preview and Generate visuals cards are removed, with source assets retained.

## Simplify switch and format comparison

- The same three Simplify assets now appear as Words / Definition / Paragraph tabs in one iPad position. They retain their existing in-page enlargement buttons. No screen content was modified.
- GIF comparison used the deployed 1600×1022, 30 fps, 2.5s MP4 and a 256-color palette with Sierra dithering and rectangular frame optimization. GIF: 6,589,715 bytes; existing MP4: 722,386 bytes. The GIF was 9.12× larger and was not added to the site. Keep the existing MP4 for the user's loading goal.
