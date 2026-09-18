(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopPreference = window.matchMedia('(min-width: 851px)');
  let activeContext = null;
  let activePath = '';
  let activeDesktopState = desktopPreference.matches;
  let progressIndicator = null;
  let resizeTimer = null;

  const clearMotionStyles = 'transform,opacity,visibility';

  function mountMotionSystem(force = false) {
    if (!window.gsap || !window.ScrollTrigger || !document.body) return;

    const nextPath = window.location.pathname;
    const nextDesktopState = desktopPreference.matches;
    if (!force && activeContext && activePath === nextPath && activeDesktopState === nextDesktopState) return;

    if (activeContext) activeContext.revert();
    if (progressIndicator) progressIndicator.remove();

    activePath = nextPath;
    activeDesktopState = nextDesktopState;
    document.documentElement.classList.toggle('motion-reduced', motionPreference.matches);
    document.documentElement.classList.toggle('motion-enhanced', !motionPreference.matches);

    if (motionPreference.matches) {
      window.ScrollTrigger.getAll().forEach((trigger) => {
        if (String(trigger.vars.id || '').startsWith('portfolio-')) trigger.kill();
      });
      return;
    }

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ duration: 0.68, ease: 'power3.out' });

    activeContext = gsap.context(() => {
      const isDesktop = desktopPreference.matches;
      const enterStart = isDesktop ? 'top 82%' : 'top 88%';

      progressIndicator = document.createElement('div');
      progressIndicator.className = 'site-progress';
      progressIndicator.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progressIndicator);
      gsap.set(progressIndicator, { scaleX: 0, transformOrigin: 'left center' });
      gsap.to(progressIndicator, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          id: 'portfolio-page-progress',
          start: 0,
          end: 'max',
          scrub: 0.25,
        },
      });

      const heroItems = gsap.utils.toArray(
        '.case-title-grid > *, .page-hero > *, .about-hero-copy > *, .about-portrait'
      );
      if (heroItems.length) {
        gsap.from(heroItems, {
          autoAlpha: 0,
          y: 22,
          duration: 0.78,
          stagger: 0.075,
          ease: 'power3.out',
          clearProps: clearMotionStyles,
        });
      }

      gsap.utils
        .toArray('.section-heading, .about-section-heading, .case-section-intro, .coverflow-heading, .experience-heading')
        .forEach((heading, index) => {
          if (heading.closest('.about-practice') || heading.closest('.about-journey')) return;
          gsap.from(heading.children, {
            autoAlpha: 0,
            y: 20,
            duration: 0.62,
            stagger: 0.065,
            clearProps: clearMotionStyles,
            scrollTrigger: {
              id: `portfolio-heading-${index}`,
              trigger: heading,
              start: enterStart,
              once: true,
            },
          });
        });

      const journeyTrack = document.querySelector('.journey-track');
      if (journeyTrack) {
        const journeyHeading = document.querySelector('.about-journey .about-section-heading');
        const stops = gsap.utils.toArray('.journey-stop');
        gsap.set(journeyTrack, { '--journey-progress': 0 });

        const journeyTimeline = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            id: 'portfolio-journey',
            trigger: journeyTrack,
            start: isDesktop ? 'top 78%' : 'top 84%',
            once: true,
          },
        });

        if (journeyHeading) {
          journeyTimeline.from(journeyHeading.children, {
            autoAlpha: 0,
            y: 18,
            duration: 0.58,
            stagger: 0.06,
            clearProps: clearMotionStyles,
          });
        }

        journeyTimeline
          .to(
            journeyTrack,
            {
              '--journey-progress': 1,
              duration: isDesktop ? 1.05 : 1.35,
              ease: 'power2.inOut',
            },
            journeyHeading ? 0.2 : 0
          )
          .from(
            stops,
            {
              autoAlpha: 0,
              y: isDesktop ? 34 : 24,
              scale: 0.985,
              duration: 0.58,
              stagger: isDesktop ? 0.2 : 0.15,
              clearProps: clearMotionStyles,
            },
            journeyHeading ? 0.34 : 0.12
          );
      }

      const practice = document.querySelector('.about-practice');
      if (practice) {
        const photo = practice.querySelector('.about-practice-photo img');
        const photoLabel = practice.querySelector('.about-practice-photo span');
        const heading = practice.querySelector('.about-section-heading');
        const skillRows = gsap.utils.toArray('.about-skill-list article');

        const practiceTimeline = gsap.timeline({
          scrollTrigger: {
            id: 'portfolio-skills',
            trigger: practice,
            start: isDesktop ? 'top 72%' : 'top 84%',
            once: true,
          },
        });

        if (photo) {
          practiceTimeline.from(photo, {
            autoAlpha: 0,
            scale: 1.035,
            duration: 0.85,
            ease: 'power2.out',
            clearProps: clearMotionStyles,
          });
        }
        if (photoLabel) {
          practiceTimeline.from(
            photoLabel,
            {
              autoAlpha: 0,
              y: 10,
              duration: 0.45,
              clearProps: clearMotionStyles,
            },
            0.24
          );
        }
        if (heading) {
          practiceTimeline.from(
            heading.children,
            {
              autoAlpha: 0,
              y: 18,
              duration: 0.55,
              stagger: 0.055,
              clearProps: clearMotionStyles,
            },
            0.12
          );
        }
        if (skillRows.length) {
          practiceTimeline.from(
            skillRows,
            {
              autoAlpha: 0,
              y: 18,
              duration: 0.52,
              stagger: 0.095,
              ease: 'power2.out',
              clearProps: clearMotionStyles,
            },
            0.3
          );
        }
      }

      const revealGroups = [
        ['.project-grid', '.project-card'],
        ['.experience-grid', '.experience-card'],
        ['.education-cards', 'article'],
        ['.painting-wall', 'figure'],
        ['.impact-grid', 'article'],
        ['.problem-grid', 'article'],
        ['.mvp-timeline', '.mvp-card'],
        ['.impress-screen-wall', '.impress-screen-card'],
        ['.pagelens-process-figures', 'figure'],
      ];

      let groupIndex = 0;
      revealGroups.forEach(([containerSelector, itemSelector]) => {
        document.querySelectorAll(containerSelector).forEach((container) => {
          const items = gsap.utils.toArray(container.querySelectorAll(itemSelector));
          if (!items.length) return;
          groupIndex += 1;
          gsap.from(items, {
            autoAlpha: 0,
            y: isDesktop ? 30 : 22,
            scale: 0.992,
            duration: 0.66,
            stagger: isDesktop ? 0.1 : 0.075,
            clearProps: clearMotionStyles,
            scrollTrigger: {
              id: `portfolio-group-${groupIndex}`,
              trigger: container,
              start: enterStart,
              once: true,
            },
          });
        });
      });

      gsap.utils.toArray('.decision-block').forEach((block, index) => {
        const copy = block.querySelector('.decision-copy');
        const media = block.querySelector('.decision-media');
        const direction = index % 2 === 0 ? 1 : -1;

        const decisionTimeline = gsap.timeline({
          scrollTrigger: {
            id: `portfolio-decision-${index}`,
            trigger: block,
            start: isDesktop ? 'top 76%' : 'top 86%',
            once: true,
          },
        });

        if (copy) {
          decisionTimeline.from(copy, {
            autoAlpha: 0,
            x: isDesktop ? direction * -22 : 0,
            y: 20,
            duration: 0.72,
            clearProps: clearMotionStyles,
          });
        }
        if (media) {
          decisionTimeline.from(
            media,
            {
              autoAlpha: 0,
              duration: 0.52,
              clearProps: 'opacity,visibility',
            },
            copy ? '-=0.48' : 0
          );
        }
      });

      const heroVisual = document.querySelector(
        '.case-hero-media video, .bumble-hero-media .mobile-demo-phone, .impress-hero-media .mobile-demo-phone, .pagelens-hero-cover figure'
      );
      const caseHero = document.querySelector('.case-hero');
      if (heroVisual && caseHero) {
        heroVisual.classList.add('motion-screen');
        gsap.to(heroVisual, {
          y: isDesktop ? -18 : -8,
          ease: 'none',
          scrollTrigger: {
            id: 'portfolio-hero-screen',
            trigger: caseHero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.9,
          },
        });
      }

      const anchorLinks = gsap.utils.toArray('.case-anchor-nav a[href^="#"]');
      if (anchorLinks.length) {
        const activateLink = (activeLink) => {
          anchorLinks.forEach((link) => {
            const isCurrent = link === activeLink;
            link.classList.toggle('is-current', isCurrent);
            if (isCurrent) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        };

        const anchoredSections = anchorLinks
          .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
          .filter(({ section }) => section);

        anchoredSections.forEach(({ link, section }, index) => {
          const nextSection = anchoredSections[index + 1]?.section;
          ScrollTrigger.create({
            id: `portfolio-anchor-${index}`,
            trigger: section,
            start: 'top 48%',
            endTrigger: nextSection || section,
            end: nextSection ? 'top 48%' : 'bottom 48%',
            onToggle: (self) => {
              if (self.isActive) activateLink(link);
            },
          });
        });
      }

      gsap.utils.toArray('.reflection-section, .case-next, .closing').forEach((section, index) => {
        gsap.from(section.children, {
          autoAlpha: 0,
          y: 20,
          duration: 0.66,
          stagger: 0.075,
          clearProps: clearMotionStyles,
          scrollTrigger: {
            id: `portfolio-closing-${index}`,
            trigger: section,
            start: enterStart,
            once: true,
          },
        });
      });

      window.addEventListener(
        'load',
        () => {
          ScrollTrigger.refresh();
        },
        { once: true }
      );
    }, document.body);

    window.ScrollTrigger.refresh();
  }

  function scheduleResponsiveRemount() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (activeDesktopState !== desktopPreference.matches) mountMotionSystem(true);
    }, 220);
  }

  window.addEventListener('resize', scheduleResponsiveRemount, { passive: true });
  motionPreference.addEventListener('change', () => mountMotionSystem(true));
  window.addEventListener('pageshow', () => mountMotionSystem());
  window.addEventListener('popstate', () => window.setTimeout(() => mountMotionSystem(true), 0));

  const pageObserver = new MutationObserver(() => {
    if (window.location.pathname !== activePath) window.setTimeout(() => mountMotionSystem(true), 0);
  });
  pageObserver.observe(document.body, { childList: true, subtree: true });

  mountMotionSystem();
})();
