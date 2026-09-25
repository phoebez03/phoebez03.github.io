(() => {
  'use strict';

  let stage = null;
  let motionCleanup = null;
  let routeObserver = null;
  let syncTimer = null;

  const markup = `
    <section class="home-story" aria-label="Introduction">
      <div class="home-story-pin">
        <div class="home-story-scenes">
          <div class="home-statement home-statement--hello" data-home-step="0">
            <p>Hi, I am Phoebe Zhang!</p>
          </div>
          <div class="home-statement home-statement--role" data-home-step="1">
            <p>I am a UX/Product Designer.<br>Study @ CMU HCII</p>
          </div>
          <div class="home-statement home-statement--purpose" data-home-step="2">
            <p>I design learning-centered, AI-augmented, human-centered experiences.</p>
          </div>
        </div>
        <div class="home-story-ui" aria-hidden="true">
          <span class="home-story-count">01 / 03</span>
          <span class="home-story-dots"><i class="is-current"></i><i></i><i></i></span>
          <span class="home-scroll-cue">Scroll <span>↓</span></span>
        </div>
      </div>
    </section>
    <section class="home-architecture" aria-labelledby="home-architecture-title">
      <div class="home-architecture-inner">
        <div class="home-architecture-heading">
          <span>How I think</span>
          <h2 id="home-architecture-title">A practice built in layers.</h2>
        </div>
        <div class="home-capability-stack" aria-label="Phoebe's design practice">
          <button class="home-capability-layer home-capability-layer--research" type="button">
            <b>01</b><span>Research</span><small>Understand people and context.</small>
          </button>
          <button class="home-capability-layer home-capability-layer--product" type="button">
            <b>02</b><span>Product Thinking</span><small>Frame the right problem.</small>
          </button>
          <button class="home-capability-layer home-capability-layer--collaboration" type="button">
            <b>03</b><span>Collaboration</span><small>Build clearly with others.</small>
          </button>
          <button class="home-capability-layer home-capability-layer--ai" type="button">
            <b>04</b><span>Playground</span><small>Prototype with judgment.</small>
          </button>
          <button class="home-capability-layer home-capability-layer--craft" type="button">
            <b>05</b><span>Interaction &amp; Craft</span><small>Make it clear and usable.</small>
          </button>
        </div>
        <p class="home-architecture-note">Each layer supports the next—from understanding the problem to shaping the final interaction.</p>
      </div>
    </section>`;

  function setActiveStep(step) {
    if (!stage) return;
    const count = stage.querySelector('.home-story-count');
    const dots = stage.querySelectorAll('.home-story-dots i');
    const statements = stage.querySelectorAll('.home-statement');
    if (count) count.textContent = `0${step + 1} / 03`;
    dots.forEach((dot, index) => dot.classList.toggle('is-current', index === step));
    statements.forEach((statement, index) => statement.setAttribute('aria-hidden', String(index !== step)));
  }

  function clamp(value) {
    return Math.min(1, Math.max(0, value));
  }

  function ease(start, end, value) {
    const progress = clamp((value - start) / (end - start));
    return progress * progress * (3 - 2 * progress);
  }

  function buildMotion() {
    if (!stage || motionCleanup) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) {
      stage.querySelectorAll('.home-statement').forEach((statement) => statement.removeAttribute('aria-hidden'));
      return;
    }

    const story = stage.querySelector('.home-story');
    const statements = [...stage.querySelectorAll('.home-statement')];
    const cue = stage.querySelector('.home-scroll-cue');
    const architecture = stage.querySelector('.home-architecture');
    const headingItems = [...stage.querySelector('.home-architecture-heading').children];
    const layers = [...stage.querySelectorAll('.home-capability-layer')];
    const note = stage.querySelector('.home-architecture-note');
    let storyTarget = 0;
    let storyProgress = 0;
    let architectureTarget = 0;
    let architectureProgress = 0;
    let frame = 0;

    story.classList.add('is-animated');
    setActiveStep(0);

    function show(element, opacity, y) {
      element.style.opacity = opacity.toFixed(3);
      element.style.visibility = opacity < 0.015 ? 'hidden' : 'visible';
      element.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    }

    function renderStory(progress) {
      const firstExit = ease(0.14, 0.29, progress);
      const secondEnter = ease(0.23, 0.37, progress);
      const secondExit = ease(0.49, 0.64, progress);
      const thirdEnter = ease(0.58, 0.74, progress);

      show(statements[0], 1 - firstExit, -42 * firstExit);
      show(statements[1], secondEnter * (1 - secondExit), 44 * (1 - secondEnter) - 42 * secondExit);
      show(statements[2], thirdEnter, 44 * (1 - thirdEnter));
      if (cue) cue.style.opacity = String(1 - ease(0.02, 0.17, progress));
      setActiveStep(progress < 0.29 ? 0 : progress < 0.65 ? 1 : 2);
    }

    function renderArchitecture(progress) {
      const headingProgress = ease(0, 0.22, progress);
      headingItems.forEach((item, index) => show(item, ease(index * 0.04, 0.18 + index * 0.04, progress), 24 * (1 - headingProgress)));

      layers.forEach((layer, index) => {
        const layerProgress = ease(0.12 + index * 0.13, 0.35 + index * 0.13, progress);
        layer.style.opacity = layerProgress.toFixed(3);
        layer.style.visibility = layerProgress < 0.015 ? 'hidden' : 'visible';
        layer.style.setProperty('--reveal-y', `${(-78 * (1 - layerProgress)).toFixed(2)}px`);
        layer.style.setProperty('--reveal-rotate', `${(-8 * (1 - layerProgress)).toFixed(2)}deg`);
      });

      const noteProgress = ease(0.77, 0.96, progress);
      show(note, noteProgress, 18 * (1 - noteProgress));
    }

    function measure() {
      const storyDistance = Math.max(1, story.offsetHeight - window.innerHeight);
      storyTarget = clamp((window.scrollY - story.offsetTop) / storyDistance);
      const architectureTop = architecture.getBoundingClientRect().top;
      architectureTarget = clamp((window.innerHeight * 0.84 - architectureTop) / (window.innerHeight * 0.9));
    }

    function tick() {
      storyProgress += (storyTarget - storyProgress) * 0.16;
      architectureProgress += (architectureTarget - architectureProgress) * 0.14;
      renderStory(storyProgress);
      renderArchitecture(architectureProgress);

      if (Math.abs(storyTarget - storyProgress) > 0.001 || Math.abs(architectureTarget - architectureProgress) > 0.001) {
        frame = requestAnimationFrame(tick);
      } else {
        storyProgress = storyTarget;
        architectureProgress = architectureTarget;
        renderStory(storyProgress);
        renderArchitecture(architectureProgress);
        frame = 0;
      }
    }

    function update() {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    }

    renderStory(0);
    renderArchitecture(0);
    statements[0].animate(
      [{ opacity: 0, transform: 'translate3d(0, 24px, 0)' }, { opacity: 1, transform: 'translate3d(0, 0, 0)' }],
      { duration: 820, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    motionCleanup = () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame) cancelAnimationFrame(frame);
      motionCleanup = null;
    };
  }

  function addLayerInteractions() {
    stage.querySelectorAll('.home-capability-layer').forEach((layer) => {
      layer.addEventListener('click', () => {
        stage.querySelectorAll('.home-capability-layer').forEach((item) => item.classList.toggle('is-open', item === layer));
      });
    });
  }

  function destroy() {
    if (motionCleanup) motionCleanup();
    if (stage) stage.remove();
    stage = null;
    document.body.classList.remove('homepage-immersive-mounted');
  }

  function mount() {
    if (window.location.pathname !== '/') {
      if (stage) destroy();
      return;
    }

    // The exported app can replace its initial DOM during hydration. Release
    // listeners from that detached copy before mounting the live homepage.
    if (stage && !stage.isConnected) {
      if (motionCleanup) motionCleanup();
      stage = null;
    }

    const legacyHero = document.querySelector('main > .hero:not(.home-immersive)');
    if (!legacyHero || stage?.isConnected) return;

    stage = document.createElement('section');
    stage.className = 'hero home-immersive';
    stage.id = 'top';
    stage.innerHTML = markup;
    legacyHero.removeAttribute('id');
    legacyHero.before(stage);
    document.body.classList.add('homepage-immersive-mounted');
    addLayerInteractions();
    buildMotion();
  }

  function scheduleMount() {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(mount, 40);
  }

  window.addEventListener('load', mount, { once: true });
  window.addEventListener('pageshow', scheduleMount);
  window.addEventListener('popstate', scheduleMount);

  routeObserver = new MutationObserver(scheduleMount);
  routeObserver.observe(document.body, { childList: true, subtree: true });
})();
