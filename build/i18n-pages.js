import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import Handlebars from 'handlebars';

// Root folder of an installed package (works for packages that do not export package.json)
const packageDir = (name) => dirname(findPackageJSON(name, import.meta.url));

const BRAND_ICONS_DIR = resolve(import.meta.dirname, '..', 'src', 'assets', 'icons');

// Brand icons are drawn in two colors, mapped to CSS so the icons follow the theme:
// graphite (also plain black) fills/strokes -> currentColor, accent fills -> .icon__accent.
// White fills (inner backgrounds) become transparent, so icons also work on dark sections;
// white inside <mask>/<clipPath> is left alone, there it defines the visible area.
const BRAND_COLORS = {
  graphite: /(fill|stroke)="(#0f1216|black|#000|#000000)"/gi,
  accent: /fill="#ffc107"/gi,
  white: /fill="(white|#fff|#ffffff)"/gi,
};
const MASK_BLOCKS = /(<(mask|clipPath)\b[\s\S]*?<\/\2>)/;

const clearWhiteFills = (svg) =>
  svg
    .split(MASK_BLOCKS)
    .map((part, index) => {
      // split() with capture groups yields [outside, block, tagName, outside, ...]
      const kind = index % 3;
      if (kind === 2) {
        return '';
      }
      return kind === 0 ? part.replace(BRAND_COLORS.white, 'fill="none"') : part;
    })
    .join('');

// {{icon "bolt"}} -> Material Symbols (outlined), UI icons
// {{icon "brand:services/repair"}} -> src/assets/icons/services/repair.svg, custom illustrative icons
const ICON_SETS = {
  // {{icon "tb:brand-instagram"}} -> Tabler Icons (outline), brand logos (social networks)
  tb: {
    file: (name) => join(packageDir('@tabler/icons'), 'icons', 'outline', `${name}.svg`),
    hint: 'check the name on tabler.io/icons',
    className: 'icon--stroke',
  },
  material: {
    file: (name) => join(packageDir('@material-symbols/svg-400'), 'outlined', `${name}.svg`),
    hint: 'check the name on fonts.google.com/icons',
  },
  brand: {
    file: (name) => join(BRAND_ICONS_DIR, `${name}.svg`),
    hint: `add the SVG to ${BRAND_ICONS_DIR}`,
    transform: (svg) =>
      clearWhiteFills(
        svg
          .replace(BRAND_COLORS.graphite, '$1="currentColor"')
          .replace(BRAND_COLORS.accent, 'class="icon__accent"'),
      ),
    className: 'icon--brand',
  },
};

// Locale id = URL segment and locales/<id>.json name
export const LOCALES = ['bg', 'en', 'ru', 'ua'];
export const DEFAULT_LOCALE = 'bg';

// Legal documents: page id (key in locales legal.pages) -> URL slug, the same in every language.
// Rendered from templates/legal.html; the home page is rendered from templates/index.html.
const LEGAL_PAGES = {
  terms: 'terms',
  privacy: 'privacy-policy',
  cookies: 'cookie-policy',
  legalInfo: 'legal-info',
  accessibility: 'accessibility-statement',
};
const HOME_PAGE = 'home';
const PAGE_SLUGS = { [HOME_PAGE]: '', ...LEGAL_PAGES };

// ISO 639-1 language code for lang/hreflang, when it differs from the locale id:
// the site uses /ua/ (familiar country code), but the Ukrainian language code is "uk"
const LANGUAGE_CODES = { ua: 'uk' };
const languageCode = (locale) => LANGUAGE_CODES[locale] ?? locale;

const localeUrl = (base, locale) => (locale === DEFAULT_LOCALE ? base : `${base}${locale}/`);
const pageUrl = (base, locale, page) =>
  `${localeUrl(base, locale)}${PAGE_SLUGS[page] ? `${PAGE_SLUGS[page]}/` : ''}`;

// "/ru/privacy-policy/" or "/ru/privacy-policy/index.html" -> { locale: 'ru', page: 'privacy' };
// null for paths that are not pages of the site
const parsePagePath = (path) => {
  const segments = path
    .replace(/index\.html$/, '')
    .split('/')
    .filter(Boolean);
  const locale =
    LOCALES.includes(segments[0]) && segments[0] !== DEFAULT_LOCALE
      ? segments.shift()
      : DEFAULT_LOCALE;
  const page = Object.keys(PAGE_SLUGS).find((id) => PAGE_SLUGS[id] === (segments[0] ?? ''));
  return page && segments.length <= 1 ? { locale, page } : null;
};

/**
 * Entry HTML file of every page in every language, relative to the Vite root
 * (index.html, en/index.html, privacy-policy/index.html, en/privacy-policy/index.html, ...).
 * The files do not exist: the plugin serves them virtually and renders their content from the
 * templates, so the build emits one static page per language and page.
 */
export const pageEntries = (root) =>
  Object.fromEntries(
    LOCALES.flatMap((locale) =>
      Object.keys(PAGE_SLUGS).map((page) => [
        `${locale}-${page}`,
        resolve(root, `.${pageUrl('/', locale, page)}index.html`),
      ]),
    ),
  );

const ENTRY_STUB = '<!-- Rendered from src/templates by build/i18n-pages.js -->';

