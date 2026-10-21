import { getCollection } from 'astro:content';
import type { Language } from '../lib/i18n';

export async function getNotes(lang: Language) {
  const entries = await getCollection('notes', entry => entry.data.lang === lang);
  return entries
    .map(entry => ({ slug: entry.data.slug, frontmatter: entry.data, entry }))
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}
