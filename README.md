# @open-hax/uxx

Open Hax UI kit with shared tokens plus framework bindings for React, Reagent, and Helix.


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Packages

| Package | Audience | Status | Docs |
| --- | --- | --- | --- |
| `@open-hax/uxx` | React apps | Canonical implementation | [`react/README.md`](./react/README.md) |
| `@open-hax/uxx-reagent` | Reagent apps | React-backed parity layer | [`reagent/README.md`](./reagent/README.md) |
| `@open-hax/uxx-helix` | Helix apps | React-backed parity layer | [`helix/README.md`](./helix/README.md) |
| `@open-hax/uxx/tokens` | Design token consumers | Shared source of truth | [`tokens/`](./tokens) |

## What changed

The Reagent and Helix packages now target the same public component surface as the React package by wrapping the canonical React build in `dist/`.

That gives the three bindings the same:

- public component inventory
- visual behavior
- token usage
- provider surface for theme + toast
- helper utilities for pagination

React-only hooks still exist as hooks, but they are re-exported for advanced ClojureScript consumers who know the normal React hook rules.

## Component coverage

Public parity now covers these exported components:

- Foundations: `Button`, `Badge`, `Spinner`, `Card`, `CardHeader`, `CardBody`, `CardFooter`, `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter`, `Tooltip`, `Input`, `Select`, `Textarea`, `Progress`
- Workspace UI: `ResizablePane`, `WhichKeyPopup`, `InspectorPane`, `ContextSection`, `PinnedTabsBar`, `PermissionCard`, `PromptCard`, `PermissionPrompts`, `ReactReagentSeam`, `CommandPalette`, `Chat`, `Toast`, `FileTree`, `Tabs`
- Data + structure: `SearchableSelect`, `CollapsiblePanel`, `KeyValueSection`, `SurfaceHero`, `PanelHeader`, `MetricTile`, `MetricTileGrid`, `FilterToolbar`, `ActionStrip`, `StatusChipStack`, `DataTableShell`, `Pagination`
- Content + editors: `Feed`, `Markdown`, `CodeBlock`, `DiffViewer`, `MarkdownEditor`, `RichTextEditor`

React now also exports the first composition-level component:

- Compositions: `EntityCard` (React public now; Reagent/Helix parity pending)

The new section primitives are now public across all three bindings:

- `CardHeader`, `CardBody`, `CardFooter`
- `ModalHeader`, `ModalBody`, `ModalFooter`

See [`docs/framework-parity.md`](./docs/framework-parity.md) for the detailed matrix and framework notes.

## Quick start

### Themes and palettes

```ts
import {
  themePacks,
  createThemePack,
  getThemeCssVars,
  monokai,
  nightOwl,
  proxyConsole,
} from '@open-hax/uxx/tokens';

const theme = createThemePack(themePacks['proxy-console'], {
  colors: { accent: { cyan: '#16e0ff' } },
});

const cssVars = getThemeCssVars(theme);
```

For Eta Mu / Pi, `@open-hax/uxx` publishes generated terminal theme JSON files under `dist/eta-mu-themes` and declares them in the package `pi.themes` manifest. After installing the package as a Pi package, select one of:

- `uxx-monokai`
- `uxx-night-owl`
- `uxx-proxy-console`

Programmatic Eta Mu adapters are also available:

```ts
import { etaMuThemes, createEtaMuThemeJson } from '@open-hax/uxx/eta-mu';
```

### React

```bash
cd orgs/open-hax/uxx
pnpm install --frozen-lockfile
pnpm build
```

```tsx
import { ThemeProvider, Button, Card, EntityCard } from '@open-hax/uxx';

export function Example() {
  return (
    <ThemeProvider theme="night-owl">
      <Card title="Status">
        <Button variant="primary">Ship it</Button>
      </Card>
      <EntityCard
        id="agent-1"
        name="Compiler Agent"
        type="worker"
        status={{ value: 'ready', variant: 'success' }}
      />
    </ThemeProvider>
  );
}
```

Built-in themes now include `monokai`, `night-owl`, and `proxy-console`. The canonical provider is `ThemeProvider`; `UxxThemeProvider` is available as a backward-compatible alias for the collaborator-proposed theme-pack surface.

### Reagent

```bash
cd orgs/open-hax/uxx
pnpm install --frozen-lockfile
pnpm build
pnpm --dir reagent build
```

