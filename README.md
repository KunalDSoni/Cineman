# CineMan Productions — Website

> *"We don't make films. We engineer feeling."*

A world-class cinematic website for **CineMan Productions** — the Ahmedabad-based production house that pioneered the revival of Gujarati cinema and evolved into a premium branded storytelling studio.

---

## Overview

This is a fully hand-coded, production-ready website built with a **premium, cinematic** aesthetic philosophy. The design revolves around a **cinematic yellow × matte black** palette — drawn from Kodak film amber, tungsten lighting, and projector gold.

**Live experience:** Open `index.html` in any modern browser.

---

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Full homepage — 11 cinematic sections |
| `films.html` | Complete CineMan filmography |
| `case-study.html` | Wrong Side Raju — National Award case study |
| `brand-bible.html` | Full design system & brand documentation |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 |
| Styling | Vanilla CSS with custom properties (design tokens) |
| Animation | [GSAP 3.12](https://greensock.com/gsap/) + ScrollTrigger |
| Scroll | [Lenis](https://github.com/studio-freight/lenis) smooth scroll |
| Grain | Canvas API — animated film grain at 60fps |
| Fonts | Bebas Neue, Playfair Display, Space Grotesk (Google Fonts) |
| Icons | Unicode symbols (zero dependencies) |

No build tools. No frameworks. No npm. Open `index.html` and it works.

---

## Design System

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Kodak Amber | `#C8962E` | Primary brand, CTAs, accents |
| Projector Gold | `#E4B44A` | Headlines, hover states |
| Tungsten Film | `#D4A040` | Mid-tone gold, actives |
| Cinema Black | `#080705` | Primary background |
| Deep Charcoal | `#100E0B` | Section backgrounds |
| Card Surface | `#1A1714` | Cards, elevated panels |
| Warm Cream | `#F5EDD8` | Primary text |

### Typography

- **Display / Film Titles** — `Bebas Neue` — oversized, cinematic, tight tracking
- **Editorial** — `Playfair Display` — luxury serif for statements and pull quotes
- **UI / Body** — `Space Grotesk` — clean geometric for navigation and body text

### Motion System

- **Film Grain** — Canvas-based animated noise at 4.5% opacity (`mix-blend-mode: overlay`)
- **Custom Cursor** — Dual-ring with lerp lag + magnetic CTAs + VIEW state on film cards
- **Cinematic Loader** — Film countdown (5→1) with filmstrip frame holes
- **Hero Reveal** — `clip-path` word-by-word stagger (0.18s per word)
- **Parallax** — GSAP ScrollTrigger scrub on hero background
- **Card Tilt** — 3D perspective response to mouse (±6°, `elastic.out` spring-back)
- **Magnetic Buttons** — CTAs physically attract toward cursor (±25% offset)
- **Film Burn** — Amber flash overlay on high-velocity scroll
- **Lenis Smooth Scroll** — Cinema-grade inertia (`duration: 1.4s`)

Full motion documentation in [`brand-bible.html`](brand-bible.html).

---

## Project Structure

```
/
├── index.html          # Homepage
├── films.html          # Films page
├── case-study.html     # Wrong Side Raju case study
├── brand-bible.html    # Design system documentation
├── css/
│   └── style.css       # Complete design system (~2,200 lines)
├── js/
│   └── main.js         # Animations & interactions (~1,000 lines)
└── assets/             # Media assets (video, images)
```

---

## About CineMan Productions

Founded in **2010** in Ahmedabad, Gujarat by **Abhishek Jain**, **Mikhil Musale**, and **Anish Shah** — CineMan became one of the pioneering forces behind the revival of Gujarati cinema.

**Landmark Films:**
- **Kevi Rite Jaish** (2012) — The film that reignited Gujarati cinema
- **Bey Yaar** (2014) — Gujarati cinema finds its emotional voice
- **Wrong Side Raju** (2016) — National Award, Best Gujarati Film

**Expansions:**
- Collaboration with **Phantom Films**
- Founded **OHO Gujarati** — the first dedicated Gujarati OTT streaming platform
- Premium branded storytelling, commercials, founder stories, and digital campaigns

> *From reviving regional cinema to crafting global brand storytelling.*

---

## Copywriting Philosophy

The website copy is written in the voice of **cinematic, director-led storytelling**. Guiding principle: write like a director, not a marketer.

**Never:** "We are passionate about creative solutions"  
**Always:** "Cinema for brands that want to be remembered"

See full copy system in [`brand-bible.html`](brand-bible.html).

---

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.  
Mobile-first responsive. Touch-aware (swipe gestures on carousel, cursor hidden on touch devices).

---

*CineMan Productions — Est. 2010, Ahmedabad, India*  
*A Cinematic Storytelling Universe.*
