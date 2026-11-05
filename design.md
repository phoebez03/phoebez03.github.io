# Portfolio Design System

This file is the source of truth for shared visual decisions across the portfolio. Project identity may change accent colors and imagery, but not the underlying hierarchy, spacing, component behavior, or motion language.

## Principles

1. Make complex information feel calm and immediately scannable.
2. Use one clear focal point per viewport.
3. Prefer reusable structures over one-off layouts.
4. Preserve each project’s identity through accent color and imagery, not different typography or spacing rules.
5. Keep essential content available without hover and respect reduced-motion preferences.

## Color

- Heading / primary ink: `#29292C`
- Body copy: `#4A4A4F`
- Muted copy: `#6E6E73`
- Canvas: `#FFFFFF`
- Secondary surface: `#F5F5F7`
- Hairline: `#D2D2D7`
- Dark surface: `#303033`
- Interaction blue: `#0066CC`
- Interaction blue, hover/focus: `#0071E3`

Project accents such as Bumble yellow remain project-specific. Text on light surfaces uses the shared ink colors above.

## Typography

- Interface family: SF Pro / system sans-serif fallback.
- Display family: use the established portfolio display face consistently within a page family.
- Homepage intro: 54px desktop display type, weight 500, line-height 1.13; 25–43px on phones. Three deliberate lines, centered on desktop and left aligned on phones. No window frame.
- Project hero: `clamp(50px, 6.4vw, 98px)`.
- Case-study section heading: semantic `h3`, `clamp(19px, 1.8vw, 25px)`, weight 600, one line on desktop.
- Card heading: `clamp(20px, 1.8vw, 24px)`, always smaller than the section heading in perceived hierarchy.
- Lead: `clamp(18px, 1.55vw, 24px)`.
- Body: `clamp(15px, 1.08vw, 17px)`.
- Labels and keyword badges: 11–13px, weight 600.

Headings use the primary ink and a compact line-height. User preference confirmed 2026-10-21: keep headings to one concise line, including mobile. Shorten the wording before reducing type size. Use the section name alone when it is sufficient, such as My Path, Skill, Offscreen, or Paintings; omit redundant eyebrows, subtitles and decorative explanatory copy. Never enlarge a heading merely to fill space. Card headings must remain at least one clear type step below their section heading. Apply this preference to future work; it does not authorize unrelated page rewrites.

Avoid decorative em dashes and repeated hyphen constructions in headings. Use punctuation only when it improves meaning. When a chapter label or table-of-contents item already names the section, do not repeat the same meaning in a second heading; keep the label and let the content begin.

## Spacing and Layout

- Base spacing unit: 8px.
- Spacing scale: 8, 16, 24, 40, 64, 96, 144px.
- Page gutter: `clamp(28px, 6vw, 96px)`.
- Homepage content width: 1440px maximum.
- Case-study content width: 1200px maximum.
- Major sections should feel complete within one viewport when content length permits.

## Components

- Keyword badges: pill shape, 30px minimum height, 6px × 11px padding, 8px gap.
- Cards: 18–20px radius, subtle hairline border, restrained elevation.
- Primary action: blue pill or circular control with a visible focus state.
- Global navigation: dark translucent bar, text identity at left, active page marked by a 1px white underline. Contact actions live in the footer rather than being duplicated in the header.
- General-page footer: one compact row with “Let’s talk,” Email, and LinkedIn only, aligned to the same inner edge as the shared navigation on a distinct `#E8E8ED` gray surface.
- Case-study metadata: three consistent fields—Role, Timeline, Tools.
- Project taxonomy order: Platform → Design Expertise → Specialization.

### Homepage typography and interactions

