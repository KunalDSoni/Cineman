/* ═══════════════════════════════════════════════════════════
   CINEMAN — WEBGL CINEMATOGRAPHY ENGINE
   A volumetric atmosphere that the whole site lives inside.
   Three.js · screen-blended over the DOM · no build step.

   Layers (far → near):
     · haze blobs      — soft amber volumetric fog with depth
     · light shaft     — a drifting projector beam
     · depth dust      — motes that parallax with a handheld camera

   Driven by the site's living-atmosphere state (window.__cine):
   scroll exposure, scroll energy, breathing pulse. Restrained,
   premium, never a tech demo. Fails silently if WebGL is absent
   and leaves the CSS atmosphere as the floor.
═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE  = window.matchMedia('(pointer:coarse)').matches;
const SMALL   = window.matchMedia('(max-width:768px)').matches;

const AMBER  = new THREE.Color('#C8962E');
const GOLD   = new THREE.Color('#E4B44A');
const WARM   = new THREE.Color('#A8742A');

boot();

function boot() {
  const canvas = document.getElementById('cine-webgl');
  if (!canvas) return;

  // Own the canvas's structural styles inline so the layer is correct even if
  // the stylesheet is stale/cached — and, critically, so it is OUT of document
  // flow (a flowed canvas would feed its own size back into sizing and balloon).
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
    zIndex: '9992', pointerEvents: 'none', mixBlendMode: 'screen',
    opacity: '0', transition: 'opacity 1.4s ease',
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !SMALL,
      powerPreference: 'high-performance',
    });
  } catch (_) {
    return; // no WebGL — CSS atmosphere remains the floor
  }

  const DPR = Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = true;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 9);

  /* ── Shared cinematic state ── */
  const u = {
    time:     { value: 0 },
    pixel:    { value: DPR },
    energy:   { value: 0 },
    exposure: { value: 0.7 },
  };

  /* ───────── HAZE BLOBS — volumetric amber fog with depth ───────── */
  const hazeVert = /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `;
  const hazeFrag = /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform vec3  uColor;
    uniform float uTime;
    uniform float uBase;
    uniform float uExposure;
    uniform float uSeed;
    void main(){
      vec2 c = vUv - 0.5;
      float d = length(c) * 2.0;
      float a = smoothstep(1.0, 0.0, d);
      a = pow(a, 1.9);
      a *= 0.82 + 0.18 * sin(uTime * 0.28 + uSeed);   // slow breathing
      a *= uBase * uExposure;
      gl_FragColor = vec4(uColor, a);
    }
  `;
  function makeHaze({ size, x, y, z, color, base, seed }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor:    { value: color },
        uTime:     u.time,
        uExposure: u.exposure,
        uBase:     { value: base },
        uSeed:     { value: seed },
      },
      vertexShader: hazeVert,
      fragmentShader: hazeFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  makeHaze({ size: 95, x: -6, y:  4, z: -18, color: WARM, base: 0.16, seed: 0.0 });
  makeHaze({ size: 60, x:  9, y: -3, z:  -7, color: AMBER, base: 0.13, seed: 2.1 });
  makeHaze({ size: 42, x: -8, y: -6, z:   1, color: WARM, base: 0.09, seed: 4.4 });

  /* ───────── LIGHT SHAFT — a drifting projector beam ───────── */
  const shaftFrag = /* glsl */`
    precision highp float;
    varying vec2 vUv;
    uniform vec3  uColor;
    uniform float uTime;
    uniform float uBase;
    uniform float uExposure;
    uniform float uEnergy;
    void main(){
      float x = vUv.x - 0.5;
      float hor = exp(-x * x * 16.0);                          // soft beam core
      float ver = smoothstep(0.0, 0.30, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
      float a = hor * ver;
      a *= 0.78 + 0.14 * sin(uTime * 0.6) + 0.08 * sin(uTime * 2.3); // lamp flicker
      a *= uBase * uExposure * (0.75 + uEnergy * 0.6);
      gl_FragColor = vec4(uColor, a);
    }
  `;
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor:    { value: GOLD.clone() },
      uTime:     u.time,
      uExposure: u.exposure,
      uEnergy:   u.energy,
      uBase:     { value: 0.5 },
    },
    vertexShader: hazeVert,
    fragmentShader: shaftFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(30, 86), shaftMat);
  shaft.position.set(7, 2, -12);
  shaft.rotation.z = 0.34;
  scene.add(shaft);

  /* ───────── DEPTH DUST — motes that parallax with the camera ───────── */
  const COUNT = SMALL ? 170 : 460;
  const pos   = new Float32Array(COUNT * 3);
  const aScl  = new Float32Array(COUNT);
  const aSpd  = new Float32Array(COUNT);
  const aPhs  = new Float32Array(COUNT);
  const SPAN_Y = 44;
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 34;        // x
    pos[i * 3 + 1] = (Math.random() - 0.5) * SPAN_Y;    // y
    pos[i * 3 + 2] = -18 + Math.random() * 25;          // z (-18 → 7)
    aScl[i] = Math.random() * 0.8 + 0.35;
    aSpd[i] = Math.random() * 0.6 + 0.2;
    aPhs[i] = Math.random() * Math.PI * 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aScale',  new THREE.BufferAttribute(aScl, 1));
  dustGeo.setAttribute('aSpeed',  new THREE.BufferAttribute(aSpd, 1));
  dustGeo.setAttribute('aPhase',  new THREE.BufferAttribute(aPhs, 1));

  const dustMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     u.time,
      uPixel:    u.pixel,
      uEnergy:   u.energy,
      uExposure: u.exposure,
      uColor:    { value: GOLD.clone() },
    },
    vertexShader: /* glsl */`
      precision highp float;
      attribute float aScale;
      attribute float aSpeed;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixel;
      uniform float uEnergy;
      varying float vTwinkle;
      void main(){
        vec3 p = position;
        float span = 44.0;
        p.y = mod(p.y + uTime * (0.10 + aSpeed * 0.35) + span * 0.5, span) - span * 0.5;
        p.x += sin(uTime * 0.2 + aPhase) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = aScale * (52.0 + uEnergy * 46.0);
        gl_PointSize = s * uPixel / max(-mv.z, 0.1);
        vTwinkle = 0.5 + 0.5 * sin(uTime * 1.4 + aPhase * 6.283);
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3  uColor;
      uniform float uEnergy;
      uniform float uExposure;
      varying float vTwinkle;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        a = pow(a, 2.2);
        a *= 0.22 + 0.78 * vTwinkle;
        a *= (0.45 + uEnergy * 0.8) * uExposure;
        gl_FragColor = vec4(uColor, a * 0.9);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  scene.add(new THREE.Points(dustGeo, dustMat));

  /* ───────── CAMERA RIG — restrained handheld + parallax + gate-weave ───────── */
  const mouse  = { x: 0, y: 0 };
  const camPos = { x: 0, y: 0 };
  if (!REDUCED && !COARSE) {
    window.addEventListener('pointermove', e => {
      mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // window.innerWidth is unreliable in throttled/embedded contexts (can collapse
  // to a few px), so size to the canvas's own laid-out box and self-heal each
  // frame — the standard resize-to-display pattern.
  let lastW = 0, lastH = 0;
  function syncSize() {
    // Size from the VIEWPORT, never the canvas's own box — reading the canvas
    // back would create a feedback loop and grow it without bound.
    const w = document.documentElement.clientWidth  || window.innerWidth;
    const h = document.documentElement.clientHeight || window.innerHeight;
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', syncSize, { passive: true });

  /* Pull cinematic state from the living-atmosphere engine. */
  function pull() {
    const c = window.__cine;
    if (c) {
      u.energy.value   = c.energy ?? 0;
      u.exposure.value = 0.42 + 0.58 * (c.exposure ?? 0.7);  // remap to [0.42,1]
    }
  }

  const clock = new THREE.Clock();
  let running = true;
  let looping = false;

  function loop() {
    if (!running) { looping = false; return; }
    looping = true;
    syncSize();                       // self-heal to the real display size
    u.time.value += clock.getDelta();
    const t = u.time.value;
    pull();

    if (!REDUCED) {
      // restrained handheld drift
      const hx = Math.sin(t * 0.7) * 0.26 + Math.sin(t * 0.31) * 0.16;
      const hy = Math.cos(t * 0.5) * 0.20 + Math.sin(t * 0.19) * 0.12;
      // film gate-weave — tiny vertical instability at ~ projector cadence
      const gate = Math.sin(t * 6.4) * 0.010 + Math.sin(t * 11.7) * 0.006;
      const tx = mouse.x * 1.7 + hx;
      const ty = -mouse.y * 1.05 + hy + gate;
      camPos.x += (tx - camPos.x) * 0.035;
      camPos.y += (ty - camPos.y) * 0.035;
      camera.position.x = camPos.x;
      camera.position.y = camPos.y;
      camera.rotation.z = Math.sin(t * 0.23) * 0.004;  // breath of roll
      camera.lookAt(0, 0, -4);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !looping) { clock.getDelta(); requestAnimationFrame(loop); }
  });

  // Reveal once a real frame is on screen, then run (or hold still if reduced).
  syncSize();
  pull();
  renderer.render(scene, camera);
  document.documentElement.classList.add('webgl-on');
  canvas.style.opacity = REDUCED ? '0.5' : '1';   // fade in (inline; cache-proof)
  if (!REDUCED) requestAnimationFrame(loop);
}
