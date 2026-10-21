import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
const root = path.resolve('dist');
const origin = 'https://kiin-que.github.io';
const base = '/';
const slug = 'gregoire-sweet-orange-tree';
const pages = ['index.html', 'en/index.html', 'writing/' + slug + '/index.html', 'en/writing/' + slug + '/index.html', 'works/gemini-2025-04/index.html', 'en/works/gemini-2025-04/index.html'];
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
  assert.ok(!document.querySelector('.letter-brand, .reading-tags, dialog'));
  assert.ok(document.querySelector(article ? '.reading-site-footer' : '.letter-footer').textContent.includes('© 2026 Ki In'));
  assert.ok(document.querySelector('meta[name="description"]').getAttribute('content'));
  JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  for (const node of document.querySelectorAll('[src], [href]')) {
    const value = node.getAttribute('src') || node.getAttribute('href');
    if (value && !/^(mailto:|tel:|data:)/.test(value)) resource(value, url);
  }
  if (imageWork) {
    assert.equal(document.querySelector('h1').textContent, en ? 'Untitled' : '무제');
    assert.equal(document.querySelector('time').getAttribute('datetime'), '2025-04');
    assert.equal(document.querySelector('.image-work-figure figcaption').textContent, en ? 'April 2025 · Image generated with Gemini' : '2025년 4월 · Gemini로 생성한 이미지');
    const image = document.querySelector('.image-work-figure img').getAttribute('src');
    assert.equal(image, base + 'images/Gemini_Generated_Image_1zprme1zprme1zpr.jpg');
    assert.equal(document.querySelector('meta[property="og:image"]').getAttribute('content'), origin + image);
    const artwork = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(artwork['@type'], 'VisualArtwork');
    assert.equal(artwork.dateCreated, '2025-04');
    assert.equal(artwork.name, en ? 'Untitled' : '무제');
  } else if (article) {
    assert.equal(document.querySelectorAll('.reading-body p').length, 4);
    assert.ok(document.querySelector('.reading-credits').textContent.includes('2025'));
    assert.ok(document.querySelector('.reading-body').textContent.includes(en ? 'These two books whisper' : '두 책은 인연과 맺어짐'));
  } else {
    assert.equal(document.querySelectorAll('.letter-body p').length, 6);
    assert.equal(document.querySelectorAll('.letter-body strong[lang="ko"]').length, en ? 2 : 0);
    assert.ok(document.querySelector('.letter-body').textContent.includes(en ? 'With the posture of a question mark' : '물음표를 닮은 자세'));
    assert.equal(document.querySelector('.letter-nav a[href="#connect"]').textContent.trim(), en ? 'Connect ↗' : '연결 ↗');
    const messages = JSON.parse(document.querySelector('#page-translations').textContent);
    assert.equal(document.querySelectorAll('.writing-entry').length, 2);
    assert.equal(document.querySelector('.writing-entry-image .writing-title').textContent, en ? 'Untitled' : '무제');
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
    vm.runInNewContext(fs.readFileSync(path.join(root, 'letter.js'), 'utf8'), {
      document, window, IntersectionObserver: Observer,
      matchMedia: () => ({matches: false, addEventListener() {}}),
      navigator: {}, setTimeout, clearTimeout, URL,
    });
    const thanks = document.querySelector('.letter-thanks');
    const press = node => node.dispatchEvent(new window.Event('click'));
    for (let i = 1; i <= 10; i++) {
      press(thanks);
      assert.equal(thanks.getAttribute('aria-pressed'), String(i % 2 === 1));
      assert.equal(document.querySelector('[data-like-count]').textContent, String(i % 2));
      assert.equal(thanks.querySelector('[data-i18n]').textContent, messages[i % 2 ? 'likeThanks' : 'like']);
      assert.equal(thanks.classList.contains('apricot-on'), i % 2 === 1);
      assert.equal(thanks.querySelector('[data-like-count] span').className, i % 2 ? 'num-up' : 'num-down');
    }
    for (const category of ['language', 'experiment', 'thought', 'all']) {
      const button = document.querySelector('[data-writing-filter="' + category + '"]');
      press(button);
      const entries = [...document.querySelectorAll('.writing-entry')];
      const expectedCount = category === 'all' ? 2 : category === 'language' ? 0 : 1;
      assert.equal(entries.filter(entry => !entry.hidden).length, expectedCount);
      for (const entry of entries) assert.equal(entry.hidden, category !== 'all' && entry.dataset.writingCategory !== category);
      assert.equal(parseInt(button.querySelector('.writing-filter-count').textContent, 10), expectedCount);
      assert.equal(document.querySelector('.writing-empty').hidden, expectedCount > 0);
      assert.equal(button.getAttribute('aria-pressed'), 'true');
    }
    stored.set('kiin-writing-category', 'experiment');
    window.dispatchEvent(new window.Event('pageshow'));
    assert.equal(document.querySelector('[data-writing-filter="experiment"]').getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelector('.writing-entry-image').hidden, false);
    assert.equal(document.querySelector('.writing-entry:not(.writing-entry-image)').hidden, true);
    assert.equal(document.querySelectorAll('.scroll-line').length, 2);
    observers[0].callback(observed.slice(0, 3).map(target => ({target, isIntersecting: true})));
    assert.equal(document.querySelectorAll('.scroll-reveal:not(.is-visible)').length, 0);
  }
}
for (const file of ['common.css', 'letter.css', 'reading.css', 'language.css']) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) resource(match[1], origin + base + file);
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, 6);
assert.ok(!sitemap.includes('?lang='));
assert.ok(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(origin + base + 'sitemap.xml'));
console.log('Verified 6 bilingual pages, ' + checked + ' local links/assets, artwork metadata, untitled fallback, category counts/restoration, likes and scroll reveals.');
