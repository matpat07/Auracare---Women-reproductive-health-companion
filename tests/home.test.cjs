// Browser-independent state/lifecycle tests. Run: node --test tests/home.test.cjs
// These exercise DOM behavior; responsive rendering still needs browser QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(project, 'home.js'), 'utf8');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');

class Element {
  constructor() {
    this.listeners = new Map(); this.attributes = {}; this.dataset = {};
    this.hidden = false; this.disabled = false; this.textContent = '';
    this.children = []; this.value = ''; this.open = false;
    this.style = { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } };
    this.classes = new Set();
    this.classList = {
      add: name => this.classes.add(name), remove: name => this.classes.delete(name),
      contains: name => this.classes.has(name),
      toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
    };
    this.childrenBySelector = {};
  }
  addEventListener(type, callback, options = {}) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(callback); this.listeners.set(type, listeners);
    options.signal?.addEventListener('abort', () => this.listeners.set(type, (this.listeners.get(type) || []).filter(fn => fn !== callback)));
  }
  emit(type, event = {}) { (this.listeners.get(type) || []).slice().forEach(fn => fn(event)); }
  click() { if (!this.disabled) this.emit('click'); }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  querySelector(selector) { return this.childrenBySelector[selector]; }
  replaceChildren(...children) { this.children = []; this.append(...children); this.textContent = children.map(child => child.textContent || '').join(''); }
  append(...children) { children.forEach(child => { child.parentElement = this; this.children.push(child); }); }
  add(child) { this.append(child); }
  contains(child) { return child === this || this.children.includes(child); }
  get firstElementChild() { return this.children[0]; }
  remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  focus() { this.focused = true; }
  animate() { return { cancel() {} }; }
  getBoundingClientRect() { return { width: 1200, height: 780, top: 100, left: 0 }; }
}

