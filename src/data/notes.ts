import * as ko from '../content/notes/gregoire-sweet-orange-tree.ko.md';
import * as en from '../content/notes/gregoire-sweet-orange-tree.en.md';
import type { Language } from '../lib/i18n';
export const notes = [ { slug: 'gregoire-sweet-orange-tree', ko, en } ];
export const getNotes = (lang: Language) => notes.map(note => ({ slug: note.slug, ...note[lang] }));