const flattenKeys = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, nested]) =>
    nested !== null && typeof nested === 'object'
      ? flattenKeys(nested, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/**
 * Renders every page once per locale: the home page from src/templates/index.html, the legal
 * documents from src/templates/legal.html. The entry HTML files are virtual (see pageEntries):
 * their content is replaced by the rendered template.
 */
export const i18nPages = ({ root, base = '/', siteUrl = '' }) => {
  const templatesDir = resolve(root, 'templates');
  const localesDir = resolve(root, 'locales');
  const dataDir = resolve(root, 'data');
  const entryFiles = new Set(Object.values(pageEntries(root)));

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

    // {{rich text}} -> a translation with markup and data, e.g. the legal texts:
    // "<a href=\"mailto:{{site.contacts.email}}\">…</a>" is rendered with the page context
    hbs.registerHelper(
      'rich',
      (source, options) =>
        new hbs.SafeString(hbs.compile(source, { strict: true })(options.data.root)),
    );

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
          // Stroke-drawn icons (Tabler) set their stroke on the root: carry these attributes over
          const strokeAttrs = [
            ...attrs.matchAll(/\s(stroke(?:-width|-linecap|-linejoin)?)="([^"]+)"/g),
          ]
            .map(([, attr, value]) => ` ${attr}="${value}"`)
            .join('');
          return `<svg class="${className}" viewBox="${viewBox}" fill="${fill}"${strokeAttrs} aria-hidden="true" focusable="false">`;
        }),
      );
    });

    return (template, context) =>
      hbs.compile(readFileSync(join(templatesDir, template), 'utf8'), { strict: true })(context);
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

  // Request or build path -> page; the base (GitHub Pages /<repo>/) is not part of the page path
  const pageFromPath = (path) =>
    parsePagePath(path.startsWith(base) ? `/${path.slice(base.length)}` : path);

  const renderPage = ({ locale, page }) => {
    const messages = readJson(join(localesDir, `${locale}.json`));
    const site = readJson(join(dataDir, 'site.json'));
    const homeHref = localeUrl(base, locale);
    const isHome = page === HOME_PAGE;
    const legalHref = Object.fromEntries(
      Object.keys(LEGAL_PAGES).map((id) => [id, pageUrl(base, locale, id)]),
    );
    const document = isHome ? null : messages.legal.pages[page];

    return createRenderer(messages)(isHome ? 'index.html' : 'legal.html', {
      alternates: LOCALES.map((id) => ({
        ariaCurrent: id === locale ? 'page' : 'false',
        href: `${siteUrl}${pageUrl(base, id, page)}`,
        label: id,
        lang: languageCode(id),
        name: site.languages[id],
        path: pageUrl(base, id, page),
      })),
      base,
      canonical: `${siteUrl}${pageUrl(base, locale, page)}`,
      currentLanguage: { label: locale, name: site.languages[locale] },
      defaultHref: `${siteUrl}${pageUrl(base, DEFAULT_LOCALE, page)}`,
      // Latin is preloaded on every page (brand name), Cyrillic only where the texts need it
      hasCyrillic: locale !== 'en',
      homeHref,
      lang: languageCode(locale),
      // Sections are optional parts of a legal document: paragraphs, a bullet list, term/value rows
      legal: document && {
        ...document,
        sections: document.sections.map((section) => ({
          items: [],
          list: [],
          text: [],
          ...section,
        })),
      },
      legalHref,
      legalPages: Object.keys(LEGAL_PAGES).map((id) => ({
        ariaCurrent: id === page ? 'page' : 'false',
        href: legalHref[id],
        label: messages.legal.pages[id].label,
      })),
      meta: isHome
        ? messages.meta
        : { title: `${document.title} — e-drive performance`, description: document.description },
      // Links to the sections of the home page: "#services" there, "/ru/#services" on other pages
      sectionHref: isHome ? '' : homeHref,
      site,
      // Social networks are shown only once their link is filled in site.json
      socialLinks: site.social.filter(({ url }) => url),
      t: messages,
      year: new Date().getFullYear(),
    });
  };

  return {
    name: 'i18n-pages',
    enforce: 'pre',

    buildStart() {
      validateLocales();
    },

    // Virtual entry files (see pageEntries)
    resolveId(id) {
      return entryFiles.has(id) ? id : null;
    },

    load(id) {
      return entryFiles.has(id) ? ENTRY_STUB : null;
    },

    configureServer(server) {
      server.watcher.add([templatesDir, localesDir, dataDir]);
      server.watcher.on('change', (file) => {
        if ([templatesDir, localesDir, dataDir].some((dir) => file.startsWith(dir))) {
          server.ws.send({ type: 'full-reload' });
        }
      });

      // Dev server: serve the pages, there are no entry files on disk for Vite to find
      server.middlewares.use(async (req, res, next) => {
        const [path] = req.url.split('?');
        if (!['GET', 'HEAD'].includes(req.method) || !pageFromPath(path)) {
          next();
          return;
        }
        if (!path.endsWith('/') && !path.endsWith('.html')) {
          res.writeHead(301, { Location: `${path}/` }).end();
          return;
        }
        try {
          const html = await server.transformIndexHtml(path, ENTRY_STUB, req.originalUrl);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (error) {
          next(error);
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const page = pageFromPath(ctx.path);
        if (!page) {
          throw new Error(`Unknown page "${ctx.path}"`);
        }
        return renderPage(page);
      },
    },
  };
};
