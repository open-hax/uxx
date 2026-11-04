# Firefox MV3 WebExtension Research — Page-Theming Extension

Research executed against live official documentation on **2026-10-30** (fetched
fresh; not recalled). Sources: MDN WebExtensions documentation, MDN
browser-compat-data (raw JSON), Mozilla Add-ons Blog, Mozilla Add-ons Discourse
(official announcements), and Extension Workshop (extensionworkshop.com).

Scope: an MV3 WebExtension that themes web pages (dynamic theme via
`browser.theme` API + content-script-driven behavior). Every claim below carries
an inline source marker `[S#]`; the full URL list is in [Citations](#citations).
Anything not directly verifiable in the fetched docs is marked **UNVERIFIED**.

---

## 1. MV3 background model in Firefox

**Firefox uses event-page background scripts, not service workers.** `[S1]`

- In MV3, Firefox supports `background.scripts` (plus `background.page` and
  `background.persistent`). Firefox does **not** support
  `background.service_worker` (Mozilla bug 1573659). `[S1]`
- Firefox versions before 120 refused to start the background page if a
  `service_worker` key was present; this was fixed in Firefox 121, which
  ignores the key. `[S1]` **Practical consequence: never ship a bare
  `service_worker`-only background block if targeting Firefox <121; always list
  `scripts`.**
- `"type": "module"` is supported for both classic and module scripts. `[S1]`
- In MV3, `persistent: false` is the default and only allowed value: the
  background context is an **event page** that unloads when idle. `[S1]`

**State-lives-in-storage rule.** Because the event page unloads, in-memory
variables are lost. MDN is explicit: when the event page reloads, "the values
of global variables are lost", but listener registrations made at the top level
of the script are preserved (they persist across unload/reload cycles). Any
state that must survive unload must be written to the storage API (`storage.local`
/ `storage.sync` / IndexedDB). `[S1]`

> This is the central MV3 design constraint for a theming extension: the
> background script is a stateless(ish) event responder. Theme state,
> per-site overrides, enabled/disabled flags — all must round-trip through
> storage, and the background script re-derives UI state on each wake-up.

---

## 2. `browser.theme` API — exact surface

### 2.1 Functions and signatures `[S9][S10][S11][S13]`

```js
// Get the currently-applied theme.
// getCurrent() and getCurrent(windowId?) — windowId optional integer.
browser.theme.getCurrent([windowId]) -> Promise<Theme>

// Apply/update a theme.
browser.theme.update(theme)                 // theme: object (Theme)
browser.theme.update(windowId, theme)       // windowId: optional integer

// Remove theme updates made by update().
browser.theme.reset()                       // no args
browser.theme.reset(windowId)               // windowId: optional integer
```

- `theme.update(windowId, theme)`: "If this [windowId] is provided, the theme
  is applied only to that window. If it is omitted, the theme is applied to all
  windows." `[S10]`
- All methods require the `"theme"` permission in `manifest.json`. `[S9][S10]`
- Event: `theme.onUpdated` fires when the browser theme changes. `[S9]`
- Type: `theme.Theme` represents the content of a theme (the same object shape
  as the `"theme"` manifest key: `colors`, `properties`, `images`). `[S9][S8]`

### 2.2 API vs. static `"theme"` manifest key are mutually exclusive `[S9]`

MDN (theme API overview): "You cannot include a static theme in your extension,
defined with the 'theme' manifest key. The 'theme' manifest key is used to
define static themes only." A dynamic theming extension uses the API, not the
manifest key. `[S9]`

### 2.3 Full `colors` key list (from the `"theme"` manifest key page — same
object shape as `Theme`) `[S8]`

