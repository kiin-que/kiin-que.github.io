import raw from './projects.json';
import { translate } from '../lib/i18n';
import type { Language } from '../lib/i18n';

type Status = 'making' | 'imagining';
type Pair = [string, string];

interface RawLink {
  href: string;
  label: Pair;
}

interface RawItem {
  status: Status;
  example?: boolean;
  title: Pair;
  summary: Pair;
  link?: RawLink;
}

const file = raw as { note?: string; items: RawItem[] };

function pair(value: Pair, where: string, field: string, lang: Language) {
  if (!Array.isArray(value) || value.length !== 2 || value.some(item => typeof item !== 'string' || !item.trim())) {
    throw new Error(where + ': ' + field + '는 ["한국어", "English"]로 두 언어를 모두 적어야 합니다.');
  }
  return value[lang === 'en' ? 1 : 0].trim();
}

export function projectsAreSamples() {
  return file.items.length > 0 && file.items.every(item => item.example === true);
}

export function getProjects(lang: Language) {
  if (!Array.isArray(file.items)) throw new Error('src/data/projects.json: items는 목록이어야 합니다.');
  return file.items.map((item, index) => {
    const where = 'src/data/projects.json items[' + (index + 1) + ']';
    if (item.status !== 'making' && item.status !== 'imagining') {
      throw new Error(where + ': status는 "making"(작업중) 또는 "imagining"(구상중)이어야 합니다.');
    }
    if (item.example !== undefined && item.example !== true && item.example !== false) {
      throw new Error(where + ': example은 true 또는 false만 쓸 수 있습니다.');
    }
    let link = null;
    if (item.link) {
      let href: string;
      try { href = new URL(item.link.href).href; }
      catch { throw new Error(where + ': link.href가 주소가 아닙니다.'); }
      if (!href.startsWith('https://')) throw new Error(where + ': link.href는 https 주소만 쓸 수 있습니다. 비공개 저장소 주소는 적지 마세요.');
      link = { href, label: pair(item.link.label, where, 'link.label', lang) };
    }
    return {
      status: item.status,
      statusLabel: translate(lang, item.status === 'making' ? 'statusMaking' : 'statusImagining'),
      example: item.example === true,
      title: pair(item.title, where, 'title', lang),
      summary: pair(item.summary, where, 'summary', lang),
      link,
    };
  });
}
