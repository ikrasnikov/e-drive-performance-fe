import { resolve } from 'node:path';

import { defineConfig } from 'vite';

import { i18nPages, pageEntries } from './build/i18n-pages.js';

const root = resolve(import.meta.dirname, 'src');

// On GitHub Pages the site lives under /<repo>/: the deploy workflow passes BASE_PATH and SITE_ORIGIN
const base = `${(process.env.BASE_PATH ?? '').replace(/\/$/, '')}/`;
const siteUrl = (process.env.SITE_ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '');

export default defineConfig({
  base,
  root,
  publicDir: resolve(import.meta.dirname, 'public'),
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      // One page per language and page: index.html, en/index.html, en/privacy-policy/index.html...
      input: pageEntries(root),
    },
  },
  plugins: [i18nPages({ root, base, siteUrl })],
});
