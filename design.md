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
- Homepage hero: `clamp(44px, 5.2vw, 72px)`, weight 600, line-height 1.0, two lines on desktop.
- Project hero: `clamp(50px, 6.4vw, 98px)`.
- Case-study section heading: semantic `h3`, `clamp(19px, 1.8vw, 25px)`, weight 600, one line on desktop.
- Card heading: `clamp(20px, 1.8vw, 24px)`, always smaller than the section heading in perceived hierarchy.
- Lead: `clamp(18px, 1.55vw, 24px)`.
- Body: `clamp(15px, 1.08vw, 17px)`.
- Labels and keyword badges: 11–13px, weight 600.

Headings use the primary ink and a compact line-height. Prefer one concise line; two lines is the absolute maximum on desktop. Edit the copy before reducing the type size, and never enlarge a heading merely to fill space. Card headings must remain at least one clear type step below their section heading.

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

## Motion

- Micro-interaction: 180–220ms.
- Card/section transition: 320–700ms using a smooth ease-out curve.
- Entrance reveal: subtle opacity and 18–28px vertical movement.
- Typing effects are reserved for short identity statements and must leave the full text accessible.
- Reduced motion: remove typing, transforms, autoplay, and long transitions while keeping all content visible.

## Case-Study Structure

Hero → Problem → Product Overview → Process (Research, Design, Test, Iterate) → Final Experience → Impact → Reflection.

Use KB Tutor as the reference implementation for shared hierarchy, components, and animation behavior.

- Pair the chapter label with a concise one-line `h3`; allow wrapping only on narrow screens.
- Use 15px muted body copy inside case-study cards and supporting section notes.
- Use 18px-radius white cards with a subtle grey hairline on the secondary surface.
- Default case-study cards to a two-column composition: concise text on the left and the primary image, chart, interface, or diagram on the right. Stack the columns only on narrow screens.
- Vertically center the text panel within two-column cards so short descriptions stay visually balanced with the artifact.
- Treat image clarity as a layout decision, not a hover interaction. Keep concise copy on the left and the full visual on the right; widen the card before stacking it, constrain the card to roughly one viewport, and use `contain` on a tinted surface to avoid cropping or white letterboxing. Use the KB Tutor-style overlap for multi-image explorations, with every layer revealable by hover, keyboard focus, or click.
- When a chapter contains multiple comparable artifacts, use the KB Tutor horizontal card track with right-aligned circular arrow controls.
- Every contents bar includes Impact. Mark the current chapter with charcoal text and a thin underline, never color alone. Keep chapter tracking active with reduced motion enabled.
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
- Portrait highlight cards are narrower than landscape-artifact cards: approximately 660px total width, with a 280px image column.

### PageLens

- Order: Hero → Problem → Process → Concept (both videos) → Design decisions → Impact → Reflection.
- Use the same H3 hierarchy, 15px supporting copy, horizontal stage/decision tracks, and neutral cards as KB Tutor.
- Keep reading simulations explicitly labeled as illustrative, not universal depictions of dyslexia.