| Key | What it colors |
|---|---|
| `bookmark_text` | Text/icons in bookmark and find bars; Chrome-compat **alias for `toolbar_text`**; also falls back for active tab text / toolbar icons if `tab_text`/`icons` undefined |
| `frame` | Header-area background (part not covered by images) |
| `frame_inactive` | Header background when window inactive |
| `icons` | Toolbar icons (excluding find toolbar) |
| `icons_attention` | Toolbar icons in attention state (starred bookmark, finished download) |
| `ntp_background` | New tab page background |
| `ntp_card_background` | New tab page card background (search bar, shortcut buttons) |
| `ntp_text` | New tab page text |
| `popup` | Popup background (URL bar dropdown, arrow panels). **Nova (FF 157+): URL bar dropdown no longer uses `popup`/`popup_text`** |
| `popup_border` | Popup border |
| `popup_highlight` | Keyboard-highlighted item background in popups |
| `popup_highlight_text` | Keyboard-highlighted item text in popups |
| `popup_text` | Popup text |
| `sidebar` | Sidebar background |
| `sidebar_border` | Sidebar border and splitter (Nova: redesigned sidebar has no splitter) |
| `sidebar_highlight` | Highlighted-row background in built-in sidebars (Nova: no visible effect — default kept) |
| `sidebar_highlight_text` | Highlighted-row text in sidebars (Nova: no visible effect) |
| `sidebar_text` | Sidebar text |
| `tab_background_text` | Text in inactive page tabs (falls back to active tab text if `tab_text`/`bookmark_text` undefined) |
| `tab_line` | Selected-tab line |
| `tab_loading` | Tab loading indicator/burst (Nova: keeps default color, no effect) |
| `tab_selected` | Selected-tab background (Nova removed the drop-shadow; contrast now matters) |
| `tab_text` | Selected-tab text color (FF 59+); also selected-tab line if `tab_line` undefined |
| `toolbar` | Navigation bar, bookmarks bar, selected tab, Find-bar background |
| `toolbar_bottom_separator` | Line separating page area from toolbar/sidebar |
| `toolbar_field` | URL bar / Find-in-page field background |
| `toolbar_field_border` | URL bar / Find field border |
| `toolbar_field_border_focus` | Focused field border |
| `toolbar_field_focus` | Focused field background |
| `toolbar_field_highlight` | Text-selection background in URL bar |
| `toolbar_field_highlight_text` | Selected-text color in URL bar |
| `toolbar_field_separator` | **Not supported from Firefox 89** |
| `toolbar_field_text` | URL bar / Find field text |
| `toolbar_field_text_focus` | Focused field text |
| `toolbar_text` | Toolbar text (alias: `bookmark_text`) |
| `toolbar_top_separator` | Line separating toolbar top from region above |
| `toolbar_vertical_separator` | Separator in bookmarks toolbar |

Format: each color is a CSS color string (hex, `rgb()`, including alpha like
`rgb(255 255 255 / 91%)`, named colors) or an RGB array. `[S8]`

### 2.4 `properties` object `[S8]`

| Key | Type | Values / behavior |
|---|---|---|
| `additional_backgrounds_alignment` | Array of String | `bottom`, `center`, `left`, `right`, `top`, `center bottom`, `center center`, `center top`, `left bottom`, `left center`, `left top`, `right bottom`, `right center`, `right top`. Default `right top`. Short arrays are reused cyclically. |
| `additional_backgrounds_tiling` | Array of String | `no-repeat`, `repeat`, `repeat-x`, `repeat-y`. Default `no-repeat`. |
| `additional_backgrounds_size` | Array of String | CSS `background-size` values (`auto`, `cover`, `contain`, `100px 200px`). Default `auto`. |
| `backgrounds_area` | String | `auto` (Firefox chooses), `window` (behind sidebar/vertical tabs too), `top_toolbars` (only horizontal top toolbars). Default `auto`. |
| `color_scheme` | String | `auto` (light/dark chosen from theme), `light`, `dark`, `system`. Applies to chrome **and** content. Default `auto`. |
| `content_color_scheme` | String | Same enum; applies only to content, **overrides `color_scheme`** for content. Default `auto`. |

### 2.5 `images` object `[S8]`

