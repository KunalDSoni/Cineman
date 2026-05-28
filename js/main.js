/* ═══════════════════════════════════════════════════════════════
   CINEMAN PRODUCTIONS — CINEMATIC INTERACTION SYSTEM
   GSAP × Lenis × WebGL Grain × Custom Cursor
   Version 1.0 — 2024
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────
   UTILITIES
────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => Math.random() * (max - min) + min;

/* ──────────────────────────────────────────────
   STATE
────────────────────────────────────────────── */
let lenis = null;
let isLoaded = false;
let currentWork = 0;
const totalWork = 3;
let grainFrame = null;

/* ──────────────────────────────────────────────
   1. FILM GRAIN CANVAS
────────────────────────────────────────────── */
function initGrain() {
  const canvas = $('#grain-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animFrame;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawGrain() {
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() * 255) | 0;
      data[i]     = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 18;
    }

    ctx.putImageData(imageData, 0, 0);
    grainFrame = requestAnimationFrame(drawGrain);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  drawGrain();
}

/* ──────────────────────────────────────────────
   2. CUSTOM CURSOR
────────────────────────────────────────────── */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const dot   = $('#cursor-dot');
  const ring  = $('#cursor-ring');
  const label = $('#cursor-label');

  if (!dot || !ring) return;

  let mouse   = { x: -100, y: -100 };
  let dotPos  = { x: -100, y: -100 };
  let ringPos = { x: -100, y: -100 };

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function loop() {
    dotPos.x  = lerp(dotPos.x, mouse.x, 0.9);
    dotPos.y  = lerp(dotPos.y, mouse.y, 0.9);
    ringPos.x = lerp(ringPos.x, mouse.x, 0.14);
    ringPos.y = lerp(ringPos.y, mouse.y, 0.14);

    dot.style.transform  = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
    label.style.transform = `translate(${ringPos.x + 28}px, ${ringPos.y - 28}px) translate(-50%, -50%)`;

    requestAnimationFrame(loop);
  }

  loop();

  // Hover states
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, [role="button"], .film-card, .director-card, .work-btn');
    if (target) {
      document.body.classList.add('cursor-hover');
      if (target.classList.contains('film-card') || target.classList.contains('work-visual')) {
        document.body.classList.add('cursor-view');
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, [role="button"], .film-card, .director-card, .work-btn');
    if (target) {
      document.body.classList.remove('cursor-hover', 'cursor-view');
    }
  });

  document.addEventListener('mousedown', () => document.body.classList.add('cursor-active'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-active'));
}

/* ──────────────────────────────────────────────
   3. CINEMATIC LOADER
────────────────────────────────────────────── */
function initLoader() {
  const loader    = $('#loader');
  const numEl     = $('#loader-num');
  const barEl     = $('#loader-bar');
  const body      = document.body;

  if (!loader) return;

  // Prevent scroll during load
  body.style.overflow = 'hidden';

  let count = 5;
  let progress = 0;
  let countInterval;

  // Count down: 5 → 4 → 3 → 2 → 1
  countInterval = setInterval(() => {
    count--;
    if (numEl) {
      numEl.style.opacity = '0';
      numEl.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        numEl.textContent = count;
        numEl.style.transition = 'opacity 0.2s, transform 0.2s';
        numEl.style.opacity = '1';
        numEl.style.transform = 'translateY(0)';
      }, 180);
    }
    if (count <= 0) {
      clearInterval(countInterval);
    }
  }, 320);

  // Progress bar
  const progressInterval = setInterval(() => {
    progress += rand(8, 18);
    progress = Math.min(progress, 95);
    if (barEl) barEl.style.width = progress + '%';
  }, 120);

  // Finish after ~2s
  setTimeout(() => {
    clearInterval(progressInterval);
    if (barEl) barEl.style.width = '100%';

    setTimeout(() => {
      exitLoader(loader, body);
    }, 300);
  }, 2200);
}

function exitLoader(loader, body) {
  loader.classList.add('is-leaving');

  gsap.to(loader, {
    opacity: 0,
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: () => {
      loader.style.display = 'none';
      body.style.overflow = '';
      isLoaded = true;
      initHeroAnimations();
    }
  });
}

/* ──────────────────────────────────────────────
   4. LENIS SMOOTH SCROLL
────────────────────────────────────────────── */
function initLenis() {
  lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.8,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Internal link smooth scrolling
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = $(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.8 });
        if ($('#menu-overlay').classList.contains('is-open')) {
          toggleMenu(false);
        }
      }
    });
  });
}

