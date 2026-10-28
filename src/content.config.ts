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
    kind: z.enum(['reading', 'letter']).default('reading'),
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
    kind: z.enum(['image', 'project']).default('image'),
    created: z.string().default(''),
    image: z.string(),
    preview: z.string().optional(),
    width: z.number(),
    height: z.number(),
    tool: z.string().default(''),
    description_ko: z.string().default(''),
    description_en: z.string().default(''),
    overview_ko: z.string().default(''),
    overview_en: z.string().default(''),
    features_ko: z.array(z.string()).default([]),
    features_en: z.array(z.string()).default([]),
    label_ko: z.string().default(''),
    label_en: z.string().default(''),
    gallery: z.array(z.object({
      image: z.string(), preview: z.string().optional(), width: z.number(), height: z.number(),
      alt_ko: z.string(), alt_en: z.string(),
      caption_ko: z.string(), caption_en: z.string(),
    })).default([]),
    external_url: z.string().url().optional(),
    sources: z.array(z.object({label_ko: z.string(), label_en: z.string(), url: z.string().url().optional()})).default([]),
    title_ko: z.string().default(''),
    title_en: z.string().default(''),
    alt_ko: z.string(),
    alt_en: z.string(),
  }),
});

const inProgress = defineCollection({
  loader: file('./.publish/in-progress.json'),
  schema: z.object({
    slug: z.string(),
    category,
    kind: z.literal('in-progress'),
    stage: z.enum(['idea', 'sketch', 'making']),
    created: z.string(),
    title_ko: z.string(),
    title_en: z.string(),
    order: z.number().int().nonnegative().default(0),
  }),
});

export const collections = { notes, works, inProgress };