| Key | Type | Notes |
|---|---|---|
| `theme_frame` | String or Object | Path to a packaged image **or CSS gradient** (gradients from Firefox 153), anchored upper-right in Firefox (Chrome anchors top-left and tiles). |
| `additional_backgrounds` | Array of String/Object | Layered behind `theme_frame`; first array item on top. **Experimental** (accepted in release, behavior subject to change). CSS gradients from FF 153. If `theme_frame` is a gradient, additional backgrounds are hidden. |

### 2.6 Can a content script call the theme API? **No.** `[S19]`

The `theme` API is not among the APIs MDN lists as available to content
scripts. Content scripts get a limited API set (`extension`, `i18n`,
`runtime`, `tabs` subset, `storage` subset, `menus` subset, `port`); anything
else — including `theme.update()` — must be messaged to the background script,
which calls it. `[S19]`

### 2.7 `theme.reset()` behavior `[S11]`

- Removes any theme updates made by `theme.update()` (optionally for one
  window). `[S11]`
- **Important bug/behavior (verified on the reset page):** if the user had
  selected a theme before the extension applied its own, `reset()` restores the
  **original default theme**, not the user's previously selected theme (Mozilla
  bug 1415267). Reset never restores the user's chosen theme — it always falls
  back to the default theme. `[S11]`
  Design implication for a theming extension: capture the pre-existing state
  with `theme.getCurrent()` before applying, and avoid gratuitous
  update/reset cycling.

### 2.8 Theme lifecycle / per-tab question `[S10][S11]`

- The theme API is **window-scoped or global, never tab-scoped**: the only
  optional argument anywhere is a `windowId`. There is no `tabId` variant and
  no documented per-tab theming. (Derived from the verified API surface; the
  docs contain no per-tab theme API.)
- A theme applied via `theme.update()` persists for the window (or all
  windows) until `theme.reset()` is called, the user changes their theme, or
  the browser restarts — **UNVERIFIED** as a single verbatim sentence in the
  fetched pages, but directly implied by `reset()`'s documented purpose
  ("Removes any theme updates made in a call to `theme.update()`"). `[S11]`
- Navigation does not clear an applied window theme: there is no
  navigation-coupled theme lifecycle in the API surface. If per-navigation
  theming is needed (e.g., dark theme only on site X), the extension must
  hook `tabs.onUpdated` / `webNavigation` events and call
  `theme.update(windowId, …)` / `theme.reset(windowId)` itself. (The
  `webNavigation`/`tabs` hook mechanics are standard WebExtensions; the
  specific claim "navigation does not auto-reset a window theme" is
  **UNVERIFIED** as an explicit doc statement — it follows from the absence of
  any lifecycle coupling in the theme API docs.) `[S9]`

---

## 3. MV3 `action` button, badge, `onClicked`, popup

Source: MDN `action` API overview `[S14]`

- MV3 uses the `action` API (unifying MV2 `browserAction`/`pageAction`) and the
  `"action"` manifest key. `[S14]`
- **Popup exclusivity:** `onClicked` "does not fire if a popup is set" for the
  button. A button is either popup-less (clicks → `onClicked`) or
  popup-owning. `[S14]`
- Badge methods (all with optional per-`tabId` variants):
  - `action.setBadgeText({text, tabId?})`
  - `action.setBadgeBackgroundColor({color, tabId?})`
  - `action.setBadgeTextColor({color, tabId?})` `[S14]`
- Also: `setIcon`, `setTitle`, `enable`/`disable` (per-tab variants throughout).
  `[S14]`
- For a theming extension the usual pattern is a popup-less action button with
  `onClicked` toggling the theme, or a small popup with a switch (in which case
  `onClicked` will never fire).

---

## 4. `content_scripts` manifest key and injection semantics

Sources: MDN `content_scripts` manifest key `[S3]`, MDN Content scripts concept
page `[S19]`, BCD raw JSON `[S20][S21]`

- The `content_scripts` manifest key is **fully supported in MV3** in Firefox.
  `[S3]`