function boot({ reduced = false, theme = null, paused = false, storageBlocked = false, observerAvailable = true, canvasAvailable = true, experiences = false } = {}) {
  const ids = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => {
    const el = new Element(); el.id = match[1]; return [match[1], el];
  }));
  const document = new Element(); const window = new Element();
  const root = new Element(); root.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement = root; document.hidden = false;
  document.body = new Element(); document.activeElement = ids.plannerSubmit;
  const palette = { pink: '#F8C8DC', lavender: '#D8C7F5', peach: '#FFD9C7', mint: '#CDEBDD', blue: '#CFE3F8' };
  const store = { aura_theme: theme, aura_motion: paused ? 'paused' : 'on' };
  const media = {};
  for (const query of ['(prefers-reduced-motion: reduce)', '(hover: hover) and (pointer: fine)', '(prefers-color-scheme: dark)']) {
    media[query] = new Element(); media[query].matches = query.includes('reduce') ? reduced : query.includes('pointer') ? true : theme === 'dark';
  }
  const tabs = ['teen', 'pcos', 'pregnancy', 'menopause'].map(key => {
    const el = ids[`tab-${key}`]; el.dataset.chapter = key; return el;
  });
  const steps = [new Element(), new Element(), new Element()];
  const reveals = [ids.chapterPanel, ids.breathPanel, new Element()];
  const layers = [new Element(), new Element()]; layers[0].dataset.depth = '8'; layers[1].dataset.depth = '-14';
  const meta = new Element(), tablist = new Element(), arrows = new Element();
  const ticker = new Element(); const slides = [new Element(), new Element(), new Element()];
  const singles = { 'meta[name="theme-color"]': meta, '.chapter-tabs': tablist, '.step-arrows': arrows, '.care-ticker': ticker };
  document.querySelector = selector => selector.startsWith('#') ? ids[selector.slice(1)] : singles[selector];
  document.querySelectorAll = selector => ({ '[data-chapter]': tabs, '[data-reveal]': reveals, '[data-depth]': layers, '.breath-steps li': steps, '.care-slide': slides })[selector] || [];
  document.createTextNode = text => ({ textContent: text }); document.createElement = () => new Element();
  for (const panel of [ids.chapterPanel, ids.breathPanel]) {
    panel.childrenBySelector['.fluid-blob'] = new Element();
    panel.childrenBySelector.feDisplacementMap = new Element();
  }
  const noop = () => {};
  const canvasContext = Object.fromEntries(['setTransform', 'clearRect', 'save', 'translate', 'rotate', 'beginPath', 'moveTo', 'quadraticCurveTo', 'stroke', 'bezierCurveTo', 'fill', 'restore'].map(name => [name, noop]));
  ids.botanicalCanvas.getContext = () => canvasAvailable ? canvasContext : null;
  let clock = 0, next = 0;
  const frames = new Map(), timers = new Map(), observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
    observe(el) { this.targets.add(el); }
    unobserve(el) { this.targets.delete(el); }
    disconnect() { this.targets.clear(); }
    fire(el, visible) { this.callback([{ target: el, isIntersecting: visible }]); }
  }
  window.scrollY = 0; window.devicePixelRatio = 3;
  if (observerAvailable) window.IntersectionObserver = Observer;
  const context = {
    window, document, AbortController, console,
    matchMedia: query => media[query],
    getComputedStyle: () => ({ getPropertyValue: key => palette[key.slice(2)] }),
    localStorage: { getItem: key => { if (storageBlocked) throw Error('blocked'); return store[key] || null; }, setItem: (key, value) => { if (storageBlocked) throw Error('blocked'); store[key] = value; } },
    performance: { now: () => clock },
    requestAnimationFrame: callback => { frames.set(++next, callback); return next; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (callback, delay) => { timers.set(++next, { callback, at: clock + delay }); return next; },
    clearTimeout: id => timers.delete(id)
  };
  const mutations = [];
  context.MutationObserver = class { constructor(callback) { this.callback = callback; mutations.push(this); } observe() {} disconnect() { this.disconnected = true; } };
  context.Option = class extends Element { constructor(text, value) { super(); this.textContent = text; this.value = value; } };
  context.queueMicrotask = fn => fn();
  if (observerAvailable) context.IntersectionObserver = Observer;
  vm.runInNewContext(source, context);
  if (experiences) {
    ids.chatPanel.hidden = true;
    vm.runInNewContext(fs.readFileSync(path.join(project, 'home-experiences.js'), 'utf8'), context);
  }
  const advance = ms => {
    clock += ms;
    const due = [...timers].filter(([, value]) => value.at <= clock);
    due.forEach(([id, value]) => { timers.delete(id); value.callback(); });
  };
  const frame = (ms = 34) => { clock += ms; const pending = [...frames]; frames.clear(); pending.forEach(([, callback]) => callback(clock)); };
  return { ids, window, document, root, store, media, tabs, steps, layers, reveals, frames, timers, observers, mutations, slides, ticker, advance, frame };
}

test('theme persists; blocked storage does not break controls', () => {
  const app = boot(); app.ids.themeToggle.click();
  assert.equal(app.root.dataset.theme, 'dark'); assert.equal(app.store.aura_theme, 'dark');
  assert.equal(app.ids.themeToggle.attributes['aria-pressed'], 'true');
  app.ids.themeToggle.click(); assert.equal(app.root.dataset.theme, 'light');
  const blocked = boot({ storageBlocked: true }); blocked.ids.themeToggle.click();
  assert.equal(blocked.root.dataset.theme, 'dark');
});

test('life chapters support rapid changes, wrapped arrows, and keyboard focus', () => {
  const app = boot({ reduced: true });
  app.tabs[2].click(); assert.equal(app.ids.chapterLink.href, 'lifestage.html#pregnancy');
  assert.equal(app.ids.chapterPanel.attributes['aria-labelledby'], 'tab-pregnancy');
  assert.equal(app.tabs[2].tabIndex, 0); assert.equal(app.tabs[0].tabIndex, -1);
  app.tabs[2].emit('keydown', { key: 'End', preventDefault() {} });
  assert.equal(app.ids.chapterLink.href, 'lifestage.html#menopause'); assert(app.tabs[3].focused);
  app.ids.chapterNext.click(); assert.equal(app.ids.chapterLink.href, 'lifestage.html#teen');
  app.ids.chapterPrev.click(); assert.equal(app.ids.chapterCount.textContent, '04 / 04');
  assert.equal(app.frames.size, 0);
});

