/* ═══════════════════════════════════════════════════════════
   CINEMAN PRODUCTIONS — CINEMATIC THRILLER INTERACTION SYSTEM
   Version 2.0 — Premium Cinematic Experience
   GSAP · Lenis · Film Grain · Blur-to-Focus · Word Illuminate
═══════════════════════════════════════════════════════════ */

'use strict';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

let lenis = null;
let currentWork = 0;
const TOTAL_WORK = 3;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Type text out character-by-character (opening-credit feel) */
function typeText(el, text, speed = 45) {
  if (!el) return;
  el.style.opacity = '1';
  el.textContent = '';
  let i = 0;
  const id = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(id);
  }, speed);
}

/* Guaranteed hero-visible fail-safe — never let the opening strand the hero */
function forceHeroVisible() {
  $$('.hero-line .char').forEach(c => {
    c.classList.add('is-visible');
    c.style.opacity = '1';
    c.style.filter = 'none';
    c.style.transform = 'none';
  });
  ['#hero-eyebrow', '#hero-sub', '#hero-actions'].forEach(s => {
    const e = $(s);
    if (e) { e.style.opacity = '1'; e.style.transform = 'none'; }
  });
  $$('.hstat').forEach(e => { e.style.opacity = '1'; e.style.transform = 'none'; });
  $$('.hstat-div').forEach(e => { e.style.opacity = '1'; });
  const sc = $('.hero-scroll-cue');
  if (sc) sc.style.opacity = '1';
}

/* ─────────────────────────────────────────
   1. FILM GRAIN CANVAS (overlay on everything)
───────────────────────────────────────── */
function initGrain() {
  const canvas = $('#grain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i+1] = d[i+2] = v;
      d[i+3] = 16;
    }
    ctx.putImageData(img, 0, 0);
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  draw();
}

