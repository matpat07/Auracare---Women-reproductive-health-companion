/* Additional landing experiences, using the homepage's theme/motion tokens. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const controller = new AbortController();
  const listen = (node, event, fn, options = {}) => node.addEventListener(event, fn, { ...options, signal: controller.signal });
  let pageActive = true;
  const motionAllowed = () => pageActive && root.dataset.motion === 'on' && !document.hidden;
  const carousel = $('#careCarousel');
  const slides = $$('.care-slide');
  const track = $('#carouselTrack');
  const seen = new Set([0]);
  let index = 0, playing = true, hovered = false, focused = false, inView = false, timer = null;

  function schedule() {
    clearTimeout(timer); timer = null;
    const motionOff = root.dataset.motion !== 'on';
    $('#slidePlay').disabled = motionOff;
    $('#slidePlay').textContent = motionOff ? 'Auto-play off' : playing ? 'Pause slideshow' : 'Play slideshow';
    $('#slidePlay').setAttribute('aria-pressed', String(motionOff || !playing));
    $('#slidePlay').setAttribute('aria-label', motionOff ? 'Auto-play disabled while page motion is paused or reduced' : playing ? 'Pause slideshow' : 'Play slideshow');
    const running = playing && !hovered && !focused && inView && motionAllowed();
    $('#slideStatus').setAttribute('aria-live', running ? 'off' : 'polite');
    if (running) timer = setTimeout(() => { showSlide(index + 1); }, 6000);
  }
  function showSlide(next, manual = false) {
    index = (next + slides.length) % slides.length;
    if (manual) playing = false;
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    track.style.transform = `translateX(-${index * 100}%)`;
    $('#slideStatus').textContent = `Care idea ${index + 1} of ${slides.length}`;
    seen.add(index); $('#ideasCount').textContent = String(seen.size);
    schedule();
  }
  carousel.classList.add('carousel-ready');
  $('#carouselControls').hidden = false;
  showSlide(0);
  listen($('#slideNext'), 'click', () => showSlide(index + 1, true));
  listen($('#slidePrev'), 'click', () => showSlide(index - 1, true));
  listen($('#slidePlay'), 'click', () => { playing = !playing; schedule(); });
  listen(carousel, 'keydown', event => {
    if (event.target !== carousel) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); showSlide(index + (event.key === 'ArrowRight' ? 1 : -1), true);
    }
  });
  listen(carousel, 'pointerenter', () => { hovered = true; schedule(); });
  listen(carousel, 'pointerleave', () => { hovered = false; schedule(); });
  listen(carousel, 'focusin', () => { focused = true; schedule(); });
  listen(carousel, 'focusout', () => { queueMicrotask(() => { focused = carousel.contains(document.activeElement); schedule(); }); });

  const ticker = $('.care-ticker');
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.target === carousel) { inView = entry.isIntersecting; schedule(); }
      else entry.target.classList.toggle('is-in-view', entry.isIntersecting);
    }), { threshold: .05 });
    observer.observe(carousel); observer.observe(ticker);
  }
  // Native dropdowns provide keyboard behavior without a custom listbox.
  const choices = {
    teen: [ ['Understanding first periods', 'lifestage.html#teen'], ['Tracking my cycle', 'cycle.html'], ['Making room for my feelings', 'resources.html'] ],
    pcos: [ ['Noticing my patterns', 'lifestage.html#pcos'], ['Preparing for a doctor visit', 'health.html#summary'], ['Nutrition and movement', 'health.html#nutrition'] ],
    pregnancy: [ ['Appointments and milestones', 'lifestage.html#pregnancy'], ['Organising health records', 'health.html#vault'], ['A calmer moment', 'resources.html'] ],
    menopause: [ ['Tracking changes', 'lifestage.html#menopause'], ['Sleep and mental wellbeing', 'resources.html'], ['Preparing for a doctor visit', 'health.html#summary'] ]
  };
  const chapter = $('#plannerChapter'), focus = $('#plannerFocus');
  function updatePlanner() {
    const completed = Number(!!chapter.value) + Number(!!focus.value);
    $('#plannerProgress').value = completed;
    $('#plannerProgressLabel').textContent = `${completed} of 2 choices`;
    $('#plannerSubmit').disabled = completed !== 2;
    $('#plannerHint').textContent = completed === 2 ? 'Your starting point is ready to explore.' : 'Your focus options adapt to your chapter. Choose what feels useful.';
  }
  listen(chapter, 'change', () => {
    focus.replaceChildren(new Option(chapter.value ? 'Choose your focus' : 'Choose a chapter first', ''));
    (choices[chapter.value] || []).forEach(([label], i) => focus.add(new Option(label, String(i))));
    focus.disabled = !chapter.value; focus.value = ''; updatePlanner();
  });
  listen(focus, 'change', updatePlanner);
  const dialog = $('#careDialog');
  let returnFocus = null;
  listen($('#plannerForm'), 'submit', event => {
    event.preventDefault();
    const choice = choices[chapter.value]?.[Number(focus.value)];
    if (!choice || focus.value === '') return;
    $('#dialogDescription').textContent = `${choice[0]}: a thoughtful place to begin, with tools for your chosen chapter. You can explore other tools whenever you like.`;
    $('#dialogDestination').href = choice[1];
    returnFocus = document.activeElement;
    if (typeof dialog.showModal === 'function') { dialog.showModal(); document.body.classList.add('dialog-open'); }
    else window.location.href = choice[1];
  });
  listen(dialog, 'close', () => { document.body.classList.remove('dialog-open'); returnFocus?.focus(); });
  listen(dialog, 'click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });

  // Instant local conversation, with an explicit scripted-demo boundary.
  const chatPanel = $('#chatPanel'), chatToggle = $('#chatToggle'), messages = $('#chatMessages');
  $('#chatWidget').hidden = false;
  function setChat(open) {
    chatPanel.hidden = !open; chatToggle.setAttribute('aria-expanded', String(open));
    if (open) $('#chatMessage').focus(); else chatToggle.focus();
  }
  listen(chatToggle, 'click', () => setChat(chatPanel.hidden));
  listen($('#chatClose'), 'click', () => setChat(false));
  listen(chatPanel, 'keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setChat(false); } });
  function addMessage(text, who, link = null) {
    const message = document.createElement('p'); message.className = `chat-message ${who}`;
    const author = document.createElement('strong'); author.textContent = who === 'user' ? 'You' : 'Aura';
    message.append(author, document.createTextNode(text));
    if (link) { const a = document.createElement('a'); a.href = link[1]; a.textContent = link[0]; message.append(a); }
    messages.append(message);
    // Keep a bounded local transcript. Nothing is sent or stored.
    while (messages.children.length > 40) messages.firstElementChild.remove();
    messages.scrollTop = messages.scrollHeight;
  }
  function reply(text) {
    if (/emergency|unsafe|danger|urgent/i.test(text)) return ['Your safety matters. Open the support screen to find your trusted contact and emergency guidance.', ['Open emergency support', 'sos.html']];
    if (/breath|calm|stress|anxious|overwhelm/i.test(text)) return ['A small pause may feel helpful. You can try our breathing moment at a pace that feels comfortable, or explore the wellbeing tools.', ['Try the breathing moment', '#ritual']];
    if (/cycle|period|cramp/i.test(text)) return ['You can note your cycle and symptoms in the tracker. Notes can help you describe patterns to a healthcare professional.', ['Open cycle tracking', 'cycle.html']];
    if (/pcos|pregnan|menopaus|teen/i.test(text)) return ['Every chapter comes with different questions. Choose a life stage to find the tools that fit what you want to explore.', ['Explore life chapters', '#chapters']];
    if (/record|vault|doctor|report/i.test(text)) return ['Your health hub brings records and doctor-visit notes together. You decide what to share.', ['Open your health vault', 'health.html#vault']];
    return ["I'm a scripted demo that can help you find AuraCare tools. Try asking about cycle tracking, breathing, life stages, or your health records.", ['Explore your care tools', 'dashboard.html']];
  }
  function send(text) {
    const clean = text.trim().slice(0, 500); if (!clean) return;
    addMessage(clean, 'user'); const [answer, link] = reply(clean); addMessage(answer, 'bot', link);
    $('#chatMessage').value = '';
  }
  listen($('#chatForm'), 'submit', event => { event.preventDefault(); send($('#chatMessage').value); });
  $$('[data-chat]').forEach(button => listen(button, 'click', () => send(button.dataset.chat)));
  listen(messages, 'click', event => { if (event.target.closest('a')?.getAttribute('href')?.startsWith('#')) setChat(false); });

  function sync() {
    root.dataset.pageVisible = document.hidden ? 'false' : 'true'; schedule();
  }
  const motionObserver = new MutationObserver(sync);
  motionObserver.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  listen(document, 'visibilitychange', sync);
  listen(window, 'pageshow', () => { pageActive = true; sync(); });
  listen(window, 'pagehide', event => {
    pageActive = false;
    clearTimeout(timer); root.dataset.pageVisible = 'false';
    if (dialog.open) dialog.close();
    if (!event.persisted) { observer?.disconnect(); motionObserver.disconnect(); controller.abort(); }
  });
  sync();
})();
