import { getNotes } from './notes';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';

type ImageWork = {
  slug: string;
  category: 'language' | 'thought' | 'experiment';
  created: string;
  image: string;
  width: number;
  height: number;
  tool: string;
  title?: Partial<Record<Language, string>>;
};

export const imageWorks: ImageWork[] = [{
  slug: 'gemini-2025-04',
  category: 'experiment',
  created: '2025-04',
  image: 'images/Gemini_Generated_Image_1zprme1zprme1zpr.jpg',
  width: 2048,
  height: 2048,
  tool: 'Gemini',
}];

export function formatWorkDate(date: string, lang: Language) {
  const [year, month, day] = date.split('-').map(Number);
  if (lang === 'ko') return [year, month, ...(day ? [day] : [])].map((value, index) => index ? String(value).padStart(2, '0') : String(value)).join('. ') + '.';
  return new Intl.DateTimeFormat('en', {year: 'numeric', month: 'short', ...(day ? {day: 'numeric'} : {}), timeZone: 'UTC'}).format(new Date(Date.UTC(year, month - 1, day || 1)));
}

// Only use titles supplied by the user. Untitled images share this fallback.
export const imageWorkTitle = (work: ImageWork, lang: Language) => work.title?.[lang]?.trim() || translate(lang, 'untitled');

export const getImageWorks = (lang: Language) => imageWorks.map(work => ({
  ...work,
  title: imageWorkTitle(work, lang),
  description: translate(lang, 'imageWorkDescription').replace('{tool}', work.tool),
  dateLabel: formatWorkDate(work.created, lang),
  alt: translate(lang, 'archiveImageAlt'),
}));

export function getWorks(lang: Language) {
  return [
    ...getNotes(lang).map(note => ({
      slug: note.slug, type: 'note' as const, category: note.frontmatter.category,
      title: note.frontmatter.title, description: note.frontmatter.description,
      date: note.frontmatter.date, dateLabel: formatWorkDate(note.frontmatter.date, lang),
      path: 'writing/' + note.slug + '/', image: '', alt: '', width: 0, height: 0,
    })),
    ...getImageWorks(lang).map(work => ({
      ...work, type: 'image' as const, date: work.created, path: 'works/' + work.slug + '/',
    })),
  ];
}