/* ──────────────────────────────────────────────
   5. SCROLL PROGRESS BAR
────────────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  gsap.to(bar, {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.3,
    }
  });
}

/* ──────────────────────────────────────────────
   6. NAVIGATION SCROLL BEHAVIOR
────────────────────────────────────────────── */
function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  ScrollTrigger.create({
    start: 80,
    onEnter:  () => nav.classList.add('is-scrolled'),
    onLeaveBack: () => nav.classList.remove('is-scrolled'),
  });
}

/* ──────────────────────────────────────────────
   7. FULLSCREEN MENU
────────────────────────────────────────────── */
function initMenu() {
  const burger  = $('#nav-burger');
  const overlay = $('#menu-overlay');

  if (!burger || !overlay) return;

  burger.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('is-open');
    toggleMenu(!isOpen);
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      toggleMenu(false);
    }
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

/* ──────────────────────────────────────────────
   8. HERO ANIMATIONS (post-loader)
────────────────────────────────────────────── */
function initHeroAnimations() {
  const eyebrow = $('.hero-eyebrow');
  const words   = $$('.hero-word');
  const sub     = $('.hero-sub');
  const actions = $('.hero-actions');
  const stats   = $$('.hero-stat');
  const dividers= $$('.hero-stat-divider');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Eyebrow
  if (eyebrow) {
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.8 }, 0.2);
  }

  // Hero words — cinematic clip-path reveal
  words.forEach((word, i) => {
    tl.add(() => word.classList.add('is-revealed'), 0.4 + i * 0.18);
  });

  // Sub
  if (sub) {
    tl.to(sub, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 1.0);
  }

  // Actions
  if (actions) {
    tl.to(actions, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 1.15);
  }

  // Stats
  stats.forEach((stat, i) => {
    tl.to(stat, { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }, 0.8 + i * 0.12);
  });

  dividers.forEach((d, i) => {
    tl.to(d, { opacity: 1, duration: 0.4 }, 1.0 + i * 0.1);
  });
}

