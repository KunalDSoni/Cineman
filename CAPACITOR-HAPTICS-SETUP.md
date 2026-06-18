# CineMan — Native CoreHaptics (Capacitor) Setup

This wraps **The Reel** (`index.html`) in a native iOS app so it can drive the
**real Taptic Engine** via CoreHaptics — the only way to get F1-trailer-quality
haptics (sharpness + intensity that ramp over time). The web experience is
unchanged: in a browser the haptic calls are silent no-ops; in the app they
play authored AHAP patterns.

## What you need
- A **Mac with Xcode** (you have macOS).
- **Node** (you have it) — used only for the wrap tooling, not the site.
- A **real iPhone 8 or newer**. The Simulator and all iPads have **no** Taptic
  Engine, so haptics can only be felt on a physical phone.
- A free Apple ID runs it on your own phone (7-day signing). A paid Apple
  Developer account ($99/yr) is only needed to ship to the App Store.

## One-time setup
```bash
npm install                 # pulls @capacitor/core, /ios, /cli (the build tooling)
npm run build:web           # copies the site into www/ (Capacitor's webDir)
npx cap add ios             # generates the native ios/ project
```

### Add the haptics plugin to the iOS project
1. `npx cap open ios` (opens Xcode).
2. In Xcode, drag **`native/ios/CinemanHapticsPlugin.swift`** into the
   `App/App` group. In the dialog: tick **Copy items if needed** and the
   **App** target.
3. Capacitor 6/7 auto-registers it (it conforms to `CAPBridgedPlugin`). No
   extra Objective-C file is needed.

## Run it
```bash
npm run sync                # rebuilds www/ and runs `cap sync ios`
npx cap open ios            # in Xcode: pick your iPhone, set Signing Team, ▶ Run
```
Tap the slate, a film card, a button — you should feel the real CoreHaptics
patterns. On the Simulator nothing will be felt (expected — no hardware).

## Tuning the feel — no rebuild needed
The haptic patterns live in **`js/native-haptics.js`** as AHAP objects
(`clap`, `thud`, `tap`, `tick`, `wrap`). Edit the `intensity` / `sharpness`
values and the `curve(...)` control points, then:
```bash
npm run sync                # re-copies the web + syncs; reload the app
```
Because patterns are sent from JS, you only touch the Swift plugin if you want
to change the native API itself.

## Where it's wired (in `index.html`)
| Moment | Pattern |
|---|---|
| Slate clap (`fxStrike`) | `clap` |
| Film-card tap | `tap` |
| Button press | `thud` |
| Sound toggle | `tick` |
| Scroll sprocket | `tick` |
| "That's a wrap" finale | `wrap` |

## How it degrades
- **In a browser / GitHub Pages:** `window.Capacitor` is absent →
  `nativeHaptic()` returns `false` → nothing happens. The site is identical to
  before. (The old `<input switch>` web-haptic attempt still runs too; harmless.)
- **In the app on an unsupported device** (e.g. iPad): the plugin reports
  `supported:false` and silently no-ops.

## Honest limits
- This **requires a build step** — that breaks the original "zero build tools"
  rule, which is unavoidable: real haptics need native code.
- I scaffolded this but **cannot build or feel it for you** — no device here.
  Verify on your iPhone.