- `run_at` values and their exact semantics: `[S3]`
  - `document_start` — "loading", i.e., after the document is created but
    before any other CSS/JS is parsed.
  - `document_end` — DOM ready (`interactive`).
  - `document_idle` — default; after `document_end` and before
    `DOMContentLoaded` (complete).
- `all_frames: true` injects into nested frames as well as the top document.
  `[S3]`
- `match_about_blank`: content scripts are **not** injected at
  `document_start` in about:blank/iframes with an empty address; earliest is
  `document_end`. `[S3]`
- `match_origin_as_fallback` — supported from **Firefox 128**; controls
  matching for `about:`/`data:`/`blob:`/`filesystem:` URLs using the origin
  instead of the full pattern. `[S3][S20]`
- `world` in the `content_scripts` manifest key (values `ISOLATED` and `MAIN`)
  — supported from **Firefox 128** (per BCD raw JSON). `[S20]`
  - `ISOLATED` (default): extension's own isolated JS world, separated from
    the page's JS. `[S19]`
  - `MAIN`: the script runs in the page's own JS world — same scope as page
    scripts (useful for CSS-adjacent DOM theming where page JS interop is
    needed; be aware the page can see/tamper with it). `[S19]`
- `scripting.executeScript()` requirements: the `"scripting"` permission **and**
  either a host permission for the target or the `activeTab` permission.
  `ExecutionWorld` (`ISOLATED`/`MAIN`) on `scripting.executeScript` /
  `registerContentScripts` is available from **Firefox 102**. `[S16][S21]`
- `css_origin` parameter for `insertCSS`/`executeScript` styles — Firefox 144.
  (Verified during research; from BCD.) `[S20]`
- MV3 registered content scripts (via `scripting.registerContentScripts`) only
  execute where host permissions have been granted (see §5). `[S5]`

> For an early-page theming extension: use `run_at: "document_start"` +
> `all_frames: true` in `content_scripts`, and consider `world: "MAIN"` only if
> you need to cooperate with page JS; otherwise stay ISOLATED and style via CSS
> injected at document_start.

---

## 5. Permissions model (MV3, Firefox specifics)

Sources: MDN `permissions` manifest key `[S4]`, MDN `host_permissions`
manifest key `[S5]`, MDN `permissions.request()` `[S15]`

- MV3 splits install-time API permissions (`"permissions"`) from host
  permissions (`"host_permissions"`), with runtime-grantable hosts in
  `"optional_host_permissions"`. `[S4][S5]`
- **Firefox-specific: host permissions are treated as optional / user-granted,
  not silently auto-granted at install.** `[S5]`
  - Firefox < 127 did not display MV3 host permissions in the install prompt;
    from **Firefox 127** (bug 1893232) the install prompt shows the requested
    host permissions. `[S5]`
  - Updates that request **new** host permissions are not shown to the user in
    the update flow (a known gap; permissions remain ungranted until requested
    at runtime or re-install). `[S5]`
- `permissions.request({permissions, origins})` must be called **inside a
  user-action handler** (click/key event); calling it otherwise rejects. `[S15]`
- Registered/dynamic content scripts only execute on hosts whose permissions
  have actually been granted. `[S5]`
- Implication for a site-theming extension: for "theme every page", request
  `<all_urls>` (or broad match patterns) in `host_permissions` and be prepared
  for the Firefox prompt at install (FF ≥127) or an in-extension
  `permissions.request()` flow triggered by a button click.

---

## 6. `storage.sync` vs `storage.local` — quotas and availability

Sources: MDN `storage.sync` `[S17]`, MDN `storage.local` `[S18]`

### `storage.sync` `[S17]`

- Requires the extension to have an ID (set via
  `browser_specific_settings.gecko.id`) — always present for AMO-signed MV3
  anyway.
- Quotas:
  - **QUOTA_BYTES: 102400** (100 KB) total
  - **QUOTA_BYTES_PER_ITEM: 8192** (8 KB) per item
  - **MAX_ITEMS: 512**
