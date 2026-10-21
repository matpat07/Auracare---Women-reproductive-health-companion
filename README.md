# 🌸 Aura Care — Prototype

**Innovate4Impact Hackathon** · Team Aura Care  
An AI-powered mental wellness companion designed for **women of all ages** — from teens navigating identity, to mothers, working women, midlife, and seniors.

## 🚀 Run
Just open `index.html` in any modern browser. No build step, no dependencies.

```bash
open index.html      # macOS
```

Or serve locally:
```bash
python3 -m http.server 8080
```

## 📱 Pages
| File | Description |
|------|-------------|
| `index.html` | Landing / marketing page |
| `dashboard.html` | Mood tracker, weekly chart, streak, SOS |
| `chat.html` | Aura AI empathetic companion for women |
| `resources.html` | Breathing, meditation, self-love journaling |
| `community.html` | Anonymous Sisterhood peer support feed |

## ✨ Features Implemented
- ✅ Mood logging with `localStorage` persistence
- ✅ Weekly mood chart
- ✅ AI chatbot tuned for women's concerns (anxiety, burnout, hormones, loneliness, safety)
- ✅ Guided breathing animation
- ✅ Body-scan meditation stepper
- ✅ Self-love journal (persisted)
- ✅ CBT thought reframing
- ✅ Web Audio calming soundscapes (rain / ocean / forest)
- ✅ Sisterhood community feed with anonymous alias
- ✅ Crisis modal with real Indian women's helplines (181, 1091 + mental health)
- ✅ Responsive, calming dark UI

## 💜 Why "Every Woman"?
1 in 5 women face anxiety or depression in her lifetime — 2× the rate of men. Yet 80% never seek help due to stigma, cost, or safety concerns. Aura Care is anonymous, free, and designed for every life stage a woman moves through.


## Pastel interface refresh

Open `dashboard.html` directly, or run `python -m http.server 8080` from this folder and visit http://localhost:8080/dashboard.html. No dependencies or build step are required. `index.html` remains the landing page.

- `pastel.css`: five pastel tokens, serif headings, glass cards, responsive layouts, focus states and reduced-motion support.
- `ui.js`: shared icon navigation, eleven feature tiles, back links and direct feature URLs. Existing feature scripts and localStorage keys remain intact.
- `dashboard.html`: new home dashboard and care grid, with existing mood and cycle tools preserved.
- `sos.html`: dedicated support screen with a locally saved trusted phone contact and explicit call link.
- All existing HTML pages load the shared theme and navigation; `style.css` retains the component layouts with updated colors.

Direct screens include `lifestage.html#teen`, `#pcos`, `#pregnancy`, `#menopause`, and `health.html#vault`, `#nutrition`, `#fitness`, `#summary`. Clearly labeled illustrative previews never populate saved health records. The chat remains the existing scripted prototype, not a live AI service.


## Interactive homepage

Open `index.html` directly, or run `python -m http.server 8080` and visit http://localhost:8080/.

The homepage uses its own `home.css` and `home.js` so its light/dark themes and animations do not interfere with the existing app screens. The living canvas edition includes:

- Pointer-driven 3D parallax on desktop and a botanical HTML canvas using the five pastel brand colors. One 30fps render loop is capped at 38 particles (18 on mobile) and a 1.75 device pixel ratio. It pauses when the hero leaves the viewport or the document is hidden.
- Keyboard-accessible life-stage tabs and previous/next controls. A shared `FluidSurface` engine morphs decorative SVG paths and briefly animates displacement filters, leaving text and controls crisp. Rapid selections cancel and retarget the current transition.
- A start/stop/reset breathing stepper with three rounds of four-second inhales and exhales. Timers stop when the document is hidden; delayed callbacks reset rather than rushing missed steps.
- IntersectionObserver structural reveals, spring-like control feedback, a manual motion pause, reduced-transparency and forced-color fallbacks. Every CSS animation/transition is inside `prefers-reduced-motion: no-preference`; JavaScript also responds to live preference changes. With reduced motion, controls and timers still function while visual movement is disabled.
- System-aware light/dark themes with saved preferences. The homepage does not create or modify health records. Without JavaScript, content stays visible, chapter links remain available, and the breathing instructions remain readable.

Modules in `home.js` cover safe preference storage, theme/motion coordination, reveal observation, bounded fluid transitions, chapter state, breathing state, the canvas/parallax island, and page lifecycle cleanup. There are no framework, animation-library, or network asset dependencies.

Run the dependency-free interaction/lifecycle checks with:

```powershell
node --test tests/home.test.cjs
```

These tests cover state and lifecycle behavior using a DOM test harness. They do not substitute for checking rendering at 375px, 768px, and 1440px in both themes, plus reduced-motion and pointer/touch modes, in a browser.
