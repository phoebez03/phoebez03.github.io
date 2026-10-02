# Asset organization

Project media is grouped by project first, then by purpose:

- `brand/` — project-specific logos and marks
- `cover/` — project-card and social-preview artwork
- `media/` — videos and their poster images
- `process/` — research, flows, iterations, and presentation artifacts
- `journey/` — ImpressChat learning-journey visuals
- `showcase/` — final product screens
- `design/` — final design-system and settings visuals
- `problem/` and `research/` — PageLens problem and research visuals
- `archive/` — unused earlier explorations kept for reference

The About page uses the same idea with `education/`, `profile/`, `studio/`, and `paintings/` folders.

## Naming convention

Use lowercase kebab case with the project name first:

`project-purpose-description.ext`

Examples:

- `bumble-product-walkthrough.mp4`
- `impresschat-process-04-ab-test.png`
- `kb-tutor-showcase-saq-feedback.png`
- `pagelens-process-03-experience-map.png`

Match video and poster names so they stay paired:

- `project-feature.mp4`
- `project-feature-poster.jpg`

Place superseded but potentially useful assets in the project’s `archive/` folder and add `legacy` to the filename when the older role is not otherwise obvious.

Keep route files such as `index.html` at the project root. Visual assets should always live in one of the purpose folders above.