- User-confirmed direction (2026-10-20): an Apple/iOS-inspired image collage with polished native-window details and loose scrapbook/hand-drawn accents. Keep the original black navigation. Use minimal text; express skills through images. The preceding white-navigation/unboxed-type proposal is superseded.
- Current implementation, awaiting visual acceptance: a Notes-style introduction overlapping the real studio photograph, a portrait contact widget linking directly to LinkedIn, separate school stickers, a Starry Night painting print, a user-provided Screen Time snapshot and a compact Projects window. Composition and placements are AI proposals based on the four user-supplied collage references, not a replica.
- Reuse the user's existing `about/studio/design-desk.jpg`, profile and watercolor photos. The studio stays on its full photograph. Tool logos identify creative tools; they do not imply that the physical painting was made in Adobe.
- Keep the approved main introduction. Remove extra group headings, biographical subtitles and tool descriptions. Small functional window labels, school disciplines and link labels remain.
- Tool dock icons are noninteractive, with the exact names Figma, Adobe, Claude and Codex revealed on hover or keyboard focus. Clicking does not switch images, labels or state. GSAP provides staggered window entrances, a drawn underline and restrained movement. Pause stops idle motion and videos; reduced motion skips GSAP and autoplay. No Liquid Glass.
- Desktop and narrow-phone collage layouts fit a normal viewport; exceptionally short viewports may scroll. Keep links keyboard-accessible, photographs visible without animation and no horizontal overflow.
- Homepage Will and OLI links both open About at My Path. Preserve the project demos inside devices on transparent project stages below the hero. Project links navigate directly; remove the blue card outline on click, with a restrained charcoal outline reserved for keyboard focus.
- Selected work keywords sit directly below each description and above Explore project, aligned to the copy column. Keep device stages free of badges and use the recovered lower space to shorten cards.
- Selected work KB Tutor places an upright landscape iPad at the left, slightly overlapping the upright student laptop at the right, with both devices aligned along the bottom. The teacher dashboard is a static image covering the iPad screen with its recorded cursor removed. The student demo retains its original pointer (user clarification, November 2); use the fixed crop and smooth retained wide views without cursor repairs. Bumble uses the user’s single-hand straight-on iPhone photograph with the existing chat video inside its display, plus a small static Apple Watch invitation; no second phone. Its group is slightly smaller (490px maximum), and the watch sits a little higher and farther right. ImpressChat retains an angled hand-held static catalog beside a straight-on phone playing the existing demo. Match both phones’ visible heights and leave a small gap between them (about 20px at the desktop maximum); do not overlap. Its wrist fades softly close to the second phone’s baseline. PageLens pairs the transparent physical-product cutout with a two-hand-held landscape iPad displaying its reading settings, shifted farther toward the upper right at a slightly smaller scale so the real product screen, support and book remain legible, with restrained overlap. Center the pair’s visible artwork as a group opposite the copy, using a closely fitted stage instead of a tall empty image area. Keep soft wrist endings and a softly fading lower edge on the original product photo and no homepage video. Crop recording surroundings, preserve the original UI, and avoid empty black rectangles around devices. Videos play only in view, obey the shared pause setting and reduced motion, and show their posters without JavaScript. These homepage changes do not authorize edits to case-study layouts.
- User refinement (2026-11-01): remove recorded mouse pointers and click circles from homepage demo assets. Later clarification: only KB Tutor’s teacher dashboard requires cursor removal; preserve the student demo’s original pointer. All four project cards and stages have transparent backgrounds, with no blurred color halos or broad device shadows. Keep actual interfaces, device bezels and the framed painting opaque. PageLens uses an alpha cutout retaining the tablet, mount and open book. Keep the original media and use separate homepage derivatives; localized video repairs can be softer where a pointer covered content. Asset provenance and prompts are in `projects/homepage-media-cleanup.md`.
- Playback refinement (2026-11-02): keep the KB Tutor application's crop constant through page changes, using 30 fps wide-view footage with short fades between retained views. Avoid following page colors or recorded zooms to determine crop bounds. The existing project link, global pause, offscreen pause and reduced-motion/static fallbacks remain available. The later November 2 device-composition request supersedes PageLens’s cover-to-video playback: its homepage presentation is now entirely static.

- Device composition refinement (2026-11-02): the user clarified that the actual hand-held treatment is required. Use a distinct hand-held treatment for each project: Bumble now has only a straight-on single-hand phone and static watch; ImpressChat pairs its angled hand-held phone with a straight-on display. Preserve the supplied hand pose and device perspective; use alpha cutouts and project real UI screenshots into the screen apertures without regenerating text. Preserve transparent stages and avoid decorative captions, scene backgrounds or heavy shadows. Scale compositions together at narrow widths while keeping complete device frames visible. Use the user’s real project screens; source mapping is in `projects/homepage-device-compositions.md`; hand-held outputs and exact built-in imagegen prompts are in `projects/handheld-mockup-sources.md`.

## Motion

- Micro-interaction: 180–220ms.
- Card/section transition: 320–700ms using a smooth ease-out curve.
- Entrance reveal: subtle opacity and 18–28px vertical movement.
- Typing effects are reserved for short identity statements and must leave the full text accessible.
- Reduced motion: remove typing, transforms, autoplay, and long transitions while keeping all content visible.

## Case-Study Structure

Hero → Problem → Product Overview → Process (Research, Design, Test, Iterate) → Final Experience → Impact → Reflection.

Use KB Tutor as the reference implementation for shared hierarchy, components, and animation behavior.

