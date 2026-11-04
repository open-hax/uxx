# Design — Uxx Monokai Firefox Extension

**Status:** v2 — revised after parallel architecture review (PASS-WITH-FIXES)
and adversarial citation audit (FAIL → fixed). All review findings addressed;
resolved decisions replace the former open questions (§14).
**Date:** 2026-10-30
**Evidence base:** `docs/research/firefox-mv3-webextension.md` (MV3 platform facts,
cited as `[S#]` there), `docs/research/page-recoloring-architecture.md`
(recoloring architecture, cited as §-sections there).

---

## 1. Goal

A Firefox WebExtension (MV3) that themes **all web pages** with the
**`@open-hax/uxx` Monokai theme pack**, by running a three-stage pipeline on
every page:

1. **Detect** the page's own color palette (dominant backgrounds, text
   hierarchy, link/accent colors, borders — plus whether the page is light or
   dark).
2. **Classify** each visible element into a semantic role
   (`page-background`, `surface`, `text-muted`, `link`, `button-primary`,
   `border`, `semantic-error`, …).
3. **Map** each detected meaning to its designated color from the uxx Monokai
   token pack, with WCAG contrast repair, and apply it.

The same token pack also themes the **browser chrome** via the `browser.theme`
API, so page and chrome are one coherent Monokai surface.

## 2. Non-goals (v1)

- No arbitrary color transformation: output colors are **only** uxx Monokai
  tokens (the deliberate difference from Dark Reader, see research §0).
- No recoloring of raster pixels: `<img>`, `<canvas>`, `<video>`, and CSS
  `background-image`/gradients are left untouched (research B §5.5).
- No per-site configuration UI beyond a global toggle + per-site disable list.
- No stylesheet-CSSOM rewriting / page-world proxy (Dark Reader's
  `stylesheet-proxy.ts` machinery) and no `adoptedStyleSheets` channel in v1
  (both listed as extension points, §11).
- No print restyling; `forced-colors` deferred to the OS (§6).
- Firefox only (`strict_min_version: 128.0`), no Chromium target.

## 3. Chassis decision: clean-room, Dark Reader as reference

Research B evaluated three frames: fork Dark Reader, clean-room using DR's
patterns, hybrid cherry-pick. **Chosen: clean-room.** Reasons:

- The color core must be replaced anyway (DR does continuous HSL pole
  transforms; we need discrete role→token mapping — research B §0).
- DR's value to us is five *patterns* (static `!important` sheets, inline
  custom-prop indirection, rAF task queue, >1000-node rescan threshold,
  viewport-grid dark detection), all documented in our research with source
  references — patterns are not code, and we re-derive them.
- License hygiene: DR is GPL-3.0 (github.com/darkreader/darkreader, `LICENSE`;
  an external fact, not from our research citations); this extension is a
  standalone application and will be **GPL-3.0-or-later** (global contract §7),
  but clean-room keeps the uxx tree free of vendored third-party code.

## 4. Repository layout & manifest

New pnpm workspace package `firefox/` inside the uxx repo (user decision,
2026-10-30), added to `pnpm-workspace.yaml`:

```
firefox/
├── package.json               # @open-hax/uxx-firefox
├── manifest.json              # MV3 manifest (below), references dist/
├── vite.config.content.js     # src/content/main.js → dist/content.js (IIFE)
├── vite.config.background.js  # src/background.js    → dist/background.js (ESM)
├── scripts/
│   └── generate-theme.mjs     # imports ../../dist/tokens/src/index.js → src/theme/tokens.js
├── src/
│   ├── theme/
│   │   ├── tokens.js          # GENERATED: full Monokai pack (palette + colors + cssVars)
│   │   ├── roles.js           # role → token-path mapping table (the contract, §7)
│   │   └── chrome-theme.js    # builds the browser.theme Theme object from tokens
│   ├── lib/                   # pure, unit-tested ESM (no DOM globals)
│   │   ├── color.js           # parse, WCAG-linearized luminance, contrast, hue, rank
│   │   ├── classify.js        # element-facts → role (DOM-agnostic: takes a fact record)
│   │   ├── palette.js         # samples → PagePalette (aggregation logic only)
│   │   └── map.js             # (fact, resolvedContext, palette) → token color + repair
│   ├── content/
│   │   ├── main.js            # orchestrator: boot, observer, rAF queue, messaging
│   │   ├── probe.js           # DOM adapter: reads computed styles, emits facts + samples
│   │   └── apply.js           # role sheet builder, markers, inline redirect, teardown
│   └── background.js          # event page: theme API, storage, action toggle, messaging
├── tests/                     # vitest (node env for lib/, jsdom for content/)
│   ├── color.test.js  classify.test.js  palette.test.js  map.test.js
│   ├── roles.test.js  chrome-theme.test.js  apply.test.js  generate.test.js
└── docs/
    ├── research/…  design.md  spec.md  README.md
```

**Build recipe (two vite invocations — format is a per-build rollup output
option, and default filenames are hashed; finding: under-specified before):**

```jsonc
// vite.config.content.js
build: { outDir: 'dist', emptyOutDir: false, lib: { entry: 'src/content/main.js',
         formats: ['iife'], name: 'UxxContent', fileName: () => 'content.js' } }
// vite.config.background.js
build: { outDir: 'dist', emptyOutDir: false, lib: { entry: 'src/background.js',
         formats: ['es'], fileName: () => 'background.js' } }
```

No dynamic `import()` anywhere in the content graph (IIFE cannot carry it).
`manifest.json` stays at package root so `web-ext run` works from `firefox/`.

**Manifest (specified in full — research A §8.6 adapted):**

```json
{
  "manifest_version": 3,
  "name": "Uxx Monokai",
  "version": "0.1.0",
  "description": "Monokai for every page: detects each page's palette, classifies elements, and maps meanings to @open-hax/uxx Monokai tokens.",
  "permissions": ["theme", "storage"],
  "host_permissions": ["<all_urls>"],
  "background": { "scripts": ["dist/background.js"], "type": "module" },
  "action": { "default_title": "Uxx Monokai (click to toggle)" },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["dist/content.js"],
    "run_at": "document_start",
    "all_frames": true,
    "match_about_blank": true
  }],
  "icons": { "48": "assets/icon-48.png", "96": "assets/icon-96.png" },
  "browser_specific_settings": {
    "gecko": {
      "id": "uxx-monokai@open-hax",
      "strict_min_version": "128.0",
      "data_collection_permissions": { "required": ["none"] }
    }
  }
}
```

Notes: no `scripting`/`activeTab` (manifest content_scripts need neither).
`host_permissions: ["<all_urls>"]` is **user-granted in Firefox MV3** — the
install prompt shows it from FF ≥127 `[S5]`; denial is a first-class failure
state (§14 risk S1). `gecko.id` is required for MV3 signing and for
`storage.sync` `[S6][S17]`. `data_collection_permissions` is required for AMO
submissions since 2025-11-03 `[S6]`. Background is `scripts` + `type: module`
— Firefox does not support `service_worker` `[S1]`.

Token generation follows the repo's existing pattern (`scripts/generate-css.mjs`):
`generate-theme.mjs` imports `../../dist/tokens/src/index.js`, so it requires
the uxx build (`tsc`) to have run. The root `package.json` `build` script gets
`&& node firefox/scripts/generate-theme.mjs` appended. `tokens.js` is committed
so the extension loads without a build step.

## 5. Pipeline architecture

