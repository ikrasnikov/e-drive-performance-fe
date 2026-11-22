import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import Handlebars from 'handlebars';

// Root folder of an installed package (works for packages that do not export package.json)
const packageDir = (name) => dirname(findPackageJSON(name, import.meta.url));

const BRAND_ICONS_DIR = resolve(import.meta.dirname, '..', 'src', 'assets', 'icons');

// Brand icons are drawn in two colors, mapped to CSS so the icons follow the theme:
// graphite (also plain black) fills/strokes -> currentColor, accent fills -> .icon__accent.
// White fills (inner backgrounds) become transparent, so icons also work on dark sections.
const BRAND_COLORS = {
  graphite: /(fill|stroke)="(#0f1216|black|#000|#000000)"/gi,
  accent: /fill="#ffc107"/gi,
  white: /fill="(white|#fff|#ffffff)"/gi,
};

// {{icon "bolt"}} -> Material Symbols (outlined), UI icons
// {{icon "brand:services/repair"}} -> src/assets/icons/services/repair.svg, custom illustrative icons
const ICON_SETS = {
  material: {
    file: (name) => join(packageDir('@material-symbols/svg-400'), 'outlined', `${name}.svg`),
    hint: 'check the name on fonts.google.com/icons',
  },
  brand: {
    file: (name) => join(BRAND_ICONS_DIR, `${name}.svg`),
    hint: `add the SVG to ${BRAND_ICONS_DIR}`,
    transform: (svg) =>
      svg
        .replace(BRAND_COLORS.graphite, '$1="currentColor"')
        .replace(BRAND_COLORS.accent, 'class="icon__accent"')
        .replace(BRAND_COLORS.white, 'fill="none"'),
    className: 'icon--brand',
  },
};

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
  const dataDir = resolve(root, 'data');

  const createRenderer = (messages) => {
    const hbs = Handlebars.create();

    // Partials are named by their path inside partials/: {{> header}}, {{> sections/hero}}
    const partialsDir = join(templatesDir, 'partials');
    for (const file of readdirSync(partialsDir, { recursive: true })) {
      if (file.endsWith('.html')) {
        hbs.registerPartial(
          file.replace(/\.html$/, ''),
          readFileSync(join(partialsDir, file), 'utf8'),
        );
      }
    }

    // {{tr "services" id "title"}} -> t.services[id].title, for keys built from data (site.json ids)
    hbs.registerHelper('tr', (...args) => {
      const path = args.slice(0, -1).join('.');
      const value = path.split('.').reduce((node, key) => node?.[key], messages);
      if (typeof value !== 'string') {
        throw new Error(`Missing translation "${path}"`);
      }
      return value;
    });

    hbs.registerHelper('icon', (fullName, options) => {
      const [setName, name] = fullName.includes(':') ? fullName.split(':') : ['material', fullName];
      const set = ICON_SETS[setName];
      const file = set?.file(name);
      if (!file || !existsSync(file)) {
        throw new Error(`Unknown icon "${fullName}", ${set?.hint ?? 'unknown icon set'}`);
      }
      const source = readFileSync(file, 'utf8').replace(/<\?xml[^>]*\?>\s*/, '');
      const svg = (set.transform ?? String)(source);
      const className = ['icon', set.className, options.hash.class].filter(Boolean).join(' ');
      return new hbs.SafeString(
        svg.replace(/<svg([^>]*)>/, (_tag, attrs) => {
          const viewBox = attrs.match(/viewBox="([^"]+)"/)?.[1];
          // Keep the root fill of the source (fill="none" for outlined icons), default to currentColor
          const fill = attrs.match(/\sfill="([^"]+)"/)?.[1] ?? 'currentColor';
          return `<svg class="${className}" viewBox="${viewBox}" fill="${fill}" aria-hidden="true" focusable="false">`;
        }),
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
      server.watcher.add([templatesDir, localesDir, dataDir]);
      server.watcher.on('change', (file) => {
        if ([templatesDir, localesDir, dataDir].some((dir) => file.startsWith(dir))) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const locale = localeFromPath(ctx.path);
        const messages = readJson(join(localesDir, `${locale}.json`));
        const site = readJson(join(dataDir, 'site.json'));
        const render = createRenderer(messages);

        return render({
          alternates: LOCALES.map((id) => ({
            ariaCurrent: id === locale ? 'page' : 'false',
            href: `${siteUrl}${localeUrl(base, id)}`,
            label: id,
            lang: languageCode(id),
            name: site.languages[id],
            path: localeUrl(base, id),
          })),
          base,
          canonical: `${siteUrl}${localeUrl(base, locale)}`,
          defaultHref: `${siteUrl}${localeUrl(base, DEFAULT_LOCALE)}`,
          homeHref: localeUrl(base, locale),
          currentLanguage: { label: locale, name: site.languages[locale] },
          // Latin is preloaded on every page (brand name), Cyrillic only where the texts need it
          hasCyrillic: locale !== 'en',
          lang: languageCode(locale),
          site,
          t: messages,
        });
      },
    },
  };
};