```clojure
(ns app.core
  (:require [devel.ui.core :as ui]))

(defn screen []
  [ui/theme-provider {:theme :night-owl}
   [ui/card {:title "Status"}
    [ui/button {:variant :primary} "Ship it"]]])
```

### Helix

```bash
cd orgs/open-hax/uxx
pnpm install --frozen-lockfile
pnpm build
pnpm --dir helix build
```

```clojure
(ns app.core
  (:require [helix.core :refer [$]]
            [devel.ui.helix.core :as ui]))

(defn screen []
  ($ ui/theme-provider {:theme :night-owl}
     ($ ui/card {:title "Status"}
        ($ ui/button {:variant :primary} "Ship it"))))
```

## Architecture

- `react/` contains the canonical TypeScript + React implementation.
- `dist/` is the generated build artifact consumed by the ClojureScript bindings.
- `reagent/` and `helix/` translate idiomatic CLJS props into the React prop surface.
- `tokens/` remains the shared design-token source.

This means parity work lands once in React and can be surfaced in Reagent and Helix without reimplementing every component three times.

## Docs

- [`react/README.md`](./react/README.md)
- [`reagent/README.md`](./reagent/README.md)
- [`helix/README.md`](./helix/README.md)
- [`docs/framework-parity.md`](./docs/framework-parity.md)

## Build and verify locally

```sh
pnpm install --frozen-lockfile
pnpm build:all
pnpm test
pnpm test:adapters
pnpm typecheck
pnpm lint
```

The root build generates tokens first. The adapter build creates production ESM exports for Helix and Reagent; the runtime check imports both artifacts and confirms peer consumers resolve one React identity. The adapters consume the canonical root library as a peer, so the root library does not depend back on its adapters. Each adapter declares its own runtime peer and a workspace development link.

Both adapters build their release artifact in `prepack` and publish only the distribution, CLJS source, and build configuration. React and React DOM are peers with development copies for local builds; Shadow is a development dependency. The Reagent adapter uses the Maven `reagent/reagent` library declared in its Shadow configuration. The unrelated npm package named `reagent` is not part of this implementation.

To verify actual published contents, run `npm pack --pack-destination /your/output/directory` in each adapter directory, then `node scripts/verify-packed-adapters.mjs /your/output/directory/open-hax-uxx-helix-0.1.0.tgz /your/output/directory/open-hax-uxx-reagent-0.1.0.tgz` at the root. The check extracts both real archives into a temporary consumer, verifies package entrypoints and peer declarations, rejects bundled dependency/build caches, and imports both production adapters against one installed React peer. It removes the temporary consumer afterward. The canonical Uxx peer comes from this built workspace; the adapter artifacts come exclusively from the archives.

The workspace uses pnpm's isolated linker with public hoisting. The hoisted linker treats the workspace directory named react as a competing hoist node and can leave the root React dependency missing while duplicating it under peer consumers. Public links preserve Shadow's root package visibility without creating multiple React identities.

The Shadow ESM import options belong inside each build; top-level js-options were ignored. Keeping React and the canonical Uxx package external avoids bundling another runtime or parsing unrelated transitive packages with Closure. Production builds can be loaded together; independently compiled development CLJS runtimes declare global namespaces and should be loaded through their owning development build.

ESLint and TypeScript ESLint are explicitly pinned, using their recommended rules and zero allowed warnings. The setup fixes previously unused bindings and replaces broad any casts with the actual UI types. Existing public props and assertions remain available.

## Note on React-only compositions

`react/src/compositions/EntityCard.tsx` is now part of the published React API. It is still excluded from Reagent and Helix parity until explicit wrapper support is added and documented.

## License

`@open-hax/uxx` is licensed under **LGPL-3.0-or-later**.

### What this means for consumers

This component library **may be bundled directly with proprietary, closed-source projects**. Your application code does not need to be licensed under the LGPL or GPL.

**The one obligation:** any modifications you make **to this library itself** — whether to fix bugs, add features, or adapt it to your project's needs — must be published back under the LGPL-3.0-or-later.

In practical terms:

- ✅ Use `@open-hax/uxx` as a dependency in proprietary software
- ✅ Distribute your proprietary application alongside the unmodified library
- ✅ Build closed-source products that import and render these components
- 📢 If you modify any file within this library, publish those changes under LGPL-3.0-or-later

The boundary is the library itself. Your application code remains yours. Changes to the library remain the commons.

See the full [`LICENSE`](./LICENSE) text for the complete terms.
