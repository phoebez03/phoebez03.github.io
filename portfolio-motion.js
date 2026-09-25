(() => {
  'use strict';

  if (window.location.pathname === '/projects' || window.location.pathname === '/projects/') {
    window.location.replace('/#projects');
    return;
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopPreference = window.matchMedia('(min-width: 851px)');
  let activeContext = null;
  let activePath = '';
  let activeDesktopState = desktopPreference.matches;
  let progressIndicator = null;
  let resizeTimer = null;

  const clearMotionStyles = 'transform,opacity,visibility';

  function setTextIfNeeded(element, text) {
    if (element && element.textContent.trim() !== text) element.textContent = text;
  }

  function prepareHeroKeywords(page, keywordText) {
    if (!page) return;
    const heading = page.querySelector('.case-title-grid h1');
    if (!heading) return;
    let keywords = page.querySelector('.case-kicker');
    if (!keywords) {
      keywords = document.createElement('p');
      heading.before(keywords);
    }
    if (
      keywords.dataset.preparedKeywords === keywordText &&
      keywords.classList.contains('case-hero-keywords')
    ) {
      return;
    }
    keywords.className = 'case-kicker case-hero-keywords';
    keywords.dataset.preparedKeywords = keywordText;
    keywords.setAttribute('aria-label', keywordText);
    keywords.replaceChildren(
      ...keywordText.split(' · ').map((keyword) => {
        const badge = document.createElement('span');
        badge.textContent = keyword;
        return badge;
      })
    );
  }

  function prepareCaseMeta(page, details) {
    const meta = page?.querySelector('.case-meta');
    if (!meta) return;
    const signature = details.map(({ label, value }) => `${label}:${value}`).join('|');
    if (meta.dataset.caseMeta === signature) return;

    const links = [...meta.children].filter((child) => child.matches('a'));
    const fields = details.map(({ label, value }) => {
      const field = document.createElement('div');
      const name = document.createElement('span');
      const content = document.createElement('strong');
      name.textContent = label;
      content.textContent = value;
      field.append(name, content);
      return field;
    });

    meta.dataset.caseMeta = signature;
    meta.replaceChildren(...fields, ...links);
  }

  function enableHorizontalDrag(container) {
    if (!container || container.dataset.horizontalDrag === 'true') return;
    container.dataset.horizontalDrag = 'true';

    let dragging = false;
    let startX = 0;
    let startLeft = 0;

    container.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
      startLeft = container.scrollLeft;
      container.classList.add('is-dragging');
      container.setPointerCapture(event.pointerId);
    });

    container.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      container.scrollLeft = startLeft - (event.clientX - startX);
    });

    const stopDragging = (event) => {
      if (!dragging) return;
      dragging = false;
      container.classList.remove('is-dragging');
      if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
    };

    container.addEventListener('pointerup', stopDragging);
    container.addEventListener('pointercancel', stopDragging);
  }

  function delayAutoplayVideos(root = document) {
    root.querySelectorAll('.case-page video[autoplay], .case-page video[data-autoplay-delay]').forEach((video) => {
      if (video.dataset.delayedAutoplay === 'true') return;
      video.dataset.delayedAutoplay = 'true';
      video.autoplay = false;
      video.removeAttribute('autoplay');
      video.pause();
      try {
        video.currentTime = 0;
      } catch (_) {
        // Metadata may not be available yet; playback will still start from the beginning.
      }

      // The lightweight local preview server does not support byte-range video
      // streaming. Autoplay would download the full movie and make localhost
      // appear frozen. Production hosting supports range requests, so the
      // requested five-second autoplay remains active on the live portfolio.
      if (/^(localhost|127\.0\.0\.1|::1)$/.test(window.location.hostname)) return;

      window.setTimeout(() => {
        if (!video.isConnected) return;
        video.muted = true;
        const playback = video.play();
        if (playback?.catch) playback.catch(() => {});
      }, 5000);
    });
  }

  function addHorizontalControls(track, options = {}) {
    if (!track || track.dataset.manualTrack === 'true') return;
    track.dataset.manualTrack = 'true';
    track.tabIndex = 0;
    track.setAttribute('aria-label', options.label || 'Project development stages');
    enableHorizontalDrag(track);

    const controls = document.createElement('div');
    controls.className = options.controlsClass || 'mvp-process-controls';

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '←';
    previous.setAttribute('aria-label', options.previousLabel || 'Show previous stage');

    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '→';
    next.setAttribute('aria-label', options.nextLabel || 'Show next stage');

    controls.append(previous, next);
    track.after(controls);

    const cardStep = () => {
      const firstCard = track.querySelector(options.itemSelector || '.mvp-card');
      if (!firstCard) return track.clientWidth;
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      return firstCard.getBoundingClientRect().width + gap;
    };

    const updateControls = () => {
      previous.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };

    const move = (direction) => {
      track.scrollBy({
        left: direction * cardStep(),
        behavior: motionPreference.matches ? 'auto' : 'smooth',
      });
    };

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', () => window.requestAnimationFrame(updateControls), { passive: true });
    track.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    window.addEventListener('resize', updateControls, { passive: true });
    updateControls();
  }

  function prepareDecisionReveals(page) {
    if (page.dataset.decisionReveals === 'true') return;
    const blocks = Array.from(page.querySelectorAll('.decision-block'));
    if (!blocks.length) return;
    page.dataset.decisionReveals = 'true';

    blocks.forEach((block) => block.classList.add('decision-scroll-reveal'));
    if (motionPreference.matches || !('IntersectionObserver' in window)) {
      blocks.forEach((block) => block.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );
    blocks.forEach((block) => observer.observe(block));
  }

  function prepareBumbleCaseStudy(page) {
    if (!page || page.dataset.bumbleRefined === 'true') return;
    page.dataset.bumbleRefined = 'true';
    page.classList.add('bumble-refined');

    prepareHeroKeywords(page, 'Cross-Platform App · UI Design · Micro-interactions');
    prepareCaseMeta(page, [
      { label: 'Role', value: 'UI/UX Designer' },
      { label: 'Timeline', value: 'Feb - Mar 2026' },
      { label: 'Tools', value: 'Figma · Figma Make' }
    ]);
    setTextIfNeeded(
      page.querySelector('.case-lead'),
      'Cross-platform feature design extending Bumble’s design system across iOS, Android, and Apple Watch.'
    );
    page.querySelector('.bumble-hero-media .mobile-demo-copy > p')?.remove();
    const impact = page.querySelector('.bumble-impact');
    const impactGrid = impact?.querySelector('.impact-grid');
    if (impactGrid) {
      const metrics = [
        ['3', 'Platforms', 'iOS · Android · Apple Watch'],
        ['10', 'User flows', '9 across iOS & Android + 1 Apple Watch flow'],
        ['5+', 'Interactive states', 'Prototyped interactions & micro-interactions'],
      ];
      impactGrid.replaceChildren(
        ...metrics.map(([value, label, detail]) => {
          const article = document.createElement('article');
          article.innerHTML = `<strong>${value}</strong><h3>${label}</h3><em>${detail}</em>`;
          return article;
        })
      );
    }

    const problemIntro = page.querySelector('.bumble-problem .case-section-intro');
    if (problemIntro) {
      Array.from(problemIntro.children).forEach((child) => {
        if (child.matches('p:not(.case-section-label)')) child.remove();
      });
      if (!problemIntro.querySelector('.bumble-match-visual')) {
        const visual = document.createElement('figure');
        visual.className = 'bumble-match-visual';
        visual.setAttribute('aria-label', '40 percent match but do not talk');
        visual.innerHTML =
          '<div class="bumble-donut" aria-hidden="true"><div><strong>40%</strong><span>match but<br>do not talk</span></div></div><figcaption>Conversation activation gap</figcaption>';
        problemIntro.appendChild(visual);

        if (motionPreference.matches || !('IntersectionObserver' in window)) {
          visual.classList.add('is-visible');
        } else {
          const observer = new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              visual.classList.add('is-visible');
              observer.disconnect();
            },
            { threshold: 0.4 }
          );
          observer.observe(visual);
        }
      }
    }

    const processSection = page.querySelector('.process-section');
    const processTrack = processSection?.querySelector('.mvp-timeline');
    const platformSystem = processSection?.querySelector('.bumble-platform-system');
    const processIntro = processSection?.querySelector('.case-section-intro');
    Array.from(processIntro?.children || []).forEach((child) => {
      if (child.matches('p:not(.case-section-label)')) child.remove();
    });
    if (processTrack && !processTrack.querySelector('[data-bumble-stage="04"]')) {
      const stageFour = document.createElement('article');
      stageFour.className = 'mvp-card';
      stageFour.tabIndex = 0;
      stageFour.dataset.bumbleStage = '04';
      stageFour.innerHTML =
        '<span class="mvp-number">Stage 04</span><h3>Cross-Platform Design</h3><p class="mvp-keywords">Native patterns · iOS · Android</p><p class="mvp-detail">I expanded the feature into multiple user flows for both male and female users, adapting the experience to iOS and Android conventions while maintaining a consistent design system.</p>';
      processTrack.appendChild(stageFour);
    }
    platformSystem?.remove();

    const processCards = Array.from(processTrack?.querySelectorAll('.mvp-card') || []);
    setTextIfNeeded(processCards[1]?.querySelector('h3'), 'Prototyping and extending the design system');
    setTextIfNeeded(
      processCards[1]?.querySelector('.mvp-keywords'),
      'Design system · Mid-fi prototyping · Cross-platform exploration'
    );
    setTextIfNeeded(
      processCards[1]?.querySelector('.mvp-detail'),
      'I developed mid-fidelity prototypes, extending Bumble’s existing design system with reusable components. I also explored desktop and Apple Watch interfaces, considering how the feature could adapt across different screen sizes and interaction patterns.'
    );
    setTextIfNeeded(processCards[2]?.querySelector('h3'), 'High-Fidelity UI & Micro-interactions');
    setTextIfNeeded(
      processCards[2]?.querySelector('.mvp-keywords'),
      'High fidelity · Micro-interactions · Motion design'
    );
    setTextIfNeeded(
      processCards[2]?.querySelector('.mvp-detail'),
      'I refined the mobile interface into high-fidelity designs, focusing on visual polish and key micro-interactions to make the experience intuitive and engaging.'
    );
    setTextIfNeeded(processCards[3]?.querySelector('h3'), 'Cross-Platform Design');
    setTextIfNeeded(
      processCards[3]?.querySelector('.mvp-detail'),
      'I expanded the feature into multiple user flows for both male and female users, adapting the experience to iOS and Android conventions while maintaining a consistent design system.'
    );

    const processImages = [
      ['/projects/bumble-skill-snack/process/stage-01.png', 'Early research, user flows, and concept exploration for Skill Snack'],
      [
        '/projects/bumble-skill-snack/process/stage-02.png',
        'Detailed cross-platform product flows for Skill Snack',
        '/projects/bumble-skill-snack/process/stage-02-design-system.png',
        'Bumble design-system patterns used across the feature',
      ],
      [
        '/projects/bumble-skill-snack/process/stage-03.png',
        'High-fidelity Skill Snack screens across iOS, Android, and Apple Watch',
        '/projects/bumble-skill-snack/process/stage-03-micro-interaction.mp4',
        'Skill Snack micro-interaction prototype',
      ],
      ['/projects/bumble-skill-snack/process/stage-04.png?v=2', 'Skill verification translated across native Android and iOS photo-selection patterns'],
    ];

    processTrack?.querySelectorAll('.mvp-card').forEach((card, index) => {
      if (card.dataset.stageEnhanced === 'true') return;
      card.dataset.stageEnhanced = 'true';
      const copy = document.createElement('div');
      copy.className = 'bumble-stage-copy';
      Array.from(card.childNodes).forEach((node) => copy.appendChild(node));

      const visual = document.createElement('div');
      visual.className = 'bumble-stage-visual';
      const assets = processImages[index] || [];
      const usesAccordion = assets.length > 2;
      for (let assetIndex = 0; assetIndex < assets.length; assetIndex += 2) {
        const frame = document.createElement('figure');
        frame.className = 'bumble-stage-frame';
        const assetUrl = assets[assetIndex];
        const assetLabel = assets[assetIndex + 1];
        const isVideo = /\.(?:mp4|mov)(?:\?|$)/i.test(assetUrl);
        if (isVideo) {
          const video = document.createElement('video');
          video.controls = true;
          video.muted = true;
          video.playsInline = true;
          video.preload = 'metadata';
          video.poster = '/projects/bumble-skill-snack/process/stage-03-micro-interaction-poster.jpg';
          video.setAttribute('aria-label', assetLabel);
          const source = document.createElement('source');
          source.src = assetUrl;
          source.type = 'video/mp4';
          video.appendChild(source);
          frame.appendChild(video);
        } else {
          const image = document.createElement('img');
          image.src = assetUrl;
          image.alt = assetLabel;
          image.loading = index === 0 ? 'eager' : 'lazy';
          frame.appendChild(image);
        }

        if (usesAccordion) {
          const number = document.createElement('button');
          number.type = 'button';
          number.className = 'bumble-stage-frame-number';
          number.textContent = String(assetIndex / 2 + 1).padStart(2, '0');
          number.setAttribute('aria-expanded', 'false');
          number.setAttribute('aria-label', `Expand Stage ${String(index + 1).padStart(2, '0')} image ${assetIndex / 2 + 1}`);
          frame.appendChild(number);
          const toggleFrame = () => {
            const shouldExpand = !frame.classList.contains('is-expanded');
            visual.querySelectorAll('.bumble-stage-frame').forEach((item) => {
              item.classList.remove('is-expanded');
              item.querySelector('.bumble-stage-frame-number')?.setAttribute('aria-expanded', 'false');
            });
            visual.classList.toggle('has-expanded', shouldExpand);
            if (shouldExpand) {
              frame.classList.add('is-expanded');
              number.setAttribute('aria-expanded', 'true');
            }
          };
          number.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleFrame();
          });
          frame.addEventListener('click', (event) => {
            if (event.target.closest('video, button')) return;
            toggleFrame();
          });
        }
        visual.appendChild(frame);
      }
      if (usesAccordion) visual.classList.add('is-accordion');
      card.append(copy, visual);
    });

    addHorizontalControls(processTrack, {
      label: 'Bumble product development stages',
      previousLabel: 'Show previous stage',
      nextLabel: 'Show next stage',
    });

    const concept = page.querySelector('.product-story');
    if (concept && processSection) {
      concept.classList.add('bumble-concept-moved', 'bumble-solution');
      concept.querySelector('.case-section-label')?.remove();
      concept.querySelector('.bumble-capability-grid')?.remove();
      processSection.after(concept);
    }

    page.querySelector('.bumble-closer-look')?.remove();
    if (concept && !concept.querySelector('.bumble-solution-layout')) {
      const intro = concept.querySelector('.case-section-intro');
      const heading = intro?.querySelector('h2');
      const paragraph = intro?.querySelector('p');
      setTextIfNeeded(heading, 'A closer look');

      const layout = document.createElement('div');
      layout.className = 'bumble-solution-layout';
      const frame = document.createElement('figure');
      frame.className = 'bumble-solution-video';
      const video = document.createElement('video');
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.poster = '/projects/bumble-skill-snack/media/decision-01-poster.jpg';
      const source = document.createElement('source');
      source.src = '/projects/bumble-skill-snack/media/decision-01.mp4';
      source.type = 'video/mp4';
      video.appendChild(source);
      frame.appendChild(video);

      const copy = document.createElement('div');
      copy.className = 'bumble-solution-copy';
      if (paragraph) copy.appendChild(paragraph);
      layout.append(frame, copy);
      intro?.after(layout);
    }

    const decisionBlocks = Array.from(page.querySelectorAll('.decision-block'));
    decisionBlocks.forEach((block) => {
      Array.from(block.querySelectorAll('.decision-media > span')).forEach((label) => {
        if (label.textContent.trim().toLowerCase() === 'interaction walkthrough') label.remove();
      });
    });

    const decisionOneMedia = decisionBlocks[0]?.querySelector('.decision-media');
    const decisionOneVideo = decisionOneMedia?.querySelector('video');
    if (decisionOneMedia && decisionOneVideo) {
      const flow = document.createElement('figure');
      flow.className = 'decision-media-frame bumble-user-flow-frame';
      const image = document.createElement('img');
      image.src = '/projects/bumble-skill-snack/decision-01-user-flow.png';
      image.alt = 'End-to-end Skill Snack user flow from onboarding through matching and conversation';
      image.loading = 'lazy';
      flow.appendChild(image);
      decisionOneVideo.replaceWith(flow);
      decisionOneMedia.classList.add('has-user-flow');
    }

    setTextIfNeeded(decisionBlocks[1]?.querySelector('.decision-media > strong'), 'Apple Watch Demo');

    prepareDecisionReveals(page);
  }

  function prepareImpressCaseStudy(page) {
    if (!page || page.dataset.impressRefined === 'true') return;
    page.dataset.impressRefined = 'true';
    page.classList.add('impress-refined');

    prepareHeroKeywords(page, 'Mobile App · Interaction Design · Instructional Design');
    prepareCaseMeta(page, [
      { label: 'Role', value: 'UX & Instructional Designer' },
      { label: 'Timeline', value: 'Mar - Jul 2026' },
      { label: 'Tools', value: 'Figma · Figma Make' }
    ]);
    setTextIfNeeded(
      page.querySelector('.case-lead'),
      'Learning art through conversation, not consumption — a mobile app design'
    );
    const teamValue = Array.from(page.querySelectorAll('.case-meta > div')).find(
      (item) => item.querySelector('span')?.textContent.trim().toLowerCase() === 'team'
    )?.querySelector('strong');
    setTextIfNeeded(teamValue, '3 people — PM, Developer, UX Designer');
    page.querySelector('.impress-hero-media .mobile-demo-copy > p')?.remove();

    const highlights = page.querySelector('.product-story');
    const highlightIntro = highlights?.querySelector('.case-section-intro');
    if (highlights) highlights.classList.add('impress-highlights');
    highlightIntro?.querySelector('.case-section-label')?.remove();
    setTextIfNeeded(highlightIntro?.querySelector('h2'), 'Get the highlights');
    Array.from(highlightIntro?.querySelectorAll('p') || []).forEach((paragraph) => paragraph.remove());

    const screenWall = highlights?.querySelector('.impress-screen-wall');
    if (screenWall && !highlights.querySelector('.impress-highlight-carousel')) {
      const carousel = document.createElement('div');
      carousel.className = 'impress-highlight-carousel';
      screenWall.classList.add('impress-highlight-track');
      screenWall.setAttribute('role', 'list');
      screenWall.querySelectorAll('.impress-screen-card').forEach((card) => {
        card.setAttribute('role', 'listitem');
      });
      screenWall.before(carousel);
      carousel.appendChild(screenWall);
      addHorizontalControls(screenWall, {
        label: 'ImpressChat product highlights',
        itemSelector: '.impress-screen-card',
        controlsClass: 'impress-highlight-controls',
        previousLabel: 'Show previous ImpressChat screen',
        nextLabel: 'Show next ImpressChat screen',
      });
    }

    const impact = page.querySelector('.impress-impact');
    if (highlights && impact) highlights.after(impact);

    const problemSection = page.querySelector('.impress-problem');
    const problemIntro = problemSection?.querySelector('.case-section-intro');
    if (problemIntro) {
      const problemHeading = problemIntro.querySelector('h2');
      if (problemHeading) {
        problemHeading.innerHTML = '<span>Two learning loops.</span> <em>Two different outcomes.</em>';
      }
      Array.from(problemIntro.querySelectorAll('p:not(.case-section-label)')).forEach((paragraph) => paragraph.remove());
    }
    const problemGrid = problemSection?.querySelector('.problem-grid');
    if (problemGrid && !problemSection.querySelector('.impress-learning-loops')) {
      const loops = document.createElement('div');
      loops.className = 'impress-learning-loops';
      loops.setAttribute('aria-label', 'Comparison of passive art learning and the ImpressChat learning loop');
      const loopSpecs = [
        {
          className: 'is-passive',
          title: 'Past art learning',
          mode: 'Passive loop',
          steps: [
            ['Read', 'Consume text'],
            ['Watch', 'Consume video'],
            ['Repeat', 'Same pattern'],
          ],
          caption: 'Information repeats. Reasoning does not.',
        },
        {
          className: 'is-active',
          title: 'ImpressChat',
          mode: 'Active learning loop',
          steps: [
            ['Predict', 'Form an idea'],
            ['Observe', 'Look closely'],
            ['Explain', 'Use evidence'],
            ['Structured chat', 'Scaffold interaction'],
            ['Feedback', 'Refine thinking'],
          ],
          caption: 'Each cycle scaffolds the next response.',
        },
      ];

      loopSpecs.forEach((spec) => {
        const loop = document.createElement('article');
        loop.className = `impress-learning-loop ${spec.className}`;
        const header = document.createElement('header');
        header.className = 'impress-loop-header';
        header.innerHTML = `<h3>${spec.title}</h3><span>${spec.mode}</span>`;
        const flow = document.createElement('div');
        flow.className = 'impress-loop-flow';
        spec.steps.forEach(([title, detail], index) => {
          const step = document.createElement('div');
          step.className = 'impress-loop-step';
          step.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${title}</strong><small>${detail}</small>`;
          flow.appendChild(step);
          if (index < spec.steps.length - 1) {
            const arrow = document.createElement('i');
            arrow.textContent = '→';
            arrow.setAttribute('aria-hidden', 'true');
            flow.appendChild(arrow);
          }
        });
        const caption = document.createElement('p');
        caption.className = 'impress-loop-caption';
        caption.textContent = spec.caption;
        loop.append(header, flow, caption);
        loops.appendChild(loop);
      });
      problemGrid.replaceWith(loops);
    }

    const processSection = page.querySelector('.impress-process');
    const processTrack = processSection?.querySelector('.mvp-timeline');
    Array.from(processSection?.querySelectorAll('.case-section-intro > p:not(.case-section-label)') || []).forEach(
      (paragraph) => paragraph.remove()
    );
    const processCards = Array.from(processTrack?.querySelectorAll('.mvp-card') || []);
    if (processTrack && processCards.length === 5) {
      const first = processCards[0];
      setTextIfNeeded(first.querySelector('.mvp-number'), 'Stage 01');
      setTextIfNeeded(first.querySelector('h3'), 'Backward Design & Learning Objectives');
      setTextIfNeeded(first.querySelector('.mvp-keywords'), 'Learning science · Outcomes · Curriculum · Scaffolding');
      setTextIfNeeded(
        first.querySelector('.mvp-detail'),
        'I defined the observation, interpretation, and evidence-based reasoning learners should develop, then translated those outcomes into foundation checks, terminology support, visual comparison, and application.'
      );
      processCards[1].remove();

      Array.from(processTrack.querySelectorAll('.mvp-card')).forEach((card, index) => {
        setTextIfNeeded(card.querySelector('.mvp-number'), `Stage ${String(index + 1).padStart(2, '0')}`);
      });
    }

    const refinedProcessCards = Array.from(processTrack?.querySelectorAll('.mvp-card') || []);
    const stageAssets = [
      [
        '/projects/impresschat/process/stage-01-learning-objectives.png',
        'Learning objectives mapped to course modules and assessment activities',
      ],
      [
        '/projects/impresschat/process/stage-02-prototype.png',
        'Low-fidelity ImpressChat conversation and course-flow prototype',
      ],
      [
        '/projects/impresschat/process/stage-03-testing.png',
        'Course-flow testing map showing learner confusion and early termination points',
      ],
      [
        '/projects/impresschat/process/stage-04-presentation.jpg',
        'ImpressChat team presenting the research poster',
      ],
    ];
    refinedProcessCards.forEach((card, index) => {
      if (card.dataset.impressStageEnhanced === 'true') return;
      card.dataset.impressStageEnhanced = 'true';
      const copy = document.createElement('div');
      copy.className = 'impress-stage-copy';
      Array.from(card.childNodes).forEach((node) => copy.appendChild(node));
      const visual = document.createElement('figure');
      visual.className = 'impress-stage-visual';
      const image = document.createElement('img');
      image.src = stageAssets[index]?.[0] || '';
      image.alt = stageAssets[index]?.[1] || '';
      image.loading = index === 0 ? 'eager' : 'lazy';
      visual.appendChild(image);
      card.append(copy, visual);
    });
    addHorizontalControls(processTrack, {
      label: 'ImpressChat design process stages',
      previousLabel: 'Show previous design stage',
      nextLabel: 'Show next design stage',
    });

    const sourceDemo = highlights?.querySelector('.impress-full-demo');
    const decisionsSection = page.querySelector('.impress-decisions');
    if (sourceDemo && processSection && decisionsSection && !page.querySelector('.impress-walkthrough')) {
      const video = sourceDemo.querySelector('video');
      const walkthrough = document.createElement('section');
      walkthrough.className = 'case-section impress-walkthrough';
      walkthrough.setAttribute('aria-labelledby', 'impress-walkthrough-heading');

      const intro = document.createElement('div');
      intro.className = 'case-section-intro';
      intro.innerHTML = '<h2 id="impress-walkthrough-heading">Complete product walkthrough</h2>';

      const layout = document.createElement('div');
      layout.className = 'impress-walkthrough-layout';
      const media = document.createElement('figure');
      media.className = 'impress-walkthrough-video';
      if (video) media.appendChild(video);
      const description = document.createElement('p');
      description.className = 'impress-walkthrough-copy';
      description.textContent =
        'ImpressChat, a mobile application that supports interactive, assessment-backed learning of Impressionist art for adult learners. The system guides learners through a pretest, three chat-based instructional modules, and a posttest.';
      layout.append(media, description);
      walkthrough.append(intro, layout);
      processSection.after(walkthrough);
      sourceDemo.remove();
    }

    prepareDecisionReveals(page);
  }

  function preparePageLensCaseStudy(page) {
    if (!page || page.dataset.pagelensRefined === 'true') return;
    page.dataset.pagelensRefined = 'true';
    page.classList.add('pagelens-refined');

    prepareHeroKeywords(page, 'Physical + Digital · Accessibility Design · UX Research');
    prepareCaseMeta(page, [
      { label: 'Role', value: 'UX Designer & Researcher' },
      { label: 'Timeline', value: 'March - May 2026' },
      { label: 'Tools', value: 'Figma' }
    ]);
    setTextIfNeeded(
      page.querySelector('.case-lead'),
      'Reimagining physical reading through inclusive design and AI-powered AR.'
    );
    page.querySelector('.pagelens-hero-copy > p')?.remove();
    Array.from(page.querySelectorAll('.pagelens-product .case-section-intro > p:not(.case-section-label)')).forEach(
      (paragraph) => paragraph.remove()
    );

    const impact = page.querySelector('.pagelens-impact');
    const impactHeading = impact?.querySelector('#pagelens-impact-heading');
    setTextIfNeeded(impactHeading, 'The Impact');
    impact?.querySelector('.case-section-label')?.remove();
    const impactGrid = impact?.querySelector('.impact-grid');
    if (impactGrid) {
      const outcomes = [
        ['4', 'Reading Features', 'Inclusive interactions'],
        ['3', 'Technologies', 'AR · OCR · GenAI'],
        ['1', 'Integrated Concept', 'Research to hardware specs'],
      ];
      impactGrid.replaceChildren(
        ...outcomes.map(([number, title, detail]) => {
          const article = document.createElement('article');
          article.innerHTML = `<strong>${number}</strong><h3>${title}</h3><p>${detail}</p>`;
          return article;
        })
      );
    }

    const problemSection = page.querySelector('.pagelens-problem');
    problemSection?.querySelector('.pagelens-hmw')?.remove();
    const problemGrid = problemSection?.querySelector('.problem-grid');
    if (problemGrid && !problemSection.querySelector('.pagelens-reading-visual')) {
      const visual = document.createElement('div');
      visual.className = 'pagelens-reading-visual';
      visual.setAttribute('aria-label', 'Illustrated reading difficulties and their impact');

      const book = document.createElement('figure');
      book.className = 'pagelens-reading-book';
      book.innerHTML = `
        <div class="pagelens-reading-samples">
          <div class="pagelens-reading-sample" data-sample="dense">
            <img src="/projects/pagelens/problem/dyslexia-reading-01.png" alt="Illustrative simulation of dense, crowded printed text" loading="lazy">
          </div>
          <div class="pagelens-reading-sample" data-sample="unstable">
            <img src="/projects/pagelens/problem/dyslexia-reading-02.png" alt="Illustrative simulation of distorted and unstable letterforms" loading="lazy">
          </div>
        </div>
        <figcaption>Illustrative simulations only — dyslexia varies from person to person.</figcaption>
      `;

      const callouts = [
        ['01', 'Crowded letterforms', 'Dense print can make characters difficult to separate.', 'dense', 'top-left'],
        ['02', 'Unstable word shapes', 'Some readers describe letters or words as shifting or distorted.', 'unstable', 'top-right'],
        ['03', 'Harder line tracking', 'Closely packed lines make it easier to lose a place.', 'dense', 'bottom-left'],
        ['04', 'High reading effort', 'Fixed text forces the reader to adapt instead of the page.', 'unstable', 'bottom-right'],
      ];

      visual.appendChild(book);
      callouts.forEach(([number, title, description, sample, position], index) => {
        const callout = document.createElement('article');
        callout.className = `pagelens-reading-callout is-${position}`;
        callout.tabIndex = 0;
        callout.dataset.sampleTarget = sample;
        callout.style.setProperty('--callout-delay', `${180 + index * 130}ms`);
        callout.innerHTML = `<span>${number}</span><strong>${title}</strong><p>${description}</p>`;
        visual.appendChild(callout);

        const samplePanel = book.querySelector(`[data-sample="${sample}"]`);
        const emphasize = () => samplePanel?.classList.add('is-emphasized');
        const reset = () => samplePanel?.classList.remove('is-emphasized');
        callout.addEventListener('mouseenter', emphasize);
        callout.addEventListener('mouseleave', reset);
        callout.addEventListener('focus', emphasize);
        callout.addEventListener('blur', reset);
      });

      problemGrid.replaceWith(visual);

      const reveal = () => visual.classList.add('is-visible');
      if ('IntersectionObserver' in window && !motionPreference.matches) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            reveal();
            observer.disconnect();
          },
          { threshold: 0.22, rootMargin: '0px 0px -8% 0px' }
        );
        observer.observe(visual);
      } else {
        reveal();
      }
    }

    const processSection = page.querySelector('.pagelens-process');
    const processTrack = processSection?.querySelector('.pagelens-timeline');
    const processCards = Array.from(processTrack?.querySelectorAll('.mvp-card') || []);
    const stageAssets = [
      [
        '/projects/pagelens/process/stage-01-research.png',
        'Library field research and reading-context exploration for PageLens',
      ],
      [
        '/projects/pagelens/process/stage-02-hardware.png',
        'Annotated PageLens hardware prototype with camera, tablet, book cradle, and headphones',
      ],
      [
        '/projects/pagelens/process/stage-03-user-flow.png',
        'PageLens user flow from approaching the reading station through session reset',
      ],
      [
        '/projects/pagelens/process/stage-04-system-diagram.png',
        'PageLens system diagram connecting sensing, hardware, interaction, actuation, and intelligence layers',
      ],
      [
        '/projects/pagelens/process/stage-05-failure-handling.png',
        'Responsible-design framework for technical failure, user mistakes, environmental challenges, and graceful handling',
      ],
    ];

    processCards.forEach((card, index) => {
      if (card.dataset.pagelensStageEnhanced === 'true') return;
      card.dataset.pagelensStageEnhanced = 'true';

      const copy = document.createElement('div');
      copy.className = 'pagelens-stage-copy';
      Array.from(card.childNodes).forEach((node) => copy.appendChild(node));

      const visual = document.createElement('figure');
      visual.className = 'pagelens-stage-visual';
      const image = document.createElement('img');
      image.src = stageAssets[index]?.[0] || '';
      image.alt = stageAssets[index]?.[1] || '';
      image.loading = index === 0 ? 'eager' : 'lazy';
      visual.appendChild(image);
      card.append(copy, visual);
    });

    if (processTrack) {
      addHorizontalControls(processTrack, {
        label: 'PageLens design process stages',
        previousLabel: 'Show previous PageLens stage',
        nextLabel: 'Show next PageLens stage',
      });
    }

    processSection?.querySelector('.pagelens-process-figures')?.remove();

    prepareDecisionReveals(page);
  }

  function prepareCaseStudyContent() {
    delayAutoplayVideos();

    document.querySelectorAll('.case-breadcrumb > span').forEach((counter) => {
      if (/^\d{1,2}\s*\/\s*\d{1,2}$/.test(counter.textContent.trim())) counter.remove();
    });

    const sharedCasePage = document.querySelector(
      '.case-page.bumble-case, .case-page.impress-case, .case-page.pagelens-case'
    );
    if (sharedCasePage) {
      sharedCasePage.querySelectorAll('.mvp-timeline').forEach((track) => {
        track.setAttribute('aria-label', 'Project development stages');
        enableHorizontalDrag(track);
      });
    }

    const bumblePage = document.querySelector('.case-page.bumble-case');
    if (bumblePage) prepareBumbleCaseStudy(bumblePage);

    const impressPage = document.querySelector('.case-page.impress-case');
    if (impressPage) prepareImpressCaseStudy(impressPage);

    const pagelensPage = document.querySelector('.case-page.pagelens-case');
    if (pagelensPage) preparePageLensCaseStudy(pagelensPage);

    document.querySelectorAll('.decisions-section .case-section-label').forEach((label) => {
      if (label.textContent.trim().toLowerCase() === 'key design decisions') {
        setTextIfNeeded(label, 'Design Decisions');
      }
    });

    if (!window.location.pathname.startsWith('/projects/kb-tutor')) return;

    const page = document.querySelector('.case-page');
    if (!page) return;
    page.classList.add('kb-tutor-refined');

    prepareHeroKeywords(page, 'Web App · 0->1 Product Design · UX Research');
    prepareCaseMeta(page, [
      { label: 'Role', value: 'Lead Product Designer' },
      { label: 'Timeline', value: 'Jan–Jul 2026' },
      { label: 'Tools', value: 'Figma · Claude Code, Cursor' }
    ]);
    setTextIfNeeded(
      page.querySelector('.case-lead'),
      '0→1 end-to-end product design for a web-based biology learning platform.'
    );

    const productDemo = page.querySelector('.case-meta > a');
    if (productDemo) {
      setTextIfNeeded(productDemo, 'Visit product website ↗');
      productDemo.setAttribute('aria-label', 'Visit the KB Tutor product website');
    }

    const browserChrome = page.querySelector('.case-browser-chrome');
    browserChrome?.querySelectorAll('span').forEach((label) => {
      const text = label.textContent.toLowerCase();
      if (text.includes('student practice') || text.includes('product walkthrough')) label.remove();
    });
    if (browserChrome && !browserChrome.textContent.trim()) {
      browserChrome.closest('.case-hero-media')?.classList.add('kb-media-clean');
      browserChrome.remove();
    }
    page.querySelectorAll('.case-hero-media .media-status').forEach((label) => label.remove());

    const productSection = page.querySelector('.product-story');
    if (productSection) {
      productSection.classList.add('kb-highlights');
      setTextIfNeeded(productSection.querySelector('#product-heading'), 'Get the highlights');

      const showcase = productSection.querySelector('.product-showcase');
      if (showcase && !productSection.querySelector('.kb-highlight-carousel')) {
        showcase.classList.add('kb-showcase-source');

        const images = Array.from(showcase.querySelectorAll('.showcase-slide img'));
        const labels = Array.from(showcase.querySelectorAll('.showcase-tabs button')).map((button) =>
          button.textContent.replace(/^\d+\s*/, '').trim()
        );

        const carousel = document.createElement('div');
        carousel.className = 'kb-highlight-carousel';
        carousel.setAttribute('aria-label', 'KB Tutor product highlights');

        const track = document.createElement('div');
        track.className = 'kb-highlight-track';
        track.tabIndex = 0;
        track.setAttribute('role', 'list');

        images.forEach((sourceImage, index) => {
          const card = document.createElement('article');
          card.className = 'kb-highlight-card';
          card.setAttribute('role', 'listitem');

          const title = document.createElement('h3');
          title.textContent = labels[index] || sourceImage.alt || `Product highlight ${index + 1}`;

          const image = sourceImage.cloneNode(true);
          image.removeAttribute('style');
          image.loading = index < 2 ? 'eager' : 'lazy';
          image.alt = labels[index] || sourceImage.alt || '';

          card.append(title, image);
          track.appendChild(card);
        });

        const controls = document.createElement('div');
        controls.className = 'kb-highlight-controls';

        const previous = document.createElement('button');
        previous.type = 'button';
        previous.textContent = '←';
        previous.setAttribute('aria-label', 'Show previous highlights');

        const next = document.createElement('button');
        next.type = 'button';
        next.textContent = '→';
        next.setAttribute('aria-label', 'Show next highlights');

        controls.append(previous, next);
        carousel.append(track, controls);
        showcase.after(carousel);

        const cardStep = () => {
          const firstCard = track.querySelector('.kb-highlight-card');
          if (!firstCard) return track.clientWidth;
          const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
          return firstCard.getBoundingClientRect().width + gap;
        };

        const updateControls = () => {
          previous.disabled = track.scrollLeft <= 4;
          next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        };

        const move = (direction) => {
          track.scrollBy({
            left: direction * cardStep(),
            behavior: motionPreference.matches ? 'auto' : 'smooth',
          });
        };

        previous.addEventListener('click', () => move(-1));
        next.addEventListener('click', () => move(1));
        track.addEventListener('scroll', () => window.requestAnimationFrame(updateControls), { passive: true });
        track.addEventListener('keydown', (event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        });
        enableHorizontalDrag(track);
        window.addEventListener('resize', updateControls, { passive: true });
        updateControls();
      }
    }

    const impactHeading = page.querySelector('#impact-heading');
    setTextIfNeeded(impactHeading, 'The impact');
    const impactLabel = impactHeading?.closest('.impact-band')?.querySelector('.case-section-label');
    if (impactLabel?.textContent.trim().toLowerCase() === 'the impact') impactLabel.remove();

    const problemIntro = page.querySelector('.problem-section .case-section-intro');
    if (problemIntro && !problemIntro.querySelector('.kb-proficiency-visual')) {
      const visual = document.createElement('figure');
      visual.className = 'kb-proficiency-visual';
      visual.setAttribute('aria-label', '50.6 percent of students scored below proficiency');
      visual.innerHTML =
        '<div class="kb-donut" aria-hidden="true"><div><strong>50.6%</strong><span>below proficiency</span></div></div><figcaption>Keystone Biology benchmark</figcaption>';
      problemIntro.appendChild(visual);

      const revealDonut = () => visual.classList.add('is-visible');
      if ('IntersectionObserver' in window && !motionPreference.matches) {
        const donutObserver = new IntersectionObserver(
          (entries, observer) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            revealDonut();
            observer.disconnect();
          },
          { threshold: 0.45 }
        );
        donutObserver.observe(visual);
      } else {
        revealDonut();
      }
    }

    const mvpOneDefaultDescription =
      'As Designer & PM, I focused on understanding the problem before designing the interface. I mapped student needs and technical constraints, translated research into product features, and moved from early flows and wireframes to medium-fidelity prototypes for testing.';

    const processAssets = [
      [
        [
          '/projects/kb-tutor/process/mvp-01-research-map.png',
          'Research notes mapping how students reason through biology questions',
          'Understand How Students Think',
          'We used Cognitive Task Analysis and think-alouds with students and teachers to uncover where reasoning broke down. Mapping novice and expert task flows revealed three challenges: task-type confusion, weak backward reasoning, and missing decision rules.',
        ],
        [
          '/projects/kb-tutor/process/mvp-01-overview-v2.png',
          'Low-fidelity wireframes exploring the KB Tutor experience',
          'Shape the Experience',
          'I used low-fidelity wireframes to explore layout, hierarchy, and user flow before investing in visual design.',
        ],
        [
          '/projects/kb-tutor/process/mvp-01-ai-prototype.png',
          'Medium-fidelity KB Tutor interaction prototype',
          'AI prototype the interaction, not the polish',
          'I used Figma Make to quickly explore interactions and bring the structure to medium fidelity. AI accelerated prototyping, but often generated unnecessary content, reinforcing that more UI isn’t better UI. I used AI to test interaction ideas, not make design decisions for me.',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/mvp-02-dashboard-notes.png',
          'Teacher dashboard design exploration',
          'Teacher dashboard exploration',
        ],
        [
          '/projects/kb-tutor/process/mvp-02-color-tokens.png',
          'KB Tutor color-token documentation',
          'Reusable color system',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/mvp-03-metrics.png',
          'Evaluation framework showing the classroom metrics and how each one is measured',
          'Evaluation framework',
        ],
        [
          '/projects/kb-tutor/process/mvp-03-participation.png',
          'Student participation across practice, exam, and review modes',
          'Participation across modes',
        ],
        [
          '/projects/kb-tutor/process/mvp-03-outcomes.png',
          'Student answer outcomes showing corrected responses after scaffolded feedback',
          'Scaffolding outcomes',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/mvp-04-saq-flow.png',
          'End-to-end short-answer practice, exam, and review flow map',
          'Short-answer experience flow',
        ],
        [
          '/projects/kb-tutor/process/mvp-04-notes.png',
          'Short-answer practice interface with a highlighted prompt and staged responses',
          'Short-answer practice',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/mvp-05-presentation.jpg',
          'Presenting the deployed KB Tutor product in a classroom',
          'Classroom deployment',
        ],
      ],
    ];

    const mvpCards = Array.from(page.querySelectorAll('.mvp-card'));
    mvpCards.forEach((card, index) => {
      if (index === 4 || card.querySelector('.mvp-number')?.textContent.includes('05')) {
        setTextIfNeeded(card.querySelector('h3'), 'Deployment');
      }

      if (card.dataset.processEnhanced === 'true') return;
      card.dataset.processEnhanced = 'true';

      if (index === 0) {
        setTextIfNeeded(card.querySelector('h3'), 'From problem space to product direction');
        setTextIfNeeded(card.querySelector('.mvp-keywords'), 'Research, Feature exploration, Prototyping');
        setTextIfNeeded(card.querySelector('.mvp-detail'), mvpOneDefaultDescription);
      }

      if (index === 1) {
        const mvpTwoDetail = card.querySelector('.mvp-detail');
        if (mvpTwoDetail) {
          const mvpTwoDescription =
            'As the product scaled, I shifted from individual screens to the system around them. I designed Teacher Dashboard v1, creating reusable UI patterns, and testing the student experience to guide iteration.';
          if (mvpTwoDetail.querySelector('strong') || mvpTwoDetail.textContent.trim() !== mvpTwoDescription) {
            mvpTwoDetail.textContent = mvpTwoDescription;
          }
        }
      }

      const copy = document.createElement('div');
      copy.className = 'mvp-copy';
      Array.from(card.childNodes).forEach((node) => copy.appendChild(node));
      card.appendChild(copy);

      const detail = copy.querySelector('.mvp-detail');
      if (index === 0 && detail) detail.dataset.defaultDescription = mvpOneDefaultDescription;

      const visual = document.createElement('figure');
      const assets = processAssets[index] || [];
      const usesAccordion = index <= 3 && assets.length > 1;
      const panelCountClass =
        assets.length === 2 ? ' mvp-visual-two-panel' : assets.length === 3 ? ' mvp-visual-three-panel' : '';
      visual.className =
        usesAccordion
          ? `mvp-visual mvp-visual-accordion${panelCountClass}`
          : assets.length > 1
            ? 'mvp-visual mvp-visual-grid'
            : 'mvp-visual mvp-visual-single';

      if (assets.length) {
        assets.forEach(([src, alt, title, description], assetIndex) => {
          const image = document.createElement('img');
          image.src = src;
          image.alt = alt;
          image.loading = 'lazy';

          if (!usesAccordion) {
            visual.appendChild(image);
            return;
          }

          const panel = document.createElement('button');
          panel.type = 'button';
          panel.className = 'mvp-process-panel';
          panel.setAttribute('aria-expanded', 'false');
          panel.setAttribute(
            'aria-label',
            index === 0 ? `${title}. Hover or focus to read this step.` : `${title}. Hover or focus to enlarge.`
          );

          const number = document.createElement('span');
          number.className = 'mvp-process-panel-number';
          number.textContent = String(assetIndex + 1).padStart(2, '0');

          const showDescription = () => {
            if (index === 0 && detail && description) setTextIfNeeded(detail, description);
          };
          const restoreDescription = () => {
            if (index === 0 && detail) {
              setTextIfNeeded(detail, detail.dataset.defaultDescription || mvpOneDefaultDescription);
            }
          };

          panel.append(image, number);
          panel.addEventListener('pointerenter', showDescription);
          panel.addEventListener('pointerleave', () => {
            if (!panel.matches(':focus-visible')) restoreDescription();
          });
          panel.addEventListener('focus', showDescription);
          panel.addEventListener('blur', restoreDescription);
          panel.addEventListener('click', () => {
            const shouldExpand = !panel.classList.contains('is-expanded');
            visual.querySelectorAll('.mvp-process-panel').forEach((item) => {
              item.classList.remove('is-expanded');
              item.setAttribute('aria-expanded', 'false');
            });
            if (shouldExpand) {
              panel.classList.add('is-expanded');
              panel.setAttribute('aria-expanded', 'true');
              showDescription();
            } else {
              restoreDescription();
            }
          });
          visual.appendChild(panel);
        });
      } else {
        visual.classList.add('mvp-visual-number');
        visual.setAttribute('aria-hidden', 'true');
        const number = document.createElement('span');
        number.textContent = String(index + 1).padStart(2, '0');
        visual.appendChild(number);
      }

      card.appendChild(visual);
    });

    const processTrack = page.querySelector('.mvp-timeline');
    addHorizontalControls(processTrack, {
      label: 'Five MVP development stages',
      previousLabel: 'Show previous MVP',
      nextLabel: 'Show next MVP',
    });

    const processHeading = page.querySelector('#process-heading');
    if (processHeading && processHeading.dataset.refinedHeading !== 'true') {
      processHeading.dataset.refinedHeading = 'true';
      const mutedPhrase = document.createElement('span');
      mutedPhrase.className = 'process-heading-muted';
      mutedPhrase.textContent = 'One continuous learning loop.';
      processHeading.replaceChildren(document.createTextNode('Five MVPs. '), mutedPhrase);
    }

    const decisionsSection = page.querySelector('.decisions-section');
    setTextIfNeeded(decisionsSection?.querySelector('.case-section-label'), 'Design Decisions');
    if (decisionsSection) {
      decisionsSection.id = 'decision';
      const anchorNav = page.querySelector('.case-anchor-nav');
      const reflectionLink = anchorNav?.querySelector('a[href="#reflection"]');
      if (anchorNav && reflectionLink && !anchorNav.querySelector('a[href="#decision"]')) {
        const decisionLink = document.createElement('a');
        decisionLink.href = '#decision';
        decisionLink.textContent = 'Decision';
        reflectionLink.before(decisionLink);
      }
    }

    const decisionsHeading = page.querySelector('#decisions-heading');
    if (decisionsHeading && decisionsHeading.dataset.refinedHeading !== 'true') {
      decisionsHeading.dataset.refinedHeading = 'true';
      const mutedPhrase = document.createElement('span');
      mutedPhrase.className = 'decision-heading-muted';
      mutedPhrase.textContent = 'The world behind';
      decisionsHeading.replaceChildren(mutedPhrase, document.createTextNode(' the visible interface'));
    }

    const decisionPosters = [
      '/projects/kb-tutor/media/saq-poster.jpg',
      '/projects/kb-tutor/media/teacher-dashboard-poster.jpg',
    ];
    page.querySelectorAll('.decision-media-video video').forEach((video, index) => {
      const poster = decisionPosters[index];
      if (poster && video.getAttribute('poster') !== poster) video.setAttribute('poster', poster);
    });

    page.querySelectorAll('.decision-copy dl > div').forEach((row) => {
      if (row.querySelector('dt')?.textContent.trim().toLowerCase() === 'context') row.remove();
    });

    page.querySelectorAll('.decision-media > span').forEach((label) => {
      const text = label.textContent.trim().toLowerCase();
      if (text === 'product screen' || text === 'interaction walkthrough' || text === 'design in context') {
        label.remove();
      }
    });

    setTextIfNeeded(page.querySelector('.decision-media-collaboration > strong'), 'Collaboration');
    prepareDecisionReveals(page);
  }

  function ensureHomepageNavigation() {
    document.querySelectorAll('a[href="/projects"], a[href="/projects/"]').forEach((link) => {
      link.setAttribute('href', '/#projects');
    });

    document.querySelectorAll('a[href="/"]').forEach((link) => {
      const isHomeIdentity = link.matches('.site-logo, .brand') || link.textContent.trim() === 'Product Designer';
      if (isHomeIdentity) link.setAttribute('href', '/');
    });

    if (document.documentElement.dataset.hardHomepageNavigation === 'true') return;
    document.documentElement.dataset.hardHomepageNavigation = 'true';
    window.addEventListener('click', (event) => {
      const link = event.target.closest?.('a[href="/"], a[href="/#projects"]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(link.getAttribute('href'));
    }, true);
  }

  function ensureAiDesignNavigation() {
    const nav = document.querySelector('.site-header nav');
    if (!nav) return;

    nav.querySelectorAll('.contact-link').forEach((link) => link.remove());

    const aboutLink = nav.querySelector('a[href="/about"], a[href="/about/"]');
    let aiLink = nav.querySelector('a[href="/ai-design"], a[href="/ai-design/"]');

    if (!aiLink && aboutLink) {
      aiLink = document.createElement('a');
      aiLink.href = '/ai-design/';
      aboutLink.before(aiLink);
    }

    if (!aiLink) return;
    setTextIfNeeded(aiLink, 'Playground');
    aiLink.classList.toggle('active', window.location.pathname.startsWith('/ai-design'));
    aiLink.setAttribute('href', '/ai-design/');

    if (aiLink.dataset.nativeAiRoute !== 'true') {
      aiLink.dataset.nativeAiRoute = 'true';
      aiLink.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign('/ai-design/');
      });
    }
  }

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
        const decisionEmphasis = block.querySelector('.decision-emphasis');
        const decisionHeadingItems = copy
          ? Array.from(copy.querySelectorAll('.decision-number, h3, .decision-tags'))
          : [];
        const decisionDetailRows = copy
          ? Array.from(copy.querySelectorAll('dl > div:not(.decision-emphasis)'))
          : [];
        const direction = index % 2 === 0 ? 1 : -1;
        const isKbTutorDecision = block.closest('.kb-tutor-refined');
        const usesDedicatedDecisionReveal = block.closest('.kb-tutor-refined, .bumble-refined, .impress-refined');

        // KB Tutor uses a dedicated IntersectionObserver reveal so the effect is
        // visible and deterministic even when ScrollTrigger refreshes late.
        if (usesDedicatedDecisionReveal) return;

        const decisionTimeline = gsap.timeline({
          scrollTrigger: {
            id: `portfolio-decision-${index}`,
            trigger: block,
            start: isDesktop ? 'top 72%' : 'top 84%',
            once: true,
          },
        });

        if (copy) {
          if (isKbTutorDecision) {
            decisionTimeline
              .from(
                copy,
                {
                  x: isDesktop ? direction * -34 : 0,
                  y: 24,
                  duration: 0.95,
                  ease: 'power3.out',
                  clearProps: 'transform',
                },
                0
              )
              .from(
                decisionHeadingItems,
                {
                  autoAlpha: 0,
                  y: 34,
                  duration: 0.9,
                  stagger: 0.14,
                  ease: 'power3.out',
                  clearProps: clearMotionStyles,
                },
                0.04
              )
              .from(
                decisionDetailRows,
                {
                  autoAlpha: 0,
                  y: 22,
                  duration: 0.72,
                  stagger: 0.14,
                  ease: 'power2.out',
                  clearProps: clearMotionStyles,
                },
                0.42
              );
          } else {
            decisionTimeline.from(copy, {
              autoAlpha: 0,
              x: isDesktop ? direction * -22 : 0,
              y: 20,
              duration: 0.72,
              ease: 'power3.out',
              clearProps: clearMotionStyles,
            });
          }
        }
        if (media) {
          decisionTimeline.from(
            media,
            {
              autoAlpha: 0,
              y: isKbTutorDecision ? 24 : 0,
              duration: isKbTutorDecision ? 0.92 : 0.52,
              ease: isKbTutorDecision ? 'power2.out' : 'power3.out',
              clearProps: clearMotionStyles,
            },
            isKbTutorDecision ? 0.28 : copy ? '-=0.48' : 0
          );
        }
        if (isKbTutorDecision && decisionEmphasis) {
          decisionTimeline
            .fromTo(
              decisionEmphasis,
              { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)', x: -18 },
              {
                autoAlpha: 1,
                clipPath: 'inset(0 0% 0 0)',
                x: 0,
                duration: 1.28,
                ease: 'power3.inOut',
                clearProps: 'clipPath,opacity,visibility,transform',
              },
              0.72
            )
            .from(
              decisionEmphasis.children,
              {
                autoAlpha: 0,
                y: 18,
                duration: 0.72,
                stagger: 0.16,
                ease: 'power2.out',
                clearProps: clearMotionStyles,
              },
              1.22
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

  function initializePortfolioEnhancements() {
    if (document.documentElement.dataset.portfolioInitialized === 'true') return;
    document.documentElement.dataset.portfolioInitialized = 'true';

    if (window.location.pathname.startsWith('/projects/kb-tutor')) {
      document.documentElement.classList.add('kb-apple');
    }
    if (/^\/projects\/[^/]+/.test(window.location.pathname)) {
      document.documentElement.classList.add('case-apple');
    }

    const pageObserver = new MutationObserver(() => {
      ensureAiDesignNavigation();
      ensureHomepageNavigation();
      prepareCaseStudyContent();
      if (window.location.pathname !== activePath) window.setTimeout(() => mountMotionSystem(true), 0);
    });
    pageObserver.observe(document.body, { childList: true, subtree: true });

    ensureAiDesignNavigation();
    ensureHomepageNavigation();
    prepareCaseStudyContent();
    mountMotionSystem();
  }

  const startAfterHydration = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(initializePortfolioEnhancements);
    });
  };

  // Case-study enhancement should not wait for large images or videos. The
  // mutation observer reapplies the shared structure if framework hydration
  // replaces any of the exported markup after DOMContentLoaded.
  if (/^\/projects\/[^/]+/.test(window.location.pathname)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startAfterHydration, { once: true });
    } else {
      startAfterHydration();
    }
  } else if (document.readyState === 'complete') {
    startAfterHydration();
  } else {
    window.addEventListener('load', startAfterHydration, { once: true });
  }
})();
