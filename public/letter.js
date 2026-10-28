(() => {
  const messages = JSON.parse(document.querySelector('#page-translations').textContent);
  const t = (key, values = {}) => (messages[key] || key).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  const toast=document.querySelector('#letter-toast');
  let toastTimer;
  function notify(message){
    const drawerStatus = document.querySelector('#contact-drawer[open] [data-contact-status]');
    const target = drawerStatus || toast;
    target.textContent=message;target.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{target.hidden=true},3500);
  }
  async function copy(text){
    if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return true}catch{}}
    const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(field);field.select();let ok=false;try{ok=document.execCommand('copy')}catch{}field.remove();return ok;
  }
  document.querySelectorAll('[data-copy-contact]').forEach(button=>button.addEventListener('click',async()=>{
    const email=button.dataset.copyContact==='email';const value=button.dataset.contactValue;
    notify(await copy(value)?t(email ? 'emailCopied' : 'phoneCopied') : t('contactCopyFailed', { value }));
  }));
  document.querySelectorAll('[data-pending-link]').forEach(button=>button.addEventListener('click',()=>notify(t('pendingLink'))));
  const contactDrawer = document.querySelector('#contact-drawer');
  const contactTriggers = [...document.querySelectorAll('[data-open-contact]')];
  if (contactDrawer && typeof contactDrawer.showModal === 'function') {
    let drawerTrigger;
    let previousOverflow = '';
    contactTriggers.forEach(trigger => trigger.addEventListener('click', event => {
      event.preventDefault();
      if (contactDrawer.open) return;
      drawerTrigger = trigger;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      contactDrawer.querySelector('[data-contact-status]').hidden = true;
      contactDrawer.showModal();
      contactTriggers.forEach(button => button.setAttribute('aria-expanded', 'true'));
    }));
    contactDrawer.querySelector('[data-close-contact]').addEventListener('click', () => contactDrawer.close());
    contactDrawer.addEventListener('click', event => {
      if (event.target !== contactDrawer) return;
      const bounds = contactDrawer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) contactDrawer.close();
    });
    contactDrawer.addEventListener('close', () => {
      document.documentElement.style.overflow = previousOverflow;
      contactTriggers.forEach(button => button.setAttribute('aria-expanded', 'false'));
      if (drawerTrigger) drawerTrigger.focus({preventScroll: true});
    });
  }
  // "편지 잘 읽었어요": one press per browser, no undo. The total lives in the like-counter web app
  // (data-like-endpoint); without an endpoint the button only counts this visit.
  const thanks=document.querySelector('.letter-thanks');
  const endpoint = thanks.dataset.likeEndpoint || '';
  const LIKED_KEY = 'kiin-letter-liked';
  const stored = (() => { try { return window.localStorage; } catch { return null; } })();
  let liked = false;
  let pending = false;
  let count = endpoint ? null : 0;
  const showCount = (animate) => {
    const number = document.createElement('span');
    number.textContent = count === null ? '' : String(count);
    if (animate) number.className = 'num-up';
    thanks.querySelector('[data-like-count]').replaceChildren(number);
  };
  const showLiked = () => {
    thanks.setAttribute('aria-pressed', 'true');
    thanks.classList.add('apricot-on');
    const label = thanks.querySelector('[data-i18n]');
    label.setAttribute('data-i18n', 'likeThanks');
    label.textContent = t('likeThanks');
  };
  const request = async (method) => {
    const response = await fetch(endpoint, { method, redirect: 'follow', ...(method === 'POST' ? { body: '{}', headers: { 'Content-Type': 'text/plain;charset=utf-8' } } : {}) });
    const body = await response.json();
    if (!response.ok || body.error || typeof body.count !== 'number') throw new Error(body.error || 'HTTP ' + response.status);
    return body.count;
  };
  try { liked = stored?.getItem(LIKED_KEY) === '1'; } catch {}
  if (liked) showLiked();
  if (endpoint && typeof fetch === 'function') {
    request('GET').then(total => { count = total; showCount(false); }).catch(() => {});
  }
  thanks.addEventListener('click', async () => {
    if (liked) { notify(t('likeAlready')); return; }
    if (pending) return;
    pending = true;
    liked = true;
    showLiked();
    if (count !== null) { count += 1; showCount(true); }
    try {
      if (endpoint && typeof fetch === 'function') { count = await request('POST'); showCount(count !== null); }
      try { stored?.setItem(LIKED_KEY, '1'); } catch {}
      document.querySelector('#thanks-status').textContent = t('likedStatus', { count: count ?? '' });
    } catch {
      liked = false;
      thanks.setAttribute('aria-pressed', 'false');
      thanks.classList.remove('apricot-on');
      const label = thanks.querySelector('[data-i18n]');
      label.setAttribute('data-i18n', 'like');
      label.textContent = t('like');
      if (count !== null) { count -= 1; showCount(false); }
      notify(t('likeFailed'));
    } finally {
      pending = false;
    }
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let filterAnimation;
  const filterButtons = [...document.querySelectorAll('[data-writing-filter]')];
  const writingEntries = [...document.querySelectorAll('[data-writing-category]')];
  const writingEmpty = document.querySelector('.writing-empty');
  function selectWritingFilter(selected, animate = false) {
    if (!filterButtons.some(button => button.dataset.writingFilter === selected)) selected = 'all';
    filterButtons.forEach(filter => {
      const active = filter.dataset.writingFilter === selected;
      filter.setAttribute('aria-pressed', String(active));
      filter.classList.toggle('u-on', active);
    });
    writingEntries.forEach(entry => {
      entry.hidden = selected !== 'all' && entry.dataset.writingCategory !== selected;
    });
    if (writingEmpty) writingEmpty.hidden = writingEntries.some(entry => !entry.hidden);
    if (filterAnimation) filterAnimation.cancel();
    const result = writingEmpty && !writingEmpty.hidden ? writingEmpty : document.querySelector('.writing-list');
    if (animate && !reducedMotion.matches && result && typeof result.animate === 'function') {
      filterAnimation = result.animate([
        { opacity: 0, transform: 'translateY(3px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
    }

  }
  function restoreWritingFilter() {
    let selected = 'all';
    try {
      selected = new URL(window.location.href).searchParams.get('category') || window.sessionStorage.getItem('kiin-writing-category') || 'all';
    } catch {}
    selectWritingFilter(selected);
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.writingFilter;
    selectWritingFilter(selected, true);
    try {
      window.sessionStorage.setItem('kiin-writing-category', selected);
      const url = new URL(window.location.href);
      if (selected === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', selected);
      window.history.replaceState(window.history.state, '', url);
    } catch {}
  }));
  restoreWritingFilter();
  window.addEventListener('pageshow', restoreWritingFilter);
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const scenes = [
      { root: document.querySelector('#letter'), selector: '.letter-body p, .letter-thanks' },
      { root: document.querySelector('#writing'), selector: '.section-heading, .writing-filters, .writing-list' },
      { root: document.querySelector('#now'), selector: '.section-heading, .now-list, .now-empty' },
      { root: document.querySelector('#connect'), selector: '.section-heading, .contact-links' }
    ].filter(scene => scene.root);
    const revealScene = root => {
      root.querySelectorAll('.scroll-reveal, .scroll-line').forEach(node => node.classList.add('is-visible'));
    };
    const scrollObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        revealScene(entry.target);
        scrollObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' });
    scenes.forEach(scene => {
      const revealNodes = [...scene.root.querySelectorAll(scene.selector)];
      revealNodes.forEach((node, index) => {
        node.style.setProperty('--reveal-delay', Math.min(index * 75, 300) + 'ms');
        node.classList.add('scroll-reveal');
      });
      scene.root.style.setProperty('--line-delay', (Math.min(Math.max(revealNodes.length - 1, 0) * 75, 300) + 540) + 'ms');
      scene.root.querySelectorAll('.section-divider').forEach(line => line.classList.add('scroll-line'));
      scene.root.addEventListener('focusin', () => revealScene(scene.root));
      scrollObserver.observe(scene.root);
    });
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      scenes.forEach(scene => revealScene(scene.root));
      scrollObserver.disconnect();
      if (filterAnimation) filterAnimation.cancel();
    });
  }
  const links=[...document.querySelectorAll('.letter-nav a[href^="#"]')];
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of links){const active=link.hash==='#'+entry.target.id;link.classList.toggle('u-on',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')}}},{rootMargin:'-15% 0px -60% 0px',threshold:0});document.querySelectorAll('#letter,#writing,#now,#connect').forEach(section=>observer.observe(section))}
})();
