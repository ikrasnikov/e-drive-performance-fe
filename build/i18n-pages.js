import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';

import Handlebars from 'handlebars';

const require = createRequire(import.meta.url);
const ICONS_DIR = join(
  dirname(require.resolve('@material-symbols/svg-400/package.json')),
  'outlined',
);

// Locale id = URL segment, stub folder and locales/<id>.json name
export const LOCALES = ['bg', 'en', 'ru', 'ua'];
export const DEFAULT_LOCALE = 'bg';

// ISO 639-1 language code for lang/hreflang, when it differs from the locale id:
// the site uses /ua/ (familiar country code), but the Ukrainian language code is "uk"
const LANGUAGE_CODES = { ua: 'uk' };
const languageCode = (locale) => LANGUAGE_CODES[locale] ?? locale;

const localeUrl = (base, locale) => (locale === DEFAULT_LOCALE ? base : `${base}${locale}/`);

const localeFromPath = (path) => {
  const [segment] = path.replace(/^\//, '').split('/');
  return LOCALES.includes(segment) ? segment : DEFAULT_LOCALE;
};

const flattenKeys = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, nested]) =>
    nested !== null && typeof nested === 'object'
      ? flattenKeys(nested, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/**
 * Renders src/templates/index.html once per locale.
 * Every locale has a stub entry (src/index.html, src/en/index.html, ...) so Vite serves and builds
 * a separate static page per language; the stub content is replaced by the rendered template.
 */
export const i18nPages = ({ root, base = '/', siteUrl = '' }) => {
  const templatesDir = resolve(root, 'templates');
  const localesDir = resolve(root, 'locales');

  const createRenderer = () => {
    const hbs = Handlebars.create();

    for (const file of readdirSync(join(templatesDir, 'partials'))) {
      hbs.registerPartial(
        basename(file, '.html'),
        readFileSync(join(templatesDir, 'partials', file), 'utf8'),
      );
    }

    hbs.registerHelper('icon', (name, options) => {
      const svg = readFileSync(join(ICONS_DIR, `${name}.svg`), 'utf8');
      const className = ['icon', options.hash.class].filter(Boolean).join(' ');
      return new hbs.SafeString(
        svg.replace(
          /<svg[^>]*viewBox="([^"]+)"[^>]*>/,
          `<svg class="${className}" viewBox="$1" fill="currentColor" aria-hidden="true" focusable="false">`,
        ),
      );
    });

    return hbs.compile(readFileSync(join(templatesDir, 'index.html'), 'utf8'), { strict: true });
  };

  const validateLocales = () => {
    const reference = flattenKeys(readJson(join(localesDir, `${DEFAULT_LOCALE}.json`)));
    for (const locale of LOCALES) {
      const keys = new Set(flattenKeys(readJson(join(localesDir, `${locale}.json`))));
      const missing = reference.filter((key) => !keys.has(key));
      if (missing.length) {
        throw new Error(`Locale "${locale}" is missing keys: ${missing.join(', ')}`);
      }
    }
  };

  return {
    name: 'i18n-pages',

    buildStart() {
      validateLocales();
    },

    configureServer(server) {
      server.watcher.add([templatesDir, localesDir]);
      server.watcher.on('change', (file) => {
        if (file.startsWith(templatesDir) || file.startsWith(localesDir)) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const locale = localeFromPath(ctx.path);
        const render = createRenderer();

        return render({
          alternates: LOCALES.map((id) => ({
            ariaCurrent: id === locale ? 'page' : 'false',
            href: `${siteUrl}${localeUrl(base, id)}`,
            label: id,
            lang: languageCode(id),
            path: localeUrl(base, id),
          })),
          base,
          canonical: `${siteUrl}${localeUrl(base, locale)}`,
          defaultHref: `${siteUrl}${localeUrl(base, DEFAULT_LOCALE)}`,
          homeHref: localeUrl(base, locale),
          lang: languageCode(locale),
          t: readJson(join(localesDir, `${locale}.json`)),
        });
      },
    },
  };
};
