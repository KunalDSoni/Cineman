/* ════════════════════════════════════════════════════════════════
   NATIVE HAPTICS BRIDGE  ·  CineMan — The Reel
   ────────────────────────────────────────────────────────────────
   In a plain browser this file is inert: window.nativeHaptic() returns
   false and nothing happens. Inside the Capacitor iOS shell it calls a
   custom CoreHaptics plugin that plays AHAP patterns on the real Taptic
   Engine — the only way to get the F1-trailer feel (sharpness + intensity
   that ramp over time), which Safari cannot do.

   The patterns below ARE the haptics — edit these curves to taste; no
   native rebuild is needed for pattern changes (they are sent from JS).
   AHAP reference: developer.apple.com → Core Haptics → AHAP.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // intensity (0..1) = how hard · sharpness (0..1) = crisp tap (1) → soft body (0)
  const P = (id, v) => ({ ParameterID: id, ParameterValue: v });
  const transient = (t, intensity, sharpness) => ({
    Event: { Time: t, EventType: 'HapticTransient',
      EventParameters: [P('HapticIntensity', intensity), P('HapticSharpness', sharpness)] },
  });
  const sustained = (t, dur, intensity, sharpness) => ({
    Event: { Time: t, EventType: 'HapticContinuous', EventDuration: dur,
      EventParameters: [P('HapticIntensity', intensity), P('HapticSharpness', sharpness)] },
  });
  const curve = (t, points) => ({
    ParameterCurve: { ParameterID: 'HapticIntensityControl', Time: t,
      ParameterCurveControlPoints: points.map(([Time, ParameterValue]) => ({ Time, ParameterValue })) },
  });
  const ahap = (Pattern) => ({ Version: 1, Pattern });

  // ── The authored patterns ──────────────────────────────────────
  const PATTERNS = {
    // the slate clap — a hard crack, then a body that rings out along a curve
    clap: ahap([
      transient(0, 1.0, 0.95),
      sustained(0, 0.55, 0.85, 0.35),
      curve(0, [[0, 1.0], [0.12, 0.7], [0.55, 0.0]]),
    ]),
    // a deep press / 3D-card grounding thud
    thud: ahap([
      transient(0, 0.7, 0.2),
      sustained(0, 0.16, 0.6, 0.15),
      curve(0, [[0, 1.0], [0.16, 0.0]]),
    ]),
    // a light, crisp confirm tap
    tap: ahap([ transient(0, 0.55, 0.5) ]),
    // a tiny sprocket tick fired per scroll step (CoreHaptics handles the rate)
    tick: ahap([ transient(0, 0.35, 0.8) ]),
    // the finale — swells up, then releases
    wrap: ahap([
      transient(0, 1.0, 0.8),
      sustained(0.02, 0.7, 0.9, 0.4),
      curve(0.02, [[0, 0.3], [0.18, 1.0], [0.7, 0.0]]),
    ]),
  };

  const cap = window.Capacitor;
  const isNative = !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  let plugin = null, prepared = false;

  function get() {
    if (!isNative) return null;
    if (!plugin) plugin = (cap.Plugins && cap.Plugins.CinemanHaptics) || null;
    return plugin;
  }

  // Start the haptic engine (best done inside a user gesture).
  function prepare() {
    const p = get();
    if (!p || prepared) return;
    prepared = true;
    try { p.prepare(); } catch (_) {}
  }

  // Play a named pattern. Returns true if the native plugin was invoked.
  function nativeHaptic(name) {
    const p = get();
    if (!p) return false;
    const pattern = PATTERNS[name] || PATTERNS.tap;
    try { p.play({ ahap: pattern }); return true; } catch (_) { return false; }
  }

  window.nativeHaptic = nativeHaptic;
  window.prepareNativeHaptics = prepare;

  // Arm the engine on the very first interaction — within the gesture, as iOS prefers.
  if (isNative) {
    window.addEventListener('pointerdown', prepare, { once: true, passive: true });
    window.addEventListener('touchstart', prepare, { once: true, passive: true });
  }
})();