test('chapter carousel auto-plays in view, pauses during interaction, and supports touch swipe', () => {
  const app = boot();
  const observer = app.observers.find(o => o.targets.has(app.ids.chapterCarousel));
  observer.fire(app.ids.chapterCarousel, true);
  assert.equal(app.timers.size, 1);
  app.advance(6500); assert.equal(app.ids.chapterLink.href, 'lifestage.html#pcos');
  app.ids.chapterCarousel.emit('pointerenter'); assert.equal(app.timers.size, 0);
  app.ids.chapterCarousel.emit('pointerleave'); assert.equal(app.timers.size, 1);
  app.ids.chapterCarousel.emit('focusin'); assert.equal(app.timers.size, 0);
  app.ids.chapterCarousel.emit('focusout'); assert.equal(app.timers.size, 1);
  app.ids.chapterPanel.emit('pointerdown', { pointerType: 'touch', clientX: 250, clientY: 200 });
  app.ids.chapterPanel.emit('pointerup', { pointerType: 'touch', clientX: 130, clientY: 205 });
  assert.equal(app.ids.chapterLink.href, 'lifestage.html#pregnancy'); assert.equal(app.timers.size, 0);
  app.ids.chapterPlay.click(); assert.equal(app.timers.size, 1);
  observer.fire(app.ids.chapterCarousel, false); assert.equal(app.timers.size, 0);
});

test('chapter autoplay respects reduced motion, hidden documents, and page teardown', () => {
  const reduced = boot({ reduced: true });
  reduced.observers.find(o => o.targets.has(reduced.ids.chapterCarousel)).fire(reduced.ids.chapterCarousel, true);
  assert.equal(reduced.timers.size, 0); assert(reduced.ids.chapterPlay.disabled);
  reduced.ids.chapterNext.click(); assert.equal(reduced.ids.chapterLink.href, 'lifestage.html#pcos');
  const app = boot();
  app.observers.find(o => o.targets.has(app.ids.chapterCarousel)).fire(app.ids.chapterCarousel, true);
  app.document.hidden = true; app.document.emit('visibilitychange'); assert.equal(app.timers.size, 0);
  app.document.hidden = false; app.document.emit('visibilitychange'); assert.equal(app.timers.size, 1);
  app.window.emit('pagehide', { persisted: false }); assert.equal(app.timers.size, 0);
});

test('fluid transitions cancel and retarget without leaking animation frames', () => {
  const app = boot();
  app.tabs[1].click(); assert.equal(app.frames.size, 1);
  app.frame(60); app.tabs[2].click(); app.tabs[3].click();
  assert.equal(app.frames.size, 1); app.frame(300);
  assert.equal(app.frames.size, 0);
  assert.equal(app.ids.chapterPanel.childrenBySelector.feDisplacementMap.attributes.scale, '0');
  assert.equal(app.ids.chapterLink.href, 'lifestage.html#menopause');
});

test('breathing completes six phases; cancellation, reset and visibility clean timers', () => {
  const app = boot({ reduced: true });
  app.ids.breatheButton.click(); assert.equal(app.ids.breathPanel.dataset.state, 'inhale');
  app.advance(4000); assert.equal(app.ids.breathPanel.dataset.state, 'exhale');
  app.ids.breathReset.click(); assert.equal(app.ids.breathPanel.dataset.state, 'inhale'); assert.equal(app.timers.size, 1);
  for (let i = 0; i < 6; i++) app.advance(4000);
  assert.equal(app.ids.breathText.textContent, 'welcome back.'); assert.equal(app.timers.size, 0);
  assert.equal(app.ids.breathsCount.textContent, '1');
  assert.equal(app.steps[2].attributes['aria-current'], 'step');
  app.ids.breatheButton.click(); app.ids.breatheButton.click(); assert.equal(app.timers.size, 0);
  app.ids.breatheButton.click(); app.document.hidden = true; app.document.emit('visibilitychange');
  assert.equal(app.timers.size, 0); assert.equal(app.ids.breathPanel.dataset.state, 'idle');
});

