/* Shared presentation layer. Existing storage and feature handlers stay in place. */
(() => {
  const paths = {
    flower: '<path d="M12 9C4-2 0 10 9 12c-11 8 2 14 3 3 8 11 14-2 3-3C26 4 14 0 12 9Z"/><circle cx="12" cy="12" r="2"/>',
    cycle: '<circle cx="12" cy="12" r="8"/><path d="M12 6v6l4 2M5 3 2 6m17-3 3 3"/>',
    leaf: '<path d="M5 20C-2 5 10 3 21 3c0 12-5 18-13 14M4 21 16 9"/>',
    heart: '<path d="M20 5c-3-3-7-1-8 1-2-3-6-4-9 0-4 6 9 14 9 14S25 11 20 5Z"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
    chat: '<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="m9 10 2 2 4-4"/>',
    vault: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M9 5V3h6v2m-3 6v6m-3-3h6"/>',
    sos: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/><path d="M12 7v7m0 3h.01"/>',
    summary: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2m-6 6h6m-6 4h6m-6 4h4"/>',
    home: '<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3Z"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-16a3 3 0 0 1 0 6m3 4c3 1 3 4 3 6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.flower}</svg>`;
  const features = [
    ['Cycle Tracking','Your rhythm, understood','cycle.html','cycle','pink'],
    ['Teen & First Period','A kind place to begin','lifestage.html#teen','flower','lavender'],
    ['PCOS Insights','Connect your patterns','lifestage.html#pcos','leaf','mint'],
    ['Pregnancy Mode','Care for your new chapter','lifestage.html#pregnancy','heart','peach'],
    ['Menopause Mode','Support through change','lifestage.html#menopause','moon','blue'],
    ['AI Health Assistant','A little guidance, anytime','chat.html','chat','lavender'],
    ['Health Vault','Your records, together','health.html#vault','vault','blue'],
    ['Mental Wellness','Make room for your mind','resources.html','heart','pink'],
    ['Nutrition & Fitness','Nourish, move, feel good','health.html#nutrition','leaf','mint'],
    ['Doctor Visit Summary','Feel ready for your visit','health.html#summary','summary','peach'],
    ['Emergency SOS','Support when it matters','sos.html','sos','pink']
  ];
  const grid = document.getElementById('careGrid');
  if (grid) grid.innerHTML = features.map(([title,desc,url,type,color]) => `<a class="care-tile fluid-feature ${color}" href="${url}"><span class="tile-icon">${icon(type)}</span><strong>${title}</strong><span>${desc}</span></a>`).join('');
  const sidebar = document.querySelector('.sidebar');
  const page = location.pathname.split('/').pop() || 'index.html';
  if (sidebar) {
    const nav = [['dashboard.html','Overview','home'],['cycle.html','My cycle','cycle'],['lifestage.html','Life stages','flower'],['chat.html','Aura assistant','chat'],['health.html','My health','vault'],['resources.html','Mind & wellness','leaf'],['community.html','Sisterhood','people']];
    sidebar.innerHTML = `<a class="brand" href="dashboard.html"><img class="brand-logo" src="Aura_Care_Logo.png" alt="" width="48" height="48" decoding="async"><span>AuraCare<small>IN EVERY PHASE, WITH YOU</small></span></a><p class="nav-caption">YOUR SPACE</p><nav aria-label="Main navigation">${nav.map(([url,title,type])=>`<a href="${url}" ${page===url?'class="active" aria-current="page"':''}>${icon(type)}${title}</a>`).join('')}</nav><div class="sidebar-note">${icon('heart')}<p>A little kinder to yourself.<br/>A little closer to you.</p></div><a class="sos-link" href="sos.html">${icon('sos')} Emergency SOS <span>↗</span></a><p class="device-note">Your entries stay on this device</p>`;
  }
  if (page !== 'dashboard.html' && document.querySelector('.content')) {
    const back = document.createElement('a'); back.className='back-link'; back.href='dashboard.html'; back.textContent='← Back to your space'; document.querySelector('.content').prepend(back);
  }
  function route() {
    const hash = location.hash.slice(1);
    if (page === 'lifestage.html' && ['teen','pcos','pregnancy','menopause','skin'].includes(hash)) {
      window.setStage(hash);
      document.querySelector('.content h1').textContent = features.find(f=>f[2]===`lifestage.html#${hash}`)?.[0] || 'Skin & Hair';
    }
    if (page === 'health.html' && ['vault','meds','nutrition','fitness','summary'].includes(hash)) {
      window.switchTab(hash);
      document.querySelector('.content h1').textContent = ({vault:'Health Vault',meds:'Medicine Reminders',nutrition:'Nutrition & Fitness',fitness:'Nutrition & Fitness',summary:'Doctor Visit Summary'})[hash];
    }
  }
  route(); window.addEventListener('hashchange',route);
  const examples = {
    teen:['A first-period kit','Pads · spare underwear · a little reassurance','Start with the basics, at your own pace.'],
    pcos:['Your pattern notebook','Cycle length · skin changes · energy','Bring observations and questions to your next appointment.'],
    pregnancy:['A new chapter','Week 18 · next appointment 24 Oct','Your appointments and notes, in one calm place.'],
    menopause:['Make space for change','Sleep 7 hours · energy steady · 1 symptom noted','Your experience deserves to be heard.'],
    vault:['Your health, organised','Blood report · 12 Oct · routine visit','Keep a record of the details you want to remember.'],
    nutrition:['A little nourishment','Breakfast: oats & fruit · movement: 20-minute walk','Small everyday moments count.'],
    fitness:['Movement that feels like you','Gentle walk · 20 minutes · Thursday','Make room for the movement you enjoy.'],
    summary:['Ready for your conversation','Cycle notes · recent symptoms · your questions','A helpful starting point for your next visit.']
  };
  function showExample() {
    document.getElementById('screenExample')?.remove();
    const sample=examples[location.hash.slice(1)];
    if (!sample || !['health.html','lifestage.html'].includes(page)) return;
    const card=document.createElement('section');card.id='screenExample';card.className='screen-example';
    card.innerHTML=`<p class="eyebrow">ILLUSTRATIVE PREVIEW · NOT YOUR SAVED DATA</p><h2>${sample[0]}</h2><p><strong>${sample[1]}</strong></p><p class="muted">${sample[2]}</p>`;
    document.querySelector('.topbar').after(card);
  }
  showExample();window.addEventListener('hashchange',showExample);
  if (page==='chat.html') {
    const note=document.createElement('p');note.className='gentle-note';note.textContent='A gentle companion for reflection and pattern-based nudges. This prototype uses scripted replies, not a live AI or diagnosis.';
    document.querySelector('.content').append(note);
  }
  document.querySelectorAll('[data-stage]').forEach(el => { el.tabIndex=0; el.setAttribute('role','button'); el.addEventListener('click',()=>{location.hash=el.dataset.stage;}); el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}}); });
  document.querySelectorAll('[data-tab]').forEach(el=>el.addEventListener('click',()=>{location.hash=el.dataset.tab;}));
  document.querySelectorAll('input,textarea,select').forEach(el=> { if(!el.labels?.length && !el.hasAttribute('aria-label')) el.setAttribute('aria-label',el.placeholder || el.id.replace(/([A-Z])/g,' $1')); });
  document.querySelectorAll('.mood-picker button').forEach(el=>{el.setAttribute('aria-label',el.dataset.label);el.title=el.dataset.label;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal:not(.hidden) button').forEach(b=>{if(/close/i.test(b.textContent))b.click();});}});
})();
