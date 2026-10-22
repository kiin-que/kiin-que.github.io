// Copies the Drive publish folder (archive/publish) into .publish/ and public/media/ before Astro builds.
// CI reads it through the Apps Script web app (PUBLISH_URL + PUBLISH_TOKEN); local work reads a folder (PUBLISH_DIR).
// Only files that pass the checks below reach the site, so a stray draft fails the build instead of going live.
import fs from 'node:fs';
import path from 'node:path';

if (fs.existsSync('.env')) process.loadEnvFile('.env');

const OUT = path.resolve('.publish');
const MEDIA = path.resolve('public/media/works');
const CATEGORIES = ['language', 'thought', 'experiment'];
const KINDS = ['reading', 'letter'];
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;
const DATE = /^\d{4}-\d{2}(-\d{2})?$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

async function readSource() {
  const { PUBLISH_URL, PUBLISH_TOKEN, PUBLISH_DIR } = process.env;
  if (PUBLISH_URL) {
    const url = new URL(PUBLISH_URL);
    url.searchParams.set('token', PUBLISH_TOKEN ?? '');
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error('Publish source responded with HTTP ' + response.status);
    const body = await response.json();
    if (body.error) throw new Error('Publish source refused the request: ' + body.error);
    return body.files.map(file => ({
      path: file.path,
      data: 'base64' in file ? Buffer.from(file.base64, 'base64') : Buffer.from(file.text, 'utf8'),
    }));
  }
  if (PUBLISH_DIR) {
    return ['notes', 'works'].flatMap(dir => {
      const full = path.join(PUBLISH_DIR, dir);
      if (!fs.existsSync(full)) return [];
      return fs.readdirSync(full, { withFileTypes: true })
        .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
        .map(entry => ({ path: dir + '/' + entry.name, data: fs.readFileSync(path.join(full, entry.name)) }));
    });
  }
  throw new Error('Set PUBLISH_DIR to a local copy of archive/publish, or PUBLISH_URL and PUBLISH_TOKEN for the Apps Script source.');
}

// Frontmatter values are written as JSON literals ("text", ["a", "b"], 2048); anything else is kept as raw text.
function frontmatter(text, where) {
  const match = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!match) throw new Error(where + ': missing frontmatter');
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const pair = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!pair) throw new Error(where + ': cannot read frontmatter line "' + line + '"');
    const raw = pair[2].trim();
    try { data[pair[1]] = raw === '' ? '' : JSON.parse(raw); } catch { data[pair[1]] = raw; }
  }
  return data;
}

function need(data, keys, where) {
  for (const key of keys) {
    if (data[key] === undefined || data[key] === '') throw new Error(where + ': "' + key + '" is required');
  }
}

const files = await readSource();
const problems = [];
const check = (fn) => { try { fn(); } catch (error) { problems.push(error.message); } };
const notes = new Map();
const works = [];
const images = new Map(files.filter(file => file.path.startsWith('works/') && IMAGE.test(file.path)).map(file => [file.path.slice(6), file]));

