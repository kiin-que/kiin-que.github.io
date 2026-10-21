import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// scripts/fetch-publish.mjs fills .publish/ from the Drive publish folder before every build.
const category = z.enum(['language', 'thought', 'experiment']);

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './.publish/notes', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    slug: z.string(),
    lang: z.enum(['ko', 'en']),
    title: z.string(),
    heading: z.string(),
    pageTitle: z.string(),
    description: z.string(),
    date: z.string(),
    category,
    source: z.string().default(''),
  }),
});

const works = defineCollection({
  loader: file('./.publish/works.json'),
  schema: z.object({
    slug: z.string(),
    category,
    created: z.string(),
    image: z.string(),
    width: z.number(),
    height: z.number(),
    tool: z.string(),
    title_ko: z.string().default(''),
    title_en: z.string().default(''),
    alt_ko: z.string(),
    alt_en: z.string(),
  }),
});

export const collections = { notes, works };
