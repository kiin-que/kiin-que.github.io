import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
const root = path.resolve('dist');
const origin = 'https://kiin-que.github.io';
const base = '/';
const interfaceMessages = JSON.parse(fs.readFileSync('src/data/messages.json', 'utf8'));
// Expectations come from the publish folder that fetch-publish.mjs copied for this build.
const manifest = JSON.parse(fs.readFileSync(path.resolve('.publish/manifest.json'), 'utf8'));
const notes = new Map(manifest.notes.map(note => [note.slug, note]));
const works = new Map(manifest.works.map(work => [work.slug, work]));
const entryCount = notes.size + works.size;
const categoryCount = category => [...manifest.notes.map(note => note.ko.category), ...manifest.works.map(work => work.category)]
  .filter(value => category === 'all' || value === category).length;
const pages = ['index.html', 'en/index.html', ...[...notes.keys()].flatMap(slug => ['writing/' + slug + '/index.html', 'en/writing/' + slug + '/index.html']),
  ...[...works.keys()].flatMap(slug => ['works/' + slug + '/index.html', 'en/works/' + slug + '/index.html'])];
let checked = 0;
function resource(url, from) {
  const target = new URL(url, from);
  if (target.origin !== origin) return;
  assert.ok(target.pathname.startsWith(base), 'Missing GitHub Pages base: ' + target.href);
  const relative = decodeURIComponent(target.pathname.slice(base.length));
  const file = path.join(root, relative + (target.pathname.endsWith('/') ? 'index.html' : ''));
  assert.ok(fs.existsSync(file), 'Missing output: ' + file);
  if (target.hash && /.html$/.test(file)) {
    const doc = parseHTML(fs.readFileSync(file, 'utf8')).document;
    assert.ok(doc.getElementById(decodeURIComponent(target.hash.slice(1))), 'Missing fragment: ' + target.href);
  }
  checked++;
}
for (const name of pages) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  const { document, window } = parseHTML(html);
  const en = name.startsWith('en/');
  const imageWork = name.includes('works/');
  const article = name.includes('writing/') || imageWork;
  const url = origin + base + name.replace(/index\.html$/, '');
  assert.equal(document.documentElement.lang, en ? 'en' : 'ko');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), url);
  assert.equal(document.querySelectorAll('link[hreflang]').length, 3);
  const tail = name.replace(/^en\//, '').replace(/index\.html$/, '');
  assert.equal(document.querySelector('[data-language-link]').getAttribute('href'), base + (en ? '' : 'en/') + tail);
  assert.ok(!document.querySelector('.letter-brand, .reading-tags'));
  if (article) {
    const back = document.querySelector('main > .reading-back');
    assert.equal(back.textContent, interfaceMessages[imageWork ? 'backQuestions' : 'backList'][en ? 1 : 0]);
    assert.ok(!back.classList.contains('u-grow'), 'List return link should not animate an underline');
  }
  assert.ok(document.querySelector(article ? '.reading-site-footer' : '.letter-footer').textContent.includes('© 2026 Ki In'));
  assert.ok(document.querySelector('meta[name="description"]').getAttribute('content'));
  JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  for (const node of document.querySelectorAll('[src], [href]')) {
    const value = node.getAttribute('src') || node.getAttribute('href');
    if (value && !/^(mailto:|tel:|data:)/.test(value)) resource(value, url);
  }
  const slug = tail.split('/')[1];
  if (imageWork) {
    const work = works.get(slug);
    if (work.kind === 'project') {
      const title = en ? work.title_en : work.title_ko;
      assert.equal(document.querySelector('h1').textContent, title);
      assert.equal(document.title, title + ' · Ki In');
      assert.equal(document.querySelector('.reading-deck').textContent, en ? work.description_en : work.description_ko);
      assert.equal([...document.querySelectorAll('.project-overview p')].map(p => p.textContent).join('\n\n'), en ? work.overview_en : work.overview_ko);
      assert.equal(document.querySelectorAll('.reading-body li').length, (en ? work.features_en : work.features_ko)?.length ?? 0);
      assert.equal(document.querySelector('.project-work-link')?.getAttribute('href'), work.external_url);
      const sourceItems = [...document.querySelectorAll('.project-source-item')];
      assert.equal(sourceItems.length, work.sources?.length ?? 0);
      (work.sources ?? []).forEach((source, index) => {
        assert.equal(sourceItems[index].querySelector('a')?.getAttribute('href'), source.url);
        assert.equal(sourceItems[index].textContent, (en ? source.label_en : source.label_ko) + (source.url ? ' ↗' : ''));
      });
      const gallery = work.gallery ?? [];
      if (gallery.length) {
        const figures = [...document.querySelectorAll('.project-gallery-item')];
        assert.equal(figures.length, gallery.length);
        gallery.forEach((item, index) => {
          assert.equal(figures[index].querySelector('img').getAttribute('src'), base + 'media/works/' + (item.preview || item.image));
          assert.equal(figures[index].querySelector('img').getAttribute('alt'), en ? item.alt_en : item.alt_ko);
          assert.equal(figures[index].querySelector('h2').textContent, en ? item.caption_en : item.caption_ko);
          assert.equal(figures[index].querySelector('a').getAttribute('href'), base + 'media/works/' + item.image);
        });
      }
      const img = document.querySelector('.project-work-figure img');
      const firstImage = gallery[0] ?? work;
      assert.equal(img.getAttribute('src'), base + 'media/works/' + (firstImage.preview || firstImage.image));
      assert.equal(img.getAttribute('alt'), en ? firstImage.alt_en : firstImage.alt_ko);
      assert.equal(document.querySelector('meta[property="og:image"]').getAttribute('content'), origin + base + 'media/works/' + work.image);
      assert.equal(JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@type'], 'CreativeWork');
      if (!work.created) assert.equal(document.querySelector('time'), null, 'Do not invent a project date');
    } else {
    const title = (en ? work.title_en : work.title_ko).trim() || (en ? 'Untitled' : '무제');
    const tool = en ? 'Image generated with ' + work.tool : work.tool + '로 생성한 이미지';
    assert.equal(document.querySelector('h1').textContent, title);
    assert.equal(document.title, title + ' · Ki In');
    assert.equal(document.querySelector('time').getAttribute('datetime'), work.created);
    assert.ok(document.querySelector('.image-work-figure figcaption').textContent.endsWith(' · ' + tool));
    const img = document.querySelector('.image-work-figure img');
    const image = img.getAttribute('src');
    assert.equal(image, base + 'media/works/' + work.image);
    assert.equal(img.getAttribute('alt'), en ? work.alt_en : work.alt_ko);
    assert.equal(document.querySelector('meta[property="og:image"]').getAttribute('content'), origin + image);
    const artwork = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(artwork['@type'], 'VisualArtwork');
    assert.equal(artwork.dateCreated, work.created);
    assert.equal(artwork.name, title);
    }
  } else if (article) {
    const note = notes.get(slug)[en ? 'en' : 'ko'];
    assert.equal(document.title, note.pageTitle);
    assert.equal(document.querySelector('h1').textContent, note.heading);
    assert.equal(document.querySelector('.reading-deck').textContent, note.description);
    assert.equal(document.querySelector('time').getAttribute('datetime'), note.date);
    assert.equal(document.querySelector('.reading-meta span').textContent, note.kind === 'letter' ? (en ? 'Letter' : '편지') : (en ? 'Reading Note' : '독서록'));
    assert.ok(document.querySelectorAll('.reading-body p').length > 0, 'Empty note body: ' + name);
    assert.equal(document.querySelector('.reading-credits')?.textContent ?? '', note.source ?? '');
  } else {
    assert.equal(document.querySelectorAll('.letter-body p').length, 6);
    assert.equal(document.querySelectorAll('.letter-body strong[lang="ko"]').length, en ? 2 : 0);
    assert.ok(document.querySelector('.letter-body').textContent.includes(en ? 'With the posture of a question mark' : '물음표를 닮은 자세'));
    assert.equal(document.querySelector('.letter-nav a[href="#connect"]').textContent.trim(), en ? 'Connect ↗' : '연결 ↗');
    const pending = [...(manifest.inProgress ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.slug.localeCompare(b.slug));
    const postscript = document.querySelector('#postscript-drawer');
    const postscriptTrigger = document.querySelector('[data-open-postscript]');
    assert.equal(Boolean(postscript), pending.length > 0);
    assert.equal(Boolean(postscriptTrigger), pending.length > 0);
    if (pending.length) {
      assert.equal(postscript.tagName.toLowerCase(), 'dialog');
      assert.equal(postscript.querySelector('.postscript-title').textContent, interfaceMessages.postscriptTitle[en ? 1 : 0]);
      assert.equal(postscript.querySelector('.postscript-subtitle').textContent, interfaceMessages.postscriptSubtitle[en ? 1 : 0]);
      assert.equal(postscriptTrigger.getAttribute('aria-controls'), postscript.id);
      assert.equal(postscriptTrigger.getAttribute('aria-expanded'), 'false');
      assert.equal(postscript.querySelector('.postscript-feedback').getAttribute('role'), 'status');
      const rows = [...postscript.querySelectorAll('.postscript-item')];
      assert.equal(rows.length, pending.length);
      pending.forEach((item, index) => {
        assert.equal(rows[index].tagName.toLowerCase(), 'button');
        assert.equal(rows[index].querySelector('.postscript-item-title').textContent, en ? item.title_en : item.title_ko);
        assert.equal(rows[index].querySelector('time').getAttribute('datetime'), item.created);
        assert.ok(rows[index].querySelector('.postscript-check[aria-hidden="true"]'));
        assert.ok(!rows[index].hasAttribute('aria-pressed'), 'Acknowledgement is not a persistent completion state');
      });
    }
    const drawer = document.querySelector('#contact-drawer');
    const trigger = document.querySelector('[data-open-contact]');
    assert.equal(drawer.tagName.toLowerCase(), 'dialog');
    assert.equal(trigger.getAttribute('aria-controls'), drawer.id);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(drawer.querySelectorAll('.contact-link').length, 10);
    assert.equal(drawer.querySelectorAll('small, .contact-trailing').length, 0);
    assert.equal(drawer.querySelector('[data-copy-contact="email"]').textContent.trim(), en ? 'Copy' : '복사');
    assert.equal(drawer.querySelector('[data-copy-contact="phone"]').textContent.trim(), en ? 'Copy' : '복사');
    for (const link of drawer.querySelectorAll('.contact-link')) assert.ok(link.querySelector('svg use'), 'Contact icon missing');
    assert.equal(drawer.querySelector('[data-copy-contact="email"]').dataset.contactValue, 'haeumkorean@gmail.com');
    assert.equal(drawer.querySelector('[data-copy-contact="phone"]').dataset.contactValue, '0507-1386-2171');
    for (const href of ['https://haeonkorean.com/', 'https://haeum.haeonkorean.com/', 'https://www.instagram.com/haeumkorean/', 'https://www.threads.com/@haeumkorean', 'https://www.youtube.com/@studio_mama']) assert.ok(drawer.querySelector('a[href="' + href + '"]'));
    assert.equal(drawer.querySelector('a[href*="linkedin.com"]').getAttribute('href'), 'https://www.linkedin.com/in/해원-하-38a18a323/');
    assert.equal(drawer.querySelector('a[href*="github.com"]').getAttribute('href'), 'https://github.com/jasujung99');
    assert.equal(drawer.querySelector('a[href*="reddit.com"]').getAttribute('href'), 'https://www.reddit.com/user/haeumkorean/');
    const messages = JSON.parse(document.querySelector('#page-translations').textContent);
    assert.equal(document.querySelectorAll('.writing-entry').length, entryCount);
    const dates = [...document.querySelectorAll('.writing-entry')].map(entry => entry.querySelector('time')?.getAttribute('datetime') ?? '');
    assert.deepEqual(dates, [...dates].sort((a, b) => b.localeCompare(a)), 'Work list should be newest first, with undated entries last');
    for (const entry of document.querySelectorAll('.writing-entry')) assert.ok(entry.querySelector('.writing-title').textContent.trim(), 'Untitled list entry');
    assert.equal(document.querySelectorAll('.writing-excerpt, .writing-read').length, 0);
    assert.equal(document.querySelectorAll('#connect .contact-social').length, 1);
    assert.equal(document.querySelectorAll('#connect .contact-social a').length, 2);
    assert.equal(document.querySelectorAll('.archive-image').length, 0);
    for (const node of document.querySelectorAll('[data-i18n]')) {
      const key = node.getAttribute('data-i18n');
      if (key === 'helloPeriod' || key === 'helloQuestion') continue;
      assert.equal(node.textContent, messages[key], 'Untranslated text: ' + key);
    }
    const observed = [];
    const observers = [];
    class Observer {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target) { observed.push(target); }
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = Observer;
    const stored = new Map();
    window.sessionStorage = {getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value)};
    window.location = {href: url};
    window.history = {state: null, replaceState: (_, __, next) => { window.location.href = String(next); }};
    // The like counter web app is faked: the total starts at 41 and the press brings it to 42.
    const liked = new Map();
    window.localStorage = {getItem: key => liked.get(key) ?? null, setItem: (key, value) => liked.set(key, value)};
    const requests = [];
    const fakeFetch = async (url, options = {}) => {
      requests.push(options.method);
      return {ok: true, status: 200, json: async () => ({count: options.method === 'POST' ? 42 : 41})};
    };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'letter.js'), 'utf8'), {
      document, window, IntersectionObserver: Observer,
      matchMedia: () => ({matches: false, addEventListener() {}}),
      navigator: {}, setTimeout, clearTimeout, URL, fetch: fakeFetch,
    });
    const settle = () => new Promise(resolve => setTimeout(resolve, 0));
    await settle();
    const thanks = document.querySelector('.letter-thanks');
    const remote = Boolean(thanks.getAttribute('data-like-endpoint'));
    const shownCount = () => document.querySelector('[data-like-count]').textContent;
    const press = node => node.dispatchEvent(new window.Event('click'));
    assert.equal(shownCount(), remote ? '41' : '0');
    for (let i = 1; i <= 3; i++) {
      press(thanks);
      await settle();
      assert.equal(thanks.getAttribute('aria-pressed'), 'true', 'Likes cannot be undone');
      assert.equal(thanks.classList.contains('apricot-on'), true);
      assert.equal(thanks.querySelector('[data-i18n]').textContent, messages.likeThanks);
      assert.equal(shownCount(), remote ? '42' : '1');
    }
    assert.deepEqual(requests, remote ? ['GET', 'POST'] : []);
    assert.equal(liked.get('kiin-letter-liked'), '1');
    assert.equal(document.querySelector('#letter-toast').textContent, messages.likeAlready);
    for (const category of ['language', 'experiment', 'thought', 'all']) {
      const button = document.querySelector('[data-writing-filter="' + category + '"]');
      press(button);
      const entries = [...document.querySelectorAll('.writing-entry')];
      const expectedCount = categoryCount(category);
      assert.equal(entries.filter(entry => !entry.hidden).length, expectedCount);
      for (const entry of entries) assert.equal(entry.hidden, category !== 'all' && entry.dataset.writingCategory !== category);
      assert.equal(parseInt(button.querySelector('.writing-filter-count').textContent, 10), expectedCount);
      assert.equal(document.querySelector('.writing-empty').hidden, expectedCount > 0);
      assert.equal(button.getAttribute('aria-pressed'), 'true');
    }
    const restored = ['language', 'thought', 'experiment'].find(category => categoryCount(category) > 0);
    if (restored) {
      stored.set('kiin-writing-category', restored);
      window.dispatchEvent(new window.Event('pageshow'));
      assert.equal(document.querySelector('[data-writing-filter="' + restored + '"]').getAttribute('aria-pressed'), 'true');
      for (const entry of document.querySelectorAll('.writing-entry')) assert.equal(entry.hidden, entry.dataset.writingCategory !== restored);
    }
    assert.equal(document.querySelectorAll('.scroll-line').length, 2);
    observers[0].callback(observed.slice(0, 3).map(target => ({target, isIntersecting: true})));
    assert.equal(document.querySelectorAll('.scroll-reveal:not(.is-visible)').length, 0);
  }
}
for (const file of ['common.css', 'letter.css', 'reading.css', 'language.css', 'detail.css']) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) resource(match[1], origin + base + file);
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, pages.length);
assert.ok(!sitemap.includes('?lang='));
assert.ok(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(origin + base + 'sitemap.xml'));
console.log('Verified ' + pages.length + ' bilingual pages (' + notes.size + ' note(s), ' + works.size + ' visual work(s)), ' + checked + ' local links/assets, artwork metadata, untitled fallback, category counts/restoration, one-way likes with the counter, and scroll reveals.');
