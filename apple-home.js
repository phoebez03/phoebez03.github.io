(() => {
  const atlas = document.querySelector('.hero-atlas-grid');
  const hero = document.querySelector('.hero-atlas');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demoVideos = [...document.querySelectorAll('video[data-home-demo]')];
  const motionToggle = document.querySelector('.motion-toggle');
  let userPaused = false;
  let heroVisible = true;
  let idleMotion = [];
  let playSticker = null;
  let entranceFinished = true;


  const fitAtlas = () => {
    if (!atlas) return;
    const mobile = innerWidth <= 680;
    const scale = Math.min(1, (innerWidth - (mobile ? 26 : 64)) / atlas.offsetWidth, (innerHeight - (mobile ? 112 : 96)) / atlas.offsetHeight);
    atlas.style.setProperty('--atlas-scale', String(Math.max(.25, scale)));
  };
  fitAtlas();
  window.addEventListener('resize', fitAtlas, { passive: true });
  document.fonts?.ready.then(fitAtlas);

  document.querySelectorAll('.hobby-play').forEach(button => {
    button.addEventListener('click', () => {
      if (!userPaused && !motionPreference.matches) playSticker?.(button);
    });
  });

  const playDemo = (video) => {
    if (userPaused || motionPreference.matches || document.hidden || video.dataset.inView !== 'true') {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  };
  const syncMotion = () => {
    const pause = !entranceFinished || userPaused || document.hidden || !heroVisible || motionPreference.matches;
    idleMotion.forEach(animation => animation.paused(pause));
    demoVideos.forEach(playDemo);
  };
  motionToggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    motionToggle.setAttribute('aria-pressed', String(userPaused));
    motionToggle.setAttribute('aria-label', userPaused ? 'Resume motion' : 'Pause motion');
    motionToggle.title = userPaused ? 'Resume motion' : 'Pause motion';
    motionToggle.querySelector('.motion-toggle-icon').textContent = userPaused ? '▷' : 'Ⅱ';
    document.documentElement.classList.toggle('motion-paused', userPaused);
    syncMotion();
  });
  document.addEventListener('visibilitychange', syncMotion);
  motionPreference.addEventListener('change', syncMotion);

  if ('IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        target.dataset.inView = String(isIntersecting);
        playDemo(target);
      });
    }, { threshold: .3 });
    demoVideos.forEach(video => demoObserver.observe(video));
    const heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncMotion();
    }, { threshold: .1 });
    if (hero) heroObserver.observe(hero);
  }

  if (!window.gsap) return;
  const gsap = window.gsap;
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', context => {
    if (!atlas) return;
    motionToggle.hidden = false;
    entranceFinished = false;
    let disposed = false;
    let readinessTimer;
    const imageReadiness = Promise.allSettled([...atlas.querySelectorAll('img')].map(image => image.decode?.()));
    const entrance = gsap.timeline({
      defaults: { duration: .7, ease: 'power3.out' },
      onComplete: () => { entranceFinished = true; syncMotion(); }
    });
    // Overlap the beats so the composition builds continuously, without a final batch reveal.
    entrance.addLabel('hello', 0).addLabel('studio', .38)
      .addLabel('connections', .8).addLabel('personal', 1.28);
    // Show the introduction immediately; give cold-cache images a bounded head start.
    entrance.addPause('studio', () => {
      const timeout = new Promise(resolve => { readinessTimer = setTimeout(resolve, 1500); });
      Promise.race([imageReadiness, timeout]).then(() => {
        clearTimeout(readinessTimer);
        if (!disposed && !entranceFinished) entrance.play();
      });
    });
    const settle = (target, from, at, extra = {}) => entrance.fromTo(target,
      { opacity: 0, ...from },
      { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1,
        clearProps: 'transform,opacity', ...extra }, at);
    settle('.intro-note', { y: 12, scale: .985 }, 'hello', { duration: .38 });
    settle('.studio-window', { x: 14, y: 18, rotation: -1.5, scale: .975 }, 'studio', { duration: .9 });
    settle('.contact-widget', { y: 10, rotation: -3, scale: .96 }, 'connections');
    settle('.school-pair', { y: 8 }, 'connections+=.12');
    settle('.callout-code', { x: -5, y: 6, scale: .96 }, 'studio+=.48', { duration: .48 });
    settle('.callout-figma', { x: -5, y: 6, scale: .96 }, 'studio+=.7', { duration: .48 });
    settle('.callout-sketch', { x: -5, y: 6, scale: .96 }, 'studio+=.92', { duration: .48 });
    settle('.screen-time-print', { x: -8, y: 11, rotation: 2 }, 'connections+=.3');
    settle('.projects-window', { x: 8, y: 14, rotation: -1.5 }, 'connections+=.48');
    settle('.tool-dock', { y: 12, scale: .98 }, 'connections+=.7');

    // Small, uneven offsets feel placed by hand; each keeps its final CSS rotation.
    const keepsakes = [
      ['.painting-print', -7, 13, 3, 0],
      ['.sticker-palette', 4, 9, -5, .16]
    ];
    keepsakes.forEach(([selector, x, y, rotation, offset]) => {
      settle(selector, { x, y, rotation, scale: .92 }, `personal+=${offset}`,
        { duration: .72, ease: 'back.out(1.12)' });
    });
    const underline = document.querySelector('.ink-underline path');
    const length = underline.getTotalLength();
    entrance.fromTo(underline, { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: .75, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' }, 'studio+=.1');

    document.querySelectorAll('.hobby-play img').forEach((image, index) => {
      idleMotion.push(gsap.to(image, {
        y: [-3,-4,-2,-3][index], rotation: [-1.5,2,1.5,-2][index],
        duration: [2.2,1.9,2.6,2.1][index], paused: true,
        repeat: -1, yoyo: true, ease: 'sine.inOut'
      }));
    });
    document.querySelectorAll('.studio-callout').forEach((label, index) => {
      idleMotion.push(gsap.to(label, { x: -2, y: -3, duration: 3.1 + index * .4,
        paused: true, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    });
    // A visitor who starts navigating should never have to wait for the entrance.
    const finishEntrance = () => { if (!entranceFinished) entrance.progress(1); };
    atlas.addEventListener('focusin', finishEntrance);
    atlas.addEventListener('pointerdown', finishEntrance);
    context.add('tossSticker', button => {
      gsap.killTweensOf(button);
      gsap.timeline().fromTo(button, { y: 0, rotation: 0, scale: 1 }, {
        y: -17, rotation: button.dataset.hobby === 'football' ? 22 : -9,
        scale: 1.08, duration: .22, ease: 'power2.out'
      }).to(button, { y: 0, rotation: 0, scale: 1, duration: .7, ease: 'elastic.out(1,.5)', clearProps: 'transform' });
    });
    playSticker = button => context.tossSticker(button);
    syncMotion();

    const features = [...document.querySelectorAll('.project-feature')];
    let projectObserver;
    const reveal = feature => {
      projectObserver?.unobserve(feature);
      gsap.to(feature, { opacity: 1, y: 0, duration: .7, ease: 'power3.out', clearProps: 'transform,opacity' });
    };
    context.add('revealProject', reveal);
    const focusHandlers = [];
    if ('IntersectionObserver' in window) {
      gsap.set(features, { opacity: 0, y: 20 });
      projectObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) context.revealProject(entry.target); });
      }, { threshold: .08 });
      features.forEach(feature => {
        projectObserver.observe(feature);
        const focus = () => context.revealProject(feature);
        feature.addEventListener('focusin', focus);
        focusHandlers.push([feature, focus]);
      });
    }
    return () => {
      disposed = true;
      clearTimeout(readinessTimer);
      atlas.removeEventListener('focusin', finishEntrance);
      atlas.removeEventListener('pointerdown', finishEntrance);
      entranceFinished = true;
      idleMotion = [];
      playSticker = null;
      motionToggle.hidden = true;

      projectObserver?.disconnect();
      focusHandlers.forEach(([feature, focus]) => feature.removeEventListener('focusin', focus));
    };
  });
})();
