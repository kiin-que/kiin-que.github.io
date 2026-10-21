(() => {
  const messages = JSON.parse(document.querySelector('#page-translations').textContent);
  const t = (key, values = {}) => (messages[key] || key).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  const toast=document.querySelector('#letter-toast');
  let toastTimer;
  function notify(message){toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true},3500)}
  async function copy(text){
    if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return true}catch{}}
    const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(field);field.select();let ok=false;try{ok=document.execCommand('copy')}catch{}field.remove();return ok;
  }
  document.querySelectorAll('[data-copy-contact]').forEach(button=>button.addEventListener('click',async()=>{
    const email=button.dataset.copyContact==='email';const value=email?'haeumkorean@gmail.com':'0507-1386-2171';
    notify(await copy(value)?t(email ? 'emailCopied' : 'phoneCopied') : t('contactCopyFailed', { value }));
  }));
  document.querySelectorAll('[data-pending-link]').forEach(button=>button.addEventListener('click',()=>notify(t('pendingLink'))));
  const thanks=document.querySelector('.letter-thanks');
  let liked = false;
  let count = 0;
  const updateLikeLabel = () => {
    const label = thanks.querySelector('[data-i18n]');
    const key = liked ? 'likeThanks' : 'like';
    label.setAttribute('data-i18n', key);
    label.textContent = t(key);
  };
  thanks.addEventListener('click', () => {
    liked = !liked;
    count += liked ? 1 : -1;
    thanks.setAttribute('aria-pressed', String(liked));
    thanks.classList.toggle('apricot-on', liked);
    updateLikeLabel();
    const number = document.createElement('span');
    number.textContent = String(count);
    number.className = liked ? 'num-up' : 'num-down';
    thanks.querySelector('[data-like-count]').replaceChildren(number);
    document.querySelector('#thanks-status').textContent = liked
      ? t('likedStatus')
      : t('unlikedStatus');
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let filterAnimation;
  const filterButtons = [...document.querySelectorAll('[data-writing-filter]')];
  const writingEntries = [...document.querySelectorAll('[data-writing-category]')];
  const writingEmpty = document.querySelector('.writing-empty');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.writingFilter;
    filterButtons.forEach(filter => {
      filter.setAttribute('aria-pressed', String(filter === button));
      filter.classList.toggle('u-on', filter === button);
    });
    writingEntries.forEach(entry => {
      entry.hidden = selected !== 'all' && entry.dataset.writingCategory !== selected;
    });
    if (writingEmpty) writingEmpty.hidden = writingEntries.some(entry => !entry.hidden);
    if (filterAnimation) filterAnimation.cancel();
    const result = writingEmpty && !writingEmpty.hidden ? writingEmpty : document.querySelector('.writing-list');
    if (!reducedMotion.matches && result && typeof result.animate === 'function') {
      filterAnimation = result.animate([
        { opacity: 0, transform: 'translateY(3px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
    }

  }));
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const scenes = [
      { root: document.querySelector('#letter'), selector: '.letter-body p, .letter-thanks' },
      { root: document.querySelector('#writing'), selector: '.section-heading, .writing-filters, .writing-list' },
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
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of links){const active=link.hash==='#'+entry.target.id;link.classList.toggle('u-on',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')}}},{rootMargin:'-15% 0px -60% 0px',threshold:0});document.querySelectorAll('#letter,#writing,#connect').forEach(section=>observer.observe(section))}
})();
