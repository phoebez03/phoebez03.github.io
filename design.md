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
- Section heading: `clamp(38px, 4.4vw, 66px)`.
- Card heading: `clamp(27px, 2.5vw, 38px)`.
- Lead: `clamp(18px, 1.55vw, 24px)`.
- Body: `clamp(15px, 1.08vw, 17px)`.
- Labels and keyword badges: 11–13px, weight 600.

Headings use the primary ink, compact line-height, balanced wrapping, and a maximum of two lines whenever the copy permits.

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

Overview → Highlights → Impact → Problem → Process → Product Walkthrough → Design Decisions → Reflection.

Use KB Tutor as the reference implementation for shared hierarchy, components, and animation behavior.
