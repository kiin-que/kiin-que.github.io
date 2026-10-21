import messages from '../data/messages.json';
export type Language = 'ko' | 'en';
export function translate(lang: Language, key: string) {
  const pair = (messages as Record<string, string[]>)[key];
  if (!pair) throw new Error('Missing translation: ' + key);
  return pair[lang === 'en' ? 1 : 0];
}
export function withBase(path = '') {
  const base = import.meta.env.BASE_URL;
  return (base.endsWith('/') ? base.slice(0, -1) : base) + '/' + (path.startsWith('/') ? path.slice(1) : path);
}
export function localPath(lang: Language, path = '') {
  return withBase((lang === 'en' ? 'en/' : '') + path);
}
export function clientMessages(lang: Language) {
  return Object.fromEntries(Object.keys(messages).map(key => [key, translate(lang, key)]));
}