- KB Tutor retains the original introduction layout: title and description beside metadata, followed by the full-width walkthrough inside a laptop. Do not move its walkthrough beside the title.
- Use one concise line for each chapter heading; remove repeated meaning between the chapter label and its heading.
- Use 15px muted body copy inside case-study cards and supporting section notes.
- Use 18px-radius white cards with a subtle grey hairline on the secondary surface.
- Default case-study cards to a two-column composition: concise text on the left and the primary image, chart, interface, or diagram on the right. Stack the columns only on narrow screens.
- Vertically center the text panel within two-column cards so short descriptions stay visually balanced with the artifact.
- Treat image clarity as a layout decision, not a hover interaction. Keep concise copy on the left and the full visual on the right; widen the card before stacking it, constrain the card to roughly one viewport, and use `contain` on a tinted surface to avoid cropping or white letterboxing. Use the KB Tutor-style overlap for multi-image explorations, with every layer revealable by hover, keyboard focus, or click.
- Every image enlargement stays on the current page in a dialog, preserving the page URL and returning focus to the opener when closed. Use the existing zoom/pan viewer for PageLens and keep the existing KB Tutor and About image dialogs. Never open a new tab or navigate away just to show a larger image.
- When a chapter contains multiple comparable artifacts, use the KB Tutor horizontal card track with right-aligned circular arrow controls.
- Include Impact in contents bars only when the case study retains an Impact chapter; PageLens omits it by user request. Mark the current chapter with charcoal text and a thin underline, never color alone. Keep chapter tracking active with reduced motion enabled.
- Reveal headings and visual/card groups with the same subtle fade and 24px rise across projects; animate explanatory charts on entry. All content stays visible when reduced motion is requested.
- Mobile walkthroughs use a compact dark panel: project label and H3 on the left, a naturally proportioned phone demo on the right. Stack on small screens; avoid oversized empty frames.
- Visualize each problem inside its own card. Pair the concise explanation with a chart, interface state, or purpose-built diagram.
- Keep Impact minimal: a label and three metrics only, without introductory or explanatory paragraphs.
- Compress the final chapter rhythm: use 24–56px transitions between Test/Iteration, walkthrough, and Impact instead of repeating full major-section padding.
- Use neutral placeholders when final imagery has not been supplied; preserve the intended image area and replace it in a later asset round.

### ImpressChat

- Order: Hero → Problem → Process (stages → Get the highlights → Product walkthrough) → Impact → Reflection.
- Match KB Tutor's compact one-line H3 section headings; use 18px card headings and 15px muted descriptions, with text left and visuals right on desktop.
- Predict, Observe, Explain, and Feedback belong inside one visibly bounded Structured chat container.
- Use a single walkthrough and minimal Impact metrics. Keep stage descriptions visible without hover, and let section heights adapt to their content.
- The learning journey follows the page's vertical scroll through all four stages. Keep text left and visuals right on desktop; stack each stage and its three-screen groups vertically on phones so no stage requires a sideways swipe.

### PageLens

