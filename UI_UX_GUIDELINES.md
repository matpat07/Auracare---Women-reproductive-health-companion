# AuraCare UI/UX guidelines reference

Reviewed on 2026-10-21. Scope: all 25 authored Markdown documents under `skills_UI_UX/` (20 SKILL.md files and five supporting references/templates), plus an inventory of bundled dependencies and the liquid-glass package documentation. Third-party compiled React/Scheduler internals and source maps are not design guidance.

This folder is a skill collection, not one canonical token package or ready-to-use component library. The common principles below are a synthesis. Exact examples and optional aesthetic rules remain in their source files. No application styling changed as part of this review.

## Core principles

1. **Read the brief before choosing a style.** Match the audience, screen purpose, existing identity, information density, and desired motion. Distinguish marketing pages from product screens.
2. **Preserve working products.** Audit the existing stack, routes, brand tokens, content, and interactions. Improve in focused steps rather than migrating frameworks or rewriting working features.
3. **Make hierarchy do the work.** Use clear reading order, deliberate type scales, controlled line lengths, purposeful whitespace, and consistent alignment. Avoid tiny supporting copy, awkward wraps, excessive micro-labels, and repeated section templates.
4. **Use a coherent token system.** Define colors by role; keep type, spacing, radii, shadows, icon weight, and layering consistent across screens. Light and dark modes need equivalent contrast and hierarchy.
5. **Design complete interactions.** Real navigation, back paths, selected states, press feedback, visible focus, inline errors, meaningful empty states, and layout-matched loading placeholders.
6. **Accessibility is part of the design.** Semantic HTML, accessible names, visible labels, keyboard support, alt text for meaningful images, non-color status cues, adequate contrast, and comfortable tap targets.
7. **Motion needs a reason.** Feedback, orientation, state changes, and narrative are valid reasons. High-frequency controls should be fast or static. Reduced-motion support and interruption/cleanup behavior matter as much as the entrance effect.
8. **Restrain decoration and copy.** Avoid generic gradients, unnecessary frosted panels, shadows everywhere, endless nested cards, emoji icon substitutes, fake metrics, generic names, and inflated marketing language.
9. **Use assets deliberately.** Consistent crop ratios, image treatment, platform conventions, and brand direction. Image-design workflows call for readable separate section/screen references and faithful extraction rather than a compressed collage.
10. **Verify what ships.** Check keyboard interactions, state changes, both themes, mobile overflow, and real destinations. Distinguish source inspection from rendered/browser evidence.

## Concrete values in the collection

These are source examples or recommended ranges, not a single merged stylesheet.