test('delayed event loop resets breathing rather than rushing missed phases', () => {
  const app = boot({ reduced: true }); app.ids.breatheButton.click(); app.advance(7000);
  assert.equal(app.ids.breathPanel.dataset.state, 'idle'); assert.equal(app.timers.size, 0);
});

test('hero render loop stops off-screen, honors DPR cap and clears parallax', () => {
  const app = boot();
  const heroObserver = app.observers.find(o => o.targets.has(app.ids.hero));
  heroObserver.fire(app.ids.hero, true); assert.equal(app.frames.size, 1);
  assert.equal(app.ids.botanicalCanvas.width, 2100);
  app.ids.hero.emit('pointermove', { clientX: 1100, clientY: 250, pointerType: 'mouse' }); app.frame();
  assert.match(app.layers[0].style.transform, /translate3d/);
  heroObserver.fire(app.ids.hero, false); assert.equal(app.frames.size, 0);
  assert.equal(app.layers[0].style.transform, undefined);
});

test('reduced motion works at boot and responds live without hiding content', () => {
  const app = boot({ reduced: true });
  assert.equal(app.root.dataset.motion, 'off'); assert(app.ids.motionToggle.disabled);
  app.tabs[1].click(); assert.equal(app.frames.size, 0);
  assert(app.reveals.every(el => el.classList.contains('is-visible')));
  const live = boot(); live.tabs[1].click(); assert(live.frames.size > 0);
  const query = live.media['(prefers-reduced-motion: reduce)']; query.matches = true; query.emit('change');
  assert.equal(live.root.dataset.motion, 'off'); assert.equal(live.frames.size, 0);
  assert.equal(live.ids.chapterPanel.childrenBySelector.feDisplacementMap.attributes.scale, '0');
});

test('manual pause is persistent; missing canvas and observers degrade safely', () => {
  const app = boot(); app.ids.motionToggle.click(); assert.equal(app.store.aura_motion, 'paused');
  assert.equal(app.root.dataset.motion, 'off'); app.ids.motionToggle.click(); assert.equal(app.root.dataset.motion, 'on');
  const paused = boot({ paused: true }); assert.equal(paused.root.dataset.motion, 'off');
  const fallback = boot({ observerAvailable: false, canvasAvailable: false });
  assert.equal(fallback.frames.size, 0); assert(fallback.reveals.every(el => el.classList.contains('is-visible')));
  fallback.tabs[1].click(); assert.equal(fallback.ids.chapterLink.href, 'lifestage.html#pcos');
});

test('page teardown clears work; bfcache pages resume without duplicate loops', () => {
  const app = boot(); app.ids.breatheButton.click(); app.tabs[1].click();
  app.window.emit('pagehide', { persisted: true }); assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  app.window.emit('pageshow', { persisted: true }); app.ids.breatheButton.click(); assert.equal(app.timers.size, 1);
  app.window.emit('pagehide', { persisted: false }); assert.equal(app.frames.size, 0); assert.equal(app.timers.size, 0);
  app.ids.breatheButton.click(); assert.equal(app.timers.size, 0);
});

test('homepage destinations and fragment targets exist', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (url.startsWith('data:')) continue;
    if (url.startsWith('#')) assert(ids.includes(url.slice(1)), `Unknown anchor ${url}`);
    else assert(fs.existsSync(path.join(project, url.split('#')[0])), `Missing file ${url}`);
  }
});

