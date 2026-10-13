(() => {
  const heroIntro = document.querySelector('.hero-note-intro');
  const heroSupport = document.querySelector('.hero-note-support');
  const heroCmu = document.querySelector('.hero-school-cmu');
  const heroMelbourne = document.querySelector('.hero-school-melbourne');
  const sectionHeading = document.querySelector('.project-section .section-header');
  const projectFeatures = [...document.querySelectorAll('.project-feature')];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demoVideos = [...document.querySelectorAll('video[data-home-demo]')];

  const playDemo = (video) => {
    if (motionPreference.matches || document.hidden || video.dataset.inView !== 'true') {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  };

  if ('IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.dataset.inView = String(isIntersecting);
        playDemo(target);
      });
    }, { threshold: 0.3 });
    demoVideos.forEach((video) => demoObserver.observe(video));
  }
  motionPreference.addEventListener('change', () => demoVideos.forEach(playDemo));
  document.addEventListener('visibilitychange', () => demoVideos.forEach(playDemo));

  if (!window.gsap || motionPreference.matches) return;

  window.gsap.timeline({ defaults: { duration: 0.78, ease: 'power3.out' } })
    .from(heroIntro, { autoAlpha: 0, y: 36, rotation: -11, scale: 0.96, clearProps: 'transform,opacity,visibility' })
    .from(heroSupport, { autoAlpha: 0, y: 46, rotation: 14, scale: 0.94, clearProps: 'transform,opacity,visibility' }, '-=0.35')
    .from(heroCmu, { autoAlpha: 0, y: 26, rotation: 20, scale: 0.84, clearProps: 'transform,opacity,visibility' }, '-=0.3')
    .from(heroMelbourne, { autoAlpha: 0, y: 32, rotation: -16, scale: 0.88, clearProps: 'transform,opacity,visibility' }, '-=0.35')
    .from(sectionHeading, { autoAlpha: 0, y: 18, duration: 0.7, clearProps: 'transform,opacity,visibility' }, '-=0.4');

  if (!('IntersectionObserver' in window)) return;

  // Opacity keeps offscreen project links available to keyboard navigation.
  window.gsap.set(projectFeatures, { opacity: 0, y: 24 });
  const revealFeature = (feature) => {
    if (feature.dataset.revealed) return;
    feature.dataset.revealed = 'true';
    observer.unobserve(feature);
    window.gsap.to(feature, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      clearProps: 'transform,opacity'
    });
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealFeature(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  projectFeatures.forEach((feature) => {
    observer.observe(feature);
    feature.addEventListener('focusin', () => revealFeature(feature));
  });
})();
