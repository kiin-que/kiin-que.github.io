import { withBase } from '../lib/i18n';
export function GET({ site }: { site: URL }) {
  return new Response('User-agent: *\nAllow: /\n\nSitemap: ' + new URL(withBase('sitemap.xml'), site).href + '\n', {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
}
