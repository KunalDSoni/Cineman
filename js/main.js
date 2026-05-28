/* ═══════════════════════════════════════════════════════════
   CINEMAN PRODUCTIONS — CINEMATIC THRILLER INTERACTION SYSTEM
   Version 2.0 — Monks × A24 × Netflix Experience
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

/* ─────────────────────────────────────────
   1. FILM GRAIN CANVAS
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
        }, 300);
      }
    });
  }, 2100);

  // Exit loader
  setTimeout(() => {
    gsap.to(loader, {
      opacity: 0, duration: 0.9, ease: 'power2.inOut',
      onComplete: () => {
        loader.style.display = 'none';
        document.body.style.overflow = '';
        initHeroReveal();
      }
    });
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

  // Smooth anchor scrolling
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 2.2 });
        if ($('#menu-overlay')?.classList.contains('is-open')) toggleMenu(false);
      }
    });
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
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * 0.28;
      const dy = (e.clientY - r.top  - r.height / 2) * 0.28;
      gsap.to(btn, { x: dx, y: dy, ease: 'power2.out', duration: 0.4 });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, ease: 'elastic.out(1, 0.4)', duration: 0.8 });
    });
  });
}

/* ─────────────────────────────────────────
   13. 3D CARD TILT
───────────────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(hover:none)').matches) return;

  $$('.film-card, .director-card, .cast-card').forEach(card => {
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
   MAIN INIT
───────────────────────────────────────── */
function init() {
  gsap.registerPlugin(ScrollTrigger);
  initGrain();
  initCursor();
  initLoader();

  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initScrollProgress();
    initNav();
    initMenu();
    initScrollAnimations();
    initManifestoIlluminate();
    initWorkCarousel();
    initMagneticButtons();
    initCardTilt();
    initMarquee();
    initFilmBurn();
    initFooter();
  });
}

init();

/* ─────────────────────────────────────────
   CONSOLE EASTER EGG
───────────────────────────────────────── */
console.log(
  '%c\n  CINEMAN PRODUCTIONS\n  Est. 2010 · Ahmedabad · India\n  "We don\'t make films. We engineer feeling."\n',
  'color:#C8962E;font-family:monospace;font-size:11px;line-height:1.6;'
);
