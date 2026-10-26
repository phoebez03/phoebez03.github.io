(() => {
  const artworks = [...document.querySelectorAll('.painting-open')];
  const dialog = document.querySelector('.painting-dialog');
  let activePainting = 0;
  let paintingOpener;
  const displayPainting = (index) => {
    activePainting = (index + artworks.length) % artworks.length;
    const art = artworks[activePainting];
    const full = dialog.querySelector('.painting-full');
    full.src = art.href;
    full.alt = art.querySelector('img').alt;
    dialog.querySelector('h2').textContent = art.dataset.title;
    dialog.querySelector('.painting-dialog-caption').textContent =
      `${activePainting + 1} of ${artworks.length} · ${art.dataset.detail}`;
  };
  if (dialog && typeof dialog.showModal === 'function') {
    artworks.forEach((art, index) => art.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      paintingOpener = art;
      displayPainting(index);
      dialog.showModal();
      document.body.classList.add('painting-view-open');
    }));
    dialog.querySelector('.painting-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.painting-prev').addEventListener('click', () => displayPainting(activePainting - 1));
    dialog.querySelector('.painting-next').addEventListener('click', () => displayPainting(activePainting + 1));
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        displayPainting(activePainting + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('painting-view-open');
      paintingOpener?.focus({ preventScroll: true });
    });
  }

  if (!window.gsap) return;
  const { gsap } = window;
  const motion = gsap.matchMedia();
  motion.add({ animate: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 901px)' }, (context) => {
    if (!context.conditions.animate) return;
    // One short introduction; photography and paper settle at different moments.
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.addLabel('hello', 0)
      .fromTo('.intro-story > *', { opacity: 0, y: 16 }, {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.09, clearProps: 'opacity,transform'
      }, 'hello')
      .fromTo('.intro-portrait-print', { opacity: 0, y: 18, rotation: -5, scale: 0.985 }, {
        opacity: 1, y: 0, rotation: -3, scale: 1, duration: 0.8, clearProps: 'opacity,transform'
      }, 'hello+=0.15')
      .fromTo('.intro-note', { opacity: 0, y: 12, rotation: 6 }, {
        opacity: 1, y: 0, rotation: 3, duration: 0.7, clearProps: 'opacity,transform'
      }, 'hello+=0.5');

    const pathBoard = document.querySelector('.path-board');
    const stops = [...document.querySelectorAll('.path-stop')];
    const threads = [...document.querySelectorAll('.path-thread path')];
    const pathTimelines = new Map();
    const animatedPathParts = [];
    let pathObserver;
    let pathSequence;
    const makePinSequence = (stop) => {
      const photo = stop.querySelector('.path-photo');
      const pin = stop.querySelector('.board-pin');
      const facts = stop.querySelector('.path-facts');
      const rotation = Number(gsap.getProperty(photo, 'rotation'));
      animatedPathParts.push(photo, pin, facts);
      stop.dataset.pathState = 'pending';
      const sequence = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' },
        onStart: () => { stop.dataset.pathState = 'placing'; },
        onComplete: () => { stop.dataset.pathState = 'pinned'; }
      });
      sequence.addLabel('place', 0)
        .set([pin, facts], { opacity: 0 }, 'place')
        .fromTo(photo, { opacity: 0, y: -24, rotation: rotation - 4, scale: 1.025 },
          { opacity: 1, y: 1, rotation: rotation + 0.6, scale: 1, duration: 0.5 }, 'place')
        .addLabel('pin', 0.3)
        .fromTo(pin, { opacity: 0, y: -18, scale: 1.9, rotation: -18 },
          { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 0.18, ease: 'power2.in' }, 'pin')
        .to(photo, { y: 0, rotation, duration: 0.3, ease: 'back.out(1.15)' }, 'pin+=0.18')
        .fromTo(facts, { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.35 }, 'pin+=0.2')
        .set([photo, pin, facts], { clearProps: 'opacity,transform' });
      pathTimelines.set(stop, sequence);
      return sequence;
    };
    if (pathBoard && stops.length) {
      if (context.conditions.wide) {
        pathSequence = gsap.timeline({ paused: true });
        stops.forEach((stop, index) => {
          const sequence = makePinSequence(stop);
          pathSequence.add(sequence, index * 0.44);
          sequence.paused(false);
        });
        threads.forEach((thread, index) => {
          pathSequence.fromTo(thread, { strokeDasharray: 1, strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.42, ease: 'power1.inOut' }, 0.32 + index * 0.44);
        });
        pathObserver = new IntersectionObserver((entries) => {
          if (entries.some(entry => entry.isIntersecting)) {
            pathSequence.play();
            pathObserver.disconnect();
          }
        }, { threshold: 0.12 });
        pathObserver.observe(pathBoard);
      } else {
        stops.forEach(makePinSequence);
        pathObserver = new IntersectionObserver((entries) => {
          entries.filter(entry => entry.isIntersecting).forEach(entry => {
            pathTimelines.get(entry.target).play();
            pathObserver.unobserve(entry.target);
          });
        }, { threshold: 0.18 });
        stops.forEach(stop => pathObserver.observe(stop));
      }
    }
    const finishPath = () => {
      pathObserver?.disconnect();
      if (pathSequence) pathSequence.progress(1);
      else pathTimelines.forEach(sequence => sequence.progress(1));
    };
    const revealPathAnchor = () => {
      const anchor = document.getElementById(location.hash.slice(1));
      if (anchor?.closest('.path-stop')) finishPath();
    };
    window.addEventListener('hashchange', revealPathAnchor);
    revealPathAnchor();

    const revealItems = [...document.querySelectorAll('[data-reveal]')];
    // Opacity keeps links in the keyboard order while they await the viewport.
    gsap.set(revealItems, { opacity: 0, y: 22 });
    const observer = new IntersectionObserver((entries) => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.7,
          delay: Math.min(index * 0.075, 0.2), ease: 'power3.out',
          clearProps: 'opacity,transform', overwrite: true });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    revealItems.forEach(item => observer.observe(item));
    const revealFocused = (event) => {
      intro.progress(1);
      if (event.target.closest('.path-stop')) finishPath();
      const item = event.target.closest('[data-reveal]');
      if (item) {
        observer.unobserve(item);
        gsap.killTweensOf(item);
        gsap.set(item, { clearProps: 'opacity,transform' });
      }
    };
    document.addEventListener('focusin', revealFocused);

    return () => {
      observer.disconnect();
      pathObserver?.disconnect();
      pathSequence?.kill();
      pathTimelines.forEach(sequence => sequence.kill());
      gsap.killTweensOf([...revealItems, ...animatedPathParts, ...threads]);
      gsap.set(animatedPathParts, { clearProps: 'opacity,transform' });
      gsap.set(threads, { clearProps: 'strokeDasharray,strokeDashoffset' });
      stops.forEach(stop => { delete stop.dataset.pathState; });
      window.removeEventListener('hashchange', revealPathAnchor);
      document.removeEventListener('focusin', revealFocused);
    };
  });
})();
