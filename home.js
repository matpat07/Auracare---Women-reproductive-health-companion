/* AuraCare: dependency-free motion islands and explicit interaction state.
   No health data is created here. All destinations use existing app routes. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const controller = new AbortController();
  const disposers = [];
  const listen = (element, event, handler, options = {}) => {
    element.addEventListener(event, handler, { ...options, signal: controller.signal });
  };
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Ephemeral UI still works. */ } }
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const preference = { paused: storage.get('aura_motion') === 'paused' };
  const motion = { enabled: false, visible: !document.hidden };
  const motionSubscribers = new Set();
  const themeSubscribers = new Set();
  const onMotion = fn => { motionSubscribers.add(fn); return () => motionSubscribers.delete(fn); };

  // Theme: initialize before painting in HTML, then synchronize accessible controls.
  let explicitTheme = ['light', 'dark'].includes(storage.get('aura_theme'));
  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    $('#themeToggle').setAttribute('aria-pressed', String(dark));
    $('#themeToggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    $('meta[name="theme-color"]').content = dark ? '#19191e' : '#f7f7f4';
    themeSubscribers.forEach(fn => fn());
  }
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  listen($('#themeToggle'), 'click', () => {
    explicitTheme = true;
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    storage.set('aura_theme', theme);
    setTheme(theme);
  });
  listen(systemTheme, 'change', event => { if (!explicitTheme) setTheme(event.matches ? 'dark' : 'light'); });

  function syncMotion() {
    motion.enabled = !reduced.matches && !preference.paused;
    root.dataset.motion = motion.enabled ? 'on' : 'off';
    const toggle = $('#motionToggle');
    toggle.hidden = false;
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-pressed', String(!motion.enabled));
    $('#motionLabel').textContent = reduced.matches ? 'Reduced motion' : (preference.paused ? 'Resume motion' : 'Pause motion');
    toggle.setAttribute('aria-label', reduced.matches ? 'Motion disabled by your system preference' : (preference.paused ? 'Resume decorative motion' : 'Pause decorative motion'));
    motionSubscribers.forEach(fn => fn());
  }
  listen($('#motionToggle'), 'click', () => {
    preference.paused = !preference.paused;
    storage.set('aura_motion', preference.paused ? 'paused' : 'on');
    syncMotion();
  });
  listen(reduced, 'change', syncMotion);

  // A single observer reveals structural blocks once. The HTML stays visible if
  // JS/IntersectionObserver is unavailable or the user changes motion settings.
  const revealElements = $$('[data-reveal]');
  let revealObserver = null;
  function setupReveals() {
    revealObserver?.disconnect();
    revealObserver = null;
    if (!motion.enabled || !('IntersectionObserver' in window)) {
      revealElements.forEach(el => { el.classList.remove('reveal-ready'); el.classList.add('is-visible'); });
      return;
    }
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    revealElements.forEach(el => {
      if (el.classList.contains('is-visible')) return;
      el.classList.add('reveal-ready');
      revealObserver.observe(el);
    });
  }
  onMotion(setupReveals);
  disposers.push(() => revealObserver?.disconnect());

  // Bounded liquid material. Only the 350px decorative SVG is displaced, never
  // text, links or hit areas. A canceled transition retargets from its current d.
  class FluidSurface {
    constructor(panel) {
      this.panel = panel;
      this.path = panel.querySelector('.fluid-blob');
      this.displacement = panel.querySelector('feDisplacementMap');
      this.base = [160, 25, 235, 15, 300, 77, 295, 155, 305, 232, 240, 300, 160, 295, 77, 305, 15, 235, 25, 160, 15, 85, 80, 15, 160, 25];
      this.current = this.base.slice();
      this.frame = null;
      this.contentAnimation = null;
      onMotion(() => { if (!motion.enabled) this.stop(); });
    }
    pathData(values) {
      const v = values.map(n => n.toFixed(2));
      return `M${v[0]} ${v[1]}C${v.slice(2, 8).join(' ')}C${v.slice(8, 14).join(' ')}C${v.slice(14, 20).join(' ')}C${v.slice(20, 26).join(' ')}Z`;
    }
    stop() {
      cancelAnimationFrame(this.frame);
      this.frame = null;
      this.displacement.setAttribute('scale', '0');
      this.contentAnimation?.cancel();
      this.contentAnimation = null;
    }
    shift(seed, content = null) {
      this.stop();
      const from = this.current.slice();
      const to = this.base.map((value, i) => value + Math.sin(seed * 1.7 + i * .85) * (i % 2 ? 14 : 11));
      // Close the path cleanly after every shape change.
      to[24] = to[0]; to[25] = to[1];
      if (!motion.enabled || !motion.visible) {
        this.current = to;
        this.path.setAttribute('d', this.pathData(to));
        return;
      }
      if (content?.animate) {
        this.contentAnimation = content.animate([
          { opacity: .65, transform: 'translateY(7px) scale(.99)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 250, easing: 'cubic-bezier(.23,1,.32,1)' });
      }
      const started = performance.now();
      const tick = now => {
        const progress = clamp((now - started) / 280, 0, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        this.current = from.map((value, i) => value + (to[i] - value) * ease);
        this.path.setAttribute('d', this.pathData(this.current));
        this.displacement.setAttribute('scale', (Math.sin(progress * Math.PI) * 15).toFixed(2));
        if (progress < 1) this.frame = requestAnimationFrame(tick);
        else { this.frame = null; this.displacement.setAttribute('scale', '0'); }
      };
      this.frame = requestAnimationFrame(tick);
    }
  }
  const chapterFluid = new FluidSurface($('#chapterPanel'));
  const breathFluid = new FluidSurface($('#breathPanel'));
  disposers.push(() => chapterFluid.stop(), () => breathFluid.stop());

  // Chapter carousel: a recycled, accessible slide with directional transitions.
  const chapters = [
    { key: 'teen', label: 'A GENTLE BEGINNING', title: ['Big questions.', 'A safe place to start.'], description: 'Get to know your changing body with simple explainers, first-period essentials, and reassurance at your own pace.', color: 'pink' },
    { key: 'pcos', label: 'GET TO KNOW YOUR PATTERNS', title: ['Your patterns.', 'Your own story.'], description: 'Keep track of cycle changes, skin, and energy. Bring what you notice, and your questions, to a conversation with your clinician.', color: 'mint' },
    { key: 'pregnancy', label: 'ROOM FOR A NEW BEGINNING', title: ['A new chapter.', 'Care along the way.'], description: 'Keep appointments, questions, and milestones together. A calm little companion for your own pregnancy journey.', color: 'peach' },
    { key: 'menopause', label: 'CHANGE, WITH SUPPORT', title: ['Still you.', 'A different rhythm.'], description: 'Make space for changes in sleep, mood, and symptoms. Keep notes on what you notice and what you want to ask.', color: 'lavender' }
  ];
  const tabs = $$('[data-chapter]');
  $('.chapter-tabs').hidden = false;
  $('#chapterControls').hidden = false;
  let chapterIndex = 0;
  let chapterTimer = null, chapterPlaying = true, chapterHovered = false;
  let chapterFocused = false, chapterInView = false, chapterAnimation = null;
  let chapterActive = true;
  const chapterCarousel = $('#chapterCarousel');
  function scheduleChapters() {
    clearTimeout(chapterTimer); chapterTimer = null;
    const allowed = motion.enabled && chapterActive && !document.hidden;
    $('#chapterPlay').disabled = !motion.enabled;
    $('#chapterPlay').textContent = !motion.enabled ? 'Auto-play off' : chapterPlaying ? 'Pause slideshow' : 'Play slideshow';
    $('#chapterPlay').setAttribute('aria-pressed', String(!chapterPlaying || !motion.enabled));
    const running = allowed && chapterPlaying && chapterInView && !chapterHovered && !chapterFocused;
    $('#chapterCount').setAttribute('aria-live', running ? 'off' : 'polite');
    if (running) chapterTimer = setTimeout(() => selectChapter(chapterIndex + 1, false, false), 6500);
  }
  function selectChapter(index, moveFocus = false, manual = true) {
    const direction = index >= chapterIndex ? 1 : -1;
    if (manual) chapterPlaying = false;
    chapterIndex = (index + chapters.length) % chapters.length;
    const chapter = chapters[chapterIndex];
    tabs.forEach((tab, i) => {
      const selected = i === chapterIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const panel = $('#chapterPanel');
    panel.setAttribute('aria-labelledby', tabs[chapterIndex].id);
    panel.style.setProperty('--chapter-color', `var(--${chapter.color})`);
    $('#chapterLabel').textContent = chapter.label;
    const title = $('#chapterTitle');
    title.replaceChildren(document.createTextNode(chapter.title[0]), document.createElement('br'), document.createTextNode(chapter.title[1]));
    $('#chapterDescription').textContent = chapter.description;
    $('#chapterLink').href = `lifestage.html#${chapter.key}`;
    $('#chapterCount').textContent = `${String(chapterIndex + 1).padStart(2, '0')} / 04`;
    $('#chapterSlideName').textContent = tabs[chapterIndex].textContent.replace('↗', '').trim();
    panel.setAttribute('aria-label', `${chapter.label}, slide ${chapterIndex + 1} of 4`);
    chapterFluid.shift(chapterIndex + 1);
    chapterAnimation?.cancel(); chapterAnimation = null;
    if (motion.enabled && motion.visible && $('#chapterSlideBody').animate) {
      chapterAnimation = $('#chapterSlideBody').animate([
        { opacity: 0, transform: `translateX(${direction * 65}%)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 280, easing: 'cubic-bezier(.23,1,.32,1)' });
    }
    if (moveFocus) tabs[chapterIndex].focus();
    scheduleChapters();
  }
  tabs.forEach((tab, index) => {
    listen(tab, 'click', () => { if (index !== chapterIndex) selectChapter(index); });
    listen(tab, 'keydown', event => {
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = chapterIndex + 1;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = chapterIndex - 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = chapters.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectChapter(next, true);
    });
  });
  listen($('#chapterPrev'), 'click', () => selectChapter(chapterIndex - 1));
  listen($('#chapterNext'), 'click', () => selectChapter(chapterIndex + 1));
  listen($('#chapterPlay'), 'click', () => { chapterPlaying = !chapterPlaying; scheduleChapters(); });
  listen(chapterCarousel, 'pointerenter', () => { chapterHovered = true; scheduleChapters(); });
  listen(chapterCarousel, 'pointerleave', () => { chapterHovered = false; scheduleChapters(); });
  listen(chapterCarousel, 'focusin', () => { chapterFocused = true; scheduleChapters(); });
  listen(chapterCarousel, 'focusout', () => {
    queueMicrotask(() => { chapterFocused = chapterCarousel.contains(document.activeElement); scheduleChapters(); });
  });
  let swipe = null, lastSwipe = -1000;
  listen($('#chapterPanel'), 'pointerdown', event => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') swipe = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  listen($('#chapterPanel'), 'pointerup', event => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y; swipe = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      lastSwipe = performance.now(); selectChapter(chapterIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
  listen($('#chapterPanel'), 'pointercancel', () => { swipe = null; });
  listen($('#chapterPanel'), 'click', event => {
    if (performance.now() - lastSwipe < 350) { event.preventDefault(); event.stopPropagation(); }
  }, { capture: true });
  let chapterObserver = null;
  if ('IntersectionObserver' in window) {
    chapterObserver = new IntersectionObserver(entries => { chapterInView = entries[0].isIntersecting; scheduleChapters(); }, { threshold: .2 });
    chapterObserver.observe(chapterCarousel);
  }
  onMotion(() => { scheduleChapters(); if (!motion.enabled) chapterAnimation?.cancel(); });
  listen(document, 'visibilitychange', scheduleChapters);
  listen(window, 'pagehide', () => { chapterActive = false; clearTimeout(chapterTimer); chapterAnimation?.cancel(); });
  listen(window, 'pageshow', () => { chapterActive = true; queueMicrotask(scheduleChapters); });
  disposers.push(() => { clearTimeout(chapterTimer); chapterAnimation?.cancel(); chapterObserver?.disconnect(); });

  // Breathing is a user-started 24-second session, not an autoplay animation.
  // Deadline-based steps avoid drift and reset safely if the tab is hidden.
  const breath = { state: 'idle', step: 0, deadline: 0, timer: null };
  let completedBreaths = 0;
  const breathSteps = $$('.breath-steps li');
  function renderBreath() {
    const running = breath.state === 'running';
    const complete = breath.state === 'complete';
    const seconds = complete ? 24 : running ? breath.step * 4 : 0;
    $('#breathProgress').value = seconds;
    $('#breathProgressLabel').textContent = `${seconds} of 24 seconds`;
    const inhale = breath.step % 2 === 0;
    const phase = running ? (inhale ? 'inhale' : 'exhale') : breath.state;
    $('#breathPanel').dataset.state = phase;
    $('#breatheButton').setAttribute('aria-pressed', String(running));
    $('#breatheButtonLabel').textContent = running ? 'Finish your pause' : complete ? 'Breathe again' : 'Begin your pause';
    $('#breathButtonIcon').textContent = running ? '×' : '↗';
    $('#breathReset').hidden = !running;
    $('#breathText').textContent = running ? (inhale ? 'breathe in.' : 'breathe out.') : complete ? 'welcome back.' : 'just be.';
    $('#breathHint').textContent = running ? `round ${Math.floor(breath.step / 2) + 1} of 3` : 'a little room to breathe';
    $('#breathStatus').textContent = running
      ? `${inhale ? 'Breathe in gently' : 'Let your breath out'}, if comfortable. Round ${Math.floor(breath.step / 2) + 1} of 3.`
      : complete ? 'Your moment is complete. Return to your natural breath, and take your time.'
        : 'Breathe naturally, at your own pace. In for four, out for four, if comfortable.';
    const stage = complete ? 2 : running ? (breath.step < 2 ? 0 : breath.step < 4 ? 1 : 2) : 0;
    breathSteps.forEach((el, i) => { if (i === stage) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
    breathFluid.shift(running ? breath.step + 2 : 0);
  }
  function finishBreath(complete = false) {
    clearTimeout(breath.timer); breath.timer = null;
    breath.state = complete ? 'complete' : 'idle'; breath.step = 0;
    if (complete) { completedBreaths++; $('#breathsCount').textContent = String(completedBreaths); }
    renderBreath();
  }
  function scheduleBreath() {
    breath.timer = setTimeout(() => {
      const now = performance.now();
      if (now < breath.deadline) { scheduleBreath(); return; }
      // Hidden-tab throttling or a blocked main thread never speeds through missed steps.
      if (now - breath.deadline > 1500) { finishBreath(); return; }
      breath.step++;
      if (breath.step >= 6) { finishBreath(true); return; }
      breath.deadline = now + 4000; renderBreath(); scheduleBreath();
    }, Math.max(0, breath.deadline - performance.now()));
  }
  function startBreath() {
    clearTimeout(breath.timer);
    breath.state = 'running'; breath.step = 0; breath.deadline = performance.now() + 4000;
    renderBreath(); scheduleBreath();
  }
  $('#breathControls').hidden = false;
  listen($('#breatheButton'), 'click', () => breath.state === 'running' ? finishBreath() : startBreath());
  listen($('#breathReset'), 'click', startBreath);
  disposers.push(() => clearTimeout(breath.timer));

  // Hero island: one capped RAF loop drives both the canvas and parallax.
  // Cached geometry, bounded particle counts and DPR prevent runaway work.
  const hero = $('#hero');
  const canvas = $('#botanicalCanvas');
  let ctx = null;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch { /* Static SVG remains available. */ }
  const layers = $$('[data-depth]').map(el => ({ el, depth: Number(el.dataset.depth) }));
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0, inside: false };
  let bounds = { width: 1, height: 1, left: 0, pageTop: 0 };
  let particles = [], palette = [], heroVisible = false;
  let heroFrame = null, lastFrame = 0, elapsed = 0, scrollEnergy = 0;
  let previousScroll = window.scrollY, resizeFrame = null;
  function readPalette() {
    const styles = getComputedStyle(root);
    palette = ['pink', 'lavender', 'peach', 'mint', 'blue'].map(name => styles.getPropertyValue(`--${name}`).trim());
  }
  function createParticles() {
    const count = bounds.width < 768 ? 18 : 38;
    // Stable seeded positions prevent jumps on theme changes or motion toggles.
    particles = Array.from({ length: count }, (_, i) => ({
      x: ((i * 137.508 + 31) % 997) / 997 * bounds.width,
      y: ((i * 91.37 + 97) % 593) / 593 * bounds.height,
      radius: 5 + i % 6 * 1.4, phase: i * 2.4, color: i % 5,
      vx: .12 + (i % 5) * .035, vy: -.06 - (i % 3) * .025
    }));
  }
  function measureHero() {
    const rect = hero.getBoundingClientRect();
    bounds = { width: Math.max(1, rect.width), height: Math.max(1, rect.height), left: rect.left, pageTop: rect.top + window.scrollY };
    if (ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(bounds.width * dpr); canvas.height = Math.round(bounds.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    createParticles(); drawParticles(0, false);
  }
  function drawParticles(delta, advance) {
    if (!ctx) return;
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    const dark = root.dataset.theme === 'dark';
    particles.forEach(p => {
      if (advance) {
        const hoverBoost = pointer.inside ? 1.5 : 1;
        const speed = (1 + scrollEnergy * .65) * hoverBoost;
        p.x += p.vx * delta * speed;
        p.y += (p.vy + Math.sin(elapsed * .4 + p.phase) * .06) * delta * speed;
        const cursorX = (pointer.x + 1) * .5 * bounds.width;
        const cursorY = (pointer.y + 1) * .5 * bounds.height;
        const dx = p.x - cursorX, dy = p.y - cursorY;
        const distance = Math.hypot(dx, dy);
        if (pointer.inside && finePointer.matches && distance < 130 && distance > 1) {
          p.x += dx / distance * (1 - distance / 130) * delta * .5;
          p.y += dy / distance * (1 - distance / 130) * delta * .5;
        }
        if (p.x > bounds.width + 30) p.x = -30;
        if (p.x < -30) p.x = bounds.width + 30;
        if (p.y < -30) p.y = bounds.height + 30;
        if (p.y > bounds.height + 30) p.y = -30;
      }
      const angle = Math.sin(elapsed * .25 + p.phase) * .7 + p.phase;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(angle);
      ctx.globalAlpha = dark ? .48 : .7; ctx.strokeStyle = palette[p.color];
      ctx.fillStyle = palette[p.color]; ctx.lineWidth = 1;
      // An organic curved trail and a two-sided botanical leaf.
      ctx.beginPath(); ctx.moveTo(-p.radius * 3.5, p.radius * .6);
      ctx.quadraticCurveTo(-p.radius, -p.radius, p.radius * 1.8, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(0, -p.radius, p.radius * 1.6, -p.radius, p.radius * 1.8, 0);
      ctx.bezierCurveTo(p.radius, p.radius * .5, p.radius * .4, p.radius * .5, 0, 0); ctx.fill();
      ctx.restore();
    });
  }
  function resetParallax() {
    pointer.x = 0; pointer.y = 0; pointer.smoothX = 0; pointer.smoothY = 0; pointer.inside = false;
    layers.forEach(({ el }) => el.style.removeProperty('transform'));
  }
  function renderParallax(delta) {
    if (!finePointer.matches || bounds.width < 768) return;
    const lerp = 1 - Math.pow(.9, delta);
    pointer.smoothX += (pointer.x - pointer.smoothX) * lerp;
    pointer.smoothY += (pointer.y - pointer.smoothY) * lerp;
    layers.forEach(({ el, depth }) => {
      const scrollOffset = clamp(window.scrollY - bounds.pageTop, 0, bounds.height);
      const x = pointer.smoothX * depth;
      const y = pointer.smoothY * depth + scrollOffset * (Math.abs(depth) > 10 ? .16 : .04);
      const sign = Math.sign(depth);
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotateX(${(-pointer.smoothY * 1.5 * sign).toFixed(2)}deg) rotateY(${(pointer.smoothX * 2 * sign).toFixed(2)}deg) scale(${(1 + Math.abs(pointer.smoothX) * .005).toFixed(4)})`;
    });
  }
  function heroTick(now) {
    heroFrame = null;
    if (!motion.enabled || !motion.visible || !heroVisible) return;
    if (!lastFrame) lastFrame = now - 1000 / 30;
    const gap = now - lastFrame;
    if (gap >= 1000 / 30 - 1) {
      const delta = Math.min(gap, 66) / (1000 / 60);
      elapsed += Math.min(gap, 66) / 1000; lastFrame = now;
      scrollEnergy *= Math.pow(.93, delta);
      drawParticles(delta, true); renderParallax(delta);
    }
    heroFrame = requestAnimationFrame(heroTick);
  }
  function syncHero() {
    cancelAnimationFrame(heroFrame); heroFrame = null; lastFrame = 0;
    const active = motion.enabled && motion.visible && heroVisible;
    hero.classList.toggle('is-in-view', active);
    if (active) heroFrame = requestAnimationFrame(heroTick);
    else { resetParallax(); drawParticles(0, false); }
  }
  readPalette(); measureHero();
  onMotion(syncHero);
  themeSubscribers.add(() => { readPalette(); drawParticles(0, false); });
  listen(hero, 'pointermove', event => {
    if (!motion.enabled || !finePointer.matches || event.pointerType === 'touch') return;
    pointer.inside = true;
    pointer.x = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    pointer.y = clamp((event.clientY - (bounds.pageTop - window.scrollY)) / bounds.height * 2 - 1, -1, 1);
  }, { passive: true });
  listen(hero, 'pointerleave', () => { pointer.x = 0; pointer.y = 0; pointer.inside = false; });
  // Scroll only adds a velocity impulse. No layout read, render, or state tree update.
  listen(window, 'scroll', () => {
    const y = window.scrollY;
    if (motion.enabled && heroVisible) scrollEnergy = Math.min(5, scrollEnergy + Math.abs(y - previousScroll) * .015);
    previousScroll = y;
  }, { passive: true });
  listen(window, 'resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { resetParallax(); measureHero(); });
  }, { passive: true });
  listen(finePointer, 'change', resetParallax);
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measureHero);
    });
    resizeObserver.observe(hero); disposers.push(() => resizeObserver.disconnect());
  }
  let heroObserver = null;
  if ('IntersectionObserver' in window) {
    heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting; syncHero();
    }, { threshold: 0 });
    heroObserver.observe(hero);
  } else {
    // Older browsers get a static canvas rather than an unbounded off-screen loop.
    heroVisible = false;
  }
  disposers.push(() => { heroObserver?.disconnect(); cancelAnimationFrame(heroFrame); cancelAnimationFrame(resizeFrame); resetParallax(); });

  listen(document, 'visibilitychange', () => {
    motion.visible = !document.hidden;
    if (!motion.visible) {
      if (breath.state === 'running') finishBreath();
      chapterFluid.stop(); breathFluid.stop();
    }
    syncHero();
  });
  syncMotion();

  // Pause on bfcache entry; final navigation releases listeners and observers.
  listen(window, 'pagehide', event => {
    motion.visible = false; syncHero();
    if (breath.state === 'running') finishBreath();
    chapterFluid.stop(); breathFluid.stop();
    if (!event.persisted) {
      disposers.forEach(dispose => dispose());
      motionSubscribers.clear(); themeSubscribers.clear(); controller.abort();
    }
  });
  listen(window, 'pageshow', event => { if (event.persisted) { motion.visible = !document.hidden; measureHero(); syncHero(); } });
})();