```
document_start  (top frame + addressed iframes; about:blank frames land at
                 document_end instead — research A §4, documented limitation)
  │  synchronous within the content script
  ├─ inject boot sheet: color-scheme:dark + root background/text tokens,
  │  all rules !important, wrapped in @media screen and (forced-colors: none) [§9.1]
  ├─ runtime.sendMessage({type:'state', origin: location.origin})
  │        └─ background replies {enabled, siteDisabled}
  │        └─ reply error/timeout → FAIL OPEN: remove boot sheet, stop [§9.3]
  │        └─ disabled → remove boot sheet, stop (no observers, no probing)
  ▼
DOMContentLoaded / idle  (layout-readiness gate: body.scrollHeight ≥ 32,
                          clientHeight ≥ 32, childElementCount > 0 —
                          research B §1.2 canCheckForStyle)
  ├─ DETECT  (probe.js + lib/palette.js)
  │    (a) temporarily disable our own injected sheets so they cannot
  │        contaminate the measurement (research B §1.2 protocol; re-enable
  │        in finally)
  │    (b) viewport grid sample via elementFromPoint: 256px cells, capped at
  │        4×4 cells (≤16 samples, equal cell areas — research B §1.2 caps),
  │        skip <img> hits, null/off-viewport cells dropped, topmost element
  │        may be overlay chrome (accepted noise)
  │    → dominant backgrounds (alpha-composited over the sample stack),
  │      light/dark verdict
  │    (c) harvest distinct fg/border/link colors from visible elements'
  │        computed styles — SKIPPING elements already carrying data-uxx-*
  │        attributes (self-contamination guard, finding)
  │    (d) collect --* custom properties whose values parse as colors
  │    → PagePalette {appearance, backgrounds[], textColors[], linkColors[],
  │                   borderColors[], accents[], cssVars{}}
  ├─ CLASSIFY  (lib/classify.js over probe facts)
  │    per element: property split (bg/border/text) → tag/ARIA refinement
  │    → semantic-role detectors → {element, role, sourceColor, property,
  │      sizeClass, confidence}
  │    discriminators for surface-family roles are explicit (§7.1)
  ├─ MAP  (lib/map.js) — top-down, ancestors before descendants [§8]
  │    role → uxx token path [§7]; rank assignment within role pools [§8.2];
  │    WCAG repair with pack-level exemptions [§8.3]; alpha compositing of
  │    resolved backgrounds through the mapped ancestor chain [§8.5]
  └─ APPLY  (apply.js)
       element.setAttribute('data-uxx-role', role) [+ inline redirect marks]
       role sheet: built at RUNTIME from tokens.js + roles.js (not baked at
       build time — keeps the multi-pack extension point honest, §11)
       per-distinct-color CSS-var indirection for page-var-authored colors
  ▼
steady state
  MutationObserver (childList + style/class attrs; data-uxx* attrs and our
  --uxx-* property writes ignored) → rAF-batched incremental re-scan;
  >1000-record batch → whole-root rescan; circuit breaker 50 mutations/10s →
  2s backoff; teardown-loop guard: 10 attribute-write-attributable teardowns
  of a container → suspend that container (research B §5.10
  MAX_LOOP_TEARDOWNS pattern); deferred while document.hidden [§10]
```

**Why DOM-walk + element markers rather than stylesheet rewriting:** the
user's contract is per-element *meaning* classification; a DOM walk gives
exact per-element roles (including inline styles), while selector→meaning
inference from CSS rules is cruder. The cost (one `getComputedStyle` per
element) is managed by batching and caps (§10). Stylesheet rewriting and
`adoptedStyleSheets` remain documented future channels (§11).

## 6. Skip list and hard cases

| Case | Handling | Source |
|---|---|---|
| `img/canvas/video` pixels | never touched (no marker) | research B §5.5 |
| `background-image`, gradients | **skip background recolor for that element** (keep text/border). Deliberate deviation from DR, which maps every gradient stop (research B §5.2); our rationale: a recolored gradient over an unrecolored image is worse than leaving it | research B §5.5 (skip reference) |
| `currentColor/inherit/transparent/initial/unset/none` | cascade-following: no marker, inherits our remapped ancestor | research B §5.3 |
| fully transparent `rgba(…,0)` | left alone | research B §5.1 |
| `mix-blend-mode≠normal`, `backdrop-filter≠none`, ancestor `filter` | skip whole subtree without descending into style reads | research B §5.7b |
| `forced-colors` | **gate every injected rule behind `@media screen and (forced-colors: none)`** — a valid media-query value (the feature accepts only `none`/`active`; `no-preference` is invalid and would make every rule dead — review blocker). Under `active`, our sheets simply do not apply and the OS palette wins | research B §5.8 |
| `prefers-contrast: more` | raise text repair threshold to AAA 7:1 (§8.3); pack-authoritative exceptions stay excepted | research B §5.8 |
| print | injected sheets are `media="screen"` | research B §5.8 |
| shadow DOM | open roots traversed; closed roots untouched (documented limitation) | research B §5.7 |
| iframes | `all_frames: true`; each frame runs independently; root-bg override skipped in child frames so transparent frames inherit the parent's themed bg; **about:blank frames get content at `document_end`, not `document_start`** (research A §4) — boot lands late there; harmless | research B §5.6, research A §4 |
| inline `style="color:…"` (no `!important`) | beaten by our `!important` attribute rules — no special handling | research B §3.2 |
| inline `!important` styles | **cascade-correct redirect**: within author-origin importance, an inline important declaration beats any stylesheet important declaration. So: capture the original declaration (value + priority) into a per-element WeakMap, **remove it from the inline style**, move **the mapped token** into `--uxx-inline-*`, set the `data-uxx-inline-*` marker; the redirect sheet then applies it with `!important` (there is no longer a competing inline declaration). Teardown restores the captured declarations (§9.3) | corrected in review; pattern after research B §3.1 (inline-style indirection, originals stored before overwrite) |
| `:hover/:focus` page state rules | lose to our `!important`; we synthesize state colors from tokens: `[data-uxx-role=link]:hover → interactive.hover`, `[data-uxx-role=button-*]:hover → button.*.hover`, etc. | design choice |
| `::selection` | explicit rule → `colors.selection.default` | research B §5.9 |
| `::placeholder` | role `text-muted` → token `colors.text.soft` `#90908a`; checked at the **3:1 muted-text threshold** against its composited background (on `input-surface` `#414339` the pair is 3.14:1 ✓; on page bg 4.63:1) — **not** the `text.muted` token, which is decorative-only (review finding) | research B §5.9, §4.3 recipe (≥3:1 for large/muted text) |
| SVG fill/stroke (inline) | classify by geometry (<32×32px bounding box → foreground), v1 themes `fill`/`stroke` only when they parse as solid colors | research B §2.2 |
| icon fonts | treated as text (may tint); documented limitation — DR solves this with per-site fix lists we don't have | research B §2.3 |
| frameworks that re-render on *any* attribute write | per-container suspension: if our writes are followed by teardown of the same container 10× within 10s, suspend them there (research B §5.10 `MAX_LOOP_TEARDOWNS`) | research B §5.10 |

## 7. The meaning→color contract (role → uxx token table)

This table **is** the product. Roles are assigned by `lib/classify.js`; colors
resolve through `src/theme/roles.js` against the generated Monokai pack.
Token paths reference `themePacks.monokai` (Monokai *with* its
`themes.monokai` color overrides — the canonical uxx Monokai).
`roles.js` is the single pinning point: a test (`roles.test.js`) asserts every
path resolves to a defined value in `tokens.js` — a nonexistent path is a
test failure, not a runtime `undefined` (both reviews flagged exactly this
class of bug).

