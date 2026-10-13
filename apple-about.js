(() => {
  const map = document.querySelector('.education-map');
  const pins = map ? [...map.querySelectorAll('.education-map-pin')] : [];
  const photo = map?.querySelector('.education-photo');
  const photoImage = photo?.querySelector('img');
  const photoCaption = photo?.querySelector('figcaption');
  let selectedPhoto = null;

  const showPhoto = (index) => {
    const button = pins[index]?.querySelector('button');
    if (!button || !photo) return;
    if (window.matchMedia('(max-width: 1068px)').matches) pins[index].after(photo);
    else map.append(photo);
    photoImage.src = button.dataset.photo;
    photoImage.alt = button.dataset.photoAlt;
    photoCaption.textContent = button.querySelector('strong').textContent;
    photo.dataset.stop = String(index);
    photo.hidden = false;
    pins.forEach((pin, pinIndex) => {
      pin.classList.toggle('is-preview', pinIndex === index);
      pin.querySelector('button').setAttribute('aria-expanded', String(pinIndex === index));
    });
  };

  const hidePhoto = () => {
    if (!photo) return;
    photo.hidden = true;
    pins.forEach((pin) => {
      pin.classList.remove('is-preview');
      pin.querySelector('button').setAttribute('aria-expanded', 'false');
    });
  };

  pins.forEach((pin, index) => {
    const button = pin.querySelector('button');
    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') showPhoto(index);
    });
    button.addEventListener('pointerleave', () => {
      if (selectedPhoto === null) hidePhoto();
      else showPhoto(selectedPhoto);
    });
    button.addEventListener('focus', () => showPhoto(index));
    button.addEventListener('blur', () => {
      if (selectedPhoto === null) hidePhoto();
      else showPhoto(selectedPhoto);
    });
    button.addEventListener('click', () => {
      selectedPhoto = selectedPhoto === index ? null : index;
      if (selectedPhoto === null) hidePhoto();
      else showPhoto(selectedPhoto);
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (selectedPhoto === null || map?.contains(event.target)) return;
    selectedPhoto = null;
    hidePhoto();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    selectedPhoto = null;
    hidePhoto();
  });

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
    ...document.querySelectorAll('.about-section-kicker'),
    ...document.querySelectorAll('.journey-stop'),
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

  if (!map) return;

  const segments = [...map.querySelectorAll('.education-route-segment')];
  const plane = map.querySelector('.education-plane');
  const mapStops = [...map.querySelectorAll('.education-map-stop')];
  const setActiveStop = (index) => {
    mapStops.forEach((stop, stopIndex) => stop.classList.toggle('is-active', stopIndex === index));
  };

  const placePlane = (path, distance) => {
    const length = path.getTotalLength();
    const point = path.getPointAtLength(Math.min(distance, length));
    const nearby = path.getPointAtLength(Math.min(distance + 1, length));
    const before = path.getPointAtLength(Math.max(distance - 1, 0));
    const angle = Math.atan2(nearby.y - before.y, nearby.x - before.x) * 180 / Math.PI;
    plane.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  };

  segments.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });
  setActiveStop(0);

  const flight = gsap.timeline({ paused: true });
  segments.forEach((path, index) => {
    const length = path.getTotalLength();
    const position = { distance: 0 };
    flight.call(() => {
      plane.style.opacity = '1';
      placePlane(path, 0);
    });
    flight.to(position, {
      distance: length,
      duration: index === 1 ? 1.85 : index === 0 ? 1.35 : 0.9,
      ease: 'power1.inOut',
      onUpdate: () => {
        path.style.strokeDashoffset = String(length - position.distance);
        placePlane(path, position.distance);
      },
      onComplete: () => setActiveStop(index + 1)
    });
  });
  flight.to(plane, { opacity: 0, duration: 0.28 });

  const mapObserver = new IntersectionObserver((entries, currentObserver) => {
    if (!entries[0].isIntersecting) return;
    flight.play();
    currentObserver.disconnect();
  }, { threshold: 0.28 });
  mapObserver.observe(map);
})();
