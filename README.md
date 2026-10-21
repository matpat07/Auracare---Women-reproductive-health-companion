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

The homepage uses its own `home.css` and `home.js` so its light/dark themes and animations do not interfere with the existing app screens. It includes scroll reveals and a progress indicator, animated 2D botanical artwork, three clickable cycle previews, keyboard-accessible life-stage tabs, expandable FAQs, and a start/stop breathing exercise. Theme selection follows your system initially and remembers an explicit choice in this browser. Reduced-motion preferences are respected; content remains visible without JavaScript. Cycle previews are illustrative and do not write to saved health data.