| Area | Values and rules found | AuraCare application |
| --- | --- | --- |
| Accent colors | Many skills prefer one restrained accent; minimalist examples include `#FDEBEC`, `#E1F3FE`, `#EDF3EC`, `#FBF3DB` | Keep the user's five pastels: `#F8C8DC`, `#D8C7F5`, `#FFD9C7`, `#CDEBDD`, `#CFE3F8` |
| Neutral surfaces | Minimalist: `#F7F6F3`, `#FBFBFA`, `#FFFFFF`; Stitch: `#F9FAFB`, `#FFFFFF` | Use established semantic light/dark surface tokens rather than copying another aesthetic's palette |
| Text and borders | Minimalist: `#2F3437`, `#787774`, `#EAEAEA`; Stitch: `#18181B`, `#71717A`, `#94A3B8`, translucent whisper borders | Verify contrast for each text role in both themes; muted/tertiary examples are not automatically accessible |
| Typography | Geist, Satoshi, Outfit, Cabinet Grotesk; editorial examples include Newsreader, Playfair Display, modern display serifs; mono examples include Geist Mono and JetBrains Mono | Preserve the requested serif/sans pairing; do not assume named commercial fonts are available |
| Readability | About `65ch` body width; `1.6–1.65` line height; `16px` preferred body text with a `14px` lower bound in responsive guidance | Keep content readable instead of shrinking it to fit |
| Display type | Tight tracking around `-0.02em` to `-0.04em`; responsive `clamp()` scales; short 1–3-line headlines in image workflows, stricter two-line desktop heroes in design-taste | Tune to the actual copy and viewport; reserve descender space for italic headings |
| Spacing/layout | Card padding often `24–40px`; section spacing often `6–10rem` or larger in cinematic variants; max-width usually `1200–1440px`; mobile collapse commonly below `768px` | Scale spacing to screen purpose; use explicit responsive rules and CSS Grid |
| Corners | Minimalist cards `8–12px`, buttons `4–6px`; high-end nested shells around `2rem`; Stitch cards `2.5rem`; brutalist corners `0` | Keep AuraCare's requested `20–28px` containers and a documented inner/outer radius relationship |
| Shadows | Restrained diffuse shadows, often alpha below `.05`; Stitch example `0 20px 40px -15px rgba(0,0,0,.05)` | Soft depth only where it communicates hierarchy; glass is intentional, not universal |
| Hit areas/contrast | `44×44px` preferred targets; Rams notes `24×24px` minimum in its WCAG 2.2 review checklist; normal text `4.5:1`, large text `3:1` | Target `44×44px` or larger and WCAG AA; keep keyboard focus visible |
| Interaction durations | Press feedback `100–160ms`; tooltips `125–200ms`; dropdowns `150–250ms`; ordinary UI generally under `300ms`; explanatory motion can be slower | Use shared timing tokens; do not apply the UI timing budget to the breathing exercise |
| Easing | `cubic-bezier(0.23,1,0.32,1)` ease-out; `cubic-bezier(0.77,0,0.175,1)` on-screen motion; `cubic-bezier(0.32,0.72,0,1)` drawers | Choose by interaction, keep consistent, and avoid arbitrary transition-all rules |
| Springs/staggers | Stitch: stiffness `100`, damping `20`; animation audit: duration `.5`, bounce `.2`; stagger guidance varies between `30–50ms` and `30–100ms` | Short, non-blocking sequences; no universal requirement for springs or loops |
| Verification sizes | `375`, `390`, `768`, `1024`, `1440px` appear in responsive guidance | Test relevant sizes in both themes when browser tools are available |
| Performance targets | LCP `<2.5s`, INP `<200ms`, CLS `<0.1` | Targets require measurement; never infer passing metrics from code alone |

## Differences that must stay explicit

- **Flat versus glass:** `minimalist-ui` bans gradients and glass effects; `high-end-visual-design` advocates nested glass-like shells. AuraCare's requested subtle glass/gradient styling overrides a blanket ban, but not readability or performance requirements.
- **Typeface rules:** Some files recommend Instrument Serif/Fraunces; `design-taste-frontend` discourages those as defaults. Some ban serif in dashboards; the user's AuraCare brief explicitly requests serif headings. Select fonts in context rather than applying all bans.
- **Palette and radius rules:** One-accent and square-corner prescriptions belong to specific styles. They do not supersede AuraCare's five-pastel, rounded identity. Industrial brutalism is an optional direction, not this app's default.
- **Motion rules:** `gpt-taste` requires GSAP and `stitch-design-taste` recommends perpetual component motion. `deslop`, `design-taste-frontend`, and the animation advisor require purposeful restraint. Use native CSS/JavaScript for this app unless the task justifies a library; do not add animation everywhere.
- **Timing rules:** The 12-principles checklist prefers ease-in exits, while the animation advisor prefers ease-out for both entrance and exit. Use the selected task-specific motion standard consistently rather than mixing both mechanically.
- **Image workflows:** `imagegen-frontend-web` creates one horizontal image per section; `imagegen-frontend-mobile` is image-only and platform-aware; `image-to-code` generates/analyzes references before implementation. These are scoped workflows, not instructions to generate images during a documentation scan or every small code fix.
- **Tool availability:** Some files reference external CLIs, hosted review/graph tools, unbundled block-library paths, or missing companion skills. Verify availability when needed. Do not claim to have run those tools or silently install them.