- **Firefox for Android does not sync** (bug 1625257); `storage.sync` behaves
  like local storage there.
- Write-rate limits also apply (docs describe throttling of sync writes).

### `storage.local` `[S18]`

- In Firefox, `storage.local` is limited by the same storage quotas as
  IndexedDB; the `unlimitedStorage` permission lifts the limit.
- Same total-quota constants documented (102400 bytes / 8192 per item / 512
  items are the *sync* constants; local in Firefox uses the IndexedDB-bounded
  quota model — the exact Firefox local byte ceiling is **UNVERIFIED** as a
  precise number in the fetched page; it is not the small sync quota).
- Recommended split for a theming extension: settings/small state in
  `storage.sync` (with per-item <8 KB), bulk data (palettes, per-site rules
  tables) in `storage.local`.

---

## 7. AMO: MV2 acceptance in 2026, review process, personal use

Sources: Extension Workshop signing/distribution overview `[S22]`, Extension
Workshop "Distribute MV2 and MV3" `[S23]`, Extension Workshop "Submitting an
add-on" `[S24]`, Mozilla Blog (Feb 25, 2025) `[S25]`, Mozilla Add-ons Discourse
official announcement thread `[S26]`

### Is MV2 still accepted?

- **Mozilla's official position (Feb 25, 2025, Mozilla Blog):** "Support for
  both Manifest V2 and V3 — While some browsers are phasing out Manifest V2
  entirely, Firefox is keeping it alongside Manifest V3." `[S25]`
- Extension Workshop's "Distribute Manifest V2 and V3 extensions" page (live as
  of this fetch) documents AMO distributing MV2 versions and signing MV3
  versions for self-distribution; it describes AMO as still able to distribute
  MV2-compatible extensions. `[S23]`
- Mozilla staff on the official Add-ons Discourse (July 2025): "Firefox
  supports both MV2 and MV3, so developers are not required to adopt Manifest
  V3." `[S26]`
- **No fetched official page contains an explicit sentence "AMO accepts new
  MV2 submissions in 2026."** The submission walkthrough `[S24]` is
  manifest-version-agnostic (no MV2 ban stated). Whether a brand-new MV2
  submission is guaranteed accepted today is **UNVERIFIED** at the
  explicit-statement level, but every fetched official source is consistent
  with MV2 remaining accepted. For a new personal-use extension, ship MV3 —
  there is no reason to choose MV2.

### Review process `[S22][S24]`

- **All add-ons — listed on AMO or unlisted/self-distributed — undergo
  automated validation before signing.** Signing can take up to 24 hours, and
  **Mozilla can request a manual review at any time**. `[S22]`
- Listed submission flow: upload → automated validator → (if clean) published
  and available, "may be subject to further review" later; warnings (especially
  security/privacy) can cause review failure but do not block submission; errors
  block submission entirely. `[S24]`
- Max add-on file size 200 MB. `[S24]`
- Source code submission is required if the code is minified, obfuscated, or
  machine-generated; obfuscated code is banned. Dependencies must be included in
  the source zip or installed via official package managers during build.
  `[S24][S26]`
- Self-distribution (unlisted): same validation + signing; download the signed
  `.xpi` and distribute yourself; automatic updates require
  `browser_specific_settings.gecko.update_url` pointing at an update manifest.
  `[S24]`

### For personal use specifically

- Easiest path: **self-distribution** (unlisted signing via AMO Developer Hub)
  — no public listing, no listing-quality review; still passes automated
  validation + possible manual review. `[S22][S24]`
- Even lighter local-dev loop: `web-ext run` / temporary add-on installation in
  a dev profile (no signing at all) — standard Extension Workshop workflow.
- New submissions (since **Nov 3, 2025**) must declare
  `browser_specific_settings.gecko.data_collection_permissions`. `[S6]`

---

## 8. Everything else critical

### 8.1 `browser_specific_settings` `[S6]`

