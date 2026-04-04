# Π Snapshot: UXX multi-theme rollout + consumer token bridge

- **Repo:** `open-hax/uxx`
- **Branch:** `fork-tax/20260404-033121-theme-registry-night-owl-completion`
- **Base branch:** `main`
- **Previous tag:** `none`
- **Intended Π tag:** `Π/20260404-033121-theme-registry-night-owl-completion`
- **Generated:** `2026-04-04T03:31:21Z`

## What this snapshot preserves

This Π handoff captures the multi-theme UXX rollout with Monokai retained as the default theme and Night Owl added as a built-in alternative. It also preserves the downstream token-bridge fix that lets consumer applications theme their own CSS surfaces, not only UXX primitives.

### Theme system
- `tokens/src/colors.ts` — theme registry, theme resolution helpers, CSS-variable generation, and dual alias emission for `--uxx-*` plus `--token-*`
- `tokens/src/index.ts` — exported theme APIs/types
- `react/src/theme.tsx` and `react/src/index.ts` — runtime `ThemeProvider` surface

### Primitive alignment
- Theme-aware updates across markdown/code/diff/editor primitives and token-driven UI primitives
- Reduced direct Monokai coupling in tabs, toast, feed, badge, tooltip, modal, input, progress, metric tile, and related surfaces

### Storybook/operator workflow
- `react/.storybook/preview.tsx` — theme toolbar support
- `react/.storybook/main.ts` — nested-package Storybook/Vite fixups
- `scripts/storybook-server.sh` — PM2 launch target for persistent Storybook

## Verification

- Typecheck: `npm run typecheck` ✅
- Tests: `npm test` ✅
- Build: `npm run build` ✅
- Publish: `@open-hax/uxx@0.1.3` ✅
