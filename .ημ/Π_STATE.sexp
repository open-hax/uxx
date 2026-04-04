;; Π State Snapshot
;; Generated: 2026-04-04T03:31:21Z

(
  :repo "open-hax/uxx"
  :branch "fork-tax/20260404-033121-theme-registry-night-owl-completion"
  :base-branch "main"
  :previous-tag nil
  :intended-tag "Π/20260404-033121-theme-registry-night-owl-completion"
  :remote "origin"

  :work-description
  "Finish the UXX multi-theme rollout with Monokai as default and Night Owl as a first-class built-in theme, then bridge consumer-facing CSS variables so downstream apps can theme both library primitives and app-owned CSS from the same ThemeProvider scope.

  Changes:
  - Added theme registry/types/helpers in tokens with Monokai + Night Owl and default Monokai fallback
  - Exported runtime theming APIs including ThemeProvider and getThemeCssVariables
  - Made UXX primitives theme-aware through CSS-variable-backed token references instead of monokai-specific coupling
  - Added Storybook theme toolbar plus PM2-backed Storybook launcher
  - Added token alias emission for both --uxx-* and --token-* variables so consumer apps inherit theme changes correctly"

  :verification (
    :typecheck "pass (npm run typecheck)"
    :tests "pass (npm test)"
    :build "pass (npm run build)"
    :publish "pass (@open-hax/uxx@0.1.3 published to npm)"))
