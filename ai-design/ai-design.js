(() => {
  'use strict';

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
    const fadeDuration = reduceMotion ? 0 : 1050;
    const settleDuration = reduceMotion ? 20 : 2150;
    const previousButton = showcase.querySelector('[data-fold-prev]');
    const nextButton = showcase.querySelector('[data-fold-next]');
    const controls = [previousButton, nextButton].filter(Boolean);

    const placeCards = () => {
      cards.forEach((card, index) => card.dataset.position = String(index));
    };

    const setControlsDisabled = (disabled) => {
      controls.forEach((control) => control.disabled = disabled);
    };

    const moveStack = (direction, automatic = false) => {
      if ((automatic && (paused || document.hidden)) || moving) return;
      moving = true;
      setControlsDisabled(true);

      const leaving = cards[0];
      leaving.classList.add('is-leaving');

      window.setTimeout(() => {
        leaving.classList.add('is-resetting');
        cards = direction > 0
          ? [...cards.slice(1), leaving]
          : [cards[cards.length - 1], ...cards.slice(0, -1)];
        placeCards();
        leaving.classList.remove('is-leaving');

        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            leaving.classList.remove('is-resetting');
          });
        });
      }, fadeDuration);

      window.setTimeout(() => {
        moving = false;
        setControlsDisabled(false);
      }, settleDuration);
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
    restartAutoplay();
  });

  const paintingGallery = document.querySelector('[data-painting-gallery]');
  if (!paintingGallery) return;

  const paintingTiles = Array.from(paintingGallery.querySelectorAll('.painting-tile'));
  if (reduceMotion || !window.gsap || !('IntersectionObserver' in window)) {
    paintingGallery.classList.add('is-landed');
    return;
  }

  const { gsap } = window;
  const rotations = [-4.5, 3.2, -2.4, 4.1, 2.8, -3.6, 3.8, -2.9];
  const jitterX = [-52, 28, 58, -24, 42, -44, 18, 54];
  const jitterY = [34, -38, 18, 48, -28, 30, -46, 12];
  const galleryBounds = paintingGallery.getBoundingClientRect();
  const galleryCenterX = galleryBounds.left + galleryBounds.width / 2;
  const galleryCenterY = galleryBounds.top + galleryBounds.height / 2;

  const startStates = paintingTiles.map((tile, index) => {
    const bounds = tile.getBoundingClientRect();
    return {
      x: galleryCenterX - (bounds.left + bounds.width / 2) + jitterX[index],
      y: galleryCenterY - (bounds.top + bounds.height / 2) + jitterY[index],
      rotation: rotations[index],
      scale: 0.84 + (index % 3) * 0.025
    };
  });

  paintingTiles.forEach((tile, index) => {
    gsap.set(tile, {
      autoAlpha: 0,
      x: startStates[index].x,
      y: startStates[index].y,
      rotation: startStates[index].rotation,
      scale: startStates[index].scale,
      transformOrigin: '50% 50%'
    });
  });

  const paintingTimeline = gsap.timeline({
    paused: true,
    onComplete: () => {
      gsap.set(paintingTiles, { clearProps: 'transform,opacity,visibility' });
      paintingGallery.classList.add('is-landed');
    }
  });

  paintingTiles.forEach((tile, index) => {
    const start = startStates[index];
    const tileTimeline = gsap.timeline();

    tileTimeline
      .to(tile, {
        autoAlpha: 1,
        x: start.x * 0.34,
        y: start.y * 0.34,
        rotation: start.rotation * 0.35,
        scale: 0.95,
        duration: 1.1,
        ease: 'sine.inOut'
      })
      .to(tile, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 1.35,
        ease: 'power3.out'
      });

    paintingTimeline.add(tileTimeline, index * 0.12);
  });

  const paintingObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      paintingTimeline.play(0);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -4% 0px' });

  paintingObserver.observe(paintingGallery);
})();