- User refinements (2026-11-04): selected work and next-project links follow KB Tutor → Bumble × Skill Snack → PageLens → ImpressChat. PageLens is third; ImpressChat is the supplementary last project.
- Order: Hero → Problem → Process → Prototypes → Demo (both original videos) → Reflection. Omit Impact and its navigation link.
- Hero combines the original library photograph on the left with the title, description and metadata on the right. Keep the actual library context, following Bumble’s composition.
- Problem uses an unboxed full-page image, an overlapping enlarged detail, fine connectors and sequential reveals. The first connector reaches the heading’s edge. Reflow annotations below the images on phones. Omit the visible illustrative-simulation caption while keeping accurate alternative text.
- Process scrolls vertically through Experience mapping → Technology exploration → System feasibility → Design system. Technology explorations sit side by side on desktop and stack on phones. Use the updated 9888×6080 user flow with a magnifier opening an on-page zoom/pan dialog; do not open another page. Fit restores the overview, and detail zoom remains readable on phones. Chapter headings are 25px on desktop / 21px on phones; process and prototype subheadings are 18px / 17px. Leave 76px / 56px below the Process chapter introduction.
- The design system was custom built based on Carnegie Library’s visual identity. Place the complete supplied foundations/tokens PNG in a full-width card labeled “Foundation/tokens”, using the same padding, hairline and 18px radius as the component cards. Display it without cropping and enlarge the original in the page dialog. Keep only Buttons and Features button beneath it; omit the Audio preview and Generate visuals cards. Preserve original components and omit Figma selection outlines.
- Prototypes use selected real screens in iPad frames: Onboarding, Read aloud, Simplify, Easy to read, Bring story to life, then Turn pages and Error handling. Simplify has three real states: Simplify words, Give definition and Simplify a paragraph; remove the Original screen. Show one iPad state at a time using the Review Hub-style segmented tabs: Words, Definition, Paragraph, with a dark active pill on a light gray track. Keep Simplify’s explanation on the left and the segmented switch plus iPad on the right above 900px. Use compact 32px vertical padding and a viewport-height-aware demo width so the full section fits laptop viewports; keep natural stacked flow at 900px and below. Support mouse/touch, arrow keys, Home/End, and the existing in-page image viewer. Without JavaScript, keep all three screens readable. Story uses preview/AR states. Read aloud uses the user’s actual Read Aloud MOV, optimized for the web and looped in the existing iPad layout. Start muted when visible, pause offscreen/when hidden, keep native audio and pause controls, and show a static poster for reduced motion until the reader chooses playback. Easy to read includes its settings screen in a smaller iPad.
- Read Aloud format comparison (2026-11-04): retain the optimized 0.72 MB MP4. An actual same-size/frame-rate GIF conversion was 6.59 MB (9.12× larger); a GIF does not meet the user’s loading goal for this clip.
- Page turning keeps the side illustrations and replaces the middle illustration with the supplied “Page turn detected” prototype in an iPad. Stack the three steps on phones.
- Error handling shows the supplied recognition-failure and filled manual-entry screens. Omit the loading and AR recovery notes. Finish reading remains text only. The latest user-authored explanation describes automatic book-removal detection closing the session, displaying a summary and clearing guest data for privacy; this supersedes the earlier library-card-only closing explanation.
- Use the user’s latest eight prototype explanations verbatim, connecting the reading challenge or research rationale to the design decision. Preserve their typography and established layouts, except for the later Simplify side-by-side refinement.
- PageLens story accents, demo labels and focus outlines use the library purple (#ac4b9c), with #742066 for darker states. All shared navigation, including All projects, the site progress bar and the next-project ImpressChat CTA, retains the shared blue (#0066cc). Preserve colors within original research and design artifacts.

### Homepage collage refinement — 2026-10-20

- User-confirmed labels beside the matching photographed devices: “I vibe code”, “I use Figma”, “I design by hands”. The dock name is “Codex”.
- User confirmed replacing the separate sketch print with their uploaded Screen Time snapshot. The actual sketchbook stays in the studio photo. Keep the paint palette.
- Updated 2026-10-26: remove the tennis, soccer, table-tennis and Jay Chou album stickers shown in the user's screenshots. These supersede the previous request to include those keepsakes; source assets remain available.
- Superseded on 2026-10-21: decorative stickers entering together. Current proposal uses overlapping introduction/studio/navigation beats and uneven, short offsets for individual keepsakes. Idle movement begins only after the entrance completes; first keyboard or pointer interaction completes the entrance immediately. Remove the floating decorative arrow; keep the blue hand-drawn underline. Current timing and layout await user acceptance.


## About collage revision — 2026-10-22

Status: implemented locally, awaiting visual acceptance; not published. Source: latest user correction, seven real photos and scrapbook references. Supersedes the earlier map, maple photo and generated sport placeholders.

- Keep the shared black navigation. One Cambridge portrait with a paperclip, and the exact note “Croyez en vos rêves, ils sont gratuits”. Cambridge is user-confirmed; the previous Oxford label was incorrect.
- Use only single-line section headings: My Path, Skill, Offscreen and Paintings. Remove explanatory subtitles and decorative filler throughout About.
- My Path uses four personal place/graduation prints, restrained red thread and pins, and unboxed factual education/work notes. Preserve Will Education and OLI anchors. Each photo settles first, its pin presses down, and the thread leads to the next photo. Keep the total desktop sequence brief, with no replay button; narrow layouts reveal individual stops on entry.
- Skill uses the user’s real work: restored Prototyping and Collaboration photos plus the supplied wireframes, design system, interview, service blueprint, user flow, journey map and WCAG audit. The earlier SVG placeholders and their label are superseded. Keep varied paper proportions, clear handwritten captions and scattered transparent app-icon stickers. Skill is a compact overview: shrink all images, remove full-image links, and fit all nine skills in one normal viewport. Scale images separately from labels so skill names stay readable. Use the sticker-covered interview photo, never the exposed face version.
- Offscreen uses the user's football, tennis, golf and pickleball photos. Vary proportions, torn edges, an arched crop, overlap, tape and handwritten labels. Keep Mbappé and Kaká as small, irregular paper-outline photographic cutouts beside the football photo; Phoebe remains the visual focus. Fit the complete Offscreen collage into one normal desktop or phone viewport using viewport-relative image sizes. Remove table tennis from About. The six real paintings remain in the gallery.
- Short, overlapping entrances and scroll reveals use opacity and transforms; no continuous loops. Reduced motion stays static, all visual skill samples remain available without JavaScript, and painting links work before dialog enhancement.
- Desktop uses loose collage arrangements; mobile reflows the path into photo/note pairs and hobbies into staggered photo pairs. Keep all captions readable and headings on one line.
- Current sources and verification scope are recorded in `about/about-assets.md`. Older generated assets are unused, retained only for provenance.
