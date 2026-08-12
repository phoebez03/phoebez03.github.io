# Serene Blue (active theme)

A clean, calm portfolio theme: white background, blue accents, and editorial serif/sans typography. Adopted from a Claude-generated "Serene" design system — kept the typography and blue palette, but dropped the system's warm canvas background in favor of plain white to stay clean and minimal. Small motion (staggered reveals, hover states) carries the personality; the palette and layout stay quiet.

Core idea: **simple / clean / peaceful, with small interaction motion.**

## Color Palette

- **White**: `#ffffff` — primary background (not the Serene system's warm canvas)
- **Slate 600**: `#4d648c` — primary accent (links, buttons, active states)
- **Slate 700**: `#3d5275` — hover/darker accent
- **Slate 200**: `#c7d3e4` — light accent (placeholders, light fills)
- **Slate 50/100**: `#eef2f8` / `#e3e9f2` — off-white sections, subtle borders
- **Ink**: `#2b323c` — primary text
- **Ink 2**: `#525a66` — secondary/muted text

## Typography

- **Headers**: Spectral (serif), weight 400–500 — loaded via Google Fonts (`Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400`)
- **Body Text**: Mulish (sans), weight 400–700 — loaded via Google Fonts (`Mulish:wght@400;500;600;700`)
- Spectral doesn't ship a 700 weight, so headings use 500 max — avoid forcing `font-weight: 700` on `var(--font-display)`, it'll fake-bold in the browser.

## Tokens (CSS variables, see `styles.css` `:root`)

```css
:root {
  --slate-900: #26344a;
  --slate-800: #314260;
  --slate-700: #3d5275;
  --slate-600: #4d648c; /* primary */
  --slate-500: #6178a0;
  --slate-400: #8294b8;
  --slate-300: #a6b6d0;
  --slate-200: #c7d3e4;
  --slate-100: #e3e9f2;
  --slate-50: #eef2f8;
  --ink: #2b323c;
  --ink2: #525a66;

  --white: #ffffff;
  --off-white: var(--slate-50);
  --black: var(--ink);
  --blue: var(--slate-600);
  --blue-hover: var(--slate-700);
  --blue-light: var(--slate-200);

  --font-display: 'Spectral', Georgia, serif;
  --font-body: 'Mulish', system-ui, sans-serif;
}
```

## Notes
- Background stays white/off-white everywhere — no warm canvas, no dark theme. This is a deliberate deviation from the source Serene design system.
- Use `--blue` sparingly for links, primary buttons, and active nav states; everything else stays neutral (white/ink/gray).
- Button shape, card radius, and shadow values were left as-is from the prior theme — only typography and color tokens changed.

## Notes from frontend-design skill
- Follow a consistent type scale and responsive spacing.
- Use semantic HTML and ARIA where needed.
- Provide focus-visible outlines for keyboard users.

## frontend-design skill (full)

Create distinctive, production-grade frontend interfaces with high design quality. Use when building web components, pages, or applications. Generate creative, polished code that avoids generic AI aesthetics.

### Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

### Frontend Aesthetics Guidelines

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive, characterful choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic — gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (e.g. Space Grotesk) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.
