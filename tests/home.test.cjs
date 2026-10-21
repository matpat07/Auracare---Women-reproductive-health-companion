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
  replaceChildren(...children) { this.textContent = children.map(child => child.textContent || '').join(''); }
  focus() { this.focused = true; }
  animate() { return { cancel() {} }; }
  getBoundingClientRect() { return { width: 1200, height: 780, top: 100, left: 0 }; }
}

function boot({ reduced = false, theme = null, paused = false, storageBlocked = false, observerAvailable = true, canvasAvailable = true } = {}) {
  const ids = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => {
    const el = new Element(); el.id = match[1]; return [match[1], el];
  }));
  const document = new Element(); const window = new Element();
  const root = new Element(); root.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement = root; document.hidden = false;
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
  const singles = { 'meta[name="theme-color"]': meta, '.chapter-tabs': tablist, '.step-arrows': arrows };
  document.querySelector = selector => selector.startsWith('#') ? ids[selector.slice(1)] : singles[selector];
  document.querySelectorAll = selector => ({ '[data-chapter]': tabs, '[data-reveal]': reveals, '[data-depth]': layers, '.breath-steps li': steps })[selector] || [];
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
  if (observerAvailable) context.IntersectionObserver = Observer;
  vm.runInNewContext(source, context);
  const advance = ms => {
    clock += ms;
    const due = [...timers].filter(([, value]) => value.at <= clock);
    due.forEach(([id, value]) => { timers.delete(id); value.callback(); });
  };
  const frame = (ms = 34) => { clock += ms; const pending = [...frames]; frames.clear(); pending.forEach(([, callback]) => callback(clock)); };
  return { ids, window, document, root, store, media, tabs, steps, layers, reveals, frames, timers, observers, advance, frame };
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