/* ──────────────────────────────────────────────
   9. SCROLL-TRIGGERED ANIMATIONS
────────────────────────────────────────────── */
function initScrollAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  // Generic reveal for all [data-reveal] elements
  $$('[data-reveal]').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });

  // Manifesto word-by-word reveal
  const manifesto = $$('.m-token');
  manifesto.forEach((token, i) => {
    gsap.to(token, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: token,
        start: 'top 90%',
        once: true,
      },
      delay: i * 0.06
    });
  });

  // Section titles — stagger in
  $$('.section-title').forEach(title => {
    gsap.fromTo(title,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: title,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });

  // Film cards stagger
  const filmCards = $$('.film-card');
  if (filmCards.length) {
    gsap.fromTo(filmCards,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.films-grid',
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Director cards
  const dirCards = $$('.director-card');
  if (dirCards.length) {
    gsap.fromTo(dirCards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '.directors-grid',
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Service items
  const serviceItems = $$('.service-item');
  if (serviceItems.length) {
    gsap.fromTo(serviceItems,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.services-grid',
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Award rows stagger
  const awardRows = $$('.award-row');
  if (awardRows.length) {
    gsap.fromTo(awardRows,
      { opacity: 0, x: 30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.awards-right',
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Timeline items
  const tlItems = $$('.tl-item');
  if (tlItems.length) {
    gsap.fromTo(tlItems,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.timeline',
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Journal cards
  const jCards = $$('.journal-card');
  if (jCards.length) {
    gsap.fromTo(jCards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.journal-grid',
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Studio headline
  const studioH = $('.studio-headline');
  if (studioH) {
    gsap.fromTo(studioH,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: studioH,
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Contact headline - dramatic reveal
  const contactH = $('.contact-headline');
  if (contactH) {
    gsap.fromTo(contactH,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: contactH,
          start: 'top 80%',
          once: true,
        }
      }
    );
  }

  // Parallax on hero cinema bg
  const heroBg = $('.hero-cinema-bg');
  if (heroBg) {
    gsap.to(heroBg, {
      yPercent: 15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
      }
    });
  }

  // Marquee pause on scroll direction
  const marqueeTrack = $('#marquee-track');
  if (marqueeTrack) {
    let lastDir = 1;
    if (lenis) {
      lenis.on('scroll', ({ direction }) => {
        if (direction !== lastDir) {
          lastDir = direction;
          if (direction === -1) {
            marqueeTrack.style.animationDirection = 'reverse';
          } else {
            marqueeTrack.style.animationDirection = 'normal';
          }
        }
      });
    }
  }

  // Statement section — scrub reveal
  const statementText = $('#statement-text');
  if (statementText) {
    gsap.fromTo(statementText,
      { opacity: 0.2, y: 30 },
      {
        opacity: 0.85,
        y: 0,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.statement-section',
          start: 'top 70%',
          once: true,
        }
      }
    );
  }
}

/* ──────────────────────────────────────────────
   10. WORK SHOWCASE CAROUSEL
────────────────────────────────────────────── */
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

    setTimeout(() => {
      items[prev].classList.remove('is-leaving');
    }, 600);

    currentWork = ((index % totalWork) + totalWork) % totalWork;
    items[currentWork].classList.add('is-active');

    if (currEl) {
      currEl.textContent = String(currentWork + 1).padStart(2, '0');
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => goTo(currentWork - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => goTo(currentWork + 1));
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const workSection = $('#work');
    if (!workSection) return;
    const rect = workSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowRight') goTo(currentWork + 1);
      if (e.key === 'ArrowLeft')  goTo(currentWork - 1);
    }
  });
}

/* ──────────────────────────────────────────────
   11. FILM CARD PARALLAX TILT
────────────────────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  $$('.film-card, .director-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const rotY   = clamp(dx * 5, -6, 6);
      const rotX   = clamp(-dy * 5, -6, 6);

      gsap.to(card, {
        rotateY: rotY,
        rotateX: rotX,
        transformPerspective: 800,
        ease: 'power2.out',
        duration: 0.5,
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.4)',
      });
    });
  });
}

/* ──────────────────────────────────────────────
   12. MAGNETIC BUTTON EFFECT
────────────────────────────────────────────── */
function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;

  $$('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.25;
      const dy   = (e.clientY - cy) * 0.25;

      gsap.to(btn, {
        x: dx,
        y: dy,
        ease: 'power2.out',
        duration: 0.4,
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        ease: 'elastic.out(1, 0.4)',
        duration: 0.8,
      });
    });
  });
}

/* ──────────────────────────────────────────────
   13. HORIZONTAL FILM STRIP ON HOVER
────────────────────────────────────────────── */
function initFilmCardHover() {
  $$('.film-card').forEach(card => {
    const gradient = card.querySelector('.film-gradient');
    if (!gradient) return;

    card.addEventListener('mouseenter', () => {
      gsap.to(gradient, {
        scale: 1.08,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(gradient, {
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
      });
    });
  });
}

/* ──────────────────────────────────────────────
   14. AMBIENT NUMBER COUNTER ANIMATION
────────────────────────────────────────────── */
function initCounters() {
  const counters = [
    { el: '.stat-num', targets: [15, 1, 14] }
  ];

  $$('.stat-num').forEach((el, i) => {
    const targets = [15, 1, 14];
    const target = targets[i] || 0;

    gsap.fromTo({ val: 0 },
      { val: 0 },
      {
        val: target,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
        },
        onUpdate: function() {
          const plus = el.querySelector('.stat-plus');
          const text = Math.round(this.targets()[0].val);
          if (plus) {
            el.childNodes[0].nodeValue = text;
          } else {
            el.textContent = String(text).padStart(2, '0');
          }
        }
      }
    );
  });
}

/* ──────────────────────────────────────────────
   15. LIGHT LEAK INTERACTION
────────────────────────────────────────────── */
function initLightLeak() {
  const lightLeak = $('.hero-light-leak');
  if (!lightLeak || window.matchMedia('(hover: none)').matches) return;

  document.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 30;
    const ny = (e.clientY / window.innerHeight - 0.5) * 20;

    gsap.to(lightLeak, {
      x: nx,
      y: ny,
      duration: 2,
      ease: 'power1.out',
    });
  });
}

/* ──────────────────────────────────────────────
   16. SECTION CHAPTER LABEL ANIMATION
────────────────────────────────────────────── */
function initChapterLabels() {
  $$('.section-chapter').forEach(label => {
    gsap.fromTo(label,
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: label,
          start: 'top 88%',
          once: true,
        }
      }
    );
  });

  $$('.section-rule').forEach(rule => {
    gsap.fromTo(rule,
      { scaleX: 0, transformOrigin: 'left' },
      {
        scaleX: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rule,
          start: 'top 88%',
          once: true,
        }
      }
    );
  });
}

