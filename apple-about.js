(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduceMotion) return;

  const { gsap } = window;

  gsap.fromTo(
    '.about-hero-copy > *',
    { autoAlpha: 0, y: 24 },
    { autoAlpha: 1, y: 0, duration: 0.82, stagger: 0.1, ease: 'power3.out' }
  );

  gsap.fromTo(
    '.about-portrait img',
    { autoAlpha: 0.72, scale: 1.035 },
    { autoAlpha: 1, scale: 1, duration: 1.15, ease: 'power3.out' }
  );

  const revealItems = [
    ...document.querySelectorAll('.about-section-heading'),
    ...document.querySelectorAll('.journey-stop'),
    ...document.querySelectorAll('.education-cards article'),
    ...document.querySelectorAll('.about-practice-photo'),
    ...document.querySelectorAll('.about-skill-list article'),
    ...document.querySelectorAll('.closing > *')
  ];

  gsap.set(revealItems, { autoAlpha: 0, y: 28 });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      gsap.to(entry.target, {
        autoAlpha: 1,
        y: 0,
        duration: 0.78,
        ease: 'power3.out',
        overwrite: 'auto'
      });
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  revealItems.forEach((item) => observer.observe(item));
})();
