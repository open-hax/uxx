# @open-hax/uxx-helix

Helix component library implementing @open-hax/uxx contracts.

## About

This package provides a set of UI components built with [Helix](https://github.com/lilactown/helix), a modern ClojureScript interface to React. Helix offers:

- Direct React interop with minimal overhead
- Modern React hooks support
- No Hiccup syntax (uses `$` macro and `helix.dom`)
- Better performance than Reagent for complex UIs

## Installation

```bash
pnpm add @open-hax/uxx-helix
```

## Usage

```clojure
(ns my-app.core
  (:require [helix.core :refer [$]]
            ["@open-hax/uxx-helix" :as ui]))

;; Use components
($ ui/Button {:variant :primary :on-click #(js/alert "Clicked!")}
   "Click me")

($ ui/Card {:variant :elevated}
   ($ ui/CardHeader {} "Card Title")
   ($ ui/CardBody {} "Card content")
   ($ ui/CardFooter {}
      ($ ui/Button {} "Action")))

;; Badge for status
($ ui/Badge {:variant :success} "Active")

;; Progress bar
($ ui/Progress {:value 75 :variant :default})

;; Modal dialog
($ ui/Modal {:open? open? :on-close #(set-open? false)}
   ($ ui/ModalHeader {:on-close #(set-open? false)} "Dialog Title")
   ($ ui/ModalBody {} "Dialog content")
   ($ ui/ModalFooter {}
      ($ ui/Button {:variant :ghost :on-click #(set-open? false)} "Cancel")
      ($ ui/Button {:variant :primary} "Confirm")))

;; Input field
($ ui/Input {:type :email
             :placeholder "Enter email"
             :value @email
             :on-change #(reset! email (.. % -target -value))})

;; Tooltip
($ ui/Tooltip {:text "Helpful info" :position :top}
   ($ ui/Button {} "Hover me"))

;; Spinner
($ ui/Spinner {:size :lg :color "#a6e22e"})
```

## Components

### Button

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:variant` | `:primary \| :secondary \| :ghost \| :danger` | `:secondary` | Visual style |
| `:size` | `:sm \| :md \| :lg` | `:md` | Button size |
| `:disabled` | `boolean` | `false` | Disabled state |
| `:loading` | `boolean` | `false` | Shows spinner |
| `:full-width` | `boolean` | `false` | Full width |
| `:icon-start` | `Helix element` | - | Icon before text |
| `:icon-end` | `Helix element` | - | Icon after text |
| `:on-click` | `function` | - | Click handler |
| `:type` | `:button \| :submit \| :reset` | `:button` | Button type |

### Badge

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:variant` | `:default \| :success \| :warning \| :error \| :info` | `:default` | Color variant |

### Card

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:variant` | `:flat \| :elevated \| :outlined` | `:flat` | Visual style |
| `:padding` | `boolean \| number` | `true` | Padding |

### Input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:type` | `:text \| :password \| :email \| :number` | `:text` | Input type |
| `:size` | `:sm \| :md \| :lg` | `:md` | Input size |
| `:disabled` | `boolean` | `false` | Disabled state |
| `:error` | `boolean` | `false` | Error state |
| `:placeholder` | `string` | - | Placeholder text |

### Modal

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:open?` | `boolean` | `false` | Visibility |
| `:on-close` | `function` | - | Close callback |
| `:size` | `:sm \| :md \| :lg \| :full` | `:md` | Modal width |

### Progress

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:value` | `number` | `0` | Current value |
| `:max` | `number` | `100` | Maximum value |
| `:variant` | `:default \| :success \| :warning \| :error` | `:default` | Color |
| `:size` | `:sm \| :md \| :lg` | `:md` | Bar height |
| `:show-label` | `boolean` | `false` | Show percentage |

### Spinner

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:size` | `:sm \| :md \| :lg` | `:md` | Spinner size |
| `:color` | `string` | `"currentColor"` | CSS color |

### Tooltip

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `:text` | `string` | - | Tooltip content |
| `:position` | `:top \| :bottom \| :left \| :right` | `:top` | Position |

## Design Tokens

All components use consistent design tokens defined in `devel.ui.helix.tokens`:

- **Colors**: Monokai-based palette with semantic aliases
- **Typography**: Font sizes, weights, line heights
- **Spacing**: 4px base unit scale
- **Shadows**: Box shadow utilities
- **Motion**: Transitions and durations

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm watch

# Production release (optimized)
pnpm release
```

## License

GPL-3.0-or-later