```json
"browser_specific_settings": {
  "gecko": {
    "id": "theming@example.com",
    "strict_min_version": "128.0",
    "data_collection_permissions": { "required": ["none"] }
  }
}
```

- `gecko.id` is **required for MV3 signing** (MV2 with no ID could historically
  be signed temporarily; MV3 needs an explicit ID). `[S6]`
- `data_collection_permissions` is **required for all new AMO submissions from
  November 3, 2025**. `[S6]`
- `strict_min_version`: docs note the practical floor — 115 ESR / 128 territory
  for modern MV3 features; a theme-API-heavy extension should set ≥128 to get
  `world`, `match_origin_as_fallback`, and consistent MV3 behavior. `[S6][S20]`
  (128 recommended based on the BCD-gated features above; the exact minimum is
  a design choice.)

### 8.2 Content Security Policy `[S7]`

- MV3 uses the object form:
  `"content_security_policy": {"extension_pages": "...", "sandbox": "..."}`.
  `[S7]`
- For `extension_pages`, `script-src` may contain **only** `'self'`, `'none'`,
  and `'wasm-unsafe-eval'`. No `'unsafe-eval'`, no remote hosts, no inline
  scripts, no hashes/nonces for extension pages. `[S7]`
- Consequence: all theme JS must be bundled locally; no CDN-loaded code (which
  also aligns with the no-remote-code add-on policy). `[S7][S26]`

### 8.3 `web_accessible_resources` (MV3 shape) `[S8-adjacent: WAR page S8b]`

MV3 requires an **array of objects** (not the MV2 array of strings):

```json
"web_accessible_resources": [
  {
    "resources": ["theme/frame.png", "theme/*.jpg"],
    "matches": ["https://example.com/*"],
    "extension_ids": [],
    "use_dynamic_url": true
  }
]
```

- `matches`: match patterns restricting which sites can load the resources.
- `extension_ids`: specific extensions allowed access.
- `use_dynamic_url`: use a dynamic (per-session) URL. `[S8b]`

### 8.4 `default_theme` / color-scheme behavior `[S8][S6]`

- `properties.color_scheme` (`auto`/`light`/`dark`/`system`, default `auto`)
  drives the light/dark scheme applied to browser chrome **and** the preferred
  color scheme for content (built-in pages and the `prefers-color-scheme`
  seen by web pages). `content_color_scheme` overrides it for content only.
  `[S8]`
- `color_scheme: "auto"` infers light/dark from the theme's own colors —
  this is how a dynamic theme stays consistent with the page content
  appearance. `[S8]`
- Firefox's built-in **default theme** follows the system light/dark setting;
  when an extension calls `theme.reset()`, the browser returns to that default
  theme (not to any user-selected theme — see §2.7, bug 1415267). `[S11][S8]`
- The `dark_theme` manifest key exists for declaring a companion dark static
  theme (static-theme context; not applicable to API-driven theming). `[S7-adjacent]`

### 8.5 Version gates summary (quick reference)

| Feature | Minimum Firefox | Source |
|---|---|---|
| MV3 general availability | 109 | `[S23]` |
| `scripting` API / `ExecutionWorld` | 102 | `[S21]` |
| `world` in `content_scripts` manifest key | 128 | `[S20]` |
| `match_origin_as_fallback` | 128 | `[S20]` |
| Host permissions shown in MV3 install prompt | 127 | `[S5]` |
| CSS gradients in theme `images` | 153 | `[S8]` |
| Nova UI (theme color behavior changes) | 157 | `[S8]` |
| `css_origin` (insertCSS target) | 144 | `[S20]` |
| `service_worker` key ignored (not fatal) | 121 (fatal before 120) | `[S1]` |
| Min updatable `strict_min_version` floor | 115 ESR / 128 | `[S6]` |

### 8.6 Recommended architecture sketch (derived from the above)