### Backgrounds & surfaces

| Role | Token path | Value |
|---|---|---|
| `page-background` | `colors.background.default` | `#272822` |
| `surface` (cards, sections, sidebars, tables) | `colors.background.elevated` | `#34352f` |
| `surface-recessed` (wells, gutters — bg *darker* than page bg) | `colors.background.surface` | `#1e1f1c` |
| `elevated` (dialogs, menus, popovers, tooltips) | `colors.background.highlight` | `#3e3d32` |
| `input-surface` (input/select/textarea backgrounds) | `palette.bg.selection` | `#414339` |
| `overlay` (backdrop scrims) | `colors.background.overlay` | `rgba(0, 0, 0, 0.6)` |

(`palette.bg.selection` — review blocker fix: `colors.background.selection`
does not exist in the pack; the `#414339` value lives at palette level.)

### Text (rank-assigned pool, §8.2)

| Role | Token pool (by luminance, high→low) |
|---|---|
| `text-primary` (incl. headings) | `colors.text.default` `#f8f8f2` |
| `text-secondary` | `colors.text.panel` `#cccccc` |
| `text-muted` (incl. `::placeholder`) | `colors.text.soft` `#90908a` |
| `text-faint` (decorative only, never normal-size body) | `colors.text.muted` `#75715e` |
| `text-inverse` (text on solid accent/button bg) | `colors.text.inverse` `#272822` |

Naming note: role `text-secondary` maps to token `colors.text.panel`, **not**
to the similarly-named `colors.text.secondary` (which is `#75715e`, the muted
value) — deliberate, pinned by `roles.test.js`. `text.subtle` `#464741` is
reserved for borders (CR ≈ 1.6 on page bg) and is never a text token.

### Interactive

| Role | Token path | Value |
|---|---|---|
| `link` | `colors.interactive.default` | `#a6e22e` |
| `link-hover` (synthesized `:hover`) | `colors.interactive.hover` | `#8fce26` |
| `button-primary` (solid opaque bg, neutral hue, contrasting fg) | `colors.button.primary.{bg,fg}` | `#75715e` / `#f8f8f2` |
| `button-secondary` (neutral solid bg, page-adjacent luminance) | `colors.button.secondary.{bg,fg}` | `#414339` / `#f8f8f2` |
| `button-ghost` (transparent bg, bordered or bare) | `colors.button.ghost.{bg,fg}` | `transparent` / `#f8f8f2` |
| `button-danger` (red-hued solid bg) | `colors.button.danger.{bg,fg}` | `#f92672` / `#f8f8f2` |
| `focus` (outline/focus rings) | `colors.border.focus` | `#99947c` |

(`button.primary.bg` is the desaturated taupe `#75715e` — the uxx Monokai
override, verified in `colors.ts`; the classifier matches on *opacity +
neutral hue + contrast*, not saturation, so page primary buttons land here.)

### Borders & structure

| Role | Token path | Value |
|---|---|---|
| `border` (hr, table/panel borders) | `colors.border.default` | `#34352f` |
| `border-subtle` (dividers, faint lines) | `colors.border.subtle` | `#464741` |
| `border-focus` | `colors.border.focus` | `#99947c` |
| `selection` (`::selection`) | `colors.selection.default` | `rgba(135, 139, 145, 0.5)` |

### Semantic status (detected via ARIA/class/hue cues)

| Role | Token path | Value |
|---|---|---|
| `semantic-error` | `colors.semantic.error` | `#f92672` |
| `semantic-warning` | `colors.semantic.warning` | `#fd971f` |
| `semantic-success` | `colors.semantic.success` | `#a6e22e` |
| `semantic-info` | `colors.semantic.info` | `#66d9ef` |

Badge variants (tinted bg): `colors.badge.{success,warning,error,info}`
(alpha tints over the surface) with matching accent fg.

### Code & content chrome

| Role | Token path | Value |
|---|---|---|
| `code-surface` (`pre`, code blocks) | `colors.background.surface` | `#1e1f1c` |
| `code-text` | `colors.text.default` | `#f8f8f2` |

**Invariant (testable):** every color the extension emits is a value present
in `themePacks.monokai` (or a `withAlpha` derivation thereof). `map.test.js`
enumerates all emitted values against the pack (parsed-color comparison, not
string identity — rgba spacing normalizes).

### 7.1 Surface-role discriminators (made explicit for implementability)

| Role | Discriminator (on the fact record) |
|---|---|
| `page-background` | `html`/`body` (and their transparent pass-through) |
| `input-surface` | tag ∈ {input, select, textarea} (bg property only) |
| `elevated` | tag `dialog`/`[popover]`, or ARIA role ∈ {dialog, menu, menubar, listbox, tooltip, combobox} |
| `overlay` | `position: fixed`, covers ≥90% of the viewport, translucent bg, top-most stacking context (backdrop scrim) |
| `surface-recessed` | non-page container whose bg luminance < page bg luminance |
| `code-surface` | tag ∈ {pre} or (`code` with block-level box) — checked **before** the `surface` fallback |
| `surface` | any remaining non-page container with its own opaque/translucent bg (fallback row — evaluated last) |

Unresolvable distinctions (modal vs card without ARIA) degrade to `surface` —
v1 does not guess by class name (research B §2.3: class heuristics are
"common but brittle").

### 7.2 Contrast exemptions (first-class, enumerated)

The property test asserts every emitted fg/bg pair meets its threshold **or
is in this exact exception set** — no per-page discoveries:

| Exception | Pairs | Ratios (computed) | Rationale |
|---|---|---|---|
| E1 | `border`/`border-subtle` vs any bg | 1.07–1.58 across bgs (1.20 vs page bg) | structural, not information-bearing; the pack's border identity (design policy) |
| E2 | `semantic-error` (and error-badge fg) text vs **any page-derived background** (page, surface, elevated, input-surface, code-surface, badge tints) | 2.66–4.38 (3.93 vs page bg) | Monokai pink identity; passes 3:1 only against the darker half — pack-authoritative against *every* background, scope widened per re-audit N1 |
| E3 | `button-danger` fg vs danger bg | 3.55 | uxx pack's own pairing; **fails 4.5:1 for normal-size labels** and passes only the 3:1 large-text/UI threshold for labels ≥24px or ≥18.66px bold — declared pack-authoritative policy regardless of label size (justification corrected per re-audit N5) |
| E4 | badge tint pairs (accent fg over 15% tint) | 3.46 (error) – 6.7 (success), 5.1 (warning) | same identity policy as E2/E3 |
| E5 | `text-faint` vs any bg | 1.6–3.0 | decorative-only class by design policy (§7): never carries required information |

Under `prefers-contrast: more` (7:1 target) E1–E5 remain excepted — we do not
abandon semantic hue or structural borders to chase a threshold; this is
stated as designed behavior. Everything else must repair, or carry the
`data-uxx-contrast="exception"` marker from §8.3.4 (which `map.test.js`
accepts as the third state, alongside "meets threshold" and "∈ E1–E5"). The
marker is legally emitted for **single-token pools** (§8.3.4) and for an
**exhausted multi-token text pool whose emission is exactly
`colors.text.default`** — the pool's outermost token, meaning repair did
everything the pack allows. Under `prefers-contrast: more` that exhaustion is
common (`colors.text.default` reaches only ≈5.4:1 against `selection.default`
over `input-surface` and ≈4.6:1 against `button-primary.bg`; 7:1 is
unreachable there). In normal mode it occurs only against the brightest
emit-able surfaces (e.g. 3.55:1 on `button-danger.bg`). Both marker surfaces
are deterministic, bounded, and auditable — no per-page ad-hoc discoveries).

