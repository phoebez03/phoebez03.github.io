(() => {
  const projectCards = [...document.querySelectorAll('[data-project]')];
  const coverflowStage = document.querySelector('.project-coverflow-stage');
  const coverflowPrev = document.querySelector('#coverflow-prev');
  const coverflowNext = document.querySelector('#coverflow-next');
  const coverflowDots = [...document.querySelectorAll('[data-coverflow-index]')];
  const hero = document.querySelector('.homepage-hero-inner');
  const sectionHeading = document.querySelector('.project-section .section-header');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typingTarget = document.querySelector('[data-typing-target]');
  const typedLine = typingTarget?.closest('.homepage-typed-line');

  function playIntroTyping() {
    if (!typingTarget) return;
    const text = typingTarget.dataset.typingText || typingTarget.textContent;
    if (reduceMotion) {
      typingTarget.textContent = text;
      typedLine?.classList.add('is-complete');
      return;
    }

    typingTarget.textContent = '';
    let index = 0;
    const typeNextCharacter = () => {
      typingTarget.textContent = text.slice(0, index + 1);
      index += 1;
      if (index < text.length) {
        window.setTimeout(typeNextCharacter, 48);
      } else {
        typedLine?.classList.add('is-complete');
      }
    };
    window.setTimeout(typeNextCharacter, 520);
  }

  playIntroTyping();

  if (!coverflowStage || projectCards.length === 0) return;

  let activeProjectIndex = 0;
  let pointerStart = null;
  let coverflowWasDragged = false;
  let wheelAccumulator = 0;
  let wheelLocked = false;
  let wheelResetTimer;
  let wheelUnlockTimer;
  let coverflowTransitionTimer;
  let coverflowTransitioning = false;

  const coverflowDuration = reduceMotion ? 0 : 0.82;
  const coverflowDurationMs = coverflowDuration * 1000;

  function beginCoverflowTransition() {
    if (reduceMotion) return;
    coverflowTransitioning = true;
    window.clearTimeout(coverflowTransitionTimer);
    coverflowTransitionTimer = window.setTimeout(() => {
      coverflowTransitioning = false;
    }, coverflowDurationMs + 40);
  }

  function renderCoverflow({ focus = false, reveal = false } = {}) {
    activeProjectIndex = ((activeProjectIndex % projectCards.length) + projectCards.length) % projectCards.length;

    projectCards.forEach((card, index) => {
      let distance = index - activeProjectIndex;
      if (distance > projectCards.length / 2) distance -= projectCards.length;
      if (distance < -projectCards.length / 2) distance += projectCards.length;

      const absoluteDistance = Math.abs(distance);
      const isFar = absoluteDistance > 1;
      const direction = Math.sign(distance);
      const link = card.querySelector('.project-link');
      const isActive = distance === 0;

      card.classList.toggle('is-active', isActive);
      link.tabIndex = isActive ? 0 : -1;
      card.setAttribute('aria-hidden', String(!isActive));

      const position = {
        xPercent: -50 + (isFar ? direction * 106 : distance * 68),
        z: isFar ? -340 : absoluteDistance ? -170 : 0,
        rotationY: isFar ? direction * -56 : distance * -42,
        scale: isFar ? 0.66 : absoluteDistance ? 0.82 : 1,
        autoAlpha: isFar ? 0.24 : absoluteDistance ? 0.72 : 1,
        zIndex: 10 - absoluteDistance,
        duration: coverflowDuration,
        ease: 'power3.inOut',
        overwrite: 'auto'
      };

      if (window.gsap) {
        if (reveal && !reduceMotion) {
          window.gsap.fromTo(card,
            { xPercent: -50, z: -280, rotationY: 0, scale: 0.9, autoAlpha: 0 },
            position
          );
        } else {
          window.gsap.to(card, position);
        }
      } else {
        card.style.opacity = String(position.autoAlpha);
        card.style.zIndex = String(position.zIndex);
        card.style.transform = `translateX(${position.xPercent}%) scale(${position.scale})`;
      }
    });

    coverflowDots.forEach((dot, index) => {
      const active = index === activeProjectIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', String(active));
    });

    if (focus) projectCards[activeProjectIndex].querySelector('.project-link').focus({ preventScroll: true });
  }

  function moveCoverflow(step, options) {
    if (coverflowTransitioning) return false;
    const normalizedStep = Math.sign(step);
    if (normalizedStep === 0) return false;
    activeProjectIndex = (activeProjectIndex + normalizedStep + projectCards.length) % projectCards.length;
    renderCoverflow(options);
    beginCoverflowTransition();
    return true;
  }

  coverflowPrev?.addEventListener('click', () => moveCoverflow(-1));
  coverflowNext?.addEventListener('click', () => moveCoverflow(1));

  coverflowDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      if (coverflowTransitioning) return;
      activeProjectIndex = Number(dot.dataset.coverflowIndex);
      renderCoverflow();
      beginCoverflowTransition();
    });
  });

  projectCards.forEach((card, index) => {
    card.addEventListener('click', (event) => {
      if (index === activeProjectIndex) return;
      event.preventDefault();
      let distance = index - activeProjectIndex;
      if (distance > projectCards.length / 2) distance -= projectCards.length;
      if (distance < -projectCards.length / 2) distance += projectCards.length;
      moveCoverflow(Math.sign(distance));
    });
  });

  coverflowStage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveCoverflow(-1, { focus: true });
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveCoverflow(1, { focus: true });
    }
  });

  coverflowStage.addEventListener('pointerdown', (event) => {
    pointerStart = event.clientX;
    coverflowWasDragged = false;
  });

  coverflowStage.addEventListener('pointerup', (event) => {
    if (pointerStart === null) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(distance) < 45) return;
    coverflowWasDragged = true;
    moveCoverflow(distance > 0 ? -1 : 1);
  });

  coverflowStage.addEventListener('pointercancel', () => {
    pointerStart = null;
  });

  coverflowStage.addEventListener('wheel', (event) => {
    const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const movement = horizontalIntent ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    if (movement === 0) return;

    event.preventDefault();
    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => { wheelAccumulator = 0; }, 180);
    if (wheelLocked) return;

    wheelAccumulator += movement;
    if (Math.abs(wheelAccumulator) < 28) return;

    const moved = moveCoverflow(wheelAccumulator > 0 ? 1 : -1);
    wheelAccumulator = 0;
    if (!moved) return;
    wheelLocked = true;
    window.clearTimeout(wheelUnlockTimer);
    wheelUnlockTimer = window.setTimeout(() => { wheelLocked = false; }, coverflowDurationMs + 220);
  }, { passive: false });

  coverflowStage.addEventListener('click', (event) => {
    if (!coverflowWasDragged) return;
    event.preventDefault();
    event.stopPropagation();
    coverflowWasDragged = false;
  }, true);

  renderCoverflow({ reveal: true });

  if (window.gsap && !reduceMotion) {
    window.gsap.fromTo(hero, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' });
    window.gsap.fromTo(sectionHeading, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.18, ease: 'power3.out' });
  }
})();