/* ──────────────────────────────────────────────
   17. FILM BURN TRANSITION EFFECT ON NAV LINKS
────────────────────────────────────────────── */
function initFilmBurnTransition() {
  const flashOverlay = document.createElement('div');
  flashOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(200, 150, 46, 0.08);
    pointer-events: none;
    z-index: 8999;
    opacity: 0;
  `;
  document.body.appendChild(flashOverlay);

  if (lenis) {
    lenis.on('scroll', ({ direction, velocity }) => {
      const speed = Math.abs(velocity);
      if (speed > 50) {
        gsap.to(flashOverlay, {
          opacity: Math.min(speed / 300, 0.12),
          duration: 0.1,
          onComplete: () => {
            gsap.to(flashOverlay, { opacity: 0, duration: 0.3 });
          }
        });
      }
    });
  }
}

/* ──────────────────────────────────────────────
   18. FOOTER BRAND HOVER
────────────────────────────────────────────── */
function initFooterBrand() {
  const wordmark = $('.footer-wordmark');
  if (!wordmark) return;

  wordmark.addEventListener('mouseenter', () => {
    gsap.to('.fw-rest', {
      letterSpacing: '0.25em',
      duration: 0.5,
      ease: 'power2.out',
    });
  });

  wordmark.addEventListener('mouseleave', () => {
    gsap.to('.fw-rest', {
      letterSpacing: '0.15em',
      duration: 0.5,
      ease: 'power2.out',
    });
  });
}

/* ──────────────────────────────────────────────
   19. MOBILE TOUCH INTERACTIONS
────────────────────────────────────────────── */
function initMobileTouch() {
  // Touch swipe for work carousel
  let touchStartX = 0;
  const showcase = $('#work-showcase');

  if (!showcase) return;

  showcase.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  showcase.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) {
        // Swipe left → next
        const nextBtn = $('#work-next');
        if (nextBtn) nextBtn.click();
      } else {
        // Swipe right → prev
        const prevBtn = $('#work-prev');
        if (prevBtn) prevBtn.click();
      }
    }
  }, { passive: true });
}

/* ──────────────────────────────────────────────
   20. PERFORMANCE OBSERVER (Intersection)
────────────────────────────────────────────── */
function initLazyMedia() {
  const lazyItems = $$('.film-card, .director-card, .work-item');

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  lazyItems.forEach(item => observer.observe(item));
}

/* ──────────────────────────────────────────────
   INIT — ORCHESTRATOR
────────────────────────────────────────────── */
function init() {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger);

  // Initialize grain first (visual)
  initGrain();

  // Initialize cursor
  initCursor();

  // Initialize loader
  initLoader();

  // Wait for page ready
  document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initScrollProgress();
    initNav();
    initMenu();
    initScrollAnimations();
    initWorkCarousel();
    initCardTilt();
    initMagneticButtons();
    initFilmCardHover();
    initLightLeak();
    initChapterLabels();
    initFilmBurnTransition();
    initFooterBrand();
    initMobileTouch();
    initLazyMedia();
  });
}

// Start everything
init();

/* ──────────────────────────────────────────────
   CINEMATIC EASTER EGG
────────────────────────────────────────────── */
const easterEgg = `
%c
  ██████╗██╗███╗   ██╗███████╗███╗   ███╗ █████╗ ███╗   ██╗
 ██╔════╝██║████╗  ██║██╔════╝████╗ ████║██╔══██╗████╗  ██║
 ██║     ██║██╔██╗ ██║█████╗  ██╔████╔██║███████║██╔██╗ ██║
 ██║     ██║██║╚██╗██║██╔══╝  ██║╚██╔╝██║██╔══██║██║╚██╗██║
 ╚██████╗██║██║ ╚████║███████╗██║ ╚═╝ ██║██║  ██║██║ ╚████║
  ╚═════╝╚═╝╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝

  PRODUCTIONS — Est. 2010, Ahmedabad
  A Cinematic Storytelling Universe.

  "We don't make films. We engineer feeling."
`;

console.log(easterEgg, 'color: #C8962E; font-family: monospace; font-size: 9px;');