## 8. Mapping algorithm (`lib/map.js`)

### 8.0 Signature and context (review fix)

```js
map(fact, resolvedContext, palette, tokens) → {color, property, exception?}
// fact:          {role, sourceColor, property, sizeClass, confidence}
// resolvedContext: {resolvedBgColor, ancestorChain}
//                  resolvedBgColor = the *composited* mapped background the
//                  element sits on (§8.5); supplied by the content layer —
//                  lib stays DOM-free
// cache key:     (sourceColor, role, property, resolvedBgColor, sizeClass)
//                  resolvedBgColor not resolvedBgToken: translucent tokens
//                  (overlay 0.6, selection 0.5, badge 0.15) map one token to
//                  many composited colors — the composite is what contrast
//                  depends on (re-audit N2)
```

The content layer computes `resolvedBg` (the composited mapped background an
element sits on, §8.5) and `sizeClass` (`normal` | `large` — from computed
font size/weight: ≥24px, or ≥18.5px bold ⇒ `large`). Both affect the outcome,
so both are inputs and cache-key components.

### 8.1 Direct roles

Most roles resolve 1:1 through the §7 table — meaning *is* the token.

### 8.2 Rank assignment (multiple source colors → one role pool)

- Ranking unit: **per page, per role class** (all `text-*` sources compete in
  the text pool), among *distinct* source colors (exact RGB equality dedupes;
  distinct means ΔE2000 > 1 — the metric research B's recipe uses; ties in
  luminance but distinct colors keep distinct ranks, ordered by hue as
  tiebreak).
- Sort sources by WCAG luminance; sort the role's token pool by luminance;
  map rank→rank.
- **Exhaustion (N > pool size):** clamp — ranks above the pool map to the
  pool's outermost token (brightest source → brightest token, dimmest excess →
  dimmest token). Never wrap, never invent.
- **Ties:** equal source luminance ⇒ same token (collapse allowed).
- **Post-repair monotonicity:** repair (§8.3) may *collapse* adjacent ranks to
  the same token but must never *invert* their order; `map.test.js` asserts
  this as a property.
- This is the discrete analogue of DR's monotonic pole map (research B §4.3).

### 8.3 WCAG contrast repair (after rank assignment)

