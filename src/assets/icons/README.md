# Brand icons

Custom illustrative icons, inlined by `{{icon "brand:<folder>/<name>"}}` (e.g.
`{{icon "brand:services/repair"}}`).

Delivered set (48×48, graphite + accent): `services/` (5), `diagnostics/` (3), `advantages/` (5).
To replace an icon, overwrite the file keeping its name.

Requirements for delivered files:

- SVG, square `viewBox` (e.g. `0 0 48 48`), transparent background
- exactly two colors as fills: graphite `#0F1216` and accent `#FFC107` — they are mapped to
  `currentColor` and `.icon__accent` so CSS can recolor them (e.g. on dark sections)
- strokes outlined to fills; no text, raster images, filters, shadows, masks or gradients
- same grid, line weight and corner style across the set
