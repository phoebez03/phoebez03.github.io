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

  const paintingGallery = document.querySelector('[data-painting-gallery]');
  if (!paintingGallery) return;

  const reel = document.querySelector('[data-painting-reel]');
  const paintingSection = paintingGallery.closest('.painting-showcase');
  const track = reel?.querySelector('.painting-reel-track');
  const paintingSources = Array.from(paintingGallery.querySelectorAll('img'), (image) => image.src);

  if (reduceMotion || !track || !('IntersectionObserver' in window) || paintingSources.length < 2) {
    paintingGallery.classList.add('is-landed');
    return;
  }

  const prepareReel = () => Promise.all(paintingSources.map((source) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  }))).then((paintings) => {
    const cards = paintings.map((image) => {
      const card = document.createElement('figure');
      card.className = 'painting-reel-card';
      image.alt = '';
      image.draggable = false;
      card.append(image);
      track.append(card);
      return card;
    });
    let cardSize = 0;
    let spacing = 0;
    let position = 0;
    let target = 0;
    let inView = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartPosition = 0;
    let hovering = false;
    let pauseUntil = 0;
    let lastFrame = 0;
    let frameRequest = 0;

    const render = () => {
      if (!cardSize) return;
      const cyclePosition = ((position % cards.length) + cards.length) % cards.length;
      cards.forEach((card, index) => {
        let distance = index - cyclePosition;
        if (distance > cards.length / 2) distance -= cards.length;
        if (distance < -cards.length / 2) distance += cards.length;
        const depth = Math.abs(distance);
        const scale = Math.max(0.73, 1 - depth * 0.15);
        const opacity = Math.max(0, 1 - Math.max(0, depth - 0.4) * 0.3);
        card.style.transform = `translate3d(calc(-50% + ${distance * spacing}px), -50%, 0) scale(${scale})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(Math.round((cards.length - depth) * 10));
        card.style.visibility = depth > 2.6 ? 'hidden' : 'visible';
      });
    };

    const resize = () => {
      const bounds = reel.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      cardSize = Math.min(bounds.width < 640 ? 250 : 390, bounds.width * (bounds.width < 640 ? 0.68 : 0.38), bounds.height * 0.78);
      spacing = cardSize * (bounds.width < 640 ? 0.94 : 1.02);
      reel.style.setProperty('--painting-card-size', `${cardSize}px`);
      render();
    };

    const animate = (now) => {
      if (!inView || document.hidden) {
        frameRequest = 0;
        lastFrame = 0;
        return;
      }
      const elapsed = lastFrame ? Math.min(now - lastFrame, 64) : 0;
      lastFrame = now;
      if (!dragging && !hovering && now > pauseUntil) target += elapsed / 5500;
      if (!dragging) position += (target - position) * Math.min(1, elapsed / 240);
      if (Math.abs(position) > cards.length * 100) {
        const cycles = Math.trunc(position / cards.length) * cards.length;
        position -= cycles;
        target -= cycles;
      }
      render();
      frameRequest = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!frameRequest && inView && !document.hidden) frameRequest = window.requestAnimationFrame(animate);
    };

    reel.addEventListener('pointerdown', (event) => {
      dragging = true;
      dragStartX = event.clientX;
      dragStartPosition = position;
      reel.classList.add('is-dragging');
      reel.setPointerCapture(event.pointerId);
    });
    reel.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      position = dragStartPosition - (event.clientX - dragStartX) / spacing;
      target = position;
      render();
    });
    const stopDragging = () => {
      if (!dragging) return;
      dragging = false;
      target = Math.round(position);
      pauseUntil = performance.now() + 3000;
      reel.classList.remove('is-dragging');
    };
    reel.addEventListener('pointerup', stopDragging);
    reel.addEventListener('pointercancel', stopDragging);
    reel.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') hovering = true;
    });
    reel.addEventListener('pointerleave', () => { hovering = false; });
    reel.addEventListener('wheel', (event) => {
      target += (event.deltaX + event.deltaY * 0.35) / Math.max(spacing, 1);
      pauseUntil = performance.now() + 2500;
    }, { passive: true });
    reel.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      target = Math.round(target) + (event.key === 'ArrowRight' ? 1 : -1);
      pauseUntil = performance.now() + 3500;
    });

    paintingSection.classList.add('has-reel');
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(reel);
    else window.addEventListener('resize', resize);
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) startAnimation();
    }, { threshold: 0.1 }).observe(reel);
    document.addEventListener('visibilitychange', startAnimation);
  }).catch(() => {
    paintingSection.classList.remove('has-reel');
    paintingGallery.classList.add('is-landed');
  });

  const loadObserver = new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    prepareReel();
  }, { rootMargin: '500px 0px' });
  loadObserver.observe(paintingSection);
})();