1. Contrast via the **full linearized WCAG formula** (research B §4.1 —
   explicitly not DR's `getSRGBLightness` shortcut).
2. Thresholds: 4.5:1 normal text; 3:1 large text (≥24px / ≥18.66px bold),
   non-text UI, **and muted/decorative text classes** (`text-muted`,
   `text-faint`, `::placeholder` — per research B §4.3's "≥3:1 for
   large/muted text" recipe); 7:1 under `prefers-contrast: more`.
3. If below threshold and the role's pool has >1 token: walk the pool toward
   higher-contrast alternatives (rank-adjacent first, then `text.panel →
   text.default` for accent text on dark surfaces). Collapse-only, per §8.2.
4. **Single-token pools** (`link`, `focus`, `semantic-*`, all backgrounds):
   no walk exists. Failure ⇒ keep the pack value and emit
   `data-uxx-contrast="exception"` on the element (named attribute — the
   property test and any future audit read exactly this), *unless* the pair is
   already in the §7.2 enumerated set (then it is E1–E5, silent by design).
5. Repair never invents colors outside the pack (invariant, §7).
6. Design behavior note: sub-threshold *accent* text (non-semantic) falls back
   through `text.panel → text.default` — this converts colored text to neutral
   by design when hue cannot clear the bar; semantic roles are exempt from
   this conversion (they keep hue, E2).

### 8.4 Accent hue bucketing (explicit boundaries)

HSL from the parsed source color; `S` = HSL saturation.

| Bucket | Hue range (°) | Monokai target |
|---|---|---|
| neutral | `S < 0.10` (any hue) | `colors.text.panel` — deliberately **not** `interactive.default`, which would collide with the green bucket (review finding: `interactive.default` *is* green `#a6e22e` in this pack) |
| red | `[345,360) ∪ [0,15)` | `colors.semantic.error` (pink) |
| orange | `[15,45)` | `colors.semantic.warning` |
| yellow | `[45,70)` | `colors.accent.yellow` |
| green | `[70,165)` | `colors.semantic.success` |
| cyan/blue | `[165,260)` | `colors.semantic.info` — **Monokai's `accent.blue` === `accent.cyan` === `#66d9ef`**: blue and cyan cannot be distinguished in this pack; the collapse is a pack limit, documented, not a mapping choice |
| purple/magenta | `[260,345)` | `colors.accent.magenta` |

Brown lands in orange, teal in cyan/blue, lime in green — no bucket is
unhandled. Used for status-detection cues and to resolve accent-hued non-link
text into the matching `semantic-*` role — the v1 vocabulary has no separate
"accent text" role; the semantic tokens *are* the accent text colors (review
finding N7). (Exception, added 2026-10-30: the yellow and purple/magenta
buckets have no §7 semantic row — §7 therefore also carries `accent-yellow`
and `accent-magenta` roles bound to `colors.accent.yellow` /
`colors.accent.magenta`, giving the table's targets somewhere to land;
§8.3.6's neutral fallback applies to them.) Never used for body text.

### 8.5 Alpha compositing — top-down pass

- The MAP pass runs **top-down** (an ancestor's mapped color is finalized
  before any descendant is mapped) so `resolvedBg` is always available.
- Source `rgba` backgrounds composite over the ancestor's *mapped* color
  before any foreground check (research B §5.1).
- **Emitted translucency composites identically**: `selection.default` (0.5),
  `badge.*` (0.15), `overlay` (0.6) are translucent — the fg check composites
  them over their resolved background too, recursively up the mapped chain.
- Recursion base case: the root's mapped background (`page-background`,
  opaque `#272822`).

## 9. Surfaces

### 9.1 Page content (content script)

Three injected channels (research B §3.1):

1. **Boot sheet** (CSS text inlined into the content bundle, injected
   synchronously at `document_start`): `color-scheme: dark`, root
   `background`/`color` — **all declarations `!important`** (page CSS loads
   after us and would otherwise win), `::selection`, `::placeholder`; the
   whole sheet wrapped in `@media screen and (forced-colors: none)`.
   Purpose: eliminate white flash before analysis completes.
   During DETECT, these sheets are disabled and re-enabled in `finally`
   (research B §1.2 protocol) so the sampler never measures our own output —
   otherwise transparent-root pages would sample the boot color as the page's.
2. **Role sheet**: one `<style data-uxx>` per document, **built at runtime**
   from `tokens.js` + `roles.js` (not baked at build time — this keeps §11's
   multi-pack extension point honest: switching `themeId` rebuilds the sheet
   without a rebuild of the bundle): every `[data-uxx-role="…"]` rule with
   `!important`, gated `@media screen and (forced-colors: none)`.
3. **Inline-redirect sheet**: `[data-uxx-inline-color]{color:var(--uxx-inline-color)!important}`
   family, for elements whose inline color declarations were captured,
   removed, and redirected (§6). Also `forced-colors: none`-gated.

**Honest latency statement (review fix):** storage reads are async — there is
no synchronous state source (MDN `storage`; the MV3 consequence is documented
in research A §1). If the event page is awake, the state round-trip is
milliseconds; on a **cold wake** (browser startup, first message after idle)
expect tens to hundreds of ms. Failure/timeout ⇒ fail open (remove boot sheet).
Known tradeoff: on disabled sites (or while globally disabled) a brief
color-scheme flash can occur before teardown. Driving injection via
`scripting.registerContentScripts`/`exclude_matches` keyed on state would
remove this structurally at the cost of a `scripting` permission and
registration races — recorded as an extension point (§11), not v1.

### 9.2 Browser chrome (`browser.theme` API)

`src/theme/chrome-theme.js` builds the Theme object (window-scoped; applied
via `theme.update()` — content scripts cannot call it `[S19]`, so the
background script owns it).

**Application policy (review fix — restart loss):** the window theme does not
survive browser restart (implied by research A §2.8 lifecycle; `reset()` docs).
So the background applies the theme **on every wake**: top-level event-page
evaluation and `runtime.onStartup` read `storage.sync.enabled` and, if true,
call `theme.update()` (idempotent, cheap). Transitions are the other trigger;
no gratuitous update/reset cycling.

**`preTheme` capture (review fix — three failure modes):** `theme.reset()`
restores the *default* theme, not the user's previous theme (bug 1415267
`[S11]`). Policy: capture `theme.getCurrent(windowId)` per window immediately
before our first `update()` for that window; store per-window in
`storage.local.preTheme`; on disable, re-apply the captured theme for that
window if present, else `reset(windowId)`. To handle the user switching themes
*while we're enabled*: listen for `theme.onUpdated` `[S9]`; if the updated
theme differs from what we last applied, refresh that window's `preTheme` to
the incoming theme (so disable restores their newest choice).

| Theme key | uxx token |
|---|---|
| `frame` / `frame_inactive` | `bg.darker` `#1e1f1c` / `bg.default` `#272822` |
| `toolbar`, `toolbar_text` (= `bookmark_text` alias) | `bg.default` / `fg.default` |
| `tab_selected`, `tab_text` | `bg.lighter` `#3e3d32` / `fg.default` |
| `tab_background_text` | `fg.soft` `#90908a` (≈5.0:1 on frame — review fix; `fg.muted` was ≈3.3:1) |
| `tab_line` | `interactive.default` `#a6e22e` |
| `toolbar_field`, `toolbar_field_text`, `toolbar_field_border` | `bg.selection` / `fg.default` / `bg.groupBorder` |
| `toolbar_field_border_focus`, `toolbar_field_focus` | `border.focus` `#99947c` / `bg.tabInactive` `#34352f` |
| `toolbar_field_highlight`, `toolbar_field_highlight_text` | `bg.selection` / `fg.default` |
| `popup`, `popup_text`, `popup_border` | `bg.lighter` / `fg.default` / `bg.groupBorder` |
| `popup_highlight`, `popup_highlight_text` | `bg.selection` / `fg.default` |
| `sidebar`, `sidebar_text`, `sidebar_border` | `bg.darker` / `fg.default` / `bg.groupBorder` |
| `sidebar_highlight`, `sidebar_highlight_text` | `bg.selection` / `fg.default` |
| `ntp_background`, `ntp_text`, `ntp_card_background` | `bg.default` / `fg.default` / `bg.lighter` |
| `icons` / `icons_attention` | `fg.default` / `accent.green` |
| `toolbar_top_separator`, `toolbar_bottom_separator`, `toolbar_vertical_separator` | `bg.groupBorder` `#34352f` |

Properties: `color_scheme: 'dark'` **and** `content_color_scheme: 'dark'`
(both set — resolves the former Q4 ambiguity; explicit beats `auto`, cost is
zero, intent is documented). Side effect, acknowledged: pages see
`prefers-color-scheme: dark` while the extension is globally enabled,
including on per-site-disabled tabs (chrome is window-scoped and cannot
follow per-site state — research A §2.8).

Known platform note: from Firefox 157 (Nova), `popup`/`popup_text` no longer
color the URL-bar dropdown `[S8]` — those keys still cover arrow panels.

### 9.3 State & messaging

| State | Store | Keys |
|---|---|---|
| global enabled flag, active theme id | `storage.sync` (requires gecko.id, present) | `enabled`, `themeId` |
| per-site disable list, captured pre-themes | `storage.local` | `disabledSites` (origin strings), `preTheme` (per-windowId) |

- `action` is popup-less → `action.onClicked` toggles `enabled` (research A §3:
  `onClicked` never fires when a popup exists — so no popup in v1).
- Badge: `action.setBadgeText` `ON`/`OFF` (green/taupe from tokens).
- **Message shapes (specified):**
  - content → background: `{type:'state', origin: location.origin}` (init
    handshake; `origin` lets background compute `siteDisabled`).
  - background → content: `{type:'state', enabled: boolean, siteDisabled: boolean}`.
  - content → background on toggle broadcast: background → each tab
    `{type:'state', …}` via `tabs.sendMessage`; tabs where the message rejects
    (no receiver, e.g. privileged pages) are skipped silently.
  - **Fail open:** if the handshake rejects or does not answer within 2000ms,
    the content script removes the boot sheet and stops — a dead background
    must never leave a foreign color scheme on a page.
- Teardown on disable: remove all `data-uxx*` attributes, remove injected
  sheets, and **restore captured inline declarations** from the WeakMap (value
  + original priority) — without this, redirected inline colors would be lost.
- Event page is stateless across unloads — everything re-derives from storage
  on wake `[S1]`.

## 10. Performance budget

- **Single style read per element** per pass, rAF-sliced: ≤500 elements or
  ≤5ms per frame, remainder queued.
- **Element cap** `MAX_ELEMENTS = 15000` (named constant) **plus a time trip**:
  if the initial pass has not completed within 3000ms, degrade regardless of
  count (review: cheap-element and expensive-element pages differ). Degraded
  mode = root + direct-children theming, `data-uxx-degraded` marker set.
- **Transform cache:** key `(sourceColor, role, property, resolvedBgColor,
  sizeClass)` — each distinct color maps once per context (research B §5.11's
  primary lever; the widened key including the *composited* background color
  is the review fix — translucent tokens produce many composites).
- **Self-contamination guards:** (a) palette harvest skips `data-uxx-*`
  elements; (b) mapping is **idempotent** — a source color already ∈ the pack
  maps to itself (so re-probing themed elements converges, never oscillates);
  (c) observer ignores `data-uxx*` attribute mutations and `--uxx-*` custom
  property writes; (d) our own sheets are disabled during sampling (§9.1).
- **Mutation handling:** rAF-batched; >1000 records → whole-root rescan;
  circuit breaker 50 mutations/10s → 2s backoff; teardown-loop guard 10/10s →
  per-container suspension (§6); deferred entirely while `document.hidden`.
- **Bail-outs:** unparsable colors → skip; `filter`/blend subtrees skipped
  without descending (no style reads inside).

## 11. Extension points (documented, not built)

- **Rule-rewriting channel** (DR dynamic-theme style): full `:hover` fidelity,
  CSS-variable name wrapping, page rules that inline-important still win (§6).
- **`adoptedStyleSheets` channel** (research B §3.1/§7, with Firefox
  `wrappedJSObject` unwrap): many SPAs style exclusively through constructable
  sheets; our `!important` element rules still win over their *rules* (they
  target elements we marked), so this matters only for unmarked elements —
  record why it is deferred: markers already cover their output.
- **`scripting.registerContentScripts` state-driven injection** (§9.1): kills
  the disabled-site flash structurally; costs `scripting` permission.
- **Multiple uxx packs:** `themeId` state anticipates `night-owl` /
  `proxy-console`; roles.js references token *paths*, and the role sheet is
  runtime-built — switching packs rebuilds sheets in open documents.
- **Per-site rules UI**, screenshot E2E tier, closed-shadow-root support.

## 12. Testing strategy

Research B §6 (verified DR test layout) → two implemented tiers + manual E2E:

1. **Pure unit (vitest, node):**
   - `color.test.js` — every CSS color syntax + W3C WCAG vectors (mirroring
     DR's exhaustive `color.tests.ts` style; includes the known-bad
     `getSRGBLightness` counterexample).
   - `classify.test.js` — fact records → roles, incl. §7.1 discriminators.
   - `palette.test.js` — sample aggregation, alpha compositing, self-
     contamination guard.
   - `map.test.js` — **property tests:** every emitted color ∈ pack; every
     fg/bg pair satisfies exactly one of three states — meets threshold, or
     ∈ E1–E5 (silent), or carries `data-uxx-contrast="exception"` (legal for
     single-token pools per §8.3.4, plus multi-token exhaustion ending at
     `colors.text.default` — §7.2); rank monotonicity
     (collapse-only, never inverted); idempotence (pack-in ⇒ pack-out);
     exhaustion clamping; hue-bucket boundary vectors (each edge degree).
   - `roles.test.js` — every path in roles.js resolves to a defined value in
     tokens.js (blocks the nonexistent-path class of bug at test time).
   - `chrome-theme.test.js` — every theme key maps to a pack value; required
     key coverage enumerated from §9.2.
2. **DOM integration (vitest, jsdom):** `probe.js` with injected style
   resolver (mock `getComputedStyle` seam), `apply.js` marker write/teardown
   incl. inline-redirect restoration, `main.js` fail-open path, observer
   self-ignore.
3. **Manual E2E (documented recipe):** `web-ext run` + `tests/fixtures/*.html`
   — one fixture per §6 hard case (transparent bg, gradient, CSS-var palette,
   shadow DOM, inline important, iframes, currentColor, mix-blend-mode,
   SPA-append, forced-colors) with expected outcomes listed in the fixture
   header. Screenshot automation is future work.

**Validation gates for done:** `vitest run` green; `vite build` both configs
clean; `npx web-ext lint` zero errors; `tokens.js` regeneration idempotent
(`generate && git diff --exit-code` on `src/theme/tokens.js`); `roles.test.js`
proves the §7 table resolves.

## 13. License

GPL-3.0-or-later (standalone application, global contract §7). The package
consumes `@open-hax/uxx-tokens-internal` (LGPL-3.0) as a workspace dependency —
unmodified library use is explicitly permitted by uxx's license terms
(`README.md` §License). No Dark Reader code is vendored (§3).

## 14. Resolved decisions & residual risks

**Resolved during review (former open questions):**

- **Q1 boot-sheet flash** → keep the unconditional boot sheet for v1 with
  honest latency bounds and fail-open teardown (§9.1); state-driven
  registration is the recorded structural fix (§11).
- **Q2 `button.danger` contrast** → pack authority; E3 exception pinned
  (§7.2); repair still acts on small non-button danger *text* (E2 is scoped to
  semantic roles, not body text). Under `prefers-contrast: more`, semantic
  hue is kept over threshold-chasing (§8.3).
- **Q3 element cap** → 15000 named constant **plus** a 3000ms time trip;
  root+children degradation (§10). Validate the knee against heavy fixtures
  before freezing.
- **Q4 `content_color_scheme`** → set both `color_scheme` and
  `content_color_scheme` to `dark`; side effects acknowledged (§9.2).

**Residual risks** (labelled **S**1–**S**5 — *spec-level* residuals of the
original build; distinct from the review rounds' **R**-labels, which denote
*findings*, and from §15.7's **C**-labels, which are *cache* residuals):

- **S1 — host permission denial:** Firefox MV3 host permissions are
  user-granted `[S5]`; a user who denies `<all_urls>` gets a dead extension.
  Mitigation: README documents the grant; `state` handshake failure already
  fails open (§9.3). Future: `optional_host_permissions` + request flow.
- **S2 — cold-wake flash** on disabled sites (§9.1), bounded by the 2000ms
  fail-open timeout.
- **S3 — Nova (FF 157+) URL-bar dropdown** not colored by `popup` keys `[S8]`.
- **S4 — window-scoped chrome vs per-site disable:** chrome stays Monokai
  globally while enabled (§9.2) — coherent-by-policy, not by API.
- **S5 — icon fonts and blended/filtered subtrees** may render off-palette
  (§6) — accepted v1 limitations, per DR's own per-site-fix evidence.

## 15. Style cache (repeat-visit fast path)

**Problem.** Every page load runs two full DOM walks that each call
`readFact(el)` — the DETECT walk (`main.js` §9.3 step 4) and the CLASSIFY
walk (step 5). Each `readFact` forces layout (`getBoundingClientRect`) and a
style recalc (`getComputedStyle`) plus several `getPropertyValue` reads, so a
15k-element page pays ~30k forced-layout style reads before the first marker
lands. The DOM-free stages (`classify`, `buildRankTable`, `mapper.map`) are
microseconds; the walks are the entire perceptible delay. The layout gate
(`waitUntilReady`) resolves on its first check for almost every page and is
not the cost.

**Goal.** On a repeat visit whose stylesheet source and DOM structure are
unchanged, apply the previous visit's per-element effects with **zero**
`getComputedStyle`/`getBoundingClientRect` calls, landing markers within a
frame of the layout gate.

### 15.1 Key

The storage key is deliberately **coarse** — it narrows the lookup but does
**not** contain the hashes:

```
lookupKey = CACHE_SCHEMA | version | url | vwBucket | vhBucket
            | prefersMore | prefersColorScheme | forcedColors | isTopFrame
```

| Component | Source | Why |
|---|---|---|
| `CACHE_SCHEMA` | `src/content/cache.js` constant `'uxx-sc-v1'` | Bump on any format change → global invalidation |
| `version` | `api.runtime.getManifest().version` | Pack/role/classify changes must not replay |
| `url` | `location.origin + location.pathname`, length-prefixed (`${len}:${url}`) | Per-page identity; query + hash stripped (they rarely change theming); length prefix removes field-boundary ambiguity |
| `vwBucket`, `vhBucket` | `Math.round(innerWidth / 256)`, `Math.round(innerHeight / 256)` | Grid sampling + classify size heuristics are viewport-dependent; 256 px buckets keep hits across ordinary resizes |
| `prefersMore` | `probe.prefersContrastMore()` | Doors §8.3 repair |
| `prefersColorScheme` | guarded `matchMedia('(prefers-color-scheme: dark)')` → `'dark' \| 'light'`; **`typeof win.matchMedia !== 'function'` → `'light'`** (same guard `probe.prefersContrastMore` already uses) | **Review B2:** OS light↔dark flips change the page's computed colors through `@media (prefers-color-scheme: …)` blocks **without** changing any stylesheet text or DOM attribute — a text-only hash cannot see it, so it must be a key component |
| `forcedColors` | guarded `matchMedia('(forced-colors: active)')` → `'active' \| 'none'`; **no `matchMedia` → `'none'`** | Same class of invisible-to-text-hash state as B2 |
| `isTopFrame` | `win.top === win` | Child frames use a transparent base and skip the root override (§6) |

**Both hashes are compared, not keyed** (locked decision 2, honored with the
comparison moved out of the storage key — review B1): `styleHash` (§15.2) and
`domSig` (§15.3) are computed **once, after the `storage.local.get` resolves
and before any DOM work**, then validated against the entry. Computing them
at a single point guarantees the stored signature, the stored `styleHash`, and
the recorded effects all describe the **same** DOM/CSS state; keying on a hash
taken *before* the storage await would let page script interleave and produce
an entry whose signature and effects disagree (B1).

### 15.2 `styleHash` — stylesheet source

Synchronous FNV-1a (two 32-bit seeds → 16 hex chars). **Not**
`crypto.subtle`: it is `undefined` on plain-`http://` pages and this extension
is `<all_urls>`.

Input, in `doc.styleSheets` order:

1. **Skip** any sheet whose `ownerNode` is non-null **and** carries
   `data-uxx` — our own injected boot/role/inline sheets must never
   influence the hash (otherwise the first load's hash differs from every
   subsequent load's).
2. **`ownerNode == null`** (page-constructed / `adoptedStyleSheets` — review
   R2): hash `sheet.href || ''` plus the sheet's `cssRules` text if readable,
   else a `'constructed'` marker. Never dereference a null `ownerNode`.
3. **Inline sheet** (`sheet.href == null`, `ownerNode` present): hash
   `ownerNode.textContent`. Exact source, immune to CSSOM re-serialization
   drift.
4. **External sheet** with readable `cssRules`: hash `sheet.href` +
   `'\n'` + every rule's `cssText`, joined in order.
5. **External sheet throwing `SecurityError`** (cross-origin): hash
   `sheet.href` only — the "known style sheet source, compared by hashes"
   fallback; a same-URL content change on a cross-origin CDN is a documented
   miss (C1).
6. Finally hash `documentElement.getAttribute('style')` (raw string; the
   root's inline style is part of the page's source).

Total hashed characters are hard-capped at `CACHE_HASH_MAX_CHARS = 4_000_000`
with a truncation marker appended — a bounded-cost safety valve; beyond it two
sheets differing only past the cap collide (C2). Every part is length-prefixed
in the joined input so no concatenation ambiguity can forge a match.

### 15.3 `domSig` — canonical walk

`canonicalWalk(doc)` traverses `documentElement` + open shadow roots in an
order **byte-identical to `forEachElement`** (`main.js:92-110`) but **without
pruning** (no `readFact`, no computed style). Exact order (review R7 — pinned
because "light children before shadow roots" was ambiguous):

- `documentElement` is index **0**; null `documentElement` → empty walk.
- For each element: emit it, then recurse its **light children** in document
  order (each child emitted before its own subtree), **then** its
  `shadowRoot` (if open) with the same rules, **then** the next sibling.
  This is per-element pre-order, not level-order: a shadow host's shadow
  content is visited immediately after that host's light subtree, before the
  host's next sibling.

Returns `{ elements, indexOf, signature }`:

- `elements` — array of element references in canonical index order
- `indexOf` — `Map<element, index>`
- `signature` — `hash64` over, per element in order:
  `tagNameLower + '#' + getAttribute('id') + '.' + getAttribute('class') +
  '!' + getAttribute('style')`

**Raw attribute reads only** (review R1): `el.className` on SVG elements is an
`SVGAnimatedString` that string-coerces to `"[object SVGAnimatedString]"`,
which would make SVG class changes invisible to the signature. Always
`getAttribute(...)`, never `.className`/`.id`/`.style.cssText`.

Cost is attribute reads only (~15k × 4 reads, no layout, no style recalc) —
milliseconds, versus the ~30k forced-layout reads it replaces on a hit.

**Alignment invariant.** Effects are indexed by canonical position. The
pipeline's pruned walk is a *subsequence* of the canonical walk (pruning skips
subtrees but preserves order), so every themed element has a well-defined
canonical index. Pruned elements (img/canvas/video, blend/filter subtrees)
simply never receive an entry — replay leaves them untouched, exactly as the
full pipeline did.

**Single-point invariant (review B1, replaces the earlier sync-block claim).**
Order in `runPipeline`: (1) hoist `viewport`/`prefersMore`/`prefersColorScheme`/`forcedColors` (all cheap, no DOM walk);
(2) `lookupKey` from those + `url`/`version`; (3) **await** `lookup()`; (4)
**after** it resolves: `canonicalWalk` → `domSig`, `styleSourceHash` →
`styleHash`, validate the entry against both; (5a) hit → replay from that walk
in the same synchronous block, or (5b) miss → DETECT→CLASSIFY→MAP+APPLY in
that same synchronous block, recording effects against that walk's `indexOf`,
then store with those same `domSig`/`styleHash`. The single `storage.local.get`
await therefore sits **before** both hashes and the walk are taken, so page
script cannot interleave between signature/effect capture. No second await
opens a window before recording completes.

### 15.4 Value shape

JSON-ifiable, stored under `storage.local` key `sc:<lookupKey>`:

```js
{
  s: 'uxx-sc-v1',        // CACHE_SCHEMA (validated on read; also rejects degraded:true)
  v: '0.1.0',            // extension version (also in lookupKey)
  k: '<lookupKey>',      // echo, for validation
  t: 1730500000000,      // lastUsed — the ONLY LRU ordering field (no index key, §15.5)
  sh: '<styleHash>',     // validated on read (§15.2)
  ds: '<domSig>',        // validated on read (§15.3)
  degraded: false,       // schema guard: a writer must never store true (§15.5);
                         // lookup rejects true. Derivable-but-stored for self-containment.
  pal: { ...palette },   // JSON-safe (aggregate output: strings + {r,g,b,a} arrays)
  rt: [[colorKey, role], ...],   // rankTable as Map entries — a Map does not survive JSON
  bg: {r,g,b,a},         // pageBg — derivable from pack at any time, cached for self-containment
  lum: 0.042,            // pageLuminance
  e: [                   // only elements with ≥1 effect
    [idx, [roleIds...], hasException, [[propIdx, color], ...]],
    // roleIds: int indices into ROLE_RULES key order (33 roles → 0..32)
    // propIdx: 0 = 'background-color', 1 = 'color' (the only two redirectable)
  ],
}
```

`palette` and `pageBg`/`pageLuminance` are cached so the **MutationObserver
session is identical after a hit**: `session.applyElement` needs `mapper`
(rebuilt via `createMapper({ tokens: pack, palette, prefersMore })`),
`rankTable` (restored as `new Map(rt)` — `createMapper` starts with an empty
internal table and `applyElement` passes `rankTable` **per call**
`main.js:496-501`, so the restored table is what ranked text uses), `pageBg`
and `pageLuminance`.

Encoding: roles as small ints (`ROLE_INDEX` map over `ROLE_RULES` key order);
an element with no role/exception/inline effect gets **no entry** (replay
skips it — identical to never marking it). Size estimate is
`JSON.stringify(entry).length` in UTF-16 code units, not storage bytes — a
deliberate over-estimate for the `CACHE_MAX_ENTRY_BYTES` guard (a code unit
is ≥ 1 byte, so the guard never under-counts).

### 15.5 Write path (no index key — review R5)

There is **no `sc:index` key.** Each entry is self-describing via `t`, so
concurrent tabs storing simultaneously cannot orphan each other (the earlier
index design let a lost index update strand a still-hittable entry, and a
quota sweep then deleted valid entries). The whole cache is enumerated only on
the write path, which is off the critical path:

1. Only when `degraded === false` (a `MAX_ELEMENTS`/`TIME_TRIP` partial result
   replayed onto a full page would theme only root + children).
2. `storage.local.get(null)` → sum the byte size of every `sc:*` value →
   while over `CACHE_BUDGET_BYTES = 8 MB` (leaving headroom under the 10 MB
   default quota) **or** over `CACHE_MAX_ENTRIES = 100`, evict the entry with
   the **oldest `t`** and `storage.local.remove` its key.
3. Skip the write if the new entry alone exceeds
   `CACHE_MAX_ENTRY_BYTES = 2 MB` (one page must not eat the budget).
4. `storage.local.set({ ['sc:'+lookupKey]: entry })`. **Fire-and-forget** with
   a swallowed rejection — a cache write must never delay or break theming.
   The stored `sh`/`ds` are the same values validated in §15.3 step 4, taken
   after the lookup await and before the pipeline, so signature and effects
   describe one DOM state.

No write-time `styleHash` re-verification is needed (it also could never
succeed for a page whose root carries inline `!important` — MAP+APPLY's
`redirectInline` on `<html>` mutates the very `documentElement` style
attribute the hash reads, review R3): the hash is captured **once, before**
any of our writes, which is exactly the state that reproduces.

**Quota sweep.** If `set()` still rejects (quota), evict the LRU tail once more
and retry once, then give up (fail open — no caching this load). Because there
is no index, "orphaned but hittable" entries cannot exist, so no sweep can
delete valid data.

### 15.6 Hit path

1. `lookup(api, lookupKey)` — `storage.local.get('sc:' + lookupKey)` raced
   against `CACHE_LOOKUP_TIMEOUT_MS = 250`. The race uses a settled flag: a
   resolution arriving **after** the timeout is discarded, never applied late
   (review R6 — a late hit double-applied over a full run would corrupt
   markers). Timeout, error, or absent key → miss.
2. **Then** (post-await, §15.3 step 4) `canonicalWalk` → `domSig`,
   `styleSourceHash` → `styleHash`. Validate the entry **fully before any
   replay** (review R4): `s === CACHE_SCHEMA`, `k === lookupKey`,
   `v === version`, `degraded !== true`, `sh === styleHash`, `ds === domSig`,
   `pal` is an object, `rt` is an array, `bg`/`lum` present, `e` is an array
   whose records are `[number, number[], boolean, [number, string][]]`-shaped.
   **Any failure → miss, with zero side effects** (nothing has been written
   yet, so the full pipeline runs on a pristine DOM and its harvest is not
   skewed by half-applied markers).
3. `ensureRoleSheet()` + `ensureInlineSheet()` (markers need the sheets).
4. Replay: for each `e` record, `el = elements[idx]`; absent → skip (DOM
   shrank); `mark(el, role)` per roleId **in stored order** (the `mark` union
   is order-stable by first write, so replay is byte-identical), `setException`,
   `redirectInline` — the fresh DOM still carries the original inline
   declaration, so `redirectInline` re-derives value **and priority** from it
   and repopulates `apply`'s `redirected` registry, which is what `teardown()`
   restores. The whole replay is wrapped: **any throw → `apply.teardown()`
   + `apply.injectBoot()` + fall through to the full pipeline** (teardown
   restores the root inline style and purges every `data-uxx*`, so the
   subsequent harvest is clean; re-injecting boot restores the root colors the
   full path does not re-add).
5. Restore `palette = entry.pal`, `rankTable = new Map(entry.rt)`,
   `pageBg = entry.bg`, `pageLuminance = entry.lum`; build the session via the
   **same `buildSession` helper the full path uses** (extracted from
   `runPipeline`'s tail — review R8) so `suspended`/`teardowns`/`rescanAll`/
   `applyElement` closure bindings are identical, including the
   `rankTable`-per-call binding `applyElement` relies on.
6. Touch `t`: rewrite the entry with a fresh timestamp (entry-only; there is
   no index to race). Fire-and-forget.

**No `getComputedStyle`, no `getBoundingClientRect` on a hit.** The only
per-element work is attribute reads (walk) + attribute writes (replay).
The walk and both hashes are taken **after** the storage await, so a CSS or
class mutation landing in the ~1 ms lookup window produces a *miss* rather
than a stale hit (the earlier design's hit path had no such check — R6).

### 15.7 Failure & non-goals

Every storage path is wrapped: timeout, `SecurityError`, quota, malformed
entry, absent API → **miss → full pipeline**. The cache can only ever make
things faster; it can never leave a page unthemed or half-themed.

**Non-goals (v1):** caching degraded loads; caching `cssVars` (unconsumed,
§11); caching across `version` changes; sync-storage mirroring; cache
invalidation on `storage.onChanged` (a cold write simply overwrites).

**Residual risks** (labelled **C**1–**C**5 to keep them distinct from the
review rounds' **R**-labels, which denote *findings*):

- **C1 — cross-origin stylesheet content changes under a stable `href`**
  replay stale roles until the URL or DOM changes (SecurityError → href-only).
- **C2 — `CACHE_HASH_MAX_CHARS` truncation** can collide sheets differing
  only past 4M characters.
- **C3 — alternating DOM states on one `lookupKey`** (e.g. logged-in vs
  logged-out rendering of the same URL + viewport) thrash a single entry:
  each load validates against the other's `ds` and misses. Correct (never
  wrong themes), just no cache benefit for such pages.
- **C4 — text-only zoom / OS font-size changes** do not move `innerWidth`,
  so the viewport buckets do not catch them; classify's size heuristics may
  see a stale bucket. Bounded: a reload with a changed bucket self-corrects,
  and `measureSizeClass` reads the live `fact.fontSizePx` on any mutation.
- **C5 — page-script mutations invisible to `domSig`.** `domSig` covers only
  `id`/`class`/`style` attributes (the three that drive `readFact`), so two
  states that differ only in (i) an inline sheet's live rule set (a page
  calling `CSSStyleSheet.insertRule`/`deleteRule` after parse — the
  `textContent` a `styleSourceHash` reads is unchanged) or (ii) a
  classify-relevant *non*-style attribute (`role`, `type`, `aria-*`, input
  states) will validate as a hit and replay the older effects. Both are
  bounded: healing requires an *observed* mutation — the MutationObserver's
  `attributeFilter: ['style','class']` means a `role`/`type`/`aria-*` change
  alone produces no record, and a CSSOM `insertRule`/`deleteRule` produces no
  DOM mutation at all — so re-classification happens on the element's next
  observed `class`/`style`/`childList` mutation, and any such `class`/`style`
  change (which these state changes usually accompany) invalidates the entry
  outright on the next load. A state change with *no* accompanying observed
  mutation keeps the older theme until reload — accepted.
  Accepted rationale for not capturing more: extra attributes are extra
  `getAttribute` reads (cheap, no style recalc) but grow `domSig` toward every
  attribute; an inline sheet's live rule set would need CSSOM serialization on
  *every* load to hash. Neither is worth it for a cosmetic cache whose misses
  are free (miss → full pipeline, which is today's behavior).
