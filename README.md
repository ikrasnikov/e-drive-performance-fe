# e-drive performance — landing

Landing page of **e-drive performance**, a service for Tesla and other electric vehicles.
Static site on plain HTML / SCSS / JavaScript, built with [Vite](https://vite.dev),
available in four languages: Bulgarian (default), English, Russian and Ukrainian.
Deployed to GitHub Pages.

## Requirements

- Node.js 24 (see `.nvmrc`; `engine-strict` is on, so other versions are rejected by npm)
- npm 11

## Getting started

```bash
nvm use
npm install
npm run dev
```

The dev server runs at http://localhost:5173. `npm install` also sets up the git hooks (husky).

## Commands

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                              |
| `npm run build`        | Production build into `dist/`                           |
| `npm run preview`      | Serves the production build locally                     |
| `npm run lint`         | ESLint (JS) + Stylelint (SCSS)                          |
| `npm run lint-fix`     | Same linters with autofix                               |
| `npm run format`       | Formats all files with Prettier                         |
| `npm run format:check` | Checks formatting without changing files                |

## Languages

| Language  | URL    | Translations          |
| --------- | ------ | --------------------- |
| Bulgarian | `/`    | `src/locales/bg.json` |
| English   | `/en/` | `src/locales/en.json` |
| Russian   | `/ru/` | `src/locales/ru.json` |
| Ukrainian | `/ua/` | `src/locales/ua.json` |

The page markup lives in a single template, `src/templates/index.html` (+ `partials/`, sections in
`partials/sections/`, included as `{{> sections/hero}}`), written in
[Handlebars](https://handlebarsjs.com). At build time `build/i18n-pages.js` renders it once per
language into a separate static page. Texts are referenced as `{{t.section.key}}`.

- Every key must exist in all four locale files, otherwise the build fails with the list of
  missing keys.
- Non-translatable data (phone, language names and the list of services with their icons)
  lives in `src/data/site.json` and is available in templates as `{{site.*}}`. Texts for items
  from it are looked up by id: `{{tr "services" id "title"}}` → `t.services.<id>.title`.
- `src/index.html`, `src/en/index.html`, ... are only entry stubs that define the page URLs: do
  not put markup there.
- The Ukrainian page lives under `/ua/`, but its `lang` / `hreflang` is `uk` (the ISO language
  code).

## Project structure

```
build/              Vite plugin that renders the template per language
public/             Files copied as is (favicons, web manifest)
src/
  assets/fonts/     Montserrat variable font (Latin + Cyrillic, self-hosted)
  assets/images/    Logos and images
  locales/          Translations, one JSON per language
  data/site.json    Non-translatable data: phone, language names, services
  scripts/          JS: header, dropdowns, burger menu
  styles/
    abstracts/      Breakpoints mixin (no CSS output)
    base/           Design tokens, reset, typography, icons, utilities
    layout/         Container, page, header, footer
    sections/       Landing sections
  templates/        Page template and partials
```

## Styles

- Design tokens (colors, fonts, spacing, radii, shadows) are CSS custom properties in
  `src/styles/base/_tokens.scss`. The accent yellow is not for text on light backgrounds.
- Breakpoints are the same as in Academy (mono): `p0`–`p7` = 320 / 480 / 640 / 800 / 960 / 1120
  / 1280 / 1440 px.

  ```scss
  @use '../abstracts' as *;

  @include breakpoint(p3) { ... }      // >= 800px
  @include breakpoint(p3, max) { ... } // < 800px
  ```

- Class names follow BEM with two dashes (`block__element--modifier`), enforced by Stylelint.

## Fonts

Montserrat is self-hosted as a variable font (`src/assets/fonts/`, from
`@fontsource-variable/montserrat`, SIL OFL): one file per script covers all weights. The stylesheet
is linked in `<head>` and the font files are preloaded, so pages render styled from the first
paint. Latin is preloaded on every page, Cyrillic on the bg / ru / ua pages.

## Icons

[Material Symbols](https://fonts.google.com/icons) (Outlined, weight 400), inlined as SVG:

```handlebars
{{icon "bolt"}}
{{icon "electric_car" class="service-card__icon"}}
```

The name is the icon name from fonts.google.com/icons; the icon takes the current text color.

## Code style and git hooks

Same rules as in mono: Prettier, ESLint (flat config) and Stylelint.

- **pre-commit** — Prettier, ESLint and Stylelint with autofix on staged files
- **pre-push** — format check + full lint
- **post-merge** — `npm install` when `package.json` / `package-lock.json` changed

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: format check, lint, build and
publication to GitHub Pages. In the repository settings, *Settings → Pages → Source* must be set to
**GitHub Actions**.
