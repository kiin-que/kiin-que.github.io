import { getCollection } from 'astro:content';
import { getNotes } from './notes';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';

export function formatWorkDate(date: string, lang: Language) {
  const [year, month, day] = date.split('-').map(Number);
  if (lang === 'ko') return [year, month, ...(day ? [day] : [])].map((value, index) => index ? String(value).padStart(2, '0') : String(value)).join('. ') + '.';
  return new Intl.DateTimeFormat('en', {year: 'numeric', month: 'short', ...(day ? {day: 'numeric'} : {}), timeZone: 'UTC'}).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

function formatMonth(date: string, lang: Language) {
  const [year, month] = date.split('-').map(Number);
  if (lang === 'ko') return year + '년 ' + month + '월';
  return new Intl.DateTimeFormat('en', {year: 'numeric', month: 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(year, month - 1, 1)));
}

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };

// Only use titles supplied by the user. Untitled images share this fallback.
export async function getImageWorks(lang: Language) {
  const entries = await getCollection('works', entry => entry.data.kind === 'image');
  return entries
    .map(({ data: work }) => {
      const description = translate(lang, 'imageWorkDescription').replace('{tool}', work.tool);
      return {
        ...work,
        image: 'media/works/' + work.image,
        mime: MIME[work.image.split('.').pop()!.toLowerCase()] ?? 'image/jpeg',
        title: (lang === 'en' ? work.title_en : work.title_ko).trim() || translate(lang, 'untitled'),
        description,
        dateLabel: formatWorkDate(work.created, lang),
        credit: formatMonth(work.created, lang) + ' · ' + description,
        alt: lang === 'en' ? work.alt_en : work.alt_ko,
      };
    })
    .sort((a, b) => b.created.localeCompare(a.created));
}

export async function getProjectWorks(lang: Language) {
  const entries = await getCollection('works', entry => entry.data.kind === 'project');
  return entries.map(({data: work}) => ({
    ...work,
    image: 'media/works/' + work.image,
    preview: work.preview ? 'media/works/' + work.preview : '',
    title: lang === 'en' ? work.title_en : work.title_ko,
    description: lang === 'en' ? work.description_en : work.description_ko,
    overview: lang === 'en' ? work.overview_en : work.overview_ko,
    label: (lang === 'en' ? work.label_en : work.label_ko) || translate(lang, 'projectWork'),
    sources: work.sources.map(source => ({url: source.url, label: lang === 'en' ? source.label_en : source.label_ko})),
    gallery: work.gallery.map(item => ({
      ...item, image: 'media/works/' + item.image,
      preview: item.preview ? 'media/works/' + item.preview : '',
      alt: lang === 'en' ? item.alt_en : item.alt_ko,
      caption: lang === 'en' ? item.caption_en : item.caption_ko,
    })),
    features: lang === 'en' ? work.features_en : work.features_ko,
    alt: lang === 'en' ? work.alt_en : work.alt_ko,
    dateLabel: work.created ? formatWorkDate(work.created, lang) : '',
  }));
}

export async function getDetailedWorks(lang: Language) {
  return [...await getProjectWorks(lang), ...await getImageWorks(lang)];
}

export async function getWorks(lang: Language) {
  return [
    ...(await getProjectWorks(lang)).map(work => ({ ...work, image: work.preview || work.image, type: 'project' as const, date: work.created, path: 'works/' + work.slug + '/' })),
    ...(await getNotes(lang)).map(note => ({
      slug: note.slug, type: 'note' as const, label: note.frontmatter.kind === 'letter' ? 'letterNote' : 'readingNote', category: note.frontmatter.category,
      title: note.frontmatter.title, description: note.frontmatter.description,
      date: note.frontmatter.date, dateLabel: formatWorkDate(note.frontmatter.date, lang),
      path: 'writing/' + note.slug + '/', image: '', alt: '', width: 0, height: 0,
    })),
    ...(await getImageWorks(lang)).map(work => ({
      ...work, type: 'image' as const, label: 'imageWork', date: work.created, path: 'works/' + work.slug + '/',
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
