/* ============================================================
   GSAP — registered plugins per gsap-skills best practice
   Source: github.com/greensock/gsap-skills
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

/* ── PAGE TRANSITION ─────────────────────────────────────────
   Entrance: fade body in on load.
   Exit: fade out before navigating, letting GSAP own the timing
   so we don't need CSS body.page-transition classes.
   ──────────────────────────────────────────────────────────── */
gsap.from('body', { opacity: 0, duration: 0.38, ease: 'power2.out', clearProps: 'opacity' });

document.querySelectorAll('a').forEach((link) => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
  if (link.target === '_blank') return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    gsap.to('body', {
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => { window.location.href = href; },
    });
  });
});

/* ── CUSTOM CURSOR ───────────────────────────────────────────
   gsap.quickTo() is the GSAP-recommended approach for smooth
   cursor tracking — single RAF loop, no manual lerp needed.
   ──────────────────────────────────────────────────────────── */
(function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);

  // xPercent/yPercent center the cursor dot on the pointer
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });

  const hoverTargets = 'a, button, .project-card, .project-row, [data-cursor-hover]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.remove('cursor-hover');
  });
})();

/* ── MAGNETIC BUTTONS ─────────────────────────────────────────
   Primary/secondary buttons ease a few px toward the cursor while
   hovered — a small tactile nudge rather than a flat hover state.
   ──────────────────────────────────────────────────────────── */
(function initMagneticButtons() {
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const LIFT = -3; // replaces the old CSS `:hover { transform: translateY(-2px) }`

  document.querySelectorAll('.btn').forEach((btn) => {
    const moveX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
    const moveY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });

    btn.addEventListener('mouseenter', () => moveY(LIFT));
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      moveX((e.clientX - rect.left - rect.width / 2) * 0.25);
      moveY(LIFT + (e.clientY - rect.top - rect.height / 2) * 0.25);
    });

    btn.addEventListener('mouseleave', () => {
      moveX(0);
      moveY(0);
    });
  });
})();

/* ── EDUCATION CARD + SKILL ROW HOVER (About page) ────────────
   Small, thoughtful GSAP-driven hover states — replaces flat CSS
   hovers with eased timelines so the lift/color/shift can be
   reversed mid-animation on a quick mouse in/out instead of
   snapping. Hex values mirror the site's --blue/--ink tokens
   (GSAP tweens computed color, not CSS var() references).
   ──────────────────────────────────────────────────────────── */
(function initHoverMicroInteractions() {
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.edu-card').forEach((card) => {
    const school = card.querySelector('.edu-card-school');
    const tl = gsap.timeline({ paused: true, defaults: { duration: 0.4, ease: 'power3.out' } });
    tl.to(card, { y: -8, boxShadow: '0 20px 44px rgba(46, 56, 69, 0.14)' }, 0);
    if (school) tl.to(school, { color: '#4d648c' }, 0);

    card.addEventListener('mouseenter', () => tl.play());
    card.addEventListener('mouseleave', () => tl.reverse());
  });

  document.querySelectorAll('.skill-row').forEach((row) => {
    const label = row.querySelector('.skill-label');
    const value = row.querySelector('.skill-value');
    const tl = gsap.timeline({ paused: true, defaults: { duration: 0.35, ease: 'power2.out' } });
    if (label) tl.to(label, { color: '#4d648c' }, 0);
    if (value) tl.to(value, { x: 10, color: '#2b323c' }, 0);

    row.addEventListener('mouseenter', () => tl.play());
    row.addEventListener('mouseleave', () => tl.reverse());
  });
})();

/* ── NAVIGATION ──────────────────────────────────────────────
   Timeline sequences logo then links using position parameter
   ("-=0.35") instead of delay-chaining per gsap-timeline skill.
   fromTo() used because CSS starts these at opacity:0.
   ──────────────────────────────────────────────────────────── */
