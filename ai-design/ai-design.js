(() => {
  'use strict';

  if (window.location.hash === '#painting') {
    window.location.replace('/about/#paintings');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = Array.from(document.querySelectorAll('.playground-reveal'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  document.querySelectorAll('.playground-entry-points a').forEach((entry) => {
    entry.addEventListener('click', () => {
      document.querySelectorAll('.playground-entry-points a').forEach((item) => {
        const selected = item === entry;
        item.classList.toggle('is-active', selected);
        if (selected) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    });
  });

  document.querySelectorAll('.fold-showcase').forEach((showcase) => {
    const stack = showcase.querySelector('[data-fold-stack]');
    if (!stack) return;

    let cards = Array.from(stack.querySelectorAll('.fold-card'));
    let paused = false;
    let moving = false;
    let autoplayTimer;
    let transitionTimer;
    const fadeDuration = 180;
    const previousButton = showcase.querySelector('[data-fold-prev]');
    const nextButton = showcase.querySelector('[data-fold-next]');

    const placeCards = () => {
      cards.forEach((card, index) => card.dataset.position = String(index));
    };

    const moveStack = (direction, automatic = false) => {
      if (cards.length < 2 || (automatic && (paused || document.hidden || moving))) return;

      // A manual choice always takes effect immediately, even mid-crossfade.
      window.clearTimeout(transitionTimer);
      cards.forEach((card) => card.classList.remove('is-leaving'));
      moving = false;

      const leaving = cards[0];
      cards = direction > 0
        ? [...cards.slice(1), leaving]
        : [cards[cards.length - 1], ...cards.slice(0, -1)];
      placeCards();

      // Autoplay briefly fades the old image over the already-visible new one.
      if (automatic && !reduceMotion) {
        moving = true;
        leaving.classList.add('is-leaving');
        transitionTimer = window.setTimeout(() => {
          leaving.classList.remove('is-leaving');
          moving = false;
        }, fadeDuration);
      }
    };

    const restartAutoplay = () => {
      if (reduceMotion) return;
      window.clearInterval(autoplayTimer);
      autoplayTimer = window.setInterval(() => moveStack(1, true), 5600);
    };

    previousButton?.addEventListener('click', () => {
      moveStack(-1);
      restartAutoplay();
    });

    nextButton?.addEventListener('click', () => {
      moveStack(1);
      restartAutoplay();
    });

    showcase.addEventListener('mouseenter', () => paused = true);
    showcase.addEventListener('mouseleave', () => paused = false);
    showcase.addEventListener('focusin', () => paused = true);
    showcase.addEventListener('focusout', (event) => {
      if (!showcase.contains(event.relatedTarget)) paused = false;
    });

    placeCards();
    showcase.classList.add('is-enhanced');
    restartAutoplay();
  });

})();
