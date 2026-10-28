(() => {
  const drawer = document.querySelector('#postscript-drawer');
  const trigger = document.querySelector('[data-open-postscript]');
  if (!drawer || !trigger || typeof drawer.showModal !== 'function') return;
  document.documentElement.classList.add('postscript-ready');
  const feedback = drawer.querySelector('.postscript-feedback');
  const items = [...drawer.querySelectorAll('.postscript-item')];
  const popTemplate = drawer.querySelector('[data-postscript-pop]');
  const today = drawer.querySelector('[data-postscript-today]');
  function updateToday() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const part = type => parts.find(value => value.type === type).value;
    today.dateTime = `${part('year')}-${part('month')}-${part('day')}`;
    today.textContent = today.dataset.lang === 'ko'
      ? `${part('year')}. ${part('month')}. ${part('day')}.`
      : new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Seoul', day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
  }
  updateToday();
  setInterval(updateToday, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateToday();
  });
  let overflow = '';
  let revealTimer;
  let clearTimer;
  function reset() {
    clearTimeout(revealTimer);
    clearTimeout(clearTimer);
    drawer.querySelectorAll('.postscript-pop').forEach(pop => pop.remove());
    feedback.textContent = '';
  }
  trigger.addEventListener('click', () => {
    if (drawer.open) return;
    reset();
    updateToday();
    overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    drawer.showModal();
    trigger.setAttribute('aria-expanded', 'true');
  });
  drawer.querySelector('[data-close-postscript]').addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', event => {
    if (event.target !== drawer) return;
    const bounds = drawer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) drawer.close();
  });
  drawer.addEventListener('close', () => {
    reset();
    document.documentElement.style.overflow = overflow;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({preventScroll: true});
  });
  items.forEach(item => item.addEventListener('click', event => {
    reset();
    // Pop up above the pointer; keyboard clicks have no pointer, so use the title instead.
    const frame = drawer.getBoundingClientRect();
    const title = item.querySelector('.postscript-item-title').getBoundingClientRect();
    const fromPointer = event.detail > 0;
    const x = fromPointer ? event.clientX : title.left + title.width / 2;
    const y = fromPointer ? event.clientY - 8 : title.top;
    const pop = popTemplate.content.firstElementChild.cloneNode(true);
    drawer.append(pop);
    const half = pop.offsetWidth / 2;
    const edge = 8;
    pop.style.left = Math.min(Math.max(x - frame.left, half + edge), drawer.clientWidth - half - edge) + 'px';
    pop.style.top = Math.max(y - frame.top + drawer.scrollTop, pop.offsetHeight * 1.6) + 'px';
    pop.addEventListener('animationend', animation => {
      if (animation.target === pop) pop.remove();
    });
    revealTimer = setTimeout(() => { feedback.textContent = feedback.dataset.message; }, 20);
    clearTimer = setTimeout(() => { feedback.textContent = ''; }, 2600);
  }));
})();