(function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .fromTo('.nav-logo',
      { autoAlpha: 0, x: -14 },
      { autoAlpha: 1, x: 0, duration: 0.6 }
    )
    .fromTo('.nav-link',
      { autoAlpha: 0, x: 14 },
      { autoAlpha: 1, x: 0, stagger: 0.08, duration: 0.5 },
      '-=0.35'
    );

  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav-scrolled', window.scrollY > 80);
  }, { passive: true });
})();

/* ── HERO WORD SPLIT ─────────────────────────────────────────
   Wraps each word in a span so GSAP can stagger them.
   Must run before initHero() or the selector won't find .word.
   ──────────────────────────────────────────────────────────── */
(function splitHeroWords() {
  const heading = document.querySelector('.hero-heading');
  if (!heading) return;
  const lines = heading.innerHTML.split('<br>');
  heading.innerHTML = lines
    .map((line) =>
      line.trim().split(' ')
        .map((word) => `<span class="word">${word}</span>`)
        .join(' ')
    )
    .join('<br>');
})();

/* ── GSAP MATCHMEDIA ─────────────────────────────────────────
   All motion lives inside matchMedia so it is automatically
   disabled for users with prefers-reduced-motion: reduce.
   Per gsap-core skill: "Respect prefers-reduced-motion."
   ──────────────────────────────────────────────────────────── */
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {

  /* ── HERO ENTRANCE: blur-to-focus (Apple keynote reveal) ──
     Each element starts blurred, slightly scaled up and offset,
     then sharpens into place. Longer durations + power4/expo
     eases give the weighty, decelerating "Apple" feel instead
     of a quick UI-standard ease.
     ──────────────────────────────────────────────────────── */
  const heroTl = gsap.timeline({
    defaults: { ease: 'power4.out' },
    delay: 0.15,
  });

  if (document.querySelector('.hero-label')) {
    heroTl.fromTo('.hero-label',
      { autoAlpha: 0, y: 16, filter: 'blur(10px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9 },
      0
    );
  }
  if (document.querySelector('.hero-role')) {
    heroTl.fromTo('.hero-role',
      { autoAlpha: 0, y: 22, filter: 'blur(14px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.05 },
      '-=0.6'
    );
  }
  if (document.querySelector('.hero-heading .word')) {
    heroTl.fromTo('.hero-heading .word',
      { autoAlpha: 0, y: 32, scale: 1.04, filter: 'blur(18px)' },
      { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', stagger: 0.06, duration: 1.2 },
      '-=0.75'
    );
  }
  if (document.querySelector('.hero-text')) {
    heroTl.fromTo('.hero-text',
      { autoAlpha: 0, y: 18, filter: 'blur(10px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9 },
      '-=0.85'
    );
  }
  if (document.querySelector('.hero-ctas')) {
    heroTl.fromTo('.hero-ctas',
      { autoAlpha: 0, y: 14, filter: 'blur(8px)' },
      { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.75 },
      '-=0.55'
    );
  }

  /* ── HERO SCROLL-SCRUBBED PARALLAX EXIT ───────────────────
     As the user scrolls through the hero's own height, the
     whole text block scales down, lifts, and re-blurs slightly
     — tied directly to scroll position (scrub), not a duration.
     Mirrors the "content recedes as you scroll" feel on
     apple.com product pages.
     ──────────────────────────────────────────────────────── */
  if (document.querySelector('.hero-content')) {
    gsap.to('.hero-content', {
      opacity: 0,
      y: -70,
      scale: 0.94,
      filter: 'blur(6px)',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  }

  /* ── SCROLL REVEALS ───────────────────────────────────── */
  // ScrollTrigger.batch() is the performant way to animate
  // multiple elements entering the viewport — one RAF loop,
  // stagger handled by GSAP, not by staggered observers.

  // Generic section reveals (.reveal labels, headings, text)
  ScrollTrigger.batch('.reveal', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.7, ease: 'power2.out' }
    ),
    once: true,
    start: 'top 90%',
  });

  // Homepage project cards — more pronounced lift
  ScrollTrigger.batch('.project-card', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, stagger: 0.13, duration: 0.75, ease: 'power2.out' }
    ),
    once: true,
    start: 'top 87%',
  });

  // Evidence annotations arrive from the image edge just after each card,
  // giving the project grid a more editorial, portfolio-specific rhythm.
  ScrollTrigger.batch('.project-annotation', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, x: 18, scale: 0.96 },
      { autoAlpha: 1, x: 0, scale: 1, stagger: 0.13, duration: 0.65, ease: 'power3.out', clearProps: 'transform' }
    ),
    once: true,
    start: 'top 88%',
  });

  // Projects-page list rows
  ScrollTrigger.batch('.project-row', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.75, ease: 'power2.out' }
    ),
    once: true,
    start: 'top 87%',
  });

  // Credibility bar
  ScrollTrigger.batch('.cred-bar', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    ),
    once: true,
    start: 'top 92%',
  });

  // About-hero photo booth — blur/fade only, deliberately never
  // touching transform, so the CSS-only hover fan-out on these two
  // frames (.photo-booth:hover .photo-frame-*) keeps working after
  // GSAP's one-time reveal has run and left its inline styles behind.
  ScrollTrigger.batch('.photo-frame', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, filter: 'blur(16px)' },
      { autoAlpha: 1, filter: 'blur(0px)', stagger: 0.18, duration: 1, ease: 'power3.out' }
    ),
    once: true,
    start: 'top 85%',
  });

  // Journey marquees — blur/fade in only (no transform), so it
  // never fights the continuous xPercent loop main.js drives on
  // each track once it's visible.
  ScrollTrigger.batch('.journey-marquee', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, filter: 'blur(16px)' },
      { autoAlpha: 1, filter: 'blur(0px)', stagger: 0.15, duration: 1, ease: 'power3.out' }
    ),
    once: true,
    start: 'top 90%',
  });

  // Education cards — individual stagger instead of one flat block.
  // clearProps hands the inline transform back to CSS once the reveal
  // finishes, so initHoverMicroInteractions' own GSAP hover timeline
  // (see above) starts from a clean baseline instead of the reveal's.
  ScrollTrigger.batch('.edu-card', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, y: 30 },
      { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.7, ease: 'power2.out', clearProps: 'transform' }
    ),
    once: true,
    start: 'top 90%',
  });

  // Skill rows
  ScrollTrigger.batch('.skill-row', {
    onEnter: (els) => gsap.fromTo(els,
      { autoAlpha: 0, x: -16 },
      { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out' }
    ),
    once: true,
    start: 'top 92%',
  });

  // Cleanup when matchMedia condition no longer applies
  return () => {
    ScrollTrigger.getAll().forEach((st) => st.kill());
  };
});

