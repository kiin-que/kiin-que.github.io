(() => {
  const drawer = document.querySelector('#postscript-drawer');
  const trigger = document.querySelector('[data-open-postscript]');
  if (!drawer || !trigger || typeof drawer.showModal !== 'function') return;
  document.documentElement.classList.add('postscript-ready');
  const feedback = drawer.querySelector('.postscript-feedback');
  const items = [...drawer.querySelectorAll('.postscript-item')];
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
  let dismissTimer;
  let clearTimer;
  function reset() {
    clearTimeout(revealTimer);
    clearTimeout(dismissTimer);
    clearTimeout(clearTimer);
    items.forEach(item => item.classList.remove('is-acknowledged'));
    feedback.classList.remove('is-visible');
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
  items.forEach(item => item.addEventListener('click', () => {
    reset();
    // Restart the small acknowledgement on every click; no completion or counter is saved.
    void item.offsetWidth;
    item.classList.add('is-acknowledged');
    revealTimer = setTimeout(() => {
      feedback.textContent = feedback.dataset.message;
      feedback.classList.add('is-visible');
    }, 20);
    dismissTimer = setTimeout(() => {
      item.classList.remove('is-acknowledged');
      feedback.classList.remove('is-visible');
      clearTimer = setTimeout(() => { feedback.textContent = ''; }, 200);
    }, 1700);
  }));
})();
