import { getCollection } from 'astro:content';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';
import { formatWorkDate } from './works';

const stageKeys = {idea: 'postscriptIdea', sketch: 'postscriptSketch', making: 'postscriptMaking'};

export async function getInProgress(lang: Language) {
  const entries = await getCollection('inProgress');
  return entries.map(({data}) => ({
    ...data,
    title: lang === 'en' ? data.title_en : data.title_ko,
    stageLabel: translate(lang, stageKeys[data.stage]),
    dateLabel: formatWorkDate(data.created, lang),
  })).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
