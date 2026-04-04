# Π Snapshot: inspector/editor shell extraction + CLJS parity

- **Repo:** `open-hax/uxx`
- **Branch:** `feat/inspector-editor-shell-parity`
- **Base branch:** `main`
- **Previous tag:** `Π/2026-04-04/194944-e9b0981`
- **Intended Π tag:** `Π/2026-04-04/feat/inspector-editor-shell-parity`
- **Generated:** `2026-04-04T22:16:25Z`

## What this snapshot preserves

This Π handoff captures the UXX parity and extraction wave that turns Reagent and Helix into React-backed parity wrappers, documents the public framework surface, adds interop/performance harnesses, and promotes reusable inspector/editor shell pieces into the public API.

### Framework parity and interop
- React remains the canonical implementation surface.
- Reagent and Helix now wrap built React exports instead of maintaining drifting independent implementations.
- Framework docs and parity matrix explicitly track React/Reagent/Helix export alignment.
- Interop benchmarks and browser harness docs/scripts were added to measure wrapper overhead.

### Promoted public surfaces
- Inspector shell: `InspectorHeader`, `InspectorDetailView`, `InspectorEmptyState`, `InspectorErrorState`, `ContextSection`, `PinnedTabsBar`
- Editor shell: `EditorToolbar`, `EditorStatusBar`, `MentionSuggestions`
- Workflow cards: `PermissionCard`, `PromptCard`
- Composition parity: `EntityCard` is now exported across React, Reagent, and Helix.

### CLJS parity bridge
- Reagent/Helix wrapper exports, core namespaces, and Shadow ESM export maps were extended for all promoted surfaces.
- Root/package docs were updated to describe the shared public surface and parity status.

## Verification

- Targeted React tests: `npx vitest run --config react/vitest.config.ts react/src/primitives/MentionSuggestions.test.tsx react/src/primitives/InspectorHeader.test.tsx react/src/primitives/InspectorDetailView.test.tsx react/src/primitives/InspectorEmptyState.test.tsx react/src/primitives/InspectorErrorState.test.tsx react/src/primitives/EditorToolbar.test.tsx react/src/primitives/EditorStatusBar.test.tsx react/src/primitives/ContextSection.test.tsx react/src/primitives/PinnedTabsBar.test.tsx react/src/primitives/PermissionCard.test.tsx react/src/primitives/PromptCard.test.tsx` ✅
- Root build: `npm run build` ✅
- Reagent build: `cd reagent && npm run build` ✅
- Helix build: `cd helix && npm run build` ✅

## Concurrent dirt intentionally untouched

- The parent workspace repo at `~/devel` has unrelated concurrent modifications outside `orgs/open-hax/uxx`; this Π only absorbs the `open-hax/uxx` submodule changes.
