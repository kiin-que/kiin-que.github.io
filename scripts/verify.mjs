import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
const root = path.resolve('dist');
const origin = 'https://kiin-que.github.io';
const base = '/';
const slug = 'gregoire-sweet-orange-tree';
const pages = ['index.html', 'en/index.html', 'writing/' + slug + '/index.html', 'en/writing/' + slug + '/index.html'];
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
  const article = name.includes('writing/');
  const url = origin + base + name.replace(/index\.html$/, '');
  assert.equal(document.documentElement.lang, en ? 'en' : 'ko');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), url);
  assert.equal(document.querySelectorAll('link[hreflang]').length, 3);
  assert.equal(document.querySelector('[data-language-link]').getAttribute('href'), base + (en ? '' : 'en/') + (article ? 'writing/' + slug + '/' : ''));
  assert.ok(!document.querySelector('.letter-brand, .reading-tags, dialog'));
  assert.ok(document.querySelector(article ? '.reading-site-footer' : '.letter-footer').textContent.includes('© 2026 Ki In'));
  assert.ok(document.querySelector('meta[name="description"]').getAttribute('content'));
  JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  for (const node of document.querySelectorAll('[src], [href]')) {
    const value = node.getAttribute('src') || node.getAttribute('href');
    if (value && !/^(mailto:|tel:|data:)/.test(value)) resource(value, url);
  }
  if (article) {
    assert.equal(document.querySelectorAll('.reading-body p').length, 4);
    assert.ok(document.querySelector('.reading-credits').textContent.includes('2025'));
    assert.ok(document.querySelector('.reading-body').textContent.includes(en ? 'These two books whisper' : '두 책은 인연과 맺어짐'));
  } else {
    assert.equal(document.querySelectorAll('.letter-body p').length, 6);
    assert.equal(document.querySelectorAll('.letter-body strong[lang="ko"]').length, en ? 2 : 0);
    assert.ok(document.querySelector('.letter-body').textContent.includes(en ? 'With the posture of a question mark' : '물음표를 닮은 자세'));
    assert.equal(document.querySelector('.letter-nav a[href="#connect"]').textContent.trim(), en ? 'Connect ↗' : '연결 ↗');
    const messages = JSON.parse(document.querySelector('#page-translations').textContent);
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
    vm.runInNewContext(fs.readFileSync(path.join(root, 'letter.js'), 'utf8'), {
      document, window, IntersectionObserver: Observer,
      matchMedia: () => ({matches: false, addEventListener() {}}),
      navigator: {}, setTimeout, clearTimeout,
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
      const visible = category === 'all' || category === 'thought';
      assert.equal(document.querySelector('.writing-entry').hidden, !visible);
      assert.equal(document.querySelector('.writing-empty').hidden, visible);
      assert.equal(button.getAttribute('aria-pressed'), 'true');
    }
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
assert.equal((sitemap.match(/<loc>/g) || []).length, 4);
assert.ok(!sitemap.includes('?lang='));
assert.ok(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(origin + base + 'sitemap.xml'));
console.log('Verified 4 bilingual pages, ' + checked + ' local links/assets, SEO metadata, likes, filters and scroll reveals.');