## Full source map

| File under skills_UI_UX/ | Purpose |
| --- | --- |
| `ui-skills-root/SKILL.md` | Route to the smallest relevant skill set; normally one, at most three |
| `design-taste-frontend/SKILL.md` | Brief inference, design/motion/density dials, marketing-page rules, themes, redesign preservation, preflight, design-system references |
| `redesign-existing-projects/SKILL.md` | Scan, diagnose, and improve within the existing stack without breaking functionality |
| `refined-web-ui/SKILL.md` | devl.dev-first component references; adapt compatible patterns and verify actual dependencies/licensing |
| `minimalist-ui/SKILL.md` | Flat editorial aesthetic, warm neutrals, restrained pastels, precise type and spacing |
| `high-end-visual-design/SKILL.md` | Premium visual archetypes, nested shells, tactile controls, responsive collapse, motion/performance guardrails |
| `gpt-taste/SKILL.md` | AIDA structure, constrained headline wrapping, dense bento composition, GSAP storytelling concepts |
| `stitch-design-taste/SKILL.md` | Generate semantic DESIGN.md specifications for Stitch |
| `stitch-design-taste/DESIGN.md` | Example palette, components, dials, typography, responsive and motion specifications |
| `deslop/SKILL.md` | Remove decorative, copywriting, and interaction clichés that do not serve content |
| `rams/SKILL.md` | Accessibility and visual review; current local checklist refers to WCAG 2.2 |
| `rams/rams.md` | Earlier largely overlapping review checklist referring to WCAG 2.1 |
| `12-principles-of-animation/SKILL.md` | File/line motion review covering timing, easing, physics, and staging |
| `improve-animations/SKILL.md` | Read-only animation audit and prioritized implementation-plan workflow |
| `improve-animations/AUDIT.md` | Eight audit categories, exact timing/easing values, performance, accessibility, interruptibility |
| `improve-animations/PLAN-TEMPLATE.md` | Self-contained plans with evidence, target values, boundaries, and verification |
| `image-to-code/SKILL.md` | Generate clear reference images, extract design details, then implement faithfully |
| `imagegen-frontend-web/SKILL.md` | Separate horizontal website-section images, consistent palette, narrative and composition variety |
| `imagegen-frontend-mobile/SKILL.md` | Image-only native-feeling screens/flows; safe areas, device framing, readable content, screen consistency |
| `brandkit/SKILL.md` | Coherent identity boards, meaningful logo concepts, restrained copy, consistent brand applications |
| `industrial-brutalist-ui/SKILL.md` | Optional Swiss industrial or tactical terminal visual direction with rigid grids and square geometry |
| `seo/SKILL.md` | Evidence-led technical metadata, crawlability, semantic structure, mobile and structured-data review |
| `seo/references/STRUCTURED-DATA.md` | Organization, Article, Product, FAQ, Breadcrumb JSON-LD examples and validation |
| `codebase-memory/SKILL.md` | Structural graph-query workflows with coverage/freshness checks; not a visual token system or persistent-memory feature |
| `full-output-enforcement/SKILL.md` | Complete deliverables, no omitted-code placeholders, explicit scope checks |

## Bundled packages

`node_modules/` contains React, React DOM, Scheduler, and `@samasante/liquid-glass` with distribution files, licenses, metadata, and documentation. These packages do not make the existing buildless app a React app. The liquid-glass documentation distinguishes live backdrop refraction from a copied-content approach and browser-specific fallbacks; verify current behavior before adopting it. No dependency installation or integration was performed for this review.

## Future-work routing

Read this reference, inspect the affected UI, and select matching original skills. Preserve the user brief and existing design tokens. For focused UI upgrades, prioritize existing-project guidance; add accessibility, animation, image, or SEO guidance only when relevant. The scope and conflicts above prevent an unrelated aesthetic from overwriting AuraCare's identity.
