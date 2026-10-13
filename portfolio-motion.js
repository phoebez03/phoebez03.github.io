(() => {
  'use strict';

  if (window.location.pathname === '/projects' || window.location.pathname === '/projects/') {
    window.location.replace('/#projects');
    return;
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopPreference = window.matchMedia('(min-width: 851px)');
  let activeContext = null;
  let activeMotionRoot = null;
  let caseNavigationController = null;
  let currentCaseNavigation = null;
  let activePath = '';
  let activeDesktopState = desktopPreference.matches;
  let progressIndicator = null;
  let resizeTimer = null;

  const clearMotionStyles = 'transform,opacity,visibility';

  const moonFaviconLinks = [
    { rel: 'icon', href: '/favicon.png?v=3', type: 'image/png', sizes: '64x64' },
    { rel: 'shortcut icon', href: '/favicon.ico?v=3' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=3', sizes: '180x180' },
  ];

  function ensureMoonFavicon() {
    const current = [...document.head.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')];
    const isCurrent = moonFaviconLinks.every(({ rel, href }) =>
      current.some((link) => link.rel === rel && link.getAttribute('href') === href)
    );
    if (isCurrent && current.length === moonFaviconLinks.length) return;

    current.forEach((link) => link.remove());
    moonFaviconLinks.forEach(({ rel, href, type, sizes }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (type) link.type = type;
      if (sizes) link.setAttribute('sizes', sizes);
      link.dataset.moonFavicon = 'true';
      document.head.appendChild(link);
    });
  }

  function setTextIfNeeded(element, text) {
    if (element && element.textContent.trim() !== text) element.textContent = text;
  }

  function setParagraphsIfNeeded(element, paragraphs) {
    if (!element) return;
    const signature = paragraphs.join('|');
    if (element.dataset.paragraphs === signature) return;

    element.classList.add('case-lead-split');
    element.dataset.paragraphs = signature;
    element.replaceChildren(
      ...paragraphs.map((paragraph) => {
        const span = document.createElement('span');
        span.textContent = paragraph;
        return span;
      })
    );
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

  function buildBumbleIteration(page) {
    if (!page || page.dataset.bumbleIterationV2 === 'true') return;
    page.dataset.bumbleIterationV2 = 'true';
    page.classList.add('bumble-iteration-v2');

    const hero = page.querySelector('.case-hero');
    const nextProject = page.querySelector('.case-next');
    if (!hero || !nextProject) return;

    const walkthroughStage = page.querySelector('.bumble-hero-media');
    const walkthroughPhone = walkthroughStage?.querySelector('.mobile-demo-phone');
    walkthroughStage?.remove();
    page
      .querySelectorAll(
        '.product-story, .impact-band, .case-anchor-nav, .problem-section, .process-section, .decisions-section, .reflection-section, .bumble-v2-story-nav, .bumble-v2-section'
      )
      .forEach((node) => node.remove());

    const storyNav = document.createElement('nav');
    storyNav.className = 'case-anchor-nav bumble-v2-story-nav';
    storyNav.setAttribute('aria-label', 'Bumble Skill Snack case study chapters');
    storyNav.innerHTML = `
      <a class="is-current" href="#problem" aria-current="location">Problem</a>
      <a href="#bumble-research">Process</a>
      <a href="#bumble-impact">Impact</a>
      <a href="#reflection">Reflection</a>`;

    const story = document.createElement('div');
    story.className = 'bumble-v2-story';
    story.innerHTML = `
      <section class="case-section bumble-v2-section bumble-v2-problem" id="problem" aria-labelledby="bumble-problem-heading">
        <header class="bumble-v2-section-heading">
          <p class="case-section-label">Problem</p>
          <h3 class="bumble-v2-section-title" id="bumble-problem-heading">Matches happened, but conversations stalled.</h3>
        </header>
        <div class="bumble-v2-problem-grid">
          <article class="bumble-v2-problem-card">
            <div class="bumble-v2-card-copy"><span>Problem 01</span><h3>Matches stalled</h3><p>People were matching, but many never turned that match into a conversation.</p></div>
            <figure class="bumble-v2-donut-visual" aria-label="40 percent of matches did not become conversations">
              <div class="bumble-v2-donut"><strong>40%</strong></div>
              <figcaption>matched but did not talk</figcaption>
            </figure>
          </article>
          <article class="bumble-v2-problem-card">
            <div class="bumble-v2-card-copy"><span>Problem 02</span><h3>The blank-box burden</h3><p>A blank message field gave people no shared starting point or low-pressure way to begin.</p></div>
            <div class="bumble-v2-chat-visual" aria-label="A new match with an empty message field">
              <div class="bumble-v2-chat-window">
                <span>New match</span>
                <div><i>Type a message...</i><b aria-hidden="true">↗</b></div>
              </div>
              <p>Where do I start?</p>
            </div>
          </article>
        </div>
      </section>

      <section class="case-section bumble-v2-section bumble-v2-process" id="bumble-research" aria-labelledby="bumble-research-heading">
        <header class="bumble-v2-section-heading">
          <p class="case-section-label">Research</p>
          <h3 class="bumble-v2-section-title" id="bumble-research-heading">I mapped where the experience should begin.</h3>
        </header>
        <div class="bumble-v2-carousel">
          <div class="bumble-v2-track" role="list">
            <article class="bumble-v2-card bumble-v2-card--wide" role="listitem"><div class="bumble-v2-card-copy"><span>Research 01</span><h3>User Flow</h3><p>Bumble serves different user types, including free and premium users, as well as different gender-based interaction flows. I mapped these experiences first to understand where Skill Snack could fit naturally into the existing product.</p></div><figure class="bumble-v2-natural-visual"><img src="/projects/bumble-skill-snack/process/bumble-research-user-flow.png" alt="Bumble Skill Snack user flow from onboarding through matching and chat" loading="lazy"></figure></article>
            <article class="bumble-v2-card bumble-v2-card--wide" role="listitem"><div class="bumble-v2-card-copy"><span>Research 02</span><h3>Low-Fidelity Prototyping</h3><p>Once the flow was clear, I used Figma Make for rapid interactive prototyping. It helped me test the experience and micro-interactions quickly, while the final fidelity still required careful manual refinement and design judgment.</p></div><div class="bumble-v2-image-stack" aria-label="Two overlapping low-fidelity Skill Snack explorations"><figure tabindex="0" role="button" aria-pressed="false" aria-label="Bring the early flow exploration to the front"><img src="/projects/bumble-skill-snack/process/bumble-research-concept-overview.png" alt="Early Skill Snack flow and concept exploration" loading="lazy"></figure><figure tabindex="0" role="button" aria-pressed="false" aria-label="Bring the detailed flow exploration to the front"><img src="/projects/bumble-skill-snack/process/bumble-research-low-fidelity-flow.png" alt="Detailed low-fidelity Skill Snack flow" loading="lazy"></figure></div></article>
          </div>
        </div>
      </section>

      <section class="case-section bumble-v2-section bumble-v2-process" id="bumble-design" aria-labelledby="bumble-design-heading">
        <header class="bumble-v2-section-heading">
          <p class="case-section-label">Design</p>
          <h3 class="bumble-v2-section-title" id="bumble-design-heading">I designed experience flows</h3>
        </header>
        <div class="bumble-v2-carousel bumble-v2-vertical">
          <div class="bumble-v2-track" role="list">
            <article class="bumble-v2-card bumble-v2-card--wide bumble-v2-design-card bumble-v2-free-flow-card" role="listitem"><div class="bumble-v2-card-copy"><span>Free user flow</span><h3>Let free users experience the value before asking them to upgrade.</h3><p>Free users can discover Skill Snack matches and start conversations, but customization and deeper skill content remain limited.</p></div><figure class="bumble-v2-natural-visual bumble-v2-free-flow-visual"><div class="bumble-v2-flow-callout bumble-v2-flow-callout--blur"><span>02</span><strong>Some skill information is blurred on profiles</strong></div><div class="bumble-v2-free-flow-art"><svg class="bumble-v2-art-crop" viewBox="1649 0 1959 872" role="img" aria-label="Bumble Skill Snack free-user flow across five mobile screens" overflow="hidden"><image href="/projects/bumble-skill-snack/process/bumble-design-user-flows.svg?v=1" width="7782" height="2103"/></svg></div><div class="bumble-v2-flow-callouts-bottom"><div class="bumble-v2-flow-callout bumble-v2-flow-callout--customize"><span>01</span><strong>Cannot customize the skills they want to teach or learn</strong></div><div class="bumble-v2-flow-callout bumble-v2-flow-callout--video"><span>03</span><strong>Cannot access the full skill video</strong></div></div></figure></article>
            <article class="bumble-v2-card bumble-v2-card--wide bumble-v2-design-card bumble-v2-premium-flow-card" role="listitem"><div class="bumble-v2-card-copy"><span>Premium user flow</span><h3>Premium gives users more control over the experience.</h3><p>This makes Skill Snack feel more intentional: users can shape the kinds of conversations they want instead of relying only on default recommendations.</p></div><figure class="bumble-v2-natural-visual bumble-v2-premium-flow-visual"><div class="bumble-v2-flow-callout bumble-v2-premium-callout--content"><span>02</span><strong>View the full Skill Snack content on a match’s profile</strong></div><div class="bumble-v2-premium-flow-art"><svg class="bumble-v2-art-crop" viewBox="3752 0 1600 872" role="img" aria-label="Bumble Skill Snack premium-user flow across four mobile screens" overflow="hidden"><image href="/projects/bumble-skill-snack/process/bumble-design-user-flows.svg?v=1" width="7782" height="2103"/></svg></div><div class="bumble-v2-flow-callout bumble-v2-premium-callout--personalize"><span>01</span><strong>Personalize both sides of the exchange</strong></div></figure></article>
            <article class="bumble-v2-card bumble-v2-card--wide bumble-v2-design-card" role="listitem"><div class="bumble-v2-card-copy"><span>Onboarding</span><h3>Start with what you can teach and what you want to learn.</h3><p>Users set up their Skill Snack profile by choosing interests, learning goals, and the skills they can share. This gives the feature enough context to create relevant conversation starters from the beginning.</p></div><figure class="bumble-v2-natural-visual"><svg class="bumble-v2-art-crop" viewBox="0 0 1600 872" role="img" aria-label="Bumble Skill Snack onboarding flow across four mobile screens" overflow="hidden"><image href="/projects/bumble-skill-snack/process/bumble-design-user-flows.svg?v=1" width="7782" height="2103"/></svg></figure></article>
            <article class="bumble-v2-card bumble-v2-card--wide bumble-v2-design-card" role="listitem"><div class="bumble-v2-card-copy"><span>Once matched</span><h3>Turn a blank chat into a shared starting point.</h3><p>After matching, users can start normally or choose to teach/learn a skill, giving both people something meaningful to talk about right away.</p></div><figure class="bumble-v2-natural-visual"><img src="/projects/bumble-skill-snack/process/bumble-design-once-matched-flow.svg" alt="Bumble Skill Snack matched-chat flow across four mobile screens" loading="lazy"></figure></article>
          </div>
        </div>
      </section>

      <section class="case-section bumble-v2-section bumble-v2-process" id="bumble-test" aria-labelledby="bumble-test-heading">
        <header class="bumble-v2-section-heading">
          <p class="case-section-label">Test + iterate</p>
          <h3 class="bumble-v2-section-title" id="bumble-test-heading">I refined trust and expanded the system.</h3>
        </header>
        <div class="bumble-v2-carousel bumble-v2-vertical">
          <div class="bumble-v2-track" role="list">
            <article class="bumble-v2-card bumble-v2-card--wide bumble-v2-card--iteration-compact" role="listitem"><div class="bumble-v2-card-copy"><span>Safety</span><h3>Add guardrails before sharing skills</h3><p>Testing made me realize users could enter joke, inappropriate, or low-quality skills (e.g. “I’m good at farting”).</p><p>I added a safety check before publishing to catch content that could make the experience feel unsafe or unserious.</p></div><figure class="bumble-v2-natural-visual"><img src="/projects/bumble-skill-snack/process/bumble-iteration-safety-flow.svg" alt="Bumble Skill Snack verification and safety-check flow across six mobile screens" loading="lazy"></figure></article>
            <article class="bumble-v2-card bumble-v2-card--wide bumble-v2-card--iteration-compact bumble-v2-platform-card" role="listitem"><div class="bumble-v2-card-copy"><span>System expansion</span><h3>Keep one feature consistent across platforms</h3><p>After validating the core flow, I expanded Skill Snack across iOS, Android, and Apple Watch.</p><p>The challenge was keeping the same interaction logic while adapting the experience to each platform’s conventions.</p></div><div class="bumble-v2-platform-comparison" aria-label="Android, iOS, and Apple Watch Skill Snack comparison"><figure class="is-mobile-platforms"><div class="bumble-v2-platform-labels"><span>Android</span><span>iOS</span></div><img src="/projects/bumble-skill-snack/process/bumble-system-platform-comparison.svg" alt="Native Android and iOS Skill Snack verification flows shown side by side" loading="lazy"></figure><figure class="is-watch"><figcaption>Apple Watch</figcaption><video controls muted loop playsinline preload="metadata" poster="/projects/bumble-skill-snack/media/bumble-decision-apple-watch-poster.jpg"><source src="/projects/bumble-skill-snack/media/bumble-decision-apple-watch.mp4" type="video/mp4"></video></figure></div></article>
          </div>
        </div>
      </section>

      <section class="case-section bumble-v2-section bumble-v2-impact" id="bumble-impact" aria-labelledby="bumble-impact-heading">
        <div class="bumble-v2-impact-walkthrough-grid">
          <div class="bumble-v2-impact-summary">
            <p class="case-section-label" id="bumble-impact-heading">Impact</p>
            <div class="bumble-v2-impact-metrics">
              <article><strong>3</strong><span>platforms</span></article>
              <article><strong>10</strong><span>high-fidelity user flows</span></article>
              <article><strong>5+</strong><span>interactive states</span></article>
            </div>
          </div>
          <div class="bumble-v2-walkthrough" aria-label="Bumble Skill Snack product walkthrough">
            <div class="bumble-v2-walkthrough-slot"></div>
          </div>
        </div>
      </section>

      <section class="reflection-section bumble-v2-section bumble-v2-reflection" id="reflection" aria-labelledby="bumble-reflection-heading">
        <p class="case-section-label" id="bumble-reflection-heading">Reflection</p>
        <ul class="bumble-v2-reflection-list">
          <li><strong>01 · Design systems save time, not just create consistency.</strong><span>Working within Bumble’s existing patterns showed me that defining components, spacing, hierarchy, and interaction rules early made later screens much faster to design and easier to keep consistent.</span></li>
          <li><strong>02 · Not every platform needs every feature.</strong><span>I explored a desktop version of Skill Snack, but after reviewing Bumble’s existing web experience and the project timeline, I prioritized iOS, Android, and Apple Watch—where the feature better fit the core matching and messaging experience.</span></li>
        </ul>
      </section>`;

    hero.after(storyNav, story);
    const walkthroughSlot = story.querySelector('.bumble-v2-walkthrough-slot');
    if (walkthroughSlot && walkthroughPhone) {
      walkthroughPhone.classList.add('bumble-v2-walkthrough-phone');
      walkthroughSlot.appendChild(walkthroughPhone);
    }

    story.querySelectorAll('.bumble-v2-carousel:not(.bumble-v2-vertical) .bumble-v2-track').forEach((track) => {
      const label = 'research artifact';
      addHorizontalControls(track, {
        label: `Bumble ${label} cards`,
        itemSelector: '.bumble-v2-card',
        controlsClass: 'bumble-v2-controls',
        previousLabel: `Show previous ${label}`,
        nextLabel: `Show next ${label}`,
      });
    });

    story.querySelectorAll('.bumble-v2-image-stack').forEach((stack) => {
      const layers = Array.from(stack.querySelectorAll('figure'));
      const toggleLayer = (layer) => {
        const willActivate = !layer.classList.contains('is-active');
        layers.forEach((item) => {
          const isActive = item === layer && willActivate;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', String(isActive));
        });
      };

      layers.forEach((layer) => {
        layer.addEventListener('click', () => toggleLayer(layer));
        layer.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          toggleLayer(layer);
        });
      });
    });

    const setActiveChapter = (href) => {
      storyNav.querySelectorAll('a').forEach((item) => {
        const isCurrent = item.getAttribute('href') === href;
        item.classList.toggle('is-current', isCurrent);
        if (isCurrent) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    };

    storyNav.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = page.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      setActiveChapter(link.getAttribute('href'));
      const offset = 48 + storyNav.getBoundingClientRect().height;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.history.replaceState(null, '', link.getAttribute('href'));
      window.scrollTo({ top, behavior: motionPreference.matches ? 'auto' : 'smooth' });
    });


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
    setParagraphsIfNeeded(
      page.querySelector('.case-lead'),
      [
        'An interest-based feature that turns matches into conversations through playful, low-pressure interactions.',
        'I designed a cohesive experience across iOS, Android and Apple Watch, extending Bumble’s design system.'
      ]
    );
    buildBumbleIteration(page);
    return;
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
      ['/projects/bumble-skill-snack/process/bumble-research-concept-overview.png', 'Early research, user flows, and concept exploration for Skill Snack'],
      [
        '/projects/bumble-skill-snack/process/bumble-research-low-fidelity-flow.png',
        'Detailed cross-platform product flows for Skill Snack',
        '/projects/bumble-skill-snack/process/bumble-design-system.png',
        'Bumble design-system patterns used across the feature',
      ],
      [
        '/projects/bumble-skill-snack/process/bumble-iteration-safety-exploration.png',
        'High-fidelity Skill Snack screens across iOS, Android, and Apple Watch',
        '/projects/bumble-skill-snack/process/bumble-iteration-microinteraction.mp4',
        'Skill Snack micro-interaction prototype',
      ],
      ['/projects/bumble-skill-snack/process/bumble-system-cross-platform-flow.png?v=2', 'Skill verification translated across native Android and iOS photo-selection patterns'],
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
          video.poster = '/projects/bumble-skill-snack/process/bumble-iteration-microinteraction-poster.jpg';
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
      video.poster = '/projects/bumble-skill-snack/media/bumble-decision-user-flow-poster.jpg';
      const source = document.createElement('source');
      source.src = '/projects/bumble-skill-snack/media/bumble-decision-user-flow.mp4';
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
      image.src = '/projects/bumble-skill-snack/process/bumble-research-user-flow.png';
      image.alt = 'End-to-end Skill Snack user flow from onboarding through matching and conversation';
      image.loading = 'lazy';
      flow.appendChild(image);
      decisionOneVideo.replaceWith(flow);
      decisionOneMedia.classList.add('has-user-flow');
    }

    setTextIfNeeded(decisionBlocks[1]?.querySelector('.decision-media > strong'), 'Apple Watch Demo');

    prepareDecisionReveals(page);
  }

  function syncCaseReflection(page, selector, headingId, rows) {
    const reflection = page?.querySelector(selector);
    if (!reflection) return;
    const version = rows.map(([title, body]) => `${title}|${body}`).join('||');
    if (reflection.querySelector('.case-reflection-list')?.dataset.reflectionVersion === version) return;

    reflection.innerHTML = `
      <p class="case-section-label" id="${headingId}">Reflection</p>
      <ul class="case-reflection-list" data-reflection-version="${version}">
        ${rows.map(([title, body], index) => `<li><strong>${String(index + 1).padStart(2, '0')} · ${title}</strong><span>${body}</span></li>`).join('')}
      </ul>`;
  }

  const impressReflectionRows = [
    ['Focus before expansion.', 'We had ideas for more artist chapters and features like a museum mode, but limited time meant focusing on the core chapters and refining the learning experience before expanding the product.'],
    ['Good learning UX is more than easy interaction.', 'Concepts that felt obvious to me were not obvious to first-time learners. Testing exposed that expert blind spot and pushed me to simplify terminology, content density, and pacing by designing for how learners actually understood the experience.'],
  ];

  const pageLensReflectionRows = [
    ['Research can challenge intuition.', 'Some accessibility ideas that initially felt helpful were not supported by evidence. Research pushed us away from one-size-fits-all solutions and toward flexible reading support grounded in actual user needs.'],
    ['Accessibility should give people control, not labels.', 'The goal was not simply to make text easier to read, but to let readers choose the support they wanted without being singled out or forced to disclose anything about themselves.'],
  ];

  function prepareImpressCaseStudy(page) {
    if (!page) return;
    syncCaseReflection(page, '.impress-reflection', 'impress-reflection-heading', impressReflectionRows);
    if (page.dataset.impressRefined === 'true') return;
    page.dataset.impressRefined = 'true';
    page.classList.add('impress-refined');

    prepareHeroKeywords(page, 'Mobile App · Interaction Design · Instructional Design');
    prepareCaseMeta(page, [
      { label: 'Role', value: 'UX & Instructional Designer' },
      { label: 'Timeline', value: 'Mar - Jul 2026' },
      { label: 'Tools', value: 'Figma · Figma Make' }
    ]);
    setParagraphsIfNeeded(
      page.querySelector('.case-lead'),
      [
        'An AI-powered mobile app that makes learning art history an interactive conversation.',
        'I combined instructional design and conversational UX to turn passive content into active learning.'
      ]
    );
    const teamValue = Array.from(page.querySelectorAll('.case-meta > div')).find(
      (item) => item.querySelector('span')?.textContent.trim().toLowerCase() === 'team'
    )?.querySelector('strong');
    setTextIfNeeded(teamValue, '3 people — PM, Developer, UX Designer');
    page.querySelector('.impress-hero-media .mobile-demo-copy > p')?.remove();
    const hero = page.querySelector('.case-hero');
    const heroMedia = page.querySelector('.impress-hero-media');
    const heroWalkthrough = heroMedia?.querySelector('.impress-demo-frame');
    const walkthroughVideo = heroWalkthrough?.querySelector('video');
    if (walkthroughVideo) {
      walkthroughVideo.poster = '/projects/impresschat/media/impresschat-product-demo-poster.jpg';
      const source = walkthroughVideo.querySelector('source');
      if (source) {
        source.src = '/projects/impresschat/media/impresschat-product-demo.mp4';
        source.type = 'video/mp4';
      }
      walkthroughVideo.load();
    }
    heroMedia?.remove();

    const highlights = page.querySelector('.product-story');
    const highlightIntro = highlights?.querySelector('.case-section-intro');
    if (highlights) highlights.classList.add('impress-highlights', 'impress-vertical-journey');
    highlightIntro?.querySelector('.case-section-label')?.remove();
    setTextIfNeeded(highlightIntro?.querySelector('h2'), 'The learning journey');
    Array.from(highlightIntro?.querySelectorAll('p') || []).forEach((paragraph) => paragraph.remove());

    const screenWall = highlights?.querySelector('.impress-screen-wall');
    if (screenWall && !highlights.querySelector('.impress-highlight-carousel')) {
      const journeyStages = [
        {
          title: 'Start with a clear path',
          description: 'We used Backward Design to define the learning objectives and pre/post assessments before designing the interface. The course then follows the history of Impressionism across three modules: understanding the movement, exploring key artists, and moving into Post-Impressionism.',
          src: '/projects/impresschat/journey/impresschat-journey-01-course-path.svg',
          alt: 'ImpressChat course outline shown inside an iPhone frame',
        },
        {
          title: 'Measure before teaching',
          description: 'The five-question foundation check maps directly to our learning objectives using multiple-choice, short-answer, image-based, and dropdown questions. The post-test follows the same structure, allowing us to compare learning before and after the course.',
          images: [
            ['/projects/impresschat/journey/impresschat-journey-02-foundation-check.svg', 'ImpressChat image-based pre-test shown inside an iPhone frame'],
            ['/projects/impresschat/journey/impresschat-journey-02-foundation-check-detail.svg', 'ImpressChat pre-test assessment screen'],
            ['/projects/impresschat/journey/impresschat-journey-02-foundation-check-result.svg', 'ImpressChat pre-test result screen'],
          ],
        },
        {
          title: 'Learn through conversation',
          description: 'Each module places learners in a conversation with characters from the Impressionist era. Using Predict–Observe–Explain, learners make a prediction, examine artwork or evidence, and explain what they notice instead of simply reading information.',
          images: [
            ['/projects/impresschat/journey/impresschat-journey-03-module-01.svg', 'ImpressChat Module 1 shown inside an iPhone frame'],
            ['/projects/impresschat/journey/impresschat-journey-03-module-02.svg', 'ImpressChat Module 2 shown inside an iPhone frame'],
            ['/projects/impresschat/journey/impresschat-journey-03-module-03.svg', 'ImpressChat Module 3 shown inside an iPhone frame'],
          ],
        },
        {
          title: 'Return to the same learning goals',
          description: 'The post-test revisits the same objectives and assessment formats, helping us measure what learners understood after completing the experience.',
          src: '/projects/impresschat/journey/impresschat-journey-04-post-test.svg',
          alt: 'ImpressChat post-test shown inside an iPhone frame',
        },
      ];
      screenWall.replaceChildren();
      journeyStages.forEach((stage, index) => {
        const card = document.createElement('figure');
        const images = stage.images || [[stage.src, stage.alt]];
        card.className = `impress-screen-card${images.length > 1 ? ' has-multi-screen' : ''}`;
        const visual = images.length > 1
          ? `<div class="impress-phone-frame is-svg-poster is-multi-screen"><div class="impress-phone-row">${images.map(([src, alt]) => `<img src="${src}" alt="${alt}" loading="${index === 0 ? 'eager' : 'lazy'}">`).join('')}</div></div>`
          : `<div class="impress-phone-frame is-svg-poster"><img src="${images[0][0]}" alt="${images[0][1]}" loading="${index === 0 ? 'eager' : 'lazy'}"></div>`;
        card.innerHTML = `
          ${visual}
          <figcaption><span>${String(index + 1).padStart(2, '0')}</span><h3>${stage.title}</h3><p>${stage.description}</p></figcaption>`;
        screenWall.appendChild(card);
      });
      const carousel = document.createElement('div');
      carousel.className = 'impress-highlight-carousel';
      screenWall.classList.add('impress-highlight-track', 'is-vertical');
      screenWall.setAttribute('role', 'list');
      screenWall.querySelectorAll('.impress-screen-card').forEach((card, index) => {
        card.setAttribute('role', 'listitem');
        const caption = card.querySelector('figcaption');
        setTextIfNeeded(caption?.querySelector('span'), String(index + 1).padStart(2, '0'));
        if (caption) card.prepend(caption);
      });
      screenWall.before(carousel);
      carousel.appendChild(screenWall);
    }

    const impact = page.querySelector('.impress-impact');

    const problemSection = page.querySelector('.impress-problem');
    const problemIntro = problemSection?.querySelector('.case-section-intro');
    setTextIfNeeded(problemIntro?.querySelector('.case-section-label'), 'Problem');
    if (problemIntro) {
      const problemHeading = problemIntro.querySelector('h2');
      if (problemHeading) {
        const compactHeading = document.createElement('h3');
        compactHeading.id = problemHeading.id;
        compactHeading.textContent = 'Passive learning did not teach people to look.';
        problemHeading.replaceWith(compactHeading);
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
            ['Feedback', 'Refine thinking'],
          ],
          caption: 'The chat contains and scaffolds the complete learning cycle.',
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
        if (spec.className === 'is-active') {
          const chatLabel = document.createElement('span');
          chatLabel.className = 'impress-structured-chat-label';
          chatLabel.textContent = 'Structured chat';
          flow.appendChild(chatLabel);
        }
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
    setTextIfNeeded(processSection?.querySelector('.case-section-label'), 'Process');
    const processHeading = processSection?.querySelector('.case-section-intro h2');
    if (processHeading) {
      const compactHeading = document.createElement('h3');
      compactHeading.id = processHeading.id;
      compactHeading.textContent = 'How we designed it.';
      processHeading.replaceWith(compactHeading);
    }
    const processTrack = processSection?.querySelector('.mvp-timeline');
    Array.from(processSection?.querySelectorAll('.case-section-intro > p:not(.case-section-label)') || []).forEach(
      (paragraph) => paragraph.remove()
    );
    const processStages = [
      {
        title: 'Design the learning before the interface',
        detail: 'Using Backward Design, we defined the learning objectives and assessments first, then structured the course around what learners should understand by the end.',
        src: '/projects/impresschat/process/impresschat-process-01-learning-objectives.png',
        alt: 'Learning objectives mapped to course modules and assessment activities',
      },
      {
        title: 'Turn the learning plan into a flow',
        detail: 'I created low-fidelity flows in Figma and interactive prototypes with Figma Make to explore how quizzes, conversations, artwork, and feedback could work together.',
        src: '/projects/impresschat/process/impresschat-process-02-prototype.png',
        alt: 'Low-fidelity ImpressChat conversation and course-flow prototype',
      },
      {
        title: 'User testing round 1',
        detail: 'Testing with 8 learners revealed three issues: chat messages were too dense, two characters speaking in the critique activity were confusing, and learners had mixed reactions to receiving pre-test results.',
        src: '/projects/impresschat/process/impresschat-process-03-user-testing.png',
        alt: 'Course-flow testing map showing learner confusion and early termination points',
      },
      {
        title: 'A/B test for the pre-test decision',
        detail: '<strong>Should learners see their score?</strong> We ran a small A/B test with four learners. The no-score version left some learners unsure how well they had done or what level was expected. We decided to show the score but not reveal answer feedback, giving learners a benchmark without turning the pre-test into instruction.',
        src: '/projects/impresschat/process/impresschat-process-04-ab-test.png',
        alt: 'A/B test comparing a pre-test result with score and feedback against a completion screen without either',
        visualClass: 'is-wide-comparison',
      },
      {
        title: 'Iteration',
        detail: 'We limited chatbot responses to about 30 words and made each character’s position toward Impressionism more explicit. This reduced reading load and helped learners understand who was speaking and why.',
        src: '/projects/impresschat/process/impresschat-process-05-iteration-before-after.svg',
        alt: 'Three ImpressChat screens showing two designs before iteration and the refined design after iteration',
        visualClass: 'is-wide-comparison',
      },
      {
        title: 'Test again',
        detail: '<strong>3 more learners exposed an expert blind spot.</strong> Terms that felt obvious to us were unfamiliar to first-time art learners. We added a short vocabulary introduction and highlighted important terms inside the conversation so support was available when learners needed it.',
        src: '/projects/impresschat/process/impresschat-process-06-test-again.svg',
        alt: 'Two ImpressChat screens showing vocabulary support added after the second round of testing',
        visualClass: 'is-wide-comparison',
      },
      {
        title: 'Refine and share',
        detail: 'We fixed remaining interaction issues, refined the final experience, and prepared the project for presentation at Learning@Scale.',
        src: '/projects/impresschat/process/impresschat-process-07-presentation.jpg',
        alt: 'ImpressChat team presenting the research poster',
      },
    ];
    if (processTrack) {
      processTrack.replaceChildren();
      processStages.forEach((stage, index) => {
        const card = document.createElement('article');
        card.className = 'mvp-card';
        card.tabIndex = 0;
        const copy = document.createElement('div');
        copy.className = 'impress-stage-copy';
        copy.innerHTML = `<span class="mvp-number">Stage ${String(index + 1).padStart(2, '0')}</span><h3>${stage.title}</h3><p class="mvp-detail">${stage.detail}</p>`;
        const visual = document.createElement('figure');
        visual.className = `impress-stage-visual${stage.visualClass ? ` ${stage.visualClass}` : ''}`;
        if (stage.src) {
          const image = document.createElement('img');
          image.src = stage.src;
          image.alt = stage.alt;
          image.loading = index === 0 ? 'eager' : 'lazy';
          visual.appendChild(image);
        } else {
          visual.classList.add('is-placeholder');
          visual.innerHTML = `<span aria-hidden="true">＋</span><p>${stage.placeholder}</p>`;
        }
        card.append(copy, visual);
        processTrack.appendChild(card);
      });
    }
    addHorizontalControls(processTrack, {
      label: 'ImpressChat design process stages',
      previousLabel: 'Show previous design stage',
      nextLabel: 'Show next design stage',
    });

    const highlightHeading = highlightIntro?.querySelector('h2');
    if (highlightHeading) {
      const compactHeading = document.createElement('h3');
      compactHeading.id = highlightHeading.id;
      compactHeading.textContent = 'The learning journey';
      highlightHeading.replaceWith(compactHeading);
    }

    const sourceDemo = highlights?.querySelector('.impress-full-demo');
    const decisionsSection = page.querySelector('.impress-decisions');
    sourceDemo?.remove();
    decisionsSection?.remove();
    if (heroWalkthrough && processSection && !page.querySelector('.impress-walkthrough')) {
      const walkthrough = document.createElement('section');
      walkthrough.className = 'impress-walkthrough';
      walkthrough.setAttribute('aria-labelledby', 'impress-walkthrough-heading');

      const intro = document.createElement('div');
      intro.className = 'case-section-intro';
      intro.innerHTML = '<h3 id="impress-walkthrough-heading">Product walkthrough</h3>';

      const layout = document.createElement('div');
      layout.className = 'impress-walkthrough-layout';
      const media = document.createElement('figure');
      media.className = 'impress-walkthrough-video';
      media.appendChild(heroWalkthrough);
      layout.append(media);
      walkthrough.append(intro, layout);
      highlights?.after(walkthrough);
    }

    const walkthrough = page.querySelector('.impress-walkthrough');
    const reflection = page.querySelector('.impress-reflection');

    if (impact) {
      impact.classList.remove('impact-band');
      impact.classList.add('case-section', 'impress-impact-combined');
      impact.classList.add('impress-impact-simple');
      impact.id = 'impact';
      impact.innerHTML = `
        <div class="impress-impact-walkthrough-grid">
          <div class="impress-impact-summary">
            <p class="case-section-label" id="impress-impact-heading">Impact</p>
            <div class="impress-impact-metrics">
              <article><strong>ACM</strong><span>Learning@Scale 2026 demo accepted</span></article>
              <article><strong>80%</strong><span>pre-test to post-test learning gain</span></article>
            </div>
          </div>
        </div>`;
      impact.setAttribute('aria-labelledby', 'impress-impact-heading');
      impact.querySelector('.impress-impact-walkthrough-grid')?.append(walkthrough);
    }

    const anchorNav = page.querySelector('.case-anchor-nav');
    if (anchorNav) {
      anchorNav.innerHTML = '<a href="#problem">Problem</a><a href="#process">Process</a><a href="#impact">Impact</a><a href="#reflection">Reflection</a>';
      anchorNav.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        const target = link && page.querySelector(link.getAttribute('href'));
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        const top = target.getBoundingClientRect().top + window.scrollY - 48 - anchorNav.offsetHeight;
        window.history.replaceState(null, '', link.getAttribute('href'));
        window.scrollTo({ top, behavior: motionPreference.matches ? 'auto' : 'smooth' });
      });
    }

    if (hero && anchorNav && problemSection && processSection && highlights && walkthrough && impact && reflection) {
      hero.after(anchorNav);
      anchorNav.after(problemSection);
      problemSection.after(processSection);
      processSection.after(highlights);
      highlights.after(impact);
      impact.after(reflection);
    }
  }

  function preparePageLensCaseStudy(page) {
    if (!page) return;
    syncCaseReflection(page, '.pagelens-reflection', 'pagelens-reflection-heading', pageLensReflectionRows);
    if (page.dataset.pagelensRefined === 'true') return;
    page.dataset.pagelensRefined = 'true';
    page.classList.add('pagelens-refined');

    prepareHeroKeywords(page, 'Physical + Digital · Accessibility Design · UX Research');
    prepareCaseMeta(page, [
      { label: 'Role', value: 'UX Designer & Researcher' },
      { label: 'Timeline', value: 'March - May 2026' },
      { label: 'Tools', value: 'Figma' }
    ]);
    setParagraphsIfNeeded(
      page.querySelector('.case-lead'),
      [
        'An AI-powered reading companion that brings adaptive accessibility features to physical library books.',
        'I connected physical and digital interactions through accessibility research, service design and technical feasibility exploration.'
      ]
    );
    const heroStatement = page.querySelector('.pagelens-hero-copy h2');
    if (heroStatement) {
      const heading = document.createElement('h3');
      heading.textContent = 'Accessibility design';
      heroStatement.replaceWith(heading);
    }
    page.querySelector('.pagelens-hero-copy > p')?.remove();
    page.querySelector('.pagelens-demo-copy > p')?.remove();
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
            <img src="/projects/pagelens/problem/pagelens-reading-challenge-01.png" alt="Illustrative simulation of dense, crowded printed text" loading="lazy">
          </div>
          <div class="pagelens-reading-sample" data-sample="unstable">
            <img src="/projects/pagelens/problem/pagelens-reading-challenge-02.png" alt="Illustrative simulation of distorted and unstable letterforms" loading="lazy">
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
      [[
        '/projects/pagelens/process/pagelens-process-01-opportunity-research.png',
        'Library field research and reading-context exploration for PageLens',
      ]],
      [
        [
          '/projects/pagelens/process/pagelens-process-02-technology-library.png',
          'Annotated PageLens technology exploration with motorized tablet arm, IR sensor, book cradle, iPad, and headphones',
        ],
        [
          '/projects/pagelens/process/pagelens-process-02-technology-portable.png',
          'Annotated compact PageLens technology exploration with folding tablet arm, camera, book cradle, iPad, and headphones',
        ],
      ],
      [[
        '/projects/pagelens/process/pagelens-process-03-experience-map.png',
        'PageLens user flow from approaching the reading station through session reset',
      ]],
      [[
        '/projects/pagelens/process/pagelens-process-04-system-feasibility.png',
        'PageLens system diagram connecting sensing, hardware, interaction, actuation, and intelligence layers',
      ]],
      [[
        '/projects/pagelens/process/pagelens-process-05-responsible-design.png',
        'Illustration of people bringing different perspectives together through connected puzzle pieces',
      ]],
    ];

    processCards.forEach((card, index) => {
      if (card.dataset.pagelensStageEnhanced === 'true') return;
      card.dataset.pagelensStageEnhanced = 'true';
      if ((stageAssets[index] || []).length > 1) card.classList.add('has-image-stack');

      const copy = document.createElement('div');
      copy.className = 'pagelens-stage-copy';
      Array.from(card.childNodes).forEach((node) => copy.appendChild(node));

      const visual = document.createElement('figure');
      const images = stageAssets[index] || [];
      const usesStack = images.length > 1;
      visual.className = `pagelens-stage-visual${usesStack ? ' is-image-stack' : ''}`;
      images.forEach(([src, alt], imageIndex) => {
        const image = document.createElement('img');
        image.src = src;
        image.alt = alt;
        image.loading = index === 0 ? 'eager' : 'lazy';
        if (!usesStack) {
          visual.appendChild(image);
          return;
        }

        const layer = document.createElement('button');
        layer.type = 'button';
        layer.className = 'pagelens-stack-shot';
        layer.style.setProperty('--stack-i', imageIndex);
        layer.setAttribute('aria-label', `Bring ${alt} to the front`);
        layer.setAttribute('aria-pressed', 'false');
        layer.appendChild(image);
        visual.appendChild(layer);
      });

      if (usesStack) {
        const layers = Array.from(visual.querySelectorAll('.pagelens-stack-shot'));
        const toggleLayer = (layer) => {
          const willActivate = !layer.classList.contains('is-active');
          layers.forEach((item) => {
            const isActive = item === layer && willActivate;
            item.classList.toggle('is-active', isActive);
            item.setAttribute('aria-pressed', String(isActive));
          });
        };

        layers.forEach((layer) => {
          layer.addEventListener('pointerdown', () => {
            toggleLayer(layer);
            layer.dataset.pointerToggled = 'true';
          });
          layer.addEventListener('click', () => {
            if (layer.dataset.pointerToggled === 'true') {
              delete layer.dataset.pointerToggled;
              return;
            }
            toggleLayer(layer);
          });
        });
      }
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

    preparePageLensStory(page);
  }

  function preparePageLensStory(page) {
    page.classList.add('pagelens-story-v2');
    const hero = page.querySelector('.case-hero');
    const nav = page.querySelector('.case-anchor-nav');
    const problem = page.querySelector('.pagelens-problem');
    const process = page.querySelector('.pagelens-process');
    const concept = page.querySelector('.pagelens-product');
    const decisions = page.querySelector('.pagelens-decisions');
    const impact = page.querySelector('.pagelens-impact');
    const reflection = page.querySelector('.pagelens-reflection');

    decisions?.remove();

    const headings = [
      [problem, 'Problem', 'Physical books are fixed. Readers are not.'],
      [process, 'Process', 'From library context to a feasible system.'],
      [concept, 'The concept', 'Reading support that meets people at the page.'],
    ];
    headings.forEach(([section, label, title]) => {
      if (!section) return;
      setTextIfNeeded(section.querySelector('.case-section-label'), label);
      const old = section.querySelector('h2');
      if (old) {
        const heading = document.createElement('h3');
        heading.id = old.id;
        heading.textContent = title;
        old.replaceWith(heading);
      }
    });
    concept.id = 'concept';
    impact.id = 'impact';
    impact.innerHTML = '<div class="case-section-intro pagelens-impact-heading"><p class="case-section-label">Impact</p><h3 id="pagelens-impact-heading">Research translated into one feasible system.</h3></div><div class="pagelens-impact-metrics"><article><strong>4</strong><span>reading features</span></article><article><strong>3</strong><span>technologies</span></article><article><strong>1</strong><span>integrated concept</span></article></div>';
    impact.setAttribute('aria-labelledby', 'pagelens-impact-heading');
    page.querySelectorAll('.pagelens-stage-copy .mvp-keywords').forEach((node) => node.remove());

    const readingVisual = page.querySelector('.pagelens-reading-visual');
    if (readingVisual) {
      const samples = [...readingVisual.querySelectorAll('.pagelens-reading-sample img')];
      const cards = document.createElement('div');
      cards.className = 'pagelens-problem-cards';
      cards.innerHTML = `
        <article><div><span>Problem 01</span><h3>One fixed page, different needs</h3><p>Dense print and tightly packed lines can make it harder to separate letters and keep a place.</p></div><figure>${samples[0]?.outerHTML || ''}</figure></article>
        <article><div><span>Problem 02</span><h3>The reader does all the adapting</h3><p>A printed page cannot adjust to a reader’s changing needs, leaving them to find support elsewhere.</p></div><figure>${samples[1]?.outerHTML || ''}</figure></article>`;
      const note = document.createElement('p');
      note.className = 'pagelens-simulation-note';
      note.textContent = 'Illustrative simulations only — dyslexia varies from person to person.';
      readingVisual.replaceWith(cards, note);
    }

    nav.innerHTML = '<a href="#problem">Problem</a><a href="#process">Process</a><a href="#concept">Concept</a><a href="#impact">Impact</a><a href="#reflection">Reflection</a>';
    hero.after(nav, problem, process, concept, impact, reflection);
  }

  // One navigation and mobile-demo pattern for every case study. This runs
  // independently of GSAP so chapter indicators also work with reduced motion.
  function prepareSharedCasePresentation() {
    const page = document.querySelector('.case-page');
    if (!page) return;
    const nav = page.querySelector('.case-anchor-nav');
    const impact = page.querySelector('.kb-impact-simple, .bumble-v2-impact, .impress-impact, .pagelens-impact');
    if (nav && impact && ![...nav.querySelectorAll('a')].some((link) => link.textContent.trim() === 'Impact')) {
      if (!impact.id) impact.id = 'impact';
      const link = document.createElement('a');
      link.href = `#${impact.id}`;
      link.textContent = 'Impact';
      const reflectionLink = nav.querySelector('a[href="#reflection"]');
      if (reflectionLink) reflectionLink.before(link);
      else nav.append(link);
    }

    const walkthrough = page.querySelector('.bumble-v2-walkthrough, .impress-walkthrough');
    if (walkthrough && !walkthrough.querySelector('.mobile-walkthrough-panel')) {
      const isBumble = page.classList.contains('bumble-case');
      const phone = walkthrough.querySelector('.mobile-demo-phone, .impress-demo-frame');
      const panel = document.createElement('div');
      panel.className = 'mobile-walkthrough-panel';
      const headingId = isBumble ? 'bumble-walkthrough-heading' : 'impress-walkthrough-heading';
      panel.innerHTML = `<div class="mobile-walkthrough-copy"><span>${isBumble ? 'Bumble × Skill Snack' : 'ImpressChat'}</span><h3 id="${headingId}">Product walkthrough</h3><p>${isBumble ? 'From shared interests to a first conversation.' : 'From a foundation check to learning through structured chat.'}</p></div><div class="mobile-walkthrough-media"></div>`;
      if (phone) panel.querySelector('.mobile-walkthrough-media').append(phone);
      walkthrough.replaceChildren(panel);
    }

    if (nav === currentCaseNavigation) return;
    caseNavigationController?.abort();
    currentCaseNavigation = nav;
    if (!nav) return;
    caseNavigationController = new AbortController();
    const signal = caseNavigationController.signal;
    const entries = [...nav.querySelectorAll('a[href^="#"]')]
      .map((link) => ({ link, section: page.querySelector(link.getAttribute('href')) }))
      .filter(({ section }) => section);
    const activate = (active) => entries.forEach(({ link }) => {
      const selected = link === active;
      link.classList.toggle('is-current', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    let frame = 0;
    const update = () => {
      frame = 0;
      const probe = 48 + nav.offsetHeight + Math.min(120, window.innerHeight * 0.15);
      let active = entries[0]?.link;
      entries.forEach(({ link, section }) => {
        if (section.getBoundingClientRect().top <= probe) active = link;
      });
      activate(active);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    signal.addEventListener('abort', () => cancelAnimationFrame(frame));
    window.addEventListener('scroll', schedule, { passive: true, signal });
    window.addEventListener('resize', schedule, { passive: true, signal });
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      const entry = entries.find((item) => item.link === link);
      if (!entry || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      activate(link);
      history.replaceState(null, '', link.getAttribute('href'));
      window.scrollTo({ top: entry.section.getBoundingClientRect().top + window.scrollY - 48 - nav.offsetHeight, behavior: motionPreference.matches ? 'auto' : 'smooth' });
    }, { capture: true, signal });
    update();
  }

  function buildKbTutorStory(page) {
    if (!page || page.dataset.kbStoryRedesign === 'true') return;
    page.dataset.kbStoryRedesign = 'true';
    page.classList.add('kb-case-redesign');

    const hero = page.querySelector('.case-hero');
    const problem = page.querySelector('.problem-section');
    const impact = page.querySelector('.impact-band');
    const nextProject = page.querySelector('.case-next');
    if (!hero || !problem || !impact || !nextProject) return;

    page.querySelector('.kb-highlight-carousel')?.remove();

    page
      .querySelectorAll(
        '.product-story, .process-section, .decisions-section, .reflection-section, .case-anchor-nav, .kb-story-section, .kb-story-nav, .kb-image-dialog'
      )
      .forEach((node) => node.remove());

    const problemIntro = problem.querySelector('.case-section-intro');
    const problemLabel = problemIntro?.querySelector('.case-section-label');
    setTextIfNeeded(problemLabel, 'Problem');
    if (problemLabel) problemLabel.removeAttribute('id');
    if (problemIntro) {
      problemIntro.querySelector('h2')?.remove();
      problemIntro.querySelector('p:last-of-type')?.remove();
      const problemHeading = document.createElement('h3');
      problemHeading.className = 'kb-section-title';
      problemHeading.id = 'problem-heading';
      problemHeading.textContent = 'Students were preparing for the test, not learning to reason';
      problemLabel?.after(problemHeading);
    }

    const storyNav = document.createElement('nav');
    storyNav.className = 'case-anchor-nav kb-story-nav';
    storyNav.setAttribute('aria-label', 'KB Tutor case study chapters');
    storyNav.innerHTML = `
      <a class="is-current" href="#problem" aria-current="location">Problem</a>
      <a href="#research">Research</a>
      <a href="#design">Design</a>
      <a href="#test">Test</a>
      <a href="#solution">Solution</a>
      <a href="#reflection">Reflection</a>`;

    const story = document.createElement('div');
    story.className = 'kb-story';
    story.innerHTML = `
      <section class="case-section kb-story-section kb-research" id="research" aria-labelledby="kb-research-heading">
        <header class="kb-chapter-heading kb-section-heading kb-story-reveal">
          <p class="case-section-label">Research</p>
          <h3 class="kb-section-title" id="kb-research-heading">We watched how students think.</h3>
          <p class="kb-section-note">Conducted think-aloud sessions with two students and a biology teacher as they solved the same exam-style problem.</p>
        </header>
        <div class="kb-research-carousel kb-story-reveal">
          <div class="kb-research-track" role="list">
          <article class="kb-finding-slide" role="listitem">
            <div class="kb-finding-copy"><span>01</span><h3>Students reused familiar answer patterns even when the question required a different kind of reasoning.</h3><picture class="kb-finding-illustration"><source media="(max-width: 620px)" srcset="/projects/kb-tutor/process/kb-tutor-research-finding-01-mobile.svg?v=1"><img src="/projects/kb-tutor/process/kb-tutor-research-finding-01.svg?v=2" alt="Two different question prompts both receiving the same answer pattern" loading="lazy"></picture><div class="kb-finding-decision"><b>Design response</b><p>Make the reasoning step visible instead of only confirming the final answer.</p></div></div>
            <figure class="kb-research-evidence"><div class="kb-research-evidence-bar" aria-hidden="true"><span>Think-aloud map</span><span>01 / 03</span></div><button class="kb-zoomable" type="button" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-testing-cta-01.png" data-kb-caption="CTA 01 · Reused answer strategies across multipart questions"><img src="/projects/kb-tutor/process/kb-tutor-testing-cta-01.png" alt="Cognitive task analysis showing a student reusing the same answer across multipart questions" loading="lazy"></button></figure>
          </article>
          <article class="kb-finding-slide" role="listitem">
            <div class="kb-finding-copy"><span>02</span><h3>Students struggled to move from an outcome to the biological relationship that could explain it.</h3><picture class="kb-finding-illustration"><source media="(max-width: 620px)" srcset="/projects/kb-tutor/process/kb-tutor-research-finding-02-mobile.svg?v=1"><img src="/projects/kb-tutor/process/kb-tutor-research-finding-02.svg?v=2" alt="A known outcome with a missing causal link back to the biological relationship" loading="lazy"></picture><div class="kb-finding-decision"><b>Design response</b><p>Break complex reasoning into smaller prompts that can be followed and checked.</p></div></div>
            <figure class="kb-research-evidence"><div class="kb-research-evidence-bar" aria-hidden="true"><span>Think-aloud map</span><span>02 / 03</span></div><button class="kb-zoomable" type="button" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-testing-cta-02.png" data-kb-caption="CTA 02 · Reasoning through gradient direction and energy requirements"><img src="/projects/kb-tutor/process/kb-tutor-testing-cta-02.png" alt="Cognitive task analysis showing gradient direction and energy requirements" loading="lazy"></button></figure>
          </article>
          <article class="kb-finding-slide" role="listitem">
            <div class="kb-finding-copy"><span>03</span><h3>Recognizing a term could lead to the right option without a clear explanation of why it was right.</h3><picture class="kb-finding-illustration"><source media="(max-width: 620px)" srcset="/projects/kb-tutor/process/kb-tutor-research-finding-03-mobile.svg?v=1"><img src="/projects/kb-tutor/process/kb-tutor-research-finding-03.svg?v=2" alt="A familiar keyword leading straight to a selected option while the reasoning steps are skipped" loading="lazy"></picture><div class="kb-finding-decision"><b>Design response</b><p>Use hints and feedback to connect vocabulary to cause, relationship, and evidence.</p></div></div>
            <figure class="kb-research-evidence"><div class="kb-research-evidence-bar" aria-hidden="true"><span>Think-aloud map</span><span>03 / 03</span></div><button class="kb-zoomable" type="button" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-testing-cta-03.png" data-kb-caption="CTA 03 · Keyword heuristics compared with constraint-based reasoning"><img src="/projects/kb-tutor/process/kb-tutor-testing-cta-03.png" alt="Cognitive task analysis comparing keyword heuristics with constraint-based reasoning" loading="lazy"></button></figure>
          </article>
          </div>
        </div>
      </section>

      <section class="case-section kb-story-section kb-design" id="design" aria-labelledby="kb-design-heading">
        <header class="kb-chapter-heading kb-chapter-label-only kb-story-reveal">
          <p class="case-section-label" id="kb-design-heading">Design</p>
        </header>

        <article class="kb-design-part kb-story-reveal">
          <div class="kb-part-copy"><span>Part A · Structure</span><h3 class="kb-one-line-heading">We started with four learning modes.</h3></div>
          <div class="kb-mode-stories" aria-label="Four initial learning modes and the students each supported">
            <article class="kb-mode-story">
              <div class="kb-mode-story-copy"><span class="kb-mode-index">01 / 04</span><h4>Guided mode</h4><p class="kb-mode-audience"><span>Designed for</span> students learning a concept for the first time, with underlined terms that open definitions and an expanded glossary beside the question.</p></div>
              <figure class="kb-mode-visual"><div class="kb-mode-screen"><button class="kb-mode-zoom kb-zoomable" type="button" aria-label="Enlarge the early Guided mode screenshot" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-guided-mode-initial.png" data-kb-caption="Early Guided mode · inline terminology definitions and glossary"><img src="/projects/kb-tutor/process/kb-tutor-guided-mode-initial.png" alt="Early Guided mode question with the underlined term plasma membrane and an expanded glossary beside it" loading="lazy"></button><span class="kb-mode-focus kb-mode-focus-guided-glossary" aria-hidden="true"></span><span class="kb-mode-focus kb-mode-focus-guided-term" aria-hidden="true"></span><span class="kb-mode-callout kb-mode-callout-guided-glossary" data-kb-target=".kb-mode-focus-guided-glossary" aria-hidden="true">Glossary</span><span class="kb-mode-callout kb-mode-callout-guided-term" data-kb-target=".kb-mode-focus-guided-term" aria-hidden="true">Underlined definition</span></div><figcaption>Early Guided mode · inline definitions and glossary</figcaption></figure>
            </article>
            <article class="kb-mode-story">
              <div class="kb-mode-story-copy"><span class="kb-mode-index">02 / 04</span><h4>Practice mode</h4><p class="kb-mode-audience"><span>Designed for</span> students ready to answer with less scaffolding: no question index or underlined terminology links. A follow-up question checks their reasoning; the collapsed glossary opens only when they need it.</p></div>
              <figure class="kb-mode-visual"><div class="kb-mode-screen"><button class="kb-mode-zoom kb-zoomable" type="button" aria-label="Enlarge the early Practice mode screenshot" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-practice-mode-initial.png" data-kb-caption="Early Practice mode · follow-up question and optional glossary"><img src="/projects/kb-tutor/process/kb-tutor-practice-mode-initial.png" alt="Early Practice mode showing a follow-up reasoning question and a collapsed glossary that can be opened on demand" loading="lazy"></button><span class="kb-mode-focus kb-mode-focus-practice-glossary" aria-hidden="true"></span><span class="kb-mode-focus kb-mode-focus-practice-followup" aria-hidden="true"></span><span class="kb-mode-callout kb-mode-callout-practice-glossary" data-kb-target=".kb-mode-focus-practice-glossary" aria-hidden="true">Opens on demand</span><span class="kb-mode-callout kb-mode-callout-practice-followup" data-kb-target=".kb-mode-focus-practice-followup" aria-hidden="true">Follow-up question</span></div><figcaption>Early Practice mode · follow-up question and optional glossary</figcaption></figure>
            </article>
            <article class="kb-mode-story">
              <div class="kb-mode-story-copy"><span class="kb-mode-index">03 / 04</span><h4>Exam mode</h4><p class="kb-mode-audience"><span>Designed for</span> students ready to test what they know in a timed attempt, without feedback while they answer.</p></div>
              <figure class="kb-mode-visual"><div class="kb-mode-screen"><button class="kb-mode-zoom kb-zoomable" type="button" aria-label="Enlarge the early Exam mode screenshot" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-exam-mode-initial.png" data-kb-caption="Early Exam mode · timed assessment without in-session feedback"><img src="/projects/kb-tutor/process/kb-tutor-exam-mode-initial.png" alt="Early Exam mode showing the question timer, with no feedback during the attempt" loading="lazy"></button><span class="kb-mode-focus kb-mode-focus-exam" aria-hidden="true"></span><span class="kb-mode-callout kb-mode-callout-exam" data-kb-target=".kb-mode-focus-exam" aria-hidden="true">Timer</span></div><figcaption>Early Exam mode · timed attempt, no feedback while answering</figcaption></figure>
            </article>
            <article class="kb-mode-story">
              <div class="kb-mode-story-copy"><span class="kb-mode-index">04 / 04</span><h4>Review mode</h4><p class="kb-mode-audience"><span>Designed for</span> students returning to questions they previously got wrong, using the same question and feedback flow as Practice.</p></div>
              <figure class="kb-mode-visual"><div class="kb-mode-screen"><button class="kb-mode-zoom kb-zoomable" type="button" aria-label="Enlarge the Review mode screenshot" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-review-mode-initial.png" data-kb-caption="Review mode · Practice-style feedback on a previously missed question"><img src="/projects/kb-tutor/process/kb-tutor-review-mode-initial.png" alt="Review mode revisiting a missed biology question with answer feedback and a collapsed glossary" loading="lazy"></button><span class="kb-mode-focus kb-mode-focus-review" aria-hidden="true"></span><span class="kb-mode-callout kb-mode-callout-review" data-kb-target=".kb-mode-focus-review" aria-hidden="true">Previously missed</span></div><figcaption>Early Review mode · revisiting a missed question</figcaption></figure>
            </article>
          </div>
        </article>

        <article class="kb-design-part kb-design-decision kb-story-reveal">
          <div class="kb-part-copy kb-copy-without-heading"><span>Part B · Usability testing</span><p>Students found Guided too easy and Practice repetitive.</p></div>
          <div class="kb-image-compare" style="--compare-position: 50%; --after-shift: 33%">
            <div class="kb-compare-stage">
              <div class="kb-compare-layer kb-compare-before"><img src="/projects/kb-tutor/process/kb-tutor-learning-modes-before.png" alt="Before: Guided and Practice were separate mode cards" loading="lazy"><span class="kb-compare-tag kb-compare-tag-before" aria-hidden="true">Before</span><span class="kb-compare-highlight kb-compare-old-paths" aria-hidden="true"></span><span class="kb-compare-note kb-compare-note-before" data-kb-target=".kb-compare-old-paths" aria-hidden="true">Two support paths</span></div>
              <div class="kb-compare-layer kb-compare-after"><img src="/projects/kb-tutor/process/kb-tutor-decision-learning-modes.png" alt="After: one Practice mode replaces separate Guided and Practice paths" loading="lazy"><span class="kb-compare-highlight kb-compare-new-practice" aria-hidden="true"></span><span class="kb-compare-note kb-compare-note-after" data-kb-target=".kb-compare-new-practice" aria-hidden="true">One Practice mode</span></div>
              <span class="kb-compare-after-tag-layer" aria-hidden="true"><span class="kb-compare-tag kb-compare-tag-after">After</span></span>
              <div class="kb-compare-divider" aria-hidden="true"><span>‹ ›</span></div>
              <input class="kb-compare-range" type="range" min="0" max="100" value="50" aria-label="Drag to compare the learning modes before and after usability testing" aria-valuetext="50% before design visible">
            </div>
            <p class="kb-compare-meta">Drag the handle to compare</p>
          </div>
          <p class="kb-compare-conclusion"><strong>What changed:</strong> We merged both into one Practice mode with help on demand.</p>
        </article>

        <article class="kb-design-part kb-story-reveal">
          <div class="kb-part-copy"><span>Part C · Prototyping</span><h3 class="kb-one-line-heading">Traditional design, AI-assisted prototyping</h3></div>
          <div class="kb-prototype-carousel">
            <div class="kb-prototype-track" role="list">
              <article class="kb-prototype-card" role="listitem">
                <div><span>Step 01</span><h3>Design in Figma</h3><p>Translate the flow into clear student and teacher interfaces.</p></div>
                <div class="kb-prototype-stack" aria-label="Two overlapping low-fidelity Figma prototype boards">
                  <button class="kb-stack-shot kb-zoomable" type="button" aria-label="Open low-fidelity Figma exploration 01" style="--stack-i:0" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-mvp-01-overview.png" data-kb-caption="Low-fidelity Figma prototype board · Exploration 01"><img src="/projects/kb-tutor/process/kb-tutor-mvp-01-overview.png" alt="Low-fidelity Figma screens exploring the KB Tutor learning flow" loading="lazy"></button>
                  <button class="kb-stack-shot kb-zoomable" type="button" aria-label="Open low-fidelity Figma exploration 02" style="--stack-i:1" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-mvp-01-overview-v2.png" data-kb-caption="Low-fidelity Figma prototype board · Exploration 02"><img src="/projects/kb-tutor/process/kb-tutor-mvp-01-overview-v2.png" alt="Second low-fidelity Figma screen set for KB Tutor" loading="lazy"></button>
                </div>
              </article>
              <article class="kb-prototype-card" role="listitem">
                <div><span>Step 02</span><h3>Build the design system</h3><p>Create reusable patterns so five MVPs could evolve without losing consistency.</p></div>
                <button class="kb-prototype-single kb-zoomable" type="button" aria-label="Open the KB Tutor design-system image" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-mvp-02-color-tokens.png" data-kb-caption="KB Tutor design system · Color tokens"><img src="/projects/kb-tutor/process/kb-tutor-mvp-02-color-tokens.png" alt="KB Tutor design-system documentation showing reusable color tokens" loading="lazy"></button>
              </article>
              <article class="kb-prototype-card" role="listitem">
                <div><span>Step 03</span><h3>Create working prototypes</h3><p>Use functional prototypes to test behavior and clarify implementation with developers.</p></div>
                <div class="kb-prototype-stack is-three" aria-label="Three overlapping working prototype versions">
                  <button class="kb-stack-shot kb-zoomable" type="button" aria-label="Open working prototype version 01" style="--stack-i:0" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-working-prototype-v1.png" data-kb-caption="Working prototype · Version 01"><img src="/projects/kb-tutor/process/kb-tutor-working-prototype-v1.png" alt="First working prototype of the KB Tutor dashboard" loading="lazy"></button>
                  <button class="kb-stack-shot kb-zoomable" type="button" aria-label="Open working prototype version 02" style="--stack-i:1" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-working-prototype-v2.png" data-kb-caption="Working prototype · Version 02"><img src="/projects/kb-tutor/process/kb-tutor-working-prototype-v2.png" alt="Second working prototype of the KB Tutor dashboard" loading="lazy"></button>
                  <button class="kb-stack-shot kb-zoomable" type="button" aria-label="Open working prototype version 03" style="--stack-i:2" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-working-prototype-v3.png" data-kb-caption="Working prototype · Version 03"><img src="/projects/kb-tutor/process/kb-tutor-working-prototype-v3.png" alt="Working prototype of the KB Tutor mock-exam setup" loading="lazy"></button>
                </div>
              </article>
            </div>
          </div>
        </article>
      </section>

      <section class="case-section kb-story-section kb-test" id="test" aria-labelledby="kb-test-heading">
        <header class="kb-chapter-heading kb-section-heading kb-story-reveal">
          <p class="case-section-label">Test</p>
          <h3 class="kb-section-title" id="kb-test-heading">We tested it in real classrooms.</h3>
        </header>
        <div class="kb-test-scene kb-story-reveal">
          <div class="kb-test-scope" aria-label="Classroom testing scope">
            <div class="kb-test-stat"><strong data-kb-count="103">103</strong><span>students tested</span></div>
            <div class="kb-test-stat"><strong data-kb-count="3634">3,634</strong><span>attempts analyzed</span></div>
          </div>
          <figure class="kb-test-team-photo"><img src="/projects/kb-tutor/process/kb-tutor-decision-classroom.png" alt="KB Tutor team with a biology teacher in the classroom" loading="lazy"><figcaption>Our team in the classroom with a biology teacher.</figcaption></figure>
        </div>
        <div class="kb-test-findings">
          <article class="kb-test-story kb-test-review kb-story-reveal" aria-labelledby="kb-test-review-heading">
            <header class="kb-test-story-heading"><span>Finding 01 · Review</span><h4 id="kb-test-review-heading">Review was used less, and revisits were rushed.</h4><p>In Review, students sometimes repeated the same mistake they had made in Practice. Their short first-attempt times suggest they were skimming the question instead of reading it carefully.</p></header>
            <figure class="kb-participation-chart" aria-labelledby="kb-participation-title" aria-describedby="kb-participation-caption">
              <div class="kb-test-chart-heading"><h5 id="kb-participation-title">Who used each mode?</h5><span>Active students · n = 103</span></div>
              <div class="kb-participation-rows" role="img" aria-label="Practice: 103 students, 100 percent. Exam: 60 students, 58 percent. Review: 49 students, 48 percent.">
                <div class="kb-participation-row"><span>Practice</span><div class="kb-participation-track"><i class="kb-participation-fill" style="--bar-width:100%"></i></div><strong>103 <small>100%</small></strong></div>
                <div class="kb-participation-row"><span>Exam</span><div class="kb-participation-track"><i class="kb-participation-fill" style="--bar-width:58%"></i></div><strong>60 <small>58%</small></strong></div>
                <div class="kb-participation-row is-review"><span>Review</span><div class="kb-participation-track"><i class="kb-participation-fill" style="--bar-width:48%"></i></div><strong>49 <small>48%</small></strong></div>
              </div>
              <figcaption id="kb-participation-caption"><b>Fewer than half</b> of active students used Review.</figcaption>
            </figure>
            <div class="kb-test-time" aria-labelledby="kb-test-time-heading">
              <div class="kb-test-time-intro"><span>Time on task</span><h5 id="kb-test-time-heading">The first pass in Review was almost as quick as a retry.</h5></div>
              <div class="kb-test-time-rows">
                <div class="kb-test-time-row"><strong>Practice</strong><div><span><b>25s</b><small>first attempt · median</small></span><i aria-hidden="true">→</i><span><b>5–7s</b><small>retries</small></span></div></div>
                <div class="kb-test-time-row is-review"><strong>Review</strong><div><span><b>6s</b><small>first attempt · median</small></span><i aria-hidden="true">→</i><span><b>~5s</b><small>later attempts</small></span></div></div>
              </div>
              <p>Students spent time on a new Practice question, then sped through retries. In Review, they moved quickly from the very first attempt.</p>
            </div>
          </article>
          <article class="kb-test-story kb-test-teacher kb-story-reveal" aria-labelledby="kb-test-teacher-heading">
            <header class="kb-test-story-heading"><span>Finding 02 · teacher dashboard</span><h4 id="kb-test-teacher-heading">Teachers needed clearer data to decide what to do next.</h4><p>The teacher found the performance-by-standard view useful for identifying topics that needed reteaching. However, she asked how accuracy and status labels were calculated and wanted to examine individual student progress and question performance.</p></header>
            <div class="kb-teacher-evidence">
              <figure class="kb-teacher-screenshot">
                <div class="kb-teacher-screen-pair">
                  <div class="kb-teacher-screen-frame is-standards">
                    <button class="kb-zoomable" type="button" aria-label="Enlarge early teacher dashboard performance-by-standard screenshot" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-teacher-dashboard-early-standards.png" data-kb-caption="Early teacher dashboard · performance by standard"><img src="/projects/kb-tutor/process/kb-tutor-teacher-dashboard-early-standards.png" alt="Early teacher dashboard with performance by standard, correct and accuracy columns, and status labels" loading="lazy"></button>
                    <span class="kb-teacher-marker is-one" aria-hidden="true">01</span>
                    <span class="kb-teacher-marker is-two" aria-hidden="true">02</span>
                    <span class="kb-teacher-marker is-three" aria-hidden="true">03</span>
                  </div>
                </div>
                <figcaption>Early teacher dashboard · select to enlarge</figcaption>
              </figure>
              <ol class="kb-teacher-observations">
                <li><span>01</span><div><h5>What does “correct” measure?</h5><p>The dashboard does not explain whether accuracy reflects the first attempt or the final attempt.</p></div></li>
                <li><span>02</span><div><h5>What makes a standard “on track”?</h5><p>The thresholds behind status labels such as “On track,” “Watch,” and “Struggling” are not visible.</p></div></li>
                <li><span>03</span><div><h5>Who needs support next?</h5><p>The overview identifies weak standards, but does not give the teacher enough student-level history or question-level detail to investigate them.</p></div></li>
              </ol>
            </div>
            <p class="kb-teacher-opportunity"><span>Design opportunity</span>Make performance data easier to interpret and give teachers a path from class-level signals to the students and questions behind them.</p>
          </article>
        </div>
        <section class="kb-followup kb-saq-finding kb-story-reveal" aria-labelledby="kb-saq-finding-heading">
          <p class="kb-saq-round">Follow-up SAQ testing</p>
          <div class="kb-saq-layout"><div class="kb-saq-copy"><p class="kb-saq-intro">After introducing short-answer questions, we conducted follow-up think-aloud sessions with 25 students.</p>
          <header class="kb-test-story-heading"><span>Finding 03 · short-answer responses</span><h4 id="kb-saq-finding-heading">Students could name a concept aloud, but still leave its role unexplained in writing.</h4><p>We examined how students reasoned aloud after receiving feedback and whether that reasoning appeared in their revised written answers. The clearest gap was between recognizing a relevant concept and expressing the explanation the question required.</p></header>
          <p class="kb-saq-insight"><span>Insight</span>Recognizing the right term did not automatically help students turn feedback into a complete explanation.</p></div>
          <figure class="kb-saq-example">
            <figcaption>Paraphrased observation from feedback-method testing.</figcaption>
            <div class="kb-saq-panels">
              <div class="kb-saq-panel"><span class="kb-saq-node" aria-hidden="true">01</span><h5>What the student could say</h5><p>Identified “enzymes” aloud after feedback.</p></div>
              <div class="kb-saq-panel is-needed"><span class="kb-saq-node" aria-hidden="true">02</span><h5>What the answer needed</h5><p>Name enzymes and <mark>explain the function they perform.</mark></p></div>
              <div class="kb-saq-panel"><span class="kb-saq-node" aria-hidden="true">03</span><h5>What appeared in writing</h5><p>The relevant concept was present, but its function was still unexplained.</p></div>
            </div>
          </figure>
          </div>
        </section>
      </section>

      <section class="case-section kb-story-section kb-iterate" id="solution" aria-labelledby="kb-solution-heading">
        <span id="iterate" class="kb-legacy-anchor" aria-hidden="true"></span>
        <header class="kb-chapter-heading kb-section-heading kb-story-reveal">
          <p class="case-section-label">Solution</p>
          <h3 class="kb-section-title" id="kb-solution-heading">We changed what wasn't working.</h3>
        </header>
        <article class="kb-review-iteration kb-story-reveal" aria-labelledby="kb-review-iteration-heading">
          <header class="kb-review-iteration-heading"><span>Solution 01 · Review</span><h4 id="kb-review-iteration-heading">Turning Review into a place to choose the next step</h4></header>
          <div class="kb-review-before">
            <figure class="kb-review-before-figure">
              <span class="kb-review-state">Before · Review Mode</span>
              <button class="kb-zoomable" type="button" aria-label="Enlarge the earlier Review Mode screen" data-kb-zoom="/projects/kb-tutor/process/kb-tutor-review-mode-initial.png" data-kb-caption="Before · Review Mode"><img src="/projects/kb-tutor/process/kb-tutor-review-mode-initial.png" alt="Earlier Review Mode showing a previously missed question and feedback beneath the answer choices" loading="lazy"></button>
              <span class="kb-review-before-pin is-question" aria-hidden="true">01 <span>Same question again</span></span>
              <span class="kb-review-before-pin is-feedback" aria-hidden="true">02 <span>Feedback again</span></span>
              <figcaption class="kb-review-before-key"><span>01 · Same question again</span><span>02 · Feedback again</span></figcaption>
            </figure>
            <div class="kb-review-before-copy"><span>What we saw in MVP3</span><p>In Review, time on task stayed around <strong>5 seconds</strong> across attempts.</p><p>We hypothesized that repeating a question with familiar feedback might not give students a new reason to review. The time data alone cannot establish why students moved quickly.</p></div>
          </div>
          <div class="kb-review-decision"><span>Design decision</span><p>I reframed Review from a separate question mode into a hub for deciding what to revisit.</p><em>From repeating questions to choosing what to revisit.</em></div>
          <div class="kb-review-after">
            <div class="kb-review-after-copy" aria-live="polite" aria-atomic="true">
              <span class="kb-review-state">After · Review Hub</span>
              <span class="kb-review-view-number">01 / 03</span>
              <h5>Missed</h5>
              <p>Return to questions that need another look.</p>
            </div>
            <div class="kb-review-after-demo">
              <div class="kb-review-tabs" role="tablist" aria-label="Review Hub views">
                <button type="button" role="tab" id="kb-review-tab-missed" aria-controls="kb-review-panel" aria-selected="true" data-review-view="missed">Missed</button>
                <button type="button" role="tab" id="kb-review-tab-bookmarked" aria-controls="kb-review-panel" aria-selected="false" tabindex="-1" data-review-view="bookmarked">Bookmarked</button>
                <button type="button" role="tab" id="kb-review-tab-notes" aria-controls="kb-review-panel" aria-selected="false" tabindex="-1" data-review-view="notes">Notes</button>
              </div>
              <div class="kb-review-ipad" role="tabpanel" id="kb-review-panel" aria-labelledby="kb-review-tab-missed" data-view="missed" tabindex="0">
                <span class="kb-review-ipad-camera" aria-hidden="true"></span>
                <div class="kb-review-after-screen"><button class="kb-zoomable" type="button" aria-label="Enlarge the Missed screen" data-kb-zoom="/projects/kb-tutor/showcase/kb-tutor-showcase-review.png" data-kb-caption="After · Review Hub · Missed"><img src="/projects/kb-tutor/showcase/kb-tutor-showcase-review.png" alt="Review Hub Missed tab grouping questions that need another look by biology topic" loading="lazy"></button></div>
              </div>
            </div>
          </div>
        </article>
        <div class="kb-supporting-stories" role="list">
          <article class="kb-iteration-story kb-teacher-solution kb-story-reveal" role="listitem" id="kb-teacher-solution">
            <header class="kb-teacher-solution-heading"><span>Solution 02 · Teacher dashboard</span><h4>From data to teaching action</h4><p>In MVP3 testing, a teacher found the standards view useful for spotting areas to reteach, but needed clearer definitions before interpreting the results. I refined the dashboard to help teachers understand each signal, investigate the questions behind it, and assign follow-up practice.</p></header>
            <div class="kb-teacher-steps">
              <section class="kb-teacher-step" aria-labelledby="kb-teacher-step-01"><div class="kb-teacher-step-copy"><span>01</span><h5 id="kb-teacher-step-01">Make the data interpretable</h5><p>Inline explanations clarify how each metric is calculated and what statuses such as “On track” mean. Teachers can also adjust the status thresholds to fit their classroom expectations.</p></div><div class="kb-final-laptop kb-teacher-device" aria-label="Teacher dashboard standards and metric definitions demonstration in a computer screen"><div class="kb-final-laptop-screen"><video controls muted playsinline preload="metadata" poster="/projects/kb-tutor/media/kb-tutor-teacher-standards-poster.jpg" aria-label="Standards and metric definitions demonstration"><source src="/projects/kb-tutor/media/kb-tutor-teacher-standards.mp4" type="video/mp4"></video></div><div class="kb-final-laptop-base" aria-hidden="true"></div></div></section>
              <section class="kb-teacher-step" aria-labelledby="kb-teacher-step-02"><div class="kb-teacher-step-copy"><span>02</span><h5 id="kb-teacher-step-02">Investigate the evidence</h5><p>Teachers can open a standard to examine its related questions and compare performance with students’ confidence checks. This gives them more context than an aggregate score alone.</p></div><div class="kb-final-laptop kb-teacher-device" aria-label="Question-level evidence demonstration in a computer screen"><div class="kb-final-laptop-screen"><video controls muted playsinline preload="metadata" poster="/projects/kb-tutor/media/kb-tutor-teacher-questions-poster.jpg" aria-label="Question-level evidence demonstration"><source src="/projects/kb-tutor/media/kb-tutor-teacher-questions.mp4" type="video/mp4"></video></div><div class="kb-final-laptop-base" aria-hidden="true"></div></div></section>
              <section class="kb-teacher-step" aria-labelledby="kb-teacher-step-03"><div class="kb-teacher-step-copy"><span>03</span><h5 id="kb-teacher-step-03">Act on what they find</h5><p>After identifying an area that needs support, teachers can assign practice to students. This connects the dashboard’s insights to a concrete next step.</p></div><div class="kb-final-laptop kb-teacher-device" aria-label="Follow-up practice assignment demonstration in a computer screen"><div class="kb-final-laptop-screen"><video controls muted playsinline preload="metadata" poster="/projects/kb-tutor/media/kb-tutor-teacher-assign-poster.jpg" aria-label="Follow-up practice assignment demonstration"><source src="/projects/kb-tutor/media/kb-tutor-teacher-assign.mp4" type="video/mp4"></video></div><div class="kb-final-laptop-base" aria-hidden="true"></div></div></section>
            </div>
          </article>
          <article class="kb-iteration-story kb-note-iteration kb-story-reveal" role="listitem" id="kb-saq-solution">
            <div class="kb-note-copy"><span>Solution 03 · Notes</span><h4>Turning feedback into a revision plan</h4><p>Students could identify a concept aloud, but struggled to turn it into a written explanation. I introduced note-taking between feedback and revision to help them articulate the missing reasoning in their own words. The note space supports metacognitive reflection before revision.</p></div>
            <figure class="kb-note-screen"><button class="kb-zoomable" type="button" aria-label="Enlarge the first note-taking screen" data-kb-zoom="/projects/kb-tutor/showcase/kb-tutor-showcase-teacher-note.png" data-kb-caption="First note-taking screen · guided reflection prompts"><img src="/projects/kb-tutor/showcase/kb-tutor-showcase-teacher-note.png" alt="First note-taking screen with a question and a notes panel asking what to remember, connect, and clarify" loading="lazy"></button><span class="kb-note-highlight" aria-hidden="true"></span><span class="kb-note-pin" aria-hidden="true">Guided prompts</span></figure>
          </article>
        </div>

        <section class="kb-final-experience kb-story-reveal" id="kb-student-solution" aria-labelledby="kb-final-heading">
          <header class="kb-final-heading"><span>Final experience</span><h4 id="kb-final-heading">Built for Keystone Biology practice</h4></header>
          <div class="kb-final-stage">
            <div class="kb-final-stages" aria-label="Explore the student experience">
              <button type="button" class="is-active" aria-pressed="true" data-final-stage="assign"><span>01</span><strong>Start with a goal</strong><small>Assignments make the next step clear.</small></button>
              <button type="button" aria-pressed="false" data-final-stage="practice"><span>02</span><strong>Practice with evidence</strong><small>Graphs and exam-style questions move beyond recall.</small></button>
              <button type="button" aria-pressed="false" data-final-stage="explain"><span>03</span><strong>Explain in writing</strong><small>Multi-part responses build an explanation step by step.</small></button>
              <button type="button" aria-pressed="false" data-final-stage="exam"><span>04</span><strong>Try exam conditions</strong><small>Timed questions bring the assessment format into practice.</small></button>
            </div>
            <div class="kb-final-laptop" aria-label="Student experience screens">
              <div class="kb-final-laptop-screen">
                <img class="is-active" data-final-image="assign" src="/projects/kb-tutor/showcase/kb-tutor-showcase-assignment.png" alt="Student assignments with upcoming work and calendar" loading="lazy">
                <img data-final-image="practice" src="/projects/kb-tutor/cover/kb-tutor-cover-interface.png" alt="Exam-style biology practice question with a graph" loading="lazy" aria-hidden="true">
                <img data-final-image="explain" src="/projects/kb-tutor/showcase/kb-tutor-showcase-saq-question.png" alt="Multi-part short-answer question with evidence and answer fields" loading="lazy" aria-hidden="true">
                <img data-final-image="exam" src="/projects/kb-tutor/showcase/kb-tutor-showcase-mcq-exam.png" alt="Timed multiple-choice question with question navigation" loading="lazy" aria-hidden="true">
              </div><div class="kb-final-laptop-base" aria-hidden="true"></div>
            </div>
          </div>
        </section>

      </section>

      <section class="reflection-section kb-story-section kb-reflection" id="reflection" aria-labelledby="kb-reflection-heading">
        <p class="case-section-label" id="kb-reflection-heading">Reflection</p>
        <ul class="kb-reflection-list">
          <li><strong>01 · Engagement vs. Development Time</strong><span>Students responded positively to gamification, but our timeline required us to prioritize core learning features. We introduced badges and confetti instead of a larger reward system. Next, I’d test whether these lightweight rewards actually improve motivation.</span></li>
          <li><strong>02 · AI Speed vs. Reliability</strong><span>AI helped us build a more capable learning platform, but generated questions and short-answer grading still need further validation. Before scaling, I’d prioritize expert review and compare AI-generated scores with teachers’ grading.</span></li>
        </ul>
      </section>`;

    impact.remove();
    hero.after(storyNav);
    storyNav.after(problem);
    problem.after(...Array.from(story.children));
    page.querySelectorAll('.kb-iterate img').forEach((image) => { image.loading = 'eager'; });
    storyNav.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      const target = page.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      storyNav.querySelectorAll('a').forEach((item) => {
        const isCurrent = item === link;
        item.classList.toggle('is-current', isCurrent);
        if (isCurrent) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
      const offset = 48 + storyNav.getBoundingClientRect().height;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.history.replaceState(null, '', link.getAttribute('href'));
      window.scrollTo({ top, behavior: motionPreference.matches ? 'auto' : 'smooth' });
    });
    const reviewViews = {
      missed: {
        number: '01 / 03', title: 'Missed', description: 'Return to questions that need another look.',
        src: '/projects/kb-tutor/showcase/kb-tutor-showcase-review.png',
        alt: 'Review Hub Missed tab grouping questions that need another look by biology topic'
      },
      bookmarked: {
        number: '02 / 03', title: 'Bookmarked', description: 'Revisit questions students chose to save.',
        src: '/projects/kb-tutor/process/kb-tutor-review-bookmarked.png',
        alt: 'Review Hub Bookmarked tab showing a saved question with its answer and feedback'
      },
      notes: {
        number: '03 / 03', title: 'Notes', description: 'Return to explanations captured in their own words.',
        src: '/projects/kb-tutor/showcase/kb-tutor-showcase-review-notes.png',
        alt: 'Review Hub Notes tab showing saved reflections beside the related question'
      }
    };
    const reviewExplorer = page.querySelector('.kb-review-after');
    if (reviewExplorer) {
      const tabs = [...reviewExplorer.querySelectorAll('[data-review-view]')];
      const panel = reviewExplorer.querySelector('#kb-review-panel');
      const screenButton = panel.querySelector('.kb-zoomable');
      const screenImage = screenButton.querySelector('img');
      const setReviewView = (key, moveFocus = false) => {
        const view = reviewViews[key];
        if (!view) return;
        tabs.forEach((tab) => {
          const selected = tab.dataset.reviewView === key;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          if (selected) {
            panel.setAttribute('aria-labelledby', tab.id);
            if (moveFocus) tab.focus();
          }
        });
        reviewExplorer.querySelector('.kb-review-view-number').textContent = view.number;
        reviewExplorer.querySelector('.kb-review-after-copy h5').textContent = view.title;
        reviewExplorer.querySelector('.kb-review-after-copy p').textContent = view.description;
        screenImage.src = view.src;
        screenImage.alt = view.alt;
        panel.dataset.view = key;
        screenButton.dataset.kbZoom = view.src;
        screenButton.dataset.kbCaption = `After · Review Hub · ${view.title}`;
        screenButton.setAttribute('aria-label', `Enlarge the ${view.title} screen`);
        if (!motionPreference.matches && screenImage.animate) {
          screenImage.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
        }
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => setReviewView(tab.dataset.reviewView));
        tab.addEventListener('keydown', (event) => {
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          else return;
          event.preventDefault();
          setReviewView(tabs[next].dataset.reviewView, true);
        });
      });
      Object.values(reviewViews).slice(1).forEach((view) => { const preload = new Image(); preload.src = view.src; });
    }
    const finalStage = page.querySelector('.kb-final-stage');
    if (finalStage) {
      const stageButtons = [...finalStage.querySelectorAll('[data-final-stage]')];
      const stageImages = [...finalStage.querySelectorAll('[data-final-image]')];
      const setFinalStage = (key) => {
        stageButtons.forEach((button) => {
          const active = button.dataset.finalStage === key;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        stageImages.forEach((image) => {
          const active = image.dataset.finalImage === key;
          image.classList.toggle('is-active', active);
          if (active) image.removeAttribute('aria-hidden');
          else image.setAttribute('aria-hidden', 'true');
        });
      };
      stageButtons.forEach((button) => {
        button.addEventListener('click', () => setFinalStage(button.dataset.finalStage));
        button.addEventListener('focus', () => setFinalStage(button.dataset.finalStage));
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          button.addEventListener('mouseenter', () => setFinalStage(button.dataset.finalStage));
        }
      });
    }
    const annotationGroups = [...page.querySelectorAll('.kb-mode-screen, .kb-compare-layer')]
      .filter((group) => group.querySelector('[data-kb-target]'));
    const svgNS = 'http://www.w3.org/2000/svg';
    const annotationEdges = (rect, toward) => {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = toward.x - centerX;
      const dy = toward.y - centerY;
      const scale = Math.min(
        dx ? rect.width / 2 / Math.abs(dx) : Infinity,
        dy ? rect.height / 2 / Math.abs(dy) : Infinity
      );
      return { x: centerX + dx * scale, y: centerY + dy * scale };
    };
    const drawAnnotationArrows = () => {
      annotationGroups.forEach((group, index) => {
        let svg = group.querySelector(':scope > .kb-annotation-lines');
        if (!svg) {
          svg = document.createElementNS(svgNS, 'svg');
          svg.classList.add('kb-annotation-lines');
          svg.setAttribute('aria-hidden', 'true');
          const marker = document.createElementNS(svgNS, 'marker');
          marker.id = `kb-annotation-tip-${index}`;
          marker.setAttribute('viewBox', '0 0 10 10');
          marker.setAttribute('refX', '9');
          marker.setAttribute('refY', '5');
          marker.setAttribute('markerWidth', '4');
          marker.setAttribute('markerHeight', '4');
          marker.setAttribute('orient', 'auto-start-reverse');
          const tip = document.createElementNS(svgNS, 'path');
          tip.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
          tip.setAttribute('fill', '#0066cc');
          marker.appendChild(tip);
          const defs = document.createElementNS(svgNS, 'defs');
          defs.appendChild(marker);
          svg.appendChild(defs);
          group.appendChild(svg);
        }
        const groupRect = group.getBoundingClientRect();
        if (!groupRect.width || !groupRect.height) return;
        svg.setAttribute('viewBox', `0 0 ${groupRect.width} ${groupRect.height}`);
        svg.querySelectorAll('.kb-annotation-line').forEach((line) => line.remove());
        const localRect = (element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left - groupRect.left, top: rect.top - groupRect.top, width: rect.width, height: rect.height };
        };
        group.querySelectorAll('[data-kb-target]').forEach((tag) => {
          const target = group.querySelector(tag.dataset.kbTarget);
          if (!target) return;
          const tagRect = localRect(tag);
          const targetRect = localRect(target);
          const tagCenter = { x: tagRect.left + tagRect.width / 2, y: tagRect.top + tagRect.height / 2 };
          const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };
          const start = annotationEdges(tagRect, targetCenter);
          const end = annotationEdges(targetRect, tagCenter);
          const pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
          for (const className of ['kb-annotation-line-halo', 'kb-annotation-line-arrow']) {
            const path = document.createElementNS(svgNS, 'path');
            path.classList.add('kb-annotation-line', className);
            path.setAttribute('d', pathData);
            if (className === 'kb-annotation-line-arrow') path.setAttribute('marker-end', `url(#kb-annotation-tip-${index})`);
            svg.appendChild(path);
          }
        });
      });
    };
    drawAnnotationArrows();
    document.fonts?.ready.then(drawAnnotationArrows);
    window.addEventListener('resize', drawAnnotationArrows, { passive: true });
    if ('ResizeObserver' in window) {
      const annotationObserver = new ResizeObserver(drawAnnotationArrows);
      annotationGroups.forEach((group) => annotationObserver.observe(group));
    }
    const compare = page.querySelector('.kb-image-compare');
    const compareRange = compare?.querySelector('.kb-compare-range');
    if (compare && compareRange) {
      const updateCompare = () => {
        const value = Number(compareRange.value);
        compare.style.setProperty('--compare-position', `${value}%`);
        compare.style.setProperty('--after-shift', `${value * .66}%`);
        compareRange.setAttribute('aria-valuetext', `${value}% before design visible`);
      };
      compareRange.addEventListener('input', updateCompare);
      updateCompare();
    }
    const animateWhenVisible = (element, animate) => {
      if (!element || !window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        animate();
      }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
      observer.observe(element);
    };
    const testScene = page.querySelector('.kb-test-scene');
    const testNumbers = [...page.querySelectorAll('.kb-test-stat [data-kb-count]')];
    animateWhenVisible(testScene, () => {
      const progress = { value: 0 };
      testNumbers.forEach((number) => { number.textContent = '0'; });
      window.gsap.to(progress, {
        value: 1,
        duration: 1.45,
        ease: 'power2.out',
        onUpdate: () => testNumbers.forEach((number) => {
          number.textContent = Math.round(Number(number.dataset.kbCount) * progress.value).toLocaleString('en-US');
        }),
        onComplete: () => testNumbers.forEach((number) => {
          number.textContent = Number(number.dataset.kbCount).toLocaleString('en-US');
        }),
      });
    });
    const participationChart = page.querySelector('.kb-participation-chart');
    animateWhenVisible(participationChart, () => {
      window.gsap.fromTo(participationChart.querySelectorAll('.kb-participation-fill'),
        { scaleX: 0 },
        { scaleX: 1, duration: 1.05, stagger: 0.14, ease: 'power2.out', clearProps: 'transform' });
    });
    const saqExample = page.querySelector('.kb-saq-example');
    animateWhenVisible(saqExample, () => {
      window.gsap.from(saqExample.querySelectorAll('.kb-saq-panel'), {
        autoAlpha: 0,
        y: 16,
        duration: .42,
        stagger: .19,
        ease: 'power2.out',
        clearProps: 'opacity,visibility,transform',
      });
    });
    const reviewDecision = page.querySelector('.kb-review-decision');
    animateWhenVisible(reviewDecision, () => {
      window.gsap.from(reviewDecision, { autoAlpha: 0, y: 16, duration: .32, ease: 'power2.out' });
    });
    addHorizontalControls(page.querySelector('.kb-prototype-track'), {
      controlsClass: 'kb-prototype-controls',
      itemSelector: '.kb-prototype-card',
      label: 'Prototyping process',
      previousLabel: 'Show previous prototyping step',
      nextLabel: 'Show next prototyping step',
    });
    const dialog = document.createElement('dialog');
    dialog.className = 'kb-image-dialog';
    dialog.setAttribute('aria-label', 'Expanded case-study image');
    dialog.innerHTML = '<button type="button" aria-label="Close expanded image">×</button><figure><img alt=""><figcaption></figcaption></figure>';
    nextProject.before(dialog);
    const dialogImage = dialog.querySelector('img');
    const dialogCaption = dialog.querySelector('figcaption');
    const closeDialog = () => dialog.close();
    dialog.querySelector('button').addEventListener('click', closeDialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog();
    });
    page.querySelectorAll('[data-kb-zoom]').forEach((button) => {
      button.addEventListener('click', () => {
        dialog.classList.toggle('is-teacher-evidence', Boolean(button.closest('.kb-teacher-screenshot')));
        dialogImage.src = button.dataset.kbZoom;
        dialogImage.alt = button.querySelector('img')?.alt || '';
        dialogCaption.textContent = button.dataset.kbCaption || '';
        dialog.showModal();
      });
    });

    // Keep the CSS fallback visible; the shared GSAP section timelines below
    // now coordinate heading-first reveals across all four case studies.
    page.querySelectorAll('.kb-story-reveal').forEach((item) => item.classList.add('is-visible'));
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
      { label: 'Tools', value: 'Figma · Claude Code · Cursor' }
    ]);
    setParagraphsIfNeeded(
      page.querySelector('.case-lead'),
      [
        'An AI-powered biology learning platform that helps students move beyond memorization and build conceptual understanding.',
        'I led end-to-end product design, using classroom research and five MVP iterations to shape the learning experience.'
      ]
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

        carousel.append(track);
        showcase.after(carousel);
      }
    }

    const impactHeading = page.querySelector('#impact-heading');
    setTextIfNeeded(impactHeading, 'Evidence from a live classroom.');
    const impactLabel = impactHeading?.closest('.impact-band')?.querySelector('.case-section-label');
    if (impactLabel?.textContent.trim().toLowerCase() === 'the impact') impactLabel.remove();

    const problemSection = page.querySelector('.problem-section');
    const problemGrid = problemSection?.querySelector('.problem-grid');
    if (problemGrid && problemGrid.dataset.visualProblems !== 'true') {
      problemGrid.dataset.visualProblems = 'true';
      problemGrid.className = 'kb-problem-board';
      problemGrid.innerHTML = `
        <article class="kb-problem-card kb-problem-evidence" id="kb-problem-01">
          <div class="kb-problem-copy">
            <span class="kb-problem-number">Problem 01</span>
            <h3>No <span class="kb-keep-together">Keystone-specific</span> preparation</h3>
            <p>Students lacked practice designed around the exam’s real format and standards, in a context where more than half were already below proficiency.</p>
          </div>
          <figure class="kb-proficiency-visual" aria-label="50.6 percent of students scored below proficiency on the Keystone Biology benchmark">
            <div class="kb-donut" aria-hidden="true"><div><strong>50.6%</strong><span>below proficiency</span></div></div>
            <figcaption>Keystone Biology benchmark</figcaption>
          </figure>
          <a class="kb-problem-solution" href="#kb-student-solution"><span class="kb-solution-text">See solution</span><span class="kb-solution-arrow" aria-hidden="true">›</span></a>
        </article>
        <article class="kb-problem-card kb-problem-reasoning" id="kb-problem-02">
          <div class="kb-problem-copy">
            <span class="kb-problem-number">Problem 02</span>
            <h3>Answers rewarded recognition, not reasoning</h3>
            <p>Students could map familiar words to an answer choice without understanding the biological relationship behind it.</p>
          </div>
          <div class="kb-state-comparison" aria-label="Comparison between keyword matching and conceptual reasoning">
            <section class="kb-state-card is-current">
              <span>Current state</span>
              <strong>Keyword matching</strong>
              <div class="kb-keyword-map" aria-hidden="true">
                <i>sunlight</i><i>chloroplast</i><i>glucose</i>
                <b>looks familiar → choose B</b>
              </div>
            </section>
            <span class="kb-state-arrow" aria-hidden="true">→</span>
            <section class="kb-state-card is-needed">
              <span>Desired state</span>
              <strong>Explain the relationship</strong>
              <div class="kb-reasoning-flow" aria-hidden="true">
                <i>Light energy</i><b>is converted into</b><i>Chemical energy</i>
                <em>“Glucose stores the energy produced during photosynthesis.”</em>
              </div>
            </section>
          </div>
          <a class="kb-problem-solution" href="#kb-saq-solution"><span class="kb-solution-text">See solution</span><span class="kb-solution-arrow" aria-hidden="true">›</span></a>
        </article>
        <article class="kb-problem-card kb-problem-visibility" id="kb-problem-03">
          <div class="kb-problem-copy">
            <span class="kb-problem-number">Problem 03</span>
            <h3>Scores missed the reasoning.</h3>
            <p>Teachers could see how many students answered correctly, but not the misconception behind an error or who needed intervention next.</p>
          </div>
          <div class="kb-dashboard-comparison" aria-label="Comparison between a score-only teacher dashboard and an insight-led dashboard concept">
            <section class="kb-dashboard-mini is-current">
              <div class="kb-dashboard-bar"><i></i><i></i><i></i><span>Assignment results</span></div>
              <small>Current dashboard</small>
              <strong>68%</strong>
              <p>22 of 32 students correct</p>
              <div class="kb-score-bar" aria-hidden="true"><i></i></div>
            </section>
            <span class="kb-state-arrow" aria-hidden="true">→</span>
            <section class="kb-dashboard-mini is-needed">
              <div class="kb-dashboard-bar"><i></i><i></i><i></i><span>Class insights</span></div>
              <small>Needed dashboard</small>
              <div class="kb-insight-stack">
                <p><b>8 students</b><span>need support now</span></p>
                <p><b>Key misconception</b><span>Energy is created, not transformed</span></p>
                <p><b>Suggested next step</b><span>Review energy transfer in photosynthesis</span></p>
              </div>
            </section>
          </div>
          <a class="kb-problem-solution" href="#kb-teacher-solution"><span class="kb-solution-text">See solution</span><span class="kb-solution-arrow" aria-hidden="true">›</span></a>
        </article>`;

      const visualCards = Array.from(problemGrid.querySelectorAll('.kb-problem-card'));
      visualCards.forEach((card) => {
        const solutionLink = card.querySelector('.kb-problem-solution');
        if (solutionLink) card.querySelector('.kb-problem-copy')?.append(solutionLink);
      });
      const problemStage = document.createElement('div');
      problemStage.className = 'kb-problem-stage';
      const problemLayout = document.createElement('div');
      problemLayout.className = 'kb-problem-layout';
      const problemSteps = document.createElement('nav');
      problemSteps.className = 'kb-problem-steps';
      problemSteps.setAttribute('aria-label', 'Problems');
      problemSteps.innerHTML = visualCards.map((card, index) => `
        <a href="#${card.id}" aria-label="Go to problem ${index + 1}: ${card.querySelector('h3')?.textContent}"${index === 0 ? ' aria-current="step"' : ''}><span class="kb-problem-dot" aria-hidden="true"></span><span class="kb-problem-step-number" aria-hidden="true">0${index + 1}</span></a>`).join('');
      problemSection.insertBefore(problemStage, problemSection.firstChild);
      const problemIntro = problemSection.querySelector('.case-section-intro');
      if (problemIntro) problemStage.append(problemIntro);
      problemStage.append(problemLayout);
      problemLayout.append(problemSteps, problemGrid);
      const stepLinks = Array.from(problemSteps.querySelectorAll('a'));
      let activeProblem = -1;
      const activateProblem = (index) => {
        if (index === activeProblem) return;
        activeProblem = index;
        visualCards.forEach((card, cardIndex) => {
          const isCurrent = cardIndex === index;
          card.classList.toggle('is-current', isCurrent);
          card.setAttribute('aria-hidden', String(!isCurrent));
          card.toggleAttribute('inert', !isCurrent);
          if (isCurrent) card.querySelector('.kb-proficiency-visual')?.classList.add('is-visible');
        });
        stepLinks.forEach((link, linkIndex) => {
          if (linkIndex === index) link.setAttribute('aria-current', 'step');
          else link.removeAttribute('aria-current');
        });
      };
      const updateActiveProblem = () => {
        const pinTop = 100;
        const travel = Math.max(1, problemSection.offsetHeight - problemStage.offsetHeight);
        const traveled = Math.max(0, Math.min(travel, pinTop - problemSection.getBoundingClientRect().top));
        const activeIndex = Math.min(visualCards.length - 1, Math.floor((traveled / travel) * visualCards.length));
        activateProblem(activeIndex);
      };
      let problemFrame = 0;
      const scheduleProblemUpdate = () => {
        if (problemFrame) return;
        problemFrame = requestAnimationFrame(() => {
          problemFrame = 0;
          updateActiveProblem();
        });
      };
      window.addEventListener('scroll', scheduleProblemUpdate, { passive: true });
      window.addEventListener('resize', scheduleProblemUpdate, { passive: true });
      problemSteps.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#kb-problem-"]');
        if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const index = stepLinks.indexOf(link);
        if (index < 0) return;
        event.preventDefault();
        activateProblem(index);
        history.replaceState(null, '', link.getAttribute('href'));
        const travel = Math.max(1, problemSection.offsetHeight - problemStage.offsetHeight);
        const sectionTop = problemSection.getBoundingClientRect().top + window.scrollY;
        const destination = sectionTop - 100 + ((index + 0.5) / visualCards.length) * travel;
        window.scrollTo({ top: destination, behavior: motionPreference.matches ? 'auto' : 'smooth' });
      });
      updateActiveProblem();
    }

    const mvpOneDefaultDescription =
      'As Designer & PM, I focused on understanding the problem before designing the interface. I mapped student needs and technical constraints, translated research into product features, and moved from early flows and wireframes to medium-fidelity prototypes for testing.';

    const processAssets = [
      [
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-01-research-map.png',
          'Research notes mapping how students reason through biology questions',
          'Understand How Students Think',
          'We used Cognitive Task Analysis and think-alouds with students and teachers to uncover where reasoning broke down. Mapping novice and expert task flows revealed three challenges: task-type confusion, weak backward reasoning, and missing decision rules.',
        ],
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-01-overview-v2.png',
          'Low-fidelity wireframes exploring the KB Tutor experience',
          'Shape the Experience',
          'I used low-fidelity wireframes to explore layout, hierarchy, and user flow before investing in visual design.',
        ],
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-01-ai-prototype.png',
          'Medium-fidelity KB Tutor interaction prototype',
          'AI prototype the interaction, not the polish',
          'I used Figma Make to quickly explore interactions and bring the structure to medium fidelity. AI accelerated prototyping, but often generated unnecessary content, reinforcing that more UI isn’t better UI. I used AI to test interaction ideas, not make design decisions for me.',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-02-dashboard-notes.png',
          'Teacher dashboard design exploration',
          'Teacher dashboard exploration',
        ],
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-02-color-tokens.png',
          'KB Tutor color-token documentation',
          'Reusable color system',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-03-metrics.png',
          'Evaluation framework showing the classroom metrics and how each one is measured',
          'Evaluation framework',
        ],
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-03-participation.png',
          'Student participation across practice, exam, and review modes',
          'Participation across modes',
        ],
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-03-outcomes.png',
          'Student answer outcomes showing corrected responses after scaffolded feedback',
          'Scaffolding outcomes',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-04-saq-flow.png',
          'End-to-end short-answer practice, exam, and review flow map',
          'Short-answer experience flow',
        ],
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-04-notes.png',
          'Short-answer practice interface with a highlighted prompt and staged responses',
          'Short-answer practice',
        ],
      ],
      [
        [
          '/projects/kb-tutor/process/kb-tutor-mvp-05-presentation.jpg',
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
      '/projects/kb-tutor/media/kb-tutor-saq-feedback-poster.jpg',
      '/projects/kb-tutor/media/kb-tutor-teacher-dashboard-poster.jpg',
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
    buildKbTutorStory(page);
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
    const nextRoot = document.querySelector('.case-page') || document.body;
    if (!force && activeContext && activeMotionRoot === nextRoot && progressIndicator?.isConnected && activePath === nextPath && activeDesktopState === nextDesktopState) return;

    if (activeContext) activeContext.revert();
    if (progressIndicator) progressIndicator.remove();

    activePath = nextPath;
    activeMotionRoot = nextRoot;
    activeDesktopState = nextDesktopState;
    document.documentElement.classList.toggle('motion-reduced', motionPreference.matches);
    document.documentElement.classList.toggle('motion-enhanced', !motionPreference.matches);

    if (motionPreference.matches) {
      activeContext = null;
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
      const casePage = document.querySelector('.case-page');
      const isVisibleCaseContent = (element) => {
        if (!casePage || !element) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.top < window.innerHeight && bounds.bottom > 0;
      };

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

      // Project titles stay visible on navigation instead of fading out and flashing back in.
      const heroItems = gsap.utils.toArray(
        '.page-hero > *, .about-hero-copy > *, .about-portrait'
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
          if (heading.closest('.bumble-iteration-v2, .impress-refined, .pagelens-story-v2, .kb-case-redesign')) return;
          if (isVisibleCaseContent(heading)) return;
          gsap.from(heading.children, {
            autoAlpha: 0,
            y: isDesktop ? 12 : 8,
            duration: 0.85,
            stagger: { amount: 0.06 },
            ease: 'sine.out',
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
          if (container.closest('.bumble-iteration-v2, .impress-refined, .pagelens-story-v2, .kb-case-redesign')) return;
          if (isVisibleCaseContent(container)) return;
          const items = gsap.utils.toArray(container.querySelectorAll(itemSelector));
          if (!items.length) return;
          groupIndex += 1;
          gsap.from(items, {
            autoAlpha: 0,
            y: isDesktop ? 16 : 10,
            duration: 0.9,
            stagger: { amount: 0.12 },
            ease: 'sine.out',
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

      // Headings lead by only a moment, with content joining the same reveal
      // instead of waiting for the heading animation to finish.
      const caseRevealPlans = [
        ['.bumble-v2-problem', '.bumble-v2-section-heading', '.bumble-v2-problem-grid'],
        ['#bumble-research', '.bumble-v2-section-heading', '.bumble-v2-carousel'],
        ['.bumble-v2-impact', '.bumble-v2-impact-summary > .case-section-label', '.bumble-v2-impact-metrics, .mobile-walkthrough-panel'],
        ['.impress-problem', '.case-section-intro', '.impress-learning-loops'],
        ['.impress-process', '.case-section-intro', '.mvp-timeline, .mvp-process-controls'],
        ['.impress-highlights', '.case-section-intro', '.impress-highlight-carousel'],
        ['.impress-impact', '.impress-impact-summary > .case-section-label', '.impress-impact-metrics, .mobile-walkthrough-panel'],
        ['.pagelens-problem', '.case-section-intro', '.pagelens-problem-cards, .pagelens-simulation-note'],
        ['.pagelens-process', '.case-section-intro', '.pagelens-timeline, .mvp-process-controls'],
        ['.pagelens-product', '.case-section-intro', '.pagelens-demo-grid, .pagelens-concept-film'],
        ['.pagelens-impact', '.pagelens-impact-heading', '.pagelens-impact-metrics'],
        ['.kb-research', '.kb-chapter-heading', '.kb-research-carousel'],
        ['.kb-design', '.kb-chapter-heading', '.kb-design-part'],
      ];

      caseRevealPlans.forEach(([sectionSelector, headingSelector, contentSelector], index) => {
        document.querySelectorAll(sectionSelector).forEach((section, sectionIndex) => {
          if (section.classList.contains('impress-vertical-journey')) return;
          if (isVisibleCaseContent(section)) return;
          // A chapter already above a deep link needs no entrance tween. Creating
          // one there can immediately dispose its trigger during initialization.
          if (section.closest('.kb-case-redesign') && section.getBoundingClientRect().bottom < 0) return;
          const heading = section.querySelector(headingSelector);
          const headingItems = heading ? [heading] : [];
          const contentItems = gsap.utils.toArray(section.querySelectorAll(contentSelector));
          if (!headingItems.length && !contentItems.length) return;

          const revealTimeline = gsap.timeline({
            defaults: { ease: 'sine.out' },
            scrollTrigger: {
              id: `portfolio-case-section-${index}-${sectionIndex}`,
              trigger: section,
              start: enterStart,
              once: true,
            },
          });

          if (headingItems.length) {
            revealTimeline.from(headingItems, {
              autoAlpha: 0,
              y: isDesktop ? 12 : 8,
              duration: 0.85,
              clearProps: clearMotionStyles,
            });
          }
          if (contentItems.length) {
            revealTimeline.from(contentItems, {
              autoAlpha: 0,
              y: isDesktop ? 16 : 10,
              duration: 0.9,
              stagger: { amount: 0.08 },
              clearProps: clearMotionStyles,
            }, headingItems.length ? 0.08 : 0);
          }
        });
      });

      const donut = document.querySelector('.bumble-v2-donut');
      if (donut) gsap.fromTo(donut, { '--donut-sweep': '0%' }, {
        '--donut-sweep': '40%', duration: 1.15, ease: 'power2.out',
        scrollTrigger: { id: 'portfolio-bumble-donut', trigger: donut, start: 'top 78%', once: true },
      });
      gsap.utils.toArray('.impress-loop-flow').forEach((flow, index) => {
        if (isVisibleCaseContent(flow)) return;
        gsap.from(flow.querySelectorAll('.impress-loop-step'), {
          autoAlpha: 0, y: 16, duration: 0.55, stagger: 0.12, clearProps: clearMotionStyles,
          scrollTrigger: { id: `portfolio-learning-loop-${index}`, trigger: flow, start: enterStart, once: true },
        });
      });

      gsap.utils.toArray('.decision-block').forEach((block, index) => {
        if (isVisibleCaseContent(block)) return;
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
        if (usesDedicatedDecisionReveal || block.closest('.pagelens-story-v2')) return;

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

      gsap.utils.toArray('.reflection-section, .case-next, .closing').forEach((section, index) => {
        if (isVisibleCaseContent(section)) return;
        gsap.from(section.children, {
          autoAlpha: 0,
          y: isDesktop ? 12 : 8,
          duration: 0.85,
          stagger: { amount: 0.08 },
          ease: 'sine.out',
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
  // Hash navigation should not hide and replay content that already appeared.
  window.addEventListener('popstate', () => window.setTimeout(() => mountMotionSystem(), 0));

  function initializePortfolioEnhancements() {
    if (document.documentElement.dataset.portfolioInitialized === 'true') return;
    document.documentElement.dataset.portfolioInitialized = 'true';

    ensureMoonFavicon();
    const faviconObserver = new MutationObserver(ensureMoonFavicon);
    faviconObserver.observe(document.head, { childList: true });

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
      prepareSharedCasePresentation();
      const motionRoot = document.querySelector('.case-page') || document.body;
      if (window.location.pathname !== activePath || activeMotionRoot !== motionRoot || (!motionPreference.matches && !progressIndicator?.isConnected)) {
        window.requestAnimationFrame(() => mountMotionSystem());
      }
    });
    pageObserver.observe(document.body, { childList: true, subtree: true });

    ensureAiDesignNavigation();
    ensureHomepageNavigation();
    prepareCaseStudyContent();
    prepareSharedCasePresentation();
    mountMotionSystem();

    const initialKbHash = window.location.hash;
    if (window.location.pathname.startsWith('/projects/kb-tutor') && /^#(?:problem|kb-problem-0[1-3])$/.test(initialKbHash)) {
      const alignInitialProblem = () => {
        const section = document.getElementById('problem');
        const stage = section?.querySelector('.kb-problem-stage');
        if (!section || !stage) return;
        const index = initialKbHash === '#problem' ? -1 : Number(initialKbHash.slice(-1)) - 1;
        const travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
        const sectionTop = section.getBoundingClientRect().top + window.scrollY;
        const offset = index < 0 ? 0 : ((index + 0.5) / 3) * travel;
        const previousBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo({ top: sectionTop - 100 + offset, behavior: 'auto' });
        document.documentElement.style.scrollBehavior = previousBehavior;
      };
      const scheduleAlignment = () => window.setTimeout(alignInitialProblem, 0);
      if (document.readyState === 'complete') scheduleAlignment();
      else window.addEventListener('load', scheduleAlignment, { once: true });
    } else if (window.location.pathname.startsWith('/projects/kb-tutor') && /^#(?:kb-(?:student|saq|teacher)-solution|kb-saq-finding-heading|research|design|test|solution|iterate|reflection)$/.test(initialKbHash)) {
      const alignInitialSection = () => {
        const target = document.getElementById(initialKbHash.slice(1));
        if (!target) return;
        const previousBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 128, behavior: 'auto' });
        document.documentElement.style.scrollBehavior = previousBehavior;
      };
      const scheduleAlignment = () => window.setTimeout(alignInitialSection, 0);
      if (document.readyState === 'complete') scheduleAlignment();
      else window.addEventListener('load', scheduleAlignment, { once: true });
    }
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
