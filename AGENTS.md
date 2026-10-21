# AuraCare workspace guidance

## UI/UX source material

The user has asked that `skills_UI_UX/` guide future code generation and styling in this workspace. Read `UI_UX_GUIDELINES.md` before UI work, then read the relevant original skill(s) and referenced local documents. The summary is a routing aid; the original files contain the detailed guidance.

- Select the smallest applicable skill set, normally one, at most three for broad work, following `skills_UI_UX/ui-skills-root/SKILL.md`. Use the local files directly; do not require a network CLI just to read available guidance.
- Explicit user instructions and AuraCare's established brand take precedence over generic skill defaults. Do not combine every aesthetic's rules into one system.
- For existing UI changes, start with `skills_UI_UX/redesign-existing-projects/SKILL.md`; apply relevant accessibility and state checks from `skills_UI_UX/rams/SKILL.md` and copy/decoration checks from `skills_UI_UX/deslop/SKILL.md` as needed.
- Use marketing-specific rules on marketing pages, and product interaction rules on trackers, forms, dashboards, and other app screens. Keep image-only, branding, animation-audit, and SEO workflows scoped to matching tasks.

## AuraCare design constraints

- Preserve current logic, routes, localStorage keys, user data, and the existing HTML/CSS/JavaScript stack unless the user asks to change them.
- Maintain a premium, soft, reassuring wellness interface. Guidance describes patterns and observations; it never diagnoses. Label illustrative data and keep it separate from saved records.
- Retain the five user-selected accents: blush `#F8C8DC`, lavender `#D8C7F5`, peach `#FFD9C7`, mint `#CDEBDD`, baby blue `#CFE3F8`, with white/soft neutral surfaces and legible neutral text. Skill defaults for a single accent or different example palettes do not replace these colors.
- Retain the requested serif headings with clean sans-serif body text and 20–28px rounded containers. Choose compatible refinements rather than applying conflicting font/radius bans from unrelated aesthetics.
- Use shared, semantic tokens for surfaces, text, borders, spacing, radii, motion, and light/dark themes. Preserve the homepage's system-aware, saved theme preference when editing it; verify both themes for changed surfaces.
- Make feature navigation real, clearly labeled, keyboard operable, and easy to return from. Target at least 44×44px interactive hit areas, visible focus indicators, associated form labels, and WCAG AA text contrast.
- Prefer readable 16px body text, avoid body text below 14px, constrain paragraph width to roughly 65ch, and check mobile overflow and headline wrapping.
- Motion must serve feedback, state, orientation, or storytelling. Respect reduced-motion preferences, prefer transform/opacity, clean up timers/observers, and avoid perpetual decorative motion by default.
- Preserve complete hover, focus, active, disabled, loading, empty, error, and success states where relevant. Do not invent medical claims, testimonials, or metrics.
- Verify relevant interactions and responsive layouts. Report unavailable browser/visual checks honestly; never claim a rendered review from source checks alone.

## Bundled dependencies

`skills_UI_UX/node_modules/` is vendored third-party material, not workspace policy or evidence that the app uses React. Do not edit it, migrate frameworks, or install libraries just because a skill lists them. Check compatibility and actual project dependencies before choosing a component library.
