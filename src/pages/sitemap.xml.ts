import { getNotes } from '../data/notes';
import { getImageWorks } from '../data/works';
import { localPath } from '../lib/i18n';
export async function GET({ site }: { site: URL }) {
  const paths = ['', ...(await getNotes('ko')).map(note => 'writing/' + note.slug + '/'), ...(await getImageWorks('ko')).map(work => 'works/' + work.slug + '/')];
  const url = (lang: 'ko' | 'en', path: string) => new URL(localPath(lang, path), site).href;
  const entries = paths.flatMap(path => (['ko', 'en'] as const).map(lang => '<url><loc>' + url(lang, path) + '</loc>' + (['ko','en'] as const).map(other => '<xhtml:link rel="alternate" hreflang="' + other + '" href="' + url(other, path) + '"/>').join('') + '</url>'));
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + entries.join('') + '</urlset>', { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