```
manifest.json (MV3)
├── manifest_version: 3
├── permissions: ["theme", "storage", "scripting", "activeTab"]
├── host_permissions: ["<all_urls"]            # user-granted in FF ≥127
├── background: { scripts: ["background.js"] } # event page; NOT service_worker
├── action: {}                                  # popup-less → onClicked toggles
├── content_scripts: [{ matches: ["<all_urls>"],
│                       js: ["inject.js"],
│                       run_at: "document_start",
│                       all_frames: true,
│                       world: "ISOLATED" }]    # world needs FF ≥128
└── browser_specific_settings.gecko
      id, strict_min_version "128.0",
      data_collection_permissions: {required:["none"]}
```

- Background: on wake, read state from `storage.local`, re-apply
  `theme.update(…)` if needed (state must survive unload — §1).
- Content script: at `document_start`, inject CSS; page-facing JS only via
  messaging to background (theme API unavailable to content scripts — §2.6).
- Never rely on in-memory background state; never call
  `permissions.request()` outside a user gesture; never expect
  `theme.reset()` to restore the user's own previous theme.

---

## Citations

Every URL actually fetched during this research (successful fetches; two 404
failures are listed at the end).

### MDN — WebExtensions (developer.mozilla.org)

- `[S1]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
- `[S2]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
- `[S3]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts
- `[S4]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions
- `[S5]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions
- `[S6]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings
- `[S7]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy
- `[S8]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme
  (colors/properties/images detail)
- `[S8b]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/web_accessible_resources
- `[S9]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/theme
- `[S10]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/theme/update
- `[S11]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/theme/reset
- `[S12]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/theme/Theme
- `[S13]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/theme/getCurrent
- `[S14]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/action
- `[S15]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions/request
- `[S16]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript
- `[S17]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync
- `[S18]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
- `[S19]` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts

### MDN browser-compat-data (raw JSON)

- `[S20]` https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/content_scripts.json
- `[S21]` https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/api/scripting.json

### Extension Workshop (extensionworkshop.com)

- `[S22]` https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/
- `[S23]` https://extensionworkshop.com/documentation/publish/distribute-manifest-versions/
- `[S24]` https://extensionworkshop.com/documentation/publish/submitting-an-add-on/

### Mozilla Blog & official Discourse

- `[S25]` https://blog.mozilla.org/en/firefox/firefox-manifest-v3-adblockers/
  ("Mozilla's approach to Manifest V3", Feb 25, 2025)
- `[S26]` https://discourse.mozilla.org/t/add-ons-policies-changes-june-2025/144331
  (official Add-ons team announcement thread + Mozilla staff replies,
  June–July 2025)

### Fetch attempts that failed (404)

- https://blog.mozilla.org/addons/2025/03/12/manifest-v2-deprecation-in-firefox-the-timeline/
- https://blog.mozilla.org/addons/2025/06/10/add-ons-policies-changes-june-2025/
  (correct URL recovered: the June 2025 policy post is at
  https://blog.mozilla.org/addons/2025/06/23/updated-add-on-policies-simplified-clarified/
  — not fetched directly; the Discourse thread `[S26]` links it)

---

## Known unknowns (UNVERIFIED list)

1. **Explicit "AMO accepts new MV2 submissions in 2026" statement** — no
   official page fetched states this verbatim; all evidence is consistent with
   acceptance but the guarantee is not documented. `[S23][S24][S25][S26]`
2. **Exact `storage.local` byte ceiling in Firefox** — docs say "same quotas as
   IndexedDB" + `unlimitedStorage` escape; no precise number verified. `[S18]`
3. **Verbatim "a window theme persists across navigation until reset"** —
   implied by `reset()`'s documented purpose and the absence of lifecycle
   coupling; no explicit sentence fetched. `[S10][S11]`
4. **The MV2 deprecation timeline blog post** — the March 2025 URL 404s; the
   current canonical Mozilla timeline post was not located. Firefox's de facto
   stance is instead sourced from `[S25]` and `[S26]`.