// Reduced-motion: clear all inline styles GSAP would have set,
// ensuring everything is immediately visible.
mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.set([
    '.hero-label', '.hero-role', '.hero-heading .word',
    '.hero-text', '.hero-ctas', '.hero-content',
    '.reveal', '.project-card', '.project-annotation', '.project-row', '.cred-bar',
    '.nav-logo', '.nav-link',
    '.photo-frame', '.journey-marquee', '.edu-card', '.skill-row',
  ], { clearProps: 'all' });
});

/* ── JOURNEY STAGE NAVIGATOR (About page) ────────────────────
   Manual navigation is the primary interaction — no autoplay
   timer stealing the stage away mid-read. Prev/Next buttons and
   the stage-name tabs are the only things that advance the
   narrative; both wrap infinitely in either direction so there's
   never a dead end at the first or last stage. The stage text
   crossfades with a GSAP timeline while the single continuous
   image filmstrip underneath (see initJourneyMarquees) keeps
   scrolling the whole time — the imagery never resets or pauses
   between stages, it just gets a brightness "spotlight" on the
   photos belonging to whichever stage is active, so the journey
   reads as one uninterrupted flow instead of three disconnected
   slides.
   ──────────────────────────────────────────────────────────── */
(function initJourneyStages() {
  const root = document.querySelector('[data-journey]');
  if (!root) return;

  const stageBtns = Array.from(root.querySelectorAll('[data-stage-btn]'));
  const panels = Array.from(root.querySelectorAll('[data-stage-panel]'));
  const prevBtn = root.querySelector('[data-journey-prev]');
  const nextBtn = root.querySelector('[data-journey-next]');
  const counter = root.querySelector('[data-stage-current]');
  const count = panels.length;
  if (!count) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let animating = false;

  function highlightMarquee(index) {
    // Queried fresh each call (not cached) because initJourneyMarquees
    // clones every item once for its seamless loop; caching at init
    // time would miss that cloned half of the filmstrip.
    root.querySelectorAll('.journey-marquee-item').forEach((item) => {
      item.classList.toggle('is-current', Number(item.dataset.stage) === index);
    });
  }

  function goTo(index) {
    if (animating) return;
    const next = ((index % count) + count) % count; // wrap both directions
    if (next === current) return;

    const outgoing = panels[current];
    const incoming = panels[next];

    stageBtns[current]?.classList.remove('is-active');
    stageBtns[current]?.setAttribute('aria-selected', 'false');
    stageBtns[next]?.classList.add('is-active');
    stageBtns[next]?.setAttribute('aria-selected', 'true');
    if (counter) counter.textContent = String(next + 1).padStart(2, '0');
    highlightMarquee(next);
    current = next;

    if (reducedMotion) {
      outgoing.classList.remove('is-active');
      incoming.classList.add('is-active');
      return;
    }

    animating = true;
    // Pull the outgoing paragraph out of flow so it overlays the
    // incoming one at the same position while both are briefly visible
    // — otherwise two in-flow blocks would stack and jump the layout.
    gsap.set(outgoing, { position: 'absolute', top: 0, left: 0, width: '100%' });
    incoming.classList.add('is-active');
    gsap.timeline({
      onComplete: () => {
        animating = false;
        outgoing.classList.remove('is-active');
        gsap.set(outgoing, { clearProps: 'position,top,left,width' });
      },
    })
      .fromTo(incoming, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0)
      .to(outgoing, { autoAlpha: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 0);
  }

  highlightMarquee(current);
  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  stageBtns.forEach((btn, i) => btn.addEventListener('click', () => goTo(i)));
})();

/* ── JOURNEY MARQUEES ─────────────────────────────────────────
   Each part's photos loop sideways forever. Every track's
   children are duplicated once here so translating by exactly
   -50% loops seamlessly; direction alternates per track and speed
   varies slightly so the parts don't move in visible lockstep.
   Runs after initJourneyStepper so it also picks up the loop
   clone's own marquee track. Frozen for reduced-motion.
   ──────────────────────────────────────────────────────────── */
(function initJourneyMarquees() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('[data-marquee-track]').forEach((track, i) => {
    Array.from(track.children).forEach((item) => track.appendChild(item.cloneNode(true)));

    const reverse = i % 2 === 1;
    if (reverse) gsap.set(track, { xPercent: -50 });
    gsap.to(track, {
      xPercent: reverse ? 0 : -50,
      duration: 22 + i * 3,
      ease: 'none',
      repeat: -1,
    });
  });
})();

/* ── CASE STUDY: STICKY DOT-TRACK SCROLL-SPY NAV ────────── */
(function initCaseStudyScrollSpy() {
  document.querySelectorAll('[data-cs-scrollspy]').forEach((root) => {
    const items = root.querySelectorAll('.cs-side-nav-item');
    const sections = root.querySelectorAll('.cs-section');
    if (!items.length || !sections.length) return;

    function setActive(id) {
      items.forEach((item) => {
        const link = item.querySelector('a');
        item.classList.toggle('is-active', link?.getAttribute('href') === `#${id}`);
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));

    items.forEach((item) => {
      const link = item.querySelector('a');
      link?.addEventListener('click', (e) => {
        e.preventDefault();
        root.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    requestAnimationFrame(() => setActive(sections[0].id));
  });
})();

/* ── CASE STUDY: SCROLL PROGRESS BAR ────────────────────── */
(function initCaseStudyProgressBar() {
  const bar = document.getElementById('cs-progress-bar');
  if (!bar) return;

  function update() {
    const max = document.body.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
})();