for (const file of files) {
  const name = file.path.split('/').pop();
  if (file.path.startsWith('notes/') && name.endsWith('.md')) check(() => {
    const parts = name.match(/^(.+)\.(ko|en)\.md$/);
    if (!parts || !SLUG.test(parts[1])) throw new Error(file.path + ': name must be {slug}.ko.md or {slug}.en.md');
    const [, slug, lang] = parts;
    const text = file.data.toString('utf8');
    const data = frontmatter(text, file.path);
    if (data.visibility === 'private') throw new Error(file.path + ': marked private');
    need(data, ['slug', 'lang', 'title', 'heading', 'pageTitle', 'description', 'date', 'category'], file.path);
    if (data.slug !== slug || data.lang !== lang) throw new Error(file.path + ': slug/lang must match the file name');
    if (data.pageTitle !== data.heading + ' · Ki In') throw new Error(file.path + ': pageTitle must be heading + " · Ki In"');
    if (!CATEGORIES.includes(data.category)) throw new Error(file.path + ': unknown category "' + data.category + '"');
    if (data.kind !== undefined && !KINDS.includes(data.kind)) throw new Error(file.path + ': kind must be "reading" or "letter"');
    if (!DATE.test(data.date)) throw new Error(file.path + ': date must be YYYY-MM-DD or YYYY-MM');
    const entry = notes.get(slug) ?? {};
    entry[lang] = { data, text };
    notes.set(slug, entry);
  });
  else if (file.path.startsWith('works/') && name.endsWith('.md')) check(() => {
    const slug = name.slice(0, -3);
    if (!SLUG.test(slug)) throw new Error(file.path + ': name must be {slug}.md');
    const data = frontmatter(file.data.toString('utf8'), file.path);
    if (data.visibility === 'private') throw new Error(file.path + ': marked private');
    const kind = data.kind ?? 'image';
    if (!['image', 'project'].includes(kind)) throw new Error(file.path + ': unknown work kind');
    need(data, ['slug', 'category', 'image', 'width', 'height', 'alt_ko', 'alt_en'], file.path);
    if (kind === 'image') need(data, ['created', 'tool'], file.path);
    if (kind === 'project') {
      need(data, ['title_ko', 'title_en', 'description_ko', 'description_en', 'overview_ko', 'overview_en', 'features_ko', 'features_en', 'external_url'], file.path);
      for (const key of ['features_ko', 'features_en']) if (!Array.isArray(data[key]) || !data[key].length || data[key].some(value => typeof value !== 'string' || !value.trim())) throw new Error(file.path + ': invalid ' + key);
      if (new URL(data.external_url).protocol !== 'https:') throw new Error(file.path + ': project link must use HTTPS');
    }
    if (data.slug !== slug) throw new Error(file.path + ': slug must match the file name');
    if (!CATEGORIES.includes(data.category)) throw new Error(file.path + ': unknown category "' + data.category + '"');
    if (data.created && !DATE.test(data.created)) throw new Error(file.path + ': created must be YYYY-MM-DD or YYYY-MM');
    if (!Number.isInteger(data.width) || !Number.isInteger(data.height)) throw new Error(file.path + ': width and height must be numbers');
    if (!images.has(data.image)) throw new Error(file.path + ': image "' + data.image + '" is not in works/');
    works.push(data);
  });
  else if (!(file.path.startsWith('works/') && IMAGE.test(name))) console.warn('fetch-publish: ignoring ' + file.path);
}

for (const [slug, entry] of notes) check(() => {
  if (!entry.ko || !entry.en) throw new Error('notes/' + slug + ': both .ko.md and .en.md are required');
  for (const key of ['date', 'category', 'kind']) {
    if (entry.ko.data[key] !== entry.en.data[key]) throw new Error('notes/' + slug + ': "' + key + '" differs between ko and en');
  }
});
if (problems.length) {
  console.error('fetch-publish: the publish folder has problems, so nothing was built:\n- ' + problems.join('\n- '));
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(MEDIA, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'notes'), { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });
for (const [slug, entry] of notes) {
  for (const lang of ['ko', 'en']) fs.writeFileSync(path.join(OUT, 'notes', slug + '.' + lang + '.md'), entry[lang].text);
}
for (const work of works) fs.writeFileSync(path.join(MEDIA, work.image), images.get(work.image).data);
fs.writeFileSync(path.join(OUT, 'works.json'), JSON.stringify(works.map(work => ({ id: work.slug, ...work })), null, 2));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
  notes: [...notes].map(([slug, entry]) => ({ slug, ko: entry.ko.data, en: entry.en.data })),
  works,
}, null, 2));
console.log('fetch-publish: ' + notes.size + ' note(s), ' + works.length + ' visual work(s) from ' + (process.env.PUBLISH_URL ? 'Apps Script' : process.env.PUBLISH_DIR));