test('carousel rotates only in view and pauses on focus, pointer and manual navigation', () => {
  const app = boot({ experiences: true });
  const observer = app.observers.find(o => o.targets.has(app.ids.careCarousel));
  assert.equal(app.timers.size, 0);
  observer.fire(app.ids.careCarousel, true); assert.equal(app.timers.size, 1);
  app.advance(6000); assert.equal(app.ids.slideStatus.textContent, 'Care idea 2 of 3');
  assert.equal(app.slides[0].inert, true); assert.equal(app.slides[1].inert, false);
  assert.equal(app.ids.ideasCount.textContent, '2');
  app.ids.careCarousel.emit('pointerenter'); assert.equal(app.timers.size, 0);
  app.ids.careCarousel.emit('pointerleave'); assert.equal(app.timers.size, 1);
  app.ids.careCarousel.emit('focusin'); assert.equal(app.timers.size, 0);
  app.ids.careCarousel.emit('focusout'); assert.equal(app.timers.size, 1);
  app.ids.slideNext.click(); assert.equal(app.ids.slideStatus.textContent, 'Care idea 3 of 3'); assert.equal(app.timers.size, 0);
  assert.equal(app.ids.ideasCount.textContent, '3');
  app.ids.slideNext.click(); assert.equal(app.ids.slideStatus.textContent, 'Care idea 1 of 3');
});

test('dependent dropdowns reset stale options and open a correctly linked native modal', () => {
  const app = boot({ experiences: true, reduced: true });
  app.ids.plannerChapter.value = 'pregnancy'; app.ids.plannerChapter.emit('change');
  assert.equal(app.ids.plannerFocus.children.length, 4);
  assert.equal(app.ids.plannerFocus.children[1].textContent, 'Appointments and milestones');
  app.ids.plannerFocus.value = '1'; app.ids.plannerFocus.emit('change');
  assert.equal(app.ids.plannerProgress.value, 2); assert.equal(app.ids.plannerSubmit.disabled, false);
  app.ids.plannerForm.emit('submit', { preventDefault() {} });
  assert.equal(app.ids.careDialog.open, true); assert.equal(app.ids.dialogDestination.href, 'health.html#vault');
  app.ids.careDialog.close(); assert(app.ids.plannerSubmit.focused);
  app.ids.plannerChapter.value = 'teen'; app.ids.plannerChapter.emit('change');
  assert.equal(app.ids.plannerFocus.value, ''); assert.equal(app.ids.plannerProgress.value, 1);
  assert.equal(app.ids.plannerSubmit.disabled, true);
});

test('scripted chat uses text nodes, useful destinations, bounded history and Escape', () => {
  const app = boot({ experiences: true, reduced: true });
  app.ids.chatToggle.click(); assert.equal(app.ids.chatPanel.hidden, false); assert(app.ids.chatMessage.focused);
  app.ids.chatMessage.value = '<img onerror=alert(1)> cycle';
  app.ids.chatForm.emit('submit', { preventDefault() {} });
  assert.equal(app.ids.chatMessages.children[0].children[1].textContent, '<img onerror=alert(1)> cycle');
  assert.equal(app.ids.chatMessages.children[1].children[2].href, 'cycle.html');
  for (let i = 0; i < 25; i++) {
    app.ids.chatMessage.value = 'breathing'; app.ids.chatForm.emit('submit', { preventDefault() {} });
  }
  assert.equal(app.ids.chatMessages.children.length, 40);
  app.ids.chatPanel.emit('keydown', { key: 'Escape', preventDefault() {} });
  assert.equal(app.ids.chatPanel.hidden, true); assert(app.ids.chatToggle.focused);
});

test('new autoplay honors reduced motion, global pause, visibility and teardown', () => {
  const reduced = boot({ experiences: true, reduced: true });
  reduced.observers.find(o => o.targets.has(reduced.ids.careCarousel)).fire(reduced.ids.careCarousel, true);
  assert.equal(reduced.timers.size, 0); reduced.ids.slideNext.click();
  assert.equal(reduced.ids.slideStatus.textContent, 'Care idea 2 of 3');
  const app = boot({ experiences: true });
  app.observers.find(o => o.targets.has(app.ids.careCarousel)).fire(app.ids.careCarousel, true);
  assert.equal(app.timers.size, 1); app.ids.motionToggle.click(); app.mutations[0].callback();
  assert.equal(app.timers.size, 0);
  app.ids.motionToggle.click(); app.mutations[0].callback(); assert.equal(app.timers.size, 1);
  app.document.hidden = true; app.document.emit('visibilitychange'); assert.equal(app.timers.size, 0);
  app.window.emit('pagehide', { persisted: false }); assert.equal(app.timers.size, 0);
  assert(app.mutations[0].disconnected);
});