/* ─────────────────────────────────────────
   1b. CINEMATIC CANVAS HERO BACKGROUND
   Projector-in-dark-theatre atmosphere.
   Runs after DOM ready — always visible regardless of YouTube.
───────────────────────────────────────── */
function initCinematicCanvas() {
  // Defer until DOM + layout are ready
  const run = () => {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    let t = 0;
    let mouse = { x: 0.82, y: 0.1 };
    let particles = [];

    function spawnParticles() {
      particles = Array.from({ length: 80 }, () => ({
        x:     Math.random(),
        y:     Math.random(),
        r:     Math.random() * 1.6 + 0.4,
        vx:    (Math.random() - 0.5) * 0.00010,
        vy:   -(Math.random() * 0.00022 + 0.00007),
        o:     Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      spawnParticles();
    }

    document.addEventListener('mousemove', e => {
      mouse.x = e.clientX / W;
      mouse.y = e.clientY / H;
    }, { passive: true });

    function drawFrame(ts) {
      t = ts;
      ctx.clearRect(0, 0, W, H);

      /* Base — transparent so the CSS gradient behind shows through */
      ctx.clearRect(0, 0, W, H);

      /* ── Projector light cone from upper-right ── */
      const srcX = W * 0.86;
      const srcY = H * (-0.05);

      // Organic flicker — layered frequencies for realistic lamp behaviour
      const flicker =
        0.84 +
        0.10 * Math.sin(t * 0.000095) +
        0.05 * Math.cos(t * 0.000041) +
        0.02 * Math.sin(t * 0.00031)  +
        (Math.random() > 0.95 ? (Math.random() - 0.5) * 0.06 : 0);

      // Primary wide cone
      ctx.save();
      ctx.beginPath();
      const coneLen = Math.max(W, H) * 2.0;
      const halfAng = 0.48;
      const coneDir = Math.PI * 0.67;
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(
        srcX + Math.cos(coneDir + halfAng) * coneLen,
        srcY + Math.sin(coneDir + halfAng) * coneLen
      );
      ctx.lineTo(
        srcX + Math.cos(coneDir - halfAng) * coneLen,
        srcY + Math.sin(coneDir - halfAng) * coneLen
      );
      ctx.closePath();
      ctx.clip();

      const cg = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, coneLen);
      cg.addColorStop(0,    `rgba(255,210,110,${0.72 * flicker})`);
      cg.addColorStop(0.05, `rgba(240,185,70,${0.55 * flicker})`);
      cg.addColorStop(0.15, `rgba(210,155,45,${0.32 * flicker})`);
      cg.addColorStop(0.40, `rgba(160,110,25,${0.13 * flicker})`);
      cg.addColorStop(0.70, `rgba(90,55,10,${0.04 * flicker})`);
      cg.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Secondary hot spot at source (bright lamp core)
      const hg = ctx.createRadialGradient(srcX, srcY, 0, srcX, srcY, W * 0.18);
      hg.addColorStop(0,   `rgba(255,230,140,${0.35 * flicker})`);
      hg.addColorStop(0.4, `rgba(220,170,60,${0.12 * flicker})`);
      hg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, W, H);

      /* ── Dust particles in beam ── */
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.016;
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x >  1.05) p.x = -0.05;
        if (p.x < 0.18 || p.y > 0.92) return;

        const flick = 0.3 + 0.7 * Math.abs(Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,90,${p.o * flick * 0.55})`;
        ctx.fill();
      });

      /* ── Anamorphic lens flare — 3 stacked streaks ── */
      const fy = H * 0.10;
      const fa = 0.16 + 0.04 * Math.sin(t * 0.0007);

      // Main thick streak
      const fg = ctx.createLinearGradient(0, fy, W, fy);
      fg.addColorStop(0,    'rgba(255,210,100,0)');
      fg.addColorStop(0.18, `rgba(255,200,80,${fa})`);
      fg.addColorStop(0.5,  `rgba(255,230,150,${fa * 2.2})`);
      fg.addColorStop(0.82, `rgba(255,200,80,${fa})`);
      fg.addColorStop(1,    'rgba(255,210,100,0)');
      ctx.strokeStyle = fg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke();

      // Mid streak
      const fg2 = ctx.createLinearGradient(0, fy + 5, W, fy + 5);
      fg2.addColorStop(0.25, 'rgba(228,170,60,0)');
      fg2.addColorStop(0.5,  `rgba(228,170,60,${fa * 0.7})`);
      fg2.addColorStop(0.75, 'rgba(228,170,60,0)');
      ctx.strokeStyle = fg2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, fy + 5); ctx.lineTo(W, fy + 5); ctx.stroke();

      // Fine streak
      const fg3 = ctx.createLinearGradient(0, fy - 3, W, fy - 3);
      fg3.addColorStop(0.3, 'rgba(200,150,46,0)');
      fg3.addColorStop(0.5, `rgba(200,150,46,${fa * 0.4})`);
      fg3.addColorStop(0.7, 'rgba(200,150,46,0)');
      ctx.strokeStyle = fg3; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, fy - 3); ctx.lineTo(W, fy - 3); ctx.stroke();

      /* ── Mouse glow ── */
      const mg = ctx.createRadialGradient(
        mouse.x * W, mouse.y * H, 0,
        mouse.x * W, mouse.y * H, W * 0.22
      );
      mg.addColorStop(0, 'rgba(200,150,46,0.04)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, 0, W, H);

      requestAnimationFrame(drawFrame);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(drawFrame);
  };

  // Run now if DOM ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}

/* ─────────────────────────────────────────
   1c. YOUTUBE EMBED HANDLER
   Show video after 3s load window.
   Only hide permanently on confirmed embed errors (150/151/153).
───────────────────────────────────────── */
function initYouTubeHandler() {
  const wrap   = document.getElementById('hero-video-wrap');
  const iframe = document.getElementById('hero-video');
  if (!wrap || !iframe) return;

  let blocked = false;

  // Detect confirmed embed-block errors via postMessage
  window.addEventListener('message', e => {
    if (!e.origin.includes('youtube.com')) return;
    try {
      const data = JSON.parse(e.data);
      // YouTube error codes that mean embedding is disabled
      const errCode =
        data?.info?.errorCode ||
        (data?.event === 'onError' ? data?.info : null);
      if (errCode && [100, 101, 150, 151, 153].includes(Number(errCode))) {
        blocked = true;
        wrap.style.display = 'none';
      }
    } catch (_) {}
  });

  // Show the video after 3 seconds — enough time for YT to load & autoplay.
  // If embedding was blocked, the postMessage above will have hidden it first.
  setTimeout(() => {
    if (!blocked) {
      wrap.classList.add('is-ready');
    }
  }, 3000);
}

/* ─────────────────────────────────────────
   2. CUSTOM CURSOR WITH VELOCITY STRETCH
───────────────────────────────────────── */
function initCursor() {
  if (window.matchMedia('(hover:none)').matches) return;

  const dot   = $('#cursor-dot');
  const ring  = $('#cursor-ring');
  const label = $('#cursor-label');
  if (!dot || !ring) return;

  let mx = -200, my = -200;
  let dx = -200, dy = -200;
  let prevX = -200, prevY = -200;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  function tick() {
    const velX = mx - prevX;
    const velY = my - prevY;
    prevX = mx; prevY = my;

    dx = lerp(dx, mx, 0.13);
    dy = lerp(dy, my, 0.13);

    dot.style.transform  = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
    label.style.transform = `translate(${dx + 32}px,${dy - 28}px) translate(-50%,-50%)`;

    requestAnimationFrame(tick);
  }
  tick();

  // Hover state management
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,[role="button"],.film-card,.cast-card,.director-card,.work-btn');
    if (!t) return;
    document.body.classList.add('cursor-hover');
    if (t.classList.contains('film-card') || t.classList.contains('cast-card')) {
      document.body.classList.add('cursor-view');
    }
  });

  document.addEventListener('mouseout', e => {
    const t = e.target.closest('a,button,[role="button"],.film-card,.cast-card,.director-card,.work-btn');
    if (t) document.body.classList.remove('cursor-hover','cursor-view');
  });

  document.addEventListener('mousedown', () => document.body.classList.add('cursor-active'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-active'));
}

/* ─────────────────────────────────────────
   3. SCROLL PROGRESS LINE
───────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  gsap.to(bar, {
    width: '100%', ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top', end: 'bottom bottom',
      scrub: 0.3,
    }
  });
}

/* ─────────────────────────────────────────
   4. CINEMATIC LOADER — Film Leader Countdown
───────────────────────────────────────── */
function initLoader() {
  const loader      = $('#loader');
  const leaderFrame = $('#leader-frame');
  const numEl       = $('#loader-num');
  const logoWrap    = $('#loader-logo-wrap');
  const barEl       = $('#loader-bar');

  if (!loader) return;
  document.body.style.overflow = 'hidden';

  let count = 5;
  let progress = 0;

  // Countdown: 5 → 4 → 3 → 2 → 1
  const countInterval = setInterval(() => {
    count--;
    if (numEl) {
      gsap.to(numEl, { opacity: 0, y: -15, duration: 0.12, ease: 'power2.in', onComplete: () => {
        numEl.textContent = count;
        gsap.fromTo(numEl, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' });
      }});
    }
    if (count <= 0) clearInterval(countInterval);
  }, 320);

  // Progress bar
  const progressInterval = setInterval(() => {
    progress = Math.min(progress + (Math.random() * 15 + 8), 95);
    if (barEl) barEl.style.width = progress + '%';
  }, 100);

  // After countdown — reveal logo
  setTimeout(() => {
    clearInterval(progressInterval);
    if (barEl) barEl.style.width = '100%';

    // Flash the frame
    gsap.to(leaderFrame, {
      opacity: 0, duration: 0.08, repeat: 2, yoyo: true,
      onComplete: () => {
        // Hide countdown, show logo
        gsap.to(leaderFrame, { opacity: 0, scale: 0.9, duration: 0.4, ease: 'power2.in' });
        setTimeout(() => {
          if (logoWrap) {
            gsap.to(logoWrap, {
              opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out',
            });
          }
          setTimeout(() => typeText($('#loader-credit'), 'A CINEMATIC UNIVERSE', 42), 450);
        }, 300);
      }
    });
  }, 2100);

  // Exit loader — projector strikes: hero begins under a flash of lamp-light,
  // then the flash clears to reveal the title already forming.
  setTimeout(() => {
    const flash = $('#loader-flash');
    const finish = () => {
      loader.style.display = 'none';
      document.body.style.overflow = '';
    };
    initHeroReveal();

    // Clapboard snap — crisp body-thump the instant the slate shuts.
    const clap = () => triggerKineticResonance(90, 80, 2.5);

    if (flash) {
      gsap.timeline()
        .add(clap)
        .to(flash,  { opacity: 1, duration: 0.16, ease: 'power2.in' })
        .to(loader, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, '-=0.02')
        .to(flash,  { opacity: 0, duration: 0.55, ease: 'power2.out' }, '-=0.35')
        .add(finish, '-=0.25');
    } else {
      clap();
      gsap.to(loader, { opacity: 0, duration: 0.7, ease: 'power2.inOut', onComplete: finish });
    }
  }, 3400);
}

/* ─────────────────────────────────────────
   5. LENIS SMOOTH SCROLL
───────────────────────────────────────── */
function initLenis() {
  lenis = new Lenis({
    duration: 1.6,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.75,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Single delegated listener — handles nav links AND menu links reliably
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash   = link.getAttribute('href');
    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    const menuOpen = document.getElementById('menu-overlay')
                              ?.classList.contains('is-open');

    if (menuOpen) {
      // Close menu first, then scroll after transition completes
      toggleMenu(false);
      setTimeout(() => {
        lenis.scrollTo(target, { offset: -80, duration: 1.8 });
      }, 420);
    } else {
      lenis.scrollTo(target, { offset: -80, duration: 1.8 });
    }
  });
}

/* ─────────────────────────────────────────
   6. NAVIGATION
───────────────────────────────────────── */
function initNav() {
  const nav = $('#nav');
  if (!nav) return;
  ScrollTrigger.create({
    start: 100,
    onEnter:     () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled'),
  });
}

/* ─────────────────────────────────────────
   7. FULLSCREEN MENU
───────────────────────────────────────── */
function initMenu() {
  const burger  = $('#nav-burger');
  const overlay = $('#menu-overlay');
  if (!burger || !overlay) return;

  burger.addEventListener('click', () => toggleMenu(!overlay.classList.contains('is-open')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) toggleMenu(false);
  });
}

function toggleMenu(open) {
  const burger  = $('#nav-burger');
  const overlay = $('#menu-overlay');
  if (open) {
    overlay.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  } else {
    overlay.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
}

/* ─────────────────────────────────────────
   8. HERO — BLUR-TO-FOCUS CHARACTER REVEAL
───────────────────────────────────────── */
function splitLine(el) {
  const text = el.textContent.trim();
  el.textContent = '';
  return text.split('').map(ch => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    el.appendChild(span);
    return span;
  });
}

function initHeroReveal() {
  if (window.__heroRevealed) return;
  window.__heroRevealed = true;

  if (REDUCED) { forceHeroVisible(); return; }

  const eyebrow = $('#hero-eyebrow');
  const lines   = [
    { el: $('#hl-1'), delay: 0.1 },
    { el: $('#hl-2'), delay: 0.55 },
    { el: $('#hl-3'), delay: 1.0 },
  ];
  const sub     = $('#hero-sub');
  const actions = $('#hero-actions');
  const stats   = $$('.hstat');
  const dividers= $$('.hstat-div');
  const scrollCue = $('.hero-scroll-cue');

  // Eyebrow fade
  if (eyebrow) {
    gsap.to(eyebrow, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.15 });
  }

  // Split each line and animate characters
  lines.forEach(({ el, delay }) => {
    if (!el) return;
    const chars = splitLine(el);
    chars.forEach((char, i) => {
      gsap.to(char, {
        delay: delay + i * 0.048,
        duration: 1.2,
        ease: 'power4.out',
        onStart: () => char.classList.add('is-visible'),
      });
    });
  });

  // Sub-headline
  if (sub) gsap.to(sub, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 1.7 });
  if (actions) gsap.to(actions, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.9 });

  // Stats
  stats.forEach((s, i) => gsap.to(s, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 1.4 + i * 0.12 }));
  dividers.forEach((d, i) => gsap.to(d, { opacity: 1, duration: 0.4, delay: 1.55 + i * 0.1 }));
  if (scrollCue) gsap.to(scrollCue, { opacity: 1, duration: 0.7, ease: 'power2.out', delay: 2.4 });
}

/* ─────────────────────────────────────────
   9. MANIFESTO — WORD ILLUMINATE (True Detective)
───────────────────────────────────────── */
function initManifestoIlluminate() {
  const words = $$('.mw');

  words.forEach((word) => {
    const isGold = word.classList.contains('mw-gold');
    const targetColor = isGold ? '#E4B44A' : '#F0E8D5';

    gsap.fromTo(word,
      { color: '#2A2520' },
      {
        color: targetColor,
        ease: 'none',
        scrollTrigger: {
          trigger: word,
          start: 'top 80%',
          end:   'top 42%',
          scrub: 1.2,
        }
      }
    );
  });

  // Sub text reveal
  const sub = $('.manifesto-sub');
  if (sub) {
    gsap.to(sub, {
      opacity: 1, y: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: sub, start: 'top 80%', once: true }
    });
  }
}

/* ─────────────────────────────────────────
   10. SCROLL-TRIGGERED SECTION REVEALS
───────────────────────────────────────── */
function initScrollAnimations() {

  // Generic: section titles
  $$('.section-title').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 45 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true } }
    );
  });

  // Section chapter labels
  $$('.section-chapter').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: -12 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
    );
  });

  $$('.section-rule').forEach(el => {
    gsap.fromTo(el,
      { scaleX: 0, transformOrigin: 'left' },
      { scaleX: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } }
    );
  });

  // Film cards — stagger from bottom
  const filmCards = $$('.film-card');
  if (filmCards.length) {
    gsap.fromTo(filmCards,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: '.films-grid', start: 'top 78%', once: true } }
    );
  }

  // Cast cards
  const castCards = $$('.cast-card');
  if (castCards.length) {
    gsap.fromTo(castCards,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: '.cast-grid', start: 'top 80%', once: true } }
    );
  }

  // Director cards
  const dirCards = $$('.director-card');
  if (dirCards.length) {
    gsap.fromTo(dirCards,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: '.directors-grid', start: 'top 80%', once: true } }
    );
  }

  // Studio headline
  const stH = $('.studio-headline');
  if (stH) {
    gsap.fromTo(stH,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: stH, start: 'top 80%', once: true } }
    );
  }

  // Timeline items
  $$('.tl-item').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out',
        delay: i * 0.09,
        scrollTrigger: { trigger: '.timeline', start: 'top 80%', once: true } }
    );
  });

  // Award rows
  $$('.award-row').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: i * 0.12,
        scrollTrigger: { trigger: '.awards-right', start: 'top 80%', once: true } }
    );
  });

  // Services
  $$('.service-item').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.07,
        scrollTrigger: { trigger: '.services-grid', start: 'top 80%', once: true } }
    );
  });

  // Journal cards
  $$('.journal-card').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: i * 0.1,
        scrollTrigger: { trigger: '.journal-grid', start: 'top 80%', once: true } }
    );
  });

  // Statement
  const stmt = $('#statement-text');
  if (stmt) {
    gsap.fromTo(stmt,
      { opacity: 0.15, y: 30 },
      { opacity: 0.9, y: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: '.statement-section', start: 'top 72%', once: true } }
    );
  }

  // Contact headline
  const ctaH = $('.contact-headline');
  if (ctaH) {
    gsap.fromTo(ctaH,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.3, ease: 'power4.out',
        scrollTrigger: { trigger: ctaH, start: 'top 80%', once: true } }
    );
  }

  // Hero parallax — video cover drifts slower
  const heroVideo = $('.hero-video-wrap');
  if (heroVideo) {
    gsap.to(heroVideo, {
      yPercent: 18, ease: 'none',
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.8,
      }
    });
  }

  // Lens flare parallax
  const flare = $('.hero-lens-flare');
  if (flare) {
    gsap.to(flare, {
      yPercent: 30, ease: 'none',
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2,
      }
    });
  }
}

/* ─────────────────────────────────────────
   11. WORK SHOWCASE CAROUSEL
───────────────────────────────────────── */
function initWorkCarousel() {
  const items   = $$('.work-item');
  const prevBtn = $('#work-prev');
  const nextBtn = $('#work-next');
  const currEl  = $('#work-curr');
  if (!items.length) return;

  function goTo(index) {
    const prev = currentWork;
    items[prev].classList.remove('is-active');
    items[prev].classList.add('is-leaving');
    setTimeout(() => items[prev].classList.remove('is-leaving'), 700);

    currentWork = ((index % TOTAL_WORK) + TOTAL_WORK) % TOTAL_WORK;
    items[currentWork].classList.add('is-active');
    if (currEl) currEl.textContent = String(currentWork + 1).padStart(2, '0');
  }

  prevBtn?.addEventListener('click', () => goTo(currentWork - 1));
  nextBtn?.addEventListener('click', () => goTo(currentWork + 1));

  // Touch swipe
  let swipeStart = 0;
  const showcase = $('#work-showcase');
  showcase?.addEventListener('touchstart', e => { swipeStart = e.touches[0].clientX; }, { passive: true });
  showcase?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - swipeStart;
    if (Math.abs(dx) > 50) dx < 0 ? goTo(currentWork + 1) : goTo(currentWork - 1);
  }, { passive: true });
}

/* ─────────────────────────────────────────
   12. MAGNETIC BUTTONS
───────────────────────────────────────── */
function initMagneticButtons() {
  if (window.matchMedia('(hover:none)').matches) return;

  $$('.btn-primary, .nav-cta').forEach(btn => {
    let voice = null;                       // sustained 15 Hz rumble, lazily armed
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * 0.28;
      const dy = (e.clientY - r.top  - r.height / 2) * 0.28;
      gsap.to(btn, { x: dx, y: dy, ease: 'power2.out', duration: 0.4 });

      // Elastic tension — gain scales with how far the magnet is stretched.
      if (!voice) voice = Resonance.rumble(55);
      const stretch = Math.min(1, Math.hypot(dx, dy) / (Math.max(r.width, r.height) * 0.42));
      voice.set(stretch);
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, ease: 'elastic.out(1, 0.4)', duration: 0.8 });
      if (voice) { voice.stop(); voice = null; }   // release the band
    });
  });
}

/* ─────────────────────────────────────────
   13. 3D CARD TILT
───────────────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(hover:none)').matches) return;

  $$('.film-card, .director-card, .cast-card').forEach(card => {
    // Compression thud — deep body grounding on press, masking lerp lag.
    card.addEventListener('mousedown', () => triggerKineticResonance(70, 120, 1.8));
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      gsap.to(card, {
        rotateY: clamp(dx * 5, -6, 6),
        rotateX: clamp(-dy * 5, -6, 6),
        transformPerspective: 900,
        duration: 0.5, ease: 'power2.out',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ─────────────────────────────────────────
   14. MARQUEE — scroll-direction reactive
───────────────────────────────────────── */
function initMarquee() {
  const track = $('#marquee-track');
  if (!track || !lenis) return;

  let lastDir = 1;
  lenis.on('scroll', ({ direction }) => {
    if (direction !== lastDir) {
      lastDir = direction;
      track.style.animationDirection = direction === -1 ? 'reverse' : 'normal';
    }
  });
}

/* ─────────────────────────────────────────
   15. FILM BURN EFFECT ON HIGH VELOCITY SCROLL
───────────────────────────────────────── */
function initFilmBurn() {
  const burn = document.createElement('div');
  burn.style.cssText = `
    position:fixed;inset:0;pointer-events:none;
    z-index:9995;opacity:0;
    background:rgba(200,150,46,0.07);
  `;
  document.body.appendChild(burn);

  if (!lenis) return;
  lenis.on('scroll', ({ velocity }) => {
    const speed = Math.abs(velocity);
    if (speed > 40) {
      gsap.to(burn, {
        opacity: clamp(speed / 280, 0, 0.14), duration: 0.08,
        onComplete: () => gsap.to(burn, { opacity: 0, duration: 0.35 })
      });
    }
  });
}

/* ─────────────────────────────────────────
   16. FOOTER LOGO HOVER
───────────────────────────────────────── */
function initFooter() {
  const fLogo = $('.footer-logo-img');
  if (!fLogo) return;
  fLogo.addEventListener('mouseenter', () => {
    gsap.to(fLogo, { filter: 'drop-shadow(0 0 20px rgba(200,150,46,0.4))', duration: 0.5 });
  });
  fLogo.addEventListener('mouseleave', () => {
    gsap.to(fLogo, { filter: 'drop-shadow(0 0 0px rgba(200,150,46,0))', duration: 0.5 });
  });
}

/* ─────────────────────────────────────────
   17. CINEMATIC SOUND — opt-in projector ambience
   Generated with Web Audio (no assets). Projector
   hum + detuned drone + soft sprocket ticks.
───────────────────────────────────────── */
function initSound() {
  const btn   = $('#sound-toggle');
  const label = $('#sound-label');
  if (!btn) return;

  let ctx = null, master = null, on = false, ticking = false;

  // Subtle mobile haptic — only when the viewer has opted into immersion (sound on).
  window.__cineHaptic = (ms) => {
    try {
      if (window.__cineSoundOn && navigator.vibrate && matchMedia('(pointer:coarse)').matches) navigator.vibrate(ms);
    } catch (_) {}
  };

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Projector hum — low triangle + harmonic, motor-like amplitude wobble
    const hum = ctx.createOscillator();   hum.type = 'triangle'; hum.frequency.value = 58;
    const humGain = ctx.createGain();      humGain.gain.value = 0.12;
    const lfo = ctx.createOscillator();    lfo.type = 'sine';     lfo.frequency.value = 7.5;
    const lfoGain = ctx.createGain();      lfoGain.gain.value = 0.045;
    lfo.connect(lfoGain); lfoGain.connect(humGain.gain);
    hum.connect(humGain); humGain.connect(master);

    const hum2 = ctx.createOscillator();   hum2.type = 'sine'; hum2.frequency.value = 116;
    const hum2Gain = ctx.createGain();     hum2Gain.gain.value = 0.045;
    hum2.connect(hum2Gain); hum2Gain.connect(master);

    // Tension drone — two slightly detuned saws through a soft lowpass
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.Q.value = 0.7;
    const d1 = ctx.createOscillator(); d1.type = 'sawtooth'; d1.frequency.value = 82.0;
    const d2 = ctx.createOscillator(); d2.type = 'sawtooth'; d2.frequency.value = 82.4;
    const dGain = ctx.createGain(); dGain.gain.value = 0.04;
    d1.connect(dGain); d2.connect(dGain); dGain.connect(lp); lp.connect(master);

    // Subsonic floor — felt more than heard; the chest-tension layer
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 38;
    const subGain = ctx.createGain(); subGain.gain.value = 0.07;
    sub.connect(subGain); subGain.connect(master);

    // Slow swell — the drone's lowpass opens and closes over ~20s (breathing tension)
    const swell = ctx.createOscillator(); swell.type = 'sine'; swell.frequency.value = 0.05;
    const swellGain = ctx.createGain(); swellGain.gain.value = 180;
    swell.connect(swellGain); swellGain.connect(lp.frequency);

    [hum, lfo, hum2, d1, d2, sub, swell].forEach(o => o.start());
    return true;
  }

  function startTicks() {
    if (ticking) return;
    ticking = true;
    const tick = () => {
      if (!on || !ctx) { ticking = false; return; }
      const dur = 0.03;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.9;
      const g = ctx.createGain(); g.gain.value = 0.05;
      src.connect(bp); bp.connect(g); g.connect(master); src.start();
      setTimeout(tick, 470 + Math.random() * 230);
    };
    tick();
  }

  function setOn(v) {
    on = v;
    window.__cineSoundOn = on;
    if (on) {
      if (!ctx && !build()) return;
      if (ctx.state === 'suspended') ctx.resume();
      gsap.to(master.gain, { value: 0.5, duration: 1.4, ease: 'power2.out' });
      startTicks();
      btn.classList.add('is-on');
      btn.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = 'Sound On';
    } else {
      if (master) gsap.to(master.gain, { value: 0, duration: 0.8, ease: 'power2.in' });
      btn.classList.remove('is-on');
      btn.setAttribute('aria-pressed', 'false');
      if (label) label.textContent = 'Sound Off';
    }
  }

  btn.addEventListener('click', () => setOn(!on));
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });
}

/* ─────────────────────────────────────────
   17b. SUBSONIC AUDIO-HAPTIC RESONANCE ENGINE
   ───────────────────────────────────────────
   A hardware-accelerated Web Audio DSP graph that synthesises
   sub-35Hz kinetic envelopes. On a coarse-pointer device the
   inaudible low end couples into the chassis and we additionally
   fire the real vibration motor (navigator.vibrate) where the
   platform exposes it. On desktop / unsupported hardware the
   graph runs silently and throws nothing — every call is a no-op
   wrapped in defensive guards. Zero per-frame allocation on the
   hot paths; oscillators are one-shot and self-prune via onended.
───────────────────────────────────────── */
const Resonance = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const COARSE = matchMedia('(pointer:coarse)').matches;
  const REDUCED = matchMedia('(prefers-reduced-motion:reduce)').matches;

  // 8th-order Butterworth low-pass (4 cascaded biquads = 48 dB/octave).
  // Maximally-flat passband; Q values are corner-independent so the same
  // cascade is retuned per-burst by moving the corner frequency.
  const BUTTERWORTH_Q = [0.50979558, 0.60134489, 0.89997622, 2.56291545];
  const THROTTLE = 0.7;     // Haptic Throttle Master — global output ceiling
  // Body-thump band: corner sits well above the fundamental so a 5 ms attack
  // survives the filter, while the harsh upper square harmonics are removed.
  const clampHz = (hz, lo, hi) => Math.min(hi, Math.max(lo, hz));

  let ctx = null;           // lazily-instantiated AudioContext
  let throttle = null;      // master GainNode → destination
  let unlocked = false;

  // ── Lazy graph instantiation ──────────────────────────────
  function ensure() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC({ latencyHint: 'interactive' });
      throttle = ctx.createGain();
      throttle.gain.value = THROTTLE;
      throttle.connect(ctx.destination);
    } catch (_) { ctx = null; }
    return ctx;
  }

  // Build a fresh 48 dB/oct low-pass cascade at `cutoff` Hz. { input, output }.
  function cascade(cutoff) {
    let input = null, prev = null;
    for (let i = 0; i < 4; i++) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      f.Q.value = BUTTERWORTH_Q[i];
      if (prev) prev.connect(f); else input = f;
      prev = f;
    }
    return { input, output: prev };
  }

  // ── WebKit gestural unlock ────────────────────────────────
  // A transparent, pointer-passthrough overlay that captures the
  // very first interaction to resume the context, then self-destructs.
  function bridge() {
    if (!AC || unlocked) return;
    const el = document.createElement('div');
    el.id = 'haptic-gesture-bridge';
    el.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;pointer-events:none;' +
      'background:transparent;contain:strict;';
    document.body.appendChild(el);

    const unlock = () => {
      unlocked = true;
      const c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
      // A zero-gain primer tone fully arms WebKit's audio pipeline.
      if (c) { try { trigger(20, 1, 0.0001); } catch (_) {} }
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      el.remove();
    };
    // Listen on window (capture) so the bridge can pass pointer events
    // straight through to the page while still arming on first contact.
    window.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true });
    window.addEventListener('pointerdown', unlock, { once: true, passive: true, capture: true });
    window.addEventListener('click', unlock, { once: true, capture: true });
  }

  // ── Kinetic envelope ──────────────────────────────────────
  // Sculpts a one-shot body-thump: a pitch-dropping square through an
  // adaptive cascade with a 5 ms attack and exponential decay. The
  // pitch drop gives the crisp transient; the moving corner lets it
  // survive the filter. `intensity` scales peak gain.
  function trigger(frequency, duration, intensity) {
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});

    const t0 = c.currentTime;
    const dur = Math.max(0.012, duration / 1000);
    const peak = Math.min(0.95, Math.max(0.0001, intensity * 0.3));

    const osc = c.createOscillator();
    osc.type = 'square';                       // abrupt voice-coil actuation
    // Pitch-drop transient — strikes ~1.4 octaves high, settles to the body
    // frequency, the classic punchy "thump" attack.
    osc.frequency.setValueAtTime(frequency * 2.4, t0);
    osc.frequency.exponentialRampToValueAtTime(frequency, t0 + Math.min(0.05, dur * 0.5));

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(peak, t0 + 0.005);          // 5 ms attack
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);     // exp decay

    // Corner ~6× the fundamental (220–900 Hz): passes the fast attack, tames buzz.
    const lp = cascade(clampHz(frequency * 6, 220, 900));
    osc.connect(lp.input);
    lp.output.connect(env);
    env.connect(throttle);

    osc.onended = () => { try { osc.disconnect(); env.disconnect(); lp.output.disconnect(); } catch (_) {} };
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);

    motor(duration, intensity);
  }

  // ── Sustained rumble voice ────────────────────────────────
  // One persistent oscillator whose gain is steered in real time — no
  // per-frame node creation, so it is safe to drive from mousemove.
  function rumble(frequency) {
    const c = ensure();
    if (!c) return { set() {}, stop() {} };

    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.value = frequency;
    const env = c.createGain();
    env.gain.value = 0.0001;
    const lp = cascade(clampHz(frequency * 5, 180, 600));
    osc.connect(lp.input);
    lp.output.connect(env);
    env.connect(throttle);
    let live = true;
    try { osc.start(); } catch (_) {}

    return {
      // amount: 0..1 visual offset → smoothed gain target
      set(amount) {
        if (!live) return;
        const g = Math.min(0.9, Math.max(0.0001, amount * 0.9));
        try { env.gain.setTargetAtTime(g, c.currentTime, 0.05); } catch (_) {}
      },
      stop() {
        if (!live) return;
        live = false;
        const t = c.currentTime;
        try {
          env.gain.cancelScheduledValues(t);
          env.gain.setTargetAtTime(0.0001, t, 0.04);
          osc.stop(t + 0.3);
          osc.onended = () => { try { osc.disconnect(); env.disconnect(); lp.output.disconnect(); } catch (_) {} };
        } catch (_) {}
      },
    };
  }

  // ── Real motor layer (Android / supporting WebKit) ────────
  // The only path that produces guaranteed tactile output. Silent
  // no-op on hardware without an exposed vibration actuator.
  function motor(duration, intensity) {
    if (!COARSE || REDUCED) return;
    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(Math.round(Math.min(60, Math.max(8, duration * intensity * 0.5))));
      }
    } catch (_) {}
  }

  return { bridge, trigger, rumble, supported: !!AC };
})();

// Public entry point wired into the UI systems below.
function triggerKineticResonance(frequency, duration, intensity) {
  Resonance.trigger(frequency, duration, intensity);
}
window.triggerKineticResonance = triggerKineticResonance;

function initResonanceEngine() {
  if (!Resonance.supported) return;       // desktop fallback: silent, no errors
  Resonance.bridge();
}

/* ─────────────────────────────────────────
   18. THE REEL — "Enter the Frame" pinned scrub
───────────────────────────────────────── */
function initReelSequence() {
  const reel   = $('#reel');
  const stage  = $('#reel-stage');
  const frame  = $('#reel-frame');
  const word   = $('#reel-word');
  const credit = $('#reel-credit');
  const tc     = $('#reel-timecode');
  if (!reel || !stage || !frame || REDUCED) return;

  gsap.set(frame, { scale: 0.32, transformOrigin: '50% 50%' });
  gsap.set(word,   { opacity: 0, xPercent: 60 });
  gsap.set(credit, { opacity: 1 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: reel,
      start: 'top top',
      end: '+=220%',
      scrub: 1,
      pin: stage,
      anticipatePin: 1,
      onUpdate: self => {
        if (!tc) return;
        const f = Math.round(self.progress * 192);          // ~8s of film @24fps
        const ss = String(Math.floor(f / 24)).padStart(2, '0');
        const ff = String(f % 24).padStart(2, '0');
        tc.textContent = `00:00:${ss}:${ff}`;
      }
    }
  });

  tl.to(credit, { opacity: 0, duration: 0.12 }, 0)
    .to(frame,  { scale: 1.0, ease: 'power1.inOut', duration: 0.72 }, 0)
    .fromTo(word, { opacity: 0, xPercent: 60 },
                  { opacity: 1, xPercent: 0, ease: 'power2.out', duration: 0.30 }, 0.20)
    .to(word,   { opacity: 0, xPercent: -60, ease: 'power2.in', duration: 0.30 }, 0.52)
    .to(frame,  { scale: 1.06, ease: 'power1.in', duration: 0.28 }, 0.72);
}

/* ─────────────────────────────────────────
   19. HERO — camera pulls back on scroll
───────────────────────────────────────── */
function initHeroPullback() {
  if (REDUCED) return;
  const content = $('.hero-content');
  const stats   = $('.hero-stats');
  if (content) {
    gsap.to(content, {
      yPercent: -14, scale: 0.92, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });
  }
  if (stats) {
    gsap.to(stats, {
      yPercent: -24, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });
  }
}

/* ─────────────────────────────────────────
   20. ACT FLASHES — subtle reel-change pulse
   between major scenes (like a projector cut)
───────────────────────────────────────── */
function initActFlashes() {
  if (REDUCED) return;
  // A soft exposure dip on entering a new act — the eye adjusting on a cut.
  // Radial so the frame edges darken briefly while the centre stays readable.
  const cut = document.createElement('div');
  cut.style.cssText = `
    position:fixed; inset:0; pointer-events:none; z-index:9990; opacity:0;
    background:radial-gradient(ellipse 125% 125% at 50% 50%, rgba(5,4,3,0) 28%, rgba(5,4,3,0.6) 100%);
  `;
  document.body.appendChild(cut);

  ['#reel', '#films', '#studio', '#contact'].forEach(sel => {
    const el = $(sel);
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 70%',
      onEnter: () => {
        gsap.timeline()
          .to(cut, { opacity: 0.45, duration: 0.14, ease: 'power2.in' })
          .to(cut, { opacity: 0, duration: 0.6, ease: 'power2.out' });
        if (window.__cineHaptic) window.__cineHaptic(6);
      }
    });
  });
}

/* ─────────────────────────────────────────
   21. ATMOSPHERIC DUST — for dark scenes
───────────────────────────────────────── */
function initDust() {
  if (REDUCED) return;
  ['.statement-section', '#reel-stage'].forEach(sel => {
    const host = $(sel);
    if (!host) return;
    const field = document.createElement('div');
    field.className = 'dust-field';
    field.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      const dur = 12 + Math.random() * 16;
      const size = 1 + Math.random() * 2;
      s.style.left = (Math.random() * 100) + '%';
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.animationDuration = dur + 's';
      s.style.animationDelay = (-Math.random() * dur) + 's';
      field.appendChild(s);
    }
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.insertBefore(field, host.firstChild);
  });
}

/* ─────────────────────────────────────────
   22. LIVING ATMOSPHERE ENGINE
   One rAF loop → CSS variables. The site breathes,
   reacts to scroll energy, deepens in stillness,
   and re-lights itself act by act. A handheld
   camera drifts across the projector plate so the
   hero feels filmed, not rendered.
───────────────────────────────────────── */
function initLivingAtmosphere() {
  const root = document.documentElement;
  const heroCanvas = $('#hero-canvas');

  // Reduced motion: a calm, static mood — no loop.
  if (REDUCED) {
    root.style.setProperty('--pulse', '0.4');
    root.style.setProperty('--energy', '0');
    root.style.setProperty('--vignette', '0.15');
    root.style.setProperty('--grain-o', '0.05');
    window.__cine = { energy: 0, pulse: 0.4, exposure: 0.78, scroll: 0, vignette: 0.15 };
    return;
  }

  let energy = 0;
  let lastActivity = performance.now();
  let mx = 0, my = 0, smx = 0, smy = 0;
  const markActive = () => { lastActivity = performance.now(); };
  ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, markActive, { passive: true }));
  window.addEventListener('pointermove', e => {
    mx = (e.clientX / window.innerWidth)  * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const start = performance.now();

  function frame(now) {
    const t = (now - start) / 1000;

    // Breathing pulse — two detuned sines for an organic ~6.5s breath.
    const tt = t * (Math.PI * 2 / 6.5);
    const pulse = clamp(0.5 + 0.32 * Math.sin(tt) + 0.12 * Math.sin(tt * 2.7 + 1.3), 0, 1);

    // Scroll energy — fed by Lenis velocity, fast attack / slow decay to stillness.
    const vel = (lenis && typeof lenis.velocity === 'number') ? Math.abs(lenis.velocity) : 0;
    const target = clamp(vel / 38, 0, 1);
    energy += (target - energy) * (target > energy ? 0.25 : 0.06);

    // Idle deepening — after ~5s of stillness, the room darkens.
    const idleDeep = clamp(((now - lastActivity) / 1000 - 5) / 4, 0, 1);

    // Exposure by scroll — warm hero, tense middle, glow finale.
    const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const p = clamp(window.scrollY / max, 0, 1);
    const exposure = 1 - 0.5 * Math.sin(p * Math.PI);

    const vignette = clamp((1 - exposure) * 0.7 + energy * 0.35 + idleDeep * 0.6, 0, 1);
    const grainO = 0.045 + energy * 0.07 + pulse * 0.012 + idleDeep * 0.02;

    root.style.setProperty('--pulse', pulse.toFixed(3));
    root.style.setProperty('--energy', energy.toFixed(3));
    root.style.setProperty('--vignette', vignette.toFixed(3));
    root.style.setProperty('--grain-o', grainO.toFixed(3));

    // Share cinematic state with the WebGL cinematography engine.
    window.__cine = { energy, pulse, exposure, scroll: p, vignette };

    // Camera presence — handheld micro-drift + a restrained reframe toward
    // the cursor (rack-the-frame, never obvious) on the projector plate.
    if (heroCanvas) {
      smx += (mx - smx) * 0.04;
      smy += (my - smy) * 0.04;
      const x = Math.sin(t * 0.9) * 4 + Math.sin(t * 0.37) * 2.5 + smx * 14;
      const y = Math.cos(t * 0.7) * 3 + Math.sin(t * 0.23) * 2 + smy * 9;
      const r = Math.sin(t * 0.5) * 0.12 + smx * 0.25;
      heroCanvas.style.transform = `scale(1.06) translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ─────────────────────────────────────────
   MAIN INIT
───────────────────────────────────────── */
function init() {
  gsap.registerPlugin(ScrollTrigger);
  initGrain();
  initCinematicCanvas();   // cinematic projector atmosphere — permanent hero bg
  initCursor();
  initLoader();

  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initScrollProgress();
    initNav();
    initMenu();
    initResonanceEngine();   // subsonic audio-haptic graph + gesture bridge
    initSound();             // opt-in cinematic ambience
    initDust();              // atmospheric dust in dark scenes
    initLivingAtmosphere();  // ░ breathing engine: pulse · energy · idle · exposure · camera
    initScrollAnimations();
    initManifestoIlluminate();
    initReelSequence();      // ░ signature "Enter the Frame" moment
    initHeroPullback();      // camera pull-back on scroll
    initActFlashes();        // reel-change pulses between acts
    initWorkCarousel();
    initMagneticButtons();
    initCardTilt();
    initMarquee();
    initFilmBurn();
    initFooter();

    // Pinning changes document height — let everything settle, then refresh.
    window.addEventListener('load', () => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 600);
  });

  // Fail-safe: the hero must never be stranded if the overture is interrupted
  // (e.g. a throttled tab pausing rAF mid-transition).
  setTimeout(() => {
    initHeroReveal();
    forceHeroVisible();
    const loader = $('#loader');
    if (loader && loader.style.display !== 'none') {
      loader.style.display = 'none';
      document.body.style.overflow = '';
    }
  }, 6000);
}

init();

/* ─────────────────────────────────────────
   CONSOLE EASTER EGG
───────────────────────────────────────── */
console.log(
  '%c\n  CINEMAN PRODUCTIONS\n  Est. 2010 · Ahmedabad · India\n  "We don\'t make films. We engineer feeling."\n',
  'color:#C8962E;font-family:monospace;font-size:11px;line-height:1.6;'
);
