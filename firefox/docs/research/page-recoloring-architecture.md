# Page-Recoloring Architecture Research

**Target:** Firefox WebExtension (MV3) that (1) detects a page's color palette,
(2) classifies each DOM element into a semantic role
(`background` / `surface` / `text-muted` / `link` / `button` / `border` /
`error` / `warning` / …), and (3) recolors each element by mapping its role to a
fixed **Monokai** design-token palette:

| Token | Hex |
|---|---|
| background | `#272822` |
| text | `#f8f8f2` |
| green | `#a6e22e` |
| pink | `#f92672` |
| cyan | `#66d9ef` |
| orange | `#fd971f` |
| yellow | `#e6db74` |
| magenta | `#ae81ff` |

**Primary reference implementation:** Dark Reader (`github.com/darkreader/darkreader`).
All Dark Reader claims below are grounded in the actual source files fetched during
this research (see [Citations](#citations)). Claims I could not verify against a
fetched source are explicitly marked **UNVERIFIED**.

**Date of research:** 2026-03-30. Dark Reader `main` branch at fetch time.

---

## 0. Framing: how this tool differs from Dark Reader

Dark Reader is the closest mature open-source system, but it does **not** do what
this tool wants to do. Understanding the difference drives every design decision:

| Concern | Dark Reader (dynamic mode) | This tool (Monokai) |
|---|---|---|
| Goal | Make *any* page dark & readable | Impose a *fixed* token palette |
| Color mapping | Continuous HSL transform with "pole" anchors (`modifyBgHSL` / `modifyFgHSL`) — no fixed output set | Discrete: role → one of ~8 Monokai tokens |
| Element semantics | Property-based (`background` / `border` / `text`) + minimal tag defaults; **no** `error`/`warning`/`button` role detection | Needs a real role classifier |
| Output colors | Any RGB the transform yields | Exactly the Monokai set |
| Contrast | Emerges from pole scaling; never checks WCAG | Should be *checked/enforced* against WCAG |

**Consequence:** Dark Reader's *injection, stylesheet-rewriting, CSS-variable,
inline-style, shadow-DOM, and MutationObserver machinery* (Q3, Q5, Q6) is directly
reusable and battle-tested. Dark Reader's *color-mapping core* (`modify-colors.ts`)
and its *lack* of a role classifier (Q1, Q2, Q4) must be replaced with new logic.

Dark Reader's three-way property split — `background` / `border` / `text` — is the
natural "first pass" of a role classifier and is worth adopting as the base layer.

---

## 1. Palette detection

### 1.1 What Dark Reader's "dynamic theme" analysis actually does

Dark Reader does **not** extract a page palette up front. It is an *incremental,
stylesheet-driven* transformer, not a DOM-walking sampler. The flow
(`src/inject/dynamic-theme/index.ts`, `createDynamicStyleOverrides()`):

1. `getManageableStyles(document)` (`style-manager.ts`) collects every
   `<style>` and `<link rel="stylesheet">` in the document **and inside every
   shadow root** (via `iterateShadowHosts` from `src/inject/utils/dom.ts`).
2. For each stylesheet a **StyleManager** (`manageStyle()` in `style-manager.ts`)
   reads `sheet.cssRules` (`getRulesSync`) or, for cross-origin/`@import` sheets,
   fetches the CSS text and builds a CORS copy (`getRulesAsync`,
   `createOrUpdateCORSCopy`, `replaceCSSImports`).
3. `iterateCSSRules` (`css-rules.ts`) recursively walks rules, descending into
   `@media` / `@supports` / `@layer` / `@container` / `@import`, and calls
   `iterateCSSDeclarations` on each style rule.
4. `getModifiableCSSDeclaration` (`modify-css.ts`) inspects each
   `property: value`. For color-ish properties it calls `getColorModifier`, which
   parses the value and returns a closure bound to one of
   `modifyBackgroundColor` / `modifyBorderColor` / `modifyForegroundColor`.
5. `createStyleSheetModifier()` (`stylesheet-modifier.ts`) renders the modified
   rules into a **sync** `<style class="darkreader darkreader--sync">` placed
   immediately after the source stylesheet.

So the "palette" is whatever colors appear in CSS declarations. The only place
Dark Reader materializes a palette explicitly is
`src/inject/dynamic-theme/palette.ts`: `registeredColors: Map<hex, RegisteredColor>`
keys every distinct source color to its modified value and re-emits them as CSS
custom properties `--darkreader-{background,text,border}-<hex>` in a dedicated
:variables sheet. `getColorPalette()` returns `{background[], border[], text[]}`
and is used only to *re-map the same colors* when the theme settings change
(`createOrUpdateDynamicThemeInternal`, the `onlyColorsChanged` fast path) — not
to analyze a page.

### 1.2 The one place Dark Reader samples pixels: the dark-theme detector

`src/inject/detector.ts` (`hasBuiltInDarkTheme`) is the closest thing to
"weighted-by-area background sampling," and it is worth studying because it answers
"is this page already dark?" — the same sub-problem a palette detector faces:

- Early exit if `getComputedStyle(documentElement).filter` includes `invert(1)`
  or `colorScheme === 'dark'`.
- **Viewport grid sampling with `document.elementFromPoint`**, not a full DOM walk:
  cell size `CELL_SIZE = 256`, max `MAX_ROW_COUNT = 4` rows/cols, sampling at the
  center of each cell. It skips `<img>` elements and dedupes via a `Set`.
- For each sampled element, `parseColorWithCache(getComputedStyle(el).backgroundColor)`:
  - opaque (`a === 1`): compute `getSRGBLightness`; bail out (`return false`) if
    `> 0.6` (too light).
  - translucent: fall back to the element's computed `color` and bail if text
    lightness `< 0.4`.
  - Hard-coded rejection of a specific gray `{24,26,27}` (a browser-bug workaround
    for zorin.com).
- Final answer blends root + body background alphas:
  `rootLightness = (1 - rootColor.a) + rootColor.a * lightness(root)`, then
  `finalLightness = (1 - bodyColor.a) * rootLightness + bodyColor.a * lightness(body)`;
  dark if `finalLightness < 0.5`. This correctly handles `transparent` root/body
  that inherits from an ancestor.
- Precedence shortcuts: `<meta name="color-scheme" content="dark|only dark">`
  wins immediately; then `.dark` class on `html`/`body`; then
  `data-theme="dark"`.
- It temporarily **disables its own injected sheets** during the check
  (`sheet.disabled = true/false`) so its own output doesn't contaminate the
  measurement.
- `canCheckForStyle()` gates the check until `body.scrollHeight >= 32`,
  `clientHeight >= 32`, `childElementCount > 0`, and real styles exist — then a
  `MutationObserver` + `readystatechange` listener trigger the actual run.

**Takeaway for the Monokai tool:** to detect the page palette, (a) sample a
viewport grid via `elementFromPoint` for the *dominant background(s)* weighted by
visible area (each sample ≈ equal area), and (b) separately harvest *distinct
foreground/border/link* colors from computed styles for accent classification.
Dark Reader's grid-sample-and-blend-alpha approach is the verified reference for
(a).

### 1.3 CSS custom properties (variables)

Dark Reader's `VariablesStore` (`src/inject/dynamic-theme/variables.ts`) is a full
type-inference engine for CSS variables — this is the reference for handling
`var(--x)` palettes:

- Each `--*` declaration is inspected (`inspectVariable`). If its value (or its
  fallback) parses via `getRGBValues`/`parseColorWithCache` it is tagged an
  "unknown color var"; if it contains `url(`/gradient it is typed `VAR_TYPE_BG_IMG`.
- `inspectVarDependant` propagates type *usage*: a var used in
  `background-color`/`box-shadow` → `VAR_TYPE_BG_COLOR`; in `color`,
  `caret-color`, `-webkit-text-fill-color`, `fill`, `stroke`
  (`isTextColorProperty`) → `VAR_TYPE_TEXT_COLOR`; in `border*`/`outline*` →
  `VAR_TYPE_BORDER_COLOR`.
- `matchVariablesAndDependents()` runs a fixed-point pass: propagate types through
  the var-reference graph (`varRefs`), resolve "unknown" vars by their referrers,
  and emit type-change notifications so declarations depending on a var can be
  re-modified when the var's inferred type changes.
- Modified vars are re-emitted with the name *wrapped*:
  `--darkreader-bg<name>` / `--darkreader-text<name>` /
  `--darkreader-border<name>` / `--darkreader-bgimg<name>`
  (`wrapBgColorVariableName` etc.), and every `var(--x, fallback)` becomes
  `var(--darkreader-bg--x, <modified fallback>)` via `replaceCSSVariablesNames`.
  Raw (non-`var`) constructed colors inside `rgb(var(--x) …)` are rewritten back
  to raw `r, g, b` triples (`handleRawColorValue` / `parseRawColorValue`).

**Takeaway:** to *read* a page's variable palette, collect `--*` declarations whose
values parse as colors; to *remap* them, wrap names exactly as above so the
`var()` graph resolves to Monokai tokens without breaking references.

### 1.4 Accent / link color extraction

There is no dedicated "find the accent color" pass. Links are handled by a
hard-coded user-agent override in `getModifiedUserAgentStyle`
(`modify-css.ts`):

```
a { color: modifyForegroundColor({r:0, g:64, b:255}) }   // #0040ff
```

plus special handling of `mark` (black), `table` border (gray 128), and
`::placeholder` (gray 169). Real link colors are then whatever the page's CSS
says, transformed per-declaration. For the Monokai tool, an explicit accent
detector (most-saturated non-neutral foreground color used on `a`/`.link`/buttons)
will be needed; Dark Reader does not provide one.

---

## 2. Element classification (semantic roles)

**Dark Reader does not classify elements into semantic roles.** It classifies
*CSS properties* into `background` / `border` / `text`, with a thin layer of tag
defaults. This is both a limitation and a template.

### 2.1 Property-based classification (verified, reusable)

`getColorModifier(prop, value, rule)` in `modify-css.ts` is the whole decision:

```
if unparsableColors.has(value)  → return value unchanged
   (inherit, transparent, initial, currentcolor, none, unset, auto)
if prop.includes('background')  → modifyBackgroundColor
   (unless a non-trivial mask-image is present → treat as foreground)
if prop.includes('border') || prop.includes('outline') → modifyBorderColor
else                                                    → modifyForegroundColor
```

And `getModifiableCSSDeclaration` widens "color-ish" to any property whose name
contains `color`, plus SVG `fill`, `stroke`, `stop-color`, plus `box-shadow`
(`getShadowModifier`) and gradient/image backgrounds (`getBgImageModifier`).

### 2.2 Tag / attribute heuristics that DO exist (verified)

From `getModifiedUserAgentStyle` (`modify-css.ts`) and inline-SVG handling
(`inline-style.ts`):

- **`a`** → link foreground (source `#0040ff`).
- **`table`** → border color (source gray 128).
- **`mark`** → foreground (source black).
- **`::placeholder`** → foreground (source gray 169).
- **`input, textarea, select, button, dialog`** → included in bg/border/fg sets
  *only when* `theme.styleSystemControls` is on.
- **`html`, `body`** → base background (`#ffffff`) and foreground (`#000000`).
- **`input:-webkit-autofill` / `textarea` / `select`** → forced light yellow
  `rgb(250,255,189)` bg + black fg, `!important`.
- **SVG:** `fill` on an element is classified as `background-color` vs `color` by
  **geometry** — `getBoundingClientRect` area vs `SMALL_SVG_THRESHOLD = 32`
  (32×32 px): big filled shape → background, small → foreground; `SVGTextElement`
  fill always → `color`; `SVGLineElement`/`SVGTextElement` stroke →
  `border-color`, other strokes → `color`; `stop-color` → `background-color`.
  `fill="none"` and `fill="currentColor"` are skipped.
- **`color` / `bgcolor` / `background` presentational attributes** are mapped to
  CSS props (`INLINE_STYLE_ATTRS` in `inline-style.ts`:
  `style, fill, stop-color, stroke, bgcolor, color, background`).
- **`<link rel="mask-icon" color="#000">`** explicitly excluded (causes silent
  DOMException).

### 2.3 Role detection for error/warning/success — NOT in Dark Reader

Dark Reader has **no** `error`/`warning`/`success` detection. For the Monokai tool
this must be built. Grounding from ARIA/MDN and the general shape of the problem:

- **`aria-live` regions** (`role="alert"`, `role="status"`, `aria-live="assertive|polite"`)
  are the reliable programmatic signal for dynamic error/warning/success toasts.
- **`role="alert"`** implies `aria-live="assertive"` + `aria-atomic="true"`; it is
  the canonical error/live-region.
- **Class-name heuristics** (`.error`, `.alert`, `.warning`, `.danger`, `.success`,
  `.info`, `.has-error`, `.text-danger`, `.bg-warning`, …) are common but brittle;
  Dark Reader's own `dynamic-theme-fixes.config` shows how much per-site class
  noise exists, which is why they use per-site CSS fixes rather than trying to
  infer semantics.
- **Color cues** (a saturated red-ish background/text) can disambiguate
  error vs warning, but note Monokai has no red — the mapping must decide
  error→pink `#f92672`, warning→orange `#fd971f`, success→green `#a6e22e`.
- **`<pre>`/`<code>`** → surface role (Monokai surface ≠ page background).
- **`<hr>`** → border role.
- **Form controls** (`input`, `select`, `textarea`, `button`, `[role=button]`,
  `[role=checkbox]`, `[role=tab]`, `[role=menuitem]`) → button/surface role.

**Known failure modes** (verified from Dark Reader's own escape hatches):
- Icon fonts / SVG logos misclassified as text → Dark Reader inverts them via
  the `INVERT` site-fix list.
- Elements whose *visible* color comes from a background image, gradient, or
  `filter`, not a solid color → classified by property name but visually wrong;
  handled by `IGNORE IMAGE ANALYSIS` and `IGNORE INLINE STYLE` lists.
- `currentColor` / `inherit` / `transparent` have no parseable color → must be
  left to cascade, not independently remapped (`unparsableColors` set).
- `mix-blend-mode` elements whose apparent color depends on compositing → Dark
  Reader does not model blend modes (see §5.6).

---

## 3. Recoloring mechanics

### 3.1 How Dark Reader applies colors — the four channels

1. **Generated static stylesheets with `!important`** — the main channel.
   `createStaticStyleOverrides()` (`index.ts`) injects ordered
   `<style class="darkreader darkreader--*">` elements into `<head>`:
   `fallback`, `user-agent`, `text`, `invert`, `inline`, `variables`,
   `root-vars` (all `position: 'beginning'`), and `override` (site fixes,
   `'ending'`). These are created by `createOrUpdateStyle` (class
   `darkreader darkreader--<id>`, `media="screen"`) and kept in a
   `staticStyleMap` WeakMap keyed by root.
2. **Per-stylesheet "sync" styles** — for *dynamic* rewriting, `manageStyle`
   creates `<style class="darkreader darkreader--sync">` inserted **immediately
   after** the source stylesheet (`insertStyle`, mode `'next'`), or into a hidden
   `.darkreader-style-container` div in `<body>` (mode `'away'`, used for hosts
   that break on style position: `chat.google.com`, `www.bloomberg.com`, etc. —
   `injection.ts`). The override sheet mirrors the *structure* of the source
   (`@media`/`@layer`/`@container` groups rebuilt in `buildStyleSheet()`).
3. **Inline-style indirection** — for elements with a `style` attribute or
   presentational color attributes (`inline-style.ts`): never touch the color
   directly; instead set a **custom property** (`--darkreader-inline-bgcolor`,
   `--darkreader-inline-color`, …) plus a **marker attribute**
   (`data-darkreader-inline-bgcolor`, …) on the element, and let the static
   `darkreader--inline` sheet apply
   `[data-darkreader-inline-bgcolor] { background-color: var(--darkreader-inline-bgcolor) !important; }`
   (`getInlineOverrideStyle`). This survives the page re-writing the `style`
   attribute and keeps `!important` out of the attribute.
4. **`adoptedStyleSheets` (constructable stylesheets)** —
   `createAdoptedStyleSheetOverride` (`adopted-style-manger.ts`) builds a parallel
   `CSSStyleSheet` for each source sheet and `injectSheet`s it **immediately after**
   the source in `node.adoptedStyleSheets`. On Firefox it unwraps
   `wrappedJSObject` and constructs the sheet via `pageWindow.CSSStyleSheet` (see
   §3.5).

### 3.2 `!important` handling (verified, important)

- When re-emitting a page rule, Dark Reader **preserves the original priority**:
  `getPriority(rule.style, property)` reads `getPropertyPriority` and stores it on
  `ModifiableCSSDeclaration.important`; `setRule` in `stylesheet-modifier.ts`
  appends ` !important` only if the source had it.
- To *beat* page rules that already use `!important`, the injected static sheets
  write their own `!important` (see `getModifiedFallbackStyle`,
  `getModifiedUserAgentStyle`, and every rule in the site-fixes config).
- CSS cascade/specificity is the real lever: the sync sheet is a *sibling* placed
  after the source, and identical selectors therefore win by order. `@layer` support
  (`isLayerRuleSupported` → wrap in `@layer { }`) is used to keep Dark Reader's
  rules out of the page's layer ordering.

### 3.3 Hover / focus / transitions

- `:hover`, `:focus`, `:focus-visible`, `:active`, `::before`, `::after` etc. are
  just `CSSStyleRule`s with those selectors; `iterateCSSRules` re-emits them like
  any other, so state styling is preserved automatically. Pseudo-elements appear
  in the selector text and are re-emitted verbatim (with Chromium-specific
  rewrites: `::picker` → `::picker(select)`, empty `:is()`/`:where()` neutralized
  to `.darkreader-unsupported-selector`, `::view-transition-*` neutralized — all in
  `setRule`).
- The `transition` property itself is **not** modified, so a page's
  `transition: background-color .3s` still animates — but the *initial* recolor on
  load is instantaneous (no transition from light→Monokai). For a smoother tool,
  you could inject a one-shot `transition` on load, at the cost of flash.
- SVG-logo inversion is gated on DOM readiness specifically to avoid forced-layout
  white flashes (`isReadyStateComplete()` gate in `inline-style.ts`, with the
  explanatory comment about unstyled-content flashes).

### 3.4 CSP and the stylesheet proxy

- **`<style>` elements inserted by a content script are exempt from the page's
  `style-src` CSP** — this is why the whole approach works without
  `unsafe-inline`. (This is the standard WebExtension content-script model; Dark
  Reader relies on it and does not fight CSP for styles.)
- **Scripts are a different matter.** To observe CSSOM mutations, Dark Reader must
  run code *in the page context*. In MV2 it injects
  `<script class="darkreader darkreader--proxy">(${injectProxy})(...)`
  (`stylesheet-proxy.ts`). In **MV3** (where inline page script injection is
  blocked) it instead dispatches a `__darkreader__stylesheetProxy__arg`
  `CustomEvent` consumed by a dedicated, extension-provided injector
  (`__CHROMIUM_MV3__` branch in `createStaticStyleOverrides`, plus
  `mv3-proxy.ts`). Firefox MV3 uses `wrappedJSObject`/page-world bridging instead
  (`isFirefox` unwraps throughout `adopted-style-manger.ts`).
- The proxy (`injectProxy`) monkey-patches:
  `CSSStyleSheet.{addRule,insertRule,deleteRule,removeRule,replace,replaceSync}`,
  `Element.attachShadow`, `Document.styleSheets` (to hide Dark Reader's own
  sheets), `Document/ShadowRoot.adoptedStyleSheets` (Proxy on the array to detect
  push/assign), `CSSStyleDeclaration.{setProperty,removeProperty}`, and
  `CustomElementRegistry.define`. Each mutation dispatches
  `__darkreader__updateSheet` / `__darkreader__adoptedStyleSheetChange` /
  `__darkreader__adoptedStyleDeclarationChange` / `__darkreader__shadowDomAttaching`,
  which the content script listens for.
- It also probes blob-URL support under CSP (`checkBlobURLSupport`) and listens for
  `securitypolicyviolation` with `blockedURI === 'blob'` to degrade gracefully
  (`image.ts`, `onCSPError`).
- A `__darkreader__inlineScriptsAllowed` event gates whether the proxy is live;
  if absent (page blocked the script), Dark Reader falls back to a
  `requestAnimationFrame` polling watcher for `adoptedStyleSheets`
  (`watchUsingRAF` in `adopted-style-manger.ts`).

### 3.5 Firefox MV3 specifics (verified)

- `adopted-style-manger.ts`: `getAdoptedSheets` and `createOverrideSheet` branch on
  `isFirefox` to go through `(node.adoptedStyleSheets as any).wrappedJSObject` and
  `(window as any).wrappedJSObject.CSSStyleSheet`. This is the
  `gecko`/`nsIXPCNativeUtils` unwrap needed because the content script and the page
  see different Xray wrappers. The equivalent of `exportFunction`/`cloneInto` is
  not shown in this file but the unwrap pattern is the verified idiom.
- `manifest-firefox.json` is the Firefox-specific manifest (separate from
  `manifest-chrome-mv3.json`).

**Design recommendation for the Monokai tool:** use channels 1 + 2 (generated
sheets) for stylesheet-driven colors, channel 3 (custom-property + data-attr
indirection) for inline styles, and channel 4 for constructable stylesheets. Do
**not** write `style.color = ...` directly on elements — it loses to page
`!important` and is clobbered by SPAs. Re-emitting the whole rule (preserving its
selector and `!important`) is the verified way to keep `:hover`/`:focus` intact.

---

## 4. Contrast preservation

### 4.1 The WCAG formula (verified from W3C)

Relative luminance (sRGB), from the WCAG definition:

```
c = channel8bit / 255
C = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ^ 2.4     // linearize
L = 0.2126*R + 0.7152*G + 0.0722*B
```

Contrast ratio:

```
CR = (L1 + 0.05) / (L2 + 0.05)          // L1 = lighter, L2 = darker; range 1..21
```

Thresholds: **SC 1.4.3** (AA) 4.5:1 normal text, 3:1 large text (≥18pt, or ≥14pt
bold; ≈24px / ≈18.5px). **SC 1.4.6** (AAA) 7:1 / 4.5:1. **SC 1.4.11** (non-text
contrast, e.g. UI borders/icons) 3:1. The thresholds are *not rounded* (4.499 fails
4.5).

**Critical verified finding:** Dark Reader's `getSRGBLightness` (`src/utils/color.ts`)
is **not** the WCAG luminance:

```js
export function getSRGBLightness(r, g, b) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;   // no sRGB linearization
}
```

It uses the right *coefficients* but skips the `^2.4` linearization, dividing raw
0–255 values by 255. It is a fast perceptual-lightness proxy for *binning* colors
(dark vs light) — not a WCAG calculator. **If the Monokai tool must guarantee WCAG
contrast, implement the full linearized formula separately**; do not reuse
`getSRGBLightness` for compliance checks.

### 4.2 Why a naive swap breaks readability

- Mapping *every* background to `#272822` and *every* text color to `#f8f8f2`
  collapses all original hierarchy: "muted" text, placeholder text, secondary
  labels, and primary body text all become identical, so contrast-based
  hierarchy is destroyed even if absolute contrast is fine.
- Original *foreground/background pairings* matter: a light-gray text on white
  (contrast ≈1.8) that gets mapped to `#f8f8f2` on `#272822` (contrast ≈13.6)
  becomes *too* loud; a mid-blue link mapped onto a mid-tone accent surface can
  fall *below* 4.5:1. Without pairing-awareness you get both over- and
  under-contrast.
- Hue semantics are lost: red error text on a pink `#f92672` token may be
  illegible if the tool naively maps "red" → "pink" and "text" → "text".
- Alpha: `rgba` backgrounds composite with what's behind them; mapping the RGB
  without accounting for alpha changes the *effective* luminance.

### 4.3 Approaches that preserve relative luminance / pairing

**Dark Reader's approach — pole scaling (verified, `modify-colors.ts`).**
Instead of snapping to a palette, it *continuously* rescales HSL toward "pole"
anchor colors (`darkSchemeBackgroundColor` / `darkSchemeTextColor`), preserving
relative ordering:

- `modifyBgHSL`: cap background lightness at `MAX_BG_LIGHTNESS = 0.4`; neutral
  (low-saturation) colors adopt the pole hue/saturation; yellows (60–180°) are hue-
  shifted toward green/blue to avoid muddy dark yellow; yellow-ish hues (40–80°)
  get an extra `lx *= 0.75` darkening.
- `modifyFgHSL`: floor foreground lightness at `MIN_FG_LIGHTNESS = 0.55`; neutrals
  adopt the fg pole hue; blue foregrounds (205–245°) are hue-nudged
  (`modifyBlueFgHue`) so blue text doesn't vanish on dark bg.
- `modifyBorderHSL`: rescale lightness into a narrow `0.5 → 0.2` band so borders
  stay visible but subordinate.
- `modifyLightSchemeColor` (light/"dimmed" mode) uses the same neutral/blue logic
  with both poles.
- Every color is transformed by the *same monotonic* lightness map, so relative
  lightness ordering is preserved — this is exactly the "rank-preserving" property
  the Monokai tool wants, but expressed continuously rather than against 8 tokens.

**Academic grounding — Chameleon (arXiv:2512.00516, verified).** For *fixed-palette*
dark-mode adaptation (the Monokai case), this paper is the direct reference. It
formulates palette transformation as a constrained optimization with three loss
terms over the **LCH** color space:

- `E_LC` (luminance-contrast consistency):
  `||L_bg_light − L_i_light| − |L_i_dark − L_bg_dark||` — keep each element's
  lightness *distance from the background* the same across modes.
- `E_CC` (color/semantic consistency): `ΔE2000(C_light, C_dark)` — keep each color
  perceptually near its original so meaning (e.g. red=error) survives.
- `E_AC` (adjacent-color difference consistency): preserve *pairwise* ΔE2000
  between neighboring colors so visual hierarchy/emphasis survives.

It minimizes `ω0·E_LC + ω1·E_CC + ω2·E_AC` via simulated annealing (T0=10000,
α=0.99, 20000 iterations), perturbing one L/C/H component at a time and rejecting
out-of-gamut results. Extraction is **k-means over RGB of non-background pixels**.
This is overkill for a live extension (too slow), but its *loss functions are the
right objective* to approximate:

**Practical mapping recipe for a fixed token set (recommended):**

1. Classify each source color as bg / text / border / accent (Q2).
2. For **text**: enforce the fg↔bg pairing *jointly*. Choose the Monokai token
   whose WCAG contrast against the element's (Monokai) background is ≥4.5:1 (≥3:1
   for large/muted text), preferring the token whose original lightness *rank*
   matches the source text's rank. For Monokai, `#f8f8f2` on `#272822` ≈13.6:1
   (body), muted text can use a mid-lightness token that still clears the
   threshold.
3. For **backgrounds**: map by lightness rank into the dark end (page bg
   `#272822`, surface a lighter step). Preserve rank so panels > page bg.
4. For **accents** (link/button/error/warning): map by hue bucket + lightness rank
   into {green, cyan, orange, yellow, pink, magenta}. Preserve *distinctness*:
   two source colors that were distinguishable must remain distinguishable (the
   `E_AC` idea) — if the source has more distinct accents than Monokai has tokens,
   fall back to a ΔE-ordered assignment rather than collapsing them.
5. Re-check every fg/bg pair against WCAG; if any pair falls below the threshold,
   nudge the token (or pick the next-ranked token) — an iterative repair loop,
   which is the discrete analogue of Chameleon's optimization.

**Luminance-rank mapping** (sort source colors by luminance, sort Monokai tokens by
luminance, map rank→rank within each role) is the simplest verified-good heuristic:
it preserves ordering exactly (like Dark Reader's monotonic pole map) and avoids
the worst naive-swap artifacts, at the cost of not checking per-pair WCAG — so
combine it with the WCAG repair loop above.

---

## 5. Hard cases

### 5.1 Transparent / rgba backgrounds

- **Parser:** `parseColorWithCache` / `parse` (`utils/color.ts`) handle `rgb()/rgba()`
  (comma + space + slash syntax, percentages, scientific notation), `hsl()/hsla()`
  (deg/rad/turn/%), hex (3/4/6/8), all named CSS colors, **system colors**
  (`ButtonFace`, `-webkit-focus-ring-color`, …), `transparent` → `{0,0,0,0}`, and
  modern functions `color()`, `color-mix()`, `hwb()`, `lab()`, `lch()`, `oklab()`,
  `oklch()` by delegating to a 1×1 canvas `domParseColor` fallback.
  `light-dark(a, b)` is resolved against `isSystemDarkModeEnabled()`.
  `calc()` in colors is lowered via `lowerCalcExpression` + `evalMath`.
- **Composite alpha blending** (detector.ts): `rootLightness = (1−a) + a*lightness`,
  then fold in body. Reuse this to get the *effective* background under a stack of
  translucent layers before classifying/mapping.
- `rgba(..., 0)` (fully transparent) must be left alone, not mapped to a solid
  Monokai token — otherwise panels suddenly become opaque.

### 5.2 Gradients

`getGradientModifier` (`modify-css.ts`) parses the gradient function
(`parseGradient` from `utils/css-text/parse-gradient`), splits into parts, and maps
*each color stop* through `modifyGradientColor` (= `modifyBackgroundColor`),
reassembling the function and preserving position/`from()`/`color-stop()` syntax.
Non-color parts (angles, positions) are copied verbatim. `modifyGradientColor` and
`modifyShadowColor` are both aliases of `modifyBackgroundColor`.

### 5.3 `currentColor`

`currentColor` is in the `unparsableColors` set → returned unchanged, so it keeps
following the cascade. Correct: you remap the `color` it references, not the
keyword. Same for `inherit`, `initial`, `unset`, `revert`, `none`, `auto`,
`transparent`.

### 5.4 CSS custom properties

Full engine described in §1.3 (`VariablesStore`). Key hard cases it handles:
vars referenced inside `rgb(var(--x))` constructed colors; vars whose type is only
resolvable from their referrers (fixed-point `matchVariablesAndDependents`); vars
never defined but with a resolvable fallback; recursive var chains with a depth cap
(`MAX_VARIABLE_DEPTH = 1000`) and substitution cap (`MAX_VARIABLE_SUBSTITUTIONS =
100000`).

### 5.5 Images / SVG / canvas / video — must NOT be recolored

- **`<img>`, `<canvas>`, `<video>` pixels are not recolored.** Dark Reader only
  analyzes *CSS background images* (`background-image`, `list-style-image`) via
  `getBgImageModifier` + `getImageDetails`. For those it can (a) hide a large light
  image (`result = 'none'`), (b) replace a *solid-color* image with a solid SVG
  (`getSolidColorImageURL`), or (c) filter an image by wrapping it in an SVG
  `feColorMatrix` (`getFilteredImageURL`). The Monokai tool should simply **skip**
  these elements entirely — detect via tag name and skip.
- **Image analysis thresholds** (`image.ts`, `analyzeImage`) — useful if you ever
  *do* need to inspect an image: downscale to ≤`MAX_ANALYSIS_PIXELS_COUNT = 32×32`
  on a shared canvas (`willReadFrequently: true`, smoothing off); classify
  `TRANSPARENT_ALPHA_THRESHOLD = 0.05`, `DARK_LIGHTNESS_THRESHOLD = 0.4`,
  `LIGHT_LIGHTNESS_THRESHOLD = 0.7` per pixel; image is `isDark`/`isLight` if
  ≥`DARK_IMAGE_THRESHOLD`/`LIGHT_IMAGE_THRESHOLD = 0.7` of opaque pixels qualify;
  `isTransparent` if ≥`TRANSPARENT_IMAGE_THRESHOLD = 0.1` of all pixels are
  transparent; `isLarge` if `sw*sh > LARGE_IMAGE_PIXELS_COUNT = 512*512`; a
  `solidColor` is detected when the image is fully opaque and lightness range
  `< SOLID_LIGHTNESS_DIFF_THRESHOLD = 0.1`.
- **Inline SVG** *is* recolored (it's DOM, not pixels) — by `fill`/`stroke`/
  `stop-color` attribute + geometry heuristics (§2.2), with a
  `data-darkreader-inline-invert` opt-in for logo-like SVGs (class contains
  `logo`), applied via `filter: invert(100%) hue-rotate(180deg)`.
- **`<canvas>`/`<video>`/`<img>`:** skip by tag. There is no safe automatic
  recolor; anything drawn inside is opaque pixels.

### 5.6 Iframes (`all_frames`)

- The extension runs in every frame; each frame independently runs the whole
  pipeline. `createOrUpdateDynamicTheme(…, iframe)` passes `isIFrame`, and
  `getModifiedUserAgentStyle` **skips the `html` background override** for iframes
  (so a transparent iframe keeps inheriting the parent's dark bg) and adds
  `color-scheme: dark !important` to `html`/`iframe` in dark mode to prevent the
  browser painting an unexpected iframe background.
- Cross-origin iframes are separate documents — the content script must be declared
  with `all_frames: true` and matching `matches` to reach them.
- PDF embeds get special handling (`tryInvertChromePDF` / `tryInvertEdgePDF`, a
  `backdrop-filter: invert(100%) contrast(90%)` overlay div).

### 5.7 Shadow DOM

- `iterateShadowHosts` (`utils/dom.ts`) is a recursive `TreeWalker` over
  `node.shadowRoot`, used to discover shadow roots for styles (`getManageableStyles`),
  inline styles, and static overrides.
- `createShadowStaticStyleOverrides` injects `darkreader--inline`,
  `darkreader--override`, `darkreader--invert` into each shadow root (inserted at
  `root.firstChild`), with a `delayedCreateShadowStaticStyleOverrides`
  MutationObserver to re-inject if a custom element clears an "empty" shadow root.
- `adoptedStyleSheets` on `ShadowRoot` are handled by the same
  `createAdoptedStyleSheetOverride` (it accepts `Document | ShadowRoot`).
- The proxy patches `Element.attachShadow` to fire
  `__darkreader__shadowDomAttaching` so newly created roots are discovered.

### 5.7b `mix-blend-mode`, `filter`, `backdrop-filter`

- **Not modeled.** Dark Reader has no general handler for `mix-blend-mode`; the
  apparent color of a blended element can't be computed from its declared color
  alone. It's handled *ad hoc* via per-site fixes that force
  `mix-blend-mode: normal !important` (verified in `dynamic-theme-fixes.config`,
  e.g. iherb, ldlc, triumph). Recommend: detect `mix-blend-mode != normal` /
  `backdrop-filter != none` and **skip or neutralize** those elements.
- `filter` is *used* by Dark Reader (inversion) rather than something it works
  around; the detector checks for an existing `invert(1)` filter on the root.
  A page-level `filter` on an ancestor changes every descendant's rendered color —
  another reason to skip blended/filtered subtrees.

### 5.8 Print styles, `forced-colors`, `prefers-contrast`

- **Print / non-screen media:** `ignoredMedia` (`css-rules.ts`) =
  `['aural','braille','embossed','handheld','print','projection','speech','tty','tv']`.
  `iterateCSSRules` descends into a `@media` block only if it matches
  `screen`/`all`/`(`…`; blocks whose media starts with an ignored keyword are
  skipped. Injected styles use `media="screen"`, so print output is unaffected.
  (Verified. Note: this means the tool does **not** restyle print — usually
  desirable.)
- **`forced-colors`** (Windows High Contrast etc., MDN verified): the browser
  overrides `color`, `background-color`, `border-color`, `outline-color`,
  `text-decoration-color`, `text-emphasis-color`, `column-rule-color`, SVG
  `fill`/`stroke` at paint time; forces `box-shadow`/`text-shadow` → `none`,
  non-`url` `background-image` → `none`, `color-scheme` → `light dark`,
  `scrollbar-color` → `auto`; draws text backplates. Author colors are ignored.
  `forced-color-adjust: none` opts an element out. A recoloring tool should
  either detect `@media (forced-colors: active)` and **disable itself** (let the
  OS palette win) or confine changes to non-forced properties. Note the browser
  picks system colors by *native* semantics, **not** ARIA roles.
- **`prefers-contrast`** (`more`/`less`/`no-preference`): a recolorer should honor
  `more` by raising text/background contrast targets (e.g. AAA 7:1). Dark Reader
  does not special-case it (no handler seen in fetched sources — **UNVERIFIED**
  whether it has any; I saw none).

### 5.9 `::selection`, `::placeholder`

- `::selection` / `::-moz-selection` are explicitly styled in
  `getModifiedSelectionStyle` (bg `!important`, color `!important`), using
  `getSelectionColor`: auto mode maps `rgb(0,96,212)` bg + white fg; custom mode
  picks black/white fg by HSL lightness `< 0.5`.
- `::placeholder` gets a user-agent override (source gray 169).
- Both are ordinary pseudo-element rules and are also rewritten if the page
  styles them. For Monokai: `::selection` → a defined token pair; `::placeholder`
  → the `text-muted` role.

### 5.10 SPAs / elements added later (MutationObserver strategy)

- **Stylesheet changes:** `watchForStyleChanges` (`watch/`) + a per-style-element
  `MutationObserver` (`manageStyle.watch`) re-render on `characterData`/`childList`/
  `attributes` changes; `@import` detection triggers a CORS re-fetch. Moved styles
  are restored via `watchForNodePosition` (with a retry cap).
- **Inline-style changes:** `watchForInlineStyles` (`inline-style.ts`) uses a tree
  observer (`createOptimizedTreeObserver`) for added nodes + an attribute observer
  filtered to `INLINE_STYLE_ATTRS`, throttled with a **circuit breaker**: after
  `MAX_ATTEMPTS_COUNT = 50` mutations within `ATTEMPTS_INTERVAL = 10s`, it backs
  off for `RETRY_TIMEOUT = 2s` and batches the backlog — a defense against sites
  that thrash inline styles.
- **Huge-mutation detection:** `isHugeMutation` (`utils/dom.ts`) — if a single
  batch has `> HUGE_MUTATIONS_COUNT = 1000` records *or* `> 1000` total added
  nodes, the observer switches from per-node diffing (`getElementsTreeOperations`
  → additions/moves/deletions sets) to a whole-root re-scan
  (`onHugeMutations`). This is the key SPA strategy: cheap incremental path for
  small changes, full rescan for bulk DOM swaps.
- **Node-position watchdog:** `watchForNodePosition` re-inserts a node the page
  moved/removed, capped at `MAX_ATTEMPTS_COUNT = 10` moves within 10 s then a 2 s
  backoff (`maxMoveCount = 10` in `style-manager.restore` — after 10 restores it
  gives up with a warning).
- **Inline-style teardown loop guard:** `trackInlineStyleTeardown` /
  `checkForTeardown` — if editing an element's styles causes its parent to be
  torn down `MAX_LOOP_TEARDOWNS = 10` times, Dark Reader **suspends** changes for
  that container (breaks feedback loops with reactive frameworks). Also a
  ProseMirror-specific skip (`dataset.nodeViewContent`).
- **rAF batching:** all async rule rebuilds go through `createAsyncTasksQueue`
  (`utils/throttle.ts`), which drains the queue in a single
  `requestAnimationFrame` callback (`runTasks` loops `while (task = tasks.shift())`).
  `throttle()` itself runs immediately then coalesces trailing calls to the next
  frame. `requestAnimationFrameOnce(token, cb)` dedupes per-token.

### 5.11 Performance budgets — how many elements per frame

Dark Reader does not expose a hard "N elements/frame" number, but the verified
mechanisms and constants define the budget:

- **Work is batched per animation frame** (`createAsyncTasksQueue`, `throttle`).
  So the practical budget is "whatever fits in one frame's async queue drain" —
  there is no explicit chunk size; it drains the whole queue in one rAF tick.
- **The 1000-node huge-mutation threshold** (`HUGE_MUTATIONS_COUNT = 1000`) is the
  de-facto bulk cutoff: beyond ~1000 added nodes in a batch, per-node processing is
  abandoned for a whole-root rescan.
- **Color-declaration caching** is the primary scaling lever:
  `colorModificationCache` (`modify-colors.ts`) is keyed by
  `getCacheId(rgb, theme, poleA, poleB)` — so each *distinct* source color is
  transformed once regardless of how many elements/rules use it. Similarly
  `rulesTextCache`/`rulesModCache` (`stylesheet-modifier.ts`) skip re-modifying
  unchanged rules (keyed by `getStyleRuleKey` = hash of `cssText` + parent
  media/layer/container), and `inlineStringValueCache`/`inlineStyleCache`
  dedupe inline overrides.
- **Palette registration** (`palette.ts`) means the same color maps to the same
  `var(--darkreader-…)` everywhere, so the *output* stylesheet stays small even on
  color-heavy pages.
- **Bail-outs:** `INCOMPLETE_DOC_LOADING_IMAGE_LIMIT = 256` (image loads deferred
  until `readyComplete` beyond 256 concurrent), `MAX_ANALYSIS_PIXELS_COUNT = 32×32`
  (image analysis), `MAX_VARIABLE_DEPTH = 1000` / `MAX_VARIABLE_SUBSTITUTIONS =
  100000` (var recursion), `MAX_CSS_IMPORT_DEPTH = 32`.
- Document visibility gate: dynamic styling is deferred while the tab is hidden
  (`setDocumentVisibilityListener(runDynamicStyle)`), and a `darkreader--fallback`
  static sheet covers the gap until async styles finish.

**Known real-world numbers (community/anecdotal, UNVERIFIED):** Dark Reader's
*dynamic* mode is widely reported as the slowest at initial load on very large or
busy pages (thousands of rules), with the cost front-loaded in stylesheet analysis;
after styles are analyzed, steady-state scrolling impact is small because results
are cached. Filter mode is reported as cheaper to start but worse during scroll on
Firefox. These are forum/blog reports, not measured benchmarks — treat as
directional only. **There is no published "N elements per frame" figure**; derive
your own with a budget (e.g. process ≤ ~2–4k declarations per frame, or a ~5ms
slice) and rely on color + rule caching to amortize.

**Recommendation:** mirror Dark Reader's structure — (a) cache transformation per
*distinct color*, (b) cache per *rule text*, (c) rAF-batch all rebuilds, (d) treat
`>1000`-node mutation batches as "rescan," (e) defer while hidden. Add an explicit
element/rule cap (e.g. bail to a simpler fallback theme beyond N rules) since
Monokai mapping is more expensive per color (WCAG check + rank) than Dark Reader's
pure HSL transform.

---

## 6. Testing

Verified Dark Reader test layout (from the repo tree + fetched `color.tests.ts`):

**Three tiers:**

1. **Pure unit tests (Node/Jest)** — `tests/unit/`. This is where pure color and
   role logic belongs. `tests/unit/utils/color.tests.ts` exhaustively tests
   `parse`, `rgbToString`, `rgbToHexString`, `hslToString`, `hslToRGB`, `rgbToHSL`,
   `lowerCalcExpression`, `getRGBValues` — including edge cases: every color syntax
   (`rgb(255,0,153)`, `rgb(255 0 153)`, `rgb(100%,0%,60%)`, `rgb(255 0 153 / 1)`,
   scientific notation `rgb(1e2, .5e1, …)`, `hsl(4.71239rad,…)`, `hsl(.75turn,…)`,
   hex 3/4/6/8, named `rebeccapurple`, system `InfoBackground` /
   `-webkit-focus-ring-color`, `transparent`), and **null cases** (`parse('sponge')`,
   `parse('#hello')`, malformed). Also `tests/unit/utils/math.tests.ts`,
   `parsing`, `text`, `url`, `time`, `uid`, `validation`, plus
   `tests/unit/inject/{fixes,selectors}.tests.ts` and `tests/unit/csp/csp.tests.ts`.
   Config/fix-file parsing: `tests/unit/config/config.tests.ts`.

2. **In-browser integration (Karma)** — `tests/inject/` with `karma.conf.js` /
   `karma.conf.cjs`, per-browser jest configs
   (`jest.config.firefox.mjs`, `jest.config.chrome-mv3.mjs`). These load **fixture
   HTML pages** and assert on the generated styles/DOM: `color.tests.ts`,
   `style-override.tests.ts`, `inline-override.tests.ts`, `link-override.tests.ts`,
   `variables.tests.ts`, `image-analysis.tests.ts`, `shadow-dom.tests.ts`,
   `media-query.tests.ts`, `injection.tests.ts`, `fixes.tests.ts`. Support:
   `echo-server.js`/`echo-client.ts` (serve fixtures), `background-stub.ts`,
   `customize.ts`, `polyfills.ts`.

3. **Real-browser E2E (Puppeteer/Playwright-style, `tests/browser/`)** —
   `dynamic/{style,inline-override,link-override}.tests.ts`, `e2e/{shadow-dom,
   fixes, toggle, environment, origin, export, devtools, news}.tests.ts`, a
   `server.js` fixture server and `coverage.js`. Test hooks are dispatched from the
   source as CustomEvents when `__TEST__` is set: `__darkreader__test__dynamicUpdateComplete`
   (after a dynamic re-render) and `__darkreader__test__asyncQueueComplete` (after
   the async task queue drains) — the harness awaits these instead of sleeping.

**Patterns worth copying for the Monokai tool:**
- Keep the role-classifier and color-mapper **pure and unit-testable** (no DOM),
  with the same exhaustive parse/edge-case style as `color.tests.ts`.
- Fixture HTML pages for integration: one page per hard case (transparent bg,
  gradient, CSS-var palette, shadow DOM, inline style, iframes, `currentColor`,
  mix-blend-mode, SPA-append) with expected Monokai output asserted.
- A WCAG-contrast assertion helper (assert every output fg/bg pair ≥ its
  threshold) as a *property* test over generated palettes — this is the check
  Dark Reader lacks.
- Optional screenshot/visual regression via a browser E2E tier; dispatch a
  completion CustomEvent from the recolorer so tests can await determinism.
- Test both Firefox MV3 and Chromium MV3 configs separately (the `isFirefox`
  code paths genuinely differ — `wrappedJSObject` unwrapping).

---

## 7. Condensed design sketch for the Monokai tool

1. **Detect (Q1):** viewport grid sample via `elementFromPoint` for dominant
   backgrounds (alpha-composited, weighted by sampled area); harvest distinct
   foreground/border/link colors from computed styles of visible elements; collect
   `--*` color variables via a `VariablesStore`-style type-inference pass.
2. **Classify (Q2):** property split (bg/border/text) as the base layer → tag/ARIA
   refinement (`a`, `button`, form controls, `pre`/`code`, `hr`, `table`) →
   role detectors for error/warning/success (`role=alert`/`aria-live`, `.error`/
   `.warning` classes, hue cues). Mark `currentColor`/`inherit`/`transparent` as
   cascade-following (skip).
3. **Map (Q4):** rank-preserving luminance mapping within each role + hue-bucket
   mapping for accents + a WCAG repair loop (full linearized contrast formula,
   **not** `getSRGBLightness`). Enforce fg↔bg pairing jointly.
4. **Apply (Q3):** generated `<style>` sheets (UA/fallback/override) with
   `!important`; per-stylesheet sync sheets re-emitting each rule with its original
   selector + `!important`; inline styles via custom-prop + data-attr indirection;
   `adoptedStyleSheets` overrides inserted after sources; CSS-variable name
   wrapping (`--darkreader-*`-style). Preserve `:hover`/`:focus` by re-emitting
   state rules verbatim. Run a page-world proxy (MV3 event-based injector /
   `wrappedJSObject` on Firefox) to catch CSSOM mutations.
5. **Skip (Q5):** `img`/`canvas`/`video`/bitmap pixels; non-screen media
   (`ignoredMedia`); `mix-blend-mode`/`backdrop-filter` subtrees;
   `forced-colors: active` (defer to OS) unless explicitly overridden.
6. **Stay fast (Q6):** cache per distinct color and per rule text; rAF-batch
   rebuilds; `>1000`-node batches → whole-root rescan; circuit-breaker backoff on
   inline-style thrash; defer while tab hidden; explicit rule/element bail-out cap.

---

## Citations

Every URL below was fetched during this research.

### Dark Reader source (fetched from `raw.githubusercontent.com/darkreader/darkreader/main/...`)
- `README.md` — https://raw.githubusercontent.com/darkreader/darkreader/main/README.md
- `src/generators/dynamic-theme.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/generators/dynamic-theme.ts
- `src/inject/dynamic-theme/index.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/index.ts
- `src/inject/dynamic-theme/modify-css.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/modify-css.ts
- `src/inject/dynamic-theme/modify-colors.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/modify-colors.ts
- `src/inject/dynamic-theme/palette.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/palette.ts
- `src/inject/dynamic-theme/variables.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/variables.ts
- `src/inject/dynamic-theme/inline-style.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/inline-style.ts
- `src/inject/dynamic-theme/adopted-style-manger.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/adopted-style-manger.ts
- `src/inject/dynamic-theme/style-manager.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/style-manager.ts
- `src/inject/dynamic-theme/stylesheet-modifier.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/stylesheet-modifier.ts
- `src/inject/dynamic-theme/stylesheet-proxy.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/stylesheet-proxy.ts
- `src/inject/dynamic-theme/injection.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/injection.ts
- `src/inject/dynamic-theme/css-rules.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/css-rules.ts
- `src/inject/dynamic-theme/image.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/dynamic-theme/image.ts
- `src/inject/detector.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/detector.ts
- `src/inject/utils/dom.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/inject/utils/dom.ts
- `src/utils/color.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/utils/color.ts
- `src/utils/throttle.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/utils/throttle.ts
- `src/config/dynamic-theme-fixes.config` — https://raw.githubusercontent.com/darkreader/darkreader/main/src/config/dynamic-theme-fixes.config
- `tests/unit/utils/color.tests.ts` — https://raw.githubusercontent.com/darkreader/darkreader/main/tests/unit/utils/color.tests.ts
- Git tree listing (`src/`, `tests/`) — https://api.github.com/repos/darkreader/darkreader/git/trees/main?recursive=1

### Standards & platform docs
- WCAG 2.1 Understanding SC 1.4.3 Contrast (Minimum) — contrast-ratio + relative-luminance formulas — https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- MDN: `Document.adoptedStyleSheets` (constructable stylesheets, cascade order, shadow-root sharing) — https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets
- MDN: `@media forced-colors` (forced properties, backplates, `forced-color-adjust`) — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors

### Academic / industry grounding
- Chameleon: Automated Color Palette Adaptation for Dark Mode Data Visualizations (arXiv:2512.00516) — LCH optimization, `E_LC`/`E_CC`/`E_AC` loss functions, ΔE2000, k-means extraction, simulated annealing — https://arxiv.org/html/2512.00516v1

### Search-result grounding (not individually fetched; used for orientation only)
- Dark Reader performance reports (community) — https://darkreader.org/blog/dynamic-theme/ , https://github.com/darkreader/darkreader/issues/535 , https://github.com/darkreader/darkreader/issues/1295
- Palette-extraction literature overview — https://onlinelibrary.wiley.com/doi/full/10.1002/col.22975
- CVD recoloring survey (contrast-preserving recoloring) — https://ebiquity.umbc.edu/_file_directory_/papers/711.pdf (PDF; not machine-fetched)
- Re-Colorization for Dark Mode (Thomas Steiner, Medium) — https://medium.com/dev-channel/re-colorization-for-dark-mode-19e2e17b584b (403 on fetch)
- Color Thief (dominant-color / semantic-swatch extraction API shape) — https://lokeshdhakar.com/projects/color-thief/
