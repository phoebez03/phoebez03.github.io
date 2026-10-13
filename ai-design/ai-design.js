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
  const canvas = reel?.querySelector('canvas');
  const context = canvas?.getContext('2d', { alpha: false });
  const paintingSources = Array.from(paintingGallery.querySelectorAll('img'), (image) => image.src);

  if (reduceMotion || !context || !('Path2D' in window) || !('IntersectionObserver' in window) || paintingSources.length < 2) {
    paintingGallery.classList.add('is-landed');
    return;
  }

  const prepareReel = () => Promise.all(paintingSources.map((source) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  }))).then((paintings) => {
    const panels = paintings.map((image) => {
      const scale = Math.min(1, 1000 / image.naturalWidth, 800 / image.naturalHeight);
      const panel = document.createElement('canvas');
      panel.width = Math.round(image.naturalWidth * scale);
      panel.height = Math.round(image.naturalHeight * scale);
      panel.getContext('2d').drawImage(image, 0, 0, panel.width, panel.height);
      return panel;
    });
    let width = 0;
    let height = 0;
    let panelWidth = 0;
    let offset = 0;
    let inView = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let pauseUntil = 0;
    let lastFrame = 0;
    let frameRequest = 0;

    const edgeAt = (x) => {
      const distance = Math.abs((x - width / 2) / (width / 2));
      const centerHalf = height * (width < 640 ? 0.27 : 0.20);
      return centerHalf + (height * 0.46 - centerHalf) * Math.pow(distance, 1.7);
    };

    const positionAt = (x) => {
      const centered = x - width / 2;
      const distance = centered / (width / 2);
      return offset + centered * (0.82 + 0.18 * distance * distance);
    };

    const draw = () => {
      if (!width || !height) return;
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);

      const path = new Path2D();
      for (let x = 0; x <= width; x += 6) {
        const edge = edgeAt(x);
        if (x === 0) path.moveTo(x, height / 2 - edge);
        else path.lineTo(x, height / 2 - edge);
      }
      path.lineTo(width, height / 2 - edgeAt(width));
      for (let x = width; x >= 0; x -= 6) path.lineTo(x, height / 2 + edgeAt(x));
      path.closePath();

      context.save();
      context.clip(path);
      const cycle = panels.length * panelWidth;
      const seams = [];
      let lastPanel = -1;
      for (let x = 0; x < width; x += 2) {
        const position = ((positionAt(x) % cycle) + cycle) % cycle;
        const panel = Math.floor(position / panelWidth);
        if (lastPanel !== -1 && panel !== lastPanel) seams.push(x);
        lastPanel = panel;

        const image = panels[panel];
        const inside = position - panel * panelWidth;
        const sourceX = inside / panelWidth * image.width;
        const sampleWidth = Math.min(image.width - sourceX, Math.max(1, (positionAt(x + 2) - positionAt(x)) / panelWidth * image.width));
        const edge = edgeAt(x);
        context.drawImage(image, sourceX, 0, sampleWidth, image.height, x, height / 2 - edge, 3, edge * 2);
      }

      context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      context.lineWidth = 2;
      seams.forEach((x) => {
        const edge = edgeAt(x);
        context.beginPath();
        context.moveTo(x, height / 2 - edge);
        context.lineTo(x, height / 2 + edge);
        context.stroke();
      });
      context.restore();

      context.strokeStyle = 'rgba(41, 41, 44, 0.2)';
      context.lineWidth = 1;
      context.stroke(path);
    };

    const resize = () => {
      const bounds = reel.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      const density = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      panelWidth = Math.max(160, Math.min(380, width * 0.34));
      draw();
    };

    const animate = (now) => {
      if (!inView || document.hidden) {
        frameRequest = 0;
        lastFrame = 0;
        return;
      }
      if (!lastFrame || now - lastFrame >= 33) {
        if (lastFrame && !dragging && now > pauseUntil) offset += panelWidth / 5.5 * Math.min((now - lastFrame) / 1000, 0.1);
        draw();
        lastFrame = now;
      }
      frameRequest = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!frameRequest && inView && !document.hidden) frameRequest = window.requestAnimationFrame(animate);
    };

    reel.addEventListener('pointerdown', (event) => {
      dragging = true;
      dragStartX = event.clientX;
      dragStartOffset = offset;
      reel.classList.add('is-dragging');
      reel.setPointerCapture(event.pointerId);
    });
    reel.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      offset = dragStartOffset - (event.clientX - dragStartX);
      draw();
    });
    const stopDragging = () => {
      dragging = false;
      pauseUntil = performance.now() + 4000;
      reel.classList.remove('is-dragging');
    };
    reel.addEventListener('pointerup', stopDragging);
    reel.addEventListener('pointercancel', stopDragging);
    reel.addEventListener('wheel', (event) => {
      offset += event.deltaY * 0.35 + event.deltaX * 0.8;
      pauseUntil = performance.now() + 4000;
      draw();
    }, { passive: true });
    reel.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      offset += (event.key === 'ArrowRight' ? 1 : -1) * panelWidth * 0.7;
      pauseUntil = performance.now() + 4000;
      draw();
    });

    paintingSection.classList.add('has-reel');
    offset = Math.max(160, Math.min(380, reel.clientWidth * 0.34)) / 2;
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
