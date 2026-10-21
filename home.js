(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme = false;
  try { explicitTheme = !!localStorage.getItem('aura_theme'); } catch {}
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    toggle.setAttribute('aria-pressed', String(dark));
    toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    toggle.firstElementChild.textContent = dark ? '☀' : '☾';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#1b1920' : '#faf8f5';
  }
  applyTheme(root.dataset.theme);
  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    explicitTheme = true; applyTheme(next);
    try { localStorage.setItem('aura_theme', next); } catch {}
  });
  systemTheme.addEventListener('change', e => { if (!explicitTheme) applyTheme(e.matches ? 'dark' : 'light'); });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    root.classList.add('js-motion');
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  let scrollPending = false;
  function updateScroll() {
    const range = root.scrollHeight - innerHeight;
    root.style.setProperty('--progress', `${range > 0 ? Math.min(100, scrollY / range * 100) : 0}%`);
    root.style.setProperty('--scroll', `${Math.min(scrollY, 800)}px`);
    scrollPending = false;
  }
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll); updateScroll();

  const phases = [
    ['Day 12', 'Finding your flow', 'A little more energy. A little room to bloom.'],
    ['Day 18', 'Listen to yourself', 'Every day feels different. Your rhythm is your own.'],
    ['Day 25', 'A softer pace', 'A quiet moment. A little kindness for yourself.']
  ];
  document.querySelectorAll('[data-phase]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.phase);
    document.getElementById('previewDay').textContent = phases[index][0];
    document.getElementById('previewPhase').textContent = phases[index][1];
    document.getElementById('previewNote').textContent = phases[index][2];
    document.querySelector('.cycle-dial').style.setProperty('--dial-rotation', `${index * 85}deg`);
    document.querySelectorAll('[data-phase]').forEach(el => { el.classList.toggle('active', el === button); el.setAttribute('aria-pressed', String(el === button)); });
  }));

  const chapters = {
    teen: ['A GENTLE BEGINNING', 'Big questions.<br>A safe place to start.', 'Get to know your changing body with simple explainers, first-period essentials, and reassurance at your own pace.', 'pink'],
    pcos: ['CONNECT THE DOTS, GENTLY', 'Your patterns.<br>Your own story.', 'Keep track of cycle changes, skin, and energy. Build a clearer picture to bring to a conversation with your clinician.', 'mint'],
    pregnancy: ['ROOM FOR A NEW BEGINNING', 'A new chapter.<br>Care along the way.', 'Keep appointments, questions, and milestones together — a calm little companion for your pregnancy journey.', 'peach'],
    menopause: ['CHANGE, WITH A LITTLE SUPPORT', 'Still you.<br>A different rhythm.', 'Make space for changes in sleep, mood, and symptoms. Keep notes on what you notice and what you want to ask.', 'lavender']
  };
  const tabs = [...document.querySelectorAll('[data-chapter]')];
  function selectChapter(tab) {
    const key = tab.dataset.chapter, chapter = chapters[key];
    tabs.forEach(el => { const selected = el === tab; el.setAttribute('aria-selected', String(selected)); el.tabIndex = selected ? 0 : -1; });
    document.getElementById('chapterPanel').setAttribute('aria-labelledby', tab.id);
    document.getElementById('chapterLabel').textContent = chapter[0];
    document.getElementById('chapterTitle').innerHTML = chapter[1];
    document.getElementById('chapterDescription').textContent = chapter[2];
    document.getElementById('chapterLink').href = `lifestage.html#${key}`;
    document.getElementById('chapterPanel').style.setProperty('--chapter-color', `var(--${chapter[3]})`);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectChapter(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { e.preventDefault(); selectChapter(tabs[next]); tabs[next].focus(); }
    });
  });

  const breatheButton = document.getElementById('breatheButton');
  const circle = document.getElementById('breathingCircle');
  const breathText = document.getElementById('breathText');
  const breathHint = document.getElementById('breathHint');
  const status = document.getElementById('breathStatus');
  let breathingTimer = null, step = 0;
  function stopBreathing(completed = false) {
    clearInterval(breathingTimer); breathingTimer = null; circle.classList.remove('inhale');
    breathText.textContent = completed ? 'welcome back.' : 'just be.';
    breathHint.textContent = 'a little pause looks good on you';
    breatheButton.innerHTML = 'Take a breathing pause <span>↗</span>';
    breatheButton.setAttribute('aria-pressed', 'false');
    status.textContent = completed ? 'A little moment, just for you. Come back whenever you like.' : 'Try a gentle 24-second breathing moment.';
  }
  function renderBreath() {
    const inhale = step % 2 === 0;
    circle.classList.toggle('inhale', inhale);
    breathText.textContent = inhale ? 'breathe in.' : 'breathe out.';
    breathHint.textContent = `round ${Math.floor(step / 2) + 1} of 3 · follow your own comfort`;
    status.textContent = `${inhale ? 'Breathe in gently' : 'Let your breath out'} · round ${Math.floor(step / 2) + 1} of 3`;
  }
  breatheButton.addEventListener('click', () => {
    if (breathingTimer !== null) { stopBreathing(); return; }
    step = 0; renderBreath(); breatheButton.innerHTML = 'Finish your pause <span>×</span>'; breatheButton.setAttribute('aria-pressed', 'true');
    breathingTimer = setInterval(() => { step++; if (step >= 6) stopBreathing(true); else renderBreath(); }, 4000);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && breathingTimer !== null) stopBreathing(); });
  addEventListener('pagehide', () => clearInterval(breathingTimer));
})();
